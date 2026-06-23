#!/usr/bin/env node
/**
 * Procesa todas las notas mirror → analysis-inbox.jsonl y actualiza cerebro-store.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const mirrorDir = path.join(moduleRoot, '.local/mirror');
const inboxPath = path.join(moduleRoot, '.local/analysis-inbox.jsonl');
const storePath = path.join(moduleRoot, '.local/cerebro-store.json');

const PROJECT_HINTS = [
  { needles: ['milø', 'milo'], label: 'Milø' },
  { needles: ['brandboost'], label: 'BrandBoost' },
  { needles: ['utoppia'], label: 'Utoppia' },
  { needles: ['innovación', 'innovacion'], label: 'Innovación' },
  { needles: ['royal enfield'], label: 'Royal Enfield' },
  { needles: ['nexo'], label: 'Nexo' },
  { needles: ['productividad'], label: 'Productividad' },
  { needles: ['disney'], label: 'Disney' },
  { needles: ['banco macro', 'macro'], label: 'Banco Macro' },
  { needles: ['mazalán', 'mazalan'], label: 'Mazalán' },
  { needles: ['oscarcito'], label: 'Oscarcito' },
  { needles: ['cowork'], label: 'Cowork' },
  { needles: ['patrocinio'], label: 'Patrocinio' },
];

const DEFAULT_TEAMS = [
  { id: 'innovacion', name: 'Innovación', color: '#3b82f6' },
  { id: 'milo', name: 'Milø', color: '#8b5cf6' },
];

function slugId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'unknown';
}

function parseMirror(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: raw };
  return { fm: parseYaml(m[1]), body: m[2] };
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
      if (m[1]) out.push(cleanName(m[1]));
      if (m[2]) out.push(cleanName(m[2]));
      return [...new Set(out.filter(Boolean))];
    }
  }
  return [];
}

function cleanName(s) {
  return s.replace(/\s*\(.*\)\s*$/, '').replace(/\s+/g, ' ').trim();
}

function extractSection(body, name) {
  const re = new RegExp(`##\\s*${name}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
  const m = body.match(re);
  return m ? m[0].replace(/^##[^\n]*\n+/, '').trim() : '';
}

function extractTranscriptSpeakers(text) {
  const blocklist = new Set([
    'próximos pasos', 'proximos pasos', 'detalles', 'sugerencias', 'resumen',
    'transcripción', 'transcripcion', 'notas', 'participantes', 'asistentes',
    'invitados', 'temas tratados', 'action items', 'summary', 'details',
    'suggestions', 'transcript',
  ]);
  const names = new Set();
  const re = /^([A-Za-zÁÉÍÓÚÑáéíóúñ][^\n:]{0,70}?):\s+/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = cleanName(m[1]);
    const key = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    if (name.length < 2 || name.length >= 80) continue;
    if (blocklist.has(key)) continue;
    if (/^\d/.test(name)) continue;
    names.add(name);
  }
  return [...names];
}

function collectTrustedParticipants(fm, sourceFile, body) {
  const yamlP = Array.isArray(fm.participants) ? fm.participants : [];
  const fromFile = participantsFromSourceFile(sourceFile);
  const transcript =
    extractSection(body, 'Transcripción') ||
    extractSection(body, 'Transcripcion') ||
    '';
  const speakers = extractTranscriptSpeakers(transcript);
  return [...new Set([...yamlP, ...fromFile, ...speakers].map(cleanName).filter(Boolean))];
}

function inferProjects(title, summary, body) {
  const blob = `${title} ${summary} ${body}`.toLowerCase();
  const found = [];
  for (const { needles, label } of PROJECT_HINTS) {
    if (needles.some((n) => blob.includes(n.replace('ø', 'o')))) found.push(label);
  }
  return [...new Set(found)];
}

function inferTeams(title, projects) {
  const t = title.toLowerCase();
  const ids = [];
  if (t.includes('innovación') || t.includes('innovacion') || projects.includes('Innovación'))
    ids.push('innovacion');
  if (t.includes('milø') || t.includes('milo') || projects.includes('Milø')) ids.push('milo');
  return [...new Set(ids)];
}

function extractThemes(summary, details) {
  const themes = [];
  const topicRe = /^([A-ZÁÉÍÓÚÑ][^\n]{8,80}?)(?:\s+Lucas|\s+José|\s+María|\s+Carlos|\s+Agus|\s+Se\s|\s+La\s|\s+El\s)/gm;
  let m;
  while ((m = topicRe.exec(details)) !== null) {
    const t = m[1].trim().replace(/\s+/g, ' ');
    if (t.length > 12 && t.length < 90) themes.push(t);
  }
  if (summary) {
    const chunks = summary
      .replace(/\uE007/g, '')
      .split(/\s{2,}|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 200);
    for (const c of chunks.slice(0, 4)) themes.push(c.slice(0, 120));
  }
  return [...new Set(themes)].slice(0, 8);
}

function extractActionItems(body) {
  const section =
    extractSection(body, 'Próximos pasos') ||
    extractSection(body, 'Proximos pasos') ||
    extractSection(body, 'Sugerencias') ||
    '';
  if (!section) return [];
  return section
    .replace(/\uE007/g, '')
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter((l) => l.length > 8 && l.length < 400)
    .slice(0, 15);
}

function extractObjectives(summary, themes) {
  const objs = [];
  if (summary) {
    const verbs = summary.match(/(?:busca|planea|decidió|acordaron|objetivo|meta)[^.]{10,120}/gi);
    if (verbs) objs.push(...verbs.slice(0, 3).map((s) => s.trim().slice(0, 150)));
  }
  return [...new Set([...objs, ...themes.slice(0, 2)])].slice(0, 6);
}

function analyzeFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { fm, body } = parseMirror(raw);
  const meetingId = String(fm.meetingId ?? path.basename(filePath, '.md'));
  const title = String(fm.title ?? meetingId);
  const sourceFile = String(fm.sourceFile ?? '');
  const summary = String(fm.summary ?? '').replace(/\uE007/g, ' ').trim();
  const transcript =
    extractSection(body, 'Transcripción') ||
    extractSection(body, 'Transcripcion') ||
    '';
  const details = extractSection(body, 'Detalles') || '';
  const textForNames = `${summary}\n${transcript}\n${details}`.slice(0, 50000);
  const participants = collectTrustedParticipants(fm, sourceFile, body);
  const projects = inferProjects(title, summary, textForNames);
  const teamIds = [
    ...new Set([...(fm.teamId ? [String(fm.teamId)] : []), ...inferTeams(title, projects)]),
  ];
  const themes = extractThemes(summary, details);
  const actionItems = extractActionItems(body);
  const objectives = extractObjectives(summary, themes);

  return {
    analysisVersion: 1,
    id: randomUUID(),
    meetingId,
    people: participants.map((displayName) => ({ displayName })),
    summary: summary || undefined,
    themes,
    objectives,
    actionItems,
    projects,
    confidence: participants.length >= 2 || projects.length ? 'medium' : 'low',
    needsReview: participants.length === 0 && projects.length === 0,
  };
}

function applyRowsToStore(rows, store) {
  const meetingsById = new Map(store.meetings.map((m) => [m.id, m]));
  const projectsMap = new Map(store.projects.map((p) => [p.id, p]));

  let applied = 0;
  for (const row of rows) {
    const meeting = meetingsById.get(row.meetingId);
    if (!meeting) continue;

    const projectIds = [...meeting.projectIds];
    for (const name of row.projects ?? []) {
      const id = slugId(name);
      projectIds.push(id);
      if (!projectsMap.has(id)) {
        projectsMap.set(id, { id, name, tags: row.themes ?? [] });
      }
    }

    const teamIds = [
      ...new Set([
        ...meeting.teamIds,
        ...inferTeams(meeting.title, row.projects ?? []),
      ]),
    ];

    meetingsById.set(row.meetingId, {
      ...meeting,
      summary: row.summary ?? meeting.summary,
      projectIds: [...new Set(projectIds)],
      teamIds,
      analysisStatus: row.needsReview ? 'needs_review' : 'analyzed',
      updatedAt: new Date().toISOString(),
    });
    applied++;
  }

  store.meetings = [...meetingsById.values()];
  store.projects = [...projectsMap.values()];
  store.teams = store.teams?.length ? store.teams : DEFAULT_TEAMS;
  store.savedAt = new Date().toISOString();
  return applied;
}

// --- run ---
const files = fs.readdirSync(mirrorDir).filter((f) => f.endsWith('.md'));
const rows = files.map((f) => analyzeFile(path.join(mirrorDir, f)));

fs.mkdirSync(path.dirname(inboxPath), { recursive: true });
fs.writeFileSync(inboxPath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');

let store = { version: 1, savedAt: new Date().toISOString(), meetings: [], people: [], teams: DEFAULT_TEAMS, projects: [] };
if (fs.existsSync(storePath)) {
  store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

const applied = applyRowsToStore(rows, store);
fs.writeFileSync(storePath, JSON.stringify(store), 'utf8');
// Ya aplicado al store — vaciar inbox para no duplicar en paso 6 de la app
fs.writeFileSync(inboxPath, '', 'utf8');

const stats = {
  processed: rows.length,
  inbox: inboxPath,
  store: storePath,
  applied,
  people: store.people.length,
  projects: store.projects.length,
  analyzed: store.meetings.filter((m) => m.analysisStatus === 'analyzed').length,
  needsReview: store.meetings.filter((m) => m.analysisStatus === 'needs_review').length,
};
console.log(JSON.stringify(stats, null, 2));
