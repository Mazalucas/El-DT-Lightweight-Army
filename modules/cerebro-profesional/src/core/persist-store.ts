import { db } from './db';
import type { Meeting, Person, PersonProspect, Project, Team, MeetingTodo } from './models';

export interface CerebroStoreSnapshot {
  version: 1 | 2 | 3;
  savedAt: string;
  meetings: Meeting[];
  people: Person[];
  prospects?: PersonProspect[];
  teams: Team[];
  projects: Project[];
  todos?: MeetingTodo[];
}

const BACKUP_KEY = 'cerebro-profesional-snapshot';
const LAST_WRITE_KEY = 'cerebro-profesional-last-write';

export function getLastLocalWrite(): string | null {
  return localStorage.getItem(LAST_WRITE_KEY);
}

export async function exportLocalSnapshot(): Promise<CerebroStoreSnapshot> {
  const [meetings, people, prospects, teams, projects, todos] = await Promise.all([
    db.meetings.toArray(),
    db.people.toArray(),
    db.prospects.toArray(),
    db.teams.toArray(),
    db.projects.toArray(),
    db.todos.toArray(),
  ]);
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    meetings,
    people,
    prospects,
    teams,
    projects,
    todos,
  };
}

function writeLocalBackup(snapshot: CerebroStoreSnapshot): void {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
  localStorage.setItem(LAST_WRITE_KEY, snapshot.savedAt);
}

export async function mergeMeetingAnalysisFromSnapshot(
  snapshot: CerebroStoreSnapshot,
): Promise<number> {
  let count = 0;
  for (const sm of snapshot.meetings) {
    const meeting = await db.meetings.get(sm.id);
    if (!meeting) continue;
    await db.meetings.put({
      ...meeting,
      summary: sm.summary ?? meeting.summary,
      projectIds: [...new Set([...meeting.projectIds, ...(sm.projectIds ?? [])])],
      teamIds: meeting.teamIds.length ? meeting.teamIds : sm.teamIds,
      analysisStatus: sm.analysisStatus ?? meeting.analysisStatus,
      updatedAt: sm.updatedAt ?? meeting.updatedAt,
    });
    count++;
  }
  return count;
}

function normalizePerson(p: Person): Person {
  return {
    ...p,
    aliases: p.aliases ?? [],
    teamIds: p.teamIds ?? [],
    projectIds: p.projectIds ?? [],
    emails: p.emails ?? [],
    emailMeta: p.emailMeta ?? {},
  };
}

/** Unión por id — lo local gana en conflicto (equipos/proyectos editados en la app). */
export function mergeCatalogById<T extends { id: string }>(local: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of incoming) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return [...map.values()];
}

export async function importLocalSnapshot(snapshot: CerebroStoreSnapshot): Promise<void> {
  if (snapshot.version !== 1 && snapshot.version !== 2 && snapshot.version !== 3) return;

  const [localTeams, localProjects] = await Promise.all([
    db.teams.toArray(),
    db.projects.toArray(),
  ]);

  let backupTeams: Team[] = [];
  let backupProjects: Project[] = [];
  const rawBackup = localStorage.getItem(BACKUP_KEY);
  if (rawBackup) {
    try {
      const backup = JSON.parse(rawBackup) as CerebroStoreSnapshot;
      backupTeams = backup.teams ?? [];
      backupProjects = backup.projects ?? [];
    } catch {
      /* ignore */
    }
  }

  await db.transaction(
    'readwrite',
    [db.meetings, db.people, db.prospects, db.teams, db.projects, db.todos],
    async () => {
      await db.meetings.clear();
      await db.people.clear();
      await db.prospects.clear();
      await db.teams.clear();
      await db.projects.clear();
      await db.todos.clear();
      if (snapshot.meetings.length) {
        await db.meetings.bulkPut(
          snapshot.meetings.map((m) => ({
            ...m,
            prospectIds: m.prospectIds ?? [],
            participantEmails: m.participantEmails ?? [],
          })),
        );
      }
      if (snapshot.people.length) {
        await db.people.bulkPut(snapshot.people.map(normalizePerson));
      }
      if (snapshot.prospects?.length) await db.prospects.bulkPut(snapshot.prospects);
      const mergedTeams = mergeCatalogById(
        mergeCatalogById(localTeams, backupTeams),
        snapshot.teams ?? [],
      );
      if (mergedTeams.length) await db.teams.bulkPut(mergedTeams);
      const mergedProjects = mergeCatalogById(
        mergeCatalogById(localProjects, backupProjects),
        snapshot.projects ?? [],
      );
      if (mergedProjects.length) await db.projects.bulkPut(mergedProjects);
      if (snapshot.todos?.length) await db.todos.bulkPut(snapshot.todos);
    },
  );
}

export type PersistResult = { ok: boolean; via: 'server' | 'local' | 'none' };

export function snapshotTimestamp(iso: string | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Siempre guarda backup en localStorage; intenta además escribir en .local vía API dev. */
export async function persistSnapshotToServer(): Promise<PersistResult> {
  const snapshot = await exportLocalSnapshot();
  const hasData =
    snapshot.meetings.length > 0 ||
    snapshot.teams.length > 0 ||
    snapshot.projects.length > 0 ||
    (snapshot.people?.length ?? 0) > 0;
  if (!hasData) return { ok: false, via: 'none' };
  writeLocalBackup(snapshot);
  try {
    const res = await fetch('/api/store/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
      keepalive: true,
    });
    if (res.ok) return { ok: true, via: 'server' };
  } catch {
    /* sin servidor dev */
  }
  return { ok: true, via: 'local' };
}

/**
 * Disco (.local/cerebro-store.json) es la fuente de verdad entre reinicios.
 * Al abrir: restaura desde disco si es más reciente; siempre vuelca el estado activo a disco.
 */
export async function reconcileWithDiskSnapshot(): Promise<'restored' | 'pushed' | 'noop'> {
  const meetingCount = await db.meetings.count();
  const snapshot = await loadSnapshotFromServer();
  const diskTime = snapshotTimestamp(snapshot?.savedAt);
  const localTime = snapshotTimestamp(getLastLocalWrite() ?? undefined);

  if (meetingCount === 0 && snapshot?.meetings?.length) {
    await importLocalSnapshot(snapshot);
    await persistSnapshotToServer();
    return 'restored';
  }

  if (meetingCount > 0 && snapshot?.meetings?.length && diskTime > localTime) {
    await importLocalSnapshot(snapshot);
    await persistSnapshotToServer();
    return 'restored';
  }

  if (meetingCount > 0) {
    await persistSnapshotToServer();
    return localTime > diskTime ? 'pushed' : 'noop';
  }

  return 'noop';
}

const AUTO_PERSIST_MS = 30_000;
let autoPersistTimer: ReturnType<typeof setInterval> | null = null;

/** Autoguardado periódico y al ocultar pestaña — evita pérdida al cerrar sin acción explícita. */
export function setupAutoPersist(): () => void {
  const flush = () => {
    void persistSnapshotToServer();
  };

  if (autoPersistTimer) clearInterval(autoPersistTimer);
  autoPersistTimer = setInterval(flush, AUTO_PERSIST_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);

  return () => {
    if (autoPersistTimer) clearInterval(autoPersistTimer);
    autoPersistTimer = null;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flush);
  };
}

export async function loadSnapshotFromServer(): Promise<CerebroStoreSnapshot | null> {
  let disk: CerebroStoreSnapshot | null = null;
  try {
    const res = await fetch('/api/store/snapshot');
    if (res.ok) {
      const data = (await res.json()) as { snapshot: CerebroStoreSnapshot | null };
      if (data.snapshot?.meetings?.length) disk = data.snapshot;
    }
  } catch {
    /* fallback abajo */
  }

  let local: CerebroStoreSnapshot | null = null;
  const raw = localStorage.getItem(BACKUP_KEY);
  if (raw) {
    try {
      local = JSON.parse(raw) as CerebroStoreSnapshot;
    } catch {
      local = null;
    }
  }

  if (!disk && !local?.meetings?.length) return null;
  if (!disk) return local;
  if (!local?.meetings?.length) return disk;
  return snapshotTimestamp(disk.savedAt) >= snapshotTimestamp(local.savedAt) ? disk : local;
}
