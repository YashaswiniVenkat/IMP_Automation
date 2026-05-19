---
description: Blue Configuration Setup - Guided wizard to configure workflows, service files, navigation, and new markets for CompliaGov Blue (admin/case management portal).
---

You are a Blue Configuration setup wizard. Walk the user through configuring CompliaGov Blue (admin/government portal) step by step. Ask questions one at a time, confirm answers, then apply changes directly to the config files.

**IMPORTANT:** The very first question you ask must be whether the workflow is **Primary** or **Secondary**. Do NOT ask for configuration type separately.

## Flow Structure

The workflow setup is divided into two parts:

### Part A - All Config File Changes (bundled together, no separate prompts):
These are all applied automatically as part of the workflow setup flow:
- **Service File** (`<market>-<suffix>.server.service.js`) - Workflow logic
- **Application Config** (`coreApplication.json`) - Workflow entry with table headers
- **Left Nav / Navigation** (`navigation.config.json`) - Workflow nav entry with steps and SLA
- **Organization Config** (`organization.details.config.json`) - Add workflow tab to org details

### Part B - Separate Prompts (ask only after Part A is complete):
After all config file changes are applied, ask if the user also needs any of these:
1. **New Market** - Set up a brand new market on the blue side (all config files, install service, server config, email templates)
2. **Email Templates** - Create government email templates for a workflow
3. **Cloning Setup** - Configure `formatToExposeExternally` on the primary workflow for secondary workflow cloning
4. **Inspections / Enforcement** - Configure case management, inspections, and enforcement for a market
5. **Dashboard** - Configure dashboard widgets for a market
6. **Record Search** - Configure record search table headers, filters, and property searches
7. **Invoices** - Configure invoice list, filters, and invoice detail form
8. **Transfers** - Configure transfer list table headers and filters
9. **Application List** - Configure the applications list view (columns, filters, default statuses)
10. **Install Service** - Create/update a market install service file (timezone, emails, dropdowns, feature flags)

## Key File Paths

- **React UI config:** `compliagov/packages/public-react/src/regional/<market>/config/`
  - `navigation.config.json` - Left navigation with workflow steps
  - `coreApplication.json` - Application types with table headers
  - `record.searchList.config.json` - Record search config
  - `record.issuedList.config.json` - Issued/approved records list
  - `record.deniedList.config.json` - Denied records list
  - `record.closedCasesList.config.json` - Closed cases list
  - `applications.searchList.config.json` - Applications search list
  - `applications.removedList.config.json` - Removed applications list
  - `organization.list.config.json` - Organization list config
  - `organization.details.config.json` - Organization detail tabs
  - `organization.form.json` - Organization creation form
  - `allTasks.config.json` - All tasks table and filters
  - `myTasks.config.json` - My tasks table and filters
  - `openCases.config.json` - Open cases table and filters
  - `caseList.config.json` - Case list table headers
  - `inspections.config.json` - Inspections list table and filters
  - `enforcement.config.json` - Enforcement widget tables (inspections, open/closed cases)
  - `dashboard.json` - Dashboard widget config
  - `build.config.json` - Branding (title, logo, background, copyright)
  - `auth.config.json` - Auth settings (termsAndConditionChecked)
  - `invoice.list.config.json` - Invoice list table and filters
  - `invoice.create.form.json` - Invoice creation form
  - `invoice.details.form.json` - Invoice details form
  - `invoice.mailPayment.form.json` - Invoice mail payment form
  - `transfer.list.config.json` - Transfer list table and filters
  - `transfer.create.form.json` - Transfer creation form
  - `transfer.details.form.json` - Transfer details form
  - `processConfig.form.json` - Process/workflow step form
  - `documentWidgetTable.config.json` - Document widget table headers
  - `metrc.config.json` - Metrc/Seed-to-Sale config (if applicable)
- **Server service files:** `compliagov/packages/server/app/services/workflows/`
- **Install service files:** `compliagov/packages/server/app/services/installs/`
- **Server config:** `compliagov/packages/server/config/installs/<market>/<market>.all.json`
- **Environment configs:** `compliagov/packages/server/config/installs/<market>/<market>.{environment}.json`
- **Email templates:** `compliagov/packages/server/app/templates/emails/government/<market>/toApplicants/<WORKFLOW-TYPE>/`
- **Batch configs:** `compliagov/packages/server/batch_configs/installs/<market>/`

## Step-by-step Process

### For Workflow (Service File):

#### Step 1 - Primary or Secondary (ask first):
1. **Ask: Is this a Primary or Secondary workflow?**
   - **Primary** = New license / original application (e.g. NBL, NPR, MBA, CCR). Creates records from scratch.
   - **Secondary** = Update / Renewal / Partial Update that clones from a primary (e.g. BLU, BLR, MBU, MBR, PMBU). Requires a parent record.

#### Common Steps (Both Primary and Secondary):
2. Ask: Which market? (e.g. "al-abc", "mo", "hi-doh")
3. Ask: Workflow suffix? (e.g. "nbl", "mbu", "ccr", "blu", "blr")
4. Ask: canGeocode? (true/false)
5. Ask: Address mapping fields? Provide the property prefix for address fields:
   - e.g. `physicalStreet`, `physicalCity`, `physicalState`, `physicalZipCode`
   - or `facilityStreet`, `facilityUnitNoAptNo`, `facilityCity`, `facilityState`, `facilityZipCode`
   - Include `address2` field? (unit/apt number)
6. Ask: Application title field(s)?
   - Single field: `"properties.genInfoLegalEntityName"` (separator: `""`)
   - Multiple fields: `"properties.genInfoFirstName,properties.genInfoLastName"` (separator: `" "`)
   - Or template string: `"${properties.genInfoApplicantName}"`
7. Ask: getBadgePhotoDocTypeName? (null or document type name string)

#### Primary Workflow Steps (if Primary selected in step 1):

**Core Configuration:**
8. Ask: RENEWAL_RECORD constant? (e.g. "AL-ABC-BLR", "MO-MBR" or none if no renewal workflow exists yet)
9. Ask: subLicPropName? (e.g. "licenseTypeList" - property name for sub-licenses, or none)
10. Ask: Does it have secondary workflows that clone from it? (y/n)
    - If yes: Ask for secondary workflow type codes (e.g. ["AL-ABC-BLU", "AL-ABC-BLR"])
    - Ask: Properties to exclude from cloning (propsToExclude list)?
    - Ask: Any per-workflow exclusions? (e.g. delete `licenseExpiryDate-dt` for renewals)
    - Apply: Create `formatToExposeExternally` method

**License & Badge Generation:**
11. Ask: generateLicenseNumber? (y/n - auto-generate sequential license numbers on approval)
    - If yes: Ask license number format/prefix
    - Ask: LicenseNumber_Format? (format pattern string, or none)
12. Ask: generateLicenseExpiryDate? (y/n - auto-calculate expiry date on approval)
    - If yes: Ask expiry logic (e.g. 1 year from approval, fixed date, etc.)
13. Ask: generateLicenseEffectiveDate? (y/n - auto-set effective date on approval)
14. Ask: generateBadgeNumber? (y/n - auto-generate badge numbers)
15. Ask: generateBadgesArray? (y/n - return array of badge objects for multi-badge workflows)

**Payment & Fees:**
16. Ask: calculatePayment? (y/n - compute payment amounts)
    - If yes: Ask payment structure (fee types, amounts, line items)
17. Ask: getPayMapFeeYear? (y/n - fee year mapping for payment schedules)

**Validation:**
18. Ask: validateRecord logic? (what to check before submission)
    - Duplicate application check? (y/n)
    - recExpErrorCheck? (y/n - renewal expiry date validation)
    - Other custom validations?

**External Integrations (Seed-to-Sale / Metrc / AMM):**
19. Ask: mapSeedToSaleFields? (y/n - map fields for Seed-to-Sale system like Metrc)
20. Ask: metrcApiPropertiesMapping? (y/n - map properties for Metrc API calls)
21. Ask: mapAmmSysFields? (y/n - map AMM system fields)
22. Ask: mapVerificationFields? (y/n - map fields for external verification)
23. Ask: getVerificationDocumentTypeKeys? (y/n - define which doc types are for verification)
24. Ask: postRecordFromWokflowToExternalSources? (y/n - post record data to external systems)

**Dependent Licenses & Linked Licenses:**
25. Ask: modifyDependentLicenses? (y/n - modify child/sub-licenses on parent status change)
    - If yes: Ask which status changes trigger it (deactivate, expire, reactivate)
26. Ask: modifyDependentLicensesOnRenewal? (y/n - special handling for dependent licenses during renewal)
27. Ask: isLinkedLicense? (y/n - is this license linked to another license type)
    - If yes: Ask which license type it links to
28. Ask: mapLinkedLicenseQueryParams? (y/n - query params for linked license lookup)
29. Ask: customExtListCleanUp? (y/n - clean up external list after linking)
30. Ask: loadLinkedInfo? (y/n - load and attach related license information)
31. Ask: subLicenseFilter? (y/n - filter sub-licenses for display)

**Individual Actions (for markets with individual-level operations):**
32. Ask: getIndividualActionParentRecordType? (y/n - parent record type for individual actions)
33. Ask: getIndividualActionRecordType? (y/n - record type for individual actions)

**Email & Notifications:**
34. Ask: getEmailSubject? (prefix text for email subjects, e.g. "AMCC New Business License")
    - Ask: Which email types? (approve, received, reject, deny, restart, deactivate, reactivate, expired, expiring)
35. Ask: shouldSendEmail behavior? (always true / conditional by email type / false)
36. Ask: shouldSendInvoiceEmail? (y/n - separate toggle for invoice-related emails)
37. Ask: prepRecordForEmail? (y/n - prepare/transform record data before email template rendering)
38. Ask: sendLicenseExpiringEmailFilter? (y/n - filter for expiring license notifications)
39. Ask: sendSQSUpdateForLinkedLicense? (y/n - send SQS message when linked license is updated)

**Print & Digital Card:**
40. Ask: getPrintExportConfig? (y/n - print export configuration)
41. Ask: getPrintCardExportHeaders? (y/n - define print card CSV/export headers)
42. Ask: getPrintCardEntry? (y/n - map record to print card entry)
43. Ask: getDigitalCardTiffConfig? (y/n - digital card TIFF image configuration)

**Owners & Associations:**
44. Ask: getOwnersAssociationQuery? (y/n - for SSN/ownership cross-reference)
    - If yes: Ask which datagrid field holds owner SSN (e.g. "ownershipDataGrid.ownerSocialNumber")
45. Ask: ownersAssociationAlert? (y/n - return alerts for duplicate owners across records)

**Action Restrictions & Reports:**
46. Ask: isActionAllowed? (y/n - restrict certain actions like deactivation based on conditions)
47. Ask: prepareForReports? (y/n - prepare record data for reporting)

**Custom Jobs:** (select all that apply)
48. Ask: Any custom jobs?
    - `doPostProcessCustomJobs` - After application submission (e.g. flag license)
    - `doPostUpdateStatusCustomJobs` / `doPreUpdateStatusCustomJobs` - Before/After status change
    - `doPreMinorEditCustomJobs` - Before minor edit
    - `doPostMinorEditCustomJobs` - After minor edit
    - `performOpsBeforeManualSubmitingApp` - Before manual submit (e.g. set license number)
    - `performOpsBeforeCreatingApp` - Before app creation (e.g. copy fields, setup defaults)
    - `performOpsBeforeRecordUpdate` - Before record update
    - `performCustomOperationDuringClone` - During record clone
    - `preCustomJobsBeforeCleaning` - Validation before record archive
    - `flagLicense` / `unflagLicense` - Flag/unflag license helpers
    - `customizeCopiedRecord` - Customize record during clone

**Market-Specific Custom Methods:** (if applicable)
49. Ask: Any market-specific custom methods?
    - `evaluateProp` - Evaluate property for enforcement/compliance
    - `calculateOffenseCount` - Calculate offense count for cases
    - `calculateAmountDue` - Calculate amount due for penalties
    - `addRVPMember` - Add RVP member (responsible vendor program)
    - Other custom methods? (describe)

#### Secondary Workflow Steps (if Secondary selected in step 1):

**Core Configuration (REQUIRED):**
8. **Ask: Parent record type?** (REQUIRED - e.g. "AL-ABC-NBL", "MO-MBA", "HI-DOH-NBL")
9. **Ask: getLicenseNumber field?** (REQUIRED - e.g. "record.properties.genInfoLicenseNumber")
10. **Ask: performUpdateOnParent logic?** (REQUIRED - what happens when secondary is approved)
    - Copy all props from child to parent excluding a list? (most common)
    - If yes: Ask for propsToExclude list (transaction fields, email fields, audit fields, form-specific checkboxes)
    - Also update top-level fields? (e.g. `badgeNumber`, `licenseExpiryDate`, `status`)
    - Set parent status on approval? (e.g. `RECORD_STATUS.APPROVED`)
    - Custom logic? (describe)
    - None / no-op?
11. **Ask: validateRecord logic?** (REQUIRED - what to check before submission)
    - Check for duplicate in-progress secondary workflows? (e.g. prevent two BLUs for same license)
      - If yes: Which sibling workflow types to check? (e.g. ["AL-ABC-BLU", "AL-ABC-BLR"])
    - Validate parent license status? (e.g. must be Approved, not Deactivated/Expired)
      - If yes: Which statuses are valid? (default: [RECORD_STATUS.APPROVED])
    - Check parent license exists for the given license number?
    - recExpErrorCheck? (y/n - renewal expiry date validation)
    - Custom validation? (describe)

**License & Badge Generation:**
12. Ask: generateLicenseExpiryDate? (y/n - for renewal workflows that recalculate expiry)
    - If yes: Ask expiry logic (e.g. 1 year from current expiry, 1 year from approval)
13. Ask: generateLicenseEffectiveDate? (y/n - auto-set effective date)
14. Ask: generateBadgesArray? (y/n - return array of badge objects)

**Parent License Dependency:**
15. Ask: getParentBusinessLicenseType? (returns parent business license type or null - for workflows dependent on a business license)
16. Ask: isLicDependentOnBusinessLic? (true/false - is this license dependent on a business license)
17. Ask: subLicenseFilter? (y/n - filter sub-licenses for display)

**Email & Notifications:**
18. Ask: getEmailSubject? (prefix text for email subjects)
    - Ask: Which email types? (approve, received, reject, deny, restart)
19. Ask: shouldSendEmail behavior? (always true / conditional / false)
20. Ask: shouldSendInvoiceEmail? (y/n - separate toggle for invoice-related emails)
21. Ask: prepRecordForEmail? (y/n - prepare/transform record data before email template rendering)
22. Ask: sendSQSUpdateForLinkedLicense? (y/n - send SQS message when linked license is updated)

**External Integrations:**
23. Ask: mapSeedToSaleFields? (y/n - map fields for Seed-to-Sale system)
24. Ask: metrcApiPropertiesMapping? (y/n - map properties for Metrc API)
25. Ask: mapAmmSysFields? (y/n - map AMM system fields)
26. Ask: postRecordFromWokflowToExternalSources? (y/n - post record data to external systems)

**Owners & Associations:**
27. Ask: getOwnersAssociationQuery? (y/n - for SSN/ownership cross-reference)
    - If yes: Ask which datagrid field and parent record type
28. Ask: ownersAssociationAlert? (y/n - return alerts for duplicate owners)

**Action Restrictions:**
29. Ask: isActionAllowed? (y/n - e.g. prevent deactivation if parent is already deactivated)

**Custom Jobs:** (select all that apply)
30. Ask: Any custom jobs?
    - `doPreCustomJobs` - Custom jobs before other operations
    - `doPostProcessCustomJobs` - After application submission
    - `doPostUpdateStatusCustomJobs` / `doPreUpdateStatusCustomJobs` - Before/After status change
    - `doPreMinorEditCustomJobs` - Before minor edit
    - `doPostMinorEditCustomJobs` - After minor edit
    - `performOpsBeforeCreatingApp` - Before app creation
    - `performOpsBeforeRecordUpdate` - Before record update
    - `performOpsBeforeManualSubmitingApp` - Before manual submit
    - `performCustomOperationDuringClone` - During record clone
    - `flagLicense` / `unflagLicense` - Flag/unflag license helpers

#### Config File Changes (applied automatically after service file questions):

After gathering all the service file information above, also collect and apply these config changes as part of the same flow (do NOT prompt separately for these):

**Application Config (`coreApplication.json`):**
- Ask: Display name? (e.g. "Partial Microbusiness Update")
- Ask: Individual or Business type?
- Auto-set based on Primary/Secondary:
  - Primary: `cloneOnCreate: false`, `saveOnCreate: true`, `isLicense: true`
  - Secondary: `cloneOnCreate: true`, `saveOnCreate: false`, `isLicense: false`
- Apply: Add entry to `coreApplication.json`

**Left Nav / Navigation (`navigation.config.json`):**
- Ask: Category? (new-licenses / license-updates / license-renewals)
- Ask: SLA settings? (red days, yellow days)
- Ask: Workflow steps? (list of step IDs and titles)
- Auto-derive from earlier answers:
  - Workflow ID = `<MARKET>-<SUFFIX>` (uppercased)
  - Display name = same as application config display name
  - Permission name = `{MARKET_CODE}_{SUFFIX}_PROCESS`
  - History title fields = derived from application title field (step 6)
- Apply: Add to `navigation.config.json` under the correct category
- Apply: Add permission to parent category permissions array

**Organization Config (`organization.details.config.json`):**
- Ask: Add a tab for this workflow in organization details? (y/n)
- If yes:
  - Ask: Tab display name? (e.g. "Business License")
  - Ask: Account type filter? (Individual/Business/all)
  - Ask: Table columns for the tab?
  - Ask: Status model? (e.g. ["Approved", "Denied", "Deactivated", "Expired"])
- Apply: Add tab to `organization.details.config.json`

**Apply all config changes:**
- Create `<market>-<suffix>.server.service.js`
- Add entry to `coreApplication.json`
- Add entry to `navigation.config.json`
- Update `organization.details.config.json` (if applicable)

#### Quick Reference - Primary vs Secondary Decision:
| Indicator | Primary | Secondary |
|-----------|---------|-----------|
| Suffix examples | NBL, NPR, MBA, CCR, NIA, PRAC, PRG | BLU, BLR, MBU, MBR, PMBU, CCU, PHYU, LU |
| Has `RENEWAL_RECORD` | Yes (points to renewal WF) | No |
| Has `formatToExposeExternally` | Yes (clones data to children) | No |
| Has `getParentRecordType` | No | Yes (points to parent WF) |
| Has `performUpdateOnParent` | No-op or absent | Yes (merges back to parent) |
| Has `getLicenseNumber` | No (it IS the license) | Yes (reads from parent) |
| `cloneOnCreate` (in coreApplication) | false | true |
| `saveOnCreate` (in coreApplication) | true | false |
| `isLicense` (in coreApplication) | true | false |
| `generateLicenseNumber` | Often yes | Rarely |
| `modifyDependentLicenses` | Often yes | No |
| `modifyDependentLicensesOnRenewal` | Sometimes | No |
| `mapVerificationFields` | Often yes | No |
| `mapSeedToSaleFields` | Often (if Metrc) | Sometimes |
| `getPrintExportConfig` / `getPrintCardEntry` | Often yes | No |
| `getIndividualActionRecordType` | Sometimes | No |
| `isLinkedLicense` / `loadLinkedInfo` | Sometimes | No |

### Part B - Separate Prompts (ask after Part A is complete):

After all config file changes are applied, ask: "Do you also need any of the following?" and prompt only for the ones the user selects.

### For New Market:
1. Ask: Market code? (e.g. "nj-crc")
2. Ask: State name / Jurisdiction code? (e.g. "NJ")
3. Ask: Tenant name? (e.g. "New Jersey")
4. Ask: Agency full name? (e.g. "Cannabis Regulatory Commission")
5. Ask: Agency abbreviation? (e.g. "CRC")
6. Ask: Logo image URL or path?
7. Ask: Help contact (email + phone)?
8. Ask: Footer copyright text + link?
9. Ask: Portal title? Login card text?
10. Ask: Maintenance message?
11. Ask: Feature flags? (downloadDigitalCard, hasSeedToSale, editEffectiveDate, viewEffectiveDate, printApplication, badgeVersioning, reprintCard, autoClaimOnNext)
12. Ask: Document/Comments widgets? (record, task, account toggles)
13. Ask: Enforcement needed? (cases + inspections)
14. Ask: Invoices enabled? Transfers enabled?
15. Ask: Copy configs from existing market? (reference market)
16. Apply: Create React config files:
    - `build.config.json`
    - `auth.config.json`
    - `navigation.config.json`
    - `coreApplication.json`
    - `record.searchList.config.json`
    - `record.issuedList.config.json`
    - `record.deniedList.config.json`
    - `applications.searchList.config.json`
    - `applications.removedList.config.json`
    - `organization.list.config.json`
    - `organization.details.config.json`
    - `organization.form.json`
    - `allTasks.config.json`
    - `myTasks.config.json`
    - `dashboard.json`
    - `documentWidgetTable.config.json`
    - `invoice.list.config.json` (if enabled)
    - `invoice.create.form.json` (if enabled)
    - `transfer.list.config.json` (if enabled)
    - `caseList.config.json` (if enforcement)
    - `openCases.config.json` (if enforcement)
    - `enforcement.config.json` (if enforcement)
    - `inspections.config.json` (if enforcement)
17. Apply: Create install service at `compliagov/packages/server/app/services/installs/<market>.server.service.js`
18. Apply: Create server config at `compliagov/packages/server/config/installs/<market>/<market>.all.json`
19. Apply: Create email template directories

### For Email Templates:
1. Ask: Which market?
2. Ask: Workflow type? (e.g. "AL-AMCC-CCR")
3. Ask: Which email types needed? (received, approved, rejected, denied, restarted, resubmitted, deactivated, reactivated, expired, expiring, internal-review-approve, transferredTo, transferredFrom)
4. Ask: Email subject prefix? (e.g. "AMCC New Business License Application")
5. Ask: Copy from existing workflow/market? (y/n)
6. Apply: Create template directory and HTML files at `emails/government/<market>/toApplicants/<WORKFLOW>/`

### For Cloning Setup:
1. Ask: Which market?
2. Ask: Primary workflow file? (e.g. "mo-mba")
3. Ask: Which secondary workflows clone from it? (e.g. ["MO-MBU", "MO-MBR", "MO-PMBU"])
4. Ask: Properties to exclude from cloning?
5. Ask: Any per-workflow exclusions? (e.g. delete licenseExpiryDate for renewals)
6. Apply: Add/update `formatToExposeExternally` method in the primary service file

### For Inspections / Enforcement:
1. Ask: Which market?
3. Ask: Inspection provider? (OTG / built-in)
4. Ask: Case management needed? (y/n)
5. Ask: Which workflows trigger enforcement?
6. Ask: Inspection columns? (default: Status, Inspection ID, Account, License Number, Date Initiated)
7. Ask: Case columns? (default: Priority, Case ID, Account, License Number, Name, Step)
8. Apply: Create/update inspection and case config files
9. Apply: Enable enforcement widget in leftnav config
10. Apply: Update server config with inspections config if OTG

### For Dashboard:
1. Ask: Which market?
3. Ask: Which widgets? (Completed Tasks by Type / Open Tasks by Assignment / Task Duration)
4. Ask: Default workflow for pie charts? (e.g. "MO-NPR")
5. Ask: Period unit for duration chart? (quarter/month/week)
6. Apply: Create/update dashboard config

### For Organization Config (full setup - only for new markets or major changes):
1. Ask: Which market?
2. Ask: Account types? (Individual / Business / Both)
3. Ask: Organization list columns? (Name, Type, Email, Phone)
4. Ask: Organization list filters? (Name, Account Type, SSN)
5. Ask: Detail tabs? (General Info, Pending Applications, workflow-specific record tabs)
6. For each workflow tab:
   - Ask: Tab display name?
   - Ask: Workflow type filter? (e.g. "MO-MBA")
   - Ask: Account type? (Individual/Business/all)
   - Ask: Table columns for that tab?
7. Apply: Create/update organization config files

### For Record Search:
1. Ask: Which market?
3. Ask: Table columns? (default: Status, Application ID, Title, Application Type, License Number)
4. Ask: Filters? (Application Type, Status, Flag Type, Filing Source, Application ID, License Number, Name, etc.)
5. Ask: Property search enabled? (y/n)
6. If yes: Ask which application types have property filters and what fields
7. Apply: Create/update record search config

### For Invoices:
1. Ask: Which market?
3. Ask: Invoice list columns? (default: Status, Invoice ID, Title, Account, Date Initiated)
4. Ask: Filters? (Invoice ID, Status, Type, Date, Account, Associated Entity)
5. Ask: Invoice details form needed? (provide form.io JSON)
6. Apply: Create/update invoice config files

### For Transfers:
1. Ask: Which market?
3. Ask: Transfer list columns? (default: Status, Transfer ID, License Type, License Number, Date Initiated)
4. Ask: Filters? (Transfer ID, Status, License Number)
5. Apply: Create/update transfer config files

### For Application List:
1. Ask: Which market?
3. Ask: Default statuses to show? (e.g. ["Open", "Rejected"])
4. Ask: Heading? (default: "Applications")
5. Ask: Columns? (default: Record ID, Title, Status, Application Type, Account)
6. Ask: Filters? (Record ID, Account)
7. Apply: Create/update application list config

### For Install Service:
1. Ask: Which market?
2. Ask: Timezone? (e.g. "US/Central", "US/Eastern", "Pacific/Honolulu")
3. Ask: EDIT_EXP_DATE_ALLOW_FUTURE_DT? (true/false)
4. Ask: showCountyCode? (true/false)
5. Ask: shouldSendEmail configuration? (which email types to enable)
6. Ask: getEmailSubject format? (uses processDefinitionName)
7. Ask: Custom dropdowns? (states, counties)
8. Ask: Any custom operations? (e.g. auto-deactivate, batch jobs)
9. Apply: Create `<market>.server.service.js` in installs directory

## Configuration Reference

### Blue Service File Structure (Primary Workflow):
```js
const _ = require("lodash");
const { promisify } = require("util");
const mongoose = require("mongoose");
const Record = mongoose.model("Record");
const logger = require("../../utils/logger");
const recordsService = require("../records.server.service");

// ═══════════════════════════════════════════════════════════════
// REQUIRED EXPORTS
// ═══════════════════════════════════════════════════════════════

exports.canGeocode = false;

exports.workflowKeyMapping = {
  record: {
    addresses: {
      primary: {
        address1: "properties.physicalStreet",       // or "properties.facilityStreet"
        address2: "properties.physicalUnitNoAptNo",  // optional
        city: "properties.physicalCity",
        state: "properties.physicalState",
        zipCode: "properties.physicalZipCode",
      },
    },
  },
};

// Option A: structured title field
exports.getApplicationTitleField = function (data) {
  return {
    key: "properties.genInfoLegalEntityName",  // or "properties.genInfoFirstName,properties.genInfoLastName"
    separator: "",  // "" for single field, " " for multi-field
  };
};
// Option B: template string (used in some markets)
// exports.applicationTitleMap = "${properties.genInfoApplicantName}";

exports.getBadgePhotoDocTypeName = function () {
  return null;  // or "Badge Photo" if badge photos are required
};

// ═══════════════════════════════════════════════════════════════
// PRIMARY-ONLY EXPORTS (not used in secondary workflows)
// ═══════════════════════════════════════════════════════════════

exports.RENEWAL_RECORD = "AL-ABC-BLR"; // optional: associated renewal workflow type

exports.subLicPropName = "licenseTypeList"; // optional: property name for sub-licenses

// ═══════════════════════════════════════════════════════════════
// CLONING - formatToExposeExternally (Primary Only)
// Defines how license data is formatted when cloned into secondary workflows
// ═══════════════════════════════════════════════════════════════
const propsToExclude = [
  // Transaction/Payment fields
  "transactionId", "transactionToken", "transactionAmount", "paymentMethod", "paymentStatus",
  // Record metadata
  "recordId", "recordVersion", "version", "errorMessage", "outcome",
  "isSkipErrorStep", "errorCode", "filingSource",
  // Email notification flags
  "receivedEmailSent", "rejectEmailSent", "approveEmailSent", "denyEmailSent",
  "approve_errorListenerEmailType", "approve_errorListenerActivityId", "approve_errorListenerErrorMessage",
  "reject_errorListenerEmailType", "reject_errorListenerActivityId", "reject_errorListenerErrorMessage",
  "deny_errorListenerEmailType", "deny_errorListenerActivityId", "deny_errorListenerErrorMessage",
  "received_errorListenerEmailType", "received_errorListenerActivityId", "received_errorListenerErrorMessage",
  // Signature/PDF fields
  "signature", "signatureDate-dt",
  // Workflow-specific exclusions (add as needed)...
];

exports.formatToExposeExternally = function (data, callback) {
  const formattedLicense = {};
  if (["AL-ABC-BLU", "AL-ABC-BLR"].includes(data.formatType)) {
    formattedLicense.properties = {};
    _.forIn(data.license.properties, (value, key) => {
      if (!propsToExclude.includes(key)) {
        formattedLicense.properties[key] = value;
      }
    });
    // Optional: per-workflow exclusion (e.g. remove expiry for renewals)
    if (data.formatType === "AL-ABC-BLR") {
      delete formattedLicense.properties["licenseExpiryDate-dt"];
    }
  }
  callback(null, formattedLicense);
};

// ═══════════════════════════════════════════════════════════════
// LICENSE NUMBER GENERATION (Primary Only - on approval)
// ═══════════════════════════════════════════════════════════════
exports.generateLicenseNumber = async function (record, identity) {
  const methodName = "generateLicenseNumber";
  logger.logInfo("method starts", __filename, methodName);
  const getNextSequence = promisify(recordsService.getNextSequence);
  const seq = await getNextSequence({
    tenantId: identity.tenantId,
    sequenceType: "licenseNumber",
    recordType: record.recordType,
  });
  return `${record.recordType}-${String(seq).padStart(6, "0")}`;
};

// ═══════════════════════════════════════════════════════════════
// LICENSE EXPIRY DATE GENERATION (Primary Only - on approval)
// ═══════════════════════════════════════════════════════════════
exports.generateLicenseExpiryDate = async function (record, identity) {
  const moment = require("moment-timezone");
  return moment().add(1, "year").format("MM/DD/YYYY");
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT CALCULATION (if applicable)
// ═══════════════════════════════════════════════════════════════
exports.calculatePayment = async function (record) {
  const lineItems = [];
  lineItems.push({ description: "Application Fee", amount: 500.00 });
  return { totalAmount: 500.00, lineItems };
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION (before submission)
// ═══════════════════════════════════════════════════════════════
exports.validateRecord = async function (data, callback) {
  const methodName = "validateRecord";
  logger.logInfo("method starts", __filename, methodName);
  const { recordData, organization } = data;
  try {
    // Custom validations (e.g. check for duplicate applications)
    callback(null, { message: "Success" });
  } catch (err) {
    callback(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// EMAIL CONFIGURATION
// ═══════════════════════════════════════════════════════════════
exports.getEmailSubject = function (data) {
  let subject = "ABC New Business License ";
  switch (data.emailType) {
    case "approve": subject += "Approved"; break;
    case "received": subject += "Submitted"; break;
    case "reject": subject += "Returned for Correction"; break;
    case "deny": subject += "Denied"; break;
    case "restart": subject += "Under Further Review"; break;
    case "deactivate": subject += "Deactivated"; break;
    case "reactivate": subject += "Reactivated"; break;
    case "expired": subject += "Expired"; break;
    case "expiring": subject += "Expiring Soon"; break;
    default:
  }
  return subject;
};

exports.shouldSendEmail = function (data) {
  return true; // or conditional logic based on data.emailType / data.record
};

// ═══════════════════════════════════════════════════════════════
// DEPENDENT LICENSE MANAGEMENT (Primary Only)
// Modify child/sub-licenses when parent status changes
// ═══════════════════════════════════════════════════════════════
exports.modifyDependentLicenses = async function (data, identity) {
  const methodName = "modifyDependentLicenses";
  logger.logInfo("method starts", __filename, methodName);
  // e.g. When parent is deactivated, deactivate all child licenses
  // When parent is reactivated, reactivate child licenses
};

// ═══════════════════════════════════════════════════════════════
// VERIFICATION FIELD MAPPING (Primary Only - for external systems)
// ═══════════════════════════════════════════════════════════════
exports.mapVerificationFields = async function (record) {
  return {
    licenseeFullName: record.properties.genInfoLegalEntityName,
    licenseNumber: record.licenseNumber,
    licenseType: record.recordType,
    status: record.status,
    expiryDate: record.licenseExpiryDate,
  };
};

// ═══════════════════════════════════════════════════════════════
// OWNERS ASSOCIATION (cross-reference SSN/FEIN across records)
// ═══════════════════════════════════════════════════════════════
exports.getOwnersAssociationQuery = (record) => {
  const orQuery = [];
  const recordType = "AL-ABC-NBL";
  if (record && record.properties.ownershipDataGrid) {
    for (const poi of record.properties.ownershipDataGrid) {
      if (poi.ownerSocialNumber) {
        orQuery.push({ ownerSocialNumber: poi.ownerSocialNumber });
      }
    }
  }
  const groupKeys = { SSNorFein: "$properties.ownershipDataGrid.ownerSocialNumber" };
  return { orQuery, recordType, groupKeys };
};

exports.ownersAssociationAlert = async function (record) {
  // Return alert messages for duplicate owner associations
  return [];
};

// ═══════════════════════════════════════════════════════════════
// EXPIRING LICENSE EMAIL FILTER (Primary Only)
// ═══════════════════════════════════════════════════════════════
exports.sendLicenseExpiringEmailFilter = async function (record) {
  // Return true/false whether to send expiring email for this record
  return record.status === recordsService.RECORD_STATUS.APPROVED;
};

// ═══════════════════════════════════════════════════════════════
// ACTION RESTRICTIONS
// ═══════════════════════════════════════════════════════════════
exports.isActionAllowed = function (data, callback) {
  // Validate if certain actions (deactivate, reactivate) are allowed
  callback(null, { allowed: true });
};

// ═══════════════════════════════════════════════════════════════
// LINKED INFO (load related license data for display)
// ═══════════════════════════════════════════════════════════════
exports.loadLinkedInfo = async function (populatedResult) {
  // Attach related license information to the record for display
  return populatedResult;
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM JOBS (optional - add only as needed)
// ═══════════════════════════════════════════════════════════════
exports.doPostProcessCustomJobs = function (data, identity, callback) {
  // After application submission (e.g. flag license as having pending update)
  callback();
};

exports.doPostUpdateStatusCustomJobs = function (data, identity, callback) {
  // After status change/approval (e.g. unflag license)
  callback();
};

exports.doPreUpdateStatusCustomJobs = async function (record) {
  // Before status change (async)
};

exports.doPreMinorEditCustomJobs = function (data, identity, callback) {
  // Before minor edit (e.g. update license number reference)
  callback();
};

exports.doPostMinorEditCustomJobs = function (data, identity, callback) {
  // After minor edit (e.g. reflag new license)
  callback();
};

exports.performOpsBeforeManualSubmitingApp = function (record, changedData) {
  // Before manual submit (e.g. set license number from parent)
  return record;
};

exports.performOpsBeforeCreatingApp = function (data, callback) {
  // Before app creation (e.g. copy fields, setup defaults)
  callback(null, data);
};

exports.performOpsBeforeRecordUpdate = function (data, callback) {
  // Before record update
  callback(null, data);
};

exports.performCustomOperationDuringClone = function (data, callback) {
  // During record clone (customize cloned data)
  callback(null, data);
};

exports.preCustomJobsBeforeCleaning = function (record) {
  // Validation before record can be archived - return error message or null
  return null;
};

exports.customizeCopiedRecord = function (record) {
  // Customize record during clone
  return record;
};
```
```

### Blue Service File Structure (Secondary Workflow):
```js
const _ = require("lodash");
const { promisify } = require("util");
const mongoose = require("mongoose");
const Record = mongoose.model("Record");
const logger = require("../../utils/logger");
const recordsService = require("../records.server.service");
const compliaUtils = require("../../controllers/complia.server.utils");

// ═══════════════════════════════════════════════════════════════
// REQUIRED EXPORTS
// ═══════════════════════════════════════════════════════════════

exports.canGeocode = false;

exports.workflowKeyMapping = {
  record: {
    addresses: {
      primary: {
        address1: "properties.physicalStreet",       // same as parent workflow
        address2: "properties.physicalUnitNoAptNo",
        city: "properties.physicalCity",
        state: "properties.physicalState",
        zipCode: "properties.physicalZipCode",
      },
    },
  },
};

exports.getApplicationTitleField = function () {
  return {
    key: "properties.genInfoLegalEntityName",
    separator: "",
  };
};

exports.getBadgePhotoDocTypeName = function () {
  return null;
};

// ═══════════════════════════════════════════════════════════════
// SECONDARY-ONLY EXPORTS (not used in primary workflows)
// ═══════════════════════════════════════════════════════════════

// REQUIRED: Returns parent workflow type code
exports.getParentRecordType = function (record) {
  return "AL-ABC-NBL";  // Must match parent primary workflow type
};

// REQUIRED: Extracts license number from the record
exports.getLicenseNumber = function (record) {
  return record.properties.genInfoLicenseNumber;
};

// REQUIRED: Update parent record when this secondary workflow is approved
exports.performUpdateOnParent = function (data, callback) {
  const propsToExclude = [
    // Transaction/Payment fields
    "transactionId", "transactionToken", "transactionAmount", "paymentMethod", "paymentStatus",
    // Record metadata
    "recordId", "recordVersion", "version", "errorMessage", "outcome", "filingSource",
    "isSkipErrorStep", "errorCode",
    // Email notification flags
    "receivedEmailSent", "rejectEmailSent", "approveEmailSent", "denyEmailSent",
    "approve_errorListenerEmailType", "approve_errorListenerActivityId", "approve_errorListenerErrorMessage",
    "reject_errorListenerEmailType", "reject_errorListenerActivityId", "reject_errorListenerErrorMessage",
    "deny_errorListenerEmailType", "deny_errorListenerActivityId", "deny_errorListenerErrorMessage",
    "received_errorListenerEmailType", "received_errorListenerActivityId", "received_errorListenerErrorMessage",
    // Signature/PDF fields
    "signature", "signatureDate-dt",
    // Form-specific checkboxes (add per-workflow)
    "licInfoTradeNameUpdate", "licInfoEmailPhoneChange", "licInfoTransferLocation",
    // Invoice fields
    "invoice-lineItems", "invoice-totalAmount",
  ];

  const changedParent = data.parentRecord.toObject();

  // Copy all non-excluded properties from child to parent
  _.forIn(data.record.properties, (value, key) => {
    if (!propsToExclude.includes(key)) {
      changedParent.properties[key] = value;
    }
  });

  // Optional: update top-level fields
  if (data.record.badgeNumber) {
    changedParent.badgeNumber = data.record.badgeNumber;
  }

  // Optional: update expiry date (for renewal workflows)
  // changedParent.licenseExpiryDate = data.record.licenseExpiryDate;
  // changedParent.properties["licenseExpiryDate-dt"] = new Date(data.record.licenseExpiryDate);

  // Optional: set parent status back to approved
  // changedParent.status = recordsService.RECORD_STATUS.APPROVED;

  callback(null, changedParent);
};

// ═══════════════════════════════════════════════════════════════
// VALIDATION (REQUIRED - before submission)
// Secondary workflows typically validate:
// 1. No duplicate in-progress secondary workflow for same license
// 2. Parent license exists and is in valid status (Approved)
// ═══════════════════════════════════════════════════════════════
exports.validateRecord = async function (data, callback) {
  const methodName = "validateRecord";
  logger.logInfo("method starts", __filename, methodName);
  const { recordData, organization } = data;
  const { RECORD_STATUS } = recordsService;
  const listRecords = promisify(recordsService.list);

  try {
    // Filter 1: Check for duplicate in-progress secondary workflows
    const duplicateFilter = {
      tenantId: organization.system.tenantId,
      organizationIds: [organization._id],
      isLatestVersion: true,
      recordTypes: ["AL-ABC-BLU", "AL-ABC-BLR"],  // sibling secondary workflow types
      properties: { genInfoLicenseNumber: recordData.properties.genInfoLicenseNumber },
      sortValues: "system.dateCreated",
      changeResponseDates: true,
    };

    // Filter 2: Validate parent license status
    const parentFilter = {
      tenantId: organization.system.tenantId,
      organizationIds: [organization._id],
      isLatestVersion: true,
      recordTypes: ["AL-ABC-NBL"],  // parent workflow type
      statuses: [RECORD_STATUS.APPROVED],
      licenseNumber: recordData.properties.genInfoLicenseNumber,
      sortValues: "system.dateCreated",
      changeResponseDates: false,
    };

    const [duplicates, parentRecords] = await Promise.all([
      listRecords(duplicateFilter),
      listRecords(parentFilter),
    ]);

    // Check 1: Reject if there's already an in-progress update/renewal
    const inProgressStatuses = ["Open", "Submitted", "Processing", "Rejected"];
    const hasInProgress = duplicates.records && duplicates.records.some(
      (r) => inProgressStatuses.includes(r.status) && r._id.toString() !== recordData._id.toString()
    );
    if (hasInProgress) {
      return callback(null, {
        message: "There is already an in-progress update or renewal for this license.",
        isValid: false,
      });
    }

    // Check 2: Reject if parent license is not Approved
    if (!parentRecords.records || parentRecords.records.length === 0) {
      return callback(null, {
        message: "No approved parent license found for this license number.",
        isValid: false,
      });
    }

    callback(null, { message: "Success" });
  } catch (err) {
    callback(err);
  }
};

// ═══════════════════════════════════════════════════════════════
// OPTIONAL: License expiry date generation (for Renewal workflows)
// ═══════════════════════════════════════════════════════════════
exports.generateLicenseExpiryDate = async function (record) {
  const moment = require("moment-timezone");
  // Option A: 1 year from current expiry
  // return moment(record.licenseExpiryDate).add(1, "year").format("MM/DD/YYYY");
  // Option B: 1 year from approval date
  return moment().add(1, "year").format("MM/DD/YYYY");
};

// ═══════════════════════════════════════════════════════════════
// OPTIONAL: Parent business license dependency
// ═══════════════════════════════════════════════════════════════
exports.getParentBusinessLicenseType = function () {
  return null;  // or "AL-ABC-NBL" if this license depends on a business license
};

exports.isLicDependentOnBusinessLic = function () {
  return false;  // true if this license is dependent on a business license
};

// ═══════════════════════════════════════════════════════════════
// EMAIL CONFIGURATION
// ═══════════════════════════════════════════════════════════════
exports.getEmailSubject = function (data) {
  let subject = "ABC Business License Update ";
  switch (data.emailType) {
    case "approve": subject += "Approved"; break;
    case "received": subject += "Submitted"; break;
    case "reject": subject += "Returned for Correction"; break;
    case "deny": subject += "Denied"; break;
    case "restart": subject += "Under Further Review"; break;
    default:
  }
  return subject;
};

exports.shouldSendEmail = function (data) {
  return true;
};

// ═══════════════════════════════════════════════════════════════
// ACTION RESTRICTIONS
// ═══════════════════════════════════════════════════════════════
exports.isActionAllowed = function (data, callback) {
  // e.g. prevent deactivation if parent is already deactivated
  callback(null, { allowed: true });
};

// ═══════════════════════════════════════════════════════════════
// OWNERS ASSOCIATION (cross-reference SSN/FEIN across records)
// ═══════════════════════════════════════════════════════════════
exports.getOwnersAssociationQuery = (record) => {
  const orQuery = [];
  const recordType = "AL-ABC-NBL";  // search parent record type
  if (record && record.properties.ownershipDataGrid) {
    for (const poi of record.properties.ownershipDataGrid) {
      if (poi.ownerSocialNumber) {
        orQuery.push({ ownerSocialNumber: poi.ownerSocialNumber });
      }
    }
  }
  const groupKeys = { SSNorFein: "$properties.ownershipDataGrid.ownerSocialNumber" };
  return { orQuery, recordType, groupKeys };
};

exports.ownersAssociationAlert = async function (record) {
  return [];
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM JOBS (optional - add only as needed)
// ═══════════════════════════════════════════════════════════════
exports.doPreCustomJobs = function (data, identity, callback) {
  // Custom jobs before other operations
  callback();
};

exports.doPostProcessCustomJobs = function (data, identity, callback) {
  // After application submission (e.g. flag parent license as having pending update)
  callback();
};

exports.doPostUpdateStatusCustomJobs = function (data, identity, callback) {
  // After status change/approval (e.g. unflag parent license)
  callback();
};

exports.performOpsBeforeCreatingApp = function (data, callback) {
  // Before app creation
  callback(null, data);
};

exports.performOpsBeforeRecordUpdate = function (data, callback) {
  // Before record update
  callback(null, data);
};

exports.performOpsBeforeManualSubmitingApp = function (record, changedData) {
  // Before manual submit (e.g. set license number from parent)
  return record;
};

exports.performCustomOperationDuringClone = function (data, callback) {
  // During record clone
  callback(null, data);
};
```

### Install Service File Structure:
```js
const _ = require("lodash");
const mongoose = require("mongoose");
const { promisify } = require("util");
const logger = require("../../utils/logger");

exports.timezone = "US/Central";

exports.EDIT_EXP_DATE_ALLOW_FUTURE_DT = true;

exports.showCountyCode = true;

exports.shouldSendEmail = function (data) {
  const { record } = data;
  const sendEmailObject = {
    "approve": true,
    "internal-review-approve": true,
    "reject": true,
    "deny": true,
    "received": true,
    "restart": true,
    "resubmit": true,
    "deactivate": true,
    "reactivate": true,
    "expired": true,
    "expiring": true,
    "transferredTo": true,
    "transferredFrom": true,
  };
  const sendEmail = sendEmailObject[data.emailType] || false;
  return sendEmail;
};

exports.getEmailSubject = function (data) {
  let subject = `AMCC ${data.processDefinitionName} Application `;
  switch (data.emailType) {
    case "approve": subject += "Update"; break;
    case "reject": subject += "Update"; break;
    case "deny": subject += "Update"; break;
    case "deactivate": subject += "Deactivated"; break;
    case "reactivate": subject = "Reactivated"; break;
    case "received": subject += "Submitted"; break;
    case "resubmit": subject += "Resubmitted"; break;
    case "restart": subject += "Update"; break;
    case "expired": subject += "expired"; break;
    case "expiring": subject += "expiring soon"; break;
    case "transferredTo": subject = "A license has been transferred to your account"; break;
    case "transferredFrom": subject = "A license has been transferred from your account"; break;
    default:
  }
  return subject;
};
```

### Server Config Structure (<market>.all.json):
```json
{
  "installType": "gov",
  "maxTenants": 1,
  "architecturalSwitches": { "singleWarFile": false },
  "app": {
    "help": { "email": "nlssupport-<market>@tylertech.com", "compliaEmail": "nlssupport-<market>@tylertech.com" },
    "programName": "Agency Full Name",
    "programAbbreviation": "ABBR",
    "programUrl": "https://agency.gov/"
  },
  "aws": { "awsRegion": "us-east-1", "buckets": { "shared": { "useDefaultCredentials": true, "awsRegion": "us-east-1" } } },
  "apiGateway": { "endPoints": { "requestQueue": { "gov": "/v1/requestqueue/gov", "public": "/v1/requestqueue/public" } } },
  "seedToSale": { "vendor": "metrc", "baseUrl": "...", "configs": { "MARKET-WF": { "uri": "/endpoint", "apiKey_enc": "..." } } },
  "printExport": { "batchSize": 100, "stagingPathPrefix": "print-export/staging", "delimiter": "default" },
  "ldap": { "passwordHash": "SHA-512" },
  "inspectionsConfig": { "default": "otg", "otg": { "apiEndpoints": { ... } } },
  "nicMsp": { "baseUrl": "...", "clientId": "...", "userPoolId": "...", "identityProvider": 170 }
}
```

### Application Config Entry (application.config.json / coreApplication.json):
```json
{
  "applicationType": "MO-PMBU",
  "cloneOnCreate": true,
  "saveOnCreate": false,
  "displayName": "Partial Microbusiness Update",
  "isLicense": false,
  "submitAction": "new",
  "tableHeaders": [
    { "systemName": "applicationFormId", "displayName": "Application ID", "sortBy": "applicationFormId", "isSortable": true, "type": "link" },
    { "systemName": "formProperties.genInfoLegalEntityName", "displayName": "Name", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "status", "displayName": "Status", "sortBy": "status", "isSortable": true, "type": "text" },
    { "systemName": "applicationType", "displayName": "Application Type", "sortBy": "applicationType", "isSortable": true, "type": "applicationType" },
    { "systemName": "dateSubmitted", "displayName": "Submitted Date", "sortBy": "dateSubmitted", "isSortable": true, "type": "date", "defaultSort": true }
  ]
}
```

### Applications Search List (applications.searchList.config.json):
```json
{
  "defaultStatus": ["Open", "Paid", "Processing", "Submitted", "Rejected"],
  "heading": "Applications",
  "columns": [
    { "systemName": "recordId", "displayName": "Record ID", "sortBy": "recordId", "isSortable": true, "type": "link" },
    { "systemName": "title", "displayName": "Title", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "status", "displayName": "Status", "sortBy": "status", "isSortable": true, "type": "text" },
    { "systemName": "recordType", "displayName": "Application Type", "sortBy": "recordType", "isSortable": true, "type": "applicationType" },
    { "systemName": "organizationName", "displayName": "Account", "isSortable": false, "type": "text" },
    { "systemName": "action", "displayName": "Actions", "sortBy": "", "isSortable": false, "type": "elem" }
  ],
  "filters": {
    "common": [
      { "label": "Record ID", "filterId": "filterRecordId", "field": "recordId", "type": "input", "mask": "9999", "visible": true, "disabled": false },
      { "label": "Account", "filterId": "filterAccount", "field": "organizationId", "type": "autocomplete", "visible": true, "disabled": false, "url": "api/organizations", "defaultQueryKey": "id", "queryKey": "name", "defaultParams": { "assignee": "all", "limit": 25, "page": 1, "sort": "name", "enabled": "properties" }, "optionsMap": { "value": "_id", "label": "name" } }
    ],
    "propertySearch": false
  },
  "statusModel": ["Open", "Processing", "Paid", "Submitted", "Returned for Correction", "Approved", "Denied"]
}
```

### Left Nav Entry (navigation.config.json):
```json
{
  "navLevel": 2,
  "systemName": "partial-microbusiness-update",
  "displayName": "Partial Microbusiness Update",
  "hasSubNav": true,
  "isServerManaged": true,
  "isWorkflow": true,
  "permissions": ["MO_PMBU_PROCESS"],
  "workflow": {
    "id": "MO-PMBU",
    "title": "Partial Microbusiness Update",
    "active": true,
    "count": 0,
    "sla": { "red": 14, "yellow": 7 },
    "historyTitle": ["genInfoLegalEntityName"],
    "steps": [
      { "id": "application-verification", "title": "Application Verification", "stepName": "Application Verification", "count": 0, "permissions": ["TASK_ADMIN", "EDIT_TASK", "VIEW_TASK"] },
      { "id": "supervisor-approval", "title": "Supervisor Approval", "stepName": "Supervisor Approval", "count": 0, "permissions": ["TASK_ADMIN", "EDIT_TASK", "VIEW_TASK"] },
      { "id": "reject", "title": "Return for Correction", "stepName": "Reject", "count": 0, "permissions": ["TASK_ADMIN", "EDIT_TASK", "VIEW_TASK"] }
    ]
  },
  "hasIcon": true,
  "icon": "circle"
}
```

### Dashboard Config:
```json
{
  "type": "dashboard-main",
  "title": "Dashboard",
  "widgets": [
    { "title": "Completed Tasks by Type", "systemName": "completedTaskCount", "isWorkflowSpecific": true, "type": "pieChart", "width": "50", "defaultParams": { "processDefKey": "MO-NPR" } },
    { "title": "Open Tasks by Assignment", "systemName": "uncompletedTaskCount", "isWorkflowSpecific": true, "type": "pieChart", "width": "50", "defaultParams": { "processDefKey": "MO-NPR" } },
    { "title": "Task Duration", "systemName": "taskDurationStats", "isWorkflowSpecific": false, "type": "multiBarChart", "width": "100", "defaultParams": { "periodUnit": "quarter" } }
  ]
}
```

### Build Config (build.config.json):
```json
{
  "title": "Alabama Regulator Portal",
  "background": "/dist/images/brand/al-amcc/al-amcc-background.jpg",
  "logoText": "Alabama Medical Cannabis Commission",
  "loginCardTitle": "Alabama AMCC Portal",
  "licensingEntity": "Tyler Cannabis Licensing",
  "copyrightText": "State of Alabama",
  "supportEmail": "nlssupport-al-mcc@tylertech.com",
  "portalLink": "https://amcc.alabama.gov"
}
```

### Auth Config (auth.config.json):
```json
{
  "termsAndConditionChecked": true
}
```

### Invoice List Config (invoice.list.config.json):
```json
{
  "columns": [
    { "systemName": "status", "displayName": "Status", "sortBy": "status", "isSortable": true, "type": "text" },
    { "systemName": "invoiceId", "displayName": "Invoice ID", "sortBy": "invoiceId", "isSortable": true, "type": "link" },
    { "systemName": "properties.title", "displayName": "Title", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "organizationName", "displayName": "Account", "sortBy": "organizationName", "isSortable": false, "type": "text" },
    { "systemName": "dateInitiated", "displayName": "Date Initiated", "sortBy": "dateInitiated", "isSortable": true, "type": "date" }
  ],
  "filters": {
    "common": [
      { "label": "Invoice ID", "filterId": "filterInvoiceId", "field": "invoiceId", "type": "input", "mask": "9999", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Status", "filterId": "filterStatus", "field": "status", "type": "select", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Type", "filterId": "filterType", "field": "type", "type": "select", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Date Initiated", "filterId": "filterDateInitiated", "field": "dateInitiated", "type": "date", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Account", "filterId": "filterAccount", "field": "organizationId", "type": "autocomplete", "visible": true, "disabled": false, "url": "api/organizations", "defaultQueryKey": "id", "queryKey": "name", "optionsMap": { "value": "_id", "label": "name" } }
    ]
  }
}
```

### Transfer List Config (transfer.list.config.json):
```json
{
  "columns": [
    { "systemName": "status", "displayName": "Status", "sortBy": "status", "isSortable": true, "type": "text" },
    { "systemName": "transferReqId", "displayName": "Transfer ID", "sortBy": "transferReqId", "isSortable": true, "type": "link" },
    { "systemName": "licenseType", "displayName": "License Type", "sortBy": "", "isSortable": false, "type": "applicationType" },
    { "systemName": "licenseNumber", "displayName": "License Number", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "dateSubmitted", "displayName": "Date Initiated", "sortBy": "dateSubmitted", "isSortable": true, "type": "date" }
  ],
  "filters": {
    "common": [
      { "label": "Transfer ID", "filterId": "filterTransferId", "field": "transferId", "type": "input", "mask": "9999", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Status", "filterId": "filterStatus", "field": "status", "type": "select", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "License Number", "filterId": "filterLicenseNumber", "field": "licenseNumber", "type": "input", "visible": true, "disabled": false, "defaultValues": "" }
    ]
  }
}
```

### Case List Config (caseList.config.json):
```json
{
  "tableHeaders": [
    { "systemName": "recordId", "displayName": "Case ID", "sortBy": "recordId", "isSortable": true, "type": "link" },
    { "systemName": "organizationName", "displayName": "Account", "sortBy": "organizationName", "isSortable": true, "type": "text" },
    { "systemName": "licenseNumber", "displayName": "Business License Number", "sortBy": "licenseNumber", "isSortable": true, "type": "text" },
    { "systemName": "title", "displayName": "Name", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "dateCompleted", "displayName": "Date Completed", "sortBy": "dateCompleted", "isSortable": true, "type": "date" }
  ],
  "openCaseTableHeaders": [
    { "systemName": "statusCode", "displayName": "Priority", "isSortable": false, "type": "graphic" },
    { "systemName": "recordId", "displayName": "Case ID", "sortBy": "recordId", "isSortable": true, "type": "link" },
    { "systemName": "organizationName", "displayName": "Account", "sortBy": "organizationName", "isSortable": true, "type": "text" },
    { "systemName": "licenseNumber", "displayName": "Business License Number", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "title", "displayName": "Name", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "stepLabel", "displayName": "Step", "sortBy": "", "isSortable": false, "type": "text" }
  ],
  "filterConfig": {
    "common": [
      { "label": "Case ID", "filterId": "filterRecordId", "field": "recordId", "type": "text", "visible": true, "disabled": false },
      { "label": "Business License Number", "filterId": "filterLicenseNumber", "field": "licenseNumber", "type": "text", "visible": true, "disabled": false },
      { "label": "Account", "filterId": "filterAccount", "field": "organizationId", "type": "autocomplete", "visible": true, "disabled": false }
    ],
    "propertySearch": false
  }
}
```

### Enforcement Config - React (enforcement.config.json):
```json
{
  "inspectionsTableHeaders": [
    { "systemName": "inspectionId", "displayName": "Inspection ID", "sortBy": "", "isSortable": false, "type": "link" },
    { "systemName": "name", "displayName": "Name", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "dateCreated", "displayName": "Date Initiated", "sortBy": "", "isSortable": false, "type": "date" }
  ],
  "openCasesTableHeaders": [
    { "systemName": "caseId", "displayName": "Case ID", "sortBy": "", "isSortable": false, "type": "elem" },
    { "systemName": "name", "displayName": "Step", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "created", "displayName": "Date Created", "sortBy": "", "isSortable": false, "type": "date" }
  ],
  "closedCasesTableHeaders": [
    { "systemName": "caseId", "displayName": "Case ID", "sortBy": "", "isSortable": false, "type": "elem" },
    { "systemName": "dateSubmitted", "displayName": "Date Created", "sortBy": "", "isSortable": false, "type": "date" },
    { "systemName": "dateCompleted", "displayName": "Date Completed", "sortBy": "", "isSortable": false, "type": "date" }
  ]
}
```

### Open Cases Config - React (openCases.config.json):
```json
{
  "title": "Open Cases",
  "columns": [
    { "systemName": "statusCode", "displayName": "Priority", "isSortable": false, "type": "elem" },
    { "systemName": "properties.recordId", "displayName": "Case ID", "sortBy": "properties.recordId", "isSortable": true, "type": "link", "linkTo": "/workflow/:processDefinitionKey/process/:processInstanceId/task/:id" },
    { "systemName": "properties.organizationName", "displayName": "Account", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "properties.genInfoLicenseNumber", "displayName": "Business License Number", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "properties.signature", "displayName": "Name", "sortBy": "", "isSortable": false, "type": "text" },
    { "systemName": "stepLabel", "displayName": "Step", "sortBy": "", "isSortable": false, "type": "stepLabel" },
    { "systemName": "action", "displayName": "Actions", "sortBy": "", "isSortable": false, "type": "elem", "align": "center" }
  ],
  "filters": {
    "common": [
      { "label": "Case ID", "filterId": "filterRecordId", "field": "properties.recordId", "type": "input", "mask": "999999", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Assignee", "filterId": "filterAssignee", "field": "assignee", "type": "autocomplete", "visible": true, "disabled": false, "url": "api/tenantUsers", "defaultQueryKey": "email", "queryKey": "title", "defaultParams": { "limit": 20, "page": 1, "sort": "name" }, "optionsMap": { "value": "userName", "label": "firstName,lastName" } },
      { "label": "Account", "filterId": "filterAccount", "field": "properties.organizationId", "type": "autocomplete", "visible": true, "disabled": false, "url": "api/organizations", "defaultQueryKey": "id", "queryKey": "name", "defaultParams": { "assignee": "all", "limit": 25, "page": 1, "sort": "name", "enabled": "properties" }, "optionsMap": { "value": "_id", "label": "name" } },
      { "label": "Pending at", "filterId": "filterTaskDefKey", "field": "taskDefinitionKey", "type": "select", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Business License Number", "filterId": "filterGenInfoLicenseNumber", "field": "properties.genInfoLicenseNumber", "type": "input", "visible": true, "disabled": false, "defaultValues": "" }
    ],
    "propertySearch": false
  }
}
```

### All Tasks Config - React (allTasks.config.json):
```json
{
  "columns": [
    { "systemName": "statusCode", "displayName": "Priority", "isSortable": false, "type": "elem" },
    { "systemName": "processInstanceId", "displayName": "Submit ID", "isSortable": true, "type": "link", "linkTo": "/workflow/:processDefinitionKey/process/:processInstanceId/task/:id" },
    { "systemName": "properties.signature", "displayName": "Title", "isSortable": false, "type": "text" },
    { "systemName": "processDefinitionName", "displayName": "Process", "isSortable": true, "type": "text" },
    { "systemName": "stepLabel", "displayName": "Step", "isSortable": false, "type": "stepLabel" },
    { "systemName": "assignee", "displayName": "Assignee", "isSortable": true, "type": "text" },
    { "systemName": "action", "displayName": "Actions", "isSortable": false, "type": "elem" }
  ],
  "filters": {
    "common": [
      { "label": "Record Id", "filterId": "filterRecordId", "field": "processInstanceId", "type": "input", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Assignee", "filterId": "filterAssignee", "field": "assignee", "type": "autocomplete", "visible": true, "disabled": false, "url": "api/tenantUsers", "defaultQueryKey": "email", "queryKey": "title", "defaultParams": { "limit": 20, "page": 1, "sort": "name" }, "optionsMap": { "value": "userName", "label": "firstName,lastName" } },
      { "label": "Process", "filterId": "filterProcess", "field": "processDefinitionKey", "type": "select", "visible": true, "disabled": false, "defaultValues": "", "reset": ["filterStep"] },
      { "label": "Step", "filterId": "filterStep", "field": "taskDefinitionKey", "type": "select", "visible": true, "disabled": false, "defaultValues": "", "conditional": { "when": "filterProcess" } }
    ]
  }
}
```

### My Tasks Config - React (myTasks.config.json):
```json
{
  "columns": [
    { "systemName": "statusCode", "displayName": "Priority", "isSortable": false, "type": "elem" },
    { "systemName": "processInstanceId", "displayName": "Submit ID", "isSortable": true, "type": "link", "linkTo": "/workflow/:processDefinitionKey/process/:processInstanceId/task/:id" },
    { "systemName": "properties.signature", "displayName": "Title", "isSortable": false, "type": "text" },
    { "systemName": "created", "displayName": "Created", "isSortable": true, "type": "date", "defaultSort": true },
    { "systemName": "processDefinitionName", "displayName": "Process", "isSortable": true, "type": "text" },
    { "systemName": "stepLabel", "displayName": "Step", "isSortable": false, "type": "stepLabel" },
    { "systemName": "action", "displayName": "Action", "isSortable": false, "type": "elem" }
  ],
  "filters": {
    "common": [
      { "label": "Record Id", "filterId": "filterRecordId", "field": "processInstanceId", "type": "input", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Process", "filterId": "filterProcess", "field": "processDefinitionKey", "type": "select", "visible": true, "disabled": false, "defaultValues": "", "reset": ["filterStep"] },
      { "label": "Step", "filterId": "filterStep", "field": "taskDefinitionKey", "type": "select", "visible": true, "disabled": false, "defaultValues": "", "conditional": { "when": "filterProcess" } }
    ]
  }
}
```

### Organization List Config - React (organization.list.config.json):
```json
{
  "columns": [
    { "systemName": "name", "displayName": "Name", "sortBy": "name", "isSortable": true, "type": "link", "linkTo": "/organizations/:_id" },
    { "systemName": "type", "displayName": "Type", "sortBy": "type", "isSortable": true, "type": "text" },
    { "systemName": "email", "displayName": "Email", "sortBy": "email", "isSortable": true, "type": "text" },
    { "systemName": "phone", "displayName": "Phone", "sortBy": "phone", "isSortable": true, "type": "text" },
    { "systemName": "action", "displayName": "Actions", "sortBy": "", "isSortable": false, "type": "elem" }
  ],
  "filters": {
    "common": [
      { "label": "Name", "filterId": "filterName", "field": "name", "type": "input", "visible": true, "disabled": false, "defaultValues": "" },
      { "label": "Account Type", "filterId": "filterType", "field": "type", "type": "select", "visible": true, "disabled": false, "defaultValues": "", "options": [{ "label": "Individual", "value": "Individual" }, { "label": "Business", "value": "Business" }] },
      { "label": "SSN", "filterId": "filterSsn", "field": "ssn", "type": "input", "visible": true, "disabled": false, "defaultValues": "" }
    ]
  }
}
```

### Organization Details Config - React (organization.details.config.json):
```json
{
  "displayType": "Accounts",
  "tabs": [
    { "displayName": "General Info", "type": "accountInfo", "isEnabled": true, "isVisible": true },
    {
      "displayName": "Pending Applications",
      "type": "records",
      "status": "Open",
      "workflow": "all",
      "filter": false,
      "isEnabled": true,
      "isVisible": true,
      "accountType": "all",
      "tableHeaders": [
        { "systemName": "recordId", "displayName": "Application Id", "sortBy": "recordId", "isSortable": true, "type": "text" },
        { "systemName": "title", "displayName": "Title", "sortBy": "title", "isSortable": false, "type": "text" },
        { "systemName": "recordTypeName", "displayName": "Application Type", "sortBy": "recordTypeName", "isSortable": true, "type": "text" },
        { "systemName": "status", "displayName": "Status", "sortBy": "status", "isSortable": true, "type": "text" }
      ]
    },
    {
      "displayName": "Business License",
      "type": "records",
      "status": "Completed",
      "workflow": "MO-MBA",
      "filter": true,
      "isEnabled": true,
      "isVisible": true,
      "accountType": "Business",
      "tableHeaders": [
        { "systemName": "recordId", "displayName": "Application Id" },
        { "systemName": "properties.genInfoLegalEntityName", "displayName": "Entity Name", "type": "text" },
        { "systemName": "licenseNumber", "displayName": "License No.", "type": "text" },
        { "systemName": "status", "displayName": "Status", "type": "text" },
        { "systemName": "licenseExpiryDate", "displayName": "Expiry Date", "type": "date" }
      ],
      "statusModel": ["Approved", "Denied", "Deactivated", "Expired"]
    }
  ]
}
```

### Email Template Structure:
```
emails/government/<market>/toApplicants/<WORKFLOW-TYPE>/
  ├── approved.html
  ├── received.html
  ├── rejected.html
  ├── denied.html
  ├── restarted.html
  ├── resubmitted.html
  ├── deactivated.html
  ├── reactivated.html
  ├── expired.html
  ├── expiring.html
  ├── internal-review-approve.html
  ├── transferredTo.html
  └── transferredFrom.html
```

### Email Template HTML Structure:
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head>
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <title>{{programAbbreviation}} {{body.applicationType}} Application Update</title>
</head>
<body>
  <!-- Template variables: {{programAbbreviation}}, {{body.applicationType}}, {{body.recordId}}, {{body.licenseNumber}}, {{body.title}} -->
</body>
</html>
```

## Key Differences Between Blue and Green:
| Aspect | Blue (compliagov) | Green (compliagov-public) |
|--------|-------------------|--------------------------|
| Property prefix | `properties.` | `formProperties.` |
| Record vs Application | Uses "record" terminology | Uses "application" terminology |
| Service file structure | More methods (validate, emailSubject, cloning, customJobs) | Simpler (getParent, getLicense, titleField, beforeSubmit) |
| Address mapping root | `record.addresses.primary` | `applicationForm.addresses.primary` |
| Navigation | Includes workflow steps with SLA | Simpler (no workflow steps in green nav) |
| Config split | React (public-react/regional) | React (public-react/regional) |
| Email templates | Per-workflow directories with multiple email types | Per-market stormpath/onboarding templates |
| Install service | Complex (timezone, emails, dropdowns, custom ops) | Simpler (states, counties) |

## Common Workflow Steps:
- `application-verification` - Initial review
- `photo-verification` - Photo/ID review
- `physician-review` - Physician/Condition review (medical markets)
- `supervisor-approval` - Supervisor sign-off
- `final-approval` - Final approval step
- `update-review` - Review for update workflows
- `reject` - Rejection/Return step

## Permission Naming Convention:
- Format: `{MARKET_CODE}_{SUFFIX}_PROCESS` (underscores, uppercased, hyphens removed from market)
- Examples: `MO_MBU_PROCESS`, `MO_NPR_PROCESS`, `AL_AMCC_CCR_PROCESS`

## Custom Jobs Methods (optional):
- `exports.doPostProcessCustomJobs` - After application submission (e.g. flag license)
- `exports.doPostUpdateStatusCustomJobs` - After status change/approval (e.g. unflag license)
- `exports.doPreMinorEditCustomJobs` - Before minor edit (e.g. update license number)
- `exports.doPostMinorEditCustomJobs` - After minor edit (e.g. reflag new license)
- `exports.performOpsBeforeManualSubmitingApp` - Before manual submit (e.g. set license number)
- `exports.flagLicense` / `exports.unflagLicense` - Flag/unflag license helpers
- `exports.customizeCopiedRecord` - Customize record during clone

## Important Rules

- Always confirm the market exists before proceeding (check `compliagov/packages/public-react/src/regional/`)
- Show the user what will be changed before applying
- Validate JSON after every file modification
- If a workflow already exists, ask before overwriting
- Blue service files use `properties.` prefix (NOT `formProperties.`)
- Blue service files use `record` in workflowKeyMapping (NOT `applicationForm`)
- Always add the permission to the parent category's permissions array in the navigation
- Use reject alias in step title if market has one configured (e.g. "Return for Correction" instead of "Reject")
- For new markets, copy structure from an existing similar market and modify
- Email templates use Handlebars syntax: `{{programAbbreviation}}`, `{{body.applicationType}}`, `{{body.recordId}}`
- React filters use `"filters"` key (not `"filterConfig"`)
- Environment-specific configs (.development.json, .qa.json, .production.json) override .all.json values
