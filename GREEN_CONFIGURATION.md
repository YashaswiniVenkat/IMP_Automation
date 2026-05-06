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
