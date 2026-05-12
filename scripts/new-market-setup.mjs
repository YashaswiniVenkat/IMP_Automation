import fs from 'fs';
import path from 'path';
import readline from 'readline';

const REGIONAL_PATH = path.resolve('compliagov-public/packages/public-react/src/regional');
const INSTALLS_PATH = path.resolve('compliagov-public/packages/server/app/services/installs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

function generateBuildConfig(config) {
  const {
    market, stateName, agencyName, portalTitle,
    loginCardText, footerLink, footerLinkTitle,
    supportEmail, copyrightText
  } = config;

  return {
    title: portalTitle,
    logoTextPrimary: `State of ${stateName}`,
    logoTextSecondary: agencyName,
    loginCardTitle: portalTitle,
    loginCardText,
    showLogoTitle: true,
    licensingEntity: 'Tyler Cannabis Licensing',
    logoImgAlt: portalTitle,
    copyrightText: copyrightText || `State of ${stateName}`,
    footerLink,
    footerLinkTitle,
    maintenanceMsg: `${portalTitle} is currently performing scheduled maintenance that was approved by the state regulatory agency. Please do not contact customer support if you see this message. The system will be back online shortly.`,
    nlsSupportMail: supportEmail || `nlssupport-${market}@tylertech.com`,
    footerLegalItems: ['accessibility', 'termsConditions', 'privacyPolicy']
  };
}

function generateRegisterConfig(config) {
  const { market, portalTitle } = config;
  return {
    heading: `Register to join ${portalTitle}.`,
    captchaEnabled: true,
    verifyFields: true,
    jurisdiction: market
  };
}

function generateRegisterForm(market) {
  return {
    _id: `generated-${market}-${Date.now()}`,
    type: 'form',
    tags: [],
    owner: '',
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
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Legal First Name',
                    key: 'firstName',
                    validate: { required: true, maxLength: 100 },
                    type: 'textfield',
                    lockKey: true
                  }]
                },
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Legal Last Name',
                    key: 'lastName',
                    validate: { required: true, maxLength: 100 },
                    type: 'textfield',
                    lockKey: true
                  }]
                }
              ],
              [
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Email',
                    key: 'email',
                    validate: { required: true },
                    type: 'email',
                    lockKey: true
                  }]
                },
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Confirm Email',
                    key: 'confirmEmail',
                    validate: { required: true },
                    type: 'email',
                    lockKey: true
                  }]
                }
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
            rows: [
              [
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Phone Number',
                    key: 'phoneNumber',
                    validate: { required: true },
                    type: 'phoneNumber',
                    lockKey: true
                  }]
                },
                { components: [] }
              ]
            ],
            type: 'table',
            tableView: false
          },
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable3',
            numRows: 1,
            numCols: 2,
            rows: [
              [
                {
                  components: [{
                    input: true,
                    tableView: true,
                    label: 'Account Type',
                    key: 'type',
                    validate: { required: true },
                    type: 'select',
                    data: {
                      values: [
                        { label: 'Business', value: 'Business' },
                        { label: 'Individual', value: 'Individual' }
                      ]
                    },
                    lockKey: true
                  }]
                },
                { components: [] }
              ]
            ],
            type: 'table',
            tableView: false
          },
          {
            clearOnHide: false,
            input: false,
            key: 'panelTable7',
            numRows: 1,
            numCols: 2,
            rows: [
              [
                {
                  components: [{
                    input: true,
                    tableView: false,
                    label: 'Password',
                    key: 'password',
                    validate: {
                      required: true,
                      minLength: 8,
                      pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+'
                    },
                    type: 'password',
                    lockKey: true
                  }]
                },
                {
                  components: [{
                    input: true,
                    tableView: false,
                    label: 'Re-enter Password',
                    key: 'reenterPassword',
                    validate: { required: true },
                    type: 'password',
                    lockKey: true
                  }]
                }
              ]
            ],
            type: 'table',
            tableView: false
          }
        ],
        title: 'Registration',
        type: 'panel',
        tableView: false
      },
      {
        key: 'submit',
        type: 'button',
        label: 'Submit',
        input: true,
        tableView: false
      }
    ],
    display: 'form',
    title: 'Registration',
    name: 'registration',
    path: `${market}-registration`
  };
}

function generateInstallService(config) {
  const { addCustomStates, customStates, counties, showCountyCode } = config;

  let content = '';

  content += `exports.addCustomStates = ${addCustomStates};\n`;

  if (customStates && customStates.length > 0) {
    content += `\nexports.customStates = [\n`;
    customStates.forEach((s, i) => {
      content += `  {\n`;
      content += `    label: "${s.label}",\n`;
      content += `    value: "${s.value}",\n`;
      content += `  }`;
      content += i < customStates.length - 1 ? ',\n' : '\n';
    });
    content += `];\n`;
  }

  if (counties && counties.length > 0) {
    content += `\nexports.showCountyCode = ${showCountyCode || false};\n`;
    content += `\nexports.counties = [\n`;
    counties.forEach((c, i) => {
      content += `  "${c}"`;
      content += i < counties.length - 1 ? ',\n' : '\n';
    });
    content += `];\n`;
  }

  return content;
}

async function collectCustomStates() {
  const states = [];
  const add = await ask('\n  Add custom states? (y/n): ');
  if (add.toLowerCase() !== 'y') return states;

  let addMore = true;
  while (addMore) {
    const label = await ask('    State label (e.g. "Out of Country"): ');
    const value = await ask('    State value (e.g. "outOfCountry"): ');
    states.push({ label, value });
    const more = await ask('    Add another? (y/n): ');
    addMore = more.toLowerCase() === 'y';
  }
  return states;
}

async function collectCounties() {
  const add = await ask('\n  Add counties? (y/n): ');
  if (add.toLowerCase() !== 'y') return null;

  console.log('    Enter counties (one per line, empty line to finish):');
  const counties = [];
  let line = await ask('    County: ');
  while (line !== '') {
    counties.push(line);
    line = await ask('    County: ');
  }
  return counties;
}

async function main() {
  console.log('\n====================================');
  console.log('  New Market Scratch Setup');
  console.log('====================================\n');

  const market = await ask('  Market code (e.g. "ar-dfa", "hi-doh"): ');
  const stateName = await ask('  State name (e.g. "Arkansas", "Hawaii"): ');
  const agencyName = await ask('  Agency full name (e.g. "Department of Finance and Administration"): ');
  const agencyShort = await ask('  Agency short name (e.g. "DFA", "DOH"): ');

  const portalTitle = await ask(`  Portal title (default: "${stateName} ${agencyShort} Portal"): `) || `${stateName} ${agencyShort} Portal`;
  const loginCardText = await ask('  Login card text (welcome message): ') || `Welcome to ${stateName} ${agencyShort}'s website powered by Complia! This system is designed to help you apply for, update, and renew licenses.`;
  const footerLink = await ask('  Footer link URL (agency website): ');
  const footerLinkTitle = await ask(`  Footer link title (default: "${agencyShort}"): `) || agencyShort;
  const supportEmail = await ask(`  Support email (default: "nlssupport-${market}@tylertech.com"): `) || `nlssupport-${market}@tylertech.com`;

  const configDir = path.join(REGIONAL_PATH, market, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`\n  Created directory: ${configDir}`);
  }

  const buildConfig = generateBuildConfig({
    market, stateName, agencyName, portalTitle,
    loginCardText, footerLink, footerLinkTitle, supportEmail
  });
  fs.writeFileSync(path.join(configDir, 'build.config.json'), JSON.stringify(buildConfig, null, 2) + '\n', 'utf-8');
  console.log('  Created: build.config.json');

  const registerConfig = generateRegisterConfig({ market, portalTitle });
  fs.writeFileSync(path.join(configDir, 'registerConfig.json'), JSON.stringify(registerConfig, null, 2) + '\n', 'utf-8');
  console.log('  Created: registerConfig.json');

  const useCustomForm = await ask('\n  Use custom registerForm.json? (paste path or "n" for default template): ');
  if (useCustomForm.toLowerCase() === 'n' || !useCustomForm) {
    const registerForm = generateRegisterForm(market);
    fs.writeFileSync(path.join(configDir, 'registerForm.json'), JSON.stringify(registerForm, null, 2) + '\n', 'utf-8');
    console.log('  Created: registerForm.json (default template)');
  } else if (fs.existsSync(useCustomForm)) {
    const customForm = fs.readFileSync(useCustomForm, 'utf-8');
    fs.writeFileSync(path.join(configDir, 'registerForm.json'), customForm, 'utf-8');
    console.log('  Created: registerForm.json (from custom source)');
  } else {
    console.log('  File not found. Skipping registerForm.json.');
  }

  console.log('\n--- Install Service File ---');
  const customStates = await collectCustomStates();
  const counties = await collectCounties();
  let showCountyCode = false;
  if (counties && counties.length > 0) {
    const show = await ask('  Show county codes? (y/n): ');
    showCountyCode = show.toLowerCase() === 'y';
  }

  const serviceContent = generateInstallService({
    addCustomStates: customStates.length > 0,
    customStates,
    counties,
    showCountyCode
  });

  const serviceFilePath = path.join(INSTALLS_PATH, `${market}.server.service.js`);
  if (fs.existsSync(serviceFilePath)) {
    const overwrite = await ask(`\n  "${market}.server.service.js" already exists. Overwrite? (y/n): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('  Skipped install service file.');
    } else {
      fs.writeFileSync(serviceFilePath, serviceContent, 'utf-8');
      console.log(`  Created: ${serviceFilePath}`);
    }
  } else {
    fs.writeFileSync(serviceFilePath, serviceContent, 'utf-8');
    console.log(`  Created: ${serviceFilePath}`);
  }

  console.log('\n  New market setup complete!');
  console.log(`  Market: ${market}`);
  console.log(`  Frontend: ${configDir}`);
  console.log(`  Service: ${serviceFilePath}`);
  console.log('\n  Next steps:');
  console.log('    - Add coreApplication.json (run: npm run workflow:setup)');
  console.log('    - Add navigation.config.json');
  console.log('    - Add templates (GettingStarted, Help, PrivacyPolicy, TermsConditions)');
  console.log('    - Add email templates');
  console.log('    - Configure payment (run: npm run payment:setup)');
  console.log('\n  Done!\n');
  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
});
