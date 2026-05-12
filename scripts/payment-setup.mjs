import fs from 'fs';
import path from 'path';
import readline from 'readline';

const SERVER_CONFIG_PATH = path.resolve('compliagov-public/packages/server/config/env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function getAvailableMarkets() {
  try {
    return fs.readdirSync(SERVER_CONFIG_PATH).filter((dir) => {
      return fs.statSync(path.join(SERVER_CONFIG_PATH, dir)).isDirectory();
    });
  } catch {
    return [];
  }
}

function getConfigPath(market) {
  return path.join(SERVER_CONFIG_PATH, market, `${market}.all.json`);
}

function loadConfig(market) {
  const filePath = getConfigPath(market);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveConfig(market, data) {
  const filePath = getConfigPath(market);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  Saved: ${filePath}`);
}

async function collectFilters() {
  const filters = [];
  let addMore = true;

  while (addMore) {
    console.log('\n    --- Filter ---');
    const applicationType = await ask('    Application type (e.g. "AR-DFA-NRIC"): ');
    const filter = { applicationType };

    const addFormProps = await ask('    Add formProperties filter? (y/n): ');
    if (addFormProps.toLowerCase() === 'y') {
      filter.formProperties = {};
      let addProp = true;
      while (addProp) {
        const key = await ask('      Property key (e.g. "genInfoLicenseType"): ');
        const value = await ask('      Property value (e.g. "employee" or "true" for boolean): ');
        filter.formProperties[key] = value === 'true' ? true : value === 'false' ? false : value;
        const moreProp = await ask('      Add another property? (y/n): ');
        addProp = moreProp.toLowerCase() === 'y';
      }
    }

    filters.push(filter);
    const more = await ask('    Add another filter? (y/n): ');
    addMore = more.toLowerCase() === 'y';
  }

  return filters;
}

async function addFee(config) {
  console.log('\n--- Add Fee Entry ---\n');

  if (!config.feeMap) config.feeMap = {};
  if (!config.feeMap.applicationform) config.feeMap.applicationform = {};

  const feeKey = await ask('  Fee key (unique ID, e.g. "EMPL_App_Fee-1"): ');
  const description = await ask('  Description (e.g. "Employee Fee"): ');
  const sku = await ask('  SKU (e.g. "EMPL_App_Fee"): ');
  const amountStr = await ask('  Amount (number, e.g. 25): ');
  const amount = parseFloat(amountStr);

  console.log('\n  Configure filters (determines when this fee applies):');
  const filters = await collectFilters();

  const fee = { description, sku, amount, filters };

  if (config.feeMap.applicationform[feeKey]) {
    const overwrite = await ask(`\n  "${feeKey}" already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('  Skipped.');
      return config;
    }
  }

  config.feeMap.applicationform[feeKey] = fee;
  console.log(`\n  Fee "${feeKey}" added.`);
  return config;
}

async function setupPaymentProvider(config) {
  console.log('\n--- Payment Provider Setup ---\n');

  if (!config.paymentProvider) config.paymentProvider = {};

  const hasNic = config.paymentProvider.nic;
  if (hasNic) {
    console.log('  Existing NIC payment provider found:');
    console.log(`    State Code: ${hasNic.stateCode}`);
    console.log(`    Service Code: ${hasNic.defaultConfig?.serviceCode}`);
    console.log(`    Merchant Code: ${hasNic.defaultConfig?.merchantCode}`);
    console.log(`    Payment Methods: ${hasNic.supportedPaymentMethods?.join(', ')}`);

    const update = await ask('\n  Update payment provider config? (y/n): ');
    if (update.toLowerCase() !== 'y') return config;
  }

  const stateCode = await ask('  State code (e.g. "AR", "HI", "AL"): ');

  console.log('  Supported payment methods:');
  console.log('    1. CC only');
  console.log('    2. CC + ACH');
  const methodChoice = await ask('  Choose (1/2): ');
  const supportedPaymentMethods = methodChoice === '2' ? ['CC', 'ACH'] : ['CC'];

  const serviceCode = await ask('  Default service code (e.g. "dfa_medicalmjagent"): ');
  const merchantCode = await ask('  Default merchant code (e.g. "ArkansasDFA"): ');

  console.log('\n  Transaction base URL:');
  console.log('    1. UAT: https://securecheckout-uat.cdc.nicusa.com');
  console.log('    2. Production: https://securecheckout.cdc.nicusa.com');
  console.log('    3. Custom');
  const urlChoice = await ask('  Choose (1/2/3): ');
  let urlTransactionBase;
  if (urlChoice === '1') urlTransactionBase = 'https://securecheckout-uat.cdc.nicusa.com';
  else if (urlChoice === '2') urlTransactionBase = 'https://securecheckout.cdc.nicusa.com';
  else urlTransactionBase = await ask('  Enter custom URL: ');

  config.paymentProvider.nic = {
    name: 'nic',
    isDefaultPayment: true,
    isRedirect: true,
    sendPostbackFailureEmail: false,
    stateCode,
    supportedPaymentMethods,
    defaultConfig: {
      serviceCode,
      merchantCode
    },
    postHandle: {
      urlSuccessPost: ':baseUrl/api/payments/:transactionTypeBase/:type/:id/payment-status?status=2',
      urlFailPost: ':baseUrl/api/payments/:transactionTypeBase/:type/:id/payment-status?status=1',
      urlCancelPost: ':baseUrl/api/payments/:transactionTypeBase/:type/:id/payment-status?status=0',
      urlDuplicatePost: ':baseUrl/api/payments/:transactionTypeBase/:type/:id/payment-status?status=1',
      urlSilentPost: ':apiBaseUrl/v1/payments/nic/:transactionType/:id/send'
    },
    transactionHandle: {
      urlTransactionBase,
      urlOpenTransaction: ':urlTransactionBase/ccprest/api/v1/:stateCode/tokens',
      urlGetTransaction: ':urlTransactionBase/ccprest/api/v1/:stateCode/tokens/:token',
      urlInvalidateToken: ':urlTransactionBase/ccprest/api/v2/:stateCode/tokens/:token',
      redirectUrl: ':urlTransactionBase/Checkout/Payment?token=:token'
    },
    postUrlConfig: {
      applicationform: {
        transactionTypeBase: { isLookup: false, value: 'application-forms' },
        transactionType: { isLookup: false, value: 'applicationform' },
        type: { isLookup: true, location: 'doc', value: 'applicationType' },
        id: { isLookup: true, location: 'doc', value: '_id' },
        baseUrl: { isLookup: true, location: 'config', value: 'install.baseUrl' },
        apiBaseUrl: { isLookup: true, location: 'config', value: 'apiGateway.baseUrl' },
        stateCode: { isLookup: true, location: 'config', value: 'paymentProvider.nic.stateCode' },
        urlTransactionBase: { isLookup: true, location: 'config', value: 'paymentProvider.nic.transactionHandle.urlTransactionBase' },
        token: { isLookup: true, location: 'local', value: 'token' }
      },
      invoice: {
        transactionTypeBase: { isLookup: false, value: 'invoices' },
        transactionType: { isLookup: false, value: 'invoice' },
        type: { isLookup: true, location: 'doc', value: 'type' },
        id: { isLookup: true, location: 'doc', value: 'invoiceId' },
        baseUrl: { isLookup: true, location: 'config', value: 'install.baseUrl' },
        apiBaseUrl: { isLookup: true, location: 'config', value: 'apiGateway.baseUrl' },
        stateCode: { isLookup: true, location: 'config', value: 'paymentProvider.nic.stateCode' },
        urlTransactionBase: { isLookup: true, location: 'config', value: 'paymentProvider.nic.transactionHandle.urlTransactionBase' },
        token: { isLookup: true, location: 'local', value: 'token' }
      }
    }
  };

  console.log('\n  Payment provider configured.');
  return config;
}

async function addCustomConfig(config) {
  console.log('\n--- Add Custom Config (per-workflow override) ---\n');

  if (!config.paymentProvider?.nic) {
    console.log('  No NIC payment provider found. Set up payment provider first.');
    return config;
  }

  if (!config.paymentProvider.nic.customConfig) {
    config.paymentProvider.nic.customConfig = {};
  }

  const existing = Object.keys(config.paymentProvider.nic.customConfig);
  if (existing.length > 0) {
    console.log('  Existing custom configs:');
    existing.forEach((k) => console.log(`    - ${k}`));
  }

  const workflowKey = await ask('  Workflow key (lowercase, e.g. "hi-doh-ncr"): ');

  const customEntry = {};
  const serviceCode = await ask('  Custom service code (leave empty to skip): ');
  if (serviceCode) customEntry.serviceCode = serviceCode;

  const merchantCode = await ask('  Custom merchant code (leave empty to skip): ');
  if (merchantCode) customEntry.merchantCode = merchantCode;

  const generateCustom = await ask('  Generate line items by custom method? (y/n): ');
  if (generateCustom.toLowerCase() === 'y') {
    customEntry.generateLineItemsByCustomMethod = true;

    const addLateFee = await ask('  Add late fee config? (y/n): ');
    if (addLateFee.toLowerCase() === 'y') {
      const desc = await ask('    Late fee description: ');
      const sku = await ask('    Late fee SKU: ');
      const amt = await ask('    Late fee amount: ');
      customEntry.lateFee = { description: desc, sku, amount: parseFloat(amt) };
    }
  }

  config.paymentProvider.nic.customConfig[workflowKey] = customEntry;
  console.log(`\n  Custom config for "${workflowKey}" added.`);
  return config;
}

async function viewCurrentConfig(config, market) {
  console.log(`\n--- Current Payment Config for ${market} ---\n`);

  if (config.feeMap?.applicationform) {
    const fees = Object.entries(config.feeMap.applicationform);
    console.log(`  Fees (${fees.length}):`);
    fees.forEach(([key, fee]) => {
      const types = fee.filters.map((f) => f.applicationType).join(', ');
      console.log(`    ${key}: $${fee.amount} - ${fee.description} [${types}]`);
    });
  } else {
    console.log('  No fees configured.');
  }

  if (config.paymentProvider?.nic) {
    const nic = config.paymentProvider.nic;
    console.log(`\n  Payment Provider:`);
    console.log(`    State: ${nic.stateCode}`);
    console.log(`    Methods: ${nic.supportedPaymentMethods?.join(', ')}`);
    console.log(`    Service Code: ${nic.defaultConfig?.serviceCode}`);
    console.log(`    Merchant Code: ${nic.defaultConfig?.merchantCode}`);
    if (nic.customConfig) {
      console.log(`    Custom Configs: ${Object.keys(nic.customConfig).join(', ')}`);
    }
  } else {
    console.log('\n  No payment provider configured.');
  }
}

async function main() {
  console.log('\n====================================');
  console.log('  Payment Setup Automation');
  console.log('====================================\n');

  const markets = getAvailableMarkets();
  if (markets.length === 0) {
    console.log('No markets found. Ensure compliagov-public is cloned in this directory.');
    rl.close();
    return;
  }

  console.log('Available markets:');
  markets.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));

  const marketChoice = await ask('\nSelect market (number or name): ');
  const market = /^\d+$/.test(marketChoice) ? markets[parseInt(marketChoice) - 1] : marketChoice;

  if (!markets.includes(market)) {
    console.log(`Market "${market}" not found.`);
    rl.close();
    return;
  }

  let config = loadConfig(market);
  if (!config) {
    console.log(`\n  No ${market}.all.json found. Creating new config file.`);
    config = {};
  }

  let running = true;
  while (running) {
    console.log(`\n  --- ${market} Payment Setup ---`);
    console.log('    1. View current payment config');
    console.log('    2. Add a fee entry');
    console.log('    3. Setup/update payment provider (NIC)');
    console.log('    4. Add custom config (per-workflow override)');
    console.log('    5. Remove a fee entry');
    console.log('    6. Save and exit');
    console.log('    7. Exit without saving');

    const action = await ask('\n  Choose: ');

    switch (action) {
      case '1':
        await viewCurrentConfig(config, market);
        break;
      case '2':
        config = await addFee(config);
        break;
      case '3':
        config = await setupPaymentProvider(config);
        break;
      case '4':
        config = await addCustomConfig(config);
        break;
      case '5': {
        if (!config.feeMap?.applicationform) {
          console.log('\n  No fees to remove.');
          break;
        }
        const fees = Object.keys(config.feeMap.applicationform);
        console.log('\n  Current fees:');
        fees.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
        const removeChoice = await ask('  Enter number to remove: ');
        const removeIdx = parseInt(removeChoice) - 1;
        if (removeIdx >= 0 && removeIdx < fees.length) {
          const key = fees[removeIdx];
          delete config.feeMap.applicationform[key];
          console.log(`  Removed "${key}".`);
        } else {
          console.log('  Invalid selection.');
        }
        break;
      }
      case '6':
        saveConfig(market, config);
        running = false;
        break;
      case '7':
        console.log('  Exiting without saving.');
        running = false;
        break;
      default:
        console.log('  Invalid choice.');
    }
  }

  console.log('\n  Done!\n');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});
