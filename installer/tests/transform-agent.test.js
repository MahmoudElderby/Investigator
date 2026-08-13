import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { transformAgent } from '../lib/transform-agent.js';
import { AGENT_NAMES, getCoreAgentsDir } from '../lib/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('transformAgent', () => {
  it('transforms inv-log-rca canonical to cursor snapshot', async () => {
    const canonical = await fs.readFile(
      path.join(fixturesDir, 'inv-log-rca.canonical.md'),
      'utf8',
    );
    const out = transformAgent(canonical, 'cursor');
    expect(out).toContain('name: inv-log-rca');
    expect(out).toContain('model: inherit');
    expect(out).not.toContain('model_tier:');
    expect(out).toContain('You are **inv-log-rca**');
    expect(out.indexOf('---', 3)).toBeGreaterThan(0);
  });

  it('transforms inv-log-rca canonical to claude snapshot', async () => {
    const canonical = await fs.readFile(
      path.join(fixturesDir, 'inv-log-rca.canonical.md'),
      'utf8',
    );
    const out = transformAgent(canonical, 'claude');
    expect(out).toContain('name: inv-log-rca');
    expect(out).toContain('model: inherit');
    expect(out).not.toContain('model_tier:');
    expect(out).toContain('You are **inv-log-rca**');
  });

  it('transforms all five canonical agents for both hosts', async () => {
    const agentsDir = getCoreAgentsDir();
    for (const name of AGENT_NAMES) {
      const canonical = await fs.readFile(path.join(agentsDir, `${name}.md`), 'utf8');
      for (const host of ['cursor', 'claude']) {
        const out = transformAgent(canonical, host);
        expect(out).toContain('model: inherit');
        expect(out).not.toContain('model_tier:');
        expect(out).toContain(`name: ${name}`);
      }
    }
  });

  it('preserves explicit tools list', () => {
    const canonical = `---
name: inv-data-rca
description: test agent
model_tier: mid
tools: Read, Grep
---

Body content.
`;
    const out = transformAgent(canonical, 'claude');
    expect(out).toContain('tools: Read, Grep');
    expect(out).toContain('Body content.');
  });

  it('omits tools key when inherit', () => {
    const canonical = `---
name: inv-log-rca
description: test
model_tier: fast
tools: inherit
---

Body.
`;
    const out = transformAgent(canonical, 'cursor');
    expect(out).not.toMatch(/^tools:/m);
  });
});
