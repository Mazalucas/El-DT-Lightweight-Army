import type { CerebroStore, Meeting, Person, Project, Team } from './types.js';
import { emitProjectSuggestion, ensurePendingSuggestions } from '../../services/pending-suggestions.js';
import { consolidatePeopleRecords, remapPersonIds } from './consolidate-people.js';
import { isValidContact, mergePersonPreservingManual } from './merge-person-incremental.js';
import { parseMirrorMarkdown, slugId } from './parse-mirror-md.js';
import { buildCanonicalParticipantNames, resolveMeetingPersonIds } from './meeting-contacts.js';
import { collectParticipantEmails } from './meeting-participation.js';
import { ProspectResolver } from './prospect-resolver.js';
import { collectSignalsFromMirror, PersonResolver, extractTranscriptSection } from './resolve-person.js';
import { isLikelyPersonName } from './person-name-clean.js';
import { buildTeamEmailIndex } from './team-email-index.js';
import { parseDateFromMeetFilename } from '../../shared/parse-meet-filename.js';
import { enrichMeetingRecord, resolveMeetingStartedAt } from '../../shared/meeting-dates.js';

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

/** Reindex in-memory sobre CerebroStore (sin IndexedDB). */
export function reindexStoreFromMirrors(
  store: CerebroStore,
  files: MirrorFileDto[],
): ReindexResult {
  const teams = store.teams;
  const { files: uniqueFiles, duplicates: mirrorDuplicates } = dedupeMirrorFilesByDocId(files);
  const existingAll = store.people;
  const withEmail = existingAll.filter(isValidContact);
  const { people: seeded, idRemap: preRemap } = consolidatePeopleRecords(withEmail);

  const resolver = new PersonResolver(seeded);
  const existingProspects = store.prospects;
  const prospectResolver = new ProspectResolver(
    existingProspects.filter((p) => !p.linkedPersonId),
    store.dismissedProspectKeys ?? [],
    store.dismissedProspectIds ?? [],
  );

  const projectsMap = new Map<string, Project>();
  for (const p of store.projects) projectsMap.set(p.id, p);
  ensurePendingSuggestions(store);

  const teamEmailIndex = buildTeamEmailIndex(teams);

  const meetingsById = new Map(store.meetings.map((m) => [m.id, m]));
  let meetingCount = 0;
  const writtenMeetingIds = new Set<string>();

  for (const file of uniqueFiles) {
    const parsed = parseMirrorMarkdown(file.content);
    const fm = parsed.frontmatter;
    const meetingId = String(fm.meetingId ?? file.id);
    const title = String(fm.title ?? meetingId);
    const sourceFile = String(fm.sourceFile ?? '');
    const existing = meetingsById.get(meetingId);
    const participantEmails = collectParticipantEmails(parsed);
    const parsedFromFile = sourceFile ? parseDateFromMeetFilename(sourceFile) : { title: '' };
    const startedAtFromFm = typeof fm.startedAt === 'string' ? fm.startedAt : undefined;
    const draftStartedAt = startedAtFromFm ?? existing?.startedAt ?? parsedFromFile.startedAt;
    const seenAt =
      resolveMeetingStartedAt({
        startedAt: draftStartedAt,
        sourceFile,
        title,
      }) ?? new Date().toISOString();
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
    const teamIdsFromEmails: string[] = [];

    const tagTeamEmail = (rawEmail: string): boolean => {
      const teamId = teamEmailIndex.get(rawEmail.toLowerCase().trim());
      if (!teamId) return false;
      if (!teamIdsFromEmails.includes(teamId)) teamIdsFromEmails.push(teamId);
      return true;
    };

    for (const signal of signals) {
      if (signal.email) {
        if (tagTeamEmail(signal.email)) continue;
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
      if (tagTeamEmail(email)) continue;
      const id = resolver.resolve({ email, source: 'invite', seenAt });
      if (id && !personIds.includes(id)) personIds.push(id);
    }

    const projectIds = resolveProjectIdsForMeeting(store, meetingId, title, projectsMap);
    const fromFm = typeof fm.teamId === 'string' ? [String(fm.teamId)] : [];
    const inferred = inferTeams(title, teams);
    const teamIds = existing?.teamIds?.length
      ? [...new Set([...existing.teamIds, ...fromFm, ...inferred, ...teamIdsFromEmails])]
      : [...new Set([...fromFm, ...inferred, ...teamIdsFromEmails])];

    const meeting: Meeting = enrichMeetingRecord({
      id: meetingId,
      docId: typeof fm.docId === 'string' ? fm.docId : undefined,
      sourceFile,
      title,
      startedAt: startedAtFromFm ?? existing?.startedAt ?? parsedFromFile.startedAt,
      timezone: typeof fm.timezone === 'string' ? fm.timezone : existing?.timezone ?? parsedFromFile.timezone,
      summary: parsed.summary ?? existing?.summary,
      participants: participantNames,
      participantEmails,
      personIds: remapPersonIds(personIds, preRemap),
      prospectIds,
      teamIds,
      projectIds: mergeIds(projectIds, existing?.projectIds),
      syncStatus: 'synced',
      analysisStatus: existing?.analysisStatus ?? 'pending',
      bodyPreview: buildSearchPreview(parsed.body) || existing?.bodyPreview,
      lastSyncedAt:
        typeof fm.syncedAt === 'string'
          ? fm.syncedAt
          : existing?.lastSyncedAt,
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
    });

    meetingsById.set(meetingId, meeting);
    writtenMeetingIds.add(meetingId);
    meetingCount++;
  }

  // Dedupe meetings by docId
  const byDocId = new Map<string, Meeting[]>();
  for (const m of meetingsById.values()) {
    if (!m.docId) continue;
    const list = byDocId.get(m.docId) ?? [];
    list.push(m);
    byDocId.set(m.docId, list);
  }
  for (const group of byDocId.values()) {
    if (group.length <= 1) continue;
    const keep = group.find((m) => writtenMeetingIds.has(m.id)) ?? group[0]!;
    for (const m of group) {
      if (m.id !== keep.id) meetingsById.delete(m.id);
    }
  }

  let meetings = [...meetingsById.values()];

  if (preRemap.size > 0) {
    meetings = meetings.map((m) => {
      const nextIds = remapPersonIds(m.personIds, preRemap);
      if (nextIds.join(',') === m.personIds.join(',')) return m;
      return { ...m, personIds: nextIds, updatedAt: new Date().toISOString() };
    });
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
    nextPeople.set(existing.id, existing);
  }

  const pruned = existingAll.filter(isValidContact).length - nextPeople.size;
  const finalPeople = [...nextPeople.values()];

  let linksRepaired = 0;
  meetings = meetings.map((meeting) => {
    const personIds = resolveMeetingPersonIds(meeting, finalPeople);
    const prev = meeting.personIds ?? [];
    if (personIds.join(',') === prev.join(',')) return meeting;
    linksRepaired++;
    return { ...meeting, personIds, updatedAt: new Date().toISOString() };
  });

  const linkedProspects = existingProspects.filter((p) => p.linkedPersonId);
  const activeProspects = prospectResolver.getAll().filter((p) => isLikelyPersonName(p.displayName));
  const validProspectIds = new Set([
    ...linkedProspects.map((p) => p.id),
    ...activeProspects.map((p) => p.id),
  ]);
  meetings = meetings.map((meeting) => ({
    ...meeting,
    prospectIds: (meeting.prospectIds ?? []).filter((id) => validProspectIds.has(id)),
  }));

  store.meetings = meetings;
  store.people = finalPeople;
  store.prospects = [...linkedProspects, ...activeProspects];
  store.projects = [...projectsMap.values()];

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

const PROJECT_HINTS = [
  'Milø', 'Milo', 'BrandBoost', 'Utoppia', 'Innovación', 'Royal Enfield', 'Nexo', 'Productividad',
  'Disney', 'Banco Macro', 'Mazalán', 'Oscarcito', 'Cowork', 'Patrocinio',
];

function inferProjectNamesFromTitle(title: string): string[] {
  const found: string[] = [];
  const blob = title.toLowerCase();
  for (const hint of PROJECT_HINTS) {
    if (blob.includes(hint.toLowerCase().replace('ø', 'o'))) found.push(hint);
  }
  return [...new Set(found)];
}

function resolveProjectIdsForMeeting(
  store: CerebroStore,
  meetingId: string,
  title: string,
  map: Map<string, Project>,
): string[] {
  const ids: string[] = [];
  for (const hint of inferProjectNamesFromTitle(title)) {
    const id = slugId(hint);
    const existing = map.get(id) ?? store.projects.find((p) => p.id === id || p.name.toLowerCase() === hint.toLowerCase());
    if (existing) {
      ids.push(existing.id);
      map.set(existing.id, existing);
    } else {
      emitProjectSuggestion(store, meetingId, hint, 'inferred', { confidence: 'high', meetingTitle: title });
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
  return source.slice(0, 400);
}
