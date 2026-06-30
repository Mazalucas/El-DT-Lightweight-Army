import { sortMeetingsByRecency } from './meeting-sort.js';
import { looksLikeTeamEmail } from '../core/profesional/team-email-index.js';
import { enrichMeetings, resolveMeetingStartedAt } from '../shared/meeting-dates.js';
import type {
  CalendarEventItem,
  CalendarTodayView,
  CerebroStore,
  Meeting,
  MeetingPrepEvidence,
  MeetingPrepFact,
  MeetingPrepFactChip,
  MeetingPrepFactKind,
  MeetingPrepInsight,
  MeetingTodo,
  Person,
} from '../shared/types.js';

const MAX_EVENTS_WITH_INSIGHTS = 5;
const MAX_FACTS_PER_EVENT = 3;
const MAX_TODOS_PER_PERSON = 2;
const PRIORITY_WINDOW_MS = 4 * 3600_000;

const FACT_KIND_ORDER: Record<MeetingPrepFactKind, number> = {
  open_commitment: 0,
  same_people: 1,
  recurring_series: 2,
  same_project: 3,
};

/** Normaliza título de evento para agrupar series sin recurringEventId. */
export function normalizeCalendarTitle(title: string): string {
  return title
    .replace(/^(re:\s*)+/gi, '')
    .replace(/\b\d{4}[\s.\-/]\d{1,2}[\s.\-/]\d{1,2}\b/g, '')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPersonEmailIndex(people: Person[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of people) {
    for (const raw of p.emails) {
      const email = raw.toLowerCase().trim();
      if (email && !looksLikeTeamEmail(email)) map.set(email, p.id);
    }
  }
  return map;
}

function personName(store: CerebroStore, personId: string): string {
  return store.people.find((p) => p.id === personId)?.displayName ?? personId;
}

function projectName(store: CerebroStore, projectId: string): string {
  return store.projects.find((p) => p.id === projectId)?.name ?? projectId;
}

function formatDate(iso?: string): string {
  if (!iso) return 'sin fecha';
  return iso.slice(0, 10).split('-').reverse().join('/');
}

function resolvePersonIdsForEvent(
  event: CalendarEventItem,
  store: CerebroStore,
  emailIndex: Map<string, string>,
): string[] {
  const ids = new Set<string>();
  for (const email of event.attendeeEmails ?? []) {
    const pid = emailIndex.get(email.toLowerCase().trim());
    if (pid) ids.add(pid);
  }
  if (event.linkedMeetingId) {
    const linked = store.meetings.find((m) => m.id === event.linkedMeetingId);
    for (const pid of linked?.personIds ?? []) ids.add(pid);
  }
  return [...ids];
}

function openTodosForPerson(store: CerebroStore, personId: string): MeetingTodo[] {
  return store.todos
    .filter(
      (t) =>
        (t.status === 'open' || t.status === 'suggested') &&
        (t.assigneePersonIds?.includes(personId) || t.personIds.includes(personId)),
    )
    .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'));
}

function pastMeetingsWithPersonOverlap(
  store: CerebroStore,
  personIds: string[],
  beforeMs: number,
  excludeMeetingId?: string,
): Meeting[] {
  if (!personIds.length) return [];
  const set = new Set(personIds);
  return sortMeetingsByRecency(enrichMeetings(store.meetings)).filter((m) => {
    if (m.id === excludeMeetingId) return false;
    const started = resolveMeetingStartedAt(m);
    if (!started || new Date(started).getTime() >= beforeMs) return false;
    return m.personIds.some((pid) => set.has(pid));
  });
}

function pastMeetingsByNormalizedTitle(
  store: CerebroStore,
  normalizedTitle: string,
  beforeMs: number,
): Meeting[] {
  if (!normalizedTitle) return [];
  return sortMeetingsByRecency(enrichMeetings(store.meetings)).filter((m) => {
    const started = resolveMeetingStartedAt(m);
    if (!started || new Date(started).getTime() >= beforeMs) return false;
    const mt = normalizeCalendarTitle(m.title);
    return mt === normalizedTitle || mt.includes(normalizedTitle) || normalizedTitle.includes(mt);
  });
}

function sharedProjectIds(store: CerebroStore, personIds: string[]): string[] {
  const counts = new Map<string, number>();
  for (const pid of personIds) {
    const person = store.people.find((p) => p.id === pid);
    for (const proj of person?.projectIds ?? []) {
      counts.set(proj, (counts.get(proj) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 1)
    .map(([id]) => id);
}

function prioritizeEvents(events: CalendarEventItem[], now: Date): CalendarEventItem[] {
  const upcoming = events.filter((e) => e.status !== 'past');
  const t = now.getTime();
  return [...upcoming].sort((a, b) => {
    const aStart = new Date(a.startAt).getTime();
    const bStart = new Date(b.startAt).getTime();
    const aSoon = aStart - t <= PRIORITY_WINDOW_MS;
    const bSoon = bStart - t <= PRIORITY_WINDOW_MS;
    if (aSoon !== bSoon) return aSoon ? -1 : 1;
    return aStart - bStart;
  });
}

function recurrenceLabel(recurrence?: string[]): string | undefined {
  if (!recurrence?.length) return undefined;
  const rule = recurrence.join(' ');
  if (/FREQ=DAILY/i.test(rule)) return 'diaria';
  if (/FREQ=WEEKLY/i.test(rule)) return 'semanal';
  if (/FREQ=MONTHLY/i.test(rule)) return 'mensual';
  return 'recurrente';
}

export function buildMeetingPrepFacts(
  calendar: CalendarTodayView,
  store: CerebroStore,
  operatorEmail: string,
): MeetingPrepFact[] {
  if (!calendar.hasCalendarAccess || !calendar.events.length) return [];

  const emailIndex = buildPersonEmailIndex(store.people);
  const now = Date.now();
  const prioritized = prioritizeEvents(calendar.events, new Date()).slice(0, MAX_EVENTS_WITH_INSIGHTS);
  const facts: MeetingPrepFact[] = [];

  for (const event of prioritized) {
    const eventMs = new Date(event.startAt).getTime();
    const personIds = resolvePersonIdsForEvent(event, store, emailIndex);
    const eventFacts: MeetingPrepFact[] = [];

    if (personIds.length) {
      const past = pastMeetingsWithPersonOverlap(store, personIds, eventMs, event.linkedMeetingId);
      const last = past[0];
      if (last) {
        const names = personIds.map((id) => personName(store, id)).join(', ');
        const lastDate = formatDate(resolveMeetingStartedAt(last));
        eventFacts.push({
          kind: 'same_people',
          calendarEventId: event.id,
          relatedMeetingIds: [last.id],
          relatedPersonIds: personIds.filter((id) => last.personIds.includes(id)),
          summaryHint: `Invitados conocidos (${names}). Última reunión conjunta: «${last.title}» (${lastDate}).`,
        });
      }
    }

    const normalizedTitle = normalizeCalendarTitle(event.title);
    const seriesPast = pastMeetingsByNormalizedTitle(store, normalizedTitle, eventMs);
    const seriesLabel = recurrenceLabel(event.recurrence) ?? (event.isRecurring ? 'recurrente' : undefined);
    const lastSeries = seriesPast[0];
    if (lastSeries && (event.isRecurring || event.recurringEventId || seriesPast.length >= 2)) {
      eventFacts.push({
        kind: 'recurring_series',
        calendarEventId: event.id,
        relatedMeetingIds: seriesPast.slice(0, 3).map((m) => m.id),
        summaryHint: seriesLabel
          ? `Serie ${seriesLabel} «${event.title}». Última vez: «${lastSeries.title}» (${formatDate(resolveMeetingStartedAt(lastSeries))}).`
          : `Reunión repetida «${event.title}». Última vez: «${lastSeries.title}» (${formatDate(resolveMeetingStartedAt(lastSeries))}).`,
      });
    }

    const projectIds = new Set<string>();
    if (event.linkedMeetingId) {
      const linked = store.meetings.find((m) => m.id === event.linkedMeetingId);
      for (const pid of linked?.projectIds ?? []) projectIds.add(pid);
    }
    for (const pid of sharedProjectIds(store, personIds)) projectIds.add(pid);
    if (projectIds.size) {
      const projList = [...projectIds];
      const relatedMeetings = sortMeetingsByRecency(enrichMeetings(store.meetings)).filter(
        (m) => m.projectIds.some((p) => projectIds.has(p)) && resolveMeetingStartedAt(m) && new Date(resolveMeetingStartedAt(m)!).getTime() < eventMs,
      );
      const projNames = projList.map((id) => projectName(store, id)).join(', ');
      eventFacts.push({
        kind: 'same_project',
        calendarEventId: event.id,
        relatedProjectIds: projList,
        relatedMeetingIds: relatedMeetings.slice(0, 2).map((m) => m.id),
        summaryHint: `Proyecto(s): ${projNames}.${relatedMeetings[0] ? ` Reunión previa del proyecto: «${relatedMeetings[0].title}» (${formatDate(resolveMeetingStartedAt(relatedMeetings[0]))}).` : ''}`,
      });
    }

    const todoIds: string[] = [];
    const todoHints: string[] = [];
    for (const pid of personIds) {
      const todos = openTodosForPerson(store, pid).slice(0, MAX_TODOS_PER_PERSON);
      for (const t of todos) {
        todoIds.push(t.id);
        todoHints.push(`${personName(store, pid)}: «${t.text}»${t.dueAt ? ` (vence ${formatDate(t.dueAt)})` : ''}`);
      }
    }
    if (event.linkedMeetingId) {
      const fromMeeting = store.todos.filter(
        (t) =>
          t.meetingId === event.linkedMeetingId &&
          (t.status === 'open' || t.status === 'suggested') &&
          !todoIds.includes(t.id),
      );
      for (const t of fromMeeting.slice(0, 2)) {
        todoIds.push(t.id);
        todoHints.push(`De reunión vinculada: «${t.text}»`);
      }
    }
    if (todoHints.length) {
      eventFacts.push({
        kind: 'open_commitment',
        calendarEventId: event.id,
        relatedPersonIds: personIds,
        relatedTodoIds: todoIds,
        summaryHint: `Pendientes: ${todoHints.join('; ')}.`,
      });
    }

    const sorted = [...eventFacts].sort((a, b) => FACT_KIND_ORDER[a.kind] - FACT_KIND_ORDER[b.kind]);
    facts.push(...sorted.slice(0, MAX_FACTS_PER_EVENT));
  }

  return facts;
}

function factsByEvent(facts: MeetingPrepFact[]): Map<string, MeetingPrepFact[]> {
  const map = new Map<string, MeetingPrepFact[]>();
  for (const f of facts) {
    const list = map.get(f.calendarEventId) ?? [];
    list.push(f);
    map.set(f.calendarEventId, list);
  }
  return map;
}

function buildEvidenceForFact(store: CerebroStore, f: MeetingPrepFact): MeetingPrepEvidence[] {
  const evidence: MeetingPrepEvidence[] = [];
  const seen = new Set<string>();
  const push = (type: MeetingPrepEvidence['type'], id: string, label: string) => {
    const key = `${type}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    evidence.push({ type, id, label });
  };
  for (const mid of f.relatedMeetingIds ?? []) {
    const m = store.meetings.find((x) => x.id === mid);
    push('meeting', mid, m?.title ?? mid);
  }
  for (const pid of f.relatedPersonIds ?? []) {
    push('person', pid, personName(store, pid));
  }
  for (const tid of f.relatedTodoIds ?? []) {
    const t = store.todos.find((x) => x.id === tid);
    push('todo', tid, t?.text?.slice(0, 80) ?? tid);
  }
  for (const proj of f.relatedProjectIds ?? []) {
    push('project', proj, projectName(store, proj));
  }
  return evidence;
}

function buildEvidence(store: CerebroStore, facts: MeetingPrepFact[]): MeetingPrepEvidence[] {
  const evidence: MeetingPrepEvidence[] = [];
  const seen = new Set<string>();
  for (const f of facts) {
    for (const ev of buildEvidenceForFact(store, f)) {
      const key = `${ev.type}:${ev.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      evidence.push(ev);
    }
  }
  return evidence;
}

/** Un chip determinístico por hecho verificado. */
export function buildFactChip(f: MeetingPrepFact, store: CerebroStore, event?: CalendarEventItem): MeetingPrepFactChip | null {
  if (f.kind === 'same_people' && f.relatedMeetingIds?.[0]) {
    const m = store.meetings.find((x) => x.id === f.relatedMeetingIds![0]);
    const names = (f.relatedPersonIds ?? []).map((id) => personName(store, id)).join(', ');
    if (!names || !m) return null;
    return {
      kind: f.kind,
      label: `Con ${names} — última: «${m.title}» (${formatDate(resolveMeetingStartedAt(m))})`,
      evidence: buildEvidenceForFact(store, f),
    };
  }
  if (f.kind === 'recurring_series' && f.relatedMeetingIds?.[0]) {
    const m = store.meetings.find((x) => x.id === f.relatedMeetingIds![0]);
    if (!m) return null;
    const seriesLabel = recurrenceLabel(event?.recurrence) ?? (event?.isRecurring ? 'recurrente' : 'serie');
    return {
      kind: f.kind,
      label: `Serie ${seriesLabel} — última: «${m.title}» (${formatDate(resolveMeetingStartedAt(m))})`,
      evidence: buildEvidenceForFact(store, f),
    };
  }
  if (f.kind === 'same_project' && f.relatedProjectIds?.length) {
    const names = f.relatedProjectIds.map((id) => projectName(store, id)).join(', ');
    const lastMeeting = f.relatedMeetingIds?.[0]
      ? store.meetings.find((x) => x.id === f.relatedMeetingIds![0])
      : undefined;
    const datePart = lastMeeting ? ` — última reunión: ${formatDate(resolveMeetingStartedAt(lastMeeting))}` : '';
    return {
      kind: f.kind,
      label: `Proyecto ${names}${datePart}`,
      evidence: buildEvidenceForFact(store, f),
    };
  }
  if (f.kind === 'open_commitment' && f.relatedTodoIds?.length) {
    const t = store.todos.find((x) => x.id === f.relatedTodoIds![0]);
    if (!t) return null;
    const extra = f.relatedTodoIds.length > 1 ? ` (+${f.relatedTodoIds.length - 1} más)` : '';
    return {
      kind: f.kind,
      label: `Pendiente: «${t.text.slice(0, 100)}»${extra}`,
      evidence: buildEvidenceForFact(store, f),
    };
  }
  return null;
}

/** Insights determinísticos con chips (sin redacción LLM). */
export function buildTemplateMeetingPrepInsights(
  facts: MeetingPrepFact[],
  events: CalendarEventItem[],
  store: CerebroStore,
): MeetingPrepInsight[] {
  if (!facts.length) return [];
  const byEvent = factsByEvent(facts);
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const insights: MeetingPrepInsight[] = [];

  for (const [eventId, eventFacts] of byEvent) {
    const event = eventMap.get(eventId);
    if (!event) continue;

    const sortedFacts = [...eventFacts].sort((a, b) => FACT_KIND_ORDER[a.kind] - FACT_KIND_ORDER[b.kind]);
    const factChips: MeetingPrepFactChip[] = [];
    for (const f of sortedFacts) {
      const chip = buildFactChip(f, store, event);
      if (chip) factChips.push(chip);
    }
    if (!factChips.length) continue;

    insights.push({
      calendarEventId: eventId,
      eventTitle: event.title,
      eventStart: event.startAt,
      factChips,
      evidence: buildEvidence(store, eventFacts),
    });
  }

  return insights.slice(0, MAX_EVENTS_WITH_INSIGHTS);
}

export interface RawMeetingPrepInsight {
  calendarEventId?: string;
  headline?: string;
  bullets?: string[];
}

/** @deprecated LLM ya no redacta meeting prep; delega al template determinístico. */
export function mergeMeetingPrepInsights(
  _raw: RawMeetingPrepInsight[],
  facts: MeetingPrepFact[],
  events: CalendarEventItem[],
  store: CerebroStore,
): MeetingPrepInsight[] {
  return buildTemplateMeetingPrepInsights(facts, events, store);
}

/** Calcula insights en vivo desde calendario + store. */
export function computeLiveMeetingPrepInsights(
  calendar: CalendarTodayView,
  store: CerebroStore,
  operatorEmail: string,
): MeetingPrepInsight[] {
  const facts = buildMeetingPrepFacts(calendar, store, operatorEmail);
  const upcoming = calendar.events.filter((e) => e.status !== 'past');
  return buildTemplateMeetingPrepInsights(facts, upcoming, store);
}
