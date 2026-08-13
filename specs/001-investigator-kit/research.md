# Research: Investigator Kit (001-investigator-kit)

**Date**: 2026-08-13  
**Purpose**: Resolve technical unknowns for the implementation plan. All items resolved — no open NEEDS CLARIFICATION.

---

## R1 — Node.js CLI stack and npm distribution

**Decision**: Node.js **20 LTS** minimum; package name **`investigator-kit`**; binary **`investigator-kit`**; entry command **`init`** via `npx investigator-kit init`.

**Rationale**: BRIEF §2 mandates npm + npx. Node 20 LTS is widely available on Windows (user environment), macOS, and CI. No runtime beyond file I/O and YAML/frontmatter parsing is required.

**Alternatives considered**:
- **Bash/PowerShell-only installer** — rejected; cross-platform maintenance cost and no structured frontmatter parsing.
- **Python CLI** — rejected; BRIEF explicitly chose Node.js.

**Dependencies (installer only)**:
| Package | Role |
|---------|------|
| `commander` | CLI arg parsing (`--cursor`, `--claude`, `--force`) |
| `@inquirer/prompts` | Host list + per-group overwrite prompts (no auto-detect) |
| `gray-matter` | Parse/emit agent frontmatter during dialect transform |
| `fs-extra` | Recursive copy, exists checks, atomic writes |
| `yaml` | Validate template YAML on copy |
| `fast-glob` | Discover canonical core files at install time |

Dev: `vitest` for installer unit tests; `typescript` optional — plain ESM JavaScript acceptable for minimal surface.

---

## R2 — Host dialect transform (Cursor vs Claude Code)

**Decision**: Canonical agents under `core/agents/*.md` use a **neutral frontmatter schema**; installer emits host-specific files.

**Canonical frontmatter fields** (source of truth in repo):

```yaml
name: inv-log-rca
description: >-
  Log RCA specialist — query/analyze log systems, timelines, correlations.
model_tier: fast          # deep | mid | fast — resolved via .investigator/config.yml at runtime instruction
tools: inherit            # optional allowlist; "inherit" = omit tools key on Claude, use host default on Cursor
```

**Cursor output** (`.cursor/agents/<name>.md`):

```yaml
---
name: inv-log-rca
description: >-
  Log RCA specialist — query/analyze log systems, timelines, correlations.
model: inherit            # literal from host_model_map tier resolution instructions in agent body
---
```

Cursor agents in this repo use `model:` (not `model_tier`). The agent body instructs the orchestrator/subagent to read `.investigator/config.yml` `host_model_map` and map `model_tier` → concrete model id. Installer sets `model: inherit` unless a pinned default is added later.

**Claude Code output** (`.claude/agents/<name>.md`):

```yaml
---
name: inv-log-rca
description: >-
  Log RCA specialist — query/analyze log systems, timelines, correlations.
model: inherit            # Claude accepts sonnet|opus|haiku|inherit|full-id
tools: Read, Grep, Glob, Task, Shell   # explicit allowlist when canonical tools != inherit
---
```

**Transform rules**:
1. Copy agent body verbatim (Markdown below frontmatter).
2. Map `model_tier` → document in body; emit `model: inherit` in frontmatter (host resolves via config at run time per BRIEF §3.5).
3. If canonical `tools: inherit`, omit `tools` on Claude (inherit all); on Cursor omit `tools` (Cursor subagents inherit session tools).
4. If canonical lists explicit tools, emit comma-separated string (Claude) or YAML list (Cursor) per host convention.
5. Skills: **no transform** — copy `SKILL.md` files unchanged to `.cursor/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`.

**Alternatives considered**:
- **Dual-maintain Cursor and Claude agent files in core/** — rejected; violates BRIEF §2 single canonical form.
- **Runtime symlink layer** — rejected; hosts read fixed paths only.

---

## R3 — Re-install overwrite UX

**Decision**: Three sequential prompts via `@inquirer/prompts` `select` or `confirm`:

| Group | Default | Behavior |
|-------|---------|----------|
| Skills | OVERWRITE (Y) | Replace `.cursor/skills/investigator*` / playbooks placed by kit |
| Subagents | OVERWRITE (Y) | Replace host `agents/` files owned by kit manifest |
| `.investigator/` | **KEEP (N)** | Skip unless user opts in; never delete `cases/` or `memory/` without explicit consent |

**Rationale**: Clarification session D1 / FR-049. Preserves learned state by default.

**Alternatives considered**: Single global prompt (rejected — too coarse); per-file prompts (rejected — noisy).

---

## R4 — Secret redaction implementation locus

**Decision**: Redaction rules live in **orchestrator + subagent skill instructions** (Markdown checklists) and in a shared **`core/templates/redaction-rules.md`** snippet included by playbooks. The **`inv-report`** step performs a final scan of all `.investigator/` writes before case close.

**Ruleset** (FR-030, no external scanner library):
1. Curated regex: JWT, Bearer, `password=`, AWS `AKIA…`, GCP service-account JSON keys, PEM blocks.
2. Standalone tokens ≥ 32 chars with Shannon entropy > 4.5 bits/char → redact.
3. Key names matching `/(password|secret|token|key|credential)/i` with non-empty values → redact value.

Placeholder: `[REDACTED]`.

**Rationale**: Clarification D4; avoids npm dependency on secret scanners; agents apply at paste time, report step fails case if leak detected (FR-031).

---

## R5 — Case library semantic matching

**Decision**: Implemented **inside orchestrator skill prose** (LLM-driven), not installer code. Index row schema includes RCA summary field (FR-021). Orchestrator SOP step 0 instructs: compare new ticket against **every field** of **every row**; cite matched case id(s) and reasoning in `cases/<id>/plan.md`; never promote prior root cause to conclusion.

**Rationale**: Clarification D2 / FR-021a. No embedding/vector DB — plain Markdown table + LLM reasoning matches kit philosophy.

---

## R6 — Golden validation fixtures

**Decision**: Ship **`docs/golden-fixtures/`** in the kit repo (synthesized scratch app), copied into validation scratch projects:

| Fixture element | Purpose |
|-----------------|--------|
| Webhook controller + DTO expecting `requestIdHash` | Code path for `inv-code-rca` |
| Sample provider payload with `requestID` | Vendor compare evidence |
| MSSQL migration/script with `nvarchar(max)` lookup column, no index | Data RCA + playbook-mssql trap |
| App logs with error 258 + 35s lock timeout messages | Log RCA timeline |
| `.investigator/` pre-seeded with `manual` access modes | No live DB required for golden run |

Validation runs **twice**: `--cursor` and `--claude` install into temp dirs; human or agent-driven orchestrator session executes golden ticket.

**Rationale**: BRIEF §9 phase 7; SC-002; fixtures synthesized per spec assumptions.

---

## R7 — Unknown-tool detection signals

**Decision**: `investigator-init` skill documents a **scan checklist** (not CLI code):

1. Dependency manifests (`package.json`, `requirements.txt`, `pom.xml`, `go.mod`, `Cargo.toml`, …)
2. Tool config files (`elasticsearch.yml`, `redis.conf`, `grafana.ini`, …)
3. Env-var / connection-string fragments in `.env.example`, `appsettings*.json`, docker-compose
4. SDK imports in source (client libraries)
5. Mentions in any repo `*.md`

Any one signal + missing `registry.yml` playbook entry → offer onboarding interview.

**Rationale**: Clarification D3 / FR-038.

---

## R8 — Testing strategy for a Markdown-first kit

**Decision**:

| Layer | What | How |
|-------|------|-----|
| Installer unit | Dialect transform, overwrite logic, path placement | Vitest + fixture canonical agents |
| Installer integration | Fresh install into temp dir | Script in `installer/tests/` |
| Kit content | Schema/template presence | Checklist in CI (future) |
| Golden E2E | Full RCA on fixtures | Documented manual/agent procedure in `quickstart.md` |

No TDD mandate on skill prose; constitution is unratified (see plan Constitution Check).

**Alternatives considered**: Snapshot-testing entire SKILL.md bodies — deferred; high churn, low signal.

---

## R9 — Model tier → host model mapping at init

**Decision**: `investigator-init` writes `.investigator/config.yml`:

```yaml
model_tiers:
  orchestrator: deep
  inv-code-rca: deep
  inv-vendor-compare: deep
  inv-data-rca: mid
  inv-log-rca: fast
  inv-report: mid
host_model_map:
  host: cursor          # or claude
  deep: inherit
  mid: inherit
  fast: inherit
```

User may edit concrete model ids post-init. Agent bodies reference tiers; frontmatter uses `inherit`.

**Rationale**: BRIEF §3.5; FR-023–FR-025.

---

## Summary

All Technical Context fields are resolved. Primary build order follows BRIEF §9 phases 1–7. No blockers remain for `/speckit-tasks`.
