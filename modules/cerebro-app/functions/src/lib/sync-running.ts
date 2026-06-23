import type { SyncProgress } from '../shared/types.js';
import { getSyncProgress } from '../services/sync.js';

/** Hosting/Functions can leave progress stuck if a run dies mid-flight. */
export const SYNC_STALE_MS = 20 * 60 * 1000;
export const REPAIR_STALE_MS = 90 * 60 * 1000;

function staleLimitMs(progress: SyncProgress): number {
  return progress.phase === 'repair' ? REPAIR_STALE_MS : SYNC_STALE_MS;
}

export function isStaleSync(progress: SyncProgress | null | undefined): boolean {
  if (!progress || progress.done !== false || progress.phase === 'idle') return false;
  if (!progress.startedAt) return true;
  return Date.now() - new Date(progress.startedAt).getTime() > staleLimitMs(progress);
}

export function isSyncRunning(progress: SyncProgress | null | undefined): boolean {
  if (progress == null || progress.done !== false || progress.phase === 'idle') return false;
  if (isStaleSync(progress)) return false;
  return true;
}

export type SyncStartMode = 'start' | 'join' | 'takeover';

export async function resolveSyncStartMode(uid: string): Promise<{ mode: SyncStartMode; progress: SyncProgress | null }> {
  const progress = await getSyncProgress(uid);
  if (!isSyncRunning(progress)) {
    if (isStaleSync(progress)) return { mode: 'takeover', progress };
    return { mode: 'start', progress };
  }
  return { mode: 'join', progress };
}
