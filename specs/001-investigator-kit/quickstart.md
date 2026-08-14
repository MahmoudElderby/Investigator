# Quickstart: Investigator Kit Validation

Runnable guide to prove the kit works end-to-end. Implementation details live in `plan.md`, `data-model.md`, and `contracts/`.

**Prerequisites**

- Node.js 20+
- npm / npx
- Cursor and/or Claude Code (for host-specific golden runs)
- Git

---

## 1. Build / link the installer (development)

From repository root:

```powershell
cd installer
npm install
npm link
```

Or from a scratch target project after publish:

```bash
npx investigator-kit init --cursor
```

---

## 2. Install into scratch project (US2)

```powershell
mkdir C:\temp\inv-scratch-cursor
cd C:\temp\inv-scratch-cursor
git init
npx investigator-kit init --cursor
```

**Expect**:

- `.cursor/skills/investigator/SKILL.md` (and playbooks)
- `.cursor/agents/inv-*.md` (five subagents)
- `.investigator/config.yml`, `registry.yml`, `profile.md`, `memory/`, `cases/index.md`
- stdout ends with: `Installed. Open your agent and run the 'investigator-init' skill to adapt it to this project.`

Repeat with `--claude` in `inv-scratch-claude` and verify `.claude/` paths.

**No-flag test**: run `npx investigator-kit init` in empty project → interactive host list appears (no auto-detect).

---

## 3. First-run init (US3)

Open scratch project in agent host. Run skill **`investigator-init`**.

**Expect**:

1. Stack scan summary before redundant questions
2. Knowledge-source question (3 options)
3. Per-source access mode prompts
4. Model tier confirmation
5. Populated `.investigator/profile.md` and `config.yml`

See `contracts/config-schemas.yml` for field shapes.

---

## 4. Golden scenario E2E (US1, FR-056–FR-057)

### 4.1 Prepare fixtures

Copy synthesized fixtures from kit repo (once implemented):

```powershell
cp -Recurse C:\work\ai\Investigator\docs\golden-fixtures\* C:\temp\inv-scratch-cursor\
```

Fixtures include:

- Webhook handler expecting `requestIdHash`
- Sample provider payload with `requestID`
- SQL schema with unindexed `nvarchar(max)` lookup
- Log snippets with error **258** and **35s** lock timeout

Configure `.investigator/config.yml` with `manual` access for all sources (paste queries/results during investigation).

### 4.2 Run investigation

In agent, invoke **`investigator`** skill with ticket text describing:

> Provider webhooks failing "record not found"; DB operations timing out after 35s lock.

**Expect** (see `contracts/report-output.md`):

| Check | Pass criteria |
|-------|---------------|
| Root cause 1 | `requestID` vs `requestIdHash` mismatch cited |
| Root cause 2 | unindexed `nvarchar(max)` → timeout 258 under lock |
| Confidence | Each finding ≥ medium with rubric text |
| Report shape | Six sections in order |
| Evidence | ≥2 subagent domains represented |
| Secrets | No FR-030 patterns under `.investigator/` |
| Direction Brief | Compact status card + steer in chat; full Q→A in `plan.md` |

### 4.3 Repeat per host

Run full golden path on **both** `--cursor` and `--claude` installs (SC-002).

---

## 5. Re-install & portability (US6)

```powershell
# After golden case completes (state in .investigator/)
cd C:\temp\inv-scratch-cursor
git add .investigator
git commit -m "save investigator state"

npx investigator-kit init --claude
# Accept skills/agents overwrite; KEEP .investigator/
```

**Expect**: `.investigator/` byte-identical; Claude skills/agents present; prior case readable.

---

## 6. Case library reuse (US5)

Seed `cases/index.md` with a prior row whose RCA summary matches a new ticket. Start new investigation.

**Expect** (FR-021a):

- First plan action: semantic lookup across all index fields
- Plan cites prior case id + match reasoning
- Prior root cause treated as lead only

---

## 7. Add tool after init (US4)

Run **`investigator-add-agent`**; onboard fictional `grafana`.

**Expect**: new playbook skill, `registry.yml` entry, `playbook-memory/grafana.md`, smoke-query prompt — no edits to existing subagent definition files in `core/agents/`.

---

## 8. Installer unit tests (CI)

```powershell
cd C:\work\ai\Investigator\installer
npm test
```

Covers dialect transform snapshots and overwrite-default logic per `contracts/agent-dialect-transform.md` and `contracts/cli-installer.md`.

---

## References

| Topic | Document |
|-------|----------|
| CLI behavior | `contracts/cli-installer.md` |
| Agent transform | `contracts/agent-dialect-transform.md` |
| Report format | `contracts/report-output.md` |
| YAML shapes | `contracts/config-schemas.yml` |
| Secret rules | `contracts/secret-redaction.md` |
| Entities | `data-model.md` |
