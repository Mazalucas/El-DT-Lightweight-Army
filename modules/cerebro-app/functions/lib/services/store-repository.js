import { DEFAULT_SETTINGS } from '../shared/types.js';
import { meetingsCol, peopleCol, projectsCol, prospectsCol, storeMetaRef, storeRef, suggestionsCol, teamsCol, todosCol, } from '../lib/firebase.js';
import { loadSettings } from '../lib/settings.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { hydrateCerebroStore } from './store-persist.js';
import { rebuildGraphEdges } from './graph-edges.js';
import { coerceStringArray } from '../lib/text-coerce.js';
import { compactStoreForPersist } from './store-compact.js';
export const STORE_VERSION_NORMALIZED = 3;
const BATCH_SIZE = 400;
async function emptyStore(uid) {
    const settings = await loadSettings(uid);
    return {
        version: 1,
        savedAt: new Date().toISOString(),
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: settings.teams.length ? settings.teams : DEFAULT_SETTINGS.teams,
        todos: [],
        pendingSuggestions: [],
        graphEdges: [],
    };
}
async function loadNormalizedStore(uid) {
    const metaSnap = await storeMetaRef(uid).get();
    const meta = metaSnap.data();
    const [peopleSnap, prospectsSnap, projectsSnap, teamsSnap, todosSnap, suggestionsSnap, meetingsSnap] = await Promise.all([
        peopleCol(uid).get(),
        prospectsCol(uid).get(),
        projectsCol(uid).get(),
        teamsCol(uid).get(),
        todosCol(uid).get(),
        suggestionsCol(uid).get(),
        meetingsCol(uid).limit(2000).get(),
    ]);
    const meetings = meetingsSnap.docs.map((d) => {
        const data = d.data();
        return {
            id: String(data.meetingId ?? d.id),
            docId: data.docId,
            sourceFile: String(data.sourceFile ?? ''),
            title: String(data.title ?? d.id),
            startedAt: data.startedAt,
            timezone: data.timezone,
            summary: data.summary,
            participants: coerceStringArray(data.participants),
            actionItems: data.actionItems
                ? coerceStringArray(data.actionItems)
                : undefined,
            participantEmails: data.participantEmails,
            personIds: data.personIds ?? [],
            prospectIds: data.prospectIds ?? [],
            teamIds: data.teamIds ?? [],
            projectIds: data.projectIds ?? [],
            syncStatus: data.syncStatus ?? 'synced',
            analysisStatus: data.analysisStatus ?? 'pending',
            updatedAt: String(data.updatedAt ?? new Date().toISOString()),
            driveFolderId: data.driveFolderId,
            teamId: data.teamId,
            contributorUids: data.contributorUids,
        };
    });
    const store = {
        version: meta?.version ?? 1,
        savedAt: meta?.savedAt ?? new Date().toISOString(),
        meetings,
        people: peopleSnap.docs.map((d) => d.data()),
        prospects: prospectsSnap.docs.map((d) => d.data()),
        projects: projectsSnap.docs.map((d) => d.data()),
        teams: teamsSnap.docs.map((d) => d.data()),
        todos: todosSnap.docs.map((d) => d.data()),
        pendingSuggestions: suggestionsSnap.docs.map((d) => d.data()),
        graphEdges: [],
    };
    store.graphEdges = rebuildGraphEdges(store);
    return store;
}
async function saveNormalizedStore(uid, store) {
    const compact = compactStoreForPersist(store);
    const now = new Date().toISOString();
    const db = storeMetaRef(uid).firestore;
    async function replaceCollection(col, items) {
        const existing = await col.select().get();
        for (let i = 0; i < existing.docs.length; i += BATCH_SIZE) {
            const batch = db.batch();
            for (const doc of existing.docs.slice(i, i + BATCH_SIZE))
                batch.delete(doc.ref);
            await batch.commit();
        }
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = db.batch();
            for (const item of items.slice(i, i + BATCH_SIZE)) {
                batch.set(col.doc(item.id), stripUndefined(item.data));
            }
            await batch.commit();
        }
    }
    await replaceCollection(peopleCol(uid), compact.people.map((p) => ({ id: p.id, data: p })));
    await replaceCollection(prospectsCol(uid), compact.prospects.map((p) => ({ id: p.id, data: p })));
    await replaceCollection(projectsCol(uid), compact.projects.map((p) => ({ id: p.id, data: p })));
    await replaceCollection(teamsCol(uid), compact.teams.map((t) => ({ id: t.id, data: t })));
    await replaceCollection(todosCol(uid), compact.todos.map((t) => ({ id: t.id, data: t })));
    await replaceCollection(suggestionsCol(uid), (compact.pendingSuggestions ?? []).map((s) => ({ id: s.id, data: s })));
    for (let i = 0; i < compact.meetings.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const m of compact.meetings.slice(i, i + BATCH_SIZE)) {
            batch.set(meetingsCol(uid).doc(m.id), stripUndefined({
                meetingId: m.id,
                docId: m.docId,
                sourceFile: m.sourceFile,
                title: m.title,
                startedAt: m.startedAt,
                timezone: m.timezone,
                teamId: m.teamId,
                syncStatus: m.syncStatus,
                analysisStatus: m.analysisStatus,
                lastSyncedAt: m.updatedAt,
                participants: m.participants,
                participantEmails: m.participantEmails,
                personIds: m.personIds,
                prospectIds: m.prospectIds,
                teamIds: m.teamIds,
                projectIds: m.projectIds,
                summary: m.summary,
                contributorUids: m.contributorUids,
                updatedAt: m.updatedAt,
            }), { merge: true });
        }
        await batch.commit();
    }
    const meta = {
        storeVersion: STORE_VERSION_NORMALIZED,
        version: compact.version,
        savedAt: now,
        meetingCount: compact.meetings.length,
        peopleCount: compact.people.length,
        prospectsCount: compact.prospects.length,
        projectsCount: compact.projects.length,
        teamsCount: compact.teams.length,
        todosCount: compact.todos.length,
        suggestionsCount: compact.pendingSuggestions?.length ?? 0,
    };
    await storeMetaRef(uid).set(meta);
    await storeRef(uid).set(stripUndefined({
        storeVersion: STORE_VERSION_NORMALIZED,
        migratedAt: now,
        meetings: [],
        meetingCount: compact.meetings.length,
    }), { merge: true });
}
export async function getStoreMeta(uid) {
    const snap = await storeMetaRef(uid).get();
    return snap.exists ? snap.data() : null;
}
export async function isNormalizedStore(uid) {
    const meta = await getStoreMeta(uid);
    if (meta?.storeVersion === STORE_VERSION_NORMALIZED)
        return true;
    const main = await storeRef(uid).get();
    const data = main.data();
    return data?.storeVersion === STORE_VERSION_NORMALIZED;
}
export async function loadStoreFromRepository(uid) {
    if (await isNormalizedStore(uid)) {
        return loadNormalizedStore(uid);
    }
    const snap = await storeRef(uid).get();
    if (!snap.exists)
        return emptyStore(uid);
    const store = await hydrateCerebroStore(snap.data(), { uid });
    if (!store.pendingSuggestions)
        store.pendingSuggestions = [];
    if (!store.graphEdges?.length)
        store.graphEdges = rebuildGraphEdges(store);
    return store;
}
export async function saveStoreToRepository(uid, store) {
    store.savedAt = new Date().toISOString();
    if (!(await isNormalizedStore(uid))) {
        await saveNormalizedStore(uid, store);
        return;
    }
    await saveNormalizedStore(uid, store);
}
export async function migrateStoreToNormalized(uid) {
    const store = await loadStoreFromRepository(uid);
    if (await isNormalizedStore(uid)) {
        const meta = await getStoreMeta(uid);
        if (meta)
            return meta;
    }
    await saveNormalizedStore(uid, store);
    const meta = await getStoreMeta(uid);
    return meta;
}
