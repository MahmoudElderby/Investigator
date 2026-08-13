# Specification Analysis Report

**Feature**: `001-investigator-kit`  
**Phase**: analyze  
**Model**: composer-2.5-fast  
**Date**: 2026-08-13 (Gate B remediation applied same day)  
**Status**: High findings resolved — ready for `/speckit-tasks`
**Artifacts reviewed**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/*`, `checklists/requirements.md`, `autopilot-assumptions.md`, `BRIEF.md` (effective design constitution)  
**Not reviewed (expected absent)**: `tasks.md` — analysis runs before `/speckit-tasks` in this pipeline; missing `tasks.md` is **not** a finding.

---

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| B1 | Inconsistency | ~~**HIGH**~~ **RESOLVED** | `BRIEF.md` §3.1, §3.4; `spec.md` FR-021, FR-021a | Gate A clarifications changed case-library lookup to LLM semantic matching over all index fields and added an RCA-summary column, but **`BRIEF.md` still described tag/signature search and an index without RCA summary**. | ~~Amend BRIEF…~~ **Fixed**: Added `BRIEF.md` §Amendments (2026-08-13) superseding §3.1 step 0 and §3.4 in place; points to `autopilot-assumptions.md`. |
| U1 | Underspecification | ~~**HIGH**~~ **RESOLVED** | `data-model.md`; `spec.md` FR-051a, FR-041; `contracts/cli-installer.md` | `config.host` provenance was ambiguous; init could not safely set host without filesystem auto-detect. | **Fixed**: Added FR-051a; installer scaffolds `host` + `host_model_map.host` from CLI selection; FR-041 forbids init host inference; updated `data-model.md` + `cli-installer.md` + `config-schemas.yml`. |
| U2 | Underspecification | ~~**HIGH**~~ **RESOLVED** | `contracts/config-schemas.yml`; `spec.md` FR-051b; `contracts/cli-installer.md` | `registry.yml` `skill_path` hardcoded `.cursor/` with no host transform contract. | **Fixed**: Added FR-051b; `cli-installer.md` host-aware scaffold + test vectors; `config-schemas.yml` `host_transform` with cursor/claude examples. |
| U3 | Underspecification | ~~**HIGH**~~ **RESOLVED** | `spec.md` FR-018 | `FR-018` pointed to FR-034 (no-code-fixes) instead of FR-032 (report contract). | **Fixed**: FR-018 cross-reference corrected to FR-032, FR-033. |
| C1 | Constitution | **MEDIUM** | `.specify/memory/constitution.md`; `plan.md` Constitution Check | Constitution file remains the unfilled template; plan correctly waives TDD and notes open risk. **Known accepted state** per project guidance — not blocking. | Run `/speckit-constitution` before implement if the team wants formal gates; until then continue governing from `BRIEF.md` + spec FRs. |
| C2 | Coverage | **MEDIUM** | `contracts/cli-installer.md`; `research.md` R1/R3; `spec.md` FR-043–049 | `--force` flag (non-interactive overwrite defaults) is defined in contracts/research but **absent from spec FRs** and user stories. | Add FR-049a (or extend FR-049) documenting `--force` behavior matching the contract defaults. |
| A1 | Ambiguity | **MEDIUM** | `contracts/report-output.md` §Example skeleton | Example lists **Overall: medium-high**, but the rubric and FR-007 allow only `high \| medium \| low`. | Fix example to use a valid enum value (e.g. `medium`) or define a composite scale in the contract. |
| U4 | Underspecification | **MEDIUM** | `spec.md` Edge Cases (MCP fallback); `plan.md`; `contracts/*` | MCP-unavailable → `manual` fallback with ledger notice is specified only in spec edge cases; plan Phase 2–3 and contracts do not reference it. | Add one line to orchestrator skill exit criteria (plan Phase 2) and optionally `data-model.md` case lifecycle notes. |
| U5 | Underspecification | **MEDIUM** | `spec.md` Edge Cases (concurrent subagents); `data-model.md` §5.3 | Spec requires per-subagent ledger sections merged by orchestrator; `data-model.md` lists `evidence-ledger.md` as a single file with no section schema. | Extend `data-model.md` and case artifact templates with a section-per-subagent convention (headings or IDs). |
| U6 | Underspecification | **MEDIUM** | `spec.md` US4 acceptance scenario 2 | Cancel mid-`investigator-add-agent` allows "partial artifacts … clearly marked incomplete" — untestable without a defined marker convention. | Pick one: atomic rollback on cancel, or a required `status: incomplete` frontmatter/header in partial playbooks. |
| T1 | Inconsistency | **MEDIUM** | `autopilot-assumptions.md` D2 Source | Log states BRIEF was **silent** on case matching; BRIEF §3.1 actually specifies symptom-signature + tag search (superseded by clarification, not silent). | Correct the D2 source note so audit trail accurately records a **BRIEF override**, not silence. |
| D1 | Duplication | **LOW** | `spec.md` FR-018, FR-032 | Report output contract appears in both FR-018 (`inv-report` duty) and FR-032 (full section list). Wording is complementary, not conflicting. | Optional consolidation: FR-018 references FR-032 only (see U3). |
| T2 | Terminology | **LOW** | `checklists/requirements.md` | Checklist marks "Success criteria are technology-agnostic" as passed while SC-001/002 reference `npx`, SQL error 258, etc.; notes section explains BRIEF mirroring. | Add a checklist footnote that product constraints from BRIEF are exempt from technology-agnostic SC rule. |
| A2 | Ambiguity | **LOW** | `contracts/secret-redaction.md` Rule C | Substring match on key name `key` may redact benign fields (e.g. `monkey`, `api_key` vs public demo keys). | Document accepted false-positive tradeoff in `secret-redaction.md` or narrow pattern to word-boundary match in a follow-up. |

**Overflow**: None (13 findings ≤ 50 cap).

---

## Coverage Summary Table

`tasks.md` does not exist yet. Task mapping is **deferred** to `/speckit-tasks`; coverage percentages below are informational only.

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 … FR-057, FR-021a, FR-051a, FR-051b | Pending | — | Awaiting `tasks.md` |
| SC-001 … SC-010 | Pending | — | Success criteria should map to Phase 7 validation + installer tests in tasks |

**Buildable success criteria requiring future tasks**: SC-002 (golden E2E both hosts), SC-004 (zero secrets in `.investigator/`), SC-006 (byte-identical state on host switch), SC-010 (installer question budget).

---

## Constitution / BRIEF Alignment

| Source | Status |
|--------|--------|
| `.specify/memory/constitution.md` | Unfilled template — **known accepted state** (Medium C1 only) |
| `BRIEF.md` | **Aligned** — §Amendments (2026-08-13) supersedes §3.1/§3.4 case-library wording; matches spec FR-021/FR-021a. |
| Out-of-scope guardrails | Spec/plan/contracts consistently enforce: no Docki install, no codebase fixes, no live credentials, Cursor + Claude only. |

---

## Unmapped Tasks

Not applicable — `tasks.md` not generated.

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Functional Requirements | 60 (FR-001–FR-057 + FR-021a + FR-051a + FR-051b) |
| Total Success Criteria | 10 (SC-001–SC-010) |
| Total User Stories | 6 (US1–US6) |
| Total Tasks | 0 (`tasks.md` absent — expected) |
| Requirement task coverage | N/A (pre-tasks) |
| Ambiguity count | 2 (A1, A2) |
| Duplication count | 1 (D1) |
| **Critical issues** | **0** |
| **High issues** | **0** (4 resolved at Gate B, 2026-08-13) |
| Medium issues | 7 |
| Low issues | 2 |

---

## Re-verification (post Gate B fixes)

Quick cross-check of touched artifacts — **no new Critical or High inconsistencies introduced**:

| Check | Result |
|-------|--------|
| BRIEF §Amendments ↔ spec FR-021/FR-021a | Consistent (semantic lookup + RCA summary column) |
| FR-051a ↔ cli-installer.md scaffold step ↔ data-model `host` provenance ↔ config-schemas | Consistent (installer writes host; init must not infer) |
| FR-051b ↔ cli-installer test vectors ↔ config-schemas `host_transform` ↔ data-model `skill_path` | Consistent (per-host `.cursor/` / `.claude/` paths) |
| FR-018 → FR-032/FR-033 | Correct cross-reference |
| FR-041 host non-inference ↔ FR-051a | Consistent |

---

## Next Actions

1. **Proceed to `/speckit-tasks`** — all High findings resolved at Gate B.
2. Medium items (C2, A1, U4–U6, T1) can be folded into spec/contract touch-ups during task generation or first implement pass.
3. Re-run `/speckit-analyze` after `tasks.md` exists to validate requirement→task coverage.

---

## Remediation Offer

All four High findings were remediated at Gate B (2026-08-13). No open High/Critical items remain.
