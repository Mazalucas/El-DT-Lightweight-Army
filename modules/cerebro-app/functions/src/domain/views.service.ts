import type {
  BoardView,
  CerebroStore,
  DailyDigest,
  DashboardView,
  MaintenanceItem,
  MaintenanceView,
  Meeting,
  MeetingDetailView,
  MeetingListItem,
  MeetingSortKey,
  MeetingsView,
  MeetingTodo,
  PeopleView,
  PersonListItem,
  SuggestionKind,
} from '../shared/types.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { loadSettings } from '../lib/settings.js';
import { hasGoogleIntegration } from '../services/google.js';
import { resolveUserTimezone } from '../shared/timezone.js';
import { listLlmProviders } from '../services/store.js';
import { isSetupComplete } from '../services/setup.js';
import { getSyncProgress, resolveLastSyncAt } from '../services/sync.js';
import { isSyncRunning } from '../lib/sync-running.js';
import { computeStoreHealth } from '../services/store-health.js';
import { isLikelyPersonName } from '../core/profesional/person-name-clean.js';
import { isProspectDismissed } from '../core/profesional/prospect-dismiss.js';
import { buildDerivedSuggestions } from '../services/suggestions-graph.js';
import { listActivePendingSuggestions } from '../services/pending-suggestions.js';
import { listSmartSuggestions } from '../services/smart-suggestions.js';
import { digestsCol } from '../lib/firebase.js';
import { sortMeetingsByRecency } from './meeting-sort.js';
import {
  comparePeopleByLastMeeting,
  parseMeetingSortKey,
  parseRecencyTime,
  sortMeetings,
  sortTodosByRecency,
} from '../shared/recency-sort.js';
import { parseDateFromMeetFilename } from '../shared/parse-meet-filename.js';
import { enrichMeetings, resolveMeetingStartedAt } from '../shared/meeting-dates.js';
import { filterDailyTodos, meetingsInLastDays } from '../shared/filter-daily-todos.js';
import { getCalendarTodayView } from '../services/calendar.service.js';
import { getUserEmail } from '../lib/auth-middleware.js';
import { computeLiveMeetingPrepInsights } from './meeting-prep-insights.service.js';
import type { DashboardAttention, DashboardDailyTodos } from '../shared/types.js';

// --- Builders puros sobre el store (reutilizables para org) ---

function todoCountsByMeeting(todos: MeetingTodo[]): Map<string, { total: number; open: number }> {
  const map = new Map<string, { total: number; open: number }>();
  for (const t of todos) {
    if (t.status === 'dismissed') continue;
    const entry = map.get(t.meetingId) ?? { total: 0, open: 0 };
    entry.total++;
    if (t.status === 'open' || t.status === 'suggested') entry.open++;
    map.set(t.meetingId, entry);
  }
  return map;
}

export function toMeetingListItem(
  m: Meeting,
  counts?: { total: number; open: number },
): MeetingListItem {
  const fromFile = m.sourceFile ? parseDateFromMeetFilename(m.sourceFile).startedAt : undefined;
  const displayDate = resolveMeetingStartedAt(m);
  return {
    id: m.id,
    title: m.title,
    startedAt: m.startedAt ?? fromFile,
    displayDate,
    lastSyncedAt: m.lastSyncedAt,
    summary: m.summary,
    participants: m.participants,
    personIds: m.personIds,
    prospectIds: m.prospectIds,
    teamIds: m.teamIds,
    projectIds: m.projectIds,
    syncStatus: m.syncStatus,
    analysisStatus: m.analysisStatus,
    todoCount: counts?.total ?? 0,
    openTodoCount: counts?.open ?? 0,
  };
}

export interface MeetingsQuery {
  limit?: number;
  offset?: number;
  q?: string;
  projectId?: string;
  teamId?: string;
  sort?: MeetingSortKey | string;
}

/** Máximo de filas por request en la tabla de reuniones (load-more incremental). */
export const MEETINGS_VIEW_MAX_LIMIT = 500;

export function buildMeetingsViewFromStore(store: CerebroStore, query?: MeetingsQuery): MeetingsView {
  const limit = Math.min(Math.max(query?.limit ?? 50, 1), MEETINGS_VIEW_MAX_LIMIT);
  const offset = Math.max(query?.offset ?? 0, 0);
  const q = query?.q?.toLowerCase().trim();
  const sort = parseMeetingSortKey(typeof query?.sort === 'string' ? query.sort : undefined);

  let meetings = sortMeetings(enrichMeetings(store.meetings), sort);
  if (query?.projectId) meetings = meetings.filter((m) => m.projectIds.includes(query.projectId!));
  if (query?.teamId) meetings = meetings.filter((m) => m.teamIds.includes(query.teamId!));
  if (q) {
    meetings = meetings.filter((m) =>
      [m.title, m.summary ?? '', ...(m.participants ?? []), ...(m.participantEmails ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }

  const counts = todoCountsByMeeting(store.todos);
  return {
    meetings: meetings.slice(offset, offset + limit).map((m) => toMeetingListItem(m, counts.get(m.id))),
    total: meetings.length,
    limit,
    offset,
    sort,
    projects: store.projects,
    teams: store.teams,
  };
}

export function buildMeetingDetailViewFromStore(
  store: CerebroStore,
  meetingId: string,
): MeetingDetailView | null {
  const meeting = store.meetings.find((m) => m.id === meetingId);
  if (!meeting) return null;
  const peopleById = new Map(store.people.map((p) => [p.id, p]));
  const prospectsById = new Map(store.prospects.map((p) => [p.id, p]));
  return {
    meeting,
    todos: sortTodosByRecency(
      store.todos.filter((t) => t.meetingId === meetingId && t.status !== 'dismissed'),
    ),
    people: meeting.personIds
      .map((id) => peopleById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, displayName: p.displayName, emails: p.emails })),
    prospects: meeting.prospectIds
      .map((id) => prospectsById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({ id: p.id, displayName: p.displayName })),
    projects: store.projects.filter((p) => meeting.projectIds.includes(p.id)),
    teams: store.teams.filter((t) => meeting.teamIds.includes(t.id)),
  };
}

export function buildPeopleViewFromStore(store: CerebroStore, opts?: { q?: string }): PeopleView {
  const q = opts?.q?.toLowerCase().trim();

  const meetingsByPerson = new Map<string, Meeting[]>();
  for (const m of store.meetings) {
    for (const pid of [...m.personIds, ...m.prospectIds]) {
      if (!meetingsByPerson.has(pid)) meetingsByPerson.set(pid, []);
      meetingsByPerson.get(pid)!.push(m);
    }
  }

  function lastMeeting(personId: string): Meeting | undefined {
    const list = meetingsByPerson.get(personId);
    if (!list?.length) return undefined;
    return sortMeetingsByRecency(list)[0];
  }

  const fromPeople: PersonListItem[] = store.people.map((p) => {
    const last = lastMeeting(p.id);
    return {
      id: p.id,
      kind: 'person',
      displayName: p.displayName,
      emails: p.emails,
      teamIds: p.teamIds,
      projectIds: p.projectIds,
      meetingCount: meetingsByPerson.get(p.id)?.length ?? 0,
      lastMeetingAt: last?.startedAt,
      lastMeetingTitle: last?.title,
      confidence: 'confirmed',
    };
  });

  const fromProspects: PersonListItem[] = store.prospects
    .filter(
      (p) => !p.linkedPersonId && isLikelyPersonName(p.displayName) && !isProspectDismissed(store, p),
    )
    .map((p) => {
      const last = lastMeeting(p.id);
      return {
        id: p.id,
        kind: 'prospect',
        displayName: p.displayName,
        emails: [],
        teamIds: [],
        projectIds: [],
        meetingCount: p.meetingIds.length,
        lastMeetingAt: last?.startedAt ?? p.lastSeenAt,
        lastMeetingTitle: last?.title,
        linkedPersonId: p.linkedPersonId,
        confidence: 'inferred',
      };
    });

  let people = [...fromPeople, ...fromProspects];
  if (q) {
    people = people.filter((p) =>
      [p.displayName, ...p.emails].join(' ').toLowerCase().includes(q),
    );
  }
  people.sort(comparePeopleByLastMeeting);

  return { people, total: people.length, teams: store.teams, projects: store.projects };
}

export function buildBoardViewFromStore(store: CerebroStore): BoardView {
  const todos = sortTodosByRecency(store.todos.filter((t) => t.status !== 'dismissed'));
  return {
    todos,
    projects: store.projects,
    teams: store.teams,
    people: store.people.map((p) => ({ id: p.id, displayName: p.displayName })),
    counts: {
      suggested: todos.filter((t) => t.status === 'suggested').length,
      open: todos.filter((t) => t.status === 'open').length,
      done: todos.filter((t) => t.status === 'done').length,
      suggestions: todos.filter((t) => t.status === 'suggested').length,
    },
  };
}

/** Acciones de mantenimiento de datos: todo lo heurístico (merge, asignaciones, prospects, revisar IA). */
export function buildMaintenanceItemsFromStore(store: CerebroStore): MaintenanceItem[] {
  const pending: MaintenanceItem[] = listActivePendingSuggestions(store).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    payload: row.payload,
    createdAt: row.createdAt,
    source: row.source,
    confidence: row.confidence,
  }));
  const derived: MaintenanceItem[] = buildDerivedSuggestions(store, { maxProspects: null })
    .filter((s) => s.kind !== 'accept_todo')
    .map((s) => ({ ...s }));

  const seen = new Set<string>();
  const merged: MaintenanceItem[] = [];
  for (const item of [...pending, ...derived]) {
    const key = `${item.kind}:${item.title}:${JSON.stringify(item.payload)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? '') || 0;
    const tb = Date.parse(b.createdAt ?? '') || 0;
    return tb - ta;
  });
}

export function buildMaintenanceViewFromStore(store: CerebroStore): MaintenanceView {
  const items = buildMaintenanceItemsFromStore(store);
  const counts: Partial<Record<SuggestionKind, number>> = {};
  for (const item of items) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  return { items, counts, total: items.length, generatedAt: new Date().toISOString() };
}

// --- Vistas por uid (una carga de store por request) ---

export async function getMeetingsView(uid: string, query?: MeetingsQuery): Promise<MeetingsView> {
  const store = await loadStoreFromRepository(uid);
  return buildMeetingsViewFromStore(store, query);
}

export async function getMeetingDetailView(
  uid: string,
  meetingId: string,
): Promise<MeetingDetailView | null> {
  const store = await loadStoreFromRepository(uid);
  return buildMeetingDetailViewFromStore(store, meetingId);
}

export async function getPeopleView(uid: string, opts?: { q?: string }): Promise<PeopleView> {
  const store = await loadStoreFromRepository(uid);
  return buildPeopleViewFromStore(store, opts);
}

export async function getBoardView(uid: string): Promise<BoardView> {
  const store = await loadStoreFromRepository(uid);
  return buildBoardViewFromStore(store);
}

export async function getMaintenanceView(uid: string): Promise<MaintenanceView> {
  const store = await loadStoreFromRepository(uid);
  return buildMaintenanceViewFromStore(store);
}

async function loadLatestDigest(uid: string): Promise<DailyDigest | null> {
  const snap = await digestsCol(uid).orderBy('date', 'desc').limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0]!.data() as DailyDigest;
}

export async function getCalendarToday(uid: string, timezone?: string): Promise<import('../shared/types.js').CalendarTodayView> {
  const store = await loadStoreFromRepository(uid);
  let resolved = timezone?.trim();
  if (!resolved) {
    const settings = await loadSettings(uid);
    resolved = resolveUserTimezone(settings);
  }
  return getCalendarTodayView(uid, { timezone: resolved, store });
}

function buildDailyTodos(store: CerebroStore): DashboardDailyTodos {
  const daily = filterDailyTodos(store.todos);
  const suggested = store.todos.filter((t) => t.status === 'suggested').slice(0, 6);
  return {
    overdue: daily.overdue.slice(0, 8),
    today: daily.today.slice(0, 8),
    noDate: daily.noDate.slice(0, 4),
    suggested,
  };
}

function buildDashboardAttention(
  store: CerebroStore,
  maintenanceItems: MaintenanceItem[],
  lastSyncAt?: string,
): DashboardAttention {
  const daily = filterDailyTodos(store.todos);
  const syncStale = lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() > 86400000 : false;
  return {
    maintenanceCount: maintenanceItems.length,
    maintenancePreview: maintenanceItems.slice(0, 3),
    meetingsNeedsReview: store.meetings.filter((m) => m.analysisStatus === 'needs_review').length,
    overdueCount: daily.overdue.length,
    todayCount: daily.today.length,
    suggestedCount: store.todos.filter((t) => t.status === 'suggested').length,
    weekMeetingCount: meetingsInLastDays(store.meetings, 7),
    syncStale,
  };
}

export async function getDashboardView(uid: string): Promise<DashboardView> {
  const [store, settings, google, llmProviders, progress, smartSuggestions, digest, lastSyncAt, operatorEmail] =
    await Promise.all([
      loadStoreFromRepository(uid),
      loadSettings(uid),
      hasGoogleIntegration(uid),
      listLlmProviders(uid),
      getSyncProgress(uid),
      listSmartSuggestions(uid, { status: 'pending', limit: 5 }),
      loadLatestDigest(uid),
      resolveLastSyncAt(uid),
      getUserEmail(uid),
    ]);

  const timezone = resolveUserTimezone(settings);
  const calendarToday = await getCalendarTodayView(uid, { timezone, store }).catch(() => null);
  const meetingPrepInsights = calendarToday
    ? computeLiveMeetingPrepInsights(calendarToday, store, operatorEmail ?? '')
    : undefined;

  const health = computeStoreHealth(store);
  const maintenanceItems = buildMaintenanceItemsFromStore(store);
  const maintenanceCount = maintenanceItems.length;
  const dailyTodos = buildDailyTodos(store);
  const dueTodos = [...dailyTodos.overdue, ...dailyTodos.today, ...dailyTodos.noDate].slice(0, 10);
  const attention = buildDashboardAttention(store, maintenanceItems, lastSyncAt);
  const counts = todoCountsByMeeting(store.todos);
  const recentMeetings = sortMeetingsByRecency(enrichMeetings(store.meetings))
    .slice(0, 5)
    .map((m) => toMeetingListItem(m, counts.get(m.id)));

  const today = new Date().toISOString().slice(0, 10);

  return {
    date: today,
    digest,
    suggestions: smartSuggestions,
    dueTodos,
    dailyTodos,
    attention,
    openTodoCount: store.todos.filter((t) => t.status === 'open').length,
    suggestedTodoCount: store.todos.filter((t) => t.status === 'suggested').length,
    recentMeetings,
    meetingCount: store.meetings.length,
    peopleCount: store.people.length,
    maintenanceCount,
    health,
    syncRunning: isSyncRunning(progress),
    setupComplete: isSetupComplete(settings, google),
    hasGoogleIntegration: google,
    hasLlmKey: llmProviders.some((p) => p.enabled && p.keyHint),
    lastSyncAt,
    meetingPrepInsights: meetingPrepInsights?.length ? meetingPrepInsights : undefined,
  };
}
