import { confirm, select } from '@inquirer/prompts';

/**
 * @typedef {'cursor'|'claude'} HostId
 */

/**
 * @param {HostId|null} flagHost from --cursor / --claude
 * @returns {Promise<HostId>}
 */
export async function resolveHost(flagHost) {
  if (flagHost) {
    return flagHost;
  }

  const choice = await select({
    message: 'Select agent host',
    choices: [
      { name: 'Cursor', value: 'cursor' },
      { name: 'Claude Code', value: 'claude' },
    ],
  });

  return /** @type {HostId} */ (choice);
}

/**
 * @param {{ force?: boolean, skillsExist?: boolean, agentsExist?: boolean, investigatorExists?: boolean }} ctx
 * @returns {Promise<{ overwriteSkills: boolean, overwriteAgents: boolean, overwriteInvestigator: boolean }>}
 */
export async function promptOverwriteGroups(ctx) {
  const { force = false, skillsExist = false, agentsExist = false, investigatorExists = false } = ctx;

  if (force) {
    return {
      overwriteSkills: true,
      overwriteAgents: true,
      overwriteInvestigator: false,
    };
  }

  let overwriteSkills = true;
  let overwriteAgents = true;
  let overwriteInvestigator = false;

  if (skillsExist) {
    overwriteSkills = await confirm({
      message: 'Replace Investigator kit skills? (playbooks + orchestrator skills)',
      default: true,
    });
  }

  if (agentsExist) {
    overwriteAgents = await confirm({
      message: 'Replace Investigator subagent definitions?',
      default: true,
    });
  }

  if (investigatorExists) {
    overwriteInvestigator = await confirm({
      message:
        'Replace .investigator/ scaffold (WARNING: may delete memories and case library)?',
      default: false,
    });
  }

  return { overwriteSkills, overwriteAgents, overwriteInvestigator };
}

export const COMPLETION_MESSAGE =
  "Installed. Open your agent and run the 'investigator-init' skill to adapt it to this project.";
