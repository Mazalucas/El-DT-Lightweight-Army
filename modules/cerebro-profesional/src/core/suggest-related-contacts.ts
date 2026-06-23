import { resolveMeetingPersonIds } from './meeting-contacts';
import type { Meeting, Person } from './models';

export interface RelatedContactSuggestion {
  person: Person;
  /** Reuniones donde estuvieron juntos todos los miembros actuales + esta persona. */
  meetingCount: number;
}

/**
 * Sugiere contactos que suelen coincidir en reuniones con el conjunto actual de miembros.
 * Ej.: equipo {A, B} → C, D si comparten reuniones donde participan A, B y C/D.
 */
export function suggestRelatedContacts(
  memberIds: string[],
  allPeople: Person[],
  meetings: Meeting[],
  opts?: { limit?: number; minMeetings?: number },
): RelatedContactSuggestion[] {
  const limit = opts?.limit ?? 8;
  const minMeetings = opts?.minMeetings ?? 1;
  const memberSet = new Set(memberIds.filter(Boolean));
  if (memberSet.size === 0) return [];

  const peopleById = new Map(allPeople.map((p) => [p.id, p]));
  const required = [...memberSet];
  const counts = new Map<string, number>();

  for (const meeting of meetings) {
    const participants = new Set(resolveMeetingPersonIds(meeting, allPeople));
    if (!required.every((id) => participants.has(id))) continue;

    for (const pid of participants) {
      if (memberSet.has(pid)) continue;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= minMeetings)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, meetingCount]) => {
      const person = peopleById.get(id);
      return person ? { person, meetingCount } : null;
    })
    .filter((s): s is RelatedContactSuggestion => s !== null);
}
