import type { Meeting, Person } from './types.js';
import type { ParsedMirrorMd } from './parse-mirror-md.js';

export function collectParticipantEmails(parsed: ParsedMirrorMd): string[] {
  const emails = new Set<string>();
  for (const inv of parsed.invitees) {
    if (inv.email) emails.add(inv.email.toLowerCase().trim());
  }
  for (const s of parsed.sharedWith) {
    if (s.email) emails.add(s.email.toLowerCase().trim());
  }
  for (const e of parsed.mentionedEmails) {
    if (e) emails.add(e.toLowerCase().trim());
  }
  if (parsed.ownerEmail) emails.add(parsed.ownerEmail.toLowerCase().trim());
  return [...emails];
}

export function meetingInvolvesPerson(meeting: Meeting, person: Person): boolean {
  if (meeting.personIds.includes(person.id)) return true;
  const personEmails = new Set((person.emails ?? []).map((e) => e.toLowerCase().trim()));
  if (!personEmails.size) return false;
  return (meeting.participantEmails ?? []).some((e) => personEmails.has(e.toLowerCase()));
}

export function meetingsForPerson(person: Person, meetings: Meeting[]): Meeting[] {
  return meetings.filter((m) => meetingInvolvesPerson(m, person));
}
