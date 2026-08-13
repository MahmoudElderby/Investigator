# Golden Scenario Fixtures

Synthetic incident artifacts for E2E validation of the Investigator orchestrator (FR-056–FR-057).

## Layout

```
golden-fixtures/
  ticket.md              # Incident intake for orchestrator
  src/webhook/           # Webhook handler + provider payload sample
  src/data/              # SQL schema with nvarchar(max) trap
  logs/                  # Error 258 and lock timeout snippets
```

## Expected root causes (SC-002)

| # | Root cause | Evidence domains |
|---|------------|------------------|
| 1 | Provider sends `requestID` but DTO expects `requestIdHash` | inv-vendor-compare + inv-code-rca |
| 2 | Unindexed `nvarchar(max)` lookup under 35s distributed lock → SQL timeout **258** | inv-data-rca + inv-log-rca |

Each finding should reach **medium** or higher confidence with rubric reasoning.

## Usage

Copy fixtures into a scratch project after `npx investigator-kit init`. Configure all data sources as `manual` access mode. Run `investigator-init`, then `investigator` with `ticket.md` content.

See [quickstart.md](../../specs/001-investigator-kit/quickstart.md) §4.
