import type { Meeting, Person } from './types.js';
import type { ParsedMirrorMd } from './parse-mirror-md.js';
import {
  cleanChipPersonName,
  displayNameFromEmail,
  isLikelyPersonName,
} from './person-name-clean.js';
import { participantsFromSourceFile } from './participants-from-source.js';

/** Nombres canónicos de asistentes: invitees con email primero; si no, heurística del mirror. */
export function buildCanonicalParticipantNames(
  parsed: ParsedMirrorMd,
  sourceFile: string,
): string[] {
  const fromInvitees = parsed.invitees
    .map((inv) => {
      const fromName = inv.name ? cleanChipPersonName(inv.name) : '';
      if (fromName.length >= 2) return fromName;
      return displayNameFromEmail(inv.email);
    })
    .filter(Boolean);

  if (fromInvitees.length > 0) {
    return [...new Set(fromInvitees)];
  }

  const fromYamlAndTitle = [...parsed.participants, ...participantsFromSourceFile(sourceFile)]
    .map((n) => cleanChipPersonName(n))
    .filter((n) => n.length >= 2 && isLikelyPersonName(n));

  return [...new Set(fromYamlAndTitle)];
}

/** IDs de contacto reales para una reunión (email primero; corrige personIds huérfanos). */
export function resolveMeetingPersonIds(meeting: Meeting, people: Person[]): string[] {
  const byEmail = new Map<string, string>();
  for (const p of people) {
    for (const e of p.emails ?? []) {
      byEmail.set(e.toLowerCase().trim(), p.id);
    }
  }
  const byId = new Map(people.map((p) => [p.id, p]));
  const ids: string[] = [];
  const push = (id: string | undefined) => {
    if (id && !ids.includes(id)) ids.push(id);
  };

  for (const email of meeting.participantEmails ?? []) {
    push(byEmail.get(email.toLowerCase().trim()));
  }

  for (const id of meeting.personIds ?? []) {
    if (byId.has(id)) push(id);
  }

  return ids;
}

export function mergeTodoPersonIds(
  assigneeIds: string[],
  meeting: Meeting | undefined,
  people: Person[],
): string[] {
  const ids = [...assigneeIds];
  if (meeting) {
    for (const pid of resolveMeetingPersonIds(meeting, people)) {
      if (!ids.includes(pid)) ids.push(pid);
    }
  }
  return ids;
}
