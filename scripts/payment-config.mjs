import fs from 'fs';
import path from 'path';

const SERVER_CONFIG_PATH = path.resolve('compliagov-public/packages/server/config/env');

function getConfigPath(market) {
  return path.join(SERVER_CONFIG_PATH, market, `${market}.all.json`);
}

function loadConfig(market) {
  const filePath = getConfigPath(market);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config not found for market "${market}" at: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveConfig(market, data) {
  const filePath = getConfigPath(market);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function addFee(config) {
  const { market, feeKey, description, sku, amount, filters, overwrite = false } = config;

  const data = loadConfig(market);
  if (!data.feeMap) data.feeMap = {};
  if (!data.feeMap.applicationform) data.feeMap.applicationform = {};

  if (data.feeMap.applicationform[feeKey] && !overwrite) {
    throw new Error(`Fee "${feeKey}" already exists. Set overwrite: true to replace.`);
  }

  data.feeMap.applicationform[feeKey] = { description, sku, amount, filters };
  const savedPath = saveConfig(market, data);
  return { feeKey, savedPath };
}

export function removeFee(config) {
  const { market, feeKey } = config;

  const data = loadConfig(market);
  if (!data.feeMap?.applicationform?.[feeKey]) {
    throw new Error(`Fee "${feeKey}" not found in market "${market}".`);
  }

  delete data.feeMap.applicationform[feeKey];
  const savedPath = saveConfig(market, data);
  return { feeKey, savedPath };
}

export function listFees(market) {
  const data = loadConfig(market);
  if (!data.feeMap?.applicationform) return [];
  return Object.entries(data.feeMap.applicationform).map(([key, fee]) => ({
    feeKey: key,
    description: fee.description,
    sku: fee.sku,
    amount: fee.amount,
    filters: fee.filters
  }));
}

export function setupPaymentProvider(config) {
  const {
    market, stateCode, supportedPaymentMethods = ['CC', 'ACH'],
    serviceCode, merchantCode,
    urlTransactionBase = 'https://securecheckout-uat.cdc.nicusa.com'
  } = config;

  const data = loadConfig(market);
  if (!data.paymentProvider) data.paymentProvider = {};

  data.paymentProvider.nic = {
    name: 'nic',
    isDefaultPayment: true,
    isRedirect: true,
    sendPostbackFailureEmail: false,
    stateCode,
    supportedPaymentMethods,
    defaultConfig: { serviceCode, merchantCode },
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

  const savedPath = saveConfig(market, data);
  return { stateCode, savedPath };
}

export function addCustomServiceConfig(config) {
  const { market, workflowKey, serviceCode, merchantCode, generateLineItemsByCustomMethod = false, lateFee } = config;

  const data = loadConfig(market);
  if (!data.paymentProvider?.nic) {
    throw new Error('No NIC payment provider configured. Run setupPaymentProvider first.');
  }

  if (!data.paymentProvider.nic.customConfig) {
    data.paymentProvider.nic.customConfig = {};
  }

  const entry = {};
  if (serviceCode) entry.serviceCode = serviceCode;
  if (merchantCode) entry.merchantCode = merchantCode;
  if (generateLineItemsByCustomMethod) entry.generateLineItemsByCustomMethod = true;
  if (lateFee) entry.lateFee = lateFee;

  data.paymentProvider.nic.customConfig[workflowKey] = entry;
  const savedPath = saveConfig(market, data);
  return { workflowKey, savedPath };
}

export function getPaymentProvider(market) {
  const data = loadConfig(market);
  if (!data.paymentProvider?.nic) return null;
  const nic = data.paymentProvider.nic;
  return {
    stateCode: nic.stateCode,
    supportedPaymentMethods: nic.supportedPaymentMethods,
    serviceCode: nic.defaultConfig?.serviceCode,
    merchantCode: nic.defaultConfig?.merchantCode,
    customConfig: nic.customConfig || {},
    urlTransactionBase: nic.transactionHandle?.urlTransactionBase
  };
}

export function getAvailableMarkets() {
  return fs.readdirSync(SERVER_CONFIG_PATH).filter((dir) => {
    return fs.statSync(path.join(SERVER_CONFIG_PATH, dir)).isDirectory();
  });
}
