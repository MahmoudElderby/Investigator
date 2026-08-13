# Contract: CLI Installer (`investigator-kit`)

**Package**: `investigator-kit` (npm)  
**Binary**: `investigator-kit`  
**Primary command**: `init`

---

## Invocation

```bash
npx investigator-kit init [--cursor | --claude] [--force]
```

| Flag | Effect |
|------|--------|
| `--cursor` | Install for Cursor host |
| `--claude` | Install for Claude Code host |
| `--force` | Accept all overwrite prompts with kit defaults (skills OVERWRITE, subagents OVERWRITE, `.investigator/` KEEP) |

**Mutually exclusive**: `--cursor` and `--claude` cannot both be set.

---

## Host selection

| Condition | Behavior |
|-----------|----------|
| `--cursor` | Install Cursor layout |
| `--claude` | Install Claude layout |
| Neither flag | **Interactive list** of supported hosts: `Cursor`, `Claude Code`. User must select. **No auto-detection.** |

---

## Mechanical responsibilities (FR-046)

The CLI MUST perform **only**:

1. Resolve target project root (cwd).
2. Copy kit skills (orchestrator, init, add-agent, playbooks) to host skills directory unchanged.
3. Transform and copy canonical agents from `core/agents/` to host agents directory.
4. Scaffold `.investigator/` from `core/templates/` **only when** group (c) overwrite approved or directory absent. During scaffold (FR-051a, FR-051b):
   - Write the selected host (`cursor` or `claude`) into `config.yml` as both `host` and `host_model_map.host`.
   - Rewrite `registry.yml` `playbooks[].skill_path` values from the canonical template placeholder to the host skills root (`.cursor/skills/…` or `.claude/skills/…`), mirroring the agent dialect transform.
5. Print completion message (exact string below).

The CLI MUST NOT:

- Run LLM or scan target codebase
- Ask knowledge-source, access-mode, or model-tier questions
- Write credentials or environment values

---

## File placement

| Artifact | Cursor path | Claude path |
|----------|-------------|-------------|
| Skills | `.cursor/skills/<skill-name>/SKILL.md` | `.claude/skills/<skill-name>/SKILL.md` |
| Agents | `.cursor/agents/<agent-name>.md` | `.claude/agents/<agent-name>.md` |
| State | `.investigator/**` | `.investigator/**` (identical) |

**Kit manifest**: Installer ships an internal list of owned paths (skills, agents, template files) to support overwrite prompts without touching user-created playbooks outside the manifest.

---

## Re-install overwrite prompts (FR-049)

When any owned file already exists, prompt **three times** before replacing files in that group:

### Group (a) — Skills

```
Replace Investigator kit skills? (playbooks + orchestrator skills) [Y/n]
Default: Y
```

### Group (b) — Subagents

```
Replace Investigator subagent definitions? [Y/n]
Default: Y
```

### Group (c) — `.investigator/` state

```
Replace .investigator/ scaffold (WARNING: may delete memories and case library)? [y/N]
Default: N (KEEP)
```

If KEEP on (c): skip all template writes under `.investigator/` except **missing** stub files that do not exist yet (safe additive scaffold only — document in installer: never overwrite existing memory/cases on KEEP).

---

## Host-aware scaffold transforms (FR-051a, FR-051b)

Applied when group (c) is overwritten or `.investigator/` is absent. Canonical templates use a neutral skills-root placeholder (e.g. `{{HOST_SKILLS}}/playbook-mssql/SKILL.md`); the installer substitutes the host-specific prefix before write.

| Selected host | `config.yml` `host` + `host_model_map.host` | `registry.yml` `skill_path` prefix |
|---------------|-----------------------------------------------|--------------------------------------|
| `--cursor` / Cursor list choice | `cursor` | `.cursor/skills/` |
| `--claude` / Claude Code list choice | `claude` | `.claude/skills/` |

`investigator-init` merges other config fields but MUST NOT infer or overwrite `host` / `host_model_map.host` from filesystem paths.

On re-install with group (c) KEEP, existing `config.yml` and `registry.yml` are untouched — host switching requires skills/agents overwrite plus user consent on (c) or an explicit init/registry update (US6).

---

## Verification test vectors (installer tests)

| Input | Expected |
|-------|----------|
| `init --cursor` on empty project | `config.yml`: `host: cursor`, `host_model_map.host: cursor`; `registry.yml` paths start with `.cursor/skills/` |
| `init --claude` on empty project | `config.yml`: `host: claude`, `host_model_map.host: claude`; `registry.yml` paths start with `.claude/skills/` |
| Interactive list → Cursor | Same as `--cursor` row |
| Re-install KEEP on (c) with existing `.investigator/` | `config.yml` and `registry.yml` byte-identical; skills/agents refreshed per groups (a)/(b) |
| Re-install OVERWRITE on (c) after `--claude` on prior `--cursor` project | `host`/`host_model_map.host` → `claude`; all `skill_path` values use `.claude/skills/` |

See also `contracts/agent-dialect-transform.md` and `installer/tests/` snapshots.

---

## Success output (FR-048)

Stdout MUST end with exactly:

```text
Installed. Open your agent and run the 'investigator-init' skill to adapt it to this project.
```

Exit code: `0`.

---

## Error conditions

| Condition | Exit code | Message |
|-----------|-----------|---------|
| Unknown flag | 1 | Usage help |
| Both host flags | 1 | `Cannot use --cursor and --claude together` |
| Write permission denied | 1 | Path + hint |
| Package core/ missing | 1 | Internal error — corrupt install |

---

## npm package layout

```text
investigator-kit/
  package.json          # bin: investigator-kit → installer/bin/cli.js
  core/                 # Copied from repo core/ at publish time
  installer/
    bin/cli.js
    lib/
      install.js
      transform-agent.js
      prompts.js
      manifest.js
```

**Publish**: `files` field includes `core/`, `installer/`, `package.json`, `README.md`.

---

## Non-goals

- Global install requirement (npx suffices)
- Hosts beyond Cursor and Claude Code (extensibility via new transform profile only)
