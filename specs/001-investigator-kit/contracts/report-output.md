# Contract: RCA Report Output

**Artifact**: `.investigator/cases/<case-id>/report.md`  
**Producer**: `inv-report` subagent under orchestrator direction  
**Consumers**: Engineers, case library index (summary extracted on close)

---

## Required section order (FR-032)

The report MUST contain these six sections **in this exact order**. Use `##` Markdown headings with the titles below (case-insensitive match allowed; order is not).

### 1. ELI5 Summary

- Plain language, non-engineer audience
- What happened and user-visible impact
- No jargon without immediate explanation

### 2. Technical Root Cause

- Evidence chain for each root cause
- Every claim references ledger entry id(s)
- Each claim shows classification: `[OBSERVED]`, `[INFERRED]`, etc.
- INFERRED/UNKNOWN MUST remain labeled (FR-033)

### 3. Short-Term Fix Recommendations

- Mitigations only — no code patches applied by Investigator
- Actionable steps for on-call / hotfix

### 4. Long-Term Fix Recommendations

- Structural fixes (schema, indexing, contract alignment, monitoring)

### 5. Confidence

Subsections required:

- **Overall**: high | medium | low
- **Per finding**: table or list with finding id, score, one-line rationale
- **Rubric reasoning**: explicit mapping to rubric rules (FR-007), e.g.:
  - high = corroborated by ≥2 independent evidence sources
  - medium = single independent source
  - low = inference or conflicting evidence

### 6. Open Questions

- What remains unknown
- What evidence would raise confidence

---

## Rubric (orchestrator + inv-report shared)

| Level | Criteria |
|-------|----------|
| **high** | ≥2 independent sources/agents agree; OBSERVED evidence |
| **medium** | Single strong source; or dual sources same channel |
| **low** | INFERRED; conflicting evidence; UNKNOWN gaps |

Single-source findings capped at **medium** (spec edge case).

---

## Pre-close validation (FR-031)

Before case close, `inv-report` MUST scan all files under `.investigator/` for FR-030 secret patterns. If any match: **fail the case** — do not write index row until redacted.

---

## Golden scenario acceptance (SC-002)

Report MUST identify both root causes with per-finding confidence ≥ medium:

1. Webhook field mismatch: provider `requestID` vs DTO `requestIdHash`
2. SQL timeout 258: unindexed `nvarchar(max)` lookup under 35s distributed lock

Evidence MUST cite at least two subagent domains (e.g. vendor-compare + code-rca for #1; data-rca + log-rca for #2).

---

## Example skeleton

```markdown
## ELI5 Summary

…

## Technical Root Cause

### Finding F-1: Webhook field name mismatch
… [OBSERVED] (ledger C-003, C-007) …

### Finding F-2: Unindexed nvarchar(max) lookup
… [OBSERVED] (ledger C-011, C-014) …

## Short-Term Fix Recommendations

…

## Long-Term Fix Recommendations

…

## Confidence

**Overall**: medium-high …

| Finding | Confidence | Rationale |
|---------|------------|-----------|
| F-1 | high | Vendor payload + code DTO agree |
| F-2 | medium | Query plan evidence single-source |

**Rubric reasoning**: …

## Open Questions

…
```
