# Contract: Secret Detection & Redaction (FR-030)

**Applies to**: All writes to `.investigator/` (ledger, memory, cases, report), and pasted content ingested by subagents.

**Placeholder**: `[REDACTED]` (stable, Markdown-safe)

---

## Detection rules (ANY match triggers redaction)

### Rule A — Curated credential regex set

| Pattern | Examples |
|---------|----------|
| JWT | `eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` |
| Bearer token | `Bearer\s+[A-Za-z0-9._~+/=-]+` |
| Connection string password | `(?i)password\s*=\s*[^;\s]+` |
| AWS access key | `AKIA[0-9A-Z]{16}` |
| GCP service account key id | `"private_key"\s*:\s*"-----BEGIN` |
| PEM private key block | `-----BEGIN (RSA \|EC \|OPENSSH )?PRIVATE KEY-----` |

Implement as case-insensitive multiline regex where applicable.

### Rule B — High-entropy standalone token

- Token: contiguous `[A-Za-z0-9+/=_-]{32,}` not part of a URL path
- Shannon entropy > **4.5 bits/character**
- Redact entire token

### Rule C — Suspicious key name

YAML, JSON, query-string, or `key: value` forms where key matches:

```regex
/(password|secret|token|key|credential)/i
```

(substring match on key name) with non-empty value → redact value only.

---

## Application points

| Stage | Actor | Action |
|-------|-------|--------|
| Paste ingest | Subagent / playbook | Redact before quoting in ledger |
| Memory write | Subagent | Scan lesson text |
| Report compose | inv-report | Scan report body |
| Case close gate | inv-report | Full `.investigator/` scan — **fail case** on hit (FR-031) |

---

## Out of scope

- External secret-scanner libraries (Clarification D4 rejected option D)
- Redacting public IPs, hostnames, or non-secret correlation ids

---

## Test vectors (installer/docs)

| Input | Expected |
|-------|----------|
| `password=SuperSecret123!` | `password=[REDACTED]` |
| `Authorization: Bearer eyJhbG…` | `Authorization: Bearer [REDACTED]` |
| Random 40-char base64 blob, high entropy | `[REDACTED]` |
| `"api_key": "demo-key-public"` | key name matches → `[REDACTED]` |
| `requestIdHash=abc123` | **not** redacted (normal correlation id) |
