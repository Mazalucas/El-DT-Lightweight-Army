import type { CerebroStore, EmailSource, Person, Project, Team } from '../shared/types.js';
import { slugId } from '../core/profesional/parse-mirror-md.js';
import { isValidContact } from '../core/profesional/merge-person-incremental.js';
import { loadStore, saveStore } from './store.js';

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export type StoreAdapter = {
  load: () => Promise<CerebroStore>;
  save: (store: CerebroStore) => Promise<void>;
};

export async function mutateStore(
  adapter: StoreAdapter,
  fn: (store: CerebroStore) => void | Promise<void>,
): Promise<CerebroStore> {
  const store = await adapter.load();
  await fn(store);
  store.savedAt = new Date().toISOString();
  await adapter.save(store);
  return store;
}

export function userStoreAdapter(uid: string): StoreAdapter {
  return {
    load: () => loadStore(uid),
    save: (store) => saveStore(uid, store),
  };
}

async function withStore(uid: string, fn: (store: CerebroStore) => void | Promise<void>): Promise<CerebroStore> {
  return mutateStore(userStoreAdapter(uid), fn);
}

function nextTeamColor(teams: Team[]): string {
  const used = new Set(teams.map((t) => t.color));
  return TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[teams.length % TEAM_COLORS.length];
}

function createPersonInStore(
  s: CerebroStore,
  displayName: string,
  email: string,
  teamIds: string[] = [],
  projectIds: string[] = [],
): Person {
  const trimmed = displayName.trim();
  const normalizedEmail = email.toLowerCase().trim();
  if (!trimmed) throw new Error('El nombre no puede estar vacío');
  if (!normalizedEmail.includes('@')) throw new Error('Se requiere un email válido');

  const dup = s.people.find((p) => p.emails?.includes(normalizedEmail));
  if (dup) {
    dup.teamIds = [...new Set([...dup.teamIds, ...teamIds])];
    dup.projectIds = [...new Set([...(dup.projectIds ?? []), ...projectIds])];
    return dup;
  }

  let id = slugId(normalizedEmail);
  if (s.people.some((p) => p.id === id)) id = `${id}-${s.people.length + 1}`;
  const person: Person = {
    id,
    displayName: trimmed,
    aliases: [],
    teamIds: [...new Set(teamIds)],
    projectIds: [...new Set(projectIds)],
    emails: [normalizedEmail],
    emailMeta: {
      [normalizedEmail]: {
        sources: ['participant' as EmailSource],
        firstSeenAt: new Date().toISOString(),
      },
    },
  };
  s.people.push(person);
  return person;
}

export async function createTeam(uid: string, name: string): Promise<{ store: CerebroStore; team: Team }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre del equipo no puede estar vacío');
  let created!: Team;
  const store = await withStore(uid, (s) => {
    let id = slugId(trimmed);
    if (s.teams.some((t) => t.id === id)) id = `${id}-${s.teams.length + 1}`;
    created = { id, name: trimmed, color: nextTeamColor(s.teams) };
    s.teams.push(created);
  });
  return { store, team: created };
}

export async function updateTeam(
  uid: string,
  id: string,
  patch: Partial<Pick<Team, 'name' | 'color'>>,
): Promise<CerebroStore> {
  return withStore(uid, (s) => {
    const existing = s.teams.find((t) => t.id === id);
    if (!existing) throw new Error('Equipo no encontrado');
    const name = patch.name?.trim() ?? existing.name;
    if (!name) throw new Error('El nombre del equipo no puede estar vacío');
    Object.assign(existing, patch, { name });
  });
}

export async function deleteTeam(uid: string, id: string): Promise<CerebroStore> {
  return withStore(uid, (s) => {
    s.teams = s.teams.filter((t) => t.id !== id);
    for (const p of s.people) p.teamIds = p.teamIds.filter((t) => t !== id);
    for (const m of s.meetings) m.teamIds = m.teamIds.filter((t) => t !== id);
    for (const t of s.todos) t.teamIds = t.teamIds.filter((x) => x !== id);
  });
}

export async function updatePersonOnAdapter(
  adapter: StoreAdapter,
  personId: string,
  patch: Partial<Pick<Person, 'displayName' | 'teamIds' | 'projectIds' | 'aliases' | 'notes' | 'emails'>>,
): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    const existing = s.people.find((p) => p.id === personId);
    if (!existing) throw new Error('Contacto no encontrado');
    const displayName = patch.displayName?.trim() ?? existing.displayName;
    if (!displayName) throw new Error('El nombre no puede estar vacío');
    Object.assign(existing, patch, { displayName });
  });
}

export async function updatePerson(
  uid: string,
  personId: string,
  patch: Partial<Pick<Person, 'displayName' | 'teamIds' | 'projectIds' | 'aliases' | 'notes' | 'emails'>>,
): Promise<CerebroStore> {
  return updatePersonOnAdapter(userStoreAdapter(uid), personId, patch);
}

export async function createPerson(
  uid: string,
  displayName: string,
  email: string,
  teamIds: string[] = [],
  projectIds: string[] = [],
): Promise<{ store: CerebroStore; person: Person }> {
  let person!: Person;
  const store = await withStore(uid, (s) => {
    person = createPersonInStore(s, displayName, email, teamIds, projectIds);
  });
  return { store, person: person! };
}

export async function createProject(uid: string, name: string): Promise<{ store: CerebroStore; project: Project }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre del proyecto no puede estar vacío');
  let project!: Project;
  const store = await withStore(uid, (s) => {
    let id = slugId(trimmed);
    if (s.projects.some((p) => p.id === id)) id = `${id}-${s.projects.length + 1}`;
    project = { id, name: trimmed, tags: [] };
    s.projects.push(project);
  });
  return { store, project: project! };
}

export async function updateProject(
  uid: string,
  id: string,
  patch: Partial<Pick<Project, 'name' | 'tags'>>,
): Promise<CerebroStore> {
  return withStore(uid, (s) => {
    const existing = s.projects.find((p) => p.id === id);
    if (!existing) throw new Error('Proyecto no encontrado');
    const name = patch.name?.trim() ?? existing.name;
    if (!name) throw new Error('El nombre del proyecto no puede estar vacío');
    Object.assign(existing, patch, { name });
  });
}

export async function deleteProject(uid: string, id: string): Promise<CerebroStore> {
  return withStore(uid, (s) => {
    s.projects = s.projects.filter((p) => p.id !== id);
    for (const p of s.people) p.projectIds = p.projectIds.filter((x) => x !== id);
    for (const m of s.meetings) m.projectIds = m.projectIds.filter((x) => x !== id);
    for (const t of s.todos) t.projectIds = t.projectIds.filter((x) => x !== id);
  });
}

export async function createTeamOnAdapter(
  adapter: StoreAdapter,
  name: string,
): Promise<{ store: CerebroStore; team: Team }> {
  let created!: Team;
  const store = await mutateStore(adapter, (s) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('El nombre del equipo no puede estar vacío');
    let id = slugId(trimmed);
    if (s.teams.some((t) => t.id === id)) id = `${id}-${s.teams.length + 1}`;
    created = { id, name: trimmed, color: nextTeamColor(s.teams) };
    s.teams.push(created);
  });
  return { store, team: created };
}

export async function deleteTeamOnAdapter(adapter: StoreAdapter, id: string): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    s.teams = s.teams.filter((t) => t.id !== id);
    for (const p of s.people) p.teamIds = p.teamIds.filter((t) => t !== id);
    for (const m of s.meetings) m.teamIds = m.teamIds.filter((t) => t !== id);
    for (const t of s.todos) t.teamIds = t.teamIds.filter((x) => x !== id);
  });
}

export async function createProjectOnAdapter(
  adapter: StoreAdapter,
  name: string,
): Promise<{ store: CerebroStore; project: Project }> {
  let project!: Project;
  const store = await mutateStore(adapter, (s) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('El nombre del proyecto no puede estar vacío');
    let id = slugId(trimmed);
    if (s.projects.some((p) => p.id === id)) id = `${id}-${s.projects.length + 1}`;
    project = { id, name: trimmed, tags: [] };
    s.projects.push(project);
  });
  return { store, project: project! };
}

export async function deleteProjectOnAdapter(adapter: StoreAdapter, id: string): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    s.projects = s.projects.filter((p) => p.id !== id);
    for (const p of s.people) p.projectIds = p.projectIds.filter((x) => x !== id);
    for (const m of s.meetings) m.projectIds = m.projectIds.filter((x) => x !== id);
    for (const t of s.todos) t.projectIds = t.projectIds.filter((x) => x !== id);
  });
}

export interface MergePersonsResult {
  merged: number;
  meetingsUpdated: number;
  aliasesAdded: string[];
}

export async function mergePersonsIntoCanonicalOnAdapter(
  adapter: StoreAdapter,
  canonicalId: string,
  mergeIds: string[],
): Promise<MergePersonsResult & { store: CerebroStore }> {
  const toMerge = [...new Set(mergeIds.filter((id) => id && id !== canonicalId))];
  if (toMerge.length === 0) throw new Error('Seleccioná al menos un contacto para unificar');

  let result!: MergePersonsResult;
  const store = await mutateStore(adapter, (s) => {
    const canonical = s.people.find((p) => p.id === canonicalId);
    if (!canonical) throw new Error('Contacto principal no encontrado');

    const mergeSet = new Set(toMerge);
    const aliases = new Set(canonical.aliases);
    const teamIds = new Set(canonical.teamIds);
    const projectIds = new Set(canonical.projectIds);
    const emails = new Set(canonical.emails ?? []);
    const emailMeta = { ...(canonical.emailMeta ?? {}) };
    const aliasesAdded: string[] = [];

    for (const id of toMerge) {
      const p = s.people.find((x) => x.id === id);
      if (!p) continue;
      if (p.displayName !== canonical.displayName) {
        aliases.add(p.displayName);
        aliasesAdded.push(p.displayName);
      }
      for (const a of p.aliases) if (a !== canonical.displayName) aliases.add(a);
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

    let meetingsUpdated = 0;
    for (const m of s.meetings) {
      if (!m.personIds.some((pid) => mergeSet.has(pid))) continue;
      m.personIds = [...new Set([...m.personIds.filter((pid) => !mergeSet.has(pid)), canonicalId])];
      m.updatedAt = new Date().toISOString();
      meetingsUpdated++;
    }

    Object.assign(canonical, {
      aliases: [...aliases].filter((a) => a !== canonical.displayName),
      teamIds: [...teamIds],
      projectIds: [...projectIds],
      emails: [...emails],
      emailMeta,
    });

    s.people = s.people.filter((p) => !mergeSet.has(p.id));
    result = { merged: toMerge.length, meetingsUpdated, aliasesAdded: [...new Set(aliasesAdded)] };
  });
  return { ...result!, store };
}

export async function mergePersonsIntoCanonical(
  uid: string,
  canonicalId: string,
  mergeIds: string[],
): Promise<MergePersonsResult & { store: CerebroStore }> {
  return mergePersonsIntoCanonicalOnAdapter(userStoreAdapter(uid), canonicalId, mergeIds);
}

export async function promoteProspectToContactOnAdapter(
  adapter: StoreAdapter,
  prospectId: string,
  email: string,
  displayName?: string,
): Promise<{ store: CerebroStore; person: Person }> {
  const loaded = await adapter.load();
  const prospect = loaded.prospects.find((p) => p.id === prospectId);
  if (!prospect) throw new Error('Posible contacto no encontrado');

  const name = displayName?.trim() || prospect.displayName;
  let person!: Person;
  const store = await mutateStore(adapter, (s) => {
    person = createPersonInStore(s, name, email);
    const p = s.people.find((x) => x.id === person.id)!;
    const pr = s.prospects.find((x) => x.id === prospectId)!;
    const aliases = new Set(p.aliases);
    for (const a of pr.aliases) aliases.add(a);
    if (pr.displayName !== p.displayName) aliases.add(pr.displayName);
    p.aliases = [...aliases].filter((a) => a !== p.displayName);
    for (const m of s.meetings) {
      if (!m.prospectIds?.includes(prospectId)) continue;
      m.personIds = [...new Set([...m.personIds, p.id])];
      m.prospectIds = m.prospectIds.filter((id) => id !== prospectId);
    }
    s.prospects = s.prospects.filter((x) => x.id !== prospectId);
  });
  return { store, person: store.people.find((x) => x.id === person!.id)! };
}

export async function promoteProspectToContact(
  uid: string,
  prospectId: string,
  email: string,
  displayName?: string,
): Promise<{ store: CerebroStore; person: Person }> {
  return promoteProspectToContactOnAdapter(userStoreAdapter(uid), prospectId, email, displayName);
}

export async function linkProspectToContactOnAdapter(
  adapter: StoreAdapter,
  prospectId: string,
  personId: string,
): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    const prospect = s.prospects.find((p) => p.id === prospectId);
    const person = s.people.find((p) => p.id === personId);
    if (!prospect) throw new Error('Posible contacto no encontrado');
    if (!person) throw new Error('Contacto no encontrado');
    if (!isValidContact(person)) throw new Error('El contacto destino debe tener email');
    const aliases = new Set(person.aliases);
    aliases.add(prospect.displayName);
    for (const a of prospect.aliases) aliases.add(a);
    person.aliases = [...aliases].filter((a) => a !== person.displayName);
    for (const m of s.meetings) {
      if (!m.prospectIds?.includes(prospectId)) continue;
      m.personIds = [...new Set([...m.personIds, personId])];
      m.prospectIds = m.prospectIds.filter((id) => id !== prospectId);
    }
    s.prospects = s.prospects.filter((x) => x.id !== prospectId);
  });
}

export async function linkProspectToContact(
  uid: string,
  prospectId: string,
  personId: string,
): Promise<CerebroStore> {
  return linkProspectToContactOnAdapter(userStoreAdapter(uid), prospectId, personId);
}

export async function acceptTodosBatchOnAdapter(adapter: StoreAdapter, todoIds: string[]): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    const set = new Set(todoIds);
    const now = new Date().toISOString();
    for (const t of s.todos) {
      if (set.has(t.id) && t.status === 'suggested') {
        t.status = 'open';
        t.updatedAt = now;
      }
    }
  });
}

export async function dismissTodosBatchOnAdapter(adapter: StoreAdapter, todoIds: string[]): Promise<CerebroStore> {
  return mutateStore(adapter, (s) => {
    const set = new Set(todoIds);
    const now = new Date().toISOString();
    for (const t of s.todos) {
      if (set.has(t.id) && t.status === 'suggested') {
        t.status = 'dismissed';
        t.updatedAt = now;
      }
    }
  });
}

export async function acceptTodosBatch(uid: string, todoIds: string[]): Promise<CerebroStore> {
  return acceptTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}

export async function dismissTodosBatch(uid: string, todoIds: string[]): Promise<CerebroStore> {
  return dismissTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}
