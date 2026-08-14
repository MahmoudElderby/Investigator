# Implementation Plan: Investigator Kit — Portable AI Investigation System

**Branch**: `001-investigator-kit` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-investigator-kit/spec.md`  
**Design source of truth**: [BRIEF.md](../../BRIEF.md) (all sections — layout §7, architecture §3, portability §2, data access §4, init §5, report §6, build phases §9, out-of-scope §10)

## Summary

Build a **portable, installable AI investigation kit** distributed as the npm package `investigator-kit`. The kit ships as **plain Markdown + YAML** under `core/` (skills, thin subagents, playbooks, templates) plus a **Node.js CLI installer** that places skills, transforms agents to Cursor or Claude Code dialects, and scaffolds host-neutral `.investigator/` state. An orchestrator skill coordinates five specialist subagents through an evidence-ledger SOP, produces ELI5-first RCA reports, and accumulates a searchable case library. Validation installs into scratch projects for both hosts and runs a golden scenario (webhook `requestID` vs `requestIdHash` + unindexed `nvarchar(max)` SQL timeout 258 under a 35s lock).

**Build order** follows BRIEF §9 phases 1–7 exactly. No application code beyond the installer CLI.

## Technical Context

**Language/Version**: Node.js 20 LTS (installer CLI only); kit content is Markdown + YAML  
**Primary Dependencies**: `commander`, `@inquirer/prompts`, `gray-matter`, `fs-extra`, `yaml`, `fast-glob`; dev: `vitest`  
**Storage**: Plain files under `.investigator/` (config, registry, profile, memory, cases) — no database  
**Testing**: Vitest unit/integration tests for installer; manual/agent-driven golden E2E per `quickstart.md`  
**Target Platform**: Cross-platform (Windows, macOS, Linux); agent hosts Cursor + Claude Code  
**Project Type**: npm CLI + content kit (not a web app or library API)  
**Performance Goals**: Install completes in <30s; init interview <10 min user time (SC-001)  
**Constraints**: No LLM in CLI; no auto-detect host; no credentials in agent-visible files; no codebase fixes by Investigator  
**Scale/Scope**: 3 orchestration skills, 5 subagents, 4 starter playbooks, 1 CLI command (`init`), golden fixtures, 2 hosts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Constitution ratified | ⚠️ **OPEN RISK** | `.specify/memory/constitution.md` is still the unfilled template — no project-specific principles ratified |
| BRIEF.md as governing design | ✅ PASS | Spec and plan defer to BRIEF.md for all settled decisions |
| Library-first | ✅ PASS (adapted) | Kit content is self-contained under `core/`; installer is isolated under `installer/` |
| CLI interface | ✅ PASS | `npx investigator-kit init` with text I/O, flags, and prompts |
| Test-first (constitution template) | ⚠️ **WAIVED** | Constitution TDD principle not ratified; installer gets Vitest coverage, kit prose validated via golden E2E |
| Integration testing | ✅ PASS | Golden scenario + dual-host install in `quickstart.md` |
| Simplicity / YAGNI | ✅ PASS | No app server, no DB, no Docki implementation, no extra hosts |

**Post-design re-check**: No new violations. Complexity Tracking table not required (no unjustified violations).

**Action for later**: Run `/speckit-constitution` to ratify principles before implement if team requires formal gates.

## Project Structure

### Documentation (this feature)

```text
specs/001-investigator-kit/
├── plan.md              # This file
├── research.md          # Phase 0 — technology decisions
├── data-model.md        # Phase 1 — entities and validation
├── quickstart.md        # Phase 1 — validation runbook
├── contracts/           # Phase 1 — interface contracts
│   ├── cli-installer.md
│   ├── agent-dialect-transform.md
│   ├── report-output.md
│   ├── direction-brief.md
│   ├── status-card.md
│   ├── config-schemas.yml
│   └── secret-redaction.md
├── spec.md
├── clarify-questions.md
├── autopilot-assumptions.md
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
investigator-kit/
├── BRIEF.md
├── package.json                 # npm root; publishes investigator-kit
├── core/
│   ├── skills/
│   │   ├── investigator/SKILL.md
│   │   ├── investigator-init/SKILL.md
│   │   └── investigator-add-agent/SKILL.md
│   ├── agents/
│   │   ├── inv-log-rca.md
│   │   ├── inv-data-rca.md
│   │   ├── inv-code-rca.md
│   │   ├── inv-vendor-compare.md
│   │   └── inv-report.md
│   ├── playbooks/
│   │   ├── playbook-elastic/SKILL.md
│   │   ├── playbook-mssql/SKILL.md
│   │   ├── playbook-redis/SKILL.md
│   │   └── playbook-k8s-logs/SKILL.md
│   └── templates/
│       ├── config.yml.tpl
│       ├── registry.yml.tpl
│       ├── profile.md.tpl
│       ├── cases/index.md.tpl
│       ├── cases/artifacts/*.md.tpl
│       ├── memory/*.md.tpl
│       ├── playbook-memory/*.md.tpl
│       └── redaction-rules.md
├── installer/
│   ├── bin/cli.js
│   ├── lib/
│   │   ├── install.js
│   │   ├── transform-agent.js
│   │   ├── prompts.js
│   │   └── manifest.js
│   └── tests/
│       ├── transform-agent.test.js
│       └── install.integration.test.js
├── docs/
│   ├── golden-fixtures/         # Synthesized scratch app for phase 7
│   └── README.md
└── specs/                       # Spec-kit meta (not shipped to targets)
```

**Installed target project layout**:

```text
target-project/
├── .investigator/               # Host-neutral, committed
│   ├── config.yml
│   ├── registry.yml
│   ├── profile.md
│   ├── memory/
│   ├── playbook-memory/
│   └── cases/
├── .cursor/skills/ …            # or .claude/skills/
└── .cursor/agents/ …            # or .claude/agents/
```

**Structure Decision**: Single npm package monorepo-style layout per BRIEF §7. All kit intelligence lives in Markdown/YAML; only `installer/` contains executable JavaScript. Spec-kit `.specify/` infrastructure stays in this repo but is **not** packaged for target projects.

## Implementation Phases (maps to BRIEF §9)

### Phase 1 — Kit skeleton (BRIEF §9.1)

- Create `core/` tree, empty template stubs, `manifest.js` path list
- Define canonical agent frontmatter schema (`model_tier`, `tools`)
- Seed `registry.yml.tpl` with four starter playbooks
- Document schemas in `contracts/config-schemas.yml`

**Exit**: Directory tree matches plan; templates parse as valid YAML/Markdown.

### Phase 2 — Orchestrator skill (BRIEF §9.2)

- Author `core/skills/investigator/SKILL.md` with full SOP:
  - Step 0: LLM semantic case-library lookup (FR-021a)
  - Intake, self-interrogation (FR-058), visible Direction Brief (FR-059),
    dispatch, challenge protocol, evidence ledger, confidence rubric
  - Case close: memories + index row with RCA summary
- Include case id assignment rules (`YYYYMMDD-<slug>` / fallback)
- Reference `contracts/report-output.md`, `contracts/secret-redaction.md`,
  and `contracts/direction-brief.md` / `contracts/status-card.md`

**Exit**: Skill prose covers FR-004–FR-009, FR-021, FR-021a, FR-058, FR-059.

### Phase 3 — Subagents + playbooks (BRIEF §9.3)

- Five thin agents in `core/agents/` (FR-010)
- Four playbooks with MSSQL traps (Msg 1919, `LOWER()` index defeat), correlation guidance (FR-012–FR-013)
- Registry bindings: which subagent loads which playbook (FR-014–FR-016)

**Exit**: Playbooks contain all tool procedure; agents contain none.

### Phase 4 — `investigator-init` (BRIEF §9.4)

- Scan-first interview skill (FR-035–FR-041)
- Knowledge-source 3-option flow + Docki nudge (no install)
- Unknown-tool detection signals per FR-038 / Clarification D3
- Writes profile, config, registry, empty memories, empty case index

**Exit**: Re-runnable without clobbering cases/memories.

### Phase 5 — Node CLI installer (BRIEF §9.5)

- Implement `init` per `contracts/cli-installer.md`
- Dialect transform per `contracts/agent-dialect-transform.md`
- Per-group overwrite prompts; `.investigator/` default KEEP (FR-049)
- Vitest coverage for transform + overwrite defaults

**Exit**: US2 acceptance scenarios pass on Windows; exact completion message.

### Phase 6 — `investigator-add-agent` (BRIEF §9.6)

- Skill reusing unknown-tool onboarding interview (FR-052–FR-053)
- Produces playbook + registry + binding + playbook-memory + smoke query

**Exit**: US4 independent test path in quickstart.

### Phase 7 — Validation (BRIEF §9.7)

- `docs/golden-fixtures/` synthesized scratch app
- Run golden scenario on Cursor + Claude installs (FR-056–FR-057, SC-002)
- Verify both root causes ≥ medium confidence, six-part report, zero secrets (SC-003, SC-004)

**Exit**: quickstart.md checklist fully green on both hosts.

## Key Design Decisions (from research.md)

| Topic | Decision |
|-------|----------|
| Host selection | Flags or list prompt — never auto-detect |
| Agent transform | Canonical `model_tier` → host `model: inherit`; body unchanged |
| Skills | No per-host rewrite — placement only |
| Re-install | 3 prompts; `.investigator/` default KEEP |
| Case matching | LLM semantic over full index row incl. RCA summary |
| Secrets | Regex + entropy + key-name; `[REDACTED]`; report-step fail |
| Case IDs | `YYYYMMDD-<slug>` / `YYYYMMDD-HHMM-<random4>` fallback |
| Visible direction | Compact status card + steer in chat; full brief in plan.md; never all specialists by default |

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Unratified constitution | Medium | BRIEF.md + spec FRs govern; ratify constitution before implement if required |
| Golden E2E is agent-driven | Medium | Synthesized fixtures + explicit ticket text; document pass criteria in quickstart |
| Host model map drift | Low | Default `inherit`; user edits `config.yml` at init |
| Secret redaction in prose-only | Medium | Shared `redaction-rules.md` template; inv-report pre-close scan |
| Claude/Cursor frontmatter drift | Low | Installer snapshots tests; extensibility via transform profiles |

## Complexity Tracking

> Not applicable — no constitution violations requiring justification.

## Generated Artifacts (this phase)

| Artifact | Path |
|----------|------|
| Implementation plan | `specs/001-investigator-kit/plan.md` |
| Research | `specs/001-investigator-kit/research.md` |
| Data model | `specs/001-investigator-kit/data-model.md` |
| Quickstart | `specs/001-investigator-kit/quickstart.md` |
| CLI contract | `specs/001-investigator-kit/contracts/cli-installer.md` |
| Agent transform | `specs/001-investigator-kit/contracts/agent-dialect-transform.md` |
| Report contract | `specs/001-investigator-kit/contracts/report-output.md` |
| Direction Brief | `specs/001-investigator-kit/contracts/direction-brief.md` |
| Status card | `specs/001-investigator-kit/contracts/status-card.md` |
| Config schemas | `specs/001-investigator-kit/contracts/config-schemas.yml` |
| Secret redaction | `specs/001-investigator-kit/contracts/secret-redaction.md` |

## Next Step

Run `/speckit-tasks` to generate dependency-ordered `tasks.md` from this plan.
