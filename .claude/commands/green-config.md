---
description: Green Configuration Setup - Guided wizard to configure workflows, payments, service files, and new markets for CompliaGov Green (public-facing portal).
---

You are a Green Configuration setup wizard. Walk the user through configuring CompliaGov Green step by step. Ask questions one at a time, confirm answers, then apply changes directly to the config files.

## Available Configuration Types

Ask the user which type of configuration they want to set up:

1. **Primary Workflow** - Add a new primary workflow to `coreApplication.json`
2. **Secondary Workflow** - Add a secondary workflow (update/renewal) to `coreApplication.json`, `licenses.json`, and `navigation.config.json`
3. **Payment Setup** - Add fees and payment provider config to `<market>.all.json`
4. **Service File** - Create a secondary workflow server service file
5. **New Market** - Set up a brand new market from scratch (build.config, registerConfig, registerForm, install service)

## Step-by-step Process

### For Primary Workflow:
1. Ask: Which market? (show available markets from `compliagov-public/packages/public-react/src/regional/`)
2. Ask: Workflow suffix? (e.g. NBL, NPA, NIL)
3. Ask: Display name? (e.g. "New Business License")
4. Ask: Individual or Business type?
5. Ask: Any fees? (description + amount)
6. Ask: Mail payment message? (optional)
7. Apply: Add entry to `coreApplication.json` with `saveOnCreate: true`, `cloneOnCreate: false`, `isLicense: true`

### For Secondary Workflow:
1. Ask: Which market?
2. Ask: Workflow suffix? (e.g. BLU, BLR, UBL)
3. Ask: Display name? (e.g. "Update Business License")
4. Ask: Individual or Business type?
5. Ask: SystemName for cloning? (e.g. "formProperties.genInfoEntityName")
6. Ask: Required keys for cloning? (e.g. "genInfoLicenseNumber")
7. Apply: Add to `coreApplication.json` with `saveOnCreate: false`, `cloneOnCreate: true`, `isLicense: false`
8. Ask: Add to licenses.json? (y/n)
   - If yes: Ask type (update/renew) and allowed statuses (Approved, Expired, Deactivated)
   - Apply: Add subType entry to `licenses.json`
9. Ask: Add to allowedPaymentOptions in navigation.config.json? (y/n)
   - If yes: Ask payment method (mailPayment/onlinePayment)
   - Apply: Add workflow to `allowedPaymentOptions`

### For Payment Setup:
1. Ask: Which market?
2. Show current fees if any exist
3. Ask: Add a fee? (y/n)
   - Fee key, description, SKU, amount
   - Filters: applicationType + optional formProperties
4. Ask: Setup/update payment provider? (y/n)
   - State code, service code, merchant code
   - Payment methods (CC only or CC + ACH)
   - Transaction URL (UAT or production)
5. Apply: Update `<market>.all.json`

### For Service File:
1. Ask: Which market?
2. Ask: Workflow suffix? (e.g. "blu", "blr")
3. Ask: Parent application type? (e.g. "MO-NBL")
4. Ask: License number field? (default: "genInfoLicenseNumber")
5. Ask: Title field - single (entityName) or multi (firstName + lastName)?
6. Ask: Use default address mapping? (y/n)
7. Ask: Add performOpsBeforeCreatingApp? (enable sections / skip payment / none)
8. Apply: Create `.server.service.js` file and register in `workflows.json`

### For New Market:
1. Ask: Market code? (e.g. "tx-dps")
2. Ask: State name? (e.g. "Texas")
3. Ask: Agency full name? (e.g. "Department of Public Safety")
4. Ask: Agency short name? (e.g. "DPS")
5. Ask: Portal title? Footer link? Support email?
6. Ask: Copy registerForm from existing market or use default?
7. Ask: Custom states? Counties?
8. Apply: Create `build.config.json`, `registerConfig.json`, `registerForm.json`, and install service file

## Important Rules

- Always confirm the market exists before proceeding (check `compliagov-public/packages/public-react/src/regional/`)
- Show the user what will be changed before applying
- Validate JSON after every file modification
- If a workflow already exists, ask before overwriting
- Use the exact file paths:
  - Frontend config: `compliagov-public/packages/public-react/src/regional/<market>/config/`
  - Server config: `compliagov-public/packages/server/config/env/<market>/<market>.all.json`
  - Service files: `compliagov-public/packages/server/app/services/workflows/`
  - Install services: `compliagov-public/packages/server/app/services/installs/`
  - Workflows registry: `compliagov-public/packages/server/app/__tests__/workflows/workflows.json`

## Configuration Reference

### coreApplication.json entry structure:
```json
{
  "applicationType": "MARKET-SUFFIX",
  "saveOnCreate": true/false,
  "cloneOnCreate": false/true,
  "displayName": "Display Name",
  "isLicense": true/false,
  "submitAction": "new",
  "requiredKeysForCloning": ["key"],
  "tableHeaders": [...]
}
```

### Table Headers - Business:
- Name field: `formProperties.genInfoEntityName` (type: "text")

### Table Headers - Individual:
- Name field: `formProperties.genInfoFirstName,formProperties.genInfoLastName` (type: "multivalue")

### licenses.json subType:
```json
{ "key": "MARKET-SUFFIX", "type": "update|renew", "allowedWhen": ["Approved", "Expired"] }
```

### Fee entry in all.json:
```json
{
  "description": "Fee Name",
  "sku": "SKU_CODE",
  "amount": 100,
  "filters": [{ "applicationType": "MARKET-TYPE", "formProperties": { "key": "value" } }]
}
```

## Programmatic API (scripts/green-workflow-config.mjs)

When applying changes, use these functions from `scripts/green-workflow-config.mjs`:

### addPrimaryWorkflow(config)
```js
import { addPrimaryWorkflow } from './scripts/green-workflow-config.mjs';

addPrimaryWorkflow({
  market: 'hi-doh',
  workflowSuffix: 'NBL',
  displayName: 'New Business License',
  type: 'business',         // 'individual' or 'business'
  nameField: 'formProperties.genInfoEntityName',  // optional override
  fees: [{ description: 'Application Fee', amount: '$100.00' }],  // optional
  mailPaymentMessage: '',   // optional
  overwrite: false,         // set true to replace existing
});
```

### addSecondaryWorkflow(config)
```js
import { addSecondaryWorkflow } from './scripts/green-workflow-config.mjs';

addSecondaryWorkflow({
  market: 'hi-doh',
  workflowSuffix: 'BLU',
  displayName: 'Update Business License',
  type: 'business',
  systemName: 'formProperties.genInfoEntityName',
  requiredKeysForCloning: ['genInfoBusinessLicNo'],
  overwrite: false,
});
```

### addLicenseSubType(config)
```js
import { addLicenseSubType } from './scripts/green-workflow-config.mjs';

addLicenseSubType({
  market: 'ar-dfa',
  applicationType: 'AR-DFA-LR',
  type: 'renew',            // 'update' or 'renew'
  allowedWhen: ['Approved', 'Expired'],
  overwrite: false,
});
```

### addAllowedPaymentOption(config)
```js
import { addAllowedPaymentOption } from './scripts/green-workflow-config.mjs';

addAllowedPaymentOption({
  market: 'hi-doh',
  applicationType: 'HI-DOH-BLR',
  paymentMethod: 'mailPayment',  // or 'onlinePayment'
});
```

### updateInvoiceActions(config)
```js
import { updateInvoiceActions } from './scripts/green-workflow-config.mjs';

updateInvoiceActions({
  market: 'hi-doh',
  actions: [
    { value: 'pay', label: 'Pay Invoice' },
    { value: 'dispute', label: 'Dispute' }
  ]
});
```

### updatePaymentOptions(config)
```js
import { updatePaymentOptions } from './scripts/green-workflow-config.mjs';

updatePaymentOptions({
  market: 'hi-doh',
  options: [
    { label: 'Credit Card / ACH', value: 'online', icon: 'fa-credit-card' },
    { label: 'Mail Payment', value: 'MailPayment', icon: 'fa-envelope-o' }
  ]
});
```

### Utility Functions
```js
import { listWorkflows, removeWorkflow, listLicenseSubTypes, getNavigationPaymentConfig, getAvailableMarkets } from './scripts/green-workflow-config.mjs';

listWorkflows('mo');                    // List all workflows for a market
removeWorkflow('mo', 'MO-PMBU');        // Remove a workflow
listLicenseSubTypes('mo');              // List license subTypes
getNavigationPaymentConfig('ar-dfa');   // Get payment config from navigation.config.json
getAvailableMarkets();                  // List all market directories
```

### Key Behavior
- Application type is built as `MARKET-SUFFIX` (uppercased from market + workflowSuffix)
- Duplicate detection: throws error unless `overwrite: true` is passed
- Table headers: Business uses `formProperties.genInfoEntityName` (type: "text"), Individual uses `formProperties.genInfoFirstName,formProperties.genInfoLastName` (type: "multivalue")
- Custom `nameField` override supported for non-standard name mappings

## Programmatic API (scripts/payment-config.mjs)

When applying payment changes, use these functions from `scripts/payment-config.mjs`:

### addFee(config)
```js
import { addFee } from './scripts/payment-config.mjs';

addFee({
  market: 'ar-dfa',
  feeKey: 'NEW_FEE-1',
  description: 'New Application Fee',
  sku: 'NEW_FEE_SKU',
  amount: 100,
  filters: [
    { applicationType: 'AR-DFA-NL', formProperties: { genInfoLicenseType: 'owner' } }
  ],
  overwrite: false,  // set true to replace existing
});
```

### removeFee(config)
```js
import { removeFee } from './scripts/payment-config.mjs';

removeFee({ market: 'ar-dfa', feeKey: 'NEW_FEE-1' });
```

### listFees(market)
```js
import { listFees } from './scripts/payment-config.mjs';

listFees('ar-dfa');
// => [{ feeKey, description, sku, amount, filters }]
```

### setupPaymentProvider(config)
```js
import { setupPaymentProvider } from './scripts/payment-config.mjs';

setupPaymentProvider({
  market: 'ar-dfa',
  stateCode: 'AR',
  supportedPaymentMethods: ['CC', 'ACH'],  // or ['CC'] for CC only
  serviceCode: 'dfa_medicalmjagent',
  merchantCode: 'ArkansasDFA',
  urlTransactionBase: 'https://securecheckout-uat.cdc.nicusa.com',  // UAT default
});
```

### addCustomServiceConfig(config)
```js
import { addCustomServiceConfig } from './scripts/payment-config.mjs';

addCustomServiceConfig({
  market: 'hi-doh',
  workflowKey: 'hi-doh-ncr',       // lowercase workflow key
  serviceCode: 'MLRPAY',
  merchantCode: 'HawaiiDOH',       // optional
  generateLineItemsByCustomMethod: false,  // optional
  lateFee: { description: 'Late Fee', sku: 'LATE_FEE', amount: 50 },  // optional
});
```

### getPaymentProvider(market)
```js
import { getPaymentProvider } from './scripts/payment-config.mjs';

getPaymentProvider('ar-dfa');
// => { stateCode, supportedPaymentMethods, serviceCode, merchantCode, customConfig, urlTransactionBase }
```

### Key Behavior
- Config path: `compliagov-public/packages/server/config/env/<market>/<market>.all.json`
- Fee keys must be unique within feeMap.applicationform — throws error unless `overwrite: true`
- setupPaymentProvider creates the full NIC structure (postHandle, transactionHandle, postUrlConfig)
- customConfig allows per-workflow overrides of serviceCode/merchantCode

## Programmatic API (scripts/new-market-config.mjs)

When setting up a new market, use these functions from `scripts/new-market-config.mjs`:

### setupNewMarket(config)
Creates all required files at once:
```js
import { setupNewMarket } from './scripts/new-market-config.mjs';

setupNewMarket({
  market: 'tx-dps',
  stateName: 'Texas',
  agencyName: 'Department of Public Safety',
  agencyShort: 'DPS',
  portalTitle: 'Texas DPS Portal',        // optional, defaults to "<stateName> <agencyShort> Portal"
  footerLink: 'https://www.dps.texas.gov/',
  footerLinkTitle: 'DPS',                 // optional, defaults to agencyShort
  supportEmail: 'nlssupport-tx-dps@tylertech.com',  // optional, auto-generated
  sourceMarket: 'ar-dfa',                 // copies registerForm from this market (or omit for default)
  addCustomStates: true,
  customStates: [{ label: 'Out of Country', value: 'outOfCountry' }],
  counties: ['Travis', 'Harris', 'Dallas'],  // optional
  showCountyCode: false,                     // optional
});
```

### createBuildConfig(config)
```js
import { createBuildConfig } from './scripts/new-market-config.mjs';

createBuildConfig({
  market: 'tx-dps',
  stateName: 'Texas',
  agencyName: 'Department of Public Safety',
  agencyShort: 'DPS',
  footerLink: 'https://www.dps.texas.gov/',
  // Optional: portalTitle, loginCardText, supportEmail, copyrightText, footerLegalItems
});
```

### createRegisterConfig(config)
```js
import { createRegisterConfig } from './scripts/new-market-config.mjs';

createRegisterConfig({
  market: 'tx-dps',
  portalTitle: 'Texas DPS Portal',
  captchaEnabled: true,   // default
  verifyFields: true,     // default
});
```

### createRegisterForm(config)
```js
import { createRegisterForm } from './scripts/new-market-config.mjs';

// Copy from existing market:
createRegisterForm({ market: 'tx-dps', sourceMarket: 'ar-dfa' });

// Or use default template (firstName, lastName, email, phone, accountType, password):
createRegisterForm({ market: 'tx-dps' });
```

### createInstallService(config)
```js
import { createInstallService } from './scripts/new-market-config.mjs';

createInstallService({
  market: 'tx-dps',
  addCustomStates: true,
  customStates: [
    { label: 'Out of Country', value: 'outOfCountry' },
    { label: 'PP/GC', value: 'pp/gc' }
  ],
  counties: ['01-Travis', '02-Harris', '03-Dallas'],  // optional
  showCountyCode: true,   // optional, shows numeric prefix
  overwrite: false,       // set true to replace existing
});
```

### marketExists(market)
```js
import { marketExists } from './scripts/new-market-config.mjs';

marketExists('ar-dfa');  // => true
marketExists('tx-dps');  // => false (if not yet created)
```

### Key Behavior
- Creates directory structure: `compliagov-public/packages/public-react/src/regional/<market>/config/`
- Install service path: `compliagov-public/packages/server/app/services/installs/<market>.server.service.js`
- registerForm can be copied from sourceMarket (updates `path` field) or generated from default template
- createInstallService throws error if file exists unless `overwrite: true`
- setupNewMarket calls all four create functions with `overwrite: true` for install service

## Programmatic API (scripts/service-file-config.mjs)

When creating secondary workflow service files, use these functions from `scripts/service-file-config.mjs`:

### createSecondaryServiceFile(config)
```js
import { createSecondaryServiceFile } from './scripts/service-file-config.mjs';

createSecondaryServiceFile({
  market: 'ar-dfa',
  workflowSuffix: 'ricu',
  parentApplicationType: 'AR-DFA-NRIC',
  licenseNumberField: 'genInfoLicenseNumber',       // default
  titleFieldKey: 'formProperties.genInfoFirstName,formProperties.genInfoLastName',
  titleFieldSeparator: ' ',                         // space between first/last
  addressMapping: {                                 // optional, uses default if omitted
    address1: 'formProperties.physicalStreet',
    address2: 'formProperties.physicalUnitNoAptNo',
    city: 'formProperties.physicalCity',
    state: 'formProperties.physicalState',
    zipCode: 'formProperties.physicalZipCode'
  },
  performOpsBeforeCreatingApp: null,                // optional: raw JS string for custom logic
  performCustomOperationDuringClone: null,          // optional: raw JS string for clone validation
  overwrite: false,                                 // set true to replace existing
});
```

### listServiceFiles(market)
```js
import { listServiceFiles } from './scripts/service-file-config.mjs';

listServiceFiles('ar-dfa');
// => ['ar-dfa-bar', 'ar-dfa-lr', 'ar-dfa-nl', 'ar-dfa-ricu']
```

### readServiceFile(market, workflowSuffix)
```js
import { readServiceFile } from './scripts/service-file-config.mjs';

readServiceFile('ar-dfa', 'ricu');
// => full file content as string (or null if not found)
```

### isRegistered(market, workflowSuffix)
```js
import { isRegistered } from './scripts/service-file-config.mjs';

isRegistered('ar-dfa', 'ricu');  // => true/false
```

### registerServiceFile(market, workflowSuffix)
```js
import { registerServiceFile } from './scripts/service-file-config.mjs';

registerServiceFile('ar-dfa', 'ricu');
// => { fileName: 'ar-dfa-ricu.server.service.js', registered: true }
```

### Key Behavior
- Service file path: `compliagov-public/packages/server/app/services/workflows/<market>-<suffix>.server.service.js`
- Workflows registry: `compliagov-public/packages/server/app/__tests__/workflows/workflows.json`
- createSecondaryServiceFile automatically registers the file in workflows.json
- Default address mapping uses physicalStreet/City/State/ZipCode fields
- Title field: single value uses `formProperties.genInfoEntityName` (separator: ""), multi uses firstName+lastName (separator: " ")
- Throws error if file exists unless `overwrite: true`
