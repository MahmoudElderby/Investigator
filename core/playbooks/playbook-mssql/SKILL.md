---
name: playbook-mssql
description: Read-only MSSQL investigation patterns including index traps and timeout 258 diagnostics.
---

# Playbook: Microsoft SQL Server

Read-only MSSQL patterns for **inv-data-rca**.

## Access modes

| Mode | Behavior |
|------|----------|
| `manual` | Emit T-SQL; user runs in SSMS/Azure Data Studio and pastes results |
| `mcp` | Read-only MCP SQL connection |
| `cli` | Wrapper script with env-based connection |

Reference sources by name — no connection strings in agent files.

## Read-only constraints

- SELECT, SET SHOWPLAN_XML ON (session), DMVs for locks/waits — **no** DML/DDL
- Use `WITH (NOLOCK)` only when profile permits; note dirty-read risk in ledger

## Known traps (critical)

### Msg 1919 — nvarchar(max) index key

`nvarchar(max)` **cannot** be used as an index key column. Attempts to index it fail with error 1919. Lookups on unindexed `nvarchar(max)` columns force scans.

### LOWER() defeats indexes

`WHERE LOWER(column) = @value` prevents index seek on `column` unless a computed/persisted lowercase index exists. Check sargability before blaming "missing index."

### Timeout 258

Error **258** — wait operation timed out. Common under lock contention or long-running scans blocked by locks. Correlate with `sys.dm_tran_locks`, `blocked_process_report`, and application lock timeout settings (e.g. 35s distributed lock wrapper).

## Diagnostic queries (read-only)

```sql
-- Missing index hint (DMV, read-only)
SELECT TOP 20 * FROM sys.dm_db_missing_index_details;

-- Active blocking
SELECT * FROM sys.dm_exec_requests WHERE blocking_session_id <> 0;

-- Plan for parameterized lookup (manual paste of actual params)
SET SHOWPLAN_XML ON;
GO
-- paste suspect SELECT here
GO
SET SHOWPLAN_XML OFF;
```

## Correlation fields

Use profile **Correlation keys** — e.g. `RequestId`, `ExternalId`, hash columns. Match parameter types (hash vs plain string).

## Secret redaction (FR-030)

Redact connection fragments, passwords, tokens before ledger/memory writes per `.investigator/redaction-rules.md`.

## Memory

Lessons → `.investigator/playbook-memory/mssql.md`.
