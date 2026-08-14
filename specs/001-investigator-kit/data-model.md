# Data Model: Investigator Kit

**Feature**: 001-investigator-kit  
**Date**: 2026-08-13  
**Scope**: Host-neutral state under `.investigator/` plus canonical kit entities in `core/`. No database — plain Markdown + YAML files only.

---

## Entity Relationship Overview

```text
Kit Repository (npm package)
  ├── core/skills/          ──install──► Host skills path
  ├── core/agents/          ──transform+install──► Host agents path
  ├── core/playbooks/       ──install──► Host skills path
  └── core/templates/       ──scaffold──► .investigator/*

Target Project
  .investigator/
    config.yml ──────► model tiers, host map, knowledge_source, access modes
    registry.yml ────► tool/source → playbook → subagent bindings
    profile.md ──────► stack summary (services, DBs, logs, correlation keys)
    memory/ ─────────► per-agent lessons
    playbook-memory/ ► per-tool lessons
    cases/
      index.md ──────► library index rows
      <case-id>/ ────► ticket, plan, ledger, challenge-log, report
```

---

## 1. Config (`config.yml`)

**Location**: `.investigator/config.yml`  
**Created**: Installer scaffold (template) → populated by `investigator-init`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `host` | enum: `cursor` \| `claude` | yes | Set by installer at scaffold from CLI host selection (FR-051a); init merges other fields only |
| `knowledge_source` | enum: `docki` \| `docs_folder` \| `codebase_scan` | yes | Set in init interview |
| `knowledge_path` | string | conditional | Required when `knowledge_source: docs_folder` |
| `model_tiers` | map agent/skill id → `deep`\|`mid`\|`fast` | yes | Defaults per FR-024 |
| `host_model_map.host` | enum | yes | Set by installer at scaffold from CLI host selection (FR-051a); init must not infer from filesystem |
| `host_model_map.deep` | string | yes | Model id or `inherit` |
| `host_model_map.mid` | string | yes | Model id or `inherit` |
| `host_model_map.fast` | string | yes | Model id or `inherit` |
| `data_sources` | array of objects | yes | At least empty array |
| `data_sources[].name` | string | yes | e.g. `mssql-prod` — no secrets |
| `data_sources[].kind` | string | yes | e.g. `mssql`, `elastic`, `redis` |
| `data_sources[].access_mode` | enum: `manual`\|`mcp`\|`cli` | yes | Default `manual` |

**State transitions**: Re-running `investigator-init` merges updates; must not delete `cases/` or existing memory content (FR-041).

---

## 2. Registry (`registry.yml`)

**Location**: `.investigator/registry.yml`

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `playbooks` | array | yes | |
| `playbooks[].id` | string | yes | Matches skill folder name e.g. `playbook-mssql` |
| `playbooks[].tool` | string | yes | Logical tool name e.g. `mssql` |
| `playbooks[].skill_path` | string | yes | Host-specific skill path; installer rewrites from canonical template at scaffold (FR-051b) — e.g. `.cursor/skills/playbook-mssql/SKILL.md` or `.claude/skills/playbook-mssql/SKILL.md` |
| `playbooks[].subagents` | string[] | yes | Subset of five core subagents |
| `playbooks[].sources` | string[] | no | Names matching `config.data_sources[].name` |

**Relationships**: Many playbooks ↔ many subagents (FR-014). New tool onboarding appends one playbook entry + bindings (FR-015, FR-052).

---

## 3. Profile (`profile.md`)

**Location**: `.investigator/profile.md`  
**Format**: Structured Markdown sections (human + agent readable)

| Section | Content |
|---------|---------|
| Services | Service names, responsibilities |
| Data stores | DB/cache/search mappings to services |
| Log systems | Where logs live, index patterns |
| Webhooks / integrations | Endpoints, providers |
| Correlation keys | Fields used to tie requests across systems |
| Known traps | Project-specific + playbook cross-refs |

No credentials (FR-027).

---

## 4. Memory files

### 4.1 Agent memory (`memory/<agent-id>.md`)

**Agents**: `orchestrator`, `inv-log-rca`, `inv-data-rca`, `inv-code-rca`, `inv-vendor-compare`, `inv-report`

| Property | Rule |
|----------|------|
| Format | Dated bullets plus a **Reusable how-to** table (when needed / what / where / learned-in case id) |
| Write trigger | Subagent correction, new how-to discovery on case close, or orchestrator cross-case lesson (FR-020, FR-060) |
| Reuse | When a later case needs the same join or fetch path, start from the matching how-to row — do not rediscover |
| Situational | A case that needed no join writes no correlation how-to |
| Secrets | FR-030 redaction before write |

### 4.2 Playbook memory (`playbook-memory/<tool>.md`)

Starter files: `elastic`, `mssql`, `redis`, `k8s-logs` (+ onboarded tools).

Tool-truth lessons that travel with playbook skills (BRIEF §3.4), including Reusable how-to rows for query shapes learned on cases that needed them.

---

## 5. Case library

### 5.1 Case ID

**Format**: `YYYYMMDD-<short-slug>` (kebab-case)  
**Fallback**: `YYYYMMDD-HHMM-<random4>` (lowercase alphanumeric) when slug omitted (FR-021, Clarification D5)

**Validation**:
- Slug: `[a-z0-9]+(-[a-z0-9]+)*`
- Uniqueness: orchestrator checks `cases/index.md` before assign

### 5.2 Index row (`cases/index.md`)

Markdown table; **column order fixed** (FR-021):

| # | Column | Description |
|---|--------|-------------|
| a | Case ID | Primary key |
| b | Symptom signature | Short incident fingerprint |
| c | RCA summary | 1–3 sentences for semantic matching (FR-021a) |
| d | Root cause(s) | Final attributed causes |
| e | Services touched | Comma-separated |
| f | Overall confidence | high \| medium \| low |
| g | Reusable-pattern tags | kebab-case tags |

### 5.3 Case directory (`cases/<case-id>/`)

| File | Purpose |
|------|---------|
| `ticket.md` | Original incident intake |
| `plan.md` | Full Direction Brief (audit), dispatch plan, prior-case citations, optional follow-up direction |
| `status.md` | Live status card shown in chat (problem, phase, sending, skipped, latest) |
| `evidence-ledger.md` | Claims with DECLARED/OBSERVED/INFERRED/UNKNOWN + evidence links |
| `challenge-log.md` | Cross-examination and contradiction resolution |
| `report.md` | Final RCA per report contract |

**Case lifecycle**:

```text
OPEN → INTAKE → INTERROGATE → STEER (status card) → DISPATCH → CHALLENGE → REPORT → CLOSE
  │              full brief in plan.md; compact card in chat            │
  └─ step 0: semantic index lookup ─────────────────────────────────────┘
```

On CLOSE: append index row, update memories (FR-009).

---

## 6. Evidence ledger entry

Each claim in `evidence-ledger.md`:

| Field | Type | Rule |
|-------|------|------|
| `claim_id` | string | Stable reference e.g. `C-012` |
| `statement` | string | Factual claim |
| `classification` | enum | DECLARED \| OBSERVED \| INFERRED \| UNKNOWN |
| `evidence` | list | Pointers: log excerpt, query result, code ref, vendor doc |
| `source_agent` | string | Subagent id |
| `confidence` | enum | high \| medium \| low (per rubric) |

**Invariant**: INFERRED/UNKNOWN never promoted without new evidence (FR-006, SC-008).

---

## 7. Canonical kit entities (repository)

### 7.1 Skills (`core/skills/<name>/SKILL.md`)

| Skill | Role |
|-------|------|
| `investigator` | Orchestrator SOP, self-interrogation, visible Direction Brief |
| `investigator-init` | First-run interview |
| `investigator-add-agent` | Post-init tool onboarding |

Playbooks live under `core/playbooks/<name>/SKILL.md`.

### 7.2 Agents (`core/agents/<name>.md`)

Five thin definitions (FR-010): identity, scope, `model_tier`, guardrails, memory protocol, output contract — **no tool procedures**.

### 7.3 Templates (`core/templates/`)

| Template | Target |
|----------|--------|
| `config.yml.tpl` | `.investigator/config.yml` |
| `registry.yml.tpl` | `.investigator/registry.yml` |
| `profile.md.tpl` | `.investigator/profile.md` |
| `cases/index.md.tpl` | `.investigator/cases/index.md` |
| `cases/artifacts/*.md.tpl` | Per-case files |
| `memory/*.md.tpl` | Empty memory stubs |
| `playbook-memory/*.md.tpl` | Empty playbook memory stubs |
| `redaction-rules.md` | Included by agents/playbooks |

---

## 8. Host placement (derived, not stored in config)

| Host | Skills | Agents |
|------|--------|--------|
| Cursor | `.cursor/skills/` | `.cursor/agents/` |
| Claude | `.claude/skills/` | `.claude/agents/` |

`.investigator/` path is identical for both hosts (FR-054).

---

## 9. Report artifact schema

See `contracts/report-output.md`. Six ordered sections (FR-032); per-finding confidence + rubric reasoning required.

---

## Validation rules summary

| Rule | Enforcement |
|------|-------------|
| No secrets in `.investigator/` | FR-030 redaction + FR-031 report-step fail |
| Read-only data access | Playbook + subagent guardrails |
| Case ID format | Orchestrator at case open |
| Index row completeness | Orchestrator at case close |
| Re-install preserves state | CLI default KEEP on `.investigator/` group |
