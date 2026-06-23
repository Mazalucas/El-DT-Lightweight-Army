import type {
  CerebroStore,
  Meeting,
  MeetingTodo,
  PendingSuggestion,
  Person,
  PersonProspect,
  Project,
  Team,
} from '../shared/types.js';
import { DEFAULT_SETTINGS } from '../shared/types.js';
import {
  meetingsCol,
  peopleCol,
  projectsCol,
  prospectsCol,
  storeMetaRef,
  storeRef,
  suggestionsCol,
  teamsCol,
  todosCol,
} from '../lib/firebase.js';
import { loadSettings } from '../lib/settings.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { hydrateCerebroStore, persistCerebroStore } from './store-persist.js';
import { rebuildGraphEdges } from './graph-edges.js';
import { coerceStringArray } from '../lib/text-coerce.js';
import { compactStoreForPersist } from './store-compact.js';

export const STORE_VERSION_NORMALIZED = 3;

export interface StoreMeta {
  storeVersion: number;
  version: number;
  savedAt: string;
  meetingCount: number;
  peopleCount: number;
  prospectsCount: number;
  projectsCount: number;
  teamsCount: number;
  todosCount: number;
  suggestionsCount: number;
}

const BATCH_SIZE = 400;

async function emptyStore(uid: string): Promise<CerebroStore> {
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

async function loadNormalizedStore(uid: string): Promise<CerebroStore> {
  const metaSnap = await storeMetaRef(uid).get();
  const meta = metaSnap.data() as StoreMeta | undefined;

  const [peopleSnap, prospectsSnap, projectsSnap, teamsSnap, todosSnap, suggestionsSnap, meetingsSnap] =
    await Promise.all([
      peopleCol(uid).get(),
      prospectsCol(uid).get(),
      projectsCol(uid).get(),
      teamsCol(uid).get(),
      todosCol(uid).get(),
      suggestionsCol(uid).get(),
      meetingsCol(uid).limit(2000).get(),
    ]);

  const meetings: Meeting[] = meetingsSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: String(data.meetingId ?? d.id),
      docId: data.docId as string | undefined,
      sourceFile: String(data.sourceFile ?? ''),
      title: String(data.title ?? d.id),
      startedAt: data.startedAt as string | undefined,
      timezone: data.timezone as string | undefined,
      summary: data.summary as string | undefined,
      participants: coerceStringArray(data.participants as unknown[] | undefined),
      actionItems: data.actionItems
        ? coerceStringArray(data.actionItems as unknown[])
        : undefined,
      participantEmails: data.participantEmails as string[] | undefined,
      personIds: (data.personIds as string[]) ?? [],
      prospectIds: (data.prospectIds as string[]) ?? [],
      teamIds: (data.teamIds as string[]) ?? [],
      projectIds: (data.projectIds as string[]) ?? [],
      syncStatus: (data.syncStatus as Meeting['syncStatus']) ?? 'synced',
      analysisStatus: (data.analysisStatus as Meeting['analysisStatus']) ?? 'pending',
      updatedAt: String(data.updatedAt ?? new Date().toISOString()),
      driveFolderId: data.driveFolderId as string | undefined,
      teamId: data.teamId as string | undefined,
      contributorUids: data.contributorUids as string[] | undefined,
    };
  });

  const store: CerebroStore = {
    version: meta?.version ?? 1,
    savedAt: meta?.savedAt ?? new Date().toISOString(),
    meetings,
    people: peopleSnap.docs.map((d) => d.data() as Person),
    prospects: prospectsSnap.docs.map((d) => d.data() as PersonProspect),
    projects: projectsSnap.docs.map((d) => d.data() as Project),
    teams: teamsSnap.docs.map((d) => d.data() as Team),
    todos: todosSnap.docs.map((d) => d.data() as MeetingTodo),
    pendingSuggestions: suggestionsSnap.docs.map((d) => d.data() as PendingSuggestion),
    graphEdges: [],
  };

  store.graphEdges = rebuildGraphEdges(store);
  return store;
}

async function saveNormalizedStore(uid: string, store: CerebroStore): Promise<void> {
  const compact = compactStoreForPersist(store);
  const now = new Date().toISOString();
  const db = storeMetaRef(uid).firestore;

  async function replaceCollection(
    col: FirebaseFirestore.CollectionReference,
    items: Array<{ id: string; data: Record<string, unknown> }>,
  ): Promise<void> {
    const existing = await col.select().get();
    for (let i = 0; i < existing.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const doc of existing.docs.slice(i, i + BATCH_SIZE)) batch.delete(doc.ref);
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

  await replaceCollection(
    peopleCol(uid),
    compact.people.map((p) => ({ id: p.id, data: p as unknown as Record<string, unknown> })),
  );
  await replaceCollection(
    prospectsCol(uid),
    compact.prospects.map((p) => ({ id: p.id, data: p as unknown as Record<string, unknown> })),
  );
  await replaceCollection(
    projectsCol(uid),
    compact.projects.map((p) => ({ id: p.id, data: p as unknown as Record<string, unknown> })),
  );
  await replaceCollection(
    teamsCol(uid),
    compact.teams.map((t) => ({ id: t.id, data: t as unknown as Record<string, unknown> })),
  );
  await replaceCollection(
    todosCol(uid),
    compact.todos.map((t) => ({ id: t.id, data: t as unknown as Record<string, unknown> })),
  );
  await replaceCollection(
    suggestionsCol(uid),
    (compact.pendingSuggestions ?? []).map((s) => ({ id: s.id, data: s as unknown as Record<string, unknown> })),
  );

  for (let i = 0; i < compact.meetings.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const m of compact.meetings.slice(i, i + BATCH_SIZE)) {
      batch.set(
        meetingsCol(uid).doc(m.id),
        stripUndefined({
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
        }),
        { merge: true },
      );
    }
    await batch.commit();
  }

  const meta: StoreMeta = {
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

  await storeRef(uid).set(
    stripUndefined({
      storeVersion: STORE_VERSION_NORMALIZED,
      migratedAt: now,
      meetings: [],
      meetingCount: compact.meetings.length,
    }),
    { merge: true },
  );
}

export async function getStoreMeta(uid: string): Promise<StoreMeta | null> {
  const snap = await storeMetaRef(uid).get();
  return snap.exists ? (snap.data() as StoreMeta) : null;
}

export async function isNormalizedStore(uid: string): Promise<boolean> {
  const meta = await getStoreMeta(uid);
  if (meta?.storeVersion === STORE_VERSION_NORMALIZED) return true;
  const main = await storeRef(uid).get();
  const data = main.data() as { storeVersion?: number } | undefined;
  return data?.storeVersion === STORE_VERSION_NORMALIZED;
}

export async function loadStoreFromRepository(uid: string): Promise<CerebroStore> {
  if (await isNormalizedStore(uid)) {
    return loadNormalizedStore(uid);
  }
  const snap = await storeRef(uid).get();
  if (!snap.exists) return emptyStore(uid);
  const store = await hydrateCerebroStore(snap.data() as CerebroStore, { uid });
  if (!store.pendingSuggestions) store.pendingSuggestions = [];
  if (!store.graphEdges?.length) store.graphEdges = rebuildGraphEdges(store);
  return store;
}

export async function saveStoreToRepository(uid: string, store: CerebroStore): Promise<void> {
  store.savedAt = new Date().toISOString();
  if (!(await isNormalizedStore(uid))) {
    await saveNormalizedStore(uid, store);
    return;
  }
  await saveNormalizedStore(uid, store);
}

export async function migrateStoreToNormalized(uid: string): Promise<StoreMeta> {
  const store = await loadStoreFromRepository(uid);
  if (await isNormalizedStore(uid)) {
    const meta = await getStoreMeta(uid);
    if (meta) return meta;
  }
  await saveNormalizedStore(uid, store);
  const meta = await getStoreMeta(uid);
  return meta!;
}
