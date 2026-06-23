#!/usr/bin/env node
/**
 * Migra recordatorios desde backup JSON del módulo recordatorios
 * hacia cerebro-store.json (MeetingTodo con dueAt).
 *
 * Uso:
 *   node modules/cerebro-profesional/scripts/migrate-recordatorios-backup.mjs [path-to-backup.json]
 *
 * Si no se pasa path, busca el backup más reciente en modules/recordatorios/.local/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = path.resolve(__dirname, '..');
const recordatoriosLocal = path.resolve(moduleRoot, '../../recordatorios/.local');
const storeFile = path.join(moduleRoot, '.local/cerebro-store.json');

function findLatestBackup() {
  if (!fs.existsSync(recordatoriosLocal)) return null;
  const files = fs
    .readdirSync(recordatoriosLocal)
    .filter((f) => f.endsWith('.json') && f.includes('backup'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(recordatoriosLocal, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0] ? path.join(recordatoriosLocal, files[0].f) : null;
}

const backupPath = process.argv[2] ? path.resolve(process.argv[2]) : findLatestBackup();
if (!backupPath || !fs.existsSync(backupPath)) {
  console.error('No se encontró backup de recordatorios. Pasá la ruta como argumento.');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const reminders = backup.reminders ?? [];
if (!reminders.length) {
  console.log('Backup sin recordatorios.');
  process.exit(0);
}

let store = {
  version: 3,
  savedAt: new Date().toISOString(),
  meetings: [],
  people: [],
  prospects: [],
  teams: [],
  projects: [],
  todos: [],
};

if (fs.existsSync(storeFile)) {
  store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  store.todos = store.todos ?? [];
}

const existingIds = new Set(store.todos.map((t) => t.id));
let added = 0;

for (const r of reminders) {
  const id = `migrated-${r.id}`;
  if (existingIds.has(id)) continue;
  const status =
    r.status === 'done' ? 'done' : r.status === 'archived' ? 'dismissed' : 'open';
  store.todos.push({
    id,
    text: r.title,
    meetingId: 'manual',
    status,
    source: 'cursor-chat',
    dueAt: r.dueAt,
    tags: r.tags ?? [],
    notes: r.notes,
    categoryId: r.categoryId ?? 'personal',
    personIds: [],
    teamIds: [],
    projectIds: [],
    extractedAt: r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
    completedAt: r.completedAt,
  });
  existingIds.add(id);
  added++;
}

store.savedAt = new Date().toISOString();
fs.mkdirSync(path.dirname(storeFile), { recursive: true });
fs.writeFileSync(storeFile, JSON.stringify(store, null, 2), 'utf8');
console.log(JSON.stringify({ added, total: store.todos.length, storeFile }));
