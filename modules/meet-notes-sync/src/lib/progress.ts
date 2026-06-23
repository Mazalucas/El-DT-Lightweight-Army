import fs from 'node:fs';
import path from 'node:path';
import { cerebroLocalDir } from './paths.js';

export interface SyncProgress {
  phase: 'idle' | 'scan' | 'sync';
  current: number;
  total: number;
  currentTitle?: string;
  done: boolean;
  startedAt?: string;
  finishedAt?: string;
  result?: {
    scanned: number;
    synced: number;
    skipped: number;
    errors: number;
    messages: string[];
  };
  error?: string;
}

export function progressFilePath(repoRoot: string): string {
  return path.join(cerebroLocalDir(repoRoot), 'sync-progress.json');
}

export function writeSyncProgress(repoRoot: string, patch: Partial<SyncProgress>): void {
  const file = progressFilePath(repoRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let prev: SyncProgress = {
    phase: 'idle',
    current: 0,
    total: 0,
    done: true,
  };
  if (fs.existsSync(file)) {
    try {
      prev = { ...prev, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {
      /* fresh */
    }
  }
  const next: SyncProgress = { ...prev, ...patch };
  fs.writeFileSync(file, JSON.stringify(next, null, 0), 'utf8');
}

export function readSyncProgress(repoRoot: string): SyncProgress {
  const file = progressFilePath(repoRoot);
  if (!fs.existsSync(file)) {
    return { phase: 'idle', current: 0, total: 0, done: true };
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as SyncProgress;
  } catch {
    return { phase: 'idle', current: 0, total: 0, done: true };
  }
}

/** Línea para terminal / logs: fácil de parsear */
export function formatProgressLine(current: number, total: number, title?: string): string {
  const label = title ? ` — ${title.slice(0, 60)}` : '';
  return `[sync] ${current}/${total}${label}`;
}
