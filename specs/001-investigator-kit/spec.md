# Feature Specification: Investigator Kit — Portable AI Investigation System

**Feature Branch**: `001-investigator-kit`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Build the Investigator kit exactly as specified in BRIEF.md at the repo root. Read BRIEF.md fully first — it is the finalized, agreed design and the single source of truth. Cover all build phases in §9."

**Source of truth**: `BRIEF.md` at the repo root. Every decision below is settled by that brief unless explicitly re-opened by the owner. This spec is scoped to the seven build phases in BRIEF.md §9 and respects the out-of-scope items in §10.

## Clarifications

### Session 2026-08-13

- Q: On re-install, at what granularity should the CLI ask for overwrite
  confirmation before replacing existing skills, agents, or `.investigator/`
  files (FR-049)? → A: Per-group prompts covering (a) skills, (b) subagents,
  and (c) `.investigator/` state, with the `.investigator/` prompt defaulted
  to KEEP so accumulated learning (memories, playbook memories, case library)
  is preserved unless the user explicitly opts in.
- Q: How should the orchestrator determine that a prior case in
  `cases/index.md` "matches" a new incident during the case-library lookup
  step (FR-004 step 0, US5)? → A: LLM-driven semantic comparison of the new
  incident against every documented field on every row in `cases/index.md`.
  To give the semantic match enough substance, each row MUST carry a
  concise RCA / root-cause summary in addition to symptom signature, tags,
  services, and confidence. The orchestrator MUST cite the matched prior
  case id in its investigation plan and state its reasoning for the match.
- Q: During `investigator-init`, what counts as a "reference to a log/data
  tool with no matching playbook" that should trigger the unknown-tool
  onboarding prompt (FR-038)? → A: Concrete-evidence signals — dependency
  manifests, tool-specific config files, environment-variable names /
  connection-string fragments, SDK imports in source — PLUS mentions of the
  tool in any `*.md` documentation file in the repo. Any one such signal
  combined with the absence of a registered playbook triggers the prompt.
- Q: What patterns count as a "secret" for the mandatory redaction step
  before pasted tool output is written to the ledger, memory, or report
  (FR-030, SC-004)? → A: A curated credential regex set (API keys, JWTs,
  bearer tokens, `password=` in connection strings, AWS/GCP access keys,
  PEM / private-key blocks), PLUS a high-entropy check on standalone tokens
  of length ≥ 32 characters, PLUS a suspicious-key-name check for values
  whose key matches `password|secret|token|key|credential`
  (case-insensitive).
- Q: What format should case IDs take (FR-021)? → A: `YYYYMMDD-<short-slug>`
  where `<short-slug>` is a lowercase kebab-case summary picked at case-open
  time (e.g. `20260813-webhook-payload-mismatch`), with a
  `YYYYMMDD-HHMM-<random4>` fallback when no slug is supplied.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - End-to-end golden-scenario RCA (Priority: P1)

An on-call engineer receives a production ticket: a downstream provider's webhook
started returning "record not found" errors, and shortly after, a database
operation began hanging past the 35-second distributed lock and timing out. The
engineer opens their AI agent, hands the ticket to the Investigator orchestrator,
and asks for a root-cause analysis. The orchestrator interrogates itself until
every question is answered or parked, shows a Direction Brief (problem, Q→A log,
who it will send and who it will skip), then dispatches only the specialists
with a mission, independently, cross-examines their findings,
records evidence in the case ledger, and produces an ELI5-first RCA report that
identifies **two** root causes: (a) the provider sends the correlation field as
`requestID` while our DTO expects `requestIdHash`, and (b) an `nvarchar(max)`
column is being used as a lookup key without an index, which causes SQL timeout
258 while the caller is inside a 35-second distributed lock. The report lists
short-term and long-term fix recommendations and confidence scores derived from a
written rubric. The engineer never has to write any fix themselves — they just
read the report and decide what to do.

**Why this priority**: This is the whole reason the kit exists. Without a working
end-to-end investigation flow that reaches sensible root causes on the golden
scenario, no other capability is meaningful. This story is also the validation
gate defined in BRIEF.md §9 phase 7.

**Independent Test**: Install the kit into a scratch project that contains the
golden fixtures (webhook payload with `requestID`, DTO expecting `requestIdHash`,
an unindexed `nvarchar(max)` lookup, a 35-second distributed lock, and a SQL
timeout 258 event). Run the orchestrator on the incident. Verify the produced
report identifies both root causes with non-low confidence, follows the
ELI5-first output contract, and cites evidence from at least two independent
subagents. Also verify `plan.md` contains a Direction Brief written before
dispatch, with a self-interrogation log and explicit send/skip rationale.

**Acceptance Scenarios**:

1. **Given** the kit is installed and adapted, and the golden fixtures are
   available, **When** the engineer asks the orchestrator to investigate the
   ticket, **Then** the report identifies the webhook field-name mismatch
   (`requestID` vs `requestIdHash`) with evidence from vendor-compare and code-
   trace subagents and a confidence tag reflecting multi-source corroboration.
2. **Given** the same investigation, **When** the report is produced, **Then**
   the SQL timeout 258 finding is attributed to an unindexed `nvarchar(max)`
   lookup executing inside a 35-second distributed lock, backed by evidence from
   the data and log subagents, with per-finding confidence and rubric reasoning.
3. **Given** the report is produced, **When** the engineer reads section 1,
   **Then** they see a plain-language ELI5 explanation before any technical
   detail, followed in order by technical root cause with evidence chain, short-
   term fixes, long-term fixes, overall + per-finding confidence, and open
   questions.
4. **Given** the case is closed, **When** the case is written to the library,
   **Then** `cases/index.md` gains a new entry with symptom signature, root
   cause(s), services touched, confidence, and reusable-pattern tags, and
   `cases/<case-id>/` contains the ticket, plan, evidence ledger, challenge log,
   and report.
5. **Given** the engineer has handed over the ticket, **When** the orchestrator
   finishes intake, **Then** the engineer can see a Direction Brief in the
   session *before* any specialist runs: the problem it thinks it is solving,
   the questions it asked itself with ANSWERED/PARKED status, ranked hypotheses,
   which subagents it will send (and why) and which it will skip (and why).
   It does not invoke every specialist by default.

---

### User Story 2 - Install kit into a target project (Priority: P1)

A developer wants to try the kit on their project. They run
`npx investigator-kit init --cursor` (or `--claude`) from the project root. If
they omit the host flag, the CLI presents a list prompt and asks them to pick a
host. The CLI is mechanical only: it places skills at the host-appropriate path,
transforms canonical subagent definitions to the selected host's dialect (correct
frontmatter keys and file locations), scaffolds an empty `.investigator/`
directory with placeholder templates, then prints a single next-step message
telling the user to open their agent and run the `investigator-init` skill.

**Why this priority**: Nothing else in the kit is usable until it can be
installed. Install must be a single, non-interactive-by-flag command so it fits
CI, docs, and casual trial. This story is BRIEF.md §9 phase 5.

**Independent Test**: In a fresh scratch project, run
`npx investigator-kit init --cursor`. Verify: (a) skills are placed under
`.cursor/skills/` in the canonical `SKILL.md` form, (b) subagents are placed
under `.cursor/agents/` with Cursor-dialect frontmatter, (c) an empty
`.investigator/` tree exists with `config.yml`, `registry.yml`, `profile.md`,
`memory/`, `playbook-memory/`, and `cases/` seeded from templates, and (d) the
CLI printed the "run investigator-init" next-step line. Repeat with `--claude`
and verify placement under `.claude/skills/` and `.claude/agents/` with Claude-
dialect frontmatter. Repeat with no flag and verify the list prompt appears and
selection places files correctly.

**Acceptance Scenarios**:

1. **Given** an empty project, **When** the user runs
   `npx investigator-kit init --cursor`, **Then** skills, agents, and
   `.investigator/` scaffolding are created in the Cursor-correct locations and
   the CLI exits successfully with the next-step message.
2. **Given** an empty project, **When** the user runs
   `npx investigator-kit init --claude`, **Then** artifacts are placed in
   Claude-Code-correct locations with Claude-dialect frontmatter.
3. **Given** an empty project, **When** the user runs `npx investigator-kit init`
   with no host flag, **Then** the CLI presents a list of supported hosts, waits
   for a selection, and installs accordingly (no silent auto-detection).
4. **Given** a project already has `.investigator/`, host skills, or host
   agents from a previous install, **When** the user re-runs init, **Then**
   the CLI presents up to three per-group overwrite prompts covering
   (a) skills, (b) subagents, and (c) `.investigator/` state; the
   `.investigator/` prompt defaults to KEEP so accumulated memories,
   playbook memories, and the case library are preserved unless the user
   explicitly opts in.
5. **Given** any install, **When** it completes, **Then** no credentials,
   secrets, or environment values are written into any placed file.

---

### User Story 3 - First-run adaptation via `investigator-init` interview (Priority: P2)

After install, the user opens their agent in the target project and runs the
`investigator-init` skill. It first scans the repo to infer as much as it can
(services, databases, log systems, webhook endpoints, correlation keys). It then
asks the **knowledge-source question** with the three options in BRIEF.md §5
(Docki / existing docs folder / codebase scan), pre-selecting Docki as
recommended when `knowledge/AI_CONTEXT.md` is present, and if the user picks
options 2 or 3 it ends with a one-line nudge that Docki gives the best results.
It presents the inferred stack summary for correction, asks the per-source
access mode (manual / mcp / cli) for each data source, offers unknown-tool
onboarding when the scan finds a log/data tool with no matching playbook, and
lets the user accept or edit the model-tier map. On completion it writes
`.investigator/profile.md`, `config.yml`, `registry.yml`, empty memory files,
and an empty case index.

**Why this priority**: Install alone is inert; the kit only becomes useful once
it knows the target project's services, data sources, and access modes. This
story is BRIEF.md §9 phase 4.

**Independent Test**: In a project after CLI install, run `investigator-init`.
Verify the interview asks exactly the questions in BRIEF.md §5 in order, that
scan results appear before the user is asked anything they could have inferred,
that a new `.investigator/profile.md` is populated from user answers and scan
data, and that `config.yml` records `knowledge_source`, per-source access modes,
and the `host_model_map`. Verify `registry.yml` and empty memory/case-index
files exist.

**Acceptance Scenarios**:

1. **Given** a freshly installed kit, **When** the skill starts, **Then** it
   scans first and presents an auto-detected stack summary before asking any
   question that scanning could answer.
2. **Given** the knowledge-source step, **When** `knowledge/AI_CONTEXT.md`
   exists, **Then** option 1 (Docki) is pre-selected as recommended.
3. **Given** the user picks option 1 (Docki) but Docki is not installed,
   **When** the skill responds, **Then** it recommends Docki, records the
   choice, and does NOT attempt to install Docki (out of scope per §10).
4. **Given** the user picks options 2 or 3, **When** the skill finishes,
   **Then** the final line nudges that Docki gives the best results and that
   re-running init after installing Docki will switch over.
5. **Given** a data source, **When** the user is prompted for its access mode,
   **Then** they can choose `manual` (default), `mcp` (recommended for
   automation), or `cli`, and the choice is recorded in `config.yml`.
6. **Given** the scan finds a reference to a log/data tool with no existing
   playbook — where "reference" is at least one of: (a) a dependency-manifest
   entry, (b) a tool-specific config file, (c) an environment-variable name
   or connection-string fragment identifying the tool, (d) an SDK / client-
   library import in source, OR (e) a mention of the tool in any `*.md`
   documentation file in the repo — **When** the skill offers unknown-tool
   onboarding and the user accepts, **Then** it interviews the user
   (URL/API, query language, auth, one known-good example query, correlation
   fields, read-only constraints), generates a new playbook skill +
   `registry.yml` entry + agent binding + empty memory file, and asks the
   user to run one smoke query and paste the result to verify.
7. **Given** the model-tier step, **When** the user accepts defaults or edits
   them, **Then** the choices are written to `host_model_map` in `config.yml`.

---

### User Story 4 - Onboard a new tool after init (Priority: P2)

Weeks later, the team adopts a new observability tool (say, Grafana). The user
runs the `investigator-add-agent` skill and answers the same onboarding
interview used inside `investigator-init` for the unknown-tool case. The skill
generates a new playbook, adds a registry entry, binds it to the appropriate
subagent(s), creates an empty tool-memory file, and asks the user to smoke-test
with one known-good query.

**Why this priority**: The kit is designed to grow with the team's stack. Without
this, users would have to re-run the whole init to add tools. This story is
BRIEF.md §9 phase 6.

**Independent Test**: In an already-initialized project, run
`investigator-add-agent` and onboard a new tool (e.g., Grafana). Verify a new
playbook skill file is created, `registry.yml` gains a new entry, one or more
subagent definitions gain a binding to the new playbook, `playbook-memory/`
gets an empty file for the tool, and the smoke-query verification runs.

**Acceptance Scenarios**:

1. **Given** the kit is initialized, **When** the user runs
   `investigator-add-agent` and provides tool details, **Then** the skill
   generates a new playbook, updates `registry.yml`, binds it to the correct
   subagent(s), creates an empty `playbook-memory/<tool>.md`, and prompts a
   smoke query.
2. **Given** the same skill, **When** the user cancels partway, **Then** no
   partial artifacts are left behind (or if any are, they are clearly marked
   incomplete and safe to remove).

---

### User Story 5 - Reuse prior RCAs from the case library (Priority: P2)

The engineer opens a new incident that resembles a previously solved one. The
orchestrator, as its very first SOP step, performs an LLM-driven semantic
lookup against every row in `cases/index.md`, comparing the new incident
against all documented fields on each prior case (symptom signature, concise
RCA / root-cause summary, root cause, services, reusable-pattern tags). It
finds a matching prior case, cites its id and the reasoning for the match in
the investigation plan, surfaces the recorded root cause and lessons, and
uses them to steer (not replace) the current investigation. If the current
evidence contradicts the prior case, the challenge protocol kicks in and the
divergence is logged.

**Why this priority**: Learning is a core design goal (§1). Case reuse compounds
value over time and reduces token/latency cost.

**Independent Test**: Seed `cases/index.md` and `cases/<prior-id>/` with a
prior RCA (including its concise RCA / root-cause summary in the index row).
Start a new incident whose semantic signature matches. Verify that the
orchestrator's plan explicitly references the prior case id as a starting
point, states the reasoning for the semantic match (which fields
corroborated), and cites the prior case in the ledger.

**Acceptance Scenarios**:

1. **Given** at least one closed case in the library, **When** a new
   investigation starts, **Then** the orchestrator's first recorded action is
   an LLM-driven semantic lookup against every row in `cases/index.md`,
   considering all documented fields (symptom signature, RCA summary, root
   cause, services, tags).
2. **Given** a semantic match against a prior case, **When** the orchestrator
   plans, **Then** the plan cites the matched prior case id AND states the
   reasoning for the match (which fields corroborated, which diverged), and
   reuses the prior lessons as leads only — never as conclusions.
3. **Given** current evidence contradicts the prior case, **When** the
   contradiction is detected, **Then** the challenge protocol is triggered and
   the divergence is written to the challenge log.

---

### User Story 6 - Portability across Cursor and Claude Code (Priority: P3)

A team decides to switch hosts mid-project (e.g., from Cursor to Claude Code).
They re-run the CLI install with the other host flag. Because state lives in
host-neutral `.investigator/` (committed to git), profiles, memories, playbook
memories, and the case library carry over unchanged. The CLI transforms the
canonical agent definitions into the new host's dialect.

**Why this priority**: Multi-host support is a design constraint (§2 and §10),
but users typically pick one host and stay. Portability matters most for teams
evaluating hosts or migrating.

**Independent Test**: Initialize a project on one host, run a case to
completion so `.investigator/` accumulates state, then run
`npx investigator-kit init --<other-host>`. Verify `.investigator/` is
untouched, the other host's skills/agents are placed in dialect-correct form,
and the orchestrator on the new host can read prior memories, profile, and
case index.

**Acceptance Scenarios**:

1. **Given** an initialized project with recorded state, **When** the user
   installs the other host, **Then** `.investigator/` contents are preserved
   byte-for-byte.
2. **Given** the second install, **When** it completes, **Then** the second
   host has correctly transformed agent files and correctly placed skills,
   and the orchestrator running under the second host reads prior state
   successfully.

---

### Edge Cases

- **Docki chosen but not installed**: The skill records the choice, tells the
  user Docki is recommended, and does not attempt to install Docki (out of
  scope per §10).
- **Knowledge sources 2 or 3 chosen**: init ends with a one-line nudge that
  Docki gives the best results and that re-running init after installing it
  will switch over.
- **Unknown tool discovered during scan**: a signal (dep-manifest entry,
  tool-specific config file, env-var name or connection-string fragment,
  SDK import, or a `*.md` docs mention of the tool) combined with the
  absence of a registered playbook triggers the onboarding prompt; the user
  can accept and go through the interview, or skip.
- **MCP server unavailable at query time**: the agent must not fail the whole
  case; it falls back to `manual` mode (emit query, wait for pasted result)
  with a clear notice, and this fallback is logged in the ledger.
- **Pasted tool output contains a secret**: the agent redacts the secret
  (per the FR-030 ruleset — credential regex set + entropy check on
  standalone tokens ≥ 32 chars + suspicious key-name check) before writing
  to ledger, memory, or report; redactions replace the secret with a stable
  `[REDACTED]` placeholder.
- **Anything credential-shaped ends up in `.investigator/`**: the report step
  fails the case (§4 rule 4).
- **Contradictory evidence between subagents**: the challenge protocol
  dispatches follow-up subagents and records the resolution in the challenge
  log; unresolved contradictions land in the "Open questions" section of the
  report with lowered confidence.
- **Single-source evidence for a finding**: per-finding confidence is capped
  at medium per the rubric; the report calls out what additional evidence
  would raise confidence.
- **INFERRED or UNKNOWN claim in the ledger**: never silently promoted to
  DECLARED/OBSERVED; the report preserves the classification.
- **Re-install on an already-installed project**: the CLI presents three
  per-group overwrite prompts (skills, subagents, `.investigator/`); the
  `.investigator/` prompt defaults to KEEP so memories, playbook memories,
  and the case library are preserved unless the user explicitly opts in.
  The skills and subagents prompts may default to OVERWRITE because
  canonical forms are always safe to refresh.
- **No host flag on install**: the CLI presents a list prompt; it does not
  silently auto-detect.
- **Host list contains only Cursor and Claude Code**: hosts beyond these two
  are out of scope for this build (§10) but the design must allow adding new
  hosts by adding a dialect transform, not by rewriting agents.
- **Concurrent runs of two subagents on the same case**: each writes to its
  own ledger section; the orchestrator merges without letting them see each
  other's conclusions before the challenge step (§3.1).
- **Incomplete ticket (no time window, environment, or impact)**: the
  orchestrator parks those as user-owned questions, shows the Direction Brief,
  and waits — it does not invent answers or dispatch yet.
- **User redirects after seeing the Direction Brief**: revise interrogation
  and brief, then dispatch the updated set; do not keep the original plan.
- **Temptation to send every specialist**: forbidden. An agent with no PARKED
  question and no confirm/kill test to run is listed under **Not sending yet**.

## Requirements *(mandatory)*

### Functional Requirements

#### A. Kit skeleton and templates (BRIEF §9 phase 1)

- **FR-001**: The kit MUST be organized as a canonical `core/` tree containing
  `skills/`, `agents/`, `playbooks/`, and `templates/`, plus an `installer/`
  tree for the CLI and a `docs/` tree, matching BRIEF.md §7.
- **FR-002**: All content MUST be plain Markdown + YAML in a host-agnostic
  canonical form.
- **FR-003**: The kit MUST include template files for `profile.md`,
  `config.yml`, `registry.yml`, case artifacts (ticket, plan, ledger, challenge
  log, report), and the case-library index.

#### B. Orchestrator skill `investigator` (BRIEF §3.1, §9 phase 2)

- **FR-004**: The orchestrator MUST run in the main agent session and its
  standard operating procedure MUST perform, in order: (0) LLM-driven
  semantic case-library lookup against `cases/index.md` (see FR-021a),
  (1) intake, self-interrogation (FR-058), visible Direction Brief (FR-059),
  and hypothesis formation, (2) independent subagent dispatch of only the
  specialists named in the brief, (3) challenge protocol, (4) evidence-ledger
  maintenance, (5) final report with confidence, (6) case closure with memory
  updates and index entry.
- **FR-005**: The orchestrator MUST dispatch subagents independently so that
  no subagent sees another subagent's conclusions before challenge time.
- **FR-006**: The orchestrator MUST maintain an evidence ledger where every
  claim is recorded with its supporting evidence and classified as one of
  DECLARED, OBSERVED, INFERRED, or UNKNOWN, and MUST never promote INFERRED
  or UNKNOWN to DECLARED/OBSERVED without new evidence.
- **FR-007**: The orchestrator MUST apply a written confidence rubric (e.g.,
  corroborated by 2+ independent sources = high; single-source = medium;
  inference = low), produce an overall RCA confidence score and per-finding
  confidence scores, and make the reasoning visible to the user.
- **FR-008**: The orchestrator MUST cross-examine each subagent's findings
  using evidence from the other subagents, dispatch follow-ups to resolve
  contradictions, and log all challenges to the case's challenge log.
  Before each follow-up dispatch it MUST run a short self-interrogation
  (FR-058) and show an updated Direction Brief (FR-059).
- **FR-058**: Before the first specialist dispatch, the orchestrator MUST
  interrogate **itself** (not the user) until every question is either
  ANSWERED from available context or PARKED as UNKNOWN with a named owner
  (a subagent, a playbook query, or the user). It MUST cover failure vs
  symptom, scope, hypotheses, evidence map, agent selection, and the cost
  of skipping an agent. Time-and-change and join/how-to questions are
  situational (FR-060): include them only when this case needs them. It
  MUST NOT invent facts to close questions. It MUST ask the user only for
  PARKED items the user alone can answer, and MUST NOT ask the user for
  correlation field names. A hard cap of 16 questions applies; leftovers
  stay PARKED with owners.
- **FR-059**: The orchestrator MUST show a Direction Brief to the user in
  the session and persist it in `cases/<case-id>/plan.md` before any
  specialist runs. The brief MUST include: problem framing (1–3 sentences);
  the self-interrogation log; ranked hypotheses each with confirm and kill
  tests; agents sending now (with the PARKED questions they own) and agents
  not sending yet (with reasons); still-unknown items; and which Reusable
  how-to memory rows were used, or that none were needed (FR-060). It MUST NOT
  dispatch all specialists by default. It MUST NOT wait for a generic
  approval when the dispatch gate is met. If framing is UNKNOWN or a PARKED
  question is user-owned, it MUST wait for those answers before dispatch.
- **FR-060**: Join maps, correlation field names, payload locations, and
  query shapes are **situational**. The orchestrator MUST NOT require them
  on every case, MUST NOT ask the user to supply them, and MUST NOT treat
  `profile.md` Correlation keys as a permission gate. When a case needs a
  join, the orchestrator MUST consult Reusable how-to memory first and
  reuse a matching row (`reused from <case-id>`) so specialists start
  there instead of rediscovering names. When no row exists, a specialist
  MUST discover the how-to from code, schema, payloads, or logs (read-only)
  and, on case close, append a Reusable how-to row. A case that needed no
  join MUST NOT write a correlation lesson.
- **FR-009**: On case close, the orchestrator MUST update
  `memory/orchestrator.md` and per-subagent memories with new lessons
  (including Reusable how-to rows when this case discovered a join, fetch
  path, or query shape — FR-060), and
  add an entry to `cases/index.md` with case id, symptom signature, a
  concise RCA / root-cause summary (≥ 1 sentence, ≤ ~3 sentences,
  sufficient for LLM semantic matching), root cause(s), services,
  confidence, and reusable-pattern tags (see FR-021).

#### C. Subagents and playbooks (BRIEF §3.2–§3.3, §9 phase 3)

- **FR-010**: The kit MUST provide five thin subagent definitions:
  `inv-log-rca`, `inv-data-rca`, `inv-code-rca`, `inv-vendor-compare`,
  `inv-report`, each defining only identity, scope, model tier, guardrails,
  memory protocol, and output contract.
- **FR-011**: All tool-specific procedure MUST live in playbook skills, not
  in subagent definitions.
- **FR-012**: The kit MUST ship four starter playbooks: `playbook-elastic`,
  `playbook-mssql`, `playbook-redis`, `playbook-k8s-logs`.
- **FR-013**: Each playbook MUST cover its query dialect, safe read-only
  patterns, auth/access-mode handling, known quirks and traps (including at
  minimum for `playbook-mssql`: `nvarchar(max)` cannot be an index key column
  — Msg 1919; `LOWER()` on a column defeats indexes), timing/diagnostic
  harnesses, and correlation-field guidance.
- **FR-014**: Multiple subagents MUST be able to load the same playbook.
- **FR-015**: Adding support for a new tool MUST be possible by adding a
  playbook + registry entry, with no agent rewrite required.
- **FR-016**: `inv-data-rca` MUST be read-only and MUST be usable across SQL,
  NoSQL, Redis, and Elastic-as-datastore via per-store playbooks.
- **FR-017**: `inv-code-rca` MUST consult the configured knowledge base first
  when one is available, but source code MUST remain authoritative.
- **FR-018**: `inv-report` MUST assemble the final report from the evidence
  ledger in the ELI5-first output contract (see FR-032, FR-033).

#### D. Memory and learning (BRIEF §3.4)

- **FR-019**: The kit MUST support four memory scopes: `memory/<agent>.md`
  per subagent, `playbook-memory/<tool>.md` per tool, `memory/orchestrator.md`
  cross-cutting, and the RCA case library.
- **FR-020**: When a subagent makes a mistake and corrects it, the corrected
  lesson MUST be written to the corresponding memory file.
- **FR-021**: The case library MUST consist of `cases/index.md` and
  `cases/<case-id>/` (full artifacts: ticket, plan, evidence ledger,
  challenge log, report). Each row in `cases/index.md` MUST include, in this
  order: (a) case id, (b) symptom signature, (c) a concise RCA /
  root-cause summary (≥ 1 sentence, ≤ ~3 sentences, written specifically
  to give LLM-driven semantic case matching enough substance to identify
  similar prior incidents), (d) root cause(s), (e) services touched,
  (f) overall confidence, and (g) reusable-pattern tags. Case ids MUST be
  formatted as `YYYYMMDD-<short-slug>` where `<short-slug>` is a lowercase
  kebab-case summary picked at case-open time (e.g.
  `20260813-webhook-payload-mismatch`); when no slug is supplied the
  orchestrator MUST fall back to `YYYYMMDD-HHMM-<random4>` (four random
  lowercase alphanumeric characters) to guarantee uniqueness and
  chronological sortability across machines.
- **FR-021a**: The orchestrator MUST implement its case-library lookup
  (FR-004 step 0) as an LLM-driven semantic comparison of the new incident
  (ticket text + intake analysis) against every row in `cases/index.md`,
  considering ALL documented fields per row (symptom signature, RCA
  summary, root cause, services, tags). When one or more plausible matches
  are found, the orchestrator MUST cite each matched prior case id in the
  investigation plan AND state its reasoning for the match (which fields
  corroborated it, which diverged). Case matching MUST NEVER promote the
  prior root cause to a conclusion in the new case — it steers investigation
  only; contradicting evidence gathered later MUST trigger the challenge
  protocol (FR-008) and the divergence MUST be recorded in the challenge
  log.
- **FR-022**: All memory and case-library files MUST live under
  `.investigator/` and MUST be committed to git.

#### E. Model configuration (BRIEF §3.5)

- **FR-023**: Model configuration MUST use portable tiers (`deep`, `mid`,
  `fast`) mapped per host in `.investigator/config.yml`.
- **FR-024**: Default tier assignments MUST be: orchestrator = deep,
  `inv-code-rca` = deep, `inv-vendor-compare` = deep, `inv-data-rca` = mid,
  `inv-log-rca` = fast, `inv-report` = mid.
- **FR-025**: `config.yml` MUST include a user-editable `host_model_map`
  generated at init, keyed by the selected host.

#### F. Data access and credentials (BRIEF §4)

- **FR-026**: For each data source, the user MUST be able to choose one of
  three access modes: `manual` (default), `mcp` (recommended for automation),
  `cli`.
- **FR-027**: Credentials MUST NEVER appear in agent files, skill files,
  memory files, evidence ledger, or report files.
- **FR-028**: Agents MUST reference sources by name (e.g., `elastic-prod`);
  credential resolution MUST happen in the MCP or environment layer, not in
  agent-visible files.
- **FR-029**: MCP or database accounts used by the kit MUST be read-only and
  scoped.
- **FR-030**: If any tool response or pasted result contains a secret, the
  kit MUST redact the secret before writing it to the ledger, memory, or
  report. A value counts as a secret when ANY of the following match:
  (a) a curated credential regex set covering common credential shapes —
  API keys, JWTs, bearer tokens, `password=<value>` fragments in
  connection strings, AWS/GCP access keys, PEM / private-key blocks;
  (b) a Shannon-entropy check flags a standalone token of length
  ≥ 32 characters as high-entropy; OR (c) a suspicious-key-name check
  matches a key whose name is `password`, `secret`, `token`, `key`, or
  `credential` (case-insensitive, substring match) associated with a value.
  The redacted value MUST be replaced with a stable placeholder (e.g.
  `[REDACTED]`) so downstream text remains valid Markdown/YAML.
- **FR-031**: The report step MUST fail the case if any content that meets
  the FR-030 secret-detection ruleset is found inside any file under
  `.investigator/`.

#### G. Report output contract (BRIEF §6)

- **FR-032**: Every RCA report MUST contain, in this exact order:
  (1) ELI5 summary in plain language, understandable by a non-engineer;
  (2) Technical root cause with evidence chain, each claim tagged with its
  classification and linked to ledger entries;
  (3) Short-term fix recommendations (mitigations);
  (4) Long-term fix recommendations (structural);
  (5) Overall confidence score, per-finding scores, and the rubric reasoning;
  (6) Open questions and what would raise confidence.
- **FR-033**: The report MUST NEVER include content that the ledger classifies
  as INFERRED or UNKNOWN without preserving that classification in the report.
- **FR-034**: The report MUST never propose or apply a fix to any target
  codebase; it only recommends (§1, §10).

#### H. `investigator-init` skill (BRIEF §5, §9 phase 4)

- **FR-035**: `investigator-init` MUST scan the target project first and
  present an auto-detected stack summary before asking any question the scan
  could answer.
- **FR-036**: `investigator-init` MUST ask the knowledge-source question with
  exactly the three options in BRIEF.md §5 (Docki / existing docs folder /
  codebase scan), MUST pre-select Docki as recommended when
  `knowledge/AI_CONTEXT.md` is present, MUST NOT install Docki itself, and
  MUST end init with a one-line Docki nudge when the user picks options 2 or 3.
- **FR-037**: `investigator-init` MUST ask, per data source, for the access
  mode (`manual` / `mcp` / `cli`) and record the choice in `config.yml`.
- **FR-038**: `investigator-init` MUST offer unknown-tool onboarding when the
  scan finds a reference to a log/data tool with no matching playbook. A
  "reference" counts when at least ONE of the following signals is present
  AND no registered playbook already covers that tool: (a) an entry in a
  dependency manifest (`package.json`, `requirements.txt`, `pom.xml`,
  `go.mod`, `Cargo.toml`, etc.), (b) a tool-specific config file (e.g.
  `elasticsearch.yml`, `redis.conf`, `grafana.ini`), (c) an environment-
  variable name or connection-string fragment that identifies the tool
  (e.g. `MSSQL_CONNECTION_STRING`, `ELASTIC_URL`), (d) an SDK or client-
  library import in source code, OR (e) a mention of the tool in any
  `*.md` documentation file in the repo (docs typically name the datastores,
  log systems, and observability tools the project relies on). On acceptance
  the skill MUST interview for URL/API, query language, auth method, one
  known-good example query, correlation fields, and read-only constraints,
  then generate a playbook + registry entry + agent binding + empty memory
  file, and ask the user to run one smoke query and paste the result to
  verify.
- **FR-039**: `investigator-init` MUST let the user accept or edit the model-
  tier map (`host_model_map` in `config.yml`).
- **FR-040**: On completion, `investigator-init` MUST write
  `.investigator/profile.md` (services↔DBs, log systems, correlation keys,
  known traps), `config.yml`, `registry.yml`, empty memory files, and an
  empty case index.
- **FR-041**: `investigator-init` MUST be re-runnable without losing prior
  state; re-running MUST let the user update choices and MUST NOT clobber
  memory, playbook memory, or the case library. It MUST merge/update
  `config.yml` fields written at install time (see FR-051a) but MUST NOT
  infer the host from filesystem paths (e.g. by detecting `.cursor/` vs
  `.claude/` presence).
- **FR-042**: Subagents MUST consult the selected `knowledge_source` first
  during investigations, but source code MUST remain authoritative.

#### I. Node CLI installer (BRIEF §2, §8, §9 phase 5)

- **FR-043**: The installer MUST be a Node.js CLI distributed via npm and
  runnable with `npx` (invocation shape: `npx investigator-kit init …`).
- **FR-044**: The installer MUST accept `--cursor` and `--claude` flags to
  select the host.
- **FR-045**: If neither host flag is provided, the installer MUST prompt the
  user with a list of supported hosts and MUST NOT silently auto-detect.
- **FR-046**: The installer's responsibilities MUST be strictly mechanical:
  place skills at the host-appropriate path, transform canonical agent
  definitions to the selected host's dialect and place them at the host-
  appropriate path (`.cursor/agents/*.md` vs `.claude/agents/*.md`, with
  differing frontmatter keys such as `tools`/`model`), scaffold
  `.investigator/` from templates, and print the next-step message.
- **FR-047**: The installer MUST NOT ask any question other than the host
  choice (if the flag is absent) and an overwrite confirmation on re-install.
- **FR-048**: On completion the installer MUST print: `Installed. Open your
  agent and run the 'investigator-init' skill to adapt it to this project.`
- **FR-049**: On re-install where existing skills, agents, or `.investigator/`
  files are present, the installer MUST ask for overwrite confirmation as
  three per-group prompts — (a) skills, (b) subagents, (c) `.investigator/`
  state — before replacing any file in that group. The `.investigator/`
  prompt MUST default to KEEP so accumulated memories, playbook memories,
  and the case library are preserved unless the user explicitly opts in.
  The skills and subagents prompts MAY default to OVERWRITE because
  canonical forms are always safe to refresh from the packaged kit.
- **FR-050**: Skills MUST be placed in the cross-tool `SKILL.md` form and
  MUST work in both hosts by placement alone (no per-host skill rewriting).
- **FR-051**: The agent-dialect transform MUST cover at minimum the
  frontmatter differences between Cursor and Claude Code (including `tools`
  and `model` keys) and MUST place agents at the correct per-host directory.
- **FR-051a**: When scaffolding `.investigator/config.yml`, the installer
  MUST persist the selected host (`cursor` or `claude` — from the
  `--cursor`/`--claude` flag or the interactive host prompt) into
  `host_model_map.host` and the top-level `host` field. `investigator-init`
  MAY merge or update other config fields on re-run but MUST NOT infer or
  overwrite `host` / `host_model_map.host` from filesystem inspection
  (FR-045).
- **FR-051b**: When scaffolding `.investigator/registry.yml` (and any kit
  templates containing host-specific skill paths), the installer MUST rewrite
  playbook `skill_path` values to the selected host's skills root —
  `.cursor/skills/<playbook-name>/SKILL.md` or
  `.claude/skills/<playbook-name>/SKILL.md` — mirroring the agent dialect
  transform at install time (see `contracts/cli-installer.md`,
  `contracts/agent-dialect-transform.md`). On re-install with group (c)
  KEEP, existing `registry.yml` paths are preserved unless the user opts
  in to `.investigator/` overwrite; switching hosts requires a fresh install
  or explicit init update so paths match the active host (US6, SC-006).

#### J. `investigator-add-agent` skill (BRIEF §5 end, §9 phase 6)

- **FR-052**: The kit MUST provide an `investigator-add-agent` skill that
  reuses the same onboarding interview used inside `investigator-init` for
  the unknown-tool case, so tools adopted after init can be onboarded without
  re-running the whole init flow.
- **FR-053**: `investigator-add-agent` MUST produce the same artifacts as the
  unknown-tool onboarding branch of `investigator-init`: playbook skill +
  registry entry + agent binding + empty tool-memory file + a smoke-query
  verification step.

#### K. Portability & state (BRIEF §2, §7)

- **FR-054**: All project state MUST live in `.investigator/` in host-neutral
  plain files and MUST be committed to git so switching hosts loses nothing.
- **FR-055**: The kit MUST support installation for Cursor and Claude Code
  hosts; hosts beyond these two MUST be treated as future extensibility, not
  implemented in this build (§10).

#### L. End-to-end validation (BRIEF §9 phase 7)

- **FR-056**: The kit MUST include a documented golden-test procedure that
  installs the kit into a scratch project for each supported host and runs
  the golden scenario end-to-end. The scenario MUST include synthesized
  fixtures for: a provider sending field `requestID` while the DTO expects
  `requestIdHash`, plus an unindexed `nvarchar(max)` lookup causing SQL
  timeout 258 under a 35-second distributed lock.
- **FR-057**: The kit MUST reach both root causes end-to-end on the golden
  scenario, with per-finding confidence at least "medium" and rubric
  reasoning visible in the report, for each supported host.

### Key Entities *(include if feature involves data)*

- **Kit repository**: The canonical source of skills, agent definitions,
  playbooks, templates, and the installer. Ships as one npm package.
- **Target project**: Any user project into which the kit is installed. Owns
  a `.investigator/` directory once installed.
- **Host**: The agent runtime hosting the skills and agents. In this build:
  Cursor or Claude Code. Determines file placement and agent frontmatter
  dialect.
- **Orchestrator (`investigator`)**: Skill that runs in the main agent
  session and executes the seven-step SOP. Owns the evidence ledger, the
  challenge log, and the visible Direction Brief for each case.
- **Direction Brief**: User-visible investigation direction produced during
  intake (and again before follow-up dispatches): problem framing, self-
  interrogation log, hypotheses, specialists sending / not sending,
  still-unknown items, and which Reusable how-to rows were reused. Persisted in `plan.md`.
- **Reusable how-to**: A memory-table row (when needed, what, where/how,
  learned-in case id) for join maps, payload locations, and query shapes.
  Written only when a case had to discover them; reused on later cases that
  need the same thing. Not a mandatory preflight.
- **Subagent**: One of five thin roles (`inv-log-rca`, `inv-data-rca`,
  `inv-code-rca`, `inv-vendor-compare`, `inv-report`) with a defined scope,
  model tier, guardrails, memory protocol, and output contract.
- **Playbook**: A shared, tool-specific skill (`playbook-elastic`,
  `playbook-mssql`, `playbook-redis`, `playbook-k8s-logs`, plus any onboarded
  later) providing query dialect, safe read-only patterns, traps, and
  correlation-field guidance.
- **Registry (`.investigator/registry.yml`)**: The mapping from tools/data
  sources in the project to the playbooks and subagents that handle them.
- **Config (`.investigator/config.yml`)**: Model-tier map, `host_model_map`,
  chosen host, per-source access modes, `knowledge_source`.
- **Profile (`.investigator/profile.md`)**: Services, databases, log systems,
  webhook endpoints, correlation keys, and known traps for the target project.
- **Memories**: `memory/<agent>.md` per subagent (investigative lessons),
  `playbook-memory/<tool>.md` per tool (tool-truth lessons that travel with
  playbooks), and `memory/orchestrator.md` (cross-cutting orchestration
  lessons).
- **Evidence ledger**: Per-case file recording every claim with its evidence
  and classification (DECLARED / OBSERVED / INFERRED / UNKNOWN).
- **Challenge log**: Per-case record of contradictions found during cross-
  examination and how they were resolved.
- **Case**: `cases/<case-id>/` (ticket, plan, evidence ledger, challenge log,
  report) plus a row in `cases/index.md`. Row schema (see FR-021): case id,
  symptom signature, concise RCA / root-cause summary, root cause(s),
  services touched, overall confidence, reusable-pattern tags. The RCA
  summary field exists specifically to give LLM-driven semantic case
  matching (FR-021a) enough substance to identify similar prior incidents.
  Case ids follow the `YYYYMMDD-<short-slug>` format (fallback
  `YYYYMMDD-HHMM-<random4>`) so they sort chronologically and remain
  human-readable in citations.
- **Knowledge source**: One of Docki knowledge base, existing docs folder, or
  live codebase scan, selected at init and recorded in `config.yml`.
- **Data source access mode**: One of `manual`, `mcp`, `cli`, selected per
  data source at init and recorded in `config.yml`. Credentials never appear
  in agent-visible files.
- **Report**: The final RCA artifact for a case, following the six-part
  ELI5-first output contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can install the kit into an empty target project and
  reach the "run `investigator-init`" state in under 5 minutes with a single
  `npx investigator-kit init --<host>` command.
- **SC-002**: The end-to-end golden scenario (webhook `requestID` vs
  `requestIdHash` + unindexed `nvarchar(max)` lookup causing SQL timeout 258
  under a 35-second distributed lock) reaches both root causes with per-
  finding confidence at least "medium" on both supported hosts.
- **SC-003**: 100% of RCA reports produced by the kit follow the six-part
  ELI5-first output contract, in the specified order, including per-finding
  confidence and rubric reasoning.
- **SC-004**: 0 credentials, secrets, or environment values — as defined by
  the FR-030 secret-detection ruleset (curated credential regex set +
  entropy check on standalone tokens ≥ 32 characters + suspicious-key-name
  check matching `password|secret|token|key|credential`) — are ever
  written into any file under `.investigator/`, into any skill file, or into
  any agent file across the golden validation and any manual test session.
- **SC-005**: Adding support for a new tool (playbook + registry entry +
  binding + memory + smoke query) via `investigator-add-agent` can be
  completed by a user in under 10 minutes for a tool with a simple query
  interface, and requires 0 edits to existing subagent definitions.
- **SC-006**: A project's `.investigator/` state (profile, memories, playbook
  memories, case library) is preserved byte-for-byte when the user re-runs
  the CLI installer to switch from one supported host to the other.
- **SC-007**: On a repeat incident that semantically matches a prior closed
  case, the orchestrator's first recorded action is an LLM-driven semantic
  lookup across every row and every documented field in `cases/index.md`,
  and its plan explicitly cites the matched prior case id together with the
  reasoning for the match (which fields corroborated, which diverged).
- **SC-008**: Every claim in every RCA report is traceable to at least one
  ledger entry with its DECLARED / OBSERVED / INFERRED / UNKNOWN
  classification preserved; no INFERRED or UNKNOWN claim is presented as
  DECLARED/OBSERVED in the report.
- **SC-009**: The `investigator-init` skill, on the golden scratch project,
  asks no question that its pre-scan could have answered (measured by
  reviewing the interview transcript against the auto-detected stack summary).
- **SC-010**: The installer completes its work with zero questions asked
  beyond host selection (only when no `--cursor`/`--claude` flag was passed)
  and an overwrite confirmation on re-install.
- **SC-011**: Before the first specialist dispatch on any case, the
  orchestrator's session output and `cases/<case-id>/plan.md` both contain a
  Direction Brief that lists self-interrogation Q→A (ANSWERED or PARKED),
  at least two hypotheses, at least one specialist under **Sending now**,
  and every remaining core specialist except `inv-report` under **Not
  sending yet** or **Sending now** — so the engineer can see the direction
  without every specialist being invoked.
- **SC-012**: On a second case that needs the same join a prior case already
  discovered, the Direction Brief cites `reused from <prior-case-id>` for
  that how-to and does not re-derive the field names from a blank search.
  A case that needs no join does not invent a correlation question.

## Assumptions

- The two supported hosts for this build are Cursor and Claude Code; any
  other host is future extensibility, not implemented (§10).
- Docki implementation and installation are out of scope; the kit only
  recommends Docki and records the user's choice (§10).
- The kit never writes fixes to any target codebase; it only investigates
  and recommends (§1, §10).
- All examples and fixtures in this repo use placeholders; no live
  production credentials are ever included (§10).
- The user's agent host provides the LLM; the CLI installer has no LLM and
  performs only mechanical file operations (§8).
- Users are expected to commit `.investigator/` to their git repo so state
  is portable across machines and hosts (§2, §7).
- MCP servers, when used, are provided and configured by the user; the kit
  references sources by name and does not bundle MCP server implementations
  (§4).
- The golden-scenario fixtures for validation may be synthesized rather than
  taken from real production incidents (§9 phase 7).
- Node.js and `npx` are available on the developer machine running the
  installer (implied by §2).
- The kit's canonical form uses the cross-tool `SKILL.md` standard for
  skills, which works in both Cursor and Claude Code by file placement
  alone; only subagent files require per-host dialect transformation (§2).
- Existing spec-kit infrastructure (`.specify/`, this spec) governs how the
  kit itself is built inside this repository, but is NOT part of what gets
  shipped to target projects.
