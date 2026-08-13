# Canonical Agent Frontmatter Schema

Reference for `core/agents/*.md` and install-time dialect transform.

## Required keys

```yaml
---
name: <agent-id>                    # lowercase kebab; fixed v1 set below
description: <delegation trigger>     # multiline allowed with >-
model_tier: deep | mid | fast         # resolved via .investigator/config.yml at runtime
tools: inherit | <tool-list>          # optional; default inherit
---
```

## Allowed agent ids (v1)

- `inv-log-rca`
- `inv-data-rca`
- `inv-code-rca`
- `inv-vendor-compare`
- `inv-report`

## Host transform

Installer emits `model: inherit` and copies body byte-identical. See `contracts/agent-dialect-transform.md`.
