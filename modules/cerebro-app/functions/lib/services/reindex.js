import { getMirrorContent, listMeetings } from './sync.js';
import { loadStore, saveStore } from './store.js';
import { loadSettings } from '../lib/settings.js';
import { reindexStoreFromMirrors } from '../core/profesional/reindex-store.js';
import { collectExtractedTodosFromMirrors, syncExtractedTodosInStore, } from '../core/profesional/meeting-todos-store.js';
import { isWithinProcessLookback, resolveProcessLookbackDays, } from '../shared/sync-policy.js';
const MIRROR_BATCH = 25;
async function loadSyncedMirrors(uid, meetingIds) {
    const mirrors = [];
    for (let i = 0; i < meetingIds.length; i += MIRROR_BATCH) {
        const batch = meetingIds.slice(i, i + MIRROR_BATCH);
        const contents = await Promise.all(batch.map(async (id) => {
            const content = await getMirrorContent(uid, id);
            return content ? { id, content } : null;
        }));
        for (const m of contents) {
            if (m)
                mirrors.push(m);
        }
    }
    return mirrors;
}
/** Import completo o incremental: reindex contactos/proyectos + sync todos desde mirrors en Storage. */
export async function fullImportFromMirrors(uid, opts) {
    const [store, settings, manifest] = await Promise.all([
        loadStore(uid),
        loadSettings(uid),
        listMeetings(uid),
    ]);
    const lookbackDays = resolveProcessLookbackDays(settings.syncPolicy);
    const manifestById = new Map(manifest.map((m) => [m.meetingId, m]));
    let syncedIds = opts?.meetingIds?.length && opts.meetingIds.length > 0
        ? opts.meetingIds
        : manifest.filter((m) => m.syncStatus === 'synced').map((m) => m.meetingId);
    if (lookbackDays > 0) {
        syncedIds = syncedIds.filter((id) => {
            const entry = manifestById.get(id);
            return entry ? isWithinProcessLookback(entry, lookbackDays) : true;
        });
    }
    if (!syncedIds.length) {
        return { meetings: 0, people: 0, prospects: 0, consolidated: 0, pruned: 0, mirrorDuplicates: 0, linksRepaired: 0, todosSynced: 0 };
    }
    const mirrors = await loadSyncedMirrors(uid, syncedIds);
    const reindexStats = reindexStoreFromMirrors(store, mirrors);
    const todoItems = collectExtractedTodosFromMirrors(mirrors, store.meetings);
    const todosSynced = syncExtractedTodosInStore(store, todoItems);
    await saveStore(uid, store);
    return { ...reindexStats, todosSynced };
}
/** Re-export para tests / rutas. */
export { reindexStoreFromMirrors, collectExtractedTodosFromMirrors, syncExtractedTodosInStore };
