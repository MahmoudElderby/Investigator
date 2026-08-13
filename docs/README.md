# Investigator Kit

Portable, installable AI investigation system for production incident root-cause analysis.

## Overview

Investigator coordinates specialist subagents to investigate incidents, maintain an evidence ledger, challenge findings, and produce ELI5-first RCA reports — without modifying your target codebase.

## Quick start

```powershell
npx investigator-kit init --cursor
```

Then open your agent host and run the `investigator-init` skill to adapt the kit to your project.

Full validation guide: [specs/001-investigator-kit/quickstart.md](../specs/001-investigator-kit/quickstart.md)

## Repository layout

| Path | Purpose |
|------|---------|
| `core/skills/` | Orchestrator, init, add-agent skills |
| `core/agents/` | Canonical subagent definitions |
| `core/playbooks/` | Tool-specific playbook skills |
| `core/templates/` | `.investigator/` scaffold templates |
| `installer/` | Node.js CLI (`npx investigator-kit init`) |
| `docs/golden-fixtures/` | Golden scenario test fixtures |

## Validation results

Updated: 2026-08-13 (implement phase)

### Installer unit tests (§8)

```
Test Files  2 passed (2)
Tests       10 passed (10)
```

Covers: agent dialect transform (5 agents × 2 hosts), `--cursor`/`--claude` scaffold (FR-051a/b), KEEP-default on `.investigator/` (SC-006), host-switch OVERWRITE refresh.

### Phase 7 automated checks

| Check | Cursor | Claude | Result |
|-------|--------|--------|--------|
| Skills + playbooks installed | ✓ | ✓ | PASS |
| Five subagents transformed | ✓ | ✓ | PASS |
| `config.yml` host fields | ✓ | ✓ | PASS |
| `registry.yml` skill_path prefix | ✓ | ✓ | PASS |
| Golden fixtures copied to scratch | ✓ | ✓ | PASS |
| Re-install KEEP portability | ✓ (→ Claude) | — | PASS |

Scratch projects: `temp/validation/scratch-cursor`, `temp/validation/scratch-claude`

### Requires live-agent execution

These quickstart steps cannot be automated in CI (prose skills, LLM orchestration):

- **§3** `investigator-init` interview flow (US3)
- **§4** Golden scenario `investigator` run — both root causes, six-part report, confidence rubric (US1 T070–T071)
- **§6** Case-library semantic lookup citing prior case id (US5 T073)
- **§7** `investigator-add-agent` Grafana onboarding (US4)

Run manually per [quickstart.md](../specs/001-investigator-kit/quickstart.md) after `npx investigator-kit init`.
