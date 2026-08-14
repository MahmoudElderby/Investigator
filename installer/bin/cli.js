#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectExisting, install, refreshHostInInvestigator } from '../lib/install.js';
import { COMPLETION_MESSAGE, promptOverwriteGroups, resolveHost } from '../lib/prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
);

const program = new Command();

program
  .name('investigator-kit')
  .description('Portable AI investigation system installer')
  .version(pkg.version);

program
  .command('init')
  .description('Install Investigator skills, agents, and .investigator/ scaffold')
  .option('--cursor', 'Install for Cursor host')
  .option('--claude', 'Install for Claude Code host')
  .option('--force', 'Accept overwrite defaults (skills Y, agents Y, .investigator/ KEEP)')
  .action(async (opts) => {
    try {
      if (opts.cursor && opts.claude) {
        console.error('Cannot use --cursor and --claude together');
        process.exit(1);
      }

      const flagHost = opts.cursor ? 'cursor' : opts.claude ? 'claude' : null;
      const host = await resolveHost(flagHost);
      const projectRoot = process.cwd();

      const existing = await detectExisting(projectRoot, host);
      const anyExisting =
        existing.skillsExist || existing.agentsExist || existing.investigatorExists;

      const overwrite = anyExisting
        ? await promptOverwriteGroups({ force: opts.force, ...existing })
        : {
            overwriteSkills: true,
            overwriteAgents: true,
            overwriteInvestigator: true,
          };

      if (!anyExisting) {
        overwrite.overwriteInvestigator = true;
      }

      await install(projectRoot, host, overwrite);

      if (overwrite.overwriteInvestigator && existing.investigatorExists) {
        await refreshHostInInvestigator(projectRoot, host);
      }

      console.log(COMPLETION_MESSAGE);
      process.exit(0);
    } catch (err) {
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        console.error(`Write permission denied: ${err.path || err.message}`);
        console.error('Check directory permissions and retry.');
        process.exit(1);
      }
      console.error(err.message || err);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.help();
}
