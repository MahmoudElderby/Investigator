/**
 * Kit manifest — owned paths for overwrite prompt groups (FR-049).
 * Group (a): skills, Group (b): agents, Group (c): .investigator/
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const KIT_ROOT = path.resolve(__dirname, '../..');

/** Orchestrator + init + add-agent + playbook skill folder names */
export const SKILL_NAMES = [
  'investigator',
  'investigator-init',
  'investigator-add-agent',
  'playbook-elastic',
  'playbook-mssql',
  'playbook-redis',
  'playbook-k8s-logs',
];

/** Canonical subagent file names (without path) */
export const AGENT_NAMES = [
  'inv-log-rca',
  'inv-data-rca',
  'inv-code-rca',
  'inv-vendor-compare',
  'inv-report',
];

/** Template files scaffolded into .investigator/ (relative to templates dir) */
export const INVESTIGATOR_TEMPLATE_FILES = [
  'config.yml.tpl',
  'registry.yml.tpl',
  'profile.md.tpl',
  'redaction-rules.md',
  'cases/index.md.tpl',
  'cases/artifacts/ticket.md.tpl',
  'cases/artifacts/plan.md.tpl',
  'cases/artifacts/evidence-ledger.md.tpl',
  'cases/artifacts/challenge-log.md.tpl',
  'cases/artifacts/report.md.tpl',
  'memory/orchestrator.md.tpl',
  'memory/inv-log-rca.md.tpl',
  'memory/inv-data-rca.md.tpl',
  'memory/inv-code-rca.md.tpl',
  'memory/inv-vendor-compare.md.tpl',
  'memory/inv-report.md.tpl',
  'playbook-memory/elastic.md.tpl',
  'playbook-memory/mssql.md.tpl',
  'playbook-memory/redis.md.tpl',
  'playbook-memory/k8s-logs.md.tpl',
];

export const HOST_PATHS = {
  cursor: {
    host: 'cursor',
    skillsDir: '.cursor/skills',
    agentsDir: '.cursor/agents',
    skillsPrefix: '.cursor/skills/',
  },
  claude: {
    host: 'claude',
    skillsDir: '.claude/skills',
    agentsDir: '.claude/agents',
    skillsPrefix: '.claude/skills/',
  },
};

export function getCoreSkillsDir() {
  return path.join(KIT_ROOT, 'core', 'skills');
}

export function getCorePlaybooksDir() {
  return path.join(KIT_ROOT, 'core', 'playbooks');
}

export function getCoreAgentsDir() {
  return path.join(KIT_ROOT, 'core', 'agents');
}

export function getTemplatesDir() {
  return path.join(KIT_ROOT, 'core', 'templates');
}

/** All skill source directories: core/skills + core/playbooks */
export function listSkillSources() {
  const skills = SKILL_NAMES.filter((n) => !n.startsWith('playbook-')).map((name) => ({
    name,
    sourceDir: path.join(getCoreSkillsDir(), name),
  }));
  const playbooks = SKILL_NAMES.filter((n) => n.startsWith('playbook-')).map((name) => ({
    name,
    sourceDir: path.join(getCorePlaybooksDir(), name),
  }));
  return [...skills, ...playbooks];
}

export function investigatorDestPath(templatesRelPath) {
  if (templatesRelPath.endsWith('.tpl')) {
    return templatesRelPath.slice(0, -4);
  }
  return templatesRelPath;
}
