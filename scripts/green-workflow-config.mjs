import fs from 'fs';
import path from 'path';

const COMPLIA_PUBLIC_PATH = path.resolve('compliagov-public/packages/public-react/src/regional');

/**
 * Non-interactive workflow configuration.
 * Import this module and call addPrimaryWorkflow() or addSecondaryWorkflow()
 * with a config object.
 *
 * Usage:
 *   import { addPrimaryWorkflow, addSecondaryWorkflow } from './green-workflow-config.mjs';
 *
 *   addPrimaryWorkflow({
 *     market: 'hi-doh',
 *     workflowSuffix: 'NBL',
 *     displayName: 'New Business License',
 *     type: 'business',         // 'individual' or 'business'
 *     nameField: 'formProperties.genInfoEntityName',  // optional override
 *     fees: [{ description: 'Application Fee', amount: '$100.00' }],  // optional
 *     mailPaymentMessage: '',   // optional
 *   });
 */

const INDIVIDUAL_TABLE_HEADERS = [
  { systemName: 'applicationFormId', displayName: 'Application ID', sortBy: 'applicationFormId', isSortable: true, type: 'link' },
  { systemName: 'formProperties.genInfoFirstName,formProperties.genInfoLastName', displayName: 'Name', sortBy: '', isSortable: false, type: 'multivalue' },
  { systemName: 'status', displayName: 'Status', sortBy: 'status', isSortable: true, type: 'text' },
  { systemName: 'applicationType', displayName: 'Application Type', sortBy: 'applicationType', isSortable: true, type: 'applicationType' },
  { systemName: 'dateSubmitted', displayName: 'Submitted Date', sortBy: 'dateSubmitted', isSortable: true, type: 'date', defaultSort: true }
];

const BUSINESS_TABLE_HEADERS = [
  { systemName: 'applicationFormId', displayName: 'Application ID', sortBy: 'applicationFormId', isSortable: true, type: 'link' },
  { systemName: 'formProperties.genInfoEntityName', displayName: 'Name', sortBy: '', isSortable: false, type: 'text' },
  { systemName: 'status', displayName: 'Status', sortBy: 'status', isSortable: true, type: 'text' },
  { systemName: 'applicationType', displayName: 'Application Type', sortBy: 'applicationType', isSortable: true, type: 'applicationType' },
  { systemName: 'dateSubmitted', displayName: 'Submitted Date', sortBy: 'dateSubmitted', isSortable: true, type: 'date', defaultSort: true }
];

function getCoreAppPath(market) {
  return path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'coreApplication.json');
}

function loadCoreApp(market) {
  const filePath = getCoreAppPath(market);
  if (!fs.existsSync(filePath)) {
    throw new Error(`coreApplication.json not found for market "${market}" at: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveCoreApp(market, data) {
  const filePath = getCoreAppPath(market);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  return filePath;
}

function buildTableHeaders(config) {
  const isIndividual = config.type === 'individual';
  const headers = JSON.parse(JSON.stringify(isIndividual ? INDIVIDUAL_TABLE_HEADERS : BUSINESS_TABLE_HEADERS));

  if (config.nameField) {
    const nameHeader = headers.find((h) => h.displayName === 'Name');
    if (nameHeader) {
      nameHeader.systemName = config.nameField;
      nameHeader.type = config.nameField.includes(',') ? 'multivalue' : 'text';
    }
  }

  return headers;
}

export function addPrimaryWorkflow(config) {
  const { market, workflowSuffix, displayName, type = 'business', nameField, fees, mailPaymentMessage, overwrite = false } = config;

  const coreApp = loadCoreApp(market);
  const applicationType = `${market.toUpperCase()}-${workflowSuffix.toUpperCase()}`;

  const workflow = {
    applicationType,
    saveOnCreate: true,
    cloneOnCreate: false,
    displayName,
    isLicense: true,
    submitAction: 'new',
    tableHeaders: buildTableHeaders({ type, nameField })
  };

  if (fees && fees.length > 0) workflow.fees = fees;
  if (mailPaymentMessage) workflow.mailPaymentMessage = mailPaymentMessage;

  const existingIndex = coreApp.applications.findIndex((a) => a.applicationType === applicationType);
  if (existingIndex !== -1) {
    if (!overwrite) {
      throw new Error(`Workflow "${applicationType}" already exists. Set overwrite: true to replace.`);
    }
    coreApp.applications[existingIndex] = workflow;
  } else {
    coreApp.applications.push(workflow);
  }

  const savedPath = saveCoreApp(market, coreApp);
  return { applicationType, savedPath, workflow };
}

export function addSecondaryWorkflow(config) {
  const {
    market, workflowSuffix, displayName, type = 'business', nameField,
    systemName, requiredKeysForCloning = [], fees, overwrite = false
  } = config;

  const coreApp = loadCoreApp(market);
  const applicationType = `${market.toUpperCase()}-${workflowSuffix.toUpperCase()}`;

  const workflow = {
    applicationType,
    saveOnCreate: false,
    cloneOnCreate: true,
    displayName,
    isLicense: false,
    submitAction: 'new',
    tableHeaders: buildTableHeaders({ type, nameField })
  };

  if (systemName) workflow.systemName = systemName;
  if (requiredKeysForCloning.length > 0) workflow.requiredKeysForCloning = requiredKeysForCloning;
  if (fees && fees.length > 0) workflow.fees = fees;

  const existingIndex = coreApp.applications.findIndex((a) => a.applicationType === applicationType);
  if (existingIndex !== -1) {
    if (!overwrite) {
      throw new Error(`Workflow "${applicationType}" already exists. Set overwrite: true to replace.`);
    }
    coreApp.applications[existingIndex] = workflow;
  } else {
    coreApp.applications.push(workflow);
  }

  const savedPath = saveCoreApp(market, coreApp);
  return { applicationType, savedPath, workflow };
}

export function addLicenseSubType(config) {
  const { market, applicationType, type = 'update', allowedWhen = ['Approved'], overwrite = false } = config;

  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'licenses.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`licenses.json not found for market "${market}" at: ${filePath}`);
  }

  const licenses = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!licenses.subTypes) licenses.subTypes = [];

  const entry = { key: applicationType, type, allowedWhen };
  const existingIdx = licenses.subTypes.findIndex((st) => st.key === applicationType);

  if (existingIdx !== -1) {
    if (!overwrite) {
      throw new Error(`SubType "${applicationType}" already exists in licenses.json. Set overwrite: true to replace.`);
    }
    licenses.subTypes[existingIdx] = entry;
  } else {
    licenses.subTypes.push(entry);
  }

  fs.writeFileSync(filePath, JSON.stringify(licenses, null, 2) + '\n', 'utf-8');
  return { applicationType, type, allowedWhen, savedPath: filePath };
}

export function addAllowedPaymentOption(config) {
  const { market, applicationType, paymentMethod = 'mailPayment' } = config;

  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`navigation.config.json not found for market "${market}" at: ${filePath}`);
  }

  const navConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const invoiceItem = navConfig.items?.find((item) => item.systemName === 'openInvoices');

  if (!invoiceItem) {
    throw new Error('No "openInvoices" nav item found in navigation.config.json.');
  }

  if (!invoiceItem.allowedPaymentOptions) invoiceItem.allowedPaymentOptions = {};
  if (!invoiceItem.allowedPaymentOptions[paymentMethod]) {
    invoiceItem.allowedPaymentOptions[paymentMethod] = [];
  }

  if (!invoiceItem.allowedPaymentOptions[paymentMethod].includes(applicationType)) {
    invoiceItem.allowedPaymentOptions[paymentMethod].push(applicationType);
  }

  fs.writeFileSync(filePath, JSON.stringify(navConfig, null, 2) + '\n', 'utf-8');
  return { applicationType, paymentMethod, savedPath: filePath };
}

export function updateInvoiceActions(config) {
  const { market, actions } = config;

  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`navigation.config.json not found for market "${market}" at: ${filePath}`);
  }

  const navConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const invoiceItem = navConfig.items?.find((item) => item.systemName === 'openInvoices');

  if (!invoiceItem) {
    throw new Error('No "openInvoices" nav item found in navigation.config.json.');
  }

  invoiceItem.invoiceActions = actions;
  fs.writeFileSync(filePath, JSON.stringify(navConfig, null, 2) + '\n', 'utf-8');
  return { actions, savedPath: filePath };
}

export function updatePaymentOptions(config) {
  const { market, options } = config;

  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`navigation.config.json not found for market "${market}" at: ${filePath}`);
  }

  const navConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const invoiceItem = navConfig.items?.find((item) => item.systemName === 'openInvoices');

  if (!invoiceItem) {
    throw new Error('No "openInvoices" nav item found in navigation.config.json.');
  }

  invoiceItem.paymentOptions = options;
  fs.writeFileSync(filePath, JSON.stringify(navConfig, null, 2) + '\n', 'utf-8');
  return { options, savedPath: filePath };
}

export function listLicenseSubTypes(market) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'licenses.json');
  if (!fs.existsSync(filePath)) return [];
  const licenses = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return licenses.subTypes || [];
}

export function getNavigationPaymentConfig(market) {
  const filePath = path.join(COMPLIA_PUBLIC_PATH, market, 'config', 'navigation.config.json');
  if (!fs.existsSync(filePath)) return null;
  const navConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const invoiceItem = navConfig.items?.find((item) => item.systemName === 'openInvoices');
  if (!invoiceItem) return null;
  return {
    invoiceActions: invoiceItem.invoiceActions || [],
    paymentOptions: invoiceItem.paymentOptions || [],
    allowedPaymentOptions: invoiceItem.allowedPaymentOptions || {}
  };
}

export function listWorkflows(market) {
  const coreApp = loadCoreApp(market);
  return coreApp.applications.map((a) => ({
    applicationType: a.applicationType,
    displayName: a.displayName,
    saveOnCreate: a.saveOnCreate,
    cloneOnCreate: a.cloneOnCreate,
    isLicense: a.isLicense
  }));
}

export function removeWorkflow(market, applicationType) {
  const coreApp = loadCoreApp(market);
  const index = coreApp.applications.findIndex((a) => a.applicationType === applicationType);
  if (index === -1) {
    throw new Error(`Workflow "${applicationType}" not found in market "${market}".`);
  }
  const removed = coreApp.applications.splice(index, 1)[0];
  const savedPath = saveCoreApp(market, coreApp);
  return { removed, savedPath };
}

export function getAvailableMarkets() {
  return fs.readdirSync(COMPLIA_PUBLIC_PATH).filter((dir) => {
    return fs.statSync(path.join(COMPLIA_PUBLIC_PATH, dir)).isDirectory();
  });
}
