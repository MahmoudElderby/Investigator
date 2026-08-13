---
name: playbook-redis
description: Read-only Redis investigation patterns for cache and lock diagnostics.
---

# Playbook: Redis

Read-only Redis patterns for **inv-data-rca**.

## Access modes

| Mode | Behavior |
|------|----------|
| `manual` | Emit CLI commands (`redis-cli`); user pastes output |
| `mcp` | Read-only Redis MCP |
| `cli` | Configured wrapper |

Reference sources by name — credentials in env/MCP only.

## Read-only commands

- `GET`, `HGET`, `HGETALL`, `TTL`, `TYPE`, `SCAN` (with COUNT limit)
- `INFO`, `CLIENT LIST` (careful with volume)
- **Avoid**: `FLUSH*`, `DEL`, `SET`, writes to any key

## Correlation fields

Key naming conventions from profile — e.g. `lock:order:{id}`, `session:{requestId}`.

## Auth modes

- ACL username/password via MCP/env — never in agent output
- TLS endpoints referenced by hostname only

## Patterns

```bash
# Scan keys matching pattern (read-only exploration)
SCAN 0 MATCH lock:order:* COUNT 100

# Inspect lock holder
GET lock:order:12345
TTL lock:order:12345
```

## Secret redaction (FR-030)

Redact AUTH strings and high-entropy tokens per `.investigator/redaction-rules.md` before writes.

## Memory

Lessons → `.investigator/playbook-memory/redis.md`.
