# Direction Brief contract

**Producer**: Investigator orchestrator (`investigator` skill), Step 1 (intake) and again before any follow-up dispatch in the challenge protocol  
**Consumers**: The user (conversation) and `cases/<case-id>/plan.md`  
**Requirements**: FR-058, FR-059

The orchestrator MUST show this brief **before** the first specialist dispatch. It MUST also persist it in `plan.md`. Follow-up briefs MAY be appended under a `## Follow-up direction` heading.

## Required sections (in order)

### 1. Problem I think we're solving

1–3 plain-language sentences. Not UNKNOWN. If framing cannot be stated, stop and ask the user — do not dispatch.

### 2. Self-interrogation log

A list of questions the orchestrator asked **itself**. Each row:

| Field | Rule |
|-------|------|
| Question | Concrete, about this incident |
| Status | `ANSWERED` or `PARKED` |
| Answer or owner | Closed answer (tag `INFERRED` if deduced) **or** named owner: subagent id, playbook query, or `user` |

Coverage: at least one question in each **always** category (failure vs symptom, scope, hypotheses, evidence map, agent selection, being wrong). **Join / how-to** and **time & change** only if this case needs them. Cap 16; leftover questions stay PARKED with owners.

If a join is needed and memory already has a matching Reusable how-to row, the log MUST cite `reused from <case-id>` instead of rediscovering field names.

### 3. Hypotheses

At least two, ranked. Each has:

- A confirm test (what evidence would prove it)
- A kill test (what evidence would disprove it)

Prior-case root causes may appear only as lead hypotheses, never as conclusions.

### 4. Direction

**Sending now**: each dispatched specialist with playbook(s) and the PARKED questions it must answer.

**Not sending yet**: every remaining core specialist except `inv-report`, with a reason (premature / out of scope / no parked question for it).

`inv-report` is never in the first wave.

### 5. Still unknown

PARKED items and who owns them. User-owned items block dispatch until answered.

### 6. Reused how-to

Memory rows used in this case, or `none (not needed / not learned yet)`. The user is never the source of correlation field names.

## Visibility

- The same content MUST appear in the user-visible session, not only in `plan.md`.
- Do not wait for a generic approval if the dispatch gate in the orchestrator skill is met.
- If the user redirects, revise this brief before dispatching.
