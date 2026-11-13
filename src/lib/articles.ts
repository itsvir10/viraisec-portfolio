import type { Field } from '../data/content';

// Every .md file in src/articles becomes an article. Files starting with "_"
// (like _template.md) and files marked `draft: true` are skipped.
const files = import.meta.glob('../articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export type Article = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  field: Field;
  repo?: string;
  body: string;
  minutes: number;
};

const unquote = (v: string) => v.trim().replace(/^(['"])(.*)\1$/, '$2');

function parse(path: string, raw: string): Article | null {
  const name = path.split('/').pop()!.replace(/\.md$/, '');
  if (name.startsWith('_')) return null;

  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  const meta: Record<string, string> = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  if (unquote(meta.draft ?? '') === 'true') return null;

  // HTML comments are notes for the writer and never shown
  const body = (match ? match[2] : raw).replace(/<!--[\s\S]*?-->/g, '').trim();
  const tags = (meta.tags ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean);
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug: name,
    title: unquote(meta.title ?? name),
    date: unquote(meta.date ?? ''),
    summary: unquote(meta.summary ?? ''),
    tags,
    field: unquote(meta.field ?? '') === 'ai' ? 'ai' : 'security',
    repo: meta.repo ? unquote(meta.repo) : undefined,
    body,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

export const articles: Article[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .filter((a): a is Article => a !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);

export function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const fieldLabel = (f: Field) => (f === 'ai' ? 'AI' : 'Security');

/** Turns an article's Markdown into plain lines for the terminal's `read` command. */
export function toTerminalLines(a: Article): { kind: 'h' | 'code' | 'text'; text: string }[] {
  const out: { kind: 'h' | 'code' | 'text'; text: string }[] = [];
  let code = false;
  for (const raw of a.body.split(/\r?\n/)) {
    if (raw.trim().startsWith('```')) {
      code = !code;
      continue;
    }
    if (code) {
      out.push({ kind: 'code', text: raw });
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(raw);
    if (heading) {
      out.push({ kind: 'h', text: heading[1] });
      continue;
    }
    const text = raw
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '[image: $1]')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/(\*\*|__|\*|_|`)/g, '')
      .replace(/^\s*[-*]\s+/, '  - ')
      .replace(/^>\s?/, '  | ');
    out.push({ kind: 'text', text });
  }
  return out;
}
