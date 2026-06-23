import { getSyncProgress } from '../services/sync.js';
/** Hosting/Functions can leave progress stuck if a run dies mid-flight. */
export const SYNC_STALE_MS = 20 * 60 * 1000;
export const REPAIR_STALE_MS = 90 * 60 * 1000;
function staleLimitMs(progress) {
    return progress.phase === 'repair' ? REPAIR_STALE_MS : SYNC_STALE_MS;
}
export function isStaleSync(progress) {
    if (!progress || progress.done !== false || progress.phase === 'idle')
        return false;
    if (!progress.startedAt)
        return true;
    return Date.now() - new Date(progress.startedAt).getTime() > staleLimitMs(progress);
}
export function isSyncRunning(progress) {
    if (progress == null || progress.done !== false || progress.phase === 'idle')
        return false;
    if (isStaleSync(progress))
        return false;
    return true;
}
export async function resolveSyncStartMode(uid) {
    const progress = await getSyncProgress(uid);
    if (!isSyncRunning(progress)) {
        if (isStaleSync(progress))
            return { mode: 'takeover', progress };
        return { mode: 'start', progress };
    }
    return { mode: 'join', progress };
}
