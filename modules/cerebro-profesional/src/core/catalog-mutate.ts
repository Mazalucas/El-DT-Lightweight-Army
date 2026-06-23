import { slugId } from './parse-mirror-md';
import { cleanChipPersonName } from './person-name-clean';
import { isValidContact } from './merge-person-incremental';
import { persistSnapshotToServer, type PersistResult } from './persist-store';
import { db } from './db';
import type { EmailSource, Person, PersonProspect, Project, Team } from './models';

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export async function saveCatalog(): Promise<PersistResult> {
  return persistSnapshotToServer();
}

function nextTeamColor(teams: Team[]): string {
  const used = new Set(teams.map((t) => t.color));
  return TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[teams.length % TEAM_COLORS.length];
}

export async function createTeam(name: string): Promise<{ team: Team; save: PersistResult }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre del equipo no puede estar vacío');
  const teams = await db.teams.toArray();
  let id = slugId(trimmed);
  if (await db.teams.get(id)) {
    id = `${id}-${teams.length + 1}`;
  }
  const team: Team = { id, name: trimmed, color: nextTeamColor(teams) };
  await db.teams.put(team);
  const save = await saveCatalog();
  return { team, save };
}

export async function updateTeam(
  id: string,
  patch: Partial<Pick<Team, 'name' | 'color'>>,
): Promise<void> {
  const existing = await db.teams.get(id);
  if (!existing) throw new Error('Equipo no encontrado');
  const name = patch.name?.trim() ?? existing.name;
  if (!name) throw new Error('El nombre del equipo no puede estar vacío');
  await db.teams.put({ ...existing, ...patch, name });
  await saveCatalog();
}

export async function deleteTeam(id: string): Promise<PersistResult> {
  await db.teams.delete(id);
  const people = await db.people.toArray();
  for (const p of people) {
    if (p.teamIds.includes(id)) {
      await db.people.put({ ...p, teamIds: p.teamIds.filter((t) => t !== id) });
    }
  }
  const meetings = await db.meetings.toArray();
  for (const m of meetings) {
    if (m.teamIds.includes(id)) {
      await db.meetings.put({ ...m, teamIds: m.teamIds.filter((t) => t !== id) });
    }
  }
  return saveCatalog();
}

export async function updatePerson(
  personId: string,
  patch: Partial<Pick<Person, 'displayName' | 'teamIds' | 'projectIds' | 'aliases' | 'notes'>>,
): Promise<PersistResult> {
  const existing = await db.people.get(personId);
  if (!existing) throw new Error('Contacto no encontrado');
  const displayName = patch.displayName?.trim() ?? existing.displayName;
  if (!displayName) throw new Error('El nombre no puede estar vacío');
  await db.people.put({ ...existing, ...patch, displayName });
  return saveCatalog();
}

export async function setPersonTeams(
  personId: string,
  teamIds: string[],
): Promise<PersistResult> {
  return updatePerson(personId, { teamIds: [...new Set(teamIds)] });
}

export async function setPersonProjects(
  personId: string,
  projectIds: string[],
): Promise<PersistResult> {
  return updatePerson(personId, { projectIds: [...new Set(projectIds)] });
}

export async function removePersonsFromTeam(
  teamId: string,
  personIds: string[],
): Promise<{ save: PersistResult; updated: number }> {
  let updated = 0;
  for (const personId of personIds) {
    const person = await db.people.get(personId);
    if (!person || !person.teamIds.includes(teamId)) continue;
    await db.people.put({
      ...person,
      teamIds: person.teamIds.filter((t) => t !== teamId),
    });
    updated++;
  }
  const save = await saveCatalog();
  return { save, updated };
}

export async function removePersonsFromProject(
  projectId: string,
  personIds: string[],
): Promise<{ save: PersistResult; updated: number }> {
  let updated = 0;
  for (const personId of personIds) {
    const person = await db.people.get(personId);
    if (!person || !person.projectIds.includes(projectId)) continue;
    await db.people.put({
      ...person,
      projectIds: person.projectIds.filter((p) => p !== projectId),
    });
    updated++;
  }
  const save = await saveCatalog();
  return { save, updated };
}

export async function createPerson(
  displayName: string,
  email: string,
  teamIds: string[] = [],
  projectIds: string[] = [],
): Promise<Person> {
  const trimmed = displayName.trim();
  const normalizedEmail = email.toLowerCase().trim();
  if (!trimmed) throw new Error('El nombre no puede estar vacío');
  if (!normalizedEmail.includes('@')) throw new Error('Se requiere un email válido');

  for (const p of await db.people.toArray()) {
    if (p.emails?.includes(normalizedEmail)) {
      await db.people.put({
        ...p,
        teamIds: [...new Set([...p.teamIds, ...teamIds])],
        projectIds: [...new Set([...(p.projectIds ?? []), ...projectIds])],
      });
      await saveCatalog();
      return (await db.people.get(p.id))!;
    }
  }

  let id = slugId(normalizedEmail);
  if (await db.people.get(id)) {
    const n = await db.people.count();
    id = `${id}-${n + 1}`;
  }
  const person: Person = {
    id,
    displayName: trimmed,
    aliases: [],
    teamIds: [...new Set(teamIds)],
    projectIds: [...new Set(projectIds)],
    emails: [normalizedEmail],
    emailMeta: {
      [normalizedEmail]: { sources: ['participant' as EmailSource], firstSeenAt: new Date().toISOString() },
    },
  };
  await db.people.put(person);
  await saveCatalog();
  return person;
}

export async function createProject(name: string): Promise<Project> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre del proyecto no puede estar vacío');
  const projects = await db.projects.toArray();
  let id = slugId(trimmed);
  if (await db.projects.get(id)) {
    id = `${id}-${projects.length + 1}`;
  }
  const project: Project = { id, name: trimmed, tags: [] };
  await db.projects.put(project);
  await saveCatalog();
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'tags'>>,
): Promise<void> {
  const existing = await db.projects.get(id);
  if (!existing) throw new Error('Proyecto no encontrado');
  const name = patch.name?.trim() ?? existing.name;
  if (!name) throw new Error('El nombre del proyecto no puede estar vacío');
  await db.projects.put({ ...existing, ...patch, name });
  await saveCatalog();
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
  const people = await db.people.toArray();
  for (const p of people) {
    if (p.projectIds.includes(id)) {
      await db.people.put({ ...p, projectIds: p.projectIds.filter((x) => x !== id) });
    }
  }
  const meetings = await db.meetings.toArray();
  for (const m of meetings) {
    if (m.projectIds.includes(id)) {
      await db.meetings.put({ ...m, projectIds: m.projectIds.filter((x) => x !== id) });
    }
  }
  await saveCatalog();
}

export interface MergePersonsResult {
  merged: number;
  meetingsUpdated: number;
  aliasesAdded: string[];
}

/** Une otros contactos en el contacto principal (reuniones, equipos, alias). */
export async function mergePersonsIntoCanonical(
  canonicalId: string,
  mergeIds: string[],
): Promise<MergePersonsResult & { save: PersistResult }> {
  const canonical = await db.people.get(canonicalId);
  if (!canonical) throw new Error('Contacto principal no encontrado');

  const toMerge = [...new Set(mergeIds.filter((id) => id && id !== canonicalId))];
  if (toMerge.length === 0) {
    throw new Error('Seleccioná al menos un contacto para unificar');
  }

  const aliases = new Set(canonical.aliases);
  const teamIds = new Set(canonical.teamIds);
  const projectIds = new Set(canonical.projectIds);
  const emails = new Set(canonical.emails ?? []);
  const emailMeta = { ...(canonical.emailMeta ?? {}) };
  const aliasesAdded: string[] = [];
  const mergeSet = new Set(toMerge);

  for (const id of toMerge) {
    const p = await db.people.get(id);
    if (!p) continue;
    if (p.displayName !== canonical.displayName) {
      aliases.add(p.displayName);
      aliasesAdded.push(p.displayName);
    }
    for (const a of p.aliases) {
      if (a !== canonical.displayName) aliases.add(a);
    }
    for (const t of p.teamIds) teamIds.add(t);
    for (const pid of p.projectIds ?? []) projectIds.add(pid);
    for (const e of p.emails ?? []) emails.add(e);
    for (const [e, meta] of Object.entries(p.emailMeta ?? {})) {
      const prev = emailMeta[e];
      emailMeta[e] = prev
        ? {
            sources: [...new Set([...prev.sources, ...meta.sources])],
            firstSeenAt: prev.firstSeenAt ?? meta.firstSeenAt,
            lastSeenAt: meta.lastSeenAt ?? prev.lastSeenAt,
          }
        : meta;
    }
  }

  const meetings = await db.meetings.toArray();
  let meetingsUpdated = 0;
  for (const m of meetings) {
    if (!m.personIds.some((pid) => mergeSet.has(pid))) continue;
    const personIds = [...new Set([...m.personIds.filter((pid) => !mergeSet.has(pid)), canonicalId])];
    await db.meetings.put({
      ...m,
      personIds,
      updatedAt: new Date().toISOString(),
    });
    meetingsUpdated++;
  }

  await db.people.put({
    ...canonical,
    aliases: [...aliases].filter((a) => a !== canonical.displayName),
    teamIds: [...teamIds],
    projectIds: [...projectIds],
    emails: [...emails],
    emailMeta,
  });

  for (const id of toMerge) await db.people.delete(id);
  const save = await saveCatalog();

  return {
    merged: toMerge.length,
    meetingsUpdated,
    aliasesAdded: [...new Set(aliasesAdded)],
    save,
  };
}

/** Mueve contactos sin email a posibles contactos (una vez, antes de reimportar). */
export async function migrateContactsWithoutEmailToProspects(): Promise<{
  moved: number;
  removed: number;
  save: PersistResult;
}> {
  const people = await db.people.toArray();
  const withoutEmail = people.filter((p) => !isValidContact(p));
  const meetings = await db.meetings.toArray();
  let moved = 0;

  for (const p of withoutEmail) {
    const meetingIds = meetings
      .filter((m) => m.personIds.includes(p.id))
      .map((m) => m.id);
    const prospect: PersonProspect = {
      id: p.id,
      displayName: cleanChipPersonName(p.displayName),
      aliases: [...new Set([...p.aliases, p.displayName])],
      meetingIds,
      sources: ['participant'],
      lastSeenAt: new Date().toISOString(),
    };
    await db.prospects.put(prospect);
    await db.people.delete(p.id);
    moved++;
  }

  for (const m of meetings) {
    const orphanPersonIds = m.personIds.filter((id) => withoutEmail.some((p) => p.id === id));
    if (!orphanPersonIds.length) continue;
    const prospectIds = [...new Set([...(m.prospectIds ?? []), ...orphanPersonIds])];
    await db.meetings.put({
      ...m,
      personIds: m.personIds.filter((id) => !orphanPersonIds.includes(id)),
      prospectIds,
    });
  }

  const save = await saveCatalog();
  return { moved, removed: withoutEmail.length, save };
}

export async function promoteProspectToContact(
  prospectId: string,
  email: string,
  displayName?: string,
): Promise<Person> {
  const prospect = await db.prospects.get(prospectId);
  if (!prospect) throw new Error('Posible contacto no encontrado');

  const person = await createPerson(
    displayName?.trim() || prospect.displayName,
    email,
  );

  const aliases = new Set(person.aliases);
  for (const a of prospect.aliases) aliases.add(a);
  if (prospect.displayName !== person.displayName) aliases.add(prospect.displayName);
  await db.people.put({ ...person, aliases: [...aliases].filter((a) => a !== person.displayName) });

  const meetings = await db.meetings.toArray();
  for (const m of meetings) {
    if (!m.prospectIds?.includes(prospectId)) continue;
    await db.meetings.put({
      ...m,
      personIds: [...new Set([...m.personIds, person.id])],
      prospectIds: m.prospectIds.filter((id) => id !== prospectId),
    });
  }

  await db.prospects.delete(prospectId);
  await saveCatalog();
  return (await db.people.get(person.id))!;
}

export async function linkProspectToContact(
  prospectId: string,
  personId: string,
): Promise<PersistResult> {
  const prospect = await db.prospects.get(prospectId);
  const person = await db.people.get(personId);
  if (!prospect) throw new Error('Posible contacto no encontrado');
  if (!person) throw new Error('Contacto no encontrado');
  if (!isValidContact(person)) throw new Error('El contacto destino debe tener email');

  const aliases = new Set(person.aliases);
  aliases.add(prospect.displayName);
  for (const a of prospect.aliases) aliases.add(a);
  await db.people.put({
    ...person,
    aliases: [...aliases].filter((a) => a !== person.displayName),
  });

  const meetings = await db.meetings.toArray();
  for (const m of meetings) {
    if (!m.prospectIds?.includes(prospectId)) continue;
    await db.meetings.put({
      ...m,
      personIds: [...new Set([...m.personIds, personId])],
      prospectIds: m.prospectIds.filter((id) => id !== prospectId),
    });
  }

  await db.prospects.delete(prospectId);
  return saveCatalog();
}
