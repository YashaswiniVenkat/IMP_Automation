import fs from 'fs';
import path from 'path';

const REGIONAL_PATH = path.resolve('compliagov-public/packages/public-react/src/regional');
const INSTALLS_PATH = path.resolve('compliagov-public/packages/server/app/services/installs');

export function createBuildConfig(config) {
  const {
    market, stateName, agencyName, agencyShort,
    portalTitle = `${stateName} ${agencyShort} Portal`,
    loginCardText = `Welcome to ${stateName} ${agencyShort}'s website powered by Complia! This system is designed to help you apply for, update, and renew licenses.`,
    footerLink = '', footerLinkTitle = agencyShort,
    supportEmail = `nlssupport-${market}@tylertech.com`,
    copyrightText = `State of ${stateName}`,
    footerLegalItems = ['accessibility', 'termsConditions', 'privacyPolicy']
  } = config;

  const buildConfig = {
    title: portalTitle,
    logoTextPrimary: `State of ${stateName}`,
    logoTextSecondary: agencyName,
    loginCardTitle: portalTitle,
    loginCardText,
    showLogoTitle: true,
    licensingEntity: 'Tyler Cannabis Licensing',
    logoImgAlt: portalTitle,
    copyrightText,
    footerLink,
    footerLinkTitle,
    maintenanceMsg: `${portalTitle} is currently performing scheduled maintenance that was approved by the state regulatory agency. Please do not contact customer support if you see this message. The system will be back online shortly.`,
    nlsSupportMail: supportEmail,
    footerLegalItems
  };

  const configDir = path.join(REGIONAL_PATH, market, 'config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const filePath = path.join(configDir, 'build.config.json');
  fs.writeFileSync(filePath, JSON.stringify(buildConfig, null, 2) + '\n', 'utf-8');
  return { filePath, buildConfig };
}

export function createRegisterConfig(config) {
  const { market, portalTitle, captchaEnabled = true, verifyFields = true } = config;

  const registerConfig = {
    heading: `Register to join ${portalTitle}.`,
    captchaEnabled,
    verifyFields,
    jurisdiction: market
  };

  const configDir = path.join(REGIONAL_PATH, market, 'config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const filePath = path.join(configDir, 'registerConfig.json');
  fs.writeFileSync(filePath, JSON.stringify(registerConfig, null, 2) + '\n', 'utf-8');
  return { filePath, registerConfig };
}

export function createRegisterForm(config) {
  const { market, sourceMarket } = config;

  const configDir = path.join(REGIONAL_PATH, market, 'config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const filePath = path.join(configDir, 'registerForm.json');

  if (sourceMarket) {
    const sourcePath = path.join(REGIONAL_PATH, sourceMarket, 'config', 'registerForm.json');
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source market "${sourceMarket}" registerForm.json not found.`);
    }
    const form = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    form.path = `${market}-registration`;
    fs.writeFileSync(filePath, JSON.stringify(form, null, 2) + '\n', 'utf-8');
  } else {
    const form = getDefaultRegisterForm(market);
    fs.writeFileSync(filePath, JSON.stringify(form, null, 2) + '\n', 'utf-8');
  }

  return { filePath };
}

export function createInstallService(config) {
  const {
    market, addCustomStates = false, customStates = [],
    counties = null, showCountyCode = false, overwrite = false
  } = config;

  const filePath = path.join(INSTALLS_PATH, `${market}.server.service.js`);
  if (fs.existsSync(filePath) && !overwrite) {
    throw new Error(`Install service "${market}.server.service.js" already exists. Set overwrite: true.`);
  }

  let content = `exports.addCustomStates = ${addCustomStates};\n`;

  if (customStates.length > 0) {
    content += `\nexports.customStates = [\n`;
    customStates.forEach((s, i) => {
      content += `  {\n    label: "${s.label}",\n    value: "${s.value}",\n  }`;
      content += i < customStates.length - 1 ? ',\n' : '\n';
    });
    content += `];\n`;
  }

  if (counties && counties.length > 0) {
    content += `\nexports.showCountyCode = ${showCountyCode};\n`;
    content += `\nexports.counties = [\n`;
    counties.forEach((c, i) => {
      content += `  "${c}"`;
      content += i < counties.length - 1 ? ',\n' : '\n';
    });
    content += `];\n`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  return { filePath };
}

export function setupNewMarket(config) {
  const {
    market, stateName, agencyName, agencyShort,
    portalTitle, loginCardText, footerLink, footerLinkTitle,
    supportEmail, copyrightText,
    sourceMarket,
    addCustomStates, customStates, counties, showCountyCode
  } = config;

  const results = {};

  results.buildConfig = createBuildConfig({
    market, stateName, agencyName, agencyShort,
    portalTitle, loginCardText, footerLink, footerLinkTitle,
    supportEmail, copyrightText
  });

  results.registerConfig = createRegisterConfig({
    market,
    portalTitle: portalTitle || `${stateName} ${agencyShort} Portal`
  });

  results.registerForm = createRegisterForm({ market, sourceMarket });

  results.installService = createInstallService({
    market, addCustomStates, customStates, counties, showCountyCode,
    overwrite: true
  });

  return results;
}

export function marketExists(market) {
  return fs.existsSync(path.join(REGIONAL_PATH, market, 'config'));
}

function getDefaultRegisterForm(market) {
  return {
    _id: `generated-${market}-${Date.now()}`,
    type: 'form',
    tags: [],
    components: [
      {
        key: 'panel',
        input: false,
        tableView: false,
        components: [
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable',
            numRows: 2,
            numCols: 2,
            rows: [
              [
                { components: [{ input: true, tableView: true, label: 'Legal First Name', key: 'firstName', validate: { required: true, maxLength: 100 }, type: 'textfield', lockKey: true }] },
                { components: [{ input: true, tableView: true, label: 'Legal Last Name', key: 'lastName', validate: { required: true, maxLength: 100 }, type: 'textfield', lockKey: true }] }
              ],
              [
                { components: [{ input: true, tableView: true, label: 'Email', key: 'email', validate: { required: true }, type: 'email', lockKey: true }] },
                { components: [{ input: true, tableView: true, label: 'Confirm Email', key: 'confirmEmail', validate: { required: true }, type: 'email', lockKey: true }] }
              ]
            ],
            type: 'table',
            tableView: false
          },
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable2',
            numRows: 1,
            numCols: 2,
            rows: [[
              { components: [{ input: true, tableView: true, label: 'Phone Number', key: 'phoneNumber', validate: { required: true }, type: 'phoneNumber', lockKey: true }] },
              { components: [] }
            ]],
            type: 'table',
            tableView: false
          },
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable3',
            numRows: 1,
            numCols: 2,
            rows: [[
              { components: [{ input: true, tableView: true, label: 'Account Type', key: 'type', validate: { required: true }, type: 'select', data: { values: [{ label: 'Business', value: 'Business' }, { label: 'Individual', value: 'Individual' }] }, lockKey: true }] },
              { components: [] }
            ]],
            type: 'table',
            tableView: false
          },
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable7',
            numRows: 1,
            numCols: 2,
            rows: [[
              { components: [{ input: true, tableView: false, label: 'Password', key: 'password', validate: { required: true, minLength: 8, pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+' }, type: 'password', lockKey: true }] },
              { components: [{ input: true, tableView: false, label: 'Re-enter Password', key: 'reenterPassword', validate: { required: true }, type: 'password', lockKey: true }] }
            ]],
            type: 'table',
            tableView: false
          }
        ],
        title: 'Registration',
        type: 'panel',
        tableView: false
      },
      { key: 'submit', type: 'button', label: 'Submit', input: true, tableView: false }
    ],
    display: 'form',
    title: 'Registration',
    name: 'registration',
    path: `${market}-registration`
  };
}
