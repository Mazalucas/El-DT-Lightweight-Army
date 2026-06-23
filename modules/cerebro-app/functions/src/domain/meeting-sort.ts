import type { Meeting } from '../shared/types.js';

function parseMeetingTime(iso?: string): number | null {
  if (!iso?.trim()) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Timestamp for ordering: startedAt → updatedAt → 0 (sin fecha al final). */
export function meetingRecencyTimestamp(m: Meeting): number {
  return parseMeetingTime(m.startedAt) ?? parseMeetingTime(m.updatedAt) ?? 0;
}

/** Más reciente primero; reuniones sin fecha al final; desempate por título e id. */
export function compareMeetingsByRecency(a: Meeting, b: Meeting): number {
  const ta = meetingRecencyTimestamp(a);
  const tb = meetingRecencyTimestamp(b);
  if (ta !== tb) return tb - ta;
  const titleCmp = a.title.localeCompare(b.title, 'es');
  if (titleCmp !== 0) return titleCmp;
  return a.id.localeCompare(b.id);
}

export function sortMeetingsByRecency<T extends Meeting>(meetings: T[]): T[] {
  return [...meetings].sort(compareMeetingsByRecency);
}
