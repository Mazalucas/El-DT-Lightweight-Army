import { orgRef, userRef } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { compactStoreForPersist, estimateFirestoreJsonBytes } from './store-compact.js';
/** Margen bajo el límite Firestore (1 MiB). */
export const FIRESTORE_DOC_SOFT_LIMIT = 950_000;
const MEETINGS_PER_CHUNK = 35;
function personalMeetingChunksCol(uid) {
    return userRef(uid).collection('store').doc('main').collection('meetingChunks');
}
function orgMeetingChunksCol(orgId) {
    return orgRef(orgId).collection('store').doc('main').collection('meetingChunks');
}
function chunksCol(uid, orgId) {
    if (orgId)
        return orgMeetingChunksCol(orgId);
    if (uid)
        return personalMeetingChunksCol(uid);
    throw new Error('uid u orgId requerido para meeting chunks');
}
async function clearMeetingChunks(uid, orgId) {
    const col = chunksCol(uid, orgId);
    const snap = await col.get();
    if (snap.empty)
        return;
    const batch = col.firestore.batch();
    for (const doc of snap.docs)
        batch.delete(doc.ref);
    await batch.commit();
}
async function saveMeetingChunks(meetings, uid, orgId) {
    const col = chunksCol(uid, orgId);
    await clearMeetingChunks(uid, orgId);
    for (let i = 0; i < meetings.length; i += MEETINGS_PER_CHUNK) {
        const slice = meetings.slice(i, i + MEETINGS_PER_CHUNK);
        const chunkIndex = Math.floor(i / MEETINGS_PER_CHUNK);
        await col.doc(String(chunkIndex).padStart(4, '0')).set({
            index: chunkIndex,
            meetings: slice,
            updatedAt: new Date().toISOString(),
        });
    }
}
async function loadMeetingChunks(uid, orgId) {
    const col = chunksCol(uid, orgId);
    const snap = await col.orderBy('index').get();
    const meetings = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        if (data.meetings?.length)
            meetings.push(...data.meetings);
    }
    return meetings;
}
export async function persistCerebroStore(ref, store, opts) {
    const compact = compactStoreForPersist(store);
    const { meetings, ...core } = compact;
    const inlinePayload = { ...core, meetings };
    if (estimateFirestoreJsonBytes(inlinePayload) <= FIRESTORE_DOC_SOFT_LIMIT) {
        await ref.set(stripUndefined({ ...inlinePayload, storeVersion: 1 }));
        if (opts?.uid || opts?.orgId) {
            await clearMeetingChunks(opts.uid, opts.orgId);
        }
        return;
    }
    const mainDoc = {
        ...core,
        storeVersion: 2,
        meetingCount: meetings.length,
        meetings: [],
    };
    if (estimateFirestoreJsonBytes(mainDoc) > FIRESTORE_DOC_SOFT_LIMIT) {
        throw new Error(`Store core supera ${FIRESTORE_DOC_SOFT_LIMIT} bytes tras compactar (${estimateFirestoreJsonBytes(mainDoc)} bytes)`);
    }
    await ref.set(stripUndefined(mainDoc));
    if (!opts?.uid && !opts?.orgId) {
        throw new Error('Shard de meetings requiere uid u orgId');
    }
    await saveMeetingChunks(meetings, opts.uid, opts.orgId);
}
export async function hydrateCerebroStore(data, opts) {
    const version = data.storeVersion ?? 1;
    const meetingCount = data.meetingCount ?? data.meetings?.length ?? 0;
    let meetings = data.meetings ?? [];
    if (version >= 2 && meetingCount > 0 && meetings.length === 0 && (opts?.uid || opts?.orgId)) {
        meetings = await loadMeetingChunks(opts.uid, opts.orgId);
    }
    return {
        version: data.version ?? 1,
        savedAt: data.savedAt ?? new Date().toISOString(),
        meetings,
        people: data.people ?? [],
        prospects: data.prospects ?? [],
        projects: data.projects ?? [],
        teams: data.teams ?? [],
        todos: data.todos ?? [],
        pendingSuggestions: data.pendingSuggestions ?? [],
        graphEdges: data.graphEdges ?? [],
        dismissedProspectKeys: data.dismissedProspectKeys,
        dismissedProspectIds: data.dismissedProspectIds,
        dismissedTeamEmailKeys: data.dismissedTeamEmailKeys,
        dismissedMergeContactKeys: data.dismissedMergeContactKeys,
    };
}
