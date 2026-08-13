---
name: investigator-init
description: >-
  First-run project adaptation. Scan-first interview: stack summary, knowledge source,
  access modes, unknown-tool onboarding, model tiers. Writes .investigator/ state.
---

# Investigator Init

Run once after CLI install (`npx investigator-kit init`). Adapts Investigator to this project.

**Do not infer or overwrite** `host` or `host_model_map.host` in `config.yml` — installer sets those (FR-051a).

---

## Workflow overview

1. Scan first — infer before asking
2. Knowledge-source interview
3. Stack summary confirmation (corrections only)
4. Per-data-source access modes
5. Unknown-tool detection and onboarding
6. Model tier mapping
7. Write outputs; preserve existing cases/memory on re-run

---

## Step 1 — Scan first (FR-035)

Before redundant questions, scan the target project for:

- Services (APIs, workers, web apps) from solution structure, docker-compose, k8s manifests
- Databases from connection strings (names only — redact values), ORM configs, migrations
- Log systems (Elastic indices, Serilog sinks, cloud logging)
- Webhooks/integrations (controllers, route maps, OpenAPI)
- Correlation keys (middleware, logging enrichers, trace headers)

Draft `.investigator/profile.md` sections from findings.

---

## Step 2 — Knowledge source (FR-036)

Ask exactly:

> How should Investigator learn your system?
>
> 1. **Docki knowledge base (best)** — pre-classified architecture knowledge
> 2. **Existing docs folder** — point at md/docs (*reduces token usage vs codebase scan*)
> 3. **Codebase scan** — explore code directly (most expensive)

**Pre-select option 1** when `knowledge/AI_CONTEXT.md` exists (recommended).

- Docki install is **OUT OF SCOPE** — recommend only; record choice in `config.yml`
- If user picks 2 or 3, end with one-line nudge that Docki gives best results

Record `knowledge_source`: `docki` | `docs_folder` | `codebase_scan`
If `docs_folder`, set `knowledge_path`.

---

## Step 3 — Stack summary confirmation (FR-035)

Present auto-detected stack summary from scan. User **corrects only** — do not re-ask what scan found.

Update `profile.md`: Services, Data stores, Log systems, Webhooks/integrations, Correlation keys, Known traps.

---

## Step 4 — Access modes (FR-037, FR-026)

For each data source discovered, prompt:

> Access mode for `<name>`? **manual** / **mcp** / **cli**

Write to `config.yml` `data_sources[]`:

```yaml
- name: mssql-prod
  kind: mssql
  access_mode: manual
```

Optional: `mcp_server`, `cli_wrapper` when not manual.

Default: `manual`.

---

## Step 5 — Unknown-tool detection (FR-038)

Detect tools referenced but missing from `registry.yml` playbooks:

- Dependency manifests (package.json, csproj, requirements.txt)
- Config files mentioning vendors (Grafana, Datadog, etc.)
- Env-var / connection-string **names** (not values)
- SDK imports
- `*.md` mentions of observability/data tools

**Combined signal**: reference found + no matching registry playbook → prompt onboarding.

---

## Step 6 — Unknown-tool onboarding branch (FR-038)

When user accepts onboarding, interview:

1. URL/API endpoint pattern
2. Query language / API shape
3. Auth method (name only — no secrets)
4. One known-good example query
5. Correlation fields
6. Read-only constraints

Generate:

- Playbook skill under host skills path
- `registry.yml` entry with subagent binding
- Empty `playbook-memory/<tool>.md`
- Prompt user for smoke query paste to verify

---

## Step 7 — Model tiers (FR-039, FR-041)

Present defaults from `config.yml` `model_tiers`. User confirms or edits **`host_model_map` deep/mid/fast only**.

**Must NOT** change `host` or `host_model_map.host`.

---

## Step 8 — Completion outputs (FR-040)

Write/update:

- `.investigator/profile.md`
- Merge `config.yml` (except host fields)
- Merge `registry.yml` (preserve user onboarded entries)
- Seed empty memory stubs if missing
- Seed empty `cases/index.md` if missing

---

## Re-run behavior (FR-041)

Re-running init:

- Updates config and profile
- **Does not clobber** existing `cases/`, `memory/`, or `playbook-memory/` content
- May add missing stub files only

---

## Secret redaction

Apply `.investigator/redaction-rules.md` before any write (FR-030).
