---
name: playbook-elastic
description: Read-only Elasticsearch query patterns for log and data investigation.
---

# Playbook: Elasticsearch

Read-only investigation patterns for Elastic (logs or datastore).

## Access modes

| Mode | Behavior |
|------|----------|
| `manual` | Emit exact query JSON; user runs in ElasticVue/Kibana and pastes results |
| `mcp` | Call read-only MCP server configured in `config.yml` |
| `cli` | Invoke configured wrapper reading env vars |

Reference sources by name (e.g. `elastic-prod`) — never embed credentials.

## Query dialect

- Use `_search` with explicit `index` or index pattern from profile
- Prefer `bool` filters on `@timestamp`, `traceId`, `requestId`, correlation fields from profile
- Limit `_source` fields; use `size` caps (e.g. 100) for exploration
- Read-only: no `_delete_by_query`, index mutations, or ILM changes

## Correlation fields

Consult `.investigator/profile.md` **Correlation keys**. Common: `traceId`, `requestId`, `correlationId`, `@timestamp`.

## Auth handling

- MCP: credentials live in MCP server config only
- Manual/cli: user authenticates outside agent context

## Known patterns

```json
{
  "query": {
    "bool": {
      "must": [
        { "range": { "@timestamp": { "gte": "now-1h" } } },
        { "term": { "level": "error" } }
      ]
    }
  },
  "size": 50
}
```

## Secret redaction (FR-030)

Before writing any Elastic response excerpt to ledger, memory, or cases, scan and redact per `.investigator/redaction-rules.md`. Replace matches with `[REDACTED]`.

## Memory

Append tool-specific lessons to `.investigator/playbook-memory/elastic.md`.
