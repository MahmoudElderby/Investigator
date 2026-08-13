# Clarify Phase — Questions (RESOLVED)

**Feature**: `001-investigator-kit`
**Phase**: `speckit-clarify` (autopilot review mode)
**Generated**: 2026-08-13
**Resolved**: 2026-08-13 (all 5 answered at Gate A)
**Model used to generate questions**: `claude-opus-4-7-thinking-xhigh`
**Answers recorded in**: `spec.md` §Clarifications → Session 2026-08-13
**Decision-log audit trail**: `autopilot-assumptions.md` (this session)

All five questions listed below are **ANSWERED**. The pipeline is unblocked
for `/speckit-plan`. This file is kept for the audit trail.

---

## Question 1 — Installer overwrite confirmation granularity  ✅ ANSWERED

**Question:** On re-install, at what granularity should the CLI ask the user
for overwrite confirmation before replacing existing skills, agents, or
`.investigator/` files (FR-049)?

**Why it matters / impact:** FR-049 says the installer must "ask for overwrite
confirmation before replacing them" but did not specify granularity. A single
global Y/N could destroy a user's learned state under `.investigator/`
(memories, closed cases, custom profile) with one mis-click, violating SC-006
(state preserved byte-for-byte across host switches). Per-file prompting
fatigues users and slows re-install to a crawl.

**Options:**

| Option | Description |
|---|---|
| A | One global Y/N prompt covering all placed files |
| B | Per-group prompts: skills / agents / `.investigator/`, with `.investigator/` defaulted to KEEP |
| C | Per-file prompt |
| D | Always overwrite skills/agents; never touch `.investigator/`; add `--force` flag |
| Short | A different short answer (<=5 words) |

**Recommended default:** Option B.

**✅ Accepted answer: Option B.** Per-group prompts (skills / subagents /
`.investigator/`), with the `.investigator/` prompt defaulted to KEEP so
accumulated learning is preserved unless the user explicitly opts in.

**Integrated into:** FR-049; US2 acceptance scenario 4; Edge Case "Re-install
on an already-installed project".

---

## Question 2 — Case-library match algorithm  ✅ ANSWERED (with user-added enrichment)

**Question:** How should the orchestrator determine that a prior case in
`cases/index.md` "matches" a new incident during the case-library lookup step
(FR-004 step 0, US5)?

**Why it matters / impact:** US5 and FR-004 mandate a case-library lookup as
the orchestrator's very first action; without defined matching semantics,
US5 acceptance scenarios are ambiguous, and SC-007 ("plan explicitly cites
the prior case id") is not testable.

**Options:**

| Option | Description |
|---|---|
| A | Exact string match on symptom signature only |
| B | Tag-first exact-match + symptom keyword-overlap ranking |
| C | LLM-driven semantic similarity over signature + tags |
| D | Any shared tag OR any shared keyword |
| Short | A different short answer (<=5 words) |

**Recommended default:** Option B.

**✅ Accepted answer: Option C, extended.** LLM-driven semantic matching over
EVERYTHING documented per row in `cases/index.md` (not just signature +
tags). The user additionally required enriching the `cases/index.md` row
schema with a concise RCA / root-cause summary per case (≥ 1 sentence,
≤ ~3 sentences) so the semantic match has enough substance to identify
matches. Testability is preserved by requiring the orchestrator to cite the
matched prior case id AND state the reasoning for the match (which fields
corroborated, which diverged) in the investigation plan.

**Integrated into:** US5 story, US5 acceptance scenarios 1 and 2, US5
Independent Test; FR-004 step 0; FR-009 (writes RCA summary on case close);
FR-021 (enriched index-row schema); **new FR-021a** (defines the matching
contract, citation + reasoning requirement, and the "never promote prior
root cause to conclusion" guardrail); Key Entities → Case; SC-007.

---

## Question 3 — Unknown-tool detection signals during init scan  ✅ ANSWERED (with docs signal added)

**Question:** During `investigator-init`, what counts as a "reference to a
log/data tool with no matching playbook" that should trigger the
unknown-tool onboarding prompt (FR-038)?

**Why it matters / impact:** FR-038 makes this the trigger for unknown-tool
onboarding. Too narrow and real tools are missed; too broad and users are
prompted for tools that only appear in docs, sample code, or unrelated
dev-dependencies. The definition is what makes FR-038 acceptance testable.

**Options:**

| Option | Description |
|---|---|
| A | Any string match of the tool name anywhere in the repo |
| B | Concrete-evidence signals only (deps, config, env, SDK imports) |
| C | Only dependency-manifest hits |
| D | A curated per-tool signal list |
| Short | A different short answer (<=5 words) |

**Recommended default:** Option B.

**✅ Accepted answer: Option B, extended.** Concrete-evidence signals
(dependency manifests, tool-specific config files, env-var names /
connection-string fragments, SDK imports in source) PLUS mentions of the
tool in any `*.md` documentation file in the repo. Any one such signal
combined with the absence of a registered playbook triggers the prompt.

**Integrated into:** FR-038; US3 acceptance scenario 6; Edge Case "Unknown
tool discovered during scan".

---

## Question 4 — Secret-redaction pattern set  ✅ ANSWERED

**Question:** What patterns should count as a "secret" for the mandatory
redaction step before pasted tool output is written to the ledger, memory,
or report (FR-030, SC-004)?

**Why it matters / impact:** SC-004 mandates "0 credentials, secrets, or
environment values … written into any file under `.investigator/`," which
becomes a durable leak because `.investigator/` is committed to git.
Without a defined detection ruleset, SC-004 is unverifiable.

**Options:**

| Option | Description |
|---|---|
| A | Only redact when the user explicitly marks a value as secret |
| B | Curated regex + entropy check + suspicious-key-name check |
| C | Regex patterns only |
| D | Delegate to an external secret-scanner library |
| Short | A different short answer (<=5 words) |

**Recommended default:** Option B.

**✅ Accepted answer: Option B.** Curated credential regex set (API keys,
JWTs, bearer tokens, `password=` in connection strings, AWS/GCP access
keys, PEM / private-key blocks) + high-entropy check on standalone tokens
of length ≥ 32 characters + suspicious-key-name check
(`password|secret|token|key|credential`, case-insensitive). Redactions
replace the secret with a stable `[REDACTED]` placeholder.

**Integrated into:** FR-030 (definition); FR-031 (tied to the same
ruleset); SC-004 (measurable, ruleset-tied); Edge Case "Pasted tool output
contains a secret".

---

## Question 5 — Case ID format  ✅ ANSWERED

**Question:** What format should case IDs take, as used in `cases/index.md`
rows and `cases/<case-id>/` directory names (FR-021)?

**Why it matters / impact:** Format affects sortability, git-friendliness,
cross-machine collision risk, and readability of citations in plans.

**Options:**

| Option | Description |
|---|---|
| A | UUID v4 |
| B | `YYYYMMDD-<short-slug>` with time+random fallback |
| C | Sequential integer per repo |
| D | Free-form user-chosen slug |
| Short | A different short answer (<=5 words) |

**Recommended default:** Option B.

**✅ Accepted answer: Option B.** `YYYYMMDD-<short-slug>` where
`<short-slug>` is a lowercase kebab-case summary picked at case-open time
(e.g. `20260813-webhook-payload-mismatch`), with a
`YYYYMMDD-HHMM-<random4>` fallback when no slug is supplied.

**Integrated into:** FR-021 (case-id format rule); Key Entities → Case.

---

## Status

All 5 questions **ANSWERED** and integrated into `spec.md` body (not only in
the Clarifications section). Audit trail recorded in
`autopilot-assumptions.md`. `/speckit-plan` is unblocked.
