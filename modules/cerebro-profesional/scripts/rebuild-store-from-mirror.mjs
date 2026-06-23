#!/usr/bin/env node
/**
 * Regenera .local/cerebro-store.json desde mirror/*.md (sin abrir el navegador).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const mirrorDir = path.join(moduleRoot, '.local/mirror');
const outFile = path.join(moduleRoot, '.local/cerebro-store.json');

const DEFAULT_TEAMS = [
  { id: 'innovacion', name: 'Innovación', color: '#3b82f6' },
  { id: 'milo', name: 'Milø', color: '#8b5cf6' },
];

function parseMirror(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw, participants: [] };
  const fm = parseYaml(m[1]);
  const participants = Array.isArray(fm.participants) ? fm.participants : [];
  return { fm, body: m[2], participants, summary: fm.summary };
}

function parseYaml(block) {
  const out = {};
  let listKey = null;
  const list = [];
  const flush = () => {
    if (listKey) {
      out[listKey] = [...list];
      list.length = 0;
      listKey = null;
    }
  };
  for (const line of block.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('- ') && listKey) {
      list.push(t.slice(2).replace(/^"|"$/g, ''));
      continue;
    }
    flush();
    const i = t.indexOf(':');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!v) {
      listKey = k;
      continue;
    }
    out[k] = v.replace(/^"|"$/g, '');
  }
  flush();
  return out;
}

function participantsFromSourceFile(sourceFile) {
  const base = sourceFile
    .replace(/\.gdoc$/i, '')
    .replace(/\s*-\s*Notas de Gemini\s*$/i, '');
  const patterns = [
    /\|\s*([^|]+)<>\s*([^|():]+)/,
    /([^|():]+)\s*<>\s*([^|():]+)/,
    /1\s*[- ]?1\s+([^|():]+)\s*\/\s*([^|():]+)/i,
    /1\s*[- ]?1\s+con\s+([^|():]+)/i,
  ];
  for (const re of patterns) {
    const m = base.match(re);
    if (m) {
      const out = [];
      if (m[1]) out.push(m[1].replace(/\s*\(.*\)\s*$/, '').trim());
      if (m[2]) out.push(m[2].replace(/\s*\(.*\)\s*$/, '').trim());
      return [...new Set(out.filter(Boolean))];
    }
  }
  return [];
}

function slugId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const hints = ['Milø', 'Milo', 'BrandBoost', 'Utoppia', 'Innovación', 'Royal Enfield', 'Nexo', 'Productividad'];
const peopleMap = new Map();
const projectsMap = new Map();
const meetings = [];

for (const f of fs.readdirSync(mirrorDir).filter((x) => x.endsWith('.md'))) {
  const raw = fs.readFileSync(path.join(mirrorDir, f), 'utf8');
  const { fm, body, participants: yamlP, summary } = parseMirror(raw);
  const id = String(fm.meetingId ?? f.replace(/\.md$/, ''));
  const title = String(fm.title ?? id);
  const sourceFile = String(fm.sourceFile ?? '');
  const participants = [...new Set([...yamlP, ...participantsFromSourceFile(sourceFile)])];
  const personIds = [];
  for (const name of participants) {
    const pid = slugId(name);
    personIds.push(pid);
    if (!peopleMap.has(pid)) peopleMap.set(pid, { id: pid, displayName: name, aliases: [], teamIds: [] });
  }
  const projectIds = [];
  for (const hint of hints) {
    if (title.toLowerCase().includes(hint.toLowerCase().replace('ø', 'o'))) {
      const pid = slugId(hint);
      projectIds.push(pid);
      if (!projectsMap.has(pid)) projectsMap.set(pid, { id: pid, name: hint, tags: [] });
    }
  }
  const teamIds = [
    ...new Set([
      ...(fm.teamId ? [String(fm.teamId)] : []),
      ...DEFAULT_TEAMS.filter((t) => title.toLowerCase().includes(t.name.toLowerCase())).map(
        (t) => t.id,
      ),
    ]),
  ];
  meetings.push({
    id,
    docId: fm.docId,
    sourceFile: fm.sourceFile ?? '',
    title,
    startedAt: fm.startedAt,
    timezone: fm.timezone,
    summary,
    participants,
    personIds,
    teamIds,
    projectIds,
    syncStatus: 'synced',
    analysisStatus: 'pending',
    bodyPreview: body.slice(0, 500),
    updatedAt: new Date().toISOString(),
  });
}

const snapshot = {
  version: 1,
  savedAt: new Date().toISOString(),
  meetings,
  people: [...peopleMap.values()],
  teams: DEFAULT_TEAMS,
  projects: [...projectsMap.values()],
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(snapshot), 'utf8');
console.log(
  JSON.stringify({
    meetings: meetings.length,
    people: peopleMap.size,
    path: outFile,
  }),
);
