import type { Meeting, Person, Project, Team } from './models';
import { consolidatePeopleRecords, remapPersonIds } from './consolidate-people';
import {
  isValidContact,
  mergePersonPreservingManual,
} from './merge-person-incremental';
import { parseMirrorMarkdown } from './parse-mirror-md';
import { buildCanonicalParticipantNames, resolveMeetingPersonIds } from './meeting-contacts';
import { collectParticipantEmails } from './meeting-participation';
import { ProspectResolver } from './prospect-resolver';
import { collectSignalsFromMirror, PersonResolver, extractTranscriptSection } from './resolve-person';
import { db } from './db';
import { slugId } from './parse-mirror-md';

export interface MirrorFileDto {
  id: string;
  content: string;
}

export interface ReindexResult {
  meetings: number;
  people: number;
  prospects: number;
  consolidated: number;
  pruned: number;
  mirrorDuplicates: number;
  linksRepaired: number;
}

function indexPeopleByEmail(people: Person[]): Map<string, Person> {
  const map = new Map<string, Person>();
  for (const p of people) {
    for (const e of p.emails ?? []) map.set(e.toLowerCase(), p);
  }
  return map;
}

/** Evita procesar dos veces el mismo Google Doc en mirror (misma docId, distinto archivo). */
function dedupeMirrorFilesByDocId(files: MirrorFileDto[]): {
  files: MirrorFileDto[];
  duplicates: number;
} {
  const byDocId = new Map<string, MirrorFileDto>();
  const withoutDoc: MirrorFileDto[] = [];

  for (const file of files) {
    const fm = parseMirrorMarkdown(file.content).frontmatter;
    const docId = typeof fm.docId === 'string' ? fm.docId : undefined;
    if (docId) {
      const prev = byDocId.get(docId);
      if (!prev || file.content.length > prev.content.length) {
        byDocId.set(docId, file);
      }
    } else {
      withoutDoc.push(file);
    }
  }

  const docMeetingIds = new Set(
    [...byDocId.values()].map((f) => {
      const fm = parseMirrorMarkdown(f.content).frontmatter;
      return String(fm.meetingId ?? f.id);
    }),
  );
  const filteredNoDoc = withoutDoc.filter((f) => {
    const fm = parseMirrorMarkdown(f.content).frontmatter;
    const id = String(fm.meetingId ?? f.id);
    return !docMeetingIds.has(id);
  });

  const duplicates = files.length - byDocId.size - filteredNoDoc.length;
  return { files: [...byDocId.values(), ...filteredNoDoc], duplicates };
}

export async function reindexFromMirror(files: MirrorFileDto[], teams: Team[]): Promise<ReindexResult> {
  const { files: uniqueFiles, duplicates: mirrorDuplicates } = dedupeMirrorFilesByDocId(files);
  const existingAll = await db.people.toArray();
  const withEmail = existingAll.filter(isValidContact);
  const { people: seeded, idRemap: preRemap } = consolidatePeopleRecords(withEmail);

  const resolver = new PersonResolver(seeded);
  const existingProspects = await db.prospects.toArray();
  const prospectResolver = new ProspectResolver(
    existingProspects.filter((p) => !p.linkedPersonId),
  );

  const projectsMap = new Map<string, Project>();
  for (const p of await db.projects.toArray()) projectsMap.set(p.id, p);

  let meetingCount = 0;
  const writtenMeetingIds = new Set<string>();

  for (const file of uniqueFiles) {
    const parsed = parseMirrorMarkdown(file.content);
    const fm = parsed.frontmatter;
    const meetingId = String(fm.meetingId ?? file.id);
    const title = String(fm.title ?? meetingId);
    const sourceFile = String(fm.sourceFile ?? '');
    const participantEmails = collectParticipantEmails(parsed);
    const seenAt =
      typeof fm.startedAt === 'string' ? fm.startedAt : new Date().toISOString();
    const participantNames = buildCanonicalParticipantNames(parsed, sourceFile);

    const signals = collectSignalsFromMirror({
      participants: parsed.participants,
      participantNames,
      invitees: parsed.invitees,
      mentionedEmails: parsed.mentionedEmails,
      sharedWith: parsed.sharedWith,
      ownerEmail: parsed.ownerEmail,
      body: parsed.body,
    });

    const personIds: string[] = [];
    const prospectIds: string[] = [];

    for (const signal of signals) {
      if (signal.email) {
        const id = resolver.resolve(signal);
        if (id && !personIds.includes(id)) personIds.push(id);
      } else if (signal.name?.trim()) {
        const pid = prospectResolver.record(
          signal.name,
          meetingId,
          signal.source,
          signal.name,
        );
        if (pid && !prospectIds.includes(pid)) prospectIds.push(pid);
      }
    }

    for (const email of participantEmails) {
      const id = resolver.resolve({ email, source: 'invite', seenAt });
      if (id && !personIds.includes(id)) personIds.push(id);
    }

    const projectIds = inferProjects(title, projectsMap);
    const fromFm = typeof fm.teamId === 'string' ? [String(fm.teamId)] : [];
    const inferred = inferTeams(title, teams);
    const existing = await db.meetings.get(meetingId);

    const meeting: Meeting = {
      id: meetingId,
      docId: typeof fm.docId === 'string' ? fm.docId : undefined,
      sourceFile: String(fm.sourceFile ?? ''),
      title,
      startedAt: typeof fm.startedAt === 'string' ? fm.startedAt : undefined,
      timezone: typeof fm.timezone === 'string' ? fm.timezone : undefined,
      summary: parsed.summary ?? existing?.summary,
      participants: participantNames,
      participantEmails,
      personIds: remapPersonIds(personIds, preRemap),
      prospectIds,
      teamIds: existing?.teamIds?.length
        ? existing.teamIds
        : [...new Set([...fromFm, ...inferred])],
      projectIds: mergeIds(projectIds, existing?.projectIds),
      syncStatus: 'synced',
      analysisStatus: existing?.analysisStatus ?? 'pending',
      bodyPreview: buildSearchPreview(parsed.body) || existing?.bodyPreview,
      updatedAt: new Date().toISOString(),
    };

    await db.meetings.put(meeting);
    writtenMeetingIds.add(meetingId);
    meetingCount++;
  }

  const byDocId = new Map<string, Meeting[]>();
  for (const m of await db.meetings.toArray()) {
    if (!m.docId) continue;
    const list = byDocId.get(m.docId) ?? [];
    list.push(m);
    byDocId.set(m.docId, list);
  }
  for (const group of byDocId.values()) {
    if (group.length <= 1) continue;
    const keep = group.find((m) => writtenMeetingIds.has(m.id)) ?? group[0];
    for (const m of group) {
      if (m.id !== keep.id) await db.meetings.delete(m.id);
    }
  }

  if (preRemap.size > 0) {
    const meetings = await db.meetings.toArray();
    for (const m of meetings) {
      const nextIds = remapPersonIds(m.personIds, preRemap);
      if (nextIds.join(',') !== m.personIds.join(',')) {
        await db.meetings.put({ ...m, personIds: nextIds, updatedAt: new Date().toISOString() });
      }
    }
  }

  const existingById = new Map(existingAll.map((p) => [p.id, p]));
  const existingByEmail = indexPeopleByEmail(existingAll);
  const nextPeople = new Map<string, Person>();

  for (const incoming of resolver.getAll().filter(isValidContact)) {
    let existing: Person | undefined;
    for (const e of incoming.emails) {
      existing = existingByEmail.get(e.toLowerCase());
      if (existing) break;
    }
    existing ??= existingById.get(incoming.id);

    if (existing) {
      nextPeople.set(existing.id, mergePersonPreservingManual(existing, incoming));
    } else {
      nextPeople.set(incoming.id, incoming);
    }
  }

  for (const existing of existingAll) {
    if (!isValidContact(existing)) continue;
    if (nextPeople.has(existing.id)) continue;
    // Conservar contactos locales (manual, merges, equipos) aunque no estén en el mirror.
    nextPeople.set(existing.id, existing);
  }

  const pruned = existingAll.filter(isValidContact).length - nextPeople.size;

  await db.people.clear();
  if (nextPeople.size) await db.people.bulkPut([...nextPeople.values()]);

  const linkedProspects = existingProspects.filter((p) => p.linkedPersonId);
  const activeProspects = prospectResolver.getAll();
  await db.prospects.clear();
  await db.prospects.bulkPut([...linkedProspects, ...activeProspects]);

  await db.projects.bulkPut([...projectsMap.values()]);

  const finalPeople = [...nextPeople.values()];
  let linksRepaired = 0;
  for (const meeting of await db.meetings.toArray()) {
    const personIds = resolveMeetingPersonIds(meeting, finalPeople);
    const prev = meeting.personIds ?? [];
    if (personIds.join(',') === prev.join(',')) continue;
    await db.meetings.put({
      ...meeting,
      personIds,
      updatedAt: new Date().toISOString(),
    });
    linksRepaired++;
  }

  return {
    meetings: meetingCount,
    people: nextPeople.size,
    prospects: activeProspects.length,
    consolidated: withEmail.length - seeded.length,
    pruned: Math.max(0, pruned),
    mirrorDuplicates,
    linksRepaired,
  };
}

function inferProjects(title: string, map: Map<string, Project>): string[] {
  const hints = [
    'Milø', 'Milo', 'BrandBoost', 'Utoppia', 'Innovación', 'Royal Enfield', 'Nexo', 'Productividad',
  ];
  const ids: string[] = [];
  for (const hint of hints) {
    if (title.toLowerCase().includes(hint.toLowerCase().replace('ø', 'o'))) {
      const id = slugId(hint);
      ids.push(id);
      if (!map.has(id)) map.set(id, { id, name: hint, tags: [] });
    }
  }
  return ids;
}

function mergeIds(fromMirror: string[], existing?: string[]): string[] {
  return [...new Set([...(existing ?? []), ...fromMirror])];
}

function inferTeams(title: string, teams: Team[]): string[] {
  const ids: string[] = [];
  for (const t of teams) {
    if (title.toLowerCase().includes(t.name.toLowerCase())) ids.push(t.id);
  }
  return ids;
}

function buildSearchPreview(body: string): string {
  const transcript = extractTranscriptSection(body);
  const source = transcript.length > 300 ? transcript : body;
  return source.slice(0, 8000);
}
