import matter from 'gray-matter';
import yaml from 'yaml';

/**
 * Transform canonical agent markdown to host dialect.
 * @param {string} canonicalMarkdown
 * @param {'cursor'|'claude'} host
 * @returns {string}
 */
export function transformAgent(canonicalMarkdown, host) {
  if (host !== 'cursor' && host !== 'claude') {
    throw new Error(`Unsupported host: ${host}`);
  }

  const { data, content } = matter(canonicalMarkdown);

  if (!data.name || !data.description || !data.model_tier) {
    throw new Error('Canonical agent missing required frontmatter: name, description, model_tier');
  }

  const out = {
    name: data.name,
    description: data.description,
    model: 'inherit',
  };

  if (data.tools && data.tools !== 'inherit') {
    out.tools = normalizeTools(data.tools, host);
  }

  const frontmatter = yaml.stringify(out).trim();
  return `---\n${frontmatter}\n---${content}`;
}

/**
 * @param {string|string[]} tools
 * @param {'cursor'|'claude'} host
 */
function normalizeTools(tools, host) {
  if (Array.isArray(tools)) {
    return host === 'claude' ? tools.join(', ') : tools;
  }
  return String(tools);
}

export function parseFrontmatter(markdown) {
  return matter(markdown);
}
