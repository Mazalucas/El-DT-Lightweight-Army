import fs from 'node:fs';
import path from 'node:path';
import { extractActionItemsFromBody } from '../core/extract-action-items';

function parseFrontmatter(raw: string): Record<string, string> {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const t = line.trim();
    const i = t.indexOf(':');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^"|"$/g, '');
    if (v) out[k] = v;
  }
  return out;
}

export interface ScannedTodo {
  meetingId: string;
  text: string;
  meetingTitle?: string;
  startedAt?: string;
  sourceSection?: 'proximos_pasos' | 'sugerencias' | 'analysis';
}

export interface DashboardScanResult {
  mirrorCount: number;
  lastMirrorSync: string | null;
  todos: ScannedTodo[];
}

let cache: { mtime: number; result: DashboardScanResult } | null = null;

export function scanDashboardData(moduleRoot: string): DashboardScanResult {
  const mirror = path.join(moduleRoot, '.local/mirror');
  if (!fs.existsSync(mirror)) {
    return { mirrorCount: 0, lastMirrorSync: null, todos: [] };
  }

  const files = fs.readdirSync(mirror).filter((f) => f.endsWith('.md'));
  let dirMtime = 0;
  for (const f of files) {
    const st = fs.statSync(path.join(mirror, f));
    if (st.mtimeMs > dirMtime) dirMtime = st.mtimeMs;
  }
  if (cache && cache.mtime === dirMtime) return cache.result;

  let lastMirrorSync: string | null = null;
  const todos: ScannedTodo[] = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(mirror, f), 'utf8');
    const fm = parseFrontmatter(raw);
    const meetingId = fm.meetingId ?? f.replace(/\.md$/, '');
    const syncedAt = fm.syncedAt;
    if (syncedAt && (!lastMirrorSync || syncedAt > lastMirrorSync)) {
      lastMirrorSync = syncedAt;
    }
    const body = raw.replace(/^---[\s\S]*?---\r?\n?/, '');
    for (const item of extractActionItemsFromBody(body)) {
      todos.push({
        meetingId,
        text: item.text,
        meetingTitle: fm.title,
        startedAt: fm.startedAt,
        sourceSection: item.sourceSection,
      });
    }
  }

  todos.sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));

  const result: DashboardScanResult = {
    mirrorCount: files.length,
    lastMirrorSync,
    todos,
  };
  cache = { mtime: dirMtime, result };
  return result;
}

export function readStoreSavedAt(moduleRoot: string): string | null {
  const file = path.join(moduleRoot, '.local/cerebro-store.json');
  if (!fs.existsSync(file)) return null;
  try {
    return (JSON.parse(fs.readFileSync(file, 'utf8')) as { savedAt?: string }).savedAt ?? null;
  } catch {
    return null;
  }
}
