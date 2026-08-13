#!/usr/bin/env node
/**
 * Phase 7 automated validation — install checks (not live-agent E2E).
 */
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { install } from '../lib/install.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const validationRoot = path.join(repoRoot, 'temp', 'validation');

async function validateHost(host) {
  const scratch = path.join(validationRoot, `scratch-${host}`);
  await fs.remove(scratch);
  await fs.ensureDir(scratch);

  await install(scratch, host, {
    overwriteSkills: true,
    overwriteAgents: true,
    overwriteInvestigator: true,
  });

  const skillsDir = host === 'cursor' ? '.cursor/skills' : '.claude/skills';
  const agentsDir = host === 'cursor' ? '.cursor/agents' : '.claude/agents';
  const prefix = host === 'cursor' ? '.cursor/skills/' : '.claude/skills/';

  const checks = {
    investigatorSkill: await fs.pathExists(path.join(scratch, skillsDir, 'investigator/SKILL.md')),
    playbookMssql: await fs.pathExists(path.join(scratch, skillsDir, 'playbook-mssql/SKILL.md')),
    fiveAgents: (await fs.readdir(path.join(scratch, agentsDir))).filter((f) => f.startsWith('inv-')).length === 5,
    configHost: (await fs.readFile(path.join(scratch, '.investigator/config.yml'), 'utf8')).includes(`host: ${host}`),
    registryPaths: (await fs.readFile(path.join(scratch, '.investigator/registry.yml'), 'utf8')).includes(`${prefix}playbook-elastic/SKILL.md`),
  };

  const fixturesSrc = path.join(repoRoot, 'docs', 'golden-fixtures');
  await fs.copy(fixturesSrc, scratch, { overwrite: true, filter: (src) => !src.endsWith('README.md') || path.basename(src) !== 'README.md' });
  await fs.copy(path.join(fixturesSrc, 'ticket.md'), path.join(scratch, 'golden-ticket.md'));

  return { host, scratch, checks, allPass: Object.values(checks).every(Boolean) };
}

async function validateKeep() {
  const scratch = path.join(validationRoot, 'scratch-portability');
  await fs.remove(scratch);
  await fs.ensureDir(scratch);

  await install(scratch, 'cursor', {
    overwriteSkills: true,
    overwriteAgents: true,
    overwriteInvestigator: true,
  });

  const configPath = path.join(scratch, '.investigator/config.yml');
  const before = await fs.readFile(configPath);
  await fs.appendFile(path.join(scratch, '.investigator/memory/orchestrator.md'), '\n- portability marker\n');

  await install(scratch, 'claude', {
    overwriteSkills: true,
    overwriteAgents: true,
    overwriteInvestigator: false,
  });

  const after = await fs.readFile(configPath);
  return {
    configIdentical: before.equals(after),
    claudeSkills: await fs.pathExists(path.join(scratch, '.claude/skills/investigator/SKILL.md')),
  };
}

const cursorResult = await validateHost('cursor');
const claudeResult = await validateHost('claude');
const keepResult = await validateKeep();

const report = {
  timestamp: new Date().toISOString(),
  cursor: cursorResult,
  claude: claudeResult,
  portability: keepResult,
  liveAgentRequired: [
    'investigator-init interview (US3)',
    'investigator golden scenario orchestration (US1 T070-T071)',
    'investigator-add-agent Grafana onboarding (US4)',
    'Case library semantic lookup verification (US5 T073)',
  ],
};

await fs.ensureDir(validationRoot);
await fs.writeJson(path.join(validationRoot, 'report.json'), report, { spaces: 2 });

console.log(JSON.stringify(report, null, 2));
process.exit(cursorResult.allPass && claudeResult.allPass && keepResult.configIdentical ? 0 : 1);
