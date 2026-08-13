import fs from 'fs-extra';
import path from 'node:path';
import yaml from 'yaml';
import {
  AGENT_NAMES,
  HOST_PATHS,
  INVESTIGATOR_TEMPLATE_FILES,
  getCoreAgentsDir,
  getTemplatesDir,
  investigatorDestPath,
  listSkillSources,
} from './manifest.js';
import { transformAgent } from './transform-agent.js';

/**
 * @param {string} projectRoot
 * @param {'cursor'|'claude'} host
 * @param {{ overwriteSkills: boolean, overwriteAgents: boolean, overwriteInvestigator: boolean }} options
 */
export async function install(projectRoot, host, options) {
  const paths = HOST_PATHS[host];
  if (!paths) {
    throw new Error(`Unknown host: ${host}`);
  }

  const coreRoot = path.resolve(import.meta.dirname, '../..');
  if (!(await fs.pathExists(path.join(coreRoot, 'core')))) {
    throw new Error('Internal error — corrupt install: core/ missing');
  }

  if (options.overwriteSkills) {
    await installSkills(projectRoot, paths);
  }

  if (options.overwriteAgents) {
    await installAgents(projectRoot, paths);
  }

  await scaffoldInvestigator(projectRoot, host, paths, options.overwriteInvestigator);
}

async function installSkills(projectRoot, paths) {
  for (const { name, sourceDir } of listSkillSources()) {
    if (!(await fs.pathExists(sourceDir))) {
      continue;
    }
    const dest = path.join(projectRoot, paths.skillsDir, name);
    await fs.ensureDir(dest);
    await fs.copy(sourceDir, dest, { overwrite: true, filter: (src) => !src.endsWith('.DS_Store') });
  }
}

async function installAgents(projectRoot, paths) {
  const agentsDir = getCoreAgentsDir();
  for (const name of AGENT_NAMES) {
    const src = path.join(agentsDir, `${name}.md`);
    if (!(await fs.pathExists(src))) {
      throw new Error(`Missing canonical agent: ${name}.md`);
    }
    const canonical = await fs.readFile(src, 'utf8');
    const transformed = transformAgent(canonical, paths.host === 'cursor' ? 'cursor' : 'claude');
    const dest = path.join(projectRoot, paths.agentsDir, `${name}.md`);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, transformed, 'utf8');
  }
}

async function scaffoldInvestigator(projectRoot, host, paths, overwrite) {
  const investigatorDir = path.join(projectRoot, '.investigator');
  const exists = await fs.pathExists(investigatorDir);

  if (exists && !overwrite) {
    await additiveScaffold(projectRoot, host, paths);
    return;
  }

  await fs.ensureDir(investigatorDir);
  const templatesDir = getTemplatesDir();

  for (const rel of INVESTIGATOR_TEMPLATE_FILES) {
    const src = path.join(templatesDir, rel);
    const destRel = investigatorDestPath(rel);
    const dest = path.join(investigatorDir, destRel);
    await fs.ensureDir(path.dirname(dest));

    if (rel.endsWith('.yml.tpl') || rel.endsWith('.yaml.tpl')) {
      let content = await fs.readFile(src, 'utf8');
      content = applyHostTransforms(content, host, paths);
      await fs.writeFile(dest, content, 'utf8');
    } else if (rel.endsWith('.tpl')) {
      const content = await fs.readFile(src, 'utf8');
      await fs.writeFile(dest, content, 'utf8');
    } else {
      await fs.copy(src, dest, { overwrite: true });
    }
  }
}

async function additiveScaffold(projectRoot, host, paths) {
  const investigatorDir = path.join(projectRoot, '.investigator');
  const templatesDir = getTemplatesDir();

  for (const rel of INVESTIGATOR_TEMPLATE_FILES) {
    const destRel = investigatorDestPath(rel);
    const dest = path.join(investigatorDir, destRel);
    if (await fs.pathExists(dest)) {
      continue;
    }
    const src = path.join(templatesDir, rel);
    await fs.ensureDir(path.dirname(dest));

    if (rel.endsWith('.yml.tpl') || rel.endsWith('.yaml.tpl')) {
      let content = await fs.readFile(src, 'utf8');
      content = applyHostTransforms(content, host, paths);
      await fs.writeFile(dest, content, 'utf8');
    } else if (rel.endsWith('.tpl')) {
      const content = await fs.readFile(src, 'utf8');
      await fs.writeFile(dest, content, 'utf8');
    } else {
      await fs.copy(src, dest);
    }
  }
}

/**
 * When group (c) OVERWRITE on host switch, refresh host-specific yaml fields.
 * @param {string} projectRoot
 * @param {'cursor'|'claude'} host
 */
export async function refreshHostInInvestigator(projectRoot, host) {
  const paths = HOST_PATHS[host];
  const configPath = path.join(projectRoot, '.investigator', 'config.yml');
  const registryPath = path.join(projectRoot, '.investigator', 'registry.yml');

  if (await fs.pathExists(configPath)) {
    const doc = yaml.parse(await fs.readFile(configPath, 'utf8'));
    doc.host = host;
    doc.host_model_map = doc.host_model_map || {};
    doc.host_model_map.host = host;
    await fs.writeFile(configPath, yaml.stringify(doc), 'utf8');
  }

  if (await fs.pathExists(registryPath)) {
    let content = await fs.readFile(registryPath, 'utf8');
    content = rewriteRegistrySkillPaths(content, paths.skillsPrefix);
    await fs.writeFile(registryPath, content, 'utf8');
  }
}

function applyHostTransforms(content, host, paths) {
  let out = content.replace(/\{\{HOST_SKILLS\}\}/g, paths.skillsPrefix.replace(/\/$/, ''));
  out = out.replace(/^host:\s*(cursor|claude)\s*$/m, `host: ${host}`);
  out = out.replace(
    /(host_model_map:\s*\r?\n\s+host:\s*)(cursor|claude)/m,
    `$1${host}`,
  );
  return out;
}

function rewriteRegistrySkillPaths(content, newPrefix) {
  return content.replace(
    /skill_path:\s*["']?(\.cursor\/skills\/|\.claude\/skills\/|{{HOST_SKILLS}}\/?)([^"'\n]+)["']?/g,
    `skill_path: ${newPrefix}$2`,
  );
}

export async function detectExisting(projectRoot, host) {
  const paths = HOST_PATHS[host];
  let skillsExist = false;
  for (const { name } of listSkillSources()) {
    if (await fs.pathExists(path.join(projectRoot, paths.skillsDir, name, 'SKILL.md'))) {
      skillsExist = true;
      break;
    }
  }

  let agentsExist = false;
  for (const name of AGENT_NAMES) {
    if (await fs.pathExists(path.join(projectRoot, paths.agentsDir, `${name}.md`))) {
      agentsExist = true;
      break;
    }
  }

  const investigatorExists = await fs.pathExists(path.join(projectRoot, '.investigator'));

  return { skillsExist, agentsExist, investigatorExists };
}

export { HOST_PATHS, rewriteRegistrySkillPaths, applyHostTransforms };
