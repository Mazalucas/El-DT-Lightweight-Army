#!/usr/bin/env node
/**
 * Descarta todas las sugerencias (status suggested → dismissed) en cerebro-store.json.
 * No modifica open, done ni dismissed existentes.
 *
 * Uso: node scripts/dismiss-all-suggestions.mjs
 * Con servidor dev: curl -X POST http://localhost:5182/api/todos/dismiss-all-suggestions
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storeFile = path.join(moduleRoot, '.local/cerebro-store.json');

if (!fs.existsSync(storeFile)) {
  console.log('Sin cerebro-store.json — nada que actualizar en disco.');
  process.exit(0);
}

const snapshot = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
const now = new Date().toISOString();
let dismissed = 0;

for (const todo of snapshot.todos ?? []) {
  if (todo.status === 'suggested') {
    todo.status = 'dismissed';
    todo.updatedAt = now;
    dismissed++;
  }
}

if (dismissed === 0) {
  console.log('0 sugerencias en disco (status suggested).');
  process.exit(0);
}

snapshot.savedAt = now;
const tmp = `${storeFile}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(snapshot), 'utf8');
fs.renameSync(tmp, storeFile);
console.log(`Descartadas ${dismissed} sugerencias en cerebro-store.json`);
