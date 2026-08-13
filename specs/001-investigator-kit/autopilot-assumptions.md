# Autopilot — Decision Log

**Feature**: `001-investigator-kit`
**Pipeline mode**: Autopilot Review
**Log purpose**: Audit trail of every non-BRIEF.md decision applied to the
feature spec during the pipeline. Each entry records WHO made the decision,
WHEN, WHAT was decided, and WHERE in the spec the decision landed.

> Naming note: this file is called `autopilot-assumptions.md` for pipeline
> convention, but the entries below are **explicit user decisions taken at a
> Gate pause**, not autopilot-generated assumptions. They are recorded here
> so that later phases (`/speckit-plan`, `/speckit-analyze`, review, audit)
> can trace every non-BRIEF.md rule back to a human decision moment.

---

## Session 2026-08-13 — Gate A (post-`/speckit-clarify`)

### Source
- **Phase**: `speckit-clarify` (autopilot review mode)
- **Model used for question generation**: `claude-opus-4-7-thinking-xhigh`
- **Decision-maker**: Human product owner
- **Delivery channel**: Parent orchestrator relayed answers back to the
  `speckit-clarify` subagent after presenting the 5 questions from
  `clarify-questions.md` at Gate A.
- **BRIEF.md status for these five topics**: silent (that is why they were
  surfaced as questions rather than auto-resolved from BRIEF.md).

### Decisions

#### D1 — Installer overwrite prompt granularity

- **Question**: On re-install, at what granularity should the CLI ask for
  overwrite confirmation before replacing existing skills, agents, or
  `.investigator/` files (FR-049)?
- **Options presented**: A (single global Y/N) · **B (per-group prompts,
  `.investigator/` default KEEP)** · C (per-file) · D (always overwrite
  skills+agents, never `.investigator/`, `--force` override).
- **Decision**: **Option B**. Three per-group prompts (skills / subagents /
  `.investigator/`). The `.investigator/` prompt defaults to KEEP so
  accumulated learning is preserved unless the user explicitly opts in.
- **Rationale (user + recommendation)**: `.investigator/` holds precious
  learned state per BRIEF §3.4; skills and subagents can safely refresh
  from the canonical form. Three prompts is a simple, teachable UX.
- **Spec touchpoints updated**: FR-049; US2 acceptance scenario 4; Edge Case
  "Re-install on an already-installed project".

#### D2 — Case-library matching mechanism + index schema enrichment

- **Question**: How should the orchestrator determine that a prior case in
  `cases/index.md` "matches" a new incident during the case-library lookup
  step (FR-004 step 0, US5)?
- **Options presented**: A (exact string match on signature) · B (tag-first
  + keyword overlap) · **C (LLM-driven semantic)** · D (any shared tag or
  keyword).
- **Decision**: **Option C, user-customized** — LLM-driven semantic matching
  over ALL documented fields per row in `cases/index.md`, not only symptom
  signature + tags. The user additionally required that the case-index row
  schema be enriched with a concise RCA / root-cause summary per case
  (≥ 1 sentence, ≤ ~3 sentences) so that semantic matching has enough
  substance to identify matches. Testability is preserved by requiring the
  orchestrator to cite the matched prior case id AND state its reasoning
  (which fields corroborated, which diverged) in the investigation plan.
- **Rationale (user)**: Signature+tags alone under-specify a case for a
  semantic model. Adding a written RCA summary lets the LLM compare on
  substance while keeping the index a plain-Markdown, human-readable table.
- **Spec touchpoints updated**: US5 story description; US5 acceptance
  scenarios 1 and 2; US5 Independent Test; FR-004 step 0; FR-009 (case-close
  writes RCA summary too); FR-021 (index-row schema now includes RCA
  summary + case-id format); **new FR-021a** (defines the semantic-matching
  contract, citation + reasoning requirement, and the "never promote prior
  root cause to conclusion" guardrail); Key Entities → Case; SC-007.

#### D3 — Unknown-tool detection signals during init scan

- **Question**: During `investigator-init`, what counts as a "reference to a
  log/data tool with no matching playbook" that should trigger the
  unknown-tool onboarding prompt (FR-038)?
- **Options presented**: A (any string match) · **B (concrete-evidence
  signals)** · C (dep-manifest only) · D (curated per-tool signal list).
- **Decision**: **Option B extended** — concrete-evidence signals
  (dependency manifests, tool-specific config files, environment-variable
  names / connection-string fragments, SDK imports in source) PLUS mentions
  of the tool in any `*.md` documentation file in the repo. Any one signal
  combined with the absence of a registered playbook triggers the prompt.
- **Rationale (user)**: Project docs in Markdown reliably name the
  datastores, log systems, and observability tools a project relies on
  (e.g. SQL/Postgres, Mongo, Grafana). Excluding docs would miss real
  tools in doc-first projects.
- **Spec touchpoints updated**: FR-038; US3 acceptance scenario 6; Edge
  Case "Unknown tool discovered during scan".

#### D4 — Secret-redaction ruleset

- **Question**: What patterns count as a "secret" for the mandatory
  redaction step before pasted tool output is written to the ledger,
  memory, or report (FR-030, SC-004)?
- **Options presented**: A (user-marked only) · **B (curated regex +
  entropy + key-name)** · C (regex only) · D (external secret-scanner
  library).
- **Decision**: **Option B**. Curated credential regex set (API keys, JWTs,
  bearer tokens, `password=` in connection strings, AWS/GCP access keys,
  PEM / private-key blocks) + high-entropy check on standalone tokens
  ≥ 32 characters + suspicious-key-name check
  (`password|secret|token|key|credential`, case-insensitive). Redacted
  values are replaced with a stable `[REDACTED]` placeholder.
- **Rationale (user + recommendation)**: Defense-in-depth catches known
  credential shapes AND high-entropy random tokens AND value-by-key-name
  leaks without adding a runtime dependency.
- **Spec touchpoints updated**: FR-030 (definition); FR-031 (tied to the
  same ruleset); SC-004 (measurable, ruleset-tied); Edge Case "Pasted tool
  output contains a secret".

#### D5 — Case ID format

- **Question**: What format should case IDs take (FR-021)?
- **Options presented**: A (UUID v4) · **B (`YYYYMMDD-<short-slug>` with
  time+random fallback)** · C (sequential integer) · D (free-form slug).
- **Decision**: **Option B**. `YYYYMMDD-<short-slug>` where `<short-slug>`
  is a lowercase kebab-case summary picked at case-open time (e.g.
  `20260813-webhook-payload-mismatch`); fallback to
  `YYYYMMDD-HHMM-<random4>` when no slug is supplied.
- **Rationale (user + recommendation)**: Chronological sorting +
  human-readable in file lists and citations + no cross-machine collisions.
- **Spec touchpoints updated**: FR-021 (case-id format rule); Key Entities
  → Case.

---

## Files updated as a result of this session

- `specs/001-investigator-kit/spec.md` — new `## Clarifications` →
  `### Session 2026-08-13` section with all 5 Q/A bullets, plus targeted
  updates across the sections listed under each decision above.
- `specs/001-investigator-kit/clarify-questions.md` — each question marked
  **ANSWERED** with the accepted answer and a back-pointer to this log.
- `specs/001-investigator-kit/checklists/requirements.md` — notes section
  updated to reflect the 2026-08-13 clarification session; all checklist
  items remain checked (see file for details).
- `specs/001-investigator-kit/autopilot-assumptions.md` (this file) —
  created.

## Next pipeline step

`/speckit-plan` is now unblocked. All five Gate A questions are resolved
and integrated into the spec body (not only in the Clarifications section).

---

## Session 2026-08-13 — Gate B (post-`/speckit-analyze` review)

### Source

- **Phase**: `speckit-analyze` review gate
- **Model used for analysis**: `composer-2.5-fast`
- **Decision-maker**: Human product owner (user approved all four High fixes)
- **Delivery channel**: Parent orchestrator relayed Gate B approvals after
  analysis report in `specs/001-investigator-kit/analysis.md`.

### Decisions

#### G1 — B1: BRIEF case-library drift

- **Finding**: BRIEF §3.1/§3.4 stale after Gate A clarifications (semantic
  case matching + RCA summary column).
- **Decision**: Add **`BRIEF.md` §Amendments** (2026-08-13) superseding §3.1
  step 0 and §3.4 in place; do **not** rewrite those sections directly.
- **Artifacts updated**: `BRIEF.md`, `analysis.md` (B1 → RESOLVED).

#### G2 — U1: Installer persists host into config

- **Finding**: `config.host` / `host_model_map.host` provenance ambiguous;
  init must not infer host from filesystem (FR-045).
- **Decision**: Installer writes `host` and `host_model_map.host` from
  `--cursor`/`--claude`/prompt selection at scaffold; init merges other
  fields only.
- **Artifacts updated**: `spec.md` (FR-051a, FR-041), `data-model.md`,
  `contracts/cli-installer.md`, `contracts/config-schemas.yml`, `analysis.md`
  (U1 → RESOLVED).

#### G3 — U2: Registry skill_path host transform

- **Finding**: `registry.yml` hardcoded `.cursor/skills/…` with no install-time
  host rewrite.
- **Decision**: Installer rewrites `skill_path` to `.cursor/skills/…` or
  `.claude/skills/…` at scaffold, mirroring agent dialect transform; add
  installer test vectors.
- **Artifacts updated**: `spec.md` (FR-051b), `contracts/cli-installer.md`,
  `contracts/config-schemas.yml`, `data-model.md`, `analysis.md` (U2 →
  RESOLVED).

#### G4 — U3: FR-018 cross-reference correction

- **Finding**: FR-018 pointed to FR-034 (no-code-fixes) instead of FR-032
  (six-part report contract).
- **Decision**: Correct cross-reference to FR-032, FR-033.
- **Artifacts updated**: `spec.md`, `analysis.md` (U3 → RESOLVED).

### Gate B outcome

All four High analysis findings resolved. Critical/High open count: **0**.
Next pipeline step: `/speckit-tasks`.
