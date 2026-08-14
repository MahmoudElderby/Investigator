# Status card + compact Direction Brief

**Producer**: Investigator orchestrator  
**Consumers**: User-visible chat (primary UI); `cases/<case-id>/status.md` (copy)  
**Requirements**: FR-061 (also amends FR-059 visibility)

The on-call UI is **chat**, not `plan.md`. The full interrogation log stays in `plan.md` for audit. Chat gets a one-screen **status card**, a **compact Direction Brief**, and a short **steer** before the first dispatch.

## Status card (required fields)

Post and rewrite this block in chat whenever phase or Latest changes. Same content in `status.md`.

```markdown
## Status
**Case:** <case-id>
**Problem:** <≤2 sentences>
**Phase:** Intake | Direction (steer) | Dispatch | Challenge | Report | Closed
**Sending:** <agent, agent, …>  — or none yet
**Skipped:** <agent (why), …>
**Need from you:** none | <only user-owned PARKED items>
**Latest:** <one line: what just happened>
```

Do **not** paste the self-interrogation log into chat.

## Compact Direction Brief (chat only)

Immediately under the first status card, before the first dispatch:

```markdown
### Direction
**H1:** <one line>  **H2:** <one line>
**Why these agents:** <one line>
**How-to:** reused from <id> | none needed | will discover
```

Full hypotheses, confirm/kill tests, and Q→A stay in `plan.md`.

## Steer (first dispatch only)

After the compact brief, post:

```markdown
### Steer
Reply with:
- `Go` — dispatch as planned
- `Skip <agent>` — drop that specialist this wave
- `Wrong service: <name>` — I will re-scope

I will wait. Full log: `cases/<id>/plan.md`
```

Then **end the turn**. Do not dispatch in the same turn.

**Skip the wait** only when the user's ticket/message already contains an explicit proceed (`go`, `proceed`, `don't wait`, `autopilot`). Then dispatch after showing the card.

On reply:

| Reply | Action |
|-------|--------|
| `Go` / ok / proceed / lgtm | Step 2 |
| `Skip <agent>` | Move agent to Skipped, refresh card, dispatch (no second wait) |
| `Wrong service: …` or other redirect | Revise interrogation + `plan.md` + card, **one** more steer |
| User-owned PARKED still unanswered | Stay blocked (existing FR-059 rule) |

Follow-up dispatches (challenge): refresh the card (`Latest`, `Sending`). Do **not** steer again unless who-is-sent changed in a way that contradicts the last accepted plan.

## Live updates

While specialists run, update **Latest** (and Phase) when each starts or returns, e.g. `inv-code-rca: reading WebhookHandler.cs`. One line. No dumps.
