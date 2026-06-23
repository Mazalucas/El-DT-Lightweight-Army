import { getMirrorContent, listMeetings } from './sync.js';
import { loadStore, saveStore } from './store.js';
import { reindexStoreFromMirrors } from '../core/profesional/reindex-store.js';
import { collectExtractedTodosFromMirrors, syncExtractedTodosInStore, } from '../core/profesional/meeting-todos-store.js';
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
/** Import completo: reindex contactos/proyectos + sync todos desde mirrors en Storage. */
export async function fullImportFromMirrors(uid) {
    const store = await loadStore(uid);
    const manifest = await listMeetings(uid);
    const syncedIds = manifest.filter((m) => m.syncStatus === 'synced').map((m) => m.meetingId);
    const mirrors = await loadSyncedMirrors(uid, syncedIds);
    const reindexStats = reindexStoreFromMirrors(store, mirrors);
    const todoItems = collectExtractedTodosFromMirrors(mirrors, store.meetings);
    const todosSynced = syncExtractedTodosInStore(store, todoItems);
    await saveStore(uid, store);
    return { ...reindexStats, todosSynced };
}
/** Re-export para tests / rutas. */
export { reindexStoreFromMirrors, collectExtractedTodosFromMirrors, syncExtractedTodosInStore };
