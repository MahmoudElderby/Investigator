# Secret Redaction Rules (FR-030)

Apply before writing to `.investigator/` (ledger, memory, cases, report) and when ingesting pasted tool results.

**Placeholder**: `[REDACTED]`

## Rule A — Curated credential regex set

| Pattern | Examples |
|---------|----------|
| JWT | `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` |
| Bearer token | `Bearer\s+[A-Za-z0-9._~+/=-]+` |
| Connection string password | `(?i)password\s*=\s*[^;\s]+` |
| AWS access key | `AKIA[0-9A-Z]{16}` |
| GCP service account key id | `"private_key"\s*:\s*"-----BEGIN` |
| PEM private key block | `-----BEGIN (RSA \|EC \|OPENSSH )?PRIVATE KEY-----` |

Use case-insensitive multiline regex where applicable.

## Rule B — High-entropy standalone token

- Token: contiguous `[A-Za-z0-9+/=_-]{32,}` not part of a URL path
- Shannon entropy > **4.5 bits/character**
- Redact entire token

## Rule C — Suspicious key name

YAML, JSON, query-string, or `key: value` forms where key matches:

```regex
/(password|secret|token|key|credential)/i
```

(substring match on key name) with non-empty value → redact value only.

## Application

- Subagents and playbooks: redact before quoting in ledger
- inv-report: scan report body and full `.investigator/` before case close (FR-031)
- On FR-030 hit at close: **fail the case** — do not write index row until redacted

## Not redacted

- Public IPs, hostnames, normal correlation ids (e.g. `requestIdHash=abc123`)

Reference: `contracts/secret-redaction.md`
