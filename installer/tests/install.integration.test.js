import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import yaml from 'yaml';
import { afterEach, describe, expect, it } from 'vitest';
import { install, detectExisting } from '../lib/install.js';
import { AGENT_NAMES, SKILL_NAMES } from '../lib/manifest.js';

const tmpDirs = [];

async function makeScratch(name) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `inv-${name}-`));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tmpDirs.splice(0)) {
    await fs.remove(dir);
  }
});

describe('install integration', () => {
  it('scaffolds empty --cursor project with FR-051a/b paths', async () => {
    const root = await makeScratch('cursor');
    await install(root, 'cursor', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    for (const skill of SKILL_NAMES) {
      expect(await fs.pathExists(path.join(root, '.cursor/skills', skill, 'SKILL.md'))).toBe(
        true,
      );
    }

    for (const agent of AGENT_NAMES) {
      const agentPath = path.join(root, '.cursor/agents', `${agent}.md`);
      expect(await fs.pathExists(agentPath)).toBe(true);
      const content = await fs.readFile(agentPath, 'utf8');
      expect(content).toContain('model: inherit');
    }

    const config = yaml.parse(await fs.readFile(path.join(root, '.investigator/config.yml'), 'utf8'));
    expect(config.host).toBe('cursor');
    expect(config.host_model_map.host).toBe('cursor');

    const registry = await fs.readFile(path.join(root, '.investigator/registry.yml'), 'utf8');
    expect(registry).toContain('.cursor/skills/playbook-mssql/SKILL.md');
    expect(registry).not.toContain('{{HOST_SKILLS}}');
  });

  it('scaffolds empty --claude project with claude paths', async () => {
    const root = await makeScratch('claude');
    await install(root, 'claude', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    const config = yaml.parse(await fs.readFile(path.join(root, '.investigator/config.yml'), 'utf8'));
    expect(config.host).toBe('claude');
    expect(config.host_model_map.host).toBe('claude');

    const registry = await fs.readFile(path.join(root, '.investigator/registry.yml'), 'utf8');
    expect(registry).toContain('.claude/skills/playbook-elastic/SKILL.md');
  });

  it('KEEP on .investigator/ preserves byte-identical state on re-install', async () => {
    const root = await makeScratch('keep');
    await install(root, 'cursor', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    const configPath = path.join(root, '.investigator/config.yml');
    const registryPath = path.join(root, '.investigator/registry.yml');
    const memoryPath = path.join(root, '.investigator/memory/orchestrator.md');

    await fs.appendFile(memoryPath, '\n- 2026-08-13: golden case lesson\n');
    const configBefore = await fs.readFile(configPath);
    const registryBefore = await fs.readFile(registryPath);

    await install(root, 'claude', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: false,
    });

    expect(await fs.readFile(configPath)).toEqual(configBefore);
    expect(await fs.readFile(registryPath)).toEqual(registryBefore);
    expect(await fs.readFile(memoryPath, 'utf8')).toContain('golden case lesson');

    expect(await fs.pathExists(path.join(root, '.claude/skills/investigator/SKILL.md'))).toBe(true);
    expect(await fs.pathExists(path.join(root, '.claude/agents/inv-report.md'))).toBe(true);
  });

  it('detectExisting finds prior install artifacts', async () => {
    const root = await makeScratch('detect');
    await install(root, 'cursor', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    const existing = await detectExisting(root, 'cursor');
    expect(existing.skillsExist).toBe(true);
    expect(existing.agentsExist).toBe(true);
    expect(existing.investigatorExists).toBe(true);
  });

  it('OVERWRITE .investigator/ refreshes host paths on host switch', async () => {
    const root = await makeScratch('switch');
    await install(root, 'cursor', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    await install(root, 'claude', {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: true,
    });

    const config = yaml.parse(await fs.readFile(path.join(root, '.investigator/config.yml'), 'utf8'));
    expect(config.host).toBe('claude');
    expect(config.host_model_map.host).toBe('claude');

    const registry = await fs.readFile(path.join(root, '.investigator/registry.yml'), 'utf8');
    expect(registry).toContain('.claude/skills/playbook-redis/SKILL.md');
    expect(registry).not.toContain('.cursor/skills/');
  });
});
