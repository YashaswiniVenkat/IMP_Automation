import fs from 'fs';
import path from 'path';

const WORKFLOWS_PATH = path.resolve('compliagov-public/packages/server/app/services/workflows');
const WORKFLOWS_JSON_PATH = path.resolve('compliagov-public/packages/server/app/__tests__/workflows/workflows.json');

const DEFAULT_ADDRESS_MAPPING = {
  address1: 'formProperties.physicalStreet',
  address2: 'formProperties.physicalUnitNoAptNo',
  city: 'formProperties.physicalCity',
  state: 'formProperties.physicalState',
  zipCode: 'formProperties.physicalZipCode'
};

function generateServiceFile(config) {
  const {
    parentApplicationType,
    licenseNumberField = 'genInfoLicenseNumber',
    titleFieldKey = 'formProperties.genInfoEntityName',
    titleFieldSeparator = '',
    addressMapping = DEFAULT_ADDRESS_MAPPING,
    performOpsBeforeCreatingApp = null,
    performCustomOperationDuringClone = null
  } = config;

  let content = '';
  const needsAsync = performOpsBeforeCreatingApp?.includes('async') ||
    performCustomOperationDuringClone?.includes('async');

  if (needsAsync) {
    content += `const async = require("async");\n\n`;
  }

  content += `exports.canGeocode = false;\n\n`;

  content += `exports.workflowKeyMapping = {\n`;
  content += `  applicationForm: {\n`;
  content += `    addresses: {\n`;
  content += `      primary: {\n`;
  content += `        address1: "${addressMapping.address1}",\n`;
  content += `        address2: "${addressMapping.address2}",\n`;
  content += `        city: "${addressMapping.city}",\n`;
  content += `        state: "${addressMapping.state}",\n`;
  content += `        zipCode: "${addressMapping.zipCode}",\n`;
  content += `      },\n`;
  content += `    },\n`;
  content += `  },\n`;
  content += `};\n\n`;

  content += `exports.getTransactionIdentifiers = function (applicationFormDoc, token) {\n`;
  content += `  return [token];\n`;
  content += `};\n\n`;

  content += `exports.getParentApplicationType = function () {\n`;
  content += `  return "${parentApplicationType}";\n`;
  content += `};\n\n`;

  content += `exports.getLicenseNumber = function (record) {\n`;
  content += `  return record.formProperties.${licenseNumberField};\n`;
  content += `};\n\n`;

  content += `exports.getApplicationTitleField = function () {\n`;
  content += `  return {\n`;
  content += `    key: "${titleFieldKey}",\n`;
  content += `    separator: "${titleFieldSeparator}",\n`;
  content += `  };\n`;
  content += `};\n`;

  if (performOpsBeforeCreatingApp) {
    content += `\n${performOpsBeforeCreatingApp}\n`;
  }

  if (performCustomOperationDuringClone) {
    content += `\n${performCustomOperationDuringClone}\n`;
  }

  return content;
}

export function createSecondaryServiceFile(config) {
  const { market, workflowSuffix, overwrite = false, ...serviceConfig } = config;

  const fileName = `${market}-${workflowSuffix}.server.service.js`;
  const filePath = path.join(WORKFLOWS_PATH, fileName);

  if (fs.existsSync(filePath) && !overwrite) {
    throw new Error(`Service file "${fileName}" already exists. Set overwrite: true to replace.`);
  }

  const content = generateServiceFile(serviceConfig);
  fs.writeFileSync(filePath, content, 'utf-8');

  const workflowsJson = JSON.parse(fs.readFileSync(WORKFLOWS_JSON_PATH, 'utf-8'));
  if (!workflowsJson.workflows.includes(fileName)) {
    workflowsJson.workflows.push(fileName);
    fs.writeFileSync(WORKFLOWS_JSON_PATH, JSON.stringify(workflowsJson, null, 2) + '\n', 'utf-8');
  }

  return { fileName, filePath };
}

export function listServiceFiles(market) {
  const prefix = market ? `${market}-` : '';
  return fs.readdirSync(WORKFLOWS_PATH)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.server.service.js'))
    .map((f) => f.replace('.server.service.js', ''));
}

export function readServiceFile(market, workflowSuffix) {
  const fileName = `${market}-${workflowSuffix}.server.service.js`;
  const filePath = path.join(WORKFLOWS_PATH, fileName);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function isRegistered(market, workflowSuffix) {
  const fileName = `${market}-${workflowSuffix}.server.service.js`;
  const workflowsJson = JSON.parse(fs.readFileSync(WORKFLOWS_JSON_PATH, 'utf-8'));
  return workflowsJson.workflows.includes(fileName);
}

export function registerServiceFile(market, workflowSuffix) {
  const fileName = `${market}-${workflowSuffix}.server.service.js`;
  const workflowsJson = JSON.parse(fs.readFileSync(WORKFLOWS_JSON_PATH, 'utf-8'));
  if (!workflowsJson.workflows.includes(fileName)) {
    workflowsJson.workflows.push(fileName);
    fs.writeFileSync(WORKFLOWS_JSON_PATH, JSON.stringify(workflowsJson, null, 2) + '\n', 'utf-8');
  }
  return { fileName, registered: true };
}
