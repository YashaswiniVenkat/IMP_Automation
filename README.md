# IMP_Automation

Automation scripts for CompliaGov Green workflow configuration.

## Quick Start

```bash
npm run workflow:setup
```

Interactive CLI to add/update primary and secondary workflows for any market.

## Documentation

- [GREEN_CONFIGURATION.md](GREEN_CONFIGURATION.md) — Full reference for primary/secondary workflows, licenses.json, navigation.config.json

## Scripts

| Script | Description |
|--------|-------------|
| `npm run workflow:setup` | Interactive CLI for adding/updating workflows |
| `scripts/green-workflow-config.mjs` | Programmatic API (import in other scripts) |

## Programmatic API

```js
import {
  addPrimaryWorkflow, addSecondaryWorkflow, listWorkflows, removeWorkflow,
  getAvailableMarkets, addLicenseSubType, addAllowedPaymentOption,
  updateInvoiceActions, updatePaymentOptions, listLicenseSubTypes,
  getNavigationPaymentConfig
} from './scripts/green-workflow-config.mjs';
```

## Available Markets

`al-abc` | `al-abocb` | `al-amcc` | `ar-dfa` | `hi-doh` | `il-doa` | `ky-chfs` | `mo` | `ms-doh` | `nj-crc` | `ok` | `ri` | `usvi-ocr` | `va-cca` | `wv`
