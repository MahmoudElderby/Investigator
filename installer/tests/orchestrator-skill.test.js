import fs from 'fs-extra';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getCoreSkillsDir, getTemplatesDir } from '../lib/manifest.js';

describe('orchestrator visible-direction protocol (FR-058, FR-059)', () => {
  it('investigator skill requires self-interrogation and a visible Direction Brief before dispatch', async () => {
    const skill = await fs.readFile(
      path.join(getCoreSkillsDir(), 'investigator', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toContain('Self-interrogation & visible direction');
    expect(skill).toContain('**ANSWERED**');
    expect(skill).toContain('**PARKED**');
    expect(skill).toContain('Direction Brief');
    expect(skill).toContain('Dispatch gate');
    expect(skill).toContain('Never dispatch all specialists by default');
    expect(skill).toContain('Do not dump those questions on the user');
    expect(skill).toMatch(/Hard cap \*\*16 questions\*\*/);
    expect(skill).toContain('Failure vs symptom');
    expect(skill).toContain('Not sending yet');
    expect(skill).toContain('contracts/direction-brief.md');
  });

  it('plan template includes Direction Brief sections', async () => {
    const tpl = await fs.readFile(
      path.join(getTemplatesDir(), 'cases', 'artifacts', 'plan.md.tpl'),
      'utf8',
    );

    expect(tpl).toContain('## Direction Brief');
    expect(tpl).toContain('### Self-interrogation log');
    expect(tpl).toContain('**Sending now**');
    expect(tpl).toContain('**Not sending yet**');
    expect(tpl).toContain('## Follow-up direction');
  });
});
