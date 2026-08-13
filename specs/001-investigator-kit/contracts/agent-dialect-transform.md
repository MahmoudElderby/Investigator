# Contract: Agent Dialect Transform

Canonical source: `core/agents/<name>.md`  
Transform at install time only — never edit canonical files per host.

---

## Canonical frontmatter schema

```yaml
---
name: <agent-id>                    # required; lowercase kebab
description: <delegation trigger>   # required; multiline allowed with >-
model_tier: deep | mid | fast       # required; maps via .investigator/config.yml
tools: inherit | <tool-list>        # optional; default inherit
---
```

**Allowed agent ids** (fixed set for v1):

- `inv-log-rca`
- `inv-data-rca`
- `inv-code-rca`
- `inv-vendor-compare`
- `inv-report`

Agent body (below `---`) copies **byte-identical** to both hosts.

---

## Cursor emit rules

**Path**: `.cursor/agents/<name>.md`

```yaml
---
name: <agent-id>
description: <same as canonical>
model: inherit
---
```

| Canonical input | Cursor output |
|-----------------|---------------|
| `model_tier: *` | `model: inherit` + body already instructs tier lookup |
| `tools: inherit` | omit `tools` key |
| `tools: Read, Grep, …` | `tools: Read, Grep, …` (comma-separated or YAML list per Cursor convention in repo samples) |

**Note**: Cursor subagents in this project use `model:` key (see `.cursor/agents/speckit-plan.md`). Do not emit `model_tier` in host files.

---

## Claude Code emit rules

**Path**: `.claude/agents/<name>.md`

```yaml
---
name: <agent-id>
description: <same as canonical>
model: inherit
---
```

| Canonical input | Claude output |
|-----------------|---------------|
| `model_tier: *` | `model: inherit` |
| `tools: inherit` | omit `tools` (inherits session tools) |
| `tools: Read, Grep, …` | `tools: Read, Grep, …` (comma-separated string per Claude docs) |

Claude accepts `model` values: `sonnet`, `opus`, `haiku`, `inherit`, or full model id. Tier resolution remains runtime via config, not install-time hardcoding.

---

## Transform algorithm (pseudocode)

```text
function transformAgent(canonicalMarkdown, host):
  { data, content } = parseFrontmatter(canonicalMarkdown)
  assert data.name and data.description and data.model_tier
  out = { name: data.name, description: data.description, model: "inherit" }
  if data.tools and data.tools != "inherit":
    out.tools = normalizeToolList(data.tools, host)
  return serializeFrontmatter(out) + content
```

---

## Skills — no transform

Playbook and orchestrator skills use cross-host `SKILL.md` format. Installer copies directory tree to:

- `.cursor/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`

---

## Extensibility

Adding host `X` requires:

1. New CLI flag `--x`
2. Path map entry in installer
3. `emitAgentFrontmatter(profile=X)` branch
4. No changes to canonical agents

---

## Verification (installer tests)

Golden files in `installer/tests/fixtures/`:

| Input | Expected Cursor | Expected Claude |
|-------|-----------------|-----------------|
| `inv-log-rca.md` canonical | snapshot `.cursor/` | snapshot `.claude/` |
| explicit tools list | tools present | tools comma string |
| inherit tools | no tools key | no tools key |
