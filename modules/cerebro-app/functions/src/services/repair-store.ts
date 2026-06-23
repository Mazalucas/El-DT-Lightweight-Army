import type { CerebroStore } from '../shared/types.js';
import { slugId } from '../core/profesional/parse-mirror-md.js';
import { emitProjectSuggestion, ensurePendingSuggestions } from './pending-suggestions.js';
import { rebuildGraphEdges } from './graph-edges.js';
import { fullImportFromMirrors } from './reindex.js';
import { listMeetings, resyncAllSyncedMirrors, updateSyncProgress } from './sync.js';
import { loadStore, saveStore } from './store.js';
import { ingestMemberStoreToOrg, loadOrgStore, saveOrgStore, listOrgMembers } from './org.js';

function isUuidProjectId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function remapProjectId(store: CerebroStore, fromId: string, toId: string): number {
  let touches = 0;
  for (const m of store.meetings) {
    if (!m.projectIds.includes(fromId)) continue;
    m.projectIds = [...new Set(m.projectIds.map((id) => (id === fromId ? toId : id)))];
    touches++;
  }
  for (const t of store.todos) {
    if (!t.projectIds.includes(fromId)) continue;
    t.projectIds = [...new Set(t.projectIds.map((id) => (id === fromId ? toId : id)))];
  }
  for (const p of store.people) {
    if (!p.projectIds?.includes(fromId)) continue;
    p.projectIds = [...new Set(p.projectIds!.map((id) => (id === fromId ? toId : id)))];
  }
  return touches;
}

export function dedupeProjectsInStore(store: CerebroStore): { merged: number; suggestions: number } {
  ensurePendingSuggestions(store);
  let merged = 0;
  let suggestions = 0;

  const slugForName = (name: string): string => slugId(name.trim());

  const ensureCanonical = (name: string): string => {
    const id = slugForName(name);
    let existing = store.projects.find((p) => p.id === id);
    if (!existing) {
      existing = store.projects.find(
        (p) => !isUuidProjectId(p.id) && p.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
    }
    if (!existing) {
      store.projects.push({ id, name: name.trim(), tags: [] });
      return id;
    }
    return existing.id;
  };

  for (const project of [...store.projects]) {
    const canonicalId = ensureCanonical(project.name);
    if (project.id === canonicalId) continue;

    merged += remapProjectId(store, project.id, canonicalId);
    store.projects = store.projects.filter((p) => p.id !== project.id);
    if (isUuidProjectId(project.id)) suggestions++;
  }

  const usedIds = new Set<string>();
  for (const m of store.meetings) {
    for (const pid of m.projectIds) usedIds.add(pid);
  }

  for (const project of [...store.projects]) {
    if (usedIds.has(project.id)) continue;
    if (isUuidProjectId(project.id)) {
      emitProjectSuggestion(store, '', project.name, 'inferred', { confidence: 'low' });
      suggestions++;
    }
    store.projects = store.projects.filter((p) => p.id !== project.id);
  }

  store.savedAt = new Date().toISOString();
  return { merged, suggestions };
}

export async function repairUserStore(uid: string): Promise<{
  dedupe: { merged: number; suggestions: number };
  resync: { updated: number; errors: number; total: number };
  import: Awaited<ReturnType<typeof fullImportFromMirrors>>;
}> {
  const store = await loadStore(uid);
  const dedupe = dedupeProjectsInStore(store);
  await saveStore(uid, store);
  const resync = await resyncAllSyncedMirrors(uid, { skipPermissions: true });
  const importResult = await fullImportFromMirrors(uid);
  await saveStore(uid, await loadStore(uid));
  return { dedupe, resync, import: importResult };
}

export interface RunRepairOptions {
  /** Firestore progress doc (default: uid del store reparado). */
  progressUid?: string;
  titlePrefix?: string;
}

/** Repair con progreso en Firestore (para ejecución en segundo plano). */
export async function runRepairUserStore(uid: string, options?: RunRepairOptions): Promise<void> {
  const progressUid = options?.progressUid ?? uid;
  const prefix = options?.titlePrefix ?? '';
  const synced = (await listMeetings(uid)).filter((e) => e.syncStatus === 'synced' && e.docId);
  const totalSteps = synced.length + 2;

  try {
    await updateSyncProgress(progressUid, {
      phase: 'repair',
      current: 0,
      total: totalSteps,
      done: false,
      currentTitle: `${prefix}Limpiando proyectos UUID…`,
    });

    const store = await loadStore(uid);
    const dedupe = dedupeProjectsInStore(store);
    await saveStore(uid, store);

    const resync = await resyncAllSyncedMirrors(uid, {
      skipPermissions: true,
      onProgress: async (current, total, title) => {
        await updateSyncProgress(progressUid, {
          phase: 'repair',
          current,
          total: totalSteps,
          done: false,
          currentTitle: `${prefix}Re-sync ${current}/${total}: ${title}`,
        });
      },
    });

    await updateSyncProgress(progressUid, {
      phase: 'repair',
      current: synced.length + 1,
      total: totalSteps,
      done: false,
      currentTitle: `${prefix}Importando contactos y reuniones…`,
    });
    const importResult = await fullImportFromMirrors(uid);

    await updateSyncProgress(progressUid, {
      phase: 'repair',
      current: totalSteps,
      total: totalSteps,
      done: false,
      currentTitle: `${prefix}Reconstruyendo grafo…`,
    });
    await saveStore(uid, await loadStore(uid));

    await updateSyncProgress(progressUid, {
      phase: 'idle',
      done: true,
      finishedAt: new Date().toISOString(),
      current: totalSteps,
      total: totalSteps,
      currentTitle: 'Reparación completada',
      result: {
        scanned: resync.total,
        synced: resync.updated,
        skipped: 0,
        errors: resync.errors,
        messages: [`dedupe merged=${dedupe.merged} suggestions=${dedupe.suggestions}`],
        imported: importResult.people,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateSyncProgress(progressUid, {
      phase: 'idle',
      done: true,
      error: msg,
      finishedAt: new Date().toISOString(),
    });
    throw e;
  }
}

export async function repairOrgStore(orgId: string): Promise<{
  members: number;
  dedupe: { merged: number; suggestions: number };
}> {
  const members = await listOrgMembers(orgId);
  for (const m of members) {
    try {
      await repairUserStore(m.uid);
      await ingestMemberStoreToOrg(m.uid, orgId);
    } catch (e) {
      console.warn(`repair skip member ${m.uid}`, e);
    }
  }

  const orgStore = await loadOrgStore(orgId);
  const dedupe = dedupeProjectsInStore(orgStore);
  orgStore.graphEdges = rebuildGraphEdges(orgStore, { includeMembers: true, members });
  await saveOrgStore(orgId, orgStore);
  return { members: members.length, dedupe };
}

export async function runRepairOrgStore(orgId: string, requesterUid: string): Promise<void> {
  const members = await listOrgMembers(orgId);
  const totalSteps = members.length + 1;

  try {
    for (let i = 0; i < members.length; i++) {
      const m = members[i]!;
      await updateSyncProgress(requesterUid, {
        phase: 'repair',
        current: i,
        total: totalSteps,
        done: false,
        currentTitle: `Miembro ${i + 1}/${members.length}: reparando…`,
      });
      await runRepairUserStore(m.uid, {
        progressUid: requesterUid,
        titlePrefix: `[${i + 1}/${members.length}] `,
      });
      await ingestMemberStoreToOrg(m.uid, orgId);
    }

    await updateSyncProgress(requesterUid, {
      phase: 'repair',
      current: members.length,
      total: totalSteps,
      done: false,
      currentTitle: 'Dedupe store org…',
    });
    const orgStore = await loadOrgStore(orgId);
    const dedupe = dedupeProjectsInStore(orgStore);
    orgStore.graphEdges = rebuildGraphEdges(orgStore, { includeMembers: true, members });
    await saveOrgStore(orgId, orgStore);

    await updateSyncProgress(requesterUid, {
      phase: 'idle',
      done: true,
      finishedAt: new Date().toISOString(),
      current: totalSteps,
      total: totalSteps,
      currentTitle: 'Reparación org completada',
      result: {
        scanned: members.length,
        synced: members.length,
        skipped: 0,
        errors: 0,
        messages: [`org dedupe merged=${dedupe.merged} suggestions=${dedupe.suggestions}`],
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateSyncProgress(requesterUid, {
      phase: 'idle',
      done: true,
      error: msg,
      finishedAt: new Date().toISOString(),
    });
    throw e;
  }
}
