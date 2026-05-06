import fs from 'fs';
import path from 'path';
import readline from 'readline';

const COMPLIA_PUBLIC_PATH = path.resolve('compliagov-public/packages/public-react/src/regional');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const INDIVIDUAL_TABLE_HEADERS = [
  {
    systemName: 'applicationFormId',
    displayName: 'Application ID',
    sortBy: 'applicationFormId',
    isSortable: true,
    type: 'link'
  },
  {
    systemName: 'formProperties.genInfoFirstName,formProperties.genInfoLastName',
    displayName: 'Name',
    sortBy: '',
    isSortable: false,
    type: 'multivalue'
  },
  {
    systemName: 'status',
    displayName: 'Status',
    sortBy: 'status',
    isSortable: true,
    type: 'text'
  },
  {
    systemName: 'applicationType',
    displayName: 'Application Type',
    sortBy: 'applicationType',
    isSortable: true,
    type: 'applicationType'
  },
  {
    systemName: 'dateSubmitted',
    displayName: 'Submitted Date',
    sortBy: 'dateSubmitted',
    isSortable: true,
    type: 'date',
    defaultSort: true
  }
];

const BUSINESS_TABLE_HEADERS = [
  {
    systemName: 'applicationFormId',
    displayName: 'Application ID',
    sortBy: 'applicationFormId',
    isSortable: true,
    type: 'link'
  },
  {
    systemName: 'formProperties.genInfoEntityName',
    displayName: 'Name',
    sortBy: '',
    isSortable: false,
    type: 'text'
  },
  {
    systemName: 'status',
    displayName: 'Status',
    sortBy: 'status',
    isSortable: true,
    type: 'text'
  },
  {
    systemName: 'applicationType',
    displayName: 'Application Type',
    sortBy: 'applicationType',
    isSortable: true,
    type: 'applicationType'
  },
  {
    systemName: 'dateSubmitted',
    displayName: 'Submitted Date',
    sortBy: 'dateSubmitted',
    isSortable: true,
    type: 'date',
    defaultSort: true
  }
];

function getAvailableMarkets() {
  try {
    return fs.readdirSync(COMPLIA_PUBLIC_PATH).filter((dir) => {
      return fs.statSync(path.join(COMPLIA_PUBLIC_PATH, dir)).isDirectory();
    });
  } catch {
    return [];
  }
}

function loadCoreApplication(market) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'coreApplication.json');
  if (!fs.existsSync(filePath)) {
    console.log(`\n  No coreApplication.json found for "${market}". Creating new file.`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveCoreApplication(market, data) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'coreApplication.json');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`\n  Saved: ${filePath}`);
}

function loadLicenses(market) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'licenses.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveLicenses(market, data) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'licenses.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  Saved: ${filePath}`);
}

function loadNavigationConfig(market) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveNavigationConfig(market, data) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  Saved: ${filePath}`);
}

async function collectFees() {
  const fees = [];
  const addFees = await ask('\n  Add fees to this workflow? (y/n): ');
  if (addFees.toLowerCase() !== 'y') return fees;

  let addMore = true;
  while (addMore) {
    const description = await ask('    Fee description (e.g. "Application Fee"): ');
    const amount = await ask('    Fee amount (e.g. "$100.00"): ');
    fees.push({ description, amount });
    const more = await ask('    Add another fee? (y/n): ');
    addMore = more.toLowerCase() === 'y';
  }
  return fees;
}

async function collectCustomTableHeaders(defaults) {
  const customize = await ask('\n  Customize table headers? (y/n, default: n): ');
  if (customize.toLowerCase() !== 'y') return defaults;

  const nameField = await ask('    Name field systemName (e.g. "formProperties.genInfoEntityName"): ');
  if (nameField) {
    const nameHeader = defaults.find((h) => h.displayName === 'Name');
    if (nameHeader) {
      nameHeader.systemName = nameField;
      if (nameField.includes(',')) {
        nameHeader.type = 'multivalue';
      } else {
        nameHeader.type = 'text';
      }
    }
  }
  return defaults;
}

async function buildPrimaryWorkflow(market) {
  console.log('\n--- Primary Workflow Configuration ---\n');

  const statePrefix = market.toUpperCase().replace('-', '-');
  const workflowSuffix = await ask(`  Workflow suffix (e.g. NBL, NPA, NIL, NFL): `);
  const applicationType = `${statePrefix}-${workflowSuffix.toUpperCase()}`;

  const displayName = await ask(`  Display name (e.g. "New Business License"): `);

  console.log('\n  Workflow type:');
  console.log('    1. Individual (uses firstName + lastName)');
  console.log('    2. Business (uses entityName)');
  const typeChoice = await ask('  Choose (1/2): ');

  const isIndividual = typeChoice === '1';
  const tableHeaders = JSON.parse(
    JSON.stringify(isIndividual ? INDIVIDUAL_TABLE_HEADERS : BUSINESS_TABLE_HEADERS)
  );

  const customHeaders = await collectCustomTableHeaders(tableHeaders);
  const fees = await collectFees();

  const mailPaymentMsg = await ask('\n  Mail payment message (leave empty to skip): ');

  const workflow = {
    applicationType,
    saveOnCreate: true,
    cloneOnCreate: false,
    displayName,
    isLicense: true,
    submitAction: 'new',
    tableHeaders: customHeaders
  };

  if (fees.length > 0) workflow.fees = fees;
  if (mailPaymentMsg) workflow.mailPaymentMessage = mailPaymentMsg;

  return workflow;
}

async function configureLicenses(market, applicationType) {
  console.log('\n--- licenses.json Configuration ---\n');

  const licenses = loadLicenses(market);
  if (!licenses) {
    console.log('  licenses.json not found for this market. Skipping.');
    return;
  }

  console.log('  Current subTypes in licenses.json:');
  if (licenses.subTypes && licenses.subTypes.length > 0) {
    licenses.subTypes.forEach((st, i) => {
      console.log(`    ${i + 1}. ${st.key} (${st.type}) - allowedWhen: [${st.allowedWhen.join(', ')}]`);
    });
  } else {
    console.log('    (none)');
  }

  const addSubType = await ask(`\n  Add "${applicationType}" to subTypes? (y/n): `);
  if (addSubType.toLowerCase() !== 'y') return;

  console.log('  Workflow sub-type:');
  console.log('    1. update');
  console.log('    2. renew');
  const subTypeChoice = await ask('  Choose (1/2): ');
  const type = subTypeChoice === '2' ? 'renew' : 'update';

  console.log('\n  Available statuses: Approved, Deactivated, Expired');
  const allowedInput = await ask('  Allowed statuses (comma-separated, e.g. "Approved,Expired"): ');
  const allowedWhen = allowedInput.split(',').map((s) => s.trim()).filter(Boolean);

  if (!licenses.subTypes) licenses.subTypes = [];

  const existingIdx = licenses.subTypes.findIndex((st) => st.key === applicationType);
  const entry = { key: applicationType, type, allowedWhen };

  if (existingIdx !== -1) {
    const overwrite = await ask(`  "${applicationType}" already exists in subTypes. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() === 'y') {
      licenses.subTypes[existingIdx] = entry;
    }
  } else {
    licenses.subTypes.push(entry);
  }

  saveLicenses(market, licenses);
  console.log(`  Added "${applicationType}" to licenses.json subTypes.`);
}

async function configureNavigation(market, applicationType) {
  console.log('\n--- navigation.config.json Configuration ---\n');

  const navConfig = loadNavigationConfig(market);
  if (!navConfig) {
    console.log('  navigation.config.json not found for this market. Skipping.');
    return;
  }

  const invoiceItem = navConfig.items?.find((item) => item.systemName === 'openInvoices');
  if (!invoiceItem) {
    console.log('  No "openInvoices" nav item found. Skipping payment options config.');
    return;
  }

  console.log('  Current Invoice Actions:');
  (invoiceItem.invoiceActions || []).forEach((a) => console.log(`    - ${a.label} (${a.value})`));

  console.log('\n  Current Payment Options:');
  (invoiceItem.paymentOptions || []).forEach((p) => console.log(`    - ${p.label} (${p.value})`));

  console.log('\n  Current allowedPaymentOptions:');
  if (invoiceItem.allowedPaymentOptions) {
    Object.entries(invoiceItem.allowedPaymentOptions).forEach(([key, workflows]) => {
      console.log(`    ${key}: [${workflows.join(', ')}]`);
    });
  } else {
    console.log('    (none configured)');
  }

  const updateInvoiceActions = await ask('\n  Update invoice actions? (y/n): ');
  if (updateInvoiceActions.toLowerCase() === 'y') {
    const actions = [];
    let addMore = true;
    console.log('    Common actions: pay, dispute');
    while (addMore) {
      const value = await ask('    Action value (e.g. "pay"): ');
      const label = await ask('    Action label (e.g. "Pay"): ');
      actions.push({ value, label });
      const more = await ask('    Add another action? (y/n): ');
      addMore = more.toLowerCase() === 'y';
    }
    invoiceItem.invoiceActions = actions;
  }

  const updatePaymentOpts = await ask('\n  Update payment options? (y/n): ');
  if (updatePaymentOpts.toLowerCase() === 'y') {
    const options = [];
    let addMore = true;
    console.log('    Common options: online (Credit Card/ACH), MailPayment');
    while (addMore) {
      const value = await ask('    Option value (e.g. "online" or "MailPayment"): ');
      const label = await ask('    Option label (e.g. "Credit Card / ACH"): ');
      const icon = await ask('    Icon (e.g. "fa-credit-card", leave empty to skip): ');
      const opt = { label, value };
      if (icon) opt.icon = icon;
      options.push(opt);
      const more = await ask('    Add another option? (y/n): ');
      addMore = more.toLowerCase() === 'y';
    }
    invoiceItem.paymentOptions = options;
  }

  const updateAllowed = await ask(`\n  Add "${applicationType}" to allowedPaymentOptions? (y/n): `);
  if (updateAllowed.toLowerCase() === 'y') {
    if (!invoiceItem.allowedPaymentOptions) invoiceItem.allowedPaymentOptions = {};

    console.log('    Payment method keys: mailPayment, onlinePayment');
    let addMore = true;
    while (addMore) {
      const key = await ask('    Payment method key (e.g. "mailPayment"): ');
      if (!invoiceItem.allowedPaymentOptions[key]) {
        invoiceItem.allowedPaymentOptions[key] = [];
      }
      if (!invoiceItem.allowedPaymentOptions[key].includes(applicationType)) {
        invoiceItem.allowedPaymentOptions[key].push(applicationType);
        console.log(`    Added "${applicationType}" to ${key}.`);
      } else {
        console.log(`    "${applicationType}" already in ${key}.`);
      }
      const more = await ask('    Add to another payment method? (y/n): ');
      addMore = more.toLowerCase() === 'y';
    }
  }

  saveNavigationConfig(market, navConfig);
  console.log('  navigation.config.json updated.');
}

async function buildSecondaryWorkflow(market) {
  console.log('\n--- Secondary Workflow Configuration ---\n');

  const statePrefix = market.toUpperCase().replace('-', '-');
  const workflowSuffix = await ask(`  Workflow suffix (e.g. UBL, RBL, UIL): `);
  const applicationType = `${statePrefix}-${workflowSuffix.toUpperCase()}`;

  const displayName = await ask(`  Display name (e.g. "Update Business License"): `);

  console.log('\n  Workflow type:');
  console.log('    1. Individual (uses firstName + lastName)');
  console.log('    2. Business (uses entityName)');
  const typeChoice = await ask('  Choose (1/2): ');

  const isIndividual = typeChoice === '1';
  const tableHeaders = JSON.parse(
    JSON.stringify(isIndividual ? INDIVIDUAL_TABLE_HEADERS : BUSINESS_TABLE_HEADERS)
  );

  const customHeaders = await collectCustomTableHeaders(tableHeaders);

  const systemNameField = await ask(
    '\n  SystemName for cloning (e.g. "formProperties.genInfoEntityName"): '
  );

  const requiredKeysInput = await ask(
    '  Required keys for cloning (comma-separated, e.g. "genInfoBusinessLicNo"): '
  );
  const requiredKeysForCloning = requiredKeysInput
    ? requiredKeysInput.split(',').map((k) => k.trim())
    : [];

  const fees = await collectFees();

  const workflow = {
    applicationType,
    saveOnCreate: false,
    cloneOnCreate: true,
    displayName,
    isLicense: false,
    submitAction: 'new',
    tableHeaders: customHeaders
  };

  if (systemNameField) workflow.systemName = systemNameField;
  if (requiredKeysForCloning.length > 0) workflow.requiredKeysForCloning = requiredKeysForCloning;
  if (fees.length > 0) workflow.fees = fees;

  return workflow;
}

async function main() {
  console.log('\n====================================');
  console.log('  Green Workflow Setup Automation');
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

  console.log(`\nSelected market: ${market}`);

  const coreApp = loadCoreApplication(market);
  if (coreApp) {
    console.log(`\n  Existing workflows in ${market}:`);
    coreApp.applications.forEach((app, i) => {
      console.log(`    ${i + 1}. ${app.applicationType} - ${app.displayName}`);
    });
  }

  console.log('\n  What would you like to do?');
  console.log('    1. Add a new PRIMARY workflow (saveOnCreate: true, cloneOnCreate: false)');
  console.log('    2. Add a new SECONDARY workflow (saveOnCreate: false, cloneOnCreate: true)');
  console.log('    3. Update an existing workflow');
  const action = await ask('  Choose (1/2/3): ');

  if (action === '1') {
    const workflow = await buildPrimaryWorkflow(market);

    if (!coreApp) {
      console.log('\n  Cannot add workflow - coreApplication.json does not exist.');
      console.log('  Please create the base file first with officeInfo, aliases, etc.');
      rl.close();
      return;
    }

    const existing = coreApp.applications.findIndex(
      (a) => a.applicationType === workflow.applicationType
    );
    if (existing !== -1) {
      const overwrite = await ask(
        `\n  "${workflow.applicationType}" already exists. Overwrite? (y/n): `
      );
      if (overwrite.toLowerCase() === 'y') {
        coreApp.applications[existing] = workflow;
      } else {
        console.log('  Skipped.');
        rl.close();
        return;
      }
    } else {
      coreApp.applications.push(workflow);
    }

    saveCoreApplication(market, coreApp);
    console.log(`\n  Primary workflow "${workflow.applicationType}" added successfully!`);
  } else if (action === '2') {
    const workflow = await buildSecondaryWorkflow(market);

    if (!coreApp) {
      console.log('\n  Cannot add workflow - coreApplication.json does not exist.');
      rl.close();
      return;
    }

    const existing = coreApp.applications.findIndex(
      (a) => a.applicationType === workflow.applicationType
    );
    if (existing !== -1) {
      const overwrite = await ask(
        `\n  "${workflow.applicationType}" already exists. Overwrite? (y/n): `
      );
      if (overwrite.toLowerCase() === 'y') {
        coreApp.applications[existing] = workflow;
      } else {
        console.log('  Skipped.');
        rl.close();
        return;
      }
    } else {
      coreApp.applications.push(workflow);
    }

    saveCoreApplication(market, coreApp);
    console.log(`\n  Secondary workflow "${workflow.applicationType}" added successfully!`);

    await configureLicenses(market, workflow.applicationType);
    await configureNavigation(market, workflow.applicationType);
  } else if (action === '3') {
    if (!coreApp || coreApp.applications.length === 0) {
      console.log('\n  No existing workflows to update.');
      rl.close();
      return;
    }

    const appChoice = await ask('  Enter workflow number to update: ');
    const appIndex = parseInt(appChoice) - 1;
    if (appIndex < 0 || appIndex >= coreApp.applications.length) {
      console.log('  Invalid selection.');
      rl.close();
      return;
    }

    const existingWorkflow = coreApp.applications[appIndex];
    console.log(`\n  Updating: ${existingWorkflow.applicationType}`);
    console.log(`  Current config:`);
    console.log(`    displayName: ${existingWorkflow.displayName}`);
    console.log(`    saveOnCreate: ${existingWorkflow.saveOnCreate}`);
    console.log(`    cloneOnCreate: ${existingWorkflow.cloneOnCreate}`);
    console.log(`    isLicense: ${existingWorkflow.isLicense}`);

    const newDisplayName = await ask(`\n  New display name (enter to keep "${existingWorkflow.displayName}"): `);
    if (newDisplayName) existingWorkflow.displayName = newDisplayName;

    const newSaveOnCreate = await ask(`  saveOnCreate (true/false, enter to keep "${existingWorkflow.saveOnCreate}"): `);
    if (newSaveOnCreate) existingWorkflow.saveOnCreate = newSaveOnCreate === 'true';

    const newCloneOnCreate = await ask(`  cloneOnCreate (true/false, enter to keep "${existingWorkflow.cloneOnCreate}"): `);
    if (newCloneOnCreate) existingWorkflow.cloneOnCreate = newCloneOnCreate === 'true';

    const newIsLicense = await ask(`  isLicense (true/false, enter to keep "${existingWorkflow.isLicense}"): `);
    if (newIsLicense) existingWorkflow.isLicense = newIsLicense === 'true';

    const updateFees = await ask('  Update fees? (y/n): ');
    if (updateFees.toLowerCase() === 'y') {
      existingWorkflow.fees = await collectFees();
      if (existingWorkflow.fees.length === 0) delete existingWorkflow.fees;
    }

    coreApp.applications[appIndex] = existingWorkflow;
    saveCoreApplication(market, coreApp);
    console.log(`\n  Workflow "${existingWorkflow.applicationType}" updated successfully!`);
  }

  console.log('\n  Done!\n');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});
