import type { Meeting, MeetingTodo, PersonListItem } from './types.js';
import { resolveMeetingStartedAt } from './meeting-dates.js';

/** Parse ISO-ish date strings to epoch ms; null if missing/invalid. */
export function parseRecencyTime(iso?: string): number | null {
  if (!iso?.trim()) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Devuelve el ISO más reciente entre candidatos (p. ej. fuentes de última sync). */
export function pickLatestIso(...candidates: (string | undefined | null)[]): string | undefined {
  let best: string | undefined;
  let bestMs = 0;
  for (const iso of candidates) {
    if (!iso) continue;
    const ms = Date.parse(iso);
    if (Number.isFinite(ms) && ms >= bestMs) {
      bestMs = ms;
      best = iso;
    }
  }
  return best;
}

export type MeetingSortKey =
  | 'date_desc'
  | 'date_asc'
  | 'synced_desc'
  | 'synced_asc'
  | 'title_asc';

export const MEETING_SORT_OPTIONS: Array<{ value: MeetingSortKey; label: string }> = [
  { value: 'date_desc', label: 'Fecha reunión (más reciente)' },
  { value: 'date_asc', label: 'Fecha reunión (más antigua)' },
  { value: 'synced_desc', label: 'Sincronización (más reciente)' },
  { value: 'synced_asc', label: 'Sincronización (más antigua)' },
  { value: 'title_asc', label: 'Título (A → Z)' },
];

export function parseMeetingSortKey(raw?: string): MeetingSortKey {
  if (raw === 'date_asc' || raw === 'synced_desc' || raw === 'synced_asc' || raw === 'title_asc') {
    return raw;
  }
  return 'date_desc';
}

export type MeetingForSort = Pick<
  Meeting,
  'id' | 'title' | 'startedAt' | 'updatedAt' | 'lastSyncedAt' | 'sourceFile'
>;

/** Fecha en que ocurrió la reunión (startedAt resuelto desde archivo/título/store). */
export function meetingDateTimestamp(m: MeetingForSort): number {
  return parseRecencyTime(resolveMeetingStartedAt(m)) ?? 0;
}

/** Cuándo se sincronizó por última vez al cerebro. */
export function meetingSyncedTimestamp(m: MeetingForSort): number {
  return parseRecencyTime(m.lastSyncedAt) ?? parseRecencyTime(m.updatedAt) ?? 0;
}

/** @deprecated Use meetingDateTimestamp — mantiene compat con código existente. */
export function meetingRecencyTimestamp(m: MeetingForSort): number {
  const date = meetingDateTimestamp(m);
  if (date > 0) return date;
  return meetingSyncedTimestamp(m);
}

export function compareMeetings(a: MeetingForSort, b: MeetingForSort, sort: MeetingSortKey = 'date_desc'): number {
  let cmp = 0;
  switch (sort) {
    case 'date_desc':
      cmp = meetingDateTimestamp(b) - meetingDateTimestamp(a);
      break;
    case 'date_asc':
      cmp = meetingDateTimestamp(a) - meetingDateTimestamp(b);
      break;
    case 'synced_desc':
      cmp = meetingSyncedTimestamp(b) - meetingSyncedTimestamp(a);
      break;
    case 'synced_asc':
      cmp = meetingSyncedTimestamp(a) - meetingSyncedTimestamp(b);
      break;
    case 'title_asc':
      cmp = a.title.localeCompare(b.title, 'es');
      break;
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
  if (cmp !== 0) return cmp;
  return a.id.localeCompare(b.id);
}

/** Más reciente primero por fecha de reunión (default histórico). */
export function compareMeetingsByRecency(a: MeetingForSort, b: MeetingForSort): number {
  return compareMeetings(a, b, 'date_desc');
}

export function sortMeetings<T extends MeetingForSort>(meetings: T[], sort: MeetingSortKey = 'date_desc'): T[] {
  return [...meetings].sort((a, b) => compareMeetings(a, b, sort));
}

export function sortMeetingsByRecency<T extends MeetingForSort>(meetings: T[]): T[] {
  return sortMeetings(meetings, 'date_desc');
}

/** Tareas: reunión más reciente primero; boardPosition explícito (>0) gana. */
export function todoRecencyTimestamp(t: Pick<MeetingTodo, 'meetingStartedAt' | 'updatedAt' | 'createdAt'>): number {
  return (
    parseRecencyTime(t.meetingStartedAt) ??
    parseRecencyTime(t.updatedAt) ??
    parseRecencyTime(t.createdAt) ??
    0
  );
}

export function compareTodosByRecency(
  a: Pick<MeetingTodo, 'id' | 'meetingStartedAt' | 'updatedAt' | 'createdAt' | 'boardPosition' | 'status' | 'completedAt'>,
  b: Pick<MeetingTodo, 'id' | 'meetingStartedAt' | 'updatedAt' | 'createdAt' | 'boardPosition' | 'status' | 'completedAt'>,
): number {
  if (a.status === 'done' && b.status === 'done') {
    const ca = parseRecencyTime(a.completedAt) ?? todoRecencyTimestamp(a);
    const cb = parseRecencyTime(b.completedAt) ?? todoRecencyTimestamp(b);
    if (ca !== cb) return cb - ca;
  }

  const pa = a.boardPosition ?? 0;
  const pb = b.boardPosition ?? 0;
  if (pa > 0 && pb > 0 && pa !== pb) return pb - pa;

  const ta = todoRecencyTimestamp(a);
  const tb = todoRecencyTimestamp(b);
  if (ta !== tb) return tb - ta;
  return a.id.localeCompare(b.id);
}

export function sortTodosByRecency<T extends Parameters<typeof compareTodosByRecency>[0]>(todos: T[]): T[] {
  return [...todos].sort(compareTodosByRecency);
}

export function comparePeopleByLastMeeting(a: PersonListItem, b: PersonListItem): number {
  const ta = parseRecencyTime(a.lastMeetingAt) ?? 0;
  const tb = parseRecencyTime(b.lastMeetingAt) ?? 0;
  if (ta !== tb) return tb - ta;
  if (a.meetingCount !== b.meetingCount) return b.meetingCount - a.meetingCount;
  return a.displayName.localeCompare(b.displayName, 'es');
}

export function sortPeopleByLastMeeting(people: PersonListItem[]): PersonListItem[] {
  return [...people].sort(comparePeopleByLastMeeting);
}
