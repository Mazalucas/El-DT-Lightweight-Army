import { isWithinProcessLookback } from '../shared/sync-policy.js';
/** IDs a importar desde mirrors: nuevas + faltantes en store + pending IA en ventana. */
export function resolveImportMeetingIds(manifest, store, newlySyncedIds, lookbackDays) {
    const ids = new Set(newlySyncedIds);
    const storeById = new Map(store.meetings.map((m) => [m.id, m]));
    for (const entry of manifest) {
        if (entry.syncStatus !== 'synced')
            continue;
        if (!isWithinProcessLookback(entry, lookbackDays))
            continue;
        const inStore = storeById.get(entry.meetingId);
        if (!inStore || entry.analysisStatus === 'pending') {
            ids.add(entry.meetingId);
        }
    }
    return [...ids];
}
/** IDs a analizar: recién sincronizadas + synced con analysisStatus pending en ventana. */
export function resolveAnalysisMeetingIds(manifest, newlySyncedIds, lookbackDays) {
    const ids = new Set(newlySyncedIds);
    for (const entry of manifest) {
        if (entry.syncStatus !== 'synced')
            continue;
        if (entry.analysisStatus !== 'pending')
            continue;
        if (!isWithinProcessLookback(entry, lookbackDays))
            continue;
        ids.add(entry.meetingId);
    }
    return [...ids];
}
