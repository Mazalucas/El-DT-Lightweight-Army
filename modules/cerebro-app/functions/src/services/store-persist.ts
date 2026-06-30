import type { DocumentReference } from 'firebase-admin/firestore';
import type { CerebroStore, Meeting } from '../shared/types.js';
import { orgRef, userRef } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { compactStoreForPersist, estimateFirestoreJsonBytes } from './store-compact.js';

/** Margen bajo el límite Firestore (1 MiB). */
export const FIRESTORE_DOC_SOFT_LIMIT = 950_000;
const MEETINGS_PER_CHUNK = 35;

export interface StoreMainDoc extends Omit<CerebroStore, 'meetings'> {
  storeVersion?: number;
  meetingCount?: number;
  meetings?: Meeting[];
}

function personalMeetingChunksCol(uid: string) {
  return userRef(uid).collection('store').doc('main').collection('meetingChunks');
}

function orgMeetingChunksCol(orgId: string) {
  return orgRef(orgId).collection('store').doc('main').collection('meetingChunks');
}

function chunksCol(uid?: string, orgId?: string) {
  if (orgId) return orgMeetingChunksCol(orgId);
  if (uid) return personalMeetingChunksCol(uid);
  throw new Error('uid u orgId requerido para meeting chunks');
}

async function clearMeetingChunks(uid?: string, orgId?: string): Promise<void> {
  const col = chunksCol(uid, orgId);
  const snap = await col.get();
  if (snap.empty) return;
  const batch = col.firestore.batch();
  for (const doc of snap.docs) batch.delete(doc.ref);
  await batch.commit();
}

async function saveMeetingChunks(meetings: Meeting[], uid?: string, orgId?: string): Promise<void> {
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

async function loadMeetingChunks(uid?: string, orgId?: string): Promise<Meeting[]> {
  const col = chunksCol(uid, orgId);
  const snap = await col.orderBy('index').get();
  const meetings: Meeting[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as { meetings?: Meeting[] };
    if (data.meetings?.length) meetings.push(...data.meetings);
  }
  return meetings;
}

export async function persistCerebroStore(
  ref: DocumentReference,
  store: CerebroStore,
  opts?: { uid?: string; orgId?: string },
): Promise<void> {
  const compact = compactStoreForPersist(store);
  const { meetings, ...core } = compact;
  const inlinePayload: CerebroStore = { ...core, meetings };

  if (estimateFirestoreJsonBytes(inlinePayload) <= FIRESTORE_DOC_SOFT_LIMIT) {
    await ref.set(stripUndefined({ ...inlinePayload, storeVersion: 1 }));
    if (opts?.uid || opts?.orgId) {
      await clearMeetingChunks(opts.uid, opts.orgId);
    }
    return;
  }

  const mainDoc: StoreMainDoc = {
    ...core,
    storeVersion: 2,
    meetingCount: meetings.length,
    meetings: [],
  };

  if (estimateFirestoreJsonBytes(mainDoc) > FIRESTORE_DOC_SOFT_LIMIT) {
    throw new Error(
      `Store core supera ${FIRESTORE_DOC_SOFT_LIMIT} bytes tras compactar (${estimateFirestoreJsonBytes(mainDoc)} bytes)`,
    );
  }

  await ref.set(stripUndefined(mainDoc));
  if (!opts?.uid && !opts?.orgId) {
    throw new Error('Shard de meetings requiere uid u orgId');
  }
  await saveMeetingChunks(meetings, opts.uid, opts.orgId);
}

export async function hydrateCerebroStore(
  data: StoreMainDoc & Partial<CerebroStore>,
  opts?: { uid?: string; orgId?: string },
): Promise<CerebroStore> {
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
