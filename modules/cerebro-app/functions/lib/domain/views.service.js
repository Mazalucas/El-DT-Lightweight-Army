import { loadStoreFromRepository } from '../services/store-repository.js';
import { loadSettings } from '../lib/settings.js';
import { hasGoogleIntegration } from '../services/google.js';
import { listLlmProviders } from '../services/store.js';
import { isSetupComplete } from '../services/setup.js';
import { getSyncProgress } from '../services/sync.js';
import { isSyncRunning } from '../lib/sync-running.js';
import { computeStoreHealth } from '../services/store-health.js';
import { buildDerivedSuggestions } from '../services/suggestions-graph.js';
import { listActivePendingSuggestions } from '../services/pending-suggestions.js';
import { listSmartSuggestions } from '../services/smart-suggestions.js';
import { digestsCol } from '../lib/firebase.js';
import { sortMeetingsByRecency } from './meeting-sort.js';
// --- Builders puros sobre el store (reutilizables para org) ---
function todoCountsByMeeting(todos) {
    const map = new Map();
    for (const t of todos) {
        if (t.status === 'dismissed')
            continue;
        const entry = map.get(t.meetingId) ?? { total: 0, open: 0 };
        entry.total++;
        if (t.status === 'open' || t.status === 'suggested')
            entry.open++;
        map.set(t.meetingId, entry);
    }
    return map;
}
export function toMeetingListItem(m, counts) {
    return {
        id: m.id,
        title: m.title,
        startedAt: m.startedAt,
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
/** Máximo de filas por request en la tabla de reuniones (load-more incremental). */
export const MEETINGS_VIEW_MAX_LIMIT = 500;
export function buildMeetingsViewFromStore(store, query) {
    const limit = Math.min(Math.max(query?.limit ?? 50, 1), MEETINGS_VIEW_MAX_LIMIT);
    const offset = Math.max(query?.offset ?? 0, 0);
    const q = query?.q?.toLowerCase().trim();
    let meetings = sortMeetingsByRecency(store.meetings);
    if (query?.projectId)
        meetings = meetings.filter((m) => m.projectIds.includes(query.projectId));
    if (query?.teamId)
        meetings = meetings.filter((m) => m.teamIds.includes(query.teamId));
    if (q) {
        meetings = meetings.filter((m) => [m.title, m.summary ?? '', ...(m.participants ?? []), ...(m.participantEmails ?? [])]
            .join(' ')
            .toLowerCase()
            .includes(q));
    }
    const counts = todoCountsByMeeting(store.todos);
    return {
        meetings: meetings.slice(offset, offset + limit).map((m) => toMeetingListItem(m, counts.get(m.id))),
        total: meetings.length,
        limit,
        offset,
        projects: store.projects,
        teams: store.teams,
    };
}
export function buildMeetingDetailViewFromStore(store, meetingId) {
    const meeting = store.meetings.find((m) => m.id === meetingId);
    if (!meeting)
        return null;
    const peopleById = new Map(store.people.map((p) => [p.id, p]));
    const prospectsById = new Map(store.prospects.map((p) => [p.id, p]));
    return {
        meeting,
        todos: store.todos.filter((t) => t.meetingId === meetingId && t.status !== 'dismissed'),
        people: meeting.personIds
            .map((id) => peopleById.get(id))
            .filter((p) => Boolean(p))
            .map((p) => ({ id: p.id, displayName: p.displayName, emails: p.emails })),
        prospects: meeting.prospectIds
            .map((id) => prospectsById.get(id))
            .filter((p) => Boolean(p))
            .map((p) => ({ id: p.id, displayName: p.displayName })),
        projects: store.projects.filter((p) => meeting.projectIds.includes(p.id)),
        teams: store.teams.filter((t) => meeting.teamIds.includes(t.id)),
    };
}
export function buildPeopleViewFromStore(store, opts) {
    const q = opts?.q?.toLowerCase().trim();
    const meetingsByPerson = new Map();
    for (const m of store.meetings) {
        for (const pid of [...m.personIds, ...m.prospectIds]) {
            if (!meetingsByPerson.has(pid))
                meetingsByPerson.set(pid, []);
            meetingsByPerson.get(pid).push(m);
        }
    }
    function lastMeeting(personId) {
        const list = meetingsByPerson.get(personId);
        if (!list?.length)
            return undefined;
        return list.reduce((a, b) => ((a.startedAt ?? '') >= (b.startedAt ?? '') ? a : b));
    }
    const fromPeople = store.people.map((p) => {
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
    const fromProspects = store.prospects
        .filter((p) => !p.linkedPersonId)
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
        people = people.filter((p) => [p.displayName, ...p.emails].join(' ').toLowerCase().includes(q));
    }
    people.sort((a, b) => (b.lastMeetingAt ?? '').localeCompare(a.lastMeetingAt ?? '') || b.meetingCount - a.meetingCount);
    return { people, total: people.length, teams: store.teams, projects: store.projects };
}
export function buildBoardViewFromStore(store) {
    const todos = store.todos.filter((t) => t.status !== 'dismissed');
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
export function buildMaintenanceItemsFromStore(store) {
    const pending = listActivePendingSuggestions(store).map((row) => ({
        id: row.id,
        kind: row.kind,
        title: row.title,
        detail: row.detail,
        payload: row.payload,
        createdAt: row.createdAt,
        source: row.source,
        confidence: row.confidence,
    }));
    const derived = buildDerivedSuggestions(store)
        .filter((s) => s.kind !== 'accept_todo')
        .map((s) => ({ ...s }));
    const seen = new Set();
    const merged = [];
    for (const item of [...pending, ...derived]) {
        const key = `${item.kind}:${item.title}:${JSON.stringify(item.payload)}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        merged.push(item);
    }
    return merged;
}
export function buildMaintenanceViewFromStore(store) {
    const items = buildMaintenanceItemsFromStore(store);
    const counts = {};
    for (const item of items)
        counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    return { items, counts, total: items.length, generatedAt: new Date().toISOString() };
}
// --- Vistas por uid (una carga de store por request) ---
export async function getMeetingsView(uid, query) {
    const store = await loadStoreFromRepository(uid);
    return buildMeetingsViewFromStore(store, query);
}
export async function getMeetingDetailView(uid, meetingId) {
    const store = await loadStoreFromRepository(uid);
    return buildMeetingDetailViewFromStore(store, meetingId);
}
export async function getPeopleView(uid, opts) {
    const store = await loadStoreFromRepository(uid);
    return buildPeopleViewFromStore(store, opts);
}
export async function getBoardView(uid) {
    const store = await loadStoreFromRepository(uid);
    return buildBoardViewFromStore(store);
}
export async function getMaintenanceView(uid) {
    const store = await loadStoreFromRepository(uid);
    return buildMaintenanceViewFromStore(store);
}
async function loadLatestDigest(uid) {
    const snap = await digestsCol(uid).orderBy('date', 'desc').limit(1).get();
    if (snap.empty)
        return null;
    return snap.docs[0].data();
}
function pickDueTodos(todos, limit = 10) {
    const open = todos.filter((t) => t.status === 'open');
    const withDue = open
        .filter((t) => t.dueAt)
        .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
    const withoutDue = open
        .filter((t) => !t.dueAt)
        .sort((a, b) => {
        const prio = (t) => (t.priority === 'high' ? 0 : t.priority === 'normal' ? 1 : 2);
        return prio(a) - prio(b) || (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });
    return [...withDue, ...withoutDue].slice(0, limit);
}
export async function getDashboardView(uid) {
    const [store, settings, google, llmProviders, progress, smartSuggestions, digest] = await Promise.all([
        loadStoreFromRepository(uid),
        loadSettings(uid),
        hasGoogleIntegration(uid),
        listLlmProviders(uid),
        getSyncProgress(uid),
        listSmartSuggestions(uid, { status: 'pending', limit: 5 }),
        loadLatestDigest(uid),
    ]);
    const health = computeStoreHealth(store);
    const maintenanceCount = buildMaintenanceItemsFromStore(store).length;
    const counts = todoCountsByMeeting(store.todos);
    const recentMeetings = sortMeetingsByRecency(store.meetings)
        .slice(0, 8)
        .map((m) => toMeetingListItem(m, counts.get(m.id)));
    return {
        date: new Date().toISOString().slice(0, 10),
        digest,
        suggestions: smartSuggestions,
        dueTodos: pickDueTodos(store.todos),
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
        lastSyncAt: settings.syncSchedule?.lastRunAt,
    };
}
