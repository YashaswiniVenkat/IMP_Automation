import fs from 'fs';
import path from 'path';
import readline from 'readline';

const WORKFLOWS_PATH = path.resolve('compliagov-public/packages/server/app/services/workflows');
const WORKFLOWS_JSON_PATH = path.resolve('compliagov-public/packages/server/app/__tests__/workflows/workflows.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function getExistingServiceFiles() {
  return fs.readdirSync(WORKFLOWS_PATH).filter((f) => f.endsWith('.server.service.js'));
}

function loadWorkflowsJson() {
  if (!fs.existsSync(WORKFLOWS_JSON_PATH)) return { workflows: [] };
  return JSON.parse(fs.readFileSync(WORKFLOWS_JSON_PATH, 'utf-8'));
}

function saveWorkflowsJson(data) {
  fs.writeFileSync(WORKFLOWS_JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  Saved: ${WORKFLOWS_JSON_PATH}`);
}

function generateSecondaryServiceFile(config) {
  const {
    parentApplicationType,
    licenseNumberField,
    titleFieldKey,
    titleFieldSeparator,
    addressMapping,
    performOpsLogic
  } = config;

  let content = '';

  if (performOpsLogic) {
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

  if (performOpsLogic) {
    content += `\n${performOpsLogic}\n`;
  }

  return content;
}

async function collectAddressMapping() {
  console.log('\n  Address mapping (form property keys):');
  console.log('    Common patterns:');
  console.log('      formProperties.physicalStreet');
  console.log('      formProperties.physicalUnitNoAptNo');
  console.log('      formProperties.physicalCity');
  console.log('      formProperties.physicalState');
  console.log('      formProperties.physicalZipCode');

  const useDefault = await ask('\n  Use default address mapping? (y/n): ');
  if (useDefault.toLowerCase() === 'y') {
    return {
      address1: 'formProperties.physicalStreet',
      address2: 'formProperties.physicalUnitNoAptNo',
      city: 'formProperties.physicalCity',
      state: 'formProperties.physicalState',
      zipCode: 'formProperties.physicalZipCode'
    };
  }

  const address1 = await ask('    address1 key: ');
  const address2 = await ask('    address2 key: ');
  const city = await ask('    city key: ');
  const state = await ask('    state key: ');
  const zipCode = await ask('    zipCode key: ');
  return { address1, address2, city, state, zipCode };
}

async function collectPerformOps() {
  const addOps = await ask('\n  Add performOpsBeforeCreatingApp logic? (y/n): ');
  if (addOps.toLowerCase() !== 'y') return null;

  console.log('\n  Common patterns:');
  console.log('    1. Enable form sections based on a flag');
  console.log('    2. Skip payment');
  console.log('    3. Custom (paste your own)');
  const choice = await ask('  Choose (1/2/3): ');

  if (choice === '1') {
    const flagField = await ask('    Flag field (e.g. "licInfoUpdateSomething"): ');
    const sectionsInput = await ask('    Sections to enable (comma-separated, e.g. "isContactInfoEnabled2,isPaymentInfoEnabled2"): ');
    const sections = sectionsInput.split(',').map((s) => s.trim());

    let logic = `exports.performOpsBeforeCreatingApp = function (data, identity, callback) {\n`;
    logic += `  const result = data.applicationForm;\n`;
    logic += `  if (result.formProperties.${flagField} === true) {\n`;
    sections.forEach((s) => {
      logic += `    result.formProperties.${s} = true;\n`;
    });
    logic += `  }\n`;
    logic += `  callback(null, result);\n`;
    logic += `};`;
    return logic;
  } else if (choice === '2') {
    let logic = `exports.performOpsBeforeCreatingApp = function (data, identity, callback) {\n`;
    logic += `  const result = data.applicationForm;\n`;
    logic += `  result.paymentMethod = "skipPayment";\n`;
    logic += `  callback(null, result);\n`;
    logic += `};`;
    return logic;
  } else {
    console.log('    Paste your function (end with an empty line):');
    let custom = '';
    let line = await ask('');
    while (line !== '') {
      custom += line + '\n';
      line = await ask('');
    }
    return custom.trim();
  }
}

async function main() {
  console.log('\n====================================');
  console.log('  Service File Setup Automation');
  console.log('====================================\n');

  console.log('  This creates secondary workflow service files.');
  console.log('  Path: compliagov-public/packages/server/app/services/workflows/\n');

  const market = await ask('  Market (e.g. "ar-dfa", "hi-doh", "mo"): ');
  const workflowSuffix = await ask('  Workflow suffix (e.g. "blu", "blr", "ricu"): ');
  const fileName = `${market}-${workflowSuffix}.server.service.js`;
  const filePath = path.join(WORKFLOWS_PATH, fileName);

  if (fs.existsSync(filePath)) {
    const overwrite = await ask(`\n  "${fileName}" already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('  Cancelled.');
      rl.close();
      return;
    }
  }

  const parentApplicationType = await ask('  Parent application type (e.g. "AR-DFA-NRIC", "HI-DOH-NBL"): ');
  const licenseNumberField = await ask('  License number field (default: "genInfoLicenseNumber"): ') || 'genInfoLicenseNumber';

  console.log('\n  Title field type:');
  console.log('    1. Single field (e.g. "formProperties.genInfoEntityName")');
  console.log('    2. Multiple fields (e.g. firstName + lastName)');
  const titleChoice = await ask('  Choose (1/2): ');

  let titleFieldKey, titleFieldSeparator;
  if (titleChoice === '2') {
    titleFieldKey = await ask('    Fields (comma-separated, e.g. "formProperties.genInfoFirstName,formProperties.genInfoLastName"): ');
    titleFieldSeparator = await ask('    Separator (e.g. " " for space, "" for none): ');
  } else {
    titleFieldKey = await ask('    Field key (e.g. "formProperties.genInfoEntityName"): ');
    titleFieldSeparator = '';
  }

  const addressMapping = await collectAddressMapping();
  const performOpsLogic = await collectPerformOps();

  const content = generateSecondaryServiceFile({
    parentApplicationType,
    licenseNumberField,
    titleFieldKey,
    titleFieldSeparator,
    addressMapping,
    performOpsLogic
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`\n  Created: ${filePath}`);

  const workflowsJson = loadWorkflowsJson();
  if (!workflowsJson.workflows.includes(fileName)) {
    workflowsJson.workflows.push(fileName);
    saveWorkflowsJson(workflowsJson);
    console.log(`  Registered "${fileName}" in workflows.json.`);
  } else {
    console.log(`  "${fileName}" already registered in workflows.json.`);
  }

  console.log('\n  Done!\n');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});
