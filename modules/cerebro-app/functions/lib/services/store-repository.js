import { DEFAULT_SETTINGS } from '../shared/types.js';
import { meetingsCol, peopleCol, projectsCol, prospectsCol, storeMetaRef, storeRef, suggestionsCol, teamsCol, todosCol, } from '../lib/firebase.js';
import { loadSettings } from '../lib/settings.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { enrichMeetings } from '../shared/meeting-dates.js';
import { hydrateCerebroStore } from './store-persist.js';
import { rebuildGraphEdges } from './graph-edges.js';
import { coerceStringArray } from '../lib/text-coerce.js';
import { compactStoreForPersist } from './store-compact.js';
import { mergeDismissedMaintenanceMetaFromRecord, snapshotMaintenanceDismissMeta, } from '../core/profesional/prospect-dismiss.js';
export const STORE_VERSION_NORMALIZED = 3;
const BATCH_SIZE = 400;
/** Reincorpora sugerencias dismissed/accepted que no estén en memoria (evita perderlas en replaceCollection). */
async function ensureHandledSuggestionsInStore(uid, store) {
    const list = store.pendingSuggestions ?? [];
    const inMemory = new Set(list.map((s) => s.id));
    const snap = await suggestionsCol(uid).get();
    for (const doc of snap.docs) {
        if (inMemory.has(doc.id))
            continue;
        const row = doc.data();
        if (row.status === 'dismissed' || row.status === 'accepted') {
            list.push(row);
            inMemory.add(row.id);
        }
    }
    store.pendingSuggestions = list;
}
async function prepareStoreForNormalizedSave(uid, store) {
    const prevMeta = await getStoreMeta(uid);
    mergeDismissedMaintenanceMetaFromRecord(store, prevMeta);
    await ensureHandledSuggestionsInStore(uid, store);
    return store;
}
function buildStoreMetaFromCompact(compact, prevMeta, now) {
    const dismiss = snapshotMaintenanceDismissMeta(compact);
    const prevDismiss = snapshotMaintenanceDismissMeta({
        version: compact.version,
        savedAt: compact.savedAt,
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        dismissedProspectKeys: prevMeta?.dismissedProspectKeys,
        dismissedProspectIds: prevMeta?.dismissedProspectIds,
        dismissedTeamEmailKeys: prevMeta?.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: prevMeta?.dismissedMergeContactKeys,
    });
    return {
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
        dismissedProspectKeys: [...new Set([...prevDismiss.dismissedProspectKeys, ...dismiss.dismissedProspectKeys])],
        dismissedProspectIds: [...new Set([...prevDismiss.dismissedProspectIds, ...dismiss.dismissedProspectIds])],
        dismissedTeamEmailKeys: [...new Set([...prevDismiss.dismissedTeamEmailKeys, ...dismiss.dismissedTeamEmailKeys])],
        dismissedMergeContactKeys: [
            ...new Set([...prevDismiss.dismissedMergeContactKeys, ...dismiss.dismissedMergeContactKeys]),
        ],
    };
}
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
    const meetings = enrichMeetings(meetingsSnap.docs.map((d) => {
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
            updatedAt: String(data.updatedAt ?? data.lastSyncedAt ?? new Date().toISOString()),
            lastSyncedAt: data.lastSyncedAt,
            driveFolderId: data.driveFolderId,
            teamId: data.teamId,
            contributorUids: data.contributorUids,
        };
    }));
    const store = {
        version: meta?.version ?? 1,
        savedAt: meta?.savedAt ?? new Date().toISOString(),
        meetings,
        people: peopleSnap.docs.map((d) => {
            const data = d.data();
            return { ...data, id: data.id ?? d.id };
        }),
        prospects: prospectsSnap.docs.map((d) => {
            const data = d.data();
            return { ...data, id: data.id ?? d.id };
        }),
        projects: projectsSnap.docs.map((d) => d.data()),
        teams: teamsSnap.docs.map((d) => d.data()),
        todos: todosSnap.docs.map((d) => d.data()),
        pendingSuggestions: suggestionsSnap.docs.map((d) => d.data()),
        graphEdges: [],
        dismissedProspectKeys: meta?.dismissedProspectKeys,
        dismissedProspectIds: meta?.dismissedProspectIds,
        dismissedTeamEmailKeys: meta?.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: meta?.dismissedMergeContactKeys,
    };
    mergeDismissedMaintenanceMetaFromRecord(store, meta);
    if (!meta?.dismissedProspectKeys?.length) {
        const mainSnap = await storeRef(uid).get();
        if (mainSnap.exists) {
            const main = mainSnap.data();
            mergeDismissedMaintenanceMetaFromRecord(store, main);
        }
    }
    store.graphEdges = rebuildGraphEdges(store);
    return store;
}
async function saveNormalizedStore(uid, store) {
    await prepareStoreForNormalizedSave(uid, store);
    const prevMeta = await getStoreMeta(uid);
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
                lastSyncedAt: m.lastSyncedAt ?? m.updatedAt,
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
    const meta = buildStoreMetaFromCompact(compact, prevMeta, now);
    await storeMetaRef(uid).set(stripUndefined(meta), { merge: true });
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
/** Persistencia parcial: evita reescribir miles de prospects en cada descarte. */
export async function persistProspectDismiss(uid, store, prospectIds, affectedMeetingIds) {
    const ids = Array.isArray(prospectIds) ? prospectIds : [prospectIds];
    const now = new Date().toISOString();
    const db = prospectsCol(uid).firestore;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const prospectId of ids.slice(i, i + BATCH_SIZE)) {
            batch.delete(prospectsCol(uid).doc(prospectId));
        }
        await batch.commit();
    }
    for (let i = 0; i < affectedMeetingIds.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const meetingId of affectedMeetingIds.slice(i, i + BATCH_SIZE)) {
            const meeting = store.meetings.find((m) => m.id === meetingId);
            if (!meeting)
                continue;
            batch.set(meetingsCol(uid).doc(meetingId), stripUndefined({
                prospectIds: meeting.prospectIds,
                updatedAt: meeting.updatedAt ?? now,
            }), { merge: true });
        }
        await batch.commit();
    }
    const metaSnap = await storeMetaRef(uid).get();
    const prev = metaSnap.data() ?? {};
    const dismiss = snapshotMaintenanceDismissMeta(store);
    const prevDismiss = snapshotMaintenanceDismissMeta({
        version: store.version,
        savedAt: store.savedAt,
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        dismissedProspectKeys: prev.dismissedProspectKeys,
        dismissedProspectIds: prev.dismissedProspectIds,
        dismissedTeamEmailKeys: prev.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: prev.dismissedMergeContactKeys,
    });
    await storeMetaRef(uid).set(stripUndefined({
        ...prev,
        savedAt: now,
        prospectsCount: store.prospects.length,
        dismissedProspectKeys: [...new Set([...prevDismiss.dismissedProspectKeys, ...dismiss.dismissedProspectKeys])],
        dismissedProspectIds: [...new Set([...prevDismiss.dismissedProspectIds, ...dismiss.dismissedProspectIds])],
        dismissedMergeContactKeys: [
            ...new Set([...prevDismiss.dismissedMergeContactKeys, ...dismiss.dismissedMergeContactKeys]),
        ],
    }), { merge: true });
}
export async function persistProspectRestore(uid, store, snapshot) {
    const now = new Date().toISOString();
    const db = prospectsCol(uid).firestore;
    if (snapshot.prospect) {
        await prospectsCol(uid).doc(snapshot.prospectId).set(stripUndefined(snapshot.prospect), { merge: true });
    }
    for (let i = 0; i < snapshot.meetingIds.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const meetingId of snapshot.meetingIds.slice(i, i + BATCH_SIZE)) {
            const meeting = store.meetings.find((m) => m.id === meetingId);
            if (!meeting)
                continue;
            batch.set(meetingsCol(uid).doc(meetingId), stripUndefined({
                prospectIds: meeting.prospectIds,
                updatedAt: meeting.updatedAt ?? now,
            }), { merge: true });
        }
        await batch.commit();
    }
    const metaSnap = await storeMetaRef(uid).get();
    const prev = metaSnap.data() ?? {};
    const dismiss = snapshotMaintenanceDismissMeta(store);
    await storeMetaRef(uid).set(stripUndefined({
        ...prev,
        savedAt: now,
        prospectsCount: store.prospects.length,
        dismissedProspectKeys: dismiss.dismissedProspectKeys,
        dismissedProspectIds: dismiss.dismissedProspectIds,
    }), { merge: true });
}
export async function persistMaintenanceDismissMeta(uid, store) {
    const now = new Date().toISOString();
    const metaSnap = await storeMetaRef(uid).get();
    const prev = metaSnap.data() ?? {};
    const dismiss = snapshotMaintenanceDismissMeta(store);
    const prevDismiss = snapshotMaintenanceDismissMeta({
        version: store.version,
        savedAt: store.savedAt,
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        dismissedProspectKeys: prev.dismissedProspectKeys,
        dismissedProspectIds: prev.dismissedProspectIds,
        dismissedTeamEmailKeys: prev.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: prev.dismissedMergeContactKeys,
    });
    await storeMetaRef(uid).set(stripUndefined({
        ...prev,
        savedAt: now,
        dismissedProspectKeys: [...new Set([...prevDismiss.dismissedProspectKeys, ...dismiss.dismissedProspectKeys])],
        dismissedProspectIds: [...new Set([...prevDismiss.dismissedProspectIds, ...dismiss.dismissedProspectIds])],
        dismissedTeamEmailKeys: [...new Set([...prevDismiss.dismissedTeamEmailKeys, ...dismiss.dismissedTeamEmailKeys])],
        dismissedMergeContactKeys: [
            ...new Set([...prevDismiss.dismissedMergeContactKeys, ...dismiss.dismissedMergeContactKeys]),
        ],
    }), { merge: true });
}
export async function persistTeamEmailReassignDismiss(uid, store) {
    const now = new Date().toISOString();
    const metaSnap = await storeMetaRef(uid).get();
    const prev = metaSnap.data() ?? {};
    await storeMetaRef(uid).set(stripUndefined({
        ...prev,
        savedAt: now,
        dismissedTeamEmailKeys: store.dismissedTeamEmailKeys,
    }), { merge: true });
}
export async function persistTodoPatch(uid, todoId, todo) {
    await todosCol(uid).doc(todoId).set(stripUndefined(todo), { merge: true });
}
export async function persistTodoCreate(uid, todo) {
    await persistTodoPatch(uid, todo.id, todo);
}
export async function persistTodosBatch(uid, todos) {
    if (!todos.length)
        return;
    const db = todosCol(uid).firestore;
    for (let i = 0; i < todos.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const todo of todos.slice(i, i + BATCH_SIZE)) {
            batch.set(todosCol(uid).doc(todo.id), stripUndefined(todo), { merge: true });
        }
        await batch.commit();
    }
}
export async function touchStoreMetaTodos(uid, store) {
    const metaSnap = await storeMetaRef(uid).get();
    const prev = metaSnap.data() ?? {};
    await storeMetaRef(uid).set(stripUndefined({
        ...prev,
        savedAt: store.savedAt,
        todosCount: store.todos.length,
    }), { merge: true });
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
