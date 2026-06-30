import { cleanChipPersonName, isLikelyPersonName, normalizePersonNameKey, personNameCandidates } from './person-name-clean.js';
/** Claves normalizadas para un nombre (variantes de chip / alias). */
export function collectProspectNameKeys(name) {
    const keys = new Set();
    for (const candidate of personNameCandidates(name)) {
        const k = normalizePersonNameKey(cleanChipPersonName(candidate));
        if (k)
            keys.add(k);
    }
    return [...keys];
}
export function collectDismissedProspectKeys(prospect) {
    const keys = new Set();
    for (const name of [prospect.displayName, ...prospect.aliases]) {
        for (const k of collectProspectNameKeys(name))
            keys.add(k);
    }
    return [...keys];
}
export function isProspectDismissed(store, prospect) {
    if ((store.dismissedProspectIds ?? []).includes(prospect.id))
        return true;
    const dismissedKeys = new Set(store.dismissedProspectKeys ?? []);
    for (const k of collectDismissedProspectKeys({
        displayName: prospect.displayName,
        aliases: prospect.aliases ?? [],
    })) {
        if (dismissedKeys.has(k))
            return true;
    }
    return false;
}
export function isProspectIdDismissed(store, prospectId) {
    if ((store.dismissedProspectIds ?? []).includes(prospectId))
        return true;
    const prospect = store.prospects.find((p) => p.id === prospectId);
    return prospect ? isProspectDismissed(store, prospect) : false;
}
export function mergeDismissedMaintenanceMeta(target, source) {
    target.dismissedProspectKeys = [
        ...new Set([...(target.dismissedProspectKeys ?? []), ...(source.dismissedProspectKeys ?? [])]),
    ];
    target.dismissedProspectIds = [
        ...new Set([...(target.dismissedProspectIds ?? []), ...(source.dismissedProspectIds ?? [])]),
    ];
    target.dismissedTeamEmailKeys = [
        ...new Set([...(target.dismissedTeamEmailKeys ?? []), ...(source.dismissedTeamEmailKeys ?? [])]),
    ];
    target.dismissedMergeContactKeys = [
        ...new Set([...(target.dismissedMergeContactKeys ?? []), ...(source.dismissedMergeContactKeys ?? [])]),
    ];
}
/** Une campos de descarte desde meta Firestore (nunca reducir — solo ampliar). */
export function mergeDismissedMaintenanceMetaFromRecord(target, source) {
    if (!source)
        return;
    mergeDismissedMaintenanceMeta(target, {
        version: target.version,
        savedAt: target.savedAt,
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        dismissedProspectKeys: source.dismissedProspectKeys,
        dismissedProspectIds: source.dismissedProspectIds,
        dismissedTeamEmailKeys: source.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: source.dismissedMergeContactKeys,
    });
}
export function snapshotMaintenanceDismissMeta(store) {
    return {
        dismissedProspectKeys: [...(store.dismissedProspectKeys ?? [])],
        dismissedProspectIds: [...(store.dismissedProspectIds ?? [])],
        dismissedTeamEmailKeys: [...(store.dismissedTeamEmailKeys ?? [])],
        dismissedMergeContactKeys: [...(store.dismissedMergeContactKeys ?? [])],
    };
}
/** Prospects activos para mantenimiento (no vinculados, no descartados, nombre plausible). */
export function listActiveProspectsForMaintenance(store) {
    return store.prospects
        .filter((p) => !p.linkedPersonId && isLikelyPersonName(p.displayName) && !isProspectDismissed(store, p))
        .sort((a, b) => Date.parse(b.lastSeenAt ?? '') - Date.parse(a.lastSeenAt ?? ''));
}
