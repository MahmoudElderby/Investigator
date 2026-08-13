# Investigator — Full Design Brief (v2, finalized)

This document is the complete, finalized design for the **Investigator kit**. It was agreed
upon interactively with the product owner and is the single source of truth for the
spec-driven build in this repository. Treat every decision below as settled unless the
owner is explicitly asked and overrides it.

## 1. Mission

Build a **portable, installable AI investigation system** ("Investigator") that performs
production-incident root-cause analysis the way a senior engineer would:

- Orchestrator agent coordinates independent specialist subagents.
- Produces a clear RCA report: **ELI5 / plain-language explanation first**, then evidence,
  short-term fix recommendations, long-term fix recommendations, and confidence scores.
- **Never fixes anything itself.** It investigates, proves/disproves hypotheses with
  evidence, and recommends. Writing fixes to the target codebase is out of scope.
- Learns: subagents, playbooks, and the orchestrator all accumulate memory; completed RCAs
  become a searchable case library reused for future tickets.
- Adapts itself to any target project during an initialization interview (it is NOT
  hard-coded for a specific stack).

## 2. Portability & distribution (decided)

- Must work with **multiple agent hosts**: Cursor and Claude Code at minimum.
- All content is **plain Markdown + YAML** in a host-agnostic canonical form under this
  repository. Skills use the cross-tool `SKILL.md` standard (works in both hosts with
  placement only). Subagent definitions are stored canonically and **transformed to the
  host dialect** at install time (`.cursor/agents/*.md` vs `.claude/agents/*.md`,
  differing frontmatter keys such as `tools`/`model`).
- **CLI installer: Node.js, distributed via npm, run with `npx`** (e.g.
  `npx investigator-kit init`).
- **Host selection is parameter-based, NOT auto-detected**:
  - `--cursor` or `--claude` flags select the host.
  - If no flag is given, the CLI prompts the user to **choose from a list** of supported
    hosts. Do not silently auto-detect.
- Installer responsibilities are strictly mechanical (see §8 for the install-time vs
  first-run question split): place skills, transform+place agents, scaffold
  `.investigator/`, then print: "Installed. Open your agent and run the
  `investigator-init` skill to adapt it to this project."
- Project state lives in `.investigator/` — host-neutral plain files, committed to git,
  so switching hosts mid-project loses nothing.

## 3. Architecture

### 3.1 Orchestrator (skill: `investigator`)

The orchestrator runs in the main agent session. Its standard operating procedure:

0. **Case-library lookup first**: search `cases/index.md` by symptom signature and
   reusable-pattern tags before planning anything new.
1. Intake the ticket/incident, form hypotheses, plan which subagents to dispatch.
2. Dispatch **independent** subagents (each works alone from its own evidence; they do not
   see each other's conclusions, so they are not biased/distracted).
3. **Challenge protocol**: the orchestrator cross-examines each subagent's findings using
   analytical reasoning and evidence from the *other* subagents; contradictions are
   resolved with follow-up dispatches, and challenges are logged.
4. Maintain an **evidence ledger** for the case: every claim recorded with its supporting
   evidence and classification (DECLARED / OBSERVED / INFERRED / UNKNOWN). Never silently
   promote INFERRED or UNKNOWN to fact.
5. Produce the final report (via `inv-report`) with a **confidence score** for the overall
   RCA and per-finding confidence, using a written rubric (e.g. corroborated by 2+
   independent evidence sources = high; single-source = medium; inference = low). The user
   must be able to review *why* the confidence is what it is.
6. Close the case: write lessons to memories, add the case to the RCA library index.

### 3.2 Subagents (five, thin definitions)

| Agent | Role | Default model tier |
|---|---|---|
| `inv-log-rca` | Query/analyze log systems (Elastic, files, etc.), find error patterns, timelines, correlations | fast |
| `inv-data-rca` | Prove/disprove claims using stored data, **read-only**, across ANY datastore kind — SQL, NoSQL, Redis, Elastic-as-datastore — via per-store playbooks | mid |
| `inv-code-rca` | Trace code paths, find the defect/behavior in source; consults knowledge base first when available | deep |
| `inv-vendor-compare` | Compare our payloads/contracts vs third-party/provider behavior (webhooks, callbacks, API contracts) | deep |
| `inv-report` | Assemble the final RCA report from the evidence ledger (ELI5-first format) | mid |

Subagent definitions are **thin**: identity, scope, model tier, guardrails, memory
protocol, output contract. All tool-specific procedure lives in playbook skills (§3.3).
This hybrid split is a hard requirement (composability, learning locality, cheap new-tool
onboarding, smaller prompts → less distraction → higher independence).

### 3.3 Playbook skills (shared, tool-specific)

Starter set: `playbook-elastic`, `playbook-mssql`, `playbook-redis`, `playbook-k8s-logs`.

Each playbook contains: query dialect and safe read-only patterns, auth/access mode
handling, known quirks and traps (e.g. MSSQL: `nvarchar(max)` cannot be an index key
column — Msg 1919; `LOWER()` on a column defeats indexes), timing/diagnostic harnesses,
and correlation-field guidance. Multiple agents may load the same playbook. Adding support
for a new tool = adding a playbook + registry entry, with **no agent rewrite**.

### 3.4 Memory & learning (all committed to git)

- `memory/<agent>.md` — per-subagent investigative lessons (e.g. "check the
  FromBackgroundJob flag before blaming the polling job"). When a subagent makes a mistake
  and corrects it (e.g. wrong query fixed), the corrected lesson is written here.
- `playbook-memory/<tool>.md` — tool-truth lessons that travel with playbooks.
- `memory/orchestrator.md` — cross-cutting orchestration lessons.
- **RCA case library**: `cases/index.md` is a table (case id, symptom signature, root
  cause, services, confidence, reusable-pattern tags) and `cases/<case-id>/` holds the
  full artifacts (ticket, plan, evidence ledger, challenge log, report). The orchestrator
  searches the index at intake (§3.1 step 0).

### 3.5 Model configuration (portable tiers)

Hosts name models differently, so config uses tiers mapped per host:

```yaml
# .investigator/config.yml
model_tiers:
  orchestrator: deep
  inv-code-rca: deep
  inv-vendor-compare: deep
  inv-data-rca: mid
  inv-log-rca: fast
  inv-report: mid
host_model_map:      # generated at init, user-editable
  host: cursor
  deep: inherit
  mid: <host-specific-model-id>
  fast: <host-specific-model-id>
```

## 4. Data access & credentials (per source, chosen at init)

Three access tiers, selectable **per data source**; ask the user which they prefer:

| Tier | How | Credentials | When |
|---|---|---|---|
| `manual` (default) | Agent emits the exact query; user runs it in their tool (ElasticVue, SSMS, …) and pastes results back | None touch the agent | Day 1, prod-sensitive |
| `mcp` (recommended for automation) | Agent calls a read-only MCP server for the source | Live ONLY in MCP server config (env refs / OS keychain), never in agent files | When ready to automate |
| `cli` | Playbook invokes a wrapper script reading env vars | Env vars / gitignored `.env` | Tools without an MCP server |

**Security rules (enforced in every agent and playbook):**

1. Credentials never appear in agent files, skills, memory, ledger, or reports. Agents
   reference sources by name (e.g. `elastic-prod`); resolution happens in the MCP/env layer.
2. MCP/DB accounts must be read-only and scoped.
3. If any tool response or pasted result contains a secret, redact before writing to the
   ledger.
4. `.investigator/` is committed; anything credential-shaped inside it fails the case
   (checked by the report step).

## 5. Initialization skill (`investigator-init`) — the interview

Runs inside the agent after CLI install. Scans first, asks only what it cannot infer.

**Question 1 — knowledge source (three options, exact behavior):**

> How should Investigator learn your system?
>
> 1. **Docki knowledge base (best)** — pre-classified architecture knowledge, always
>    current, cheapest per investigation. If not installed, inform the user that Docki is
>    the recommended/ultimate option and ask whether they want to install it —
>    **actually installing Docki is OUT OF SCOPE**; just recommend and record the choice.
> 2. **Existing docs folder** — user points at a folder of md/docs; profile is built from
>    it. Include a **highlighted note**: *working from md files significantly reduces
>    token usage on your model plan* (agents read curated summaries instead of re-scanning
>    the codebase per question).
> 3. **Codebase scan** — no docs needed; explore code directly. Most token-expensive and
>    slowest; zero prerequisites.

If `knowledge/AI_CONTEXT.md` exists, pre-select option 1 as recommended. If the user picks
2 or 3, end init with a one-line nudge that Docki gives the best results and re-running
init after installing it will switch over. Record `knowledge_source` in `config.yml`;
subagents consult the chosen source first, but **source code stays authoritative**.

**Remaining init steps:**

2. Present the auto-detected stack summary (services, databases, log systems, webhook
   endpoints, correlation keys); the user only corrects it.
3. Per data source: choose access mode (`manual` / `mcp` / `cli`).
4. **Unknown-tool onboarding**: if the scan finds references to a log/data tool with no
   existing playbook (e.g. Grafana), prompt: "Found X — no playbook exists. Onboard it?"
   Then interview the user: URL/API, query language, auth method, one known-good example
   query, correlation fields, read-only constraints. Generate from the answers: a playbook
   skill + registry entry + agent binding + empty memory file. Ask the user to run one
   smoke query and paste the result to verify the playbook.
5. Model tier mapping: accept defaults or edit (writes `host_model_map`).

Outputs: `.investigator/profile.md` (services↔DBs, log systems, correlation keys, known
traps), `config.yml`, `registry.yml`, empty memories, empty case index.

A separate **`investigator-add-agent`** skill reuses the same onboarding interview for
tools adopted after init.

## 6. Report output contract

Every RCA report must contain, in order:

1. **ELI5 summary** — plain-language explanation of what happened, understandable by a
   non-engineer, before any technical detail.
2. Technical root cause with the evidence chain (each claim tagged
   DECLARED/OBSERVED/INFERRED/UNKNOWN and linked to ledger entries).
3. Short-term fix recommendations (mitigations).
4. Long-term fix recommendations (structural).
5. Confidence: overall score + per-finding scores + the rubric reasoning.
6. Open questions / what would raise confidence.

## 7. Repository layout (this repo = the kit)

```
investigator-kit (this repo)
  core/
    skills/            # canonical SKILL.md: investigator, investigator-init, investigator-add-agent
    agents/            # canonical thin agent defs (generic frontmatter)
    playbooks/         # playbook-elastic, playbook-mssql, playbook-redis, playbook-k8s-logs
    templates/         # profile, config, registry, case artifacts, report, ledger, index
  installer/           # Node CLI (npx), host transform logic
  docs/
```

Installed into a target project:

```
.investigator/                        # host-neutral state, committed
  config.yml  registry.yml  profile.md
  memory/  playbook-memory/  cases/
.cursor/skills/… or .claude/skills/…  # placed by CLI
.cursor/agents/… or .claude/agents/…  # transformed + placed by CLI
```

## 8. Install-time vs first-run questions (decided split)

**CLI install asks ONLY:**
- Host — via `--cursor` / `--claude` flag; if absent, prompt a selection list.
- Overwrite confirmation on re-install.
- Nothing else.

**First run of `investigator-init` asks:** knowledge source (3 options), stack-summary
confirmation, per-source access mode, unknown-tool onboarding, model tiers. Rationale: the
CLI has no LLM; the init skill runs with full repo context, infers first, asks last, and
is re-runnable.

## 9. Build phases

1. Kit skeleton: canonical core + templates + schemas.
2. Orchestrator skill: SOP, evidence ledger, challenge protocol, confidence rubric,
   RCA-library lookup.
3. Five thin subagents + four starter playbooks.
4. `investigator-init`: scan + interview (incl. knowledge-source step §5) + generation +
   unknown-tool onboarding.
5. Node CLI installer: `npx … init`, `--cursor`/`--claude` flags, list prompt fallback,
   agent-dialect transform.
6. `investigator-add-agent` skill.
7. Validation: install into a scratch project for each host and run a golden test case
   end-to-end (a webhook payload-mismatch + SQL timeout scenario; fixtures may be
   synthesized to simulate: provider sends field `requestID` while the DTO expects
   `requestIdHash`, plus an unindexed `nvarchar(max)` lookup causing timeout 258 under a
   35-second distributed lock). The system must reach those root causes with sensible
   confidence scores.

## 10. Out of scope / non-goals

- Implementing or installing Docki (recommend only).
- Writing fixes to any target codebase — Investigator only investigates and recommends.
- Hosts beyond Cursor and Claude Code (design for extensibility, implement these two).
- Live production credentials in this repo — all examples use placeholders.

## Amendments

**2026-08-13 — Gate A clarification session** (user decisions recorded in
`specs/001-investigator-kit/autopilot-assumptions.md`; spec touchpoints FR-021,
FR-021a, FR-004 step 0, US5, SC-007):

The following **supersedes** the original wording in §3.1 step 0 and §3.4
(case-library index columns) without rewriting those sections in place:

1. **Case-library lookup** — Step 0 is now **LLM-driven semantic matching**
   over **all** documented fields on **every** row in `cases/index.md` (not
   limited to symptom signature and reusable-pattern tags alone). The
   orchestrator cites matched prior case id(s) and states match reasoning in
   the investigation plan; prior root causes steer investigation only and are
   never promoted to conclusions.

2. **Case index schema** — Each row in `cases/index.md` MUST include an
   additional **concise RCA / root-cause summary** column (≥ 1 sentence,
   ≤ ~3 sentences) between symptom signature and root cause(s), written
   specifically to give semantic matching enough substance to identify similar
   prior incidents.
