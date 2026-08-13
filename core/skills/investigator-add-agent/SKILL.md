---
name: investigator-add-agent
description: >-
  Post-init tool onboarding. Reuses unknown-tool interview to add playbooks, registry
  entries, and bindings without editing core subagent definitions.
---

# Investigator Add Agent (Tool Onboarding)

Onboard a new data/log tool **after** initial `investigator-init`. Reuses the unknown-tool interview from `investigator-init` (FR-052).

**Never edit** files under `core/agents/` — only playbooks, registry, playbook-memory.

---

## When to run

User adopts a new observability/data tool not covered by existing `registry.yml` playbooks.

---

## Interview (reuse FR-038 flow)

Ask the user for:

1. Tool name and purpose
2. URL/API endpoint pattern
3. Query language or API shape
4. Auth method (reference only — no secrets)
5. One known-good example query
6. Correlation fields used in this project
7. Read-only constraints

---

## Artifact generation (FR-053, FR-015)

Create/update:

1. **Playbook skill** at host skills path: `<host>/skills/playbook-<tool>/SKILL.md`
   - Query dialect, read-only patterns, auth/access-mode handling, correlation guidance
   - FR-030 redaction instructions referencing `.investigator/redaction-rules.md`

2. **`registry.yml` append**:
   ```yaml
   - id: playbook-<tool>
     tool: <tool>
     skill_path: <host-specific path>
     subagents: [inv-log-rca]  # or inv-data-rca per tool type
     sources: [<configured-source-name>]
   ```

3. **Subagent binding** — map to appropriate core subagent (`inv-log-rca` for logs, `inv-data-rca` for datastores)

4. **`playbook-memory/<tool>.md`** — empty stub with header

5. **Smoke query** — ask user to run example query and paste result; verify playbook works

---

## Cancel / rollback (US4 scenario 2)

If user cancels mid-onboarding:

- **Do not leave partial artifacts**, OR
- Mark incomplete stubs with `<!-- INCOMPLETE — safe to delete -->` at top
- Remove partial `registry.yml` entries if smoke query not verified

---

## Guardrails

- No credentials in generated files
- Read-only emphasis in every playbook
- Secret redaction per `.investigator/redaction-rules.md`
