# Green Configuration Guide

Complete reference for configuring CompliaGov Green (public-facing) workflows.

---

## Primary Workflow Setup

**Path:** `compliagov-public/packages/public-react/src/regional/<market>/config/coreApplication.json`

### Configuration Rules

| Field | Primary Workflow | Secondary Workflow |
|-------|-----------------|-------------------|
| `saveOnCreate` | `true` | `false` |
| `cloneOnCreate` | `false` | `true` |
| `isLicense` | `true` | `false` |
| `submitAction` | `"new"` | `"new"` |

### Table Headers Structure

Each workflow entry has a `tableHeaders` array that defines the columns displayed in the applications list.

#### Individual Workflow (uses firstName + lastName)

```json
[
  {
    "systemName": "applicationFormId",
    "displayName": "Application ID",
    "sortBy": "applicationFormId",
    "isSortable": true,
    "type": "link"
  },
  {
    "systemName": "formProperties.genInfoFirstName,formProperties.genInfoLastName",
    "displayName": "Name",
    "sortBy": "",
    "isSortable": false,
    "type": "multivalue"
  },
  {
    "systemName": "status",
    "displayName": "Status",
    "sortBy": "status",
    "isSortable": true,
    "type": "text"
  },
  {
    "systemName": "applicationType",
    "displayName": "Application Type",
    "sortBy": "applicationType",
    "isSortable": true,
    "type": "applicationType"
  },
  {
    "systemName": "dateSubmitted",
    "displayName": "Submitted Date",
    "sortBy": "dateSubmitted",
    "isSortable": true,
    "type": "date",
    "defaultSort": true
  }
]
```

#### Business Workflow (uses entityName)

```json
[
  {
    "systemName": "applicationFormId",
    "displayName": "Application ID",
    "sortBy": "applicationFormId",
    "isSortable": true,
    "type": "link"
  },
  {
    "systemName": "formProperties.genInfoEntityName",
    "displayName": "Name",
    "sortBy": "",
    "isSortable": false,
    "type": "text"
  },
  {
    "systemName": "status",
    "displayName": "Status",
    "sortBy": "status",
    "isSortable": true,
    "type": "text"
  },
  {
    "systemName": "applicationType",
    "displayName": "Application Type",
    "sortBy": "applicationType",
    "isSortable": true,
    "type": "applicationType"
  },
  {
    "systemName": "dateSubmitted",
    "displayName": "Submitted Date",
    "sortBy": "dateSubmitted",
    "isSortable": true,
    "type": "date",
    "defaultSort": true
  }
]
```

### Table Header Field Types

| Type | Description |
|------|-------------|
| `link` | Clickable link (used for Application ID) |
| `text` | Plain text display |
| `multivalue` | Multiple values joined (e.g. firstName + lastName) |
| `applicationType` | Application type badge |
| `date` | Formatted date display |

### Optional Fields

- **`fees`** - Array of `{ description, amount }` objects displayed on the review page
- **`mailPaymentMessage`** - Custom message shown for mail payment option
- **`requiredKeysForCloning`** - Array of form keys required for cloning (secondary workflows)
- **`systemName`** - Form property key used for cloning title (secondary workflows)

### Programmatic API

```js
import { addPrimaryWorkflow } from './scripts/green-workflow-config.mjs';

addPrimaryWorkflow({
  market: 'hi-doh',
  workflowSuffix: 'NBL',
  displayName: 'New Business License',
  type: 'business',
  fees: [{ description: 'Application Fee', amount: '$5,000.00' }],
  mailPaymentMessage: 'Please include your name and application reference number...',
});
```

---

## Secondary Workflow Setup

### coreApplication.json

**Path:** `compliagov-public/packages/public-react/src/regional/<market>/config/coreApplication.json`

```js
import { addSecondaryWorkflow } from './scripts/green-workflow-config.mjs';

addSecondaryWorkflow({
  market: 'hi-doh',
  workflowSuffix: 'BLU',
  displayName: 'Update Business License',
  type: 'business',
  systemName: 'formProperties.genInfoEntityName',
  requiredKeysForCloning: ['genInfoBusinessLicNo'],
});
```

---

### licenses.json — Allowed Status

**Path:** `compliagov-public/packages/public-react/src/regional/<market>/config/licenses.json`

Controls which statuses allow a secondary workflow (update/renew) to be initiated.

#### Structure

```json
{
  "subTypes": [
    {
      "key": "AR-DFA-RICU",
      "type": "update",
      "allowedWhen": ["Approved"]
    },
    {
      "key": "AR-DFA-RICR",
      "type": "renew",
      "allowedWhen": ["Approved", "Expired"]
    }
  ]
}
```

#### Fields

| Field | Description |
|-------|-------------|
| `key` | The workflow applicationType (e.g. `AR-DFA-LR`) |
| `type` | `"update"` or `"renew"` |
| `allowedWhen` | Array of statuses that permit this workflow (e.g. `["Approved", "Expired"]`) |

#### Common Status Values

- `Approved` — License is active
- `Deactivated` — License has been deactivated
- `Expired` — License has expired

#### Programmatic API

```js
import { addLicenseSubType, listLicenseSubTypes } from './scripts/green-workflow-config.mjs';

// Add a subType entry
addLicenseSubType({
  market: 'ar-dfa',
  applicationType: 'AR-DFA-LR',
  type: 'renew',
  allowedWhen: ['Approved', 'Expired'],
  overwrite: false,  // set true to replace existing
});

// List existing subTypes
listLicenseSubTypes('ar-dfa');
// => [{ key: 'AR-DFA-RICU', type: 'update', allowedWhen: ['Approved'] }, ...]
```

---

### navigation.config.json — Invoice & Payment Options

**Path:** `compliagov-public/packages/public-react/src/regional/<market>/config/navigation.config.json`

Controls invoice actions, payment methods, and which workflows are allowed for each payment method.

#### Structure

Located inside the `openInvoices` nav item:

```json
{
  "items": [
    {
      "systemName": "openInvoices",
      "invoiceActions": [
        { "value": "pay", "label": "Pay" },
        { "value": "dispute", "label": "Dispute or Deny Award" }
      ],
      "paymentOptions": [
        { "label": "Credit Card / ACH", "value": "online", "icon": "fa-credit-card" },
        { "label": "Mail Payment", "value": "MailPayment", "icon": "fa-envelope-o" }
      ],
      "allowedPaymentOptions": {
        "mailPayment": ["AR-DFA-NL", "AR-DFA-LR"],
        "onlinePayment": ["AR-DFA-NL", "AR-DFA-LR"]
      }
    }
  ]
}
```

#### invoiceActions

| Field | Description |
|-------|-------------|
| `value` | Action identifier (`"pay"`, `"dispute"`) |
| `label` | Display text shown to user |

#### paymentOptions

| Field | Description |
|-------|-------------|
| `value` | Payment method identifier (`"online"`, `"MailPayment"`) |
| `label` | Display text (e.g. `"Credit Card / ACH"`) |
| `icon` | Optional FontAwesome icon class (e.g. `"fa-credit-card"`, `"fa-envelope-o"`) |

#### allowedPaymentOptions

Maps payment method keys to arrays of workflow types allowed to use that method:

| Key | Description |
|-----|-------------|
| `mailPayment` | Workflows that can pay via mail |
| `onlinePayment` | Workflows that can pay online (if restricted) |

If `allowedPaymentOptions` is omitted, all workflows default to online payment only.

#### Programmatic API

```js
import {
  addAllowedPaymentOption, updateInvoiceActions,
  updatePaymentOptions, getNavigationPaymentConfig
} from './scripts/green-workflow-config.mjs';

// Add a workflow to an allowed payment method
addAllowedPaymentOption({
  market: 'hi-doh',
  applicationType: 'HI-DOH-BLR',
  paymentMethod: 'mailPayment',  // or 'onlinePayment'
});

// Update invoice actions
updateInvoiceActions({
  market: 'hi-doh',
  actions: [
    { value: 'pay', label: 'Pay Invoice' },
    { value: 'dispute', label: 'Dispute' }
  ]
});

// Update payment options
updatePaymentOptions({
  market: 'hi-doh',
  options: [
    { label: 'Credit Card / ACH', value: 'online', icon: 'fa-credit-card' },
    { label: 'Mail Payment', value: 'MailPayment', icon: 'fa-envelope-o' }
  ]
});

// View current payment config
getNavigationPaymentConfig('ar-dfa');
// => { invoiceActions: [...], paymentOptions: [...], allowedPaymentOptions: {...} }
```

---

## Payment Setup

**Path:** `compliagov-public/packages/server/config/env/<market>/<market>.all.json`

**Run interactive CLI:**
```bash
npm run payment:setup
```

### Fee Map Structure

Each fee entry defines when a fee applies based on filters:

```json
{
  "feeMap": {
    "applicationform": {
      "EMPL_App_Fee-1": {
        "description": "Employee Fee",
        "sku": "EMPL_App_Fee",
        "amount": 25,
        "filters": [
          {
            "applicationType": "AR-DFA-NRIC",
            "formProperties": {
              "genInfoLicenseType": "employee"
            }
          }
        ]
      }
    }
  }
}
```

#### Fee Entry Fields

| Field | Description |
|-------|-------------|
| `description` | Human-readable fee name |
| `sku` | SKU identifier from requirement sheet |
| `amount` | Numeric fee amount (no dollar sign) |
| `filters` | Array of conditions that determine when this fee applies |

#### Filter Fields

| Field | Description |
|-------|-------------|
| `applicationType` | Workflow type this fee applies to (e.g. `AR-DFA-NRIC`) |
| `formProperties` | Optional object of form field conditions (key-value pairs) |

### Payment Provider (NIC) Structure

```json
{
  "paymentProvider": {
    "nic": {
      "name": "nic",
      "isDefaultPayment": true,
      "isRedirect": true,
      "stateCode": "AR",
      "supportedPaymentMethods": ["CC", "ACH"],
      "defaultConfig": {
        "serviceCode": "dfa_medicalmjagent",
        "merchantCode": "ArkansasDFA"
      },
      "customConfig": {
        "hi-doh-ncr": {
          "serviceCode": "MLRPAY"
        }
      }
    }
  }
}
```

#### Provider Fields

| Field | Description |
|-------|-------------|
| `stateCode` | Two-letter state code (e.g. `AR`, `HI`, `AL`) |
| `supportedPaymentMethods` | `["CC"]` or `["CC", "ACH"]` |
| `defaultConfig.serviceCode` | Default NIC service code |
| `defaultConfig.merchantCode` | Default NIC merchant code |
| `customConfig` | Per-workflow overrides (lowercase key, e.g. `hi-doh-ncr`) |

#### Custom Config Options

| Field | Description |
|-------|-------------|
| `serviceCode` | Override service code for this workflow |
| `merchantCode` | Override merchant code for this workflow |
| `generateLineItemsByCustomMethod` | `true` for custom line item generation (e.g. renewals with late fees) |
| `lateFee` | `{ description, sku, amount }` for late fee calculation |
| `dateConfigurations` | Cycle-based date ranges for late fee determination |

### Programmatic API

```js
import {
  addFee, removeFee, listFees,
  setupPaymentProvider, addCustomServiceConfig, getPaymentProvider,
  getAvailableMarkets
} from './scripts/payment-config.mjs';

// Add a fee
addFee({
  market: 'ar-dfa',
  feeKey: 'NEW_FEE',
  description: 'New Application Fee',
  sku: 'NEW_FEE_SKU',
  amount: 100,
  filters: [
    { applicationType: 'AR-DFA-NL', formProperties: { genInfoLicenseType: 'owner' } }
  ],
});

// Setup payment provider
setupPaymentProvider({
  market: 'ar-dfa',
  stateCode: 'AR',
  supportedPaymentMethods: ['CC', 'ACH'],
  serviceCode: 'dfa_medicalmjagent',
  merchantCode: 'ArkansasDFA',
  urlTransactionBase: 'https://securecheckout-uat.cdc.nicusa.com',
});

// Add custom service config for a specific workflow
addCustomServiceConfig({
  market: 'hi-doh',
  workflowKey: 'hi-doh-ncr',
  serviceCode: 'MLRPAY',
});

// View current config
listFees('ar-dfa');
getPaymentProvider('ar-dfa');
```

---

## New Market Scratch Setup

**Run interactive CLI:**
```bash
npm run market:setup
```

Creates all required config files for a brand new market from scratch.

### Files Created

| File | Path |
|------|------|
| `build.config.json` | `compliagov-public/packages/public-react/src/regional/<market>/config/` |
| `registerConfig.json` | `compliagov-public/packages/public-react/src/regional/<market>/config/` |
| `registerForm.json` | `compliagov-public/packages/public-react/src/regional/<market>/config/` |
| Install service file | `compliagov-public/packages/server/app/services/installs/<market>.server.service.js` |

---

### build.config.json

Controls portal branding, footer links, and support email.

```json
{
  "title": "Arkansas DFA Portal",
  "logoTextPrimary": "State of Arkansas",
  "logoTextSecondary": "Department of Finance and Administration",
  "loginCardTitle": "Arkansas DFA Portal",
  "loginCardText": "Welcome to Arkansas DFA's website powered by Complia!...",
  "showLogoTitle": true,
  "licensingEntity": "Tyler Cannabis Licensing",
  "logoImgAlt": "Arkansas DFA Portal",
  "copyrightText": "State of Arkansas",
  "footerLink": "https://www.ar.gov/cannabis/",
  "footerLinkTitle": "DFA",
  "maintenanceMsg": "...",
  "nlsSupportMail": "nlssupport-ar-dfa@tylertech.com",
  "footerLegalItems": ["accessibility", "termsConditions", "privacyPolicy"]
}
```

#### Fields

| Field | Description |
|-------|-------------|
| `title` | Portal page title |
| `logoTextPrimary` | Main logo text (e.g. "State of Arkansas") |
| `logoTextSecondary` | Sub-logo text (agency name) |
| `loginCardTitle` | Title on the login card |
| `loginCardText` | Welcome message on login page |
| `footerLink` | Agency's official website URL |
| `footerLinkTitle` | Short label for footer link |
| `nlsSupportMail` | Market-specific support email |
| `maintenanceMsg` | Message shown during maintenance |
| `footerLegalItems` | Array of footer links (`accessibility`, `termsConditions`, `privacyPolicy`) |

---

### registerConfig.json

Controls registration page behavior.

```json
{
  "heading": "Register to join Arkansas DFA Portal.",
  "captchaEnabled": true,
  "verifyFields": true,
  "jurisdiction": "ar-dfa"
}
```

#### Fields

| Field | Description |
|-------|-------------|
| `heading` | Registration page heading text |
| `captchaEnabled` | Enable/disable CAPTCHA on registration |
| `verifyFields` | Enforce field validation |
| `jurisdiction` | Must match the market folder name |

---

### registerForm.json

Form.io schema defining registration form fields. Can be:
- Generated from default template (firstName, lastName, email, phone, account type, password)
- Copied from an existing market using `sourceMarket`

---

### Install Service File

**Path:** `compliagov-public/packages/server/app/services/installs/<market>.server.service.js`

Defines custom states, counties, and market-specific dropdowns.

#### Minimal Example (AR-DFA)

```js
exports.addCustomStates = true;

exports.customStates = [
  { label: "Out of Country", value: "outOfCountry" },
  { label: "PP/GC", value: "pp/gc" },
];
```

#### With Counties

```js
exports.addCustomStates = true;
exports.customStates = [{ label: "Other", value: "other" }];

exports.showCountyCode = true;
exports.counties = [
  "01-Autauga",
  "02-Baldwin",
  "03-Barbour"
];
```

#### Fields

| Export | Description |
|--------|-------------|
| `addCustomStates` | `true` to enable custom state dropdown entries |
| `customStates` | Array of `{ label, value }` objects |
| `showCountyCode` | `true` to display numeric county codes |
| `counties` | Array of county strings |

---

### Programmatic API

```js
import { setupNewMarket, createBuildConfig, createRegisterConfig, createInstallService, marketExists } from './scripts/new-market-config.mjs';

// Create all files at once
setupNewMarket({
  market: 'tx-dps',
  stateName: 'Texas',
  agencyName: 'Department of Public Safety',
  agencyShort: 'DPS',
  footerLink: 'https://www.dps.texas.gov/',
  sourceMarket: 'ar-dfa',  // copies registerForm from existing market
  addCustomStates: true,
  customStates: [{ label: 'Out of Country', value: 'outOfCountry' }],
});

// Or create individual files
createBuildConfig({
  market: 'tx-dps',
  stateName: 'Texas',
  agencyName: 'Department of Public Safety',
  agencyShort: 'DPS',
  footerLink: 'https://www.dps.texas.gov/',
});

createRegisterConfig({
  market: 'tx-dps',
  portalTitle: 'Texas DPS Portal',
});

createInstallService({
  market: 'tx-dps',
  addCustomStates: true,
  customStates: [{ label: 'Out of Country', value: 'outOfCountry' }],
  counties: ['Travis', 'Harris', 'Dallas'],
  showCountyCode: false,
});

// Check if market exists
marketExists('ar-dfa'); // => true
```

---

## Service File Setup (Secondary Workflows)

**Run interactive CLI:**
```bash
npm run service:setup
```

**Path:** `compliagov-public/packages/server/app/services/workflows/<market>-<suffix>.server.service.js`

Creates secondary workflow service files and registers them in `workflows.json`.

### Structure

```js
exports.canGeocode = false;

exports.workflowKeyMapping = {
  applicationForm: {
    addresses: {
      primary: {
        address1: "formProperties.physicalStreet",
        address2: "formProperties.physicalUnitNoAptNo",
        city: "formProperties.physicalCity",
        state: "formProperties.physicalState",
        zipCode: "formProperties.physicalZipCode",
      },
    },
  },
};

exports.getTransactionIdentifiers = function (applicationFormDoc, token) {
  return [token];
};

exports.getParentApplicationType = function () {
  return "AR-DFA-NRIC";
};

exports.getLicenseNumber = function (record) {
  return record.formProperties.genInfoLicenseNumber;
};

exports.getApplicationTitleField = function () {
  return {
    key: "formProperties.genInfoFirstName,formProperties.genInfoLastName",
    separator: " ",
  };
};
```

### Exported Functions

| Function | Description |
|----------|-------------|
| `canGeocode` | Always `false` for secondary workflows |
| `workflowKeyMapping` | Maps form fields to address structure |
| `getTransactionIdentifiers` | Returns payment token identifier |
| `getParentApplicationType` | Returns the primary workflow type (e.g. `AR-DFA-NRIC`) |
| `getLicenseNumber` | Extracts license number from record |
| `getApplicationTitleField` | Returns title field key and separator |
| `performOpsBeforeCreatingApp` | Optional: enable form sections, skip payment, or custom logic |
| `performCustomOperationDuringClone` | Optional: validation at clone time |

### Programmatic API

```js
import { createSecondaryServiceFile, listServiceFiles, isRegistered } from './scripts/service-file-config.mjs';

createSecondaryServiceFile({
  market: 'ar-dfa',
  workflowSuffix: 'ricu',
  parentApplicationType: 'AR-DFA-NRIC',
  licenseNumberField: 'genInfoLicenseNumber',
  titleFieldKey: 'formProperties.genInfoFirstName,formProperties.genInfoLastName',
  titleFieldSeparator: ' ',
});

// List service files for a market
listServiceFiles('ar-dfa');
// => ['ar-dfa-bar', 'ar-dfa-lr', 'ar-dfa-nl', ...]

// Check if registered in workflows.json
isRegistered('ar-dfa', 'ricu'); // => true
```

---

## Available Markets

| Market | State |
|--------|-------|
| `al-abc` | Alabama ABC |
| `al-abocb` | Alabama ABOCB |
| `al-amcc` | Alabama AMCC |
| `ar-dfa` | Arkansas DFA |
| `hi-doh` | Hawaii DOH |
| `il-doa` | Illinois DOA |
| `ky-chfs` | Kentucky CHFS |
| `mo` | Missouri |
| `ms-doh` | Mississippi DOH |
| `nj-crc` | New Jersey CRC |
| `ok` | Oklahoma |
| `ri` | Rhode Island |
| `usvi-ocr` | USVI OCR |
| `va-cca` | Virginia CCA |
| `wv` | West Virginia |
