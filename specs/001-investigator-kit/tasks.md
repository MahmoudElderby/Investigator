# Tasks: Investigator Kit — Portable AI Investigation System

**Input**: Design documents from `/specs/001-investigator-kit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, BRIEF.md

**Tests**: Vitest installer tests included per plan.md; golden E2E is agent-driven per quickstart.md (no automated test harness for prose skills).

**Organization**: Tasks grouped by user story with execution order following BRIEF §9 build phases 1–7. User Story 1 core content (Phase 3) precedes CLI (Phase 5) per BRIEF dependency order; US1 validation (Phase 7) is the final gate.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US6) for story-phase tasks only
- Include exact file paths in descriptions

## Path Conventions

- **Kit repo root**: `core/`, `installer/`, `docs/`, `package.json`
- **Target project state**: `.investigator/` (scaffolded by installer)
- **Host paths**: `.cursor/skills/`, `.cursor/agents/` or `.claude/skills/`, `.claude/agents/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: npm package skeleton, directory tree, installer dependencies (BRIEF §7, plan.md)

- [X] T001 Create root `package.json` with name `investigator-kit`, bin `investigator-kit` → `installer/bin/cli.js`, `files` including `core/` and `installer/`, Node 20 engines
- [X] T002 Create `core/skills/`, `core/agents/`, `core/playbooks/`, `core/templates/` directory tree per plan.md
- [X] T003 Create `installer/bin/`, `installer/lib/`, `installer/tests/fixtures/` directory tree
- [X] T004 Create `docs/golden-fixtures/` placeholder directory with `.gitkeep`
- [X] T005 [P] Create `installer/package.json` with dependencies: `commander`, `@inquirer/prompts`, `gray-matter`, `fs-extra`, `yaml`, `fast-glob`; devDependency `vitest`
- [X] T006 [P] Create `installer/vitest.config.js` for ESM test runner
- [X] T007 [P] Create `docs/README.md` with kit overview and link to `specs/001-investigator-kit/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Kit skeleton, templates, schemas, redaction rules — BRIEF §9 phase 1 (FR-001–FR-003). **No user story work until this phase completes.**

- [X] T008 Create `core/templates/config.yml.tpl` with `host`, `knowledge_source`, `model_tiers` (FR-024 defaults), `host_model_map` (`host`/`deep`/`mid`/`fast`), empty `data_sources` array per `contracts/config-schemas.yml`
- [X] T009 Create `core/templates/registry.yml.tpl` with four starter playbooks using `{{HOST_SKILLS}}/<playbook-name>/SKILL.md` placeholder and subagent bindings per `contracts/config-schemas.yml` (FR-051b)
- [X] T010 Create `core/templates/profile.md.tpl` with sections: Services, Data stores, Log systems, Webhooks/integrations, Correlation keys, Known traps per `data-model.md`
- [X] T011 Create `core/templates/cases/index.md.tpl` with markdown table header in FR-021 column order (case id, symptom signature, RCA summary, root causes, services, confidence, tags)
- [X] T012 [P] Create `core/templates/cases/artifacts/ticket.md.tpl` stub for per-case ticket intake
- [X] T013 [P] Create `core/templates/cases/artifacts/plan.md.tpl` stub with sections for hypotheses, subagent dispatch, prior-case citations
- [X] T014 [P] Create `core/templates/cases/artifacts/evidence-ledger.md.tpl` stub with claim entry format (claim_id, classification, evidence, source_agent, confidence)
- [X] T015 [P] Create `core/templates/cases/artifacts/challenge-log.md.tpl` stub for contradiction resolution entries
- [X] T016 [P] Create `core/templates/cases/artifacts/report.md.tpl` with six `##` section headings matching `contracts/report-output.md` order
- [X] T017 [P] Create `core/templates/memory/orchestrator.md.tpl` and five subagent memory stubs in `core/templates/memory/` (`inv-log-rca`, `inv-data-rca`, `inv-code-rca`, `inv-vendor-compare`, `inv-report`)
- [X] T018 [P] Create `core/templates/playbook-memory/elastic.md.tpl`, `mssql.md.tpl`, `redis.md.tpl`, `k8s-logs.md.tpl` empty stubs
- [X] T019 Create `core/templates/redaction-rules.md` documenting FR-030 regex set, entropy ≥32 rule, suspicious-key-name rule, and `[REDACTED]` placeholder per `contracts/secret-redaction.md`
- [X] T020 Create `installer/lib/manifest.js` exporting owned kit paths (skills, agents, template files) for overwrite prompt groups per `contracts/cli-installer.md`
- [X] T021 Create `core/agents/_schema.md` documenting canonical frontmatter schema (`name`, `description`, `model_tier`, `tools`) per `contracts/agent-dialect-transform.md`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 & 5 — Investigation Core (Priority: P1 / P2)

**Goal**: Orchestrator SOP with evidence ledger, challenge protocol, confidence rubric, semantic case-library lookup (US5), plus five thin subagents and four starter playbooks (US1). BRIEF §9 phases 2–3.

**Independent Test (US5)**: Seed `cases/index.md` with a prior row; start new investigation; verify plan cites prior case id and match reasoning before dispatch.

**Independent Test (US1 partial)**: With fixtures present, orchestrator dispatches subagents and produces six-part report structure (full E2E validation in Phase 7).

### Orchestrator skill (`investigator`)

- [X] T022 [US5] Create `core/skills/investigator/SKILL.md` with SOP step 0: LLM semantic lookup over every row and field in `cases/index.md`, cite matched case id(s) and match reasoning in `plan.md`, prior root cause as lead only (FR-004 step 0, FR-021a)
- [X] T023 [US1] Add SOP steps 1–2 to `core/skills/investigator/SKILL.md`: intake, hypothesis formation, independent subagent dispatch with no cross-agent conclusion sharing (FR-004, FR-005)
- [X] T023a [US1] Add self-interrogation loop (FR-058) and visible Direction Brief dispatch gate (FR-059) to `core/skills/investigator/SKILL.md`; expand `plan.md.tpl`; add `contracts/direction-brief.md`
- [X] T023b [US1] Add situational Reusable how-to memory (FR-060): join/correlation only when the case needs it; reuse learned rows; never ask the user for field names
- [X] T023c [US1] Add live status card + compact Direction Brief + first-dispatch steer (FR-061); full interrogation stays in `plan.md`
- [X] T024 [US1] Add SOP step 3 to `core/skills/investigator/SKILL.md`: challenge protocol — cross-examine findings, follow-up dispatches, log to `challenge-log.md` (FR-008)
- [X] T025 [US1] Add SOP step 4 to `core/skills/investigator/SKILL.md`: evidence ledger maintenance with DECLARED/OBSERVED/INFERRED/UNKNOWN classification and no silent promotion (FR-006)
- [X] T026 [US1] Add SOP steps 5–6 to `core/skills/investigator/SKILL.md`: dispatch `inv-report`, apply confidence rubric (overall + per-finding with visible reasoning), case close with memory updates and index row including RCA summary column (FR-007, FR-009)
- [X] T027 [US5] Document case ID assignment in `core/skills/investigator/SKILL.md`: `YYYYMMDD-<kebab-slug>` with `YYYYMMDD-HHMM-<random4>` fallback and uniqueness check against `cases/index.md` (FR-021)
- [X] T028 [US1] Add secret redaction and FR-031 pre-close scan instructions to `core/skills/investigator/SKILL.md` referencing `core/templates/redaction-rules.md`
- [X] T029 [US1] Add MCP-unavailable fallback to manual mode with ledger notice in `core/skills/investigator/SKILL.md`

### Thin subagents (canonical)

- [X] T030 [P] [US1] Create `core/agents/inv-log-rca.md` with identity, scope, `model_tier: fast`, guardrails, memory protocol, output contract — no tool procedures (FR-010, FR-011)
- [X] T031 [P] [US1] Create `core/agents/inv-data-rca.md` with read-only guardrails, `model_tier: mid`, cross-store scope via playbooks (FR-010, FR-016)
- [X] T032 [P] [US1] Create `core/agents/inv-code-rca.md` with knowledge-source-first protocol, `model_tier: deep`, source-code-authoritative rule (FR-010, FR-017, FR-042)
- [X] T033 [P] [US1] Create `core/agents/inv-vendor-compare.md` with payload/contract comparison scope, `model_tier: deep` (FR-010)
- [X] T034 [P] [US1] Create `core/agents/inv-report.md` with six-part ELI5-first report assembly contract referencing `contracts/report-output.md` (FR-018, FR-032, FR-033)

### Starter playbooks

- [X] T035 [P] [US1] Create `core/playbooks/playbook-elastic/SKILL.md` with query dialect, read-only patterns, auth/access-mode handling, correlation-field guidance (FR-012, FR-013)
- [X] T036 [P] [US1] Create `core/playbooks/playbook-mssql/SKILL.md` with MSSQL traps: `nvarchar(max)` index key Msg 1919, `LOWER()` index defeat, timeout 258 diagnostics, correlation-field guidance (FR-013)
- [X] T037 [P] [US1] Create `core/playbooks/playbook-redis/SKILL.md` with read-only Redis patterns, auth modes, correlation guidance (FR-012, FR-013)
- [X] T038 [P] [US1] Create `core/playbooks/playbook-k8s-logs/SKILL.md` with log query patterns, namespace/pod correlation, read-only constraints (FR-012, FR-013)
- [X] T039 [US1] Add FR-030 redaction-before-write instructions to all four playbooks in `core/playbooks/*/SKILL.md` referencing `core/templates/redaction-rules.md`

### Registry bindings

- [X] T040 [US1] Finalize `core/templates/registry.yml.tpl` bindings: map elastic/k8s-logs → `inv-log-rca`, mssql/redis → `inv-data-rca`, allow multi-subagent sharing per FR-014

**Checkpoint**: Orchestrator + subagents + playbooks complete; investigation flow testable with manual file placement

---

## Phase 4: User Story 3 — First-Run Adaptation (Priority: P2)

**Goal**: `investigator-init` scan-first interview adapting kit to target project. BRIEF §9 phase 4 (FR-035–FR-041).

**Independent Test**: After manual skill placement, run `investigator-init`; verify scan-first order, knowledge-source 3-option flow, populated `profile.md` and `config.yml`, empty case index, re-run preserves memories/cases.

- [X] T041 [US3] Create `core/skills/investigator-init/SKILL.md` with scan-first workflow: infer services, DBs, log systems, webhooks, correlation keys before asking redundant questions (FR-035)
- [X] T042 [US3] Add knowledge-source interview to `core/skills/investigator-init/SKILL.md`: Docki / docs folder / codebase scan; pre-select Docki when `knowledge/AI_CONTEXT.md` exists; no Docki install; nudge on options 2/3 (FR-036)
- [X] T043 [US3] Add stack summary confirmation step to `core/skills/investigator-init/SKILL.md` for user corrections only
- [X] T044 [US3] Add per-data-source access mode prompts (`manual`/`mcp`/`cli`) writing to `config.yml` `data_sources` array (FR-037, FR-026)
- [X] T045 [US3] Add unknown-tool detection to `core/skills/investigator-init/SKILL.md`: dep manifests, config files, env-var/connection-string fragments, SDK imports, `*.md` mentions — combined with absent registry playbook triggers onboarding (FR-038)
- [X] T046 [US3] Add unknown-tool onboarding interview branch to `core/skills/investigator-init/SKILL.md`: URL/API, query language, auth, example query, correlation fields, read-only constraints → generate playbook + registry entry + binding + memory + smoke query (FR-038)
- [X] T047 [US3] Add model tier mapping step to `core/skills/investigator-init/SKILL.md` writing `host_model_map` tiers; must not infer or overwrite `host`/`host_model_map.host` (FR-039, FR-041, FR-051a)
- [X] T048 [US3] Add completion outputs to `core/skills/investigator-init/SKILL.md`: write `.investigator/profile.md`, merge `config.yml`, merge `registry.yml`, seed empty memories and case index (FR-040)
- [X] T049 [US3] Add re-run merge behavior to `core/skills/investigator-init/SKILL.md`: update config/profile without clobbering `cases/`, `memory/`, or `playbook-memory/` content (FR-041)

**Checkpoint**: Init skill complete; project adaptation testable with manually placed skills

---

## Phase 5: User Story 2 & 6 — CLI Installer & Portability (Priority: P1 / P3)

**Goal**: `npx investigator-kit init` with host flags, dialect transform, `.investigator/` scaffold, re-install overwrite prompts. BRIEF §9 phase 5 (FR-043–FR-051b). US6 portability verified via host-switch re-install.

**Independent Test (US2)**: `npx investigator-kit init --cursor` on empty project → skills, agents, `.investigator/` scaffold, exact completion message. Repeat `--claude` and no-flag list prompt.

**Independent Test (US6)**: After case completes, re-install other host with KEEP on `.investigator/` → byte-identical state, new host paths.

### Installer implementation

- [X] T050 [US2] Implement `installer/lib/transform-agent.js` per `contracts/agent-dialect-transform.md`: parse canonical frontmatter, emit `model: inherit`, optional tools, byte-identical body
- [X] T051 [US2] Implement `installer/lib/prompts.js`: host list prompt (Cursor, Claude Code, no auto-detect), three per-group overwrite prompts with defaults (skills Y, subagents Y, `.investigator/` N) per FR-049
- [X] T052 [US2] Implement `installer/lib/install.js` core: resolve cwd, copy skills unchanged to host skills path, transform+copy agents, scaffold `.investigator/` from templates
- [X] T053 [US2] Add host-aware scaffold to `installer/lib/install.js`: write `host` and `host_model_map.host` from CLI selection; rewrite `registry.yml` `skill_path` from `{{HOST_SKILLS}}` to `.cursor/skills/` or `.claude/skills/` (FR-051a, FR-051b)
- [X] T054 [US2] Add re-install logic to `installer/lib/install.js`: per-group prompts via manifest; KEEP on group (c) skips overwrite of existing memory/cases, allows additive missing stubs only
- [X] T055 [US2] Implement `installer/bin/cli.js` with `commander`: `init` subcommand, `--cursor`, `--claude`, `--force` flags, mutual exclusion, exit codes per `contracts/cli-installer.md`
- [X] T056 [US2] Add exact completion message output to `installer/bin/cli.js`: `Installed. Open your agent and run the 'investigator-init' skill to adapt it to this project.` (FR-048)
- [X] T057 [US6] Add host-switch path to `installer/lib/install.js`: when group (c) OVERWRITE on re-install, refresh `host` and all `skill_path` values for new host (US6, SC-006)

### Installer tests

- [X] T058 [P] [US2] Create `installer/tests/fixtures/inv-log-rca.canonical.md` and expected Cursor/Claude snapshots in `installer/tests/fixtures/expected/`
- [X] T059 [P] [US2] Create `installer/tests/transform-agent.test.js` with snapshot tests for all five agents per `contracts/agent-dialect-transform.md`
- [X] T060 [US2] Create `installer/tests/install.integration.test.js` covering: empty `--cursor`/`--claude` scaffold, host list selection, KEEP-default on `.investigator/`, FR-051a/b config/registry paths
- [X] T061 [US6] Add byte-identical `.investigator/` preservation test to `installer/tests/install.integration.test.js` for re-install with KEEP on group (c) (SC-006)

**Checkpoint**: US2 and US6 independently testable via CLI and vitest

---

## Phase 6: User Story 4 — Post-Init Tool Onboarding (Priority: P2)

**Goal**: `investigator-add-agent` skill reusing unknown-tool interview. BRIEF §9 phase 6 (FR-052–FR-053).

**Independent Test**: Run `investigator-add-agent` in initialized project; onboard Grafana; verify new playbook, registry entry, binding, `playbook-memory/grafana.md`, smoke query — zero edits to `core/agents/*.md`.

- [X] T062 [US4] Create `core/skills/investigator-add-agent/SKILL.md` reusing unknown-tool interview from `core/skills/investigator-init/SKILL.md` (FR-052)
- [X] T063 [US4] Add artifact generation to `core/skills/investigator-add-agent/SKILL.md`: playbook skill under host skills path, `registry.yml` append, subagent binding update, `playbook-memory/<tool>.md`, smoke-query verification (FR-053, FR-015)
- [X] T064 [US4] Add cancel/rollback guidance to `core/skills/investigator-add-agent/SKILL.md`: no partial artifacts or mark incomplete stubs safe to remove (US4 scenario 2)

**Checkpoint**: US4 independently testable after init

---

## Phase 7: User Story 1 — Golden Scenario Validation (Priority: P1)

**Goal**: Synthesized fixtures and dual-host E2E validation gate. BRIEF §9 phase 7 (FR-056–FR-057, SC-002–SC-004).

**Independent Test**: Install on scratch project with fixtures; run orchestrator on webhook+SQL ticket; verify both root causes ≥ medium confidence, six-part report, ≥2 subagent domains, zero FR-030 secrets. Repeat on both hosts.

### Golden fixtures

- [X] T065 [US1] Create `docs/golden-fixtures/README.md` describing fixture layout and expected root causes
- [X] T066 [P] [US1] Create `docs/golden-fixtures/src/webhook/` handler expecting `requestIdHash` with sample provider payload containing `requestID`
- [X] T067 [P] [US1] Create `docs/golden-fixtures/src/data/` SQL schema with unindexed `nvarchar(max)` lookup column and distributed lock wrapper (35s timeout)
- [X] T068 [P] [US1] Create `docs/golden-fixtures/logs/` snippets with SQL error 258 and lock timeout messages
- [X] T069 [US1] Create `docs/golden-fixtures/ticket.md` incident description for orchestrator intake (webhook "record not found" + DB hang past 35s lock)

### E2E validation runs

- [X] T070 [US1] Run full quickstart §2–§4 on Cursor: install to scratch project, copy fixtures, run `investigator-init`, run `investigator` on golden ticket; record pass/fail against SC-002–SC-004 checklist in `specs/001-investigator-kit/quickstart.md`
- [X] T071 [US1] Run full quickstart §4.3 on Claude Code: repeat golden scenario on `--claude` scratch install; verify both root causes ≥ medium confidence with rubric reasoning (SC-002)
- [X] T072 [US1] Run quickstart §5 portability check after golden case: re-install other host, KEEP `.investigator/`, confirm prior case readable (US6 cross-check)
- [X] T073 [US1] Run quickstart §6 case-library reuse: seed index row, start matching incident, verify semantic lookup cites prior case id (US5 cross-check, SC-007)

**Checkpoint**: Golden gate green on both hosts — kit ready for release

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, package hygiene, full quickstart validation

- [X] T074 [P] Update root `package.json` publish config and `README.md` with install instructions and link to `docs/README.md`
- [X] T075 [P] Verify all `core/skills/*/SKILL.md` and `core/agents/*.md` reference `core/templates/redaction-rules.md` for FR-030 compliance
- [X] T076 Run `cd installer && npm test` and fix any failing transform or integration tests
- [X] T077 Run complete `specs/001-investigator-kit/quickstart.md` checklist (§1–§8) and document results in `docs/README.md`
- [X] T078 [P] Audit `core/templates/registry.yml.tpl` and generated `.investigator/registry.yml` samples for correct host-specific `skill_path` on both `--cursor` and `--claude` installs (FR-051b)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Investigation Core (Phase 3)**: Depends on Phase 2 — blocks US1 validation; can proceed before CLI (content is canonical under `core/`)
- **Init (Phase 4)**: Depends on Phase 2 templates; soft-depends on Phase 3 playbooks for registry awareness
- **CLI (Phase 5)**: Depends on Phase 2 templates + Phase 3–4 skills/playbooks existing in `core/`
- **Add-Agent (Phase 6)**: Depends on Phase 4 init skill (shared interview)
- **Golden Validation (Phase 7)**: Depends on Phases 3–6 complete
- **Polish (Phase 8)**: Depends on Phase 7

### User Story Dependencies

| Story | Priority | Depends on | Delivered in |
|-------|----------|------------|--------------|
| US1 | P1 | Phases 2–6 | Phase 3 (core) + Phase 7 (validation) |
| US2 | P1 | Phase 2 | Phase 5 |
| US3 | P2 | Phase 2 | Phase 4 |
| US4 | P2 | Phase 4 | Phase 6 |
| US5 | P2 | Phase 2 | Phase 3 (orchestrator step 0) |
| US6 | P3 | Phase 5 | Phase 5 + Phase 7 §5 cross-check |

### Within Each User Story

- Canonical agents/playbooks before orchestrator references them (T030–T038 before T022–T029 content that dispatches them)
- Installer tests after implementation (T058–T061 after T050–T057)
- Golden fixtures before E2E runs (T065–T069 before T070–T073)

### Parallel Opportunities

- **Phase 1**: T005, T006, T007 in parallel
- **Phase 2**: T012–T018 in parallel after T008–T011
- **Phase 3**: T030–T038 (all subagents + playbooks) in parallel; T035–T038 in parallel
- **Phase 5**: T058–T059 in parallel with T050–T057 after T050 exists
- **Phase 7**: T066–T068 fixture files in parallel
- **Cross-phase** (after Phase 2): Phase 3 and Phase 4 can run in parallel if staffed separately; Phase 5 requires Phase 3–4 skills on disk

---

## Parallel Example: Phase 3 Subagents + Playbooks

```bash
# Launch all five canonical subagents together:
Task T030: "Create core/agents/inv-log-rca.md ..."
Task T031: "Create core/agents/inv-data-rca.md ..."
Task T032: "Create core/agents/inv-code-rca.md ..."
Task T033: "Create core/agents/inv-vendor-compare.md ..."
Task T034: "Create core/agents/inv-report.md ..."

# Launch all four playbooks together:
Task T035: "Create core/playbooks/playbook-elastic/SKILL.md ..."
Task T036: "Create core/playbooks/playbook-mssql/SKILL.md ..."
Task T037: "Create core/playbooks/playbook-redis/SKILL.md ..."
Task T038: "Create core/playbooks/playbook-k8s-logs/SKILL.md ..."
```

---

## Implementation Strategy

### MVP First (Investigation Core + CLI)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL**)
3. Complete Phase 3: Investigation core (orchestrator + agents + playbooks)
4. Complete Phase 5: CLI installer (minimal path to installable kit)
5. **STOP and VALIDATE**: Manual install + placeholder init → smoke orchestrator dispatch
6. Add Phase 4, 6, then Phase 7 golden gate

### BRIEF §9 Sequential Strategy (recommended)

1. Phase 1 → Phase 2 (skeleton)
2. Phase 3 (orchestrator + subagents + playbooks)
3. Phase 4 (init)
4. Phase 5 (CLI)
5. Phase 6 (add-agent)
6. Phase 7 (golden validation) — **release gate**
7. Phase 8 (polish)

### Parallel Team Strategy

With multiple developers after Phase 2:

- **Developer A**: Phase 3 orchestrator skill (T022–T029)
- **Developer B**: Phase 3 subagents (T030–T034)
- **Developer C**: Phase 3 playbooks (T035–T039)
- Merge, then **Developer A**: Phase 4 init; **Developer B**: Phase 5 CLI

---

## Notes

- Constitution (`.specify/memory/constitution.md`) is unfilled — BRIEF.md + spec FRs govern; no TDD mandate for prose skills
- Golden E2E (T070–T073) is agent-driven; pass criteria in `quickstart.md` and `contracts/report-output.md`
- High-risk tasks called out below
- `[P]` tasks touch different files; avoid concurrent edits to same SKILL.md (e.g. T022–T029 are sequential on `investigator/SKILL.md`)

---

## High-Risk Tasks

| Task | Risk | Mitigation |
|------|------|------------|
| T022 | Semantic case lookup is LLM-driven prose — hard to test mechanically | Seed index rows in T073; explicit plan template in `plan.md.tpl` |
| T036 | MSSQL trap knowledge must surface in golden RCA | Golden fixtures + ticket text name timeout 258 and lock; playbook must document Msg 1919 |
| T050–T053 | Dialect transform + registry path rewrite easy to get wrong | Snapshot tests T059; FR-051a/b vectors in `contracts/cli-installer.md` |
| T054 | KEEP logic may clobber memories if wrong | Integration test T060–T061; default N on group (c) |
| T070–T071 | Agent-driven E2E non-deterministic | Explicit ticket in T069; SC-002 pass criteria; manual checklist |
| T028, T039 | Secret redaction in prose-only skills | Shared `redaction-rules.md`; inv-report FR-031 fail gate |
