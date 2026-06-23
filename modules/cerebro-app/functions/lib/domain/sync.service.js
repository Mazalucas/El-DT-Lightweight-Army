import { markSyncStarting, runSync, getSyncProgress } from '../services/sync.js';
import { runFullPipeline } from '../services/pipeline.js';
import { resolveSyncStartMode } from '../lib/sync-running.js';
export async function startSync(uid, limit) {
    const { mode } = await resolveSyncStartMode(uid);
    if (mode === 'join') {
        const progress = await getSyncProgress(uid);
        return { started: false, alreadyRunning: true, startedAt: progress?.startedAt };
    }
    const startedAt = await markSyncStarting(uid, {
        phase: 'sync',
        current: 0,
        total: 0,
        currentTitle: 'Iniciando sync…',
    });
    void runSync(uid, limit, { skipInitialProgress: true }).catch(console.error);
    return { started: true, startedAt };
}
export async function startPipeline(uid, opts) {
    const { mode } = await resolveSyncStartMode(uid);
    if (mode === 'join') {
        const progress = await getSyncProgress(uid);
        return { started: false, alreadyRunning: true, startedAt: progress?.startedAt };
    }
    const startedAt = await markSyncStarting(uid, {
        phase: 'pipeline',
        current: 0,
        total: 4,
        currentTitle: 'Pipeline completo…',
    });
    void runFullPipeline(uid, { ...opts, startedAt, skipInitialProgress: true }).catch(console.error);
    return { started: true, startedAt };
}
export { getSyncProgress };
