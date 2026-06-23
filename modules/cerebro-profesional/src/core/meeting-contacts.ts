import type { Meeting, Person, PersonProspect } from './models';
import type { ParsedMirrorMd } from './parse-mirror-md';
import { db } from './db';
import {
  cleanChipPersonName,
  displayNameFromEmail,
  normalizePersonNameKey,
} from './person-name-clean';
import { participantsFromSourceFile } from './participants-from-source';

export interface MeetingContactDisplay {
  person: Person;
  /** Emails de esta reunión (invitees / Drive) que coinciden con el contacto. */
  meetingEmails: string[];
  /** Todas las fuentes detectadas en el mirror para esos emails. */
  sources: string[];
}

export interface MeetingProspectDisplay {
  prospect: PersonProspect;
}

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

  const fromYamlAndTitle = [
    ...parsed.participants,
    ...participantsFromSourceFile(sourceFile),
  ]
    .map((n) => cleanChipPersonName(n))
    .filter(isLikelyParticipantName);

  return [...new Set(fromYamlAndTitle)];
}

function isLikelyParticipantName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return true;
  const key = normalizePersonNameKey(trimmed);
  if (key.length < 3) return false;
  return /^[A-ZÁÉÍÓÚÑ]/.test(trimmed);
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

export function meetingContactPeople(meeting: Meeting, people: Person[]): Person[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  return resolveMeetingPersonIds(meeting, people)
    .map((id) => byId.get(id))
    .filter((p): p is Person => Boolean(p));
}

/** Re-vincula personIds huérfanos usando participantEmails ↔ contactos. */
export async function repairMeetingPersonLinks(): Promise<number> {
  const people = await db.people.toArray();
  const meetings = await db.meetings.toArray();
  let updated = 0;
  for (const meeting of meetings) {
    const personIds = resolveMeetingPersonIds(meeting, people);
    const prev = meeting.personIds ?? [];
    if (personIds.join(',') === prev.join(',')) continue;
    await db.meetings.put({
      ...meeting,
      personIds,
      updatedAt: new Date().toISOString(),
    });
    updated++;
  }
  return updated;
}

export function meetingProspectsForDisplay(
  meeting: Meeting,
  prospects: PersonProspect[],
): PersonProspect[] {
  const ids = new Set(meeting.prospectIds ?? []);
  if (!ids.size) return [];
  return prospects.filter((p) => ids.has(p.id) && !p.linkedPersonId);
}

function sourceLabels(parsed: ParsedMirrorMd): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (email: string, label: string) => {
    const key = email.toLowerCase();
    const prev = map.get(key) ?? [];
    if (!prev.includes(label)) map.set(key, [...prev, label]);
  };
  for (const inv of parsed.invitees) add(inv.email, 'Invitado (Meet/Gemini)');
  for (const s of parsed.sharedWith) add(s.email, 'Drive');
  if (parsed.ownerEmail) add(parsed.ownerEmail, 'Propietario del doc');
  for (const e of parsed.mentionedEmails) add(e, 'Mencionado en notas');
  return map;
}

export function buildMeetingContactDisplays(
  meeting: Meeting,
  people: Person[],
  parsed: ParsedMirrorMd,
): MeetingContactDisplay[] {
  const labels = sourceLabels(parsed);
  const contacts = meetingContactPeople(meeting, people);

  return contacts.map((person) => {
    const personEmailSet = new Set((person.emails ?? []).map((e) => e.toLowerCase()));
    const meetingEmails = [...personEmailSet].filter((e) =>
      parsed.invitees.some((inv) => inv.email.toLowerCase() === e) ||
      parsed.sharedWith.some((s) => s.email.toLowerCase() === e) ||
      parsed.ownerEmail?.toLowerCase() === e ||
      parsed.mentionedEmails.includes(e),
    );
    const sources = new Set<string>();
    for (const e of meetingEmails) {
      for (const src of labels.get(e) ?? []) sources.add(src);
    }
    if (sources.size === 0 && person.emails?.length) {
      sources.add('Contacto vinculado');
    }
    return {
      person,
      meetingEmails: meetingEmails.length ? meetingEmails : [...(person.emails ?? [])],
      sources: [...sources],
    };
  });
}

/** personIds para un to-do: asignatario primero, luego contactos de la reunión. */
export function mergeTodoPersonIds(
  assigneeIds: string[],
  meeting: Meeting | undefined,
  people: Person[],
): string[] {
  const ordered: string[] = [];
  const push = (id: string) => {
    if (id && !ordered.includes(id)) ordered.push(id);
  };
  for (const id of assigneeIds) push(id);
  if (meeting) {
    for (const id of resolveMeetingPersonIds(meeting, people)) push(id);
  }
  return ordered;
}
