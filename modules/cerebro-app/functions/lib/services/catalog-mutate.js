import { slugId } from '../core/profesional/parse-mirror-md.js';
import { isValidContact } from '../core/profesional/merge-person-incremental.js';
import { loadStore, saveStore } from './store.js';
const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
export async function mutateStore(adapter, fn) {
    const store = await adapter.load();
    await fn(store);
    store.savedAt = new Date().toISOString();
    await adapter.save(store);
    return store;
}
export function userStoreAdapter(uid) {
    return {
        load: () => loadStore(uid),
        save: (store) => saveStore(uid, store),
    };
}
async function withStore(uid, fn) {
    return mutateStore(userStoreAdapter(uid), fn);
}
function nextTeamColor(teams) {
    const used = new Set(teams.map((t) => t.color));
    return TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[teams.length % TEAM_COLORS.length];
}
function createPersonInStore(s, displayName, email, teamIds = [], projectIds = []) {
    const trimmed = displayName.trim();
    const normalizedEmail = email.toLowerCase().trim();
    if (!trimmed)
        throw new Error('El nombre no puede estar vacío');
    if (!normalizedEmail.includes('@'))
        throw new Error('Se requiere un email válido');
    const dup = s.people.find((p) => p.emails?.includes(normalizedEmail));
    if (dup) {
        dup.teamIds = [...new Set([...dup.teamIds, ...teamIds])];
        dup.projectIds = [...new Set([...(dup.projectIds ?? []), ...projectIds])];
        return dup;
    }
    let id = slugId(normalizedEmail);
    if (s.people.some((p) => p.id === id))
        id = `${id}-${s.people.length + 1}`;
    const person = {
        id,
        displayName: trimmed,
        aliases: [],
        teamIds: [...new Set(teamIds)],
        projectIds: [...new Set(projectIds)],
        emails: [normalizedEmail],
        emailMeta: {
            [normalizedEmail]: {
                sources: ['participant'],
                firstSeenAt: new Date().toISOString(),
            },
        },
    };
    s.people.push(person);
    return person;
}
export async function createTeam(uid, name) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error('El nombre del equipo no puede estar vacío');
    let created;
    const store = await withStore(uid, (s) => {
        let id = slugId(trimmed);
        if (s.teams.some((t) => t.id === id))
            id = `${id}-${s.teams.length + 1}`;
        created = { id, name: trimmed, color: nextTeamColor(s.teams) };
        s.teams.push(created);
    });
    return { store, team: created };
}
export async function updateTeam(uid, id, patch) {
    return withStore(uid, (s) => {
        const existing = s.teams.find((t) => t.id === id);
        if (!existing)
            throw new Error('Equipo no encontrado');
        const name = patch.name?.trim() ?? existing.name;
        if (!name)
            throw new Error('El nombre del equipo no puede estar vacío');
        Object.assign(existing, patch, { name });
    });
}
export async function deleteTeam(uid, id) {
    return withStore(uid, (s) => {
        s.teams = s.teams.filter((t) => t.id !== id);
        for (const p of s.people)
            p.teamIds = p.teamIds.filter((t) => t !== id);
        for (const m of s.meetings)
            m.teamIds = m.teamIds.filter((t) => t !== id);
        for (const t of s.todos)
            t.teamIds = t.teamIds.filter((x) => x !== id);
    });
}
export async function updatePersonOnAdapter(adapter, personId, patch) {
    return mutateStore(adapter, (s) => {
        const existing = s.people.find((p) => p.id === personId);
        if (!existing)
            throw new Error('Contacto no encontrado');
        const displayName = patch.displayName?.trim() ?? existing.displayName;
        if (!displayName)
            throw new Error('El nombre no puede estar vacío');
        Object.assign(existing, patch, { displayName });
    });
}
export async function updatePerson(uid, personId, patch) {
    return updatePersonOnAdapter(userStoreAdapter(uid), personId, patch);
}
export async function createPerson(uid, displayName, email, teamIds = [], projectIds = []) {
    let person;
    const store = await withStore(uid, (s) => {
        person = createPersonInStore(s, displayName, email, teamIds, projectIds);
    });
    return { store, person: person };
}
export async function createProject(uid, name) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error('El nombre del proyecto no puede estar vacío');
    let project;
    const store = await withStore(uid, (s) => {
        let id = slugId(trimmed);
        if (s.projects.some((p) => p.id === id))
            id = `${id}-${s.projects.length + 1}`;
        project = { id, name: trimmed, tags: [] };
        s.projects.push(project);
    });
    return { store, project: project };
}
export async function updateProject(uid, id, patch) {
    return withStore(uid, (s) => {
        const existing = s.projects.find((p) => p.id === id);
        if (!existing)
            throw new Error('Proyecto no encontrado');
        const name = patch.name?.trim() ?? existing.name;
        if (!name)
            throw new Error('El nombre del proyecto no puede estar vacío');
        Object.assign(existing, patch, { name });
    });
}
export async function deleteProject(uid, id) {
    return withStore(uid, (s) => {
        s.projects = s.projects.filter((p) => p.id !== id);
        for (const p of s.people)
            p.projectIds = p.projectIds.filter((x) => x !== id);
        for (const m of s.meetings)
            m.projectIds = m.projectIds.filter((x) => x !== id);
        for (const t of s.todos)
            t.projectIds = t.projectIds.filter((x) => x !== id);
    });
}
export async function createTeamOnAdapter(adapter, name) {
    let created;
    const store = await mutateStore(adapter, (s) => {
        const trimmed = name.trim();
        if (!trimmed)
            throw new Error('El nombre del equipo no puede estar vacío');
        let id = slugId(trimmed);
        if (s.teams.some((t) => t.id === id))
            id = `${id}-${s.teams.length + 1}`;
        created = { id, name: trimmed, color: nextTeamColor(s.teams) };
        s.teams.push(created);
    });
    return { store, team: created };
}
export async function deleteTeamOnAdapter(adapter, id) {
    return mutateStore(adapter, (s) => {
        s.teams = s.teams.filter((t) => t.id !== id);
        for (const p of s.people)
            p.teamIds = p.teamIds.filter((t) => t !== id);
        for (const m of s.meetings)
            m.teamIds = m.teamIds.filter((t) => t !== id);
        for (const t of s.todos)
            t.teamIds = t.teamIds.filter((x) => x !== id);
    });
}
export async function createProjectOnAdapter(adapter, name) {
    let project;
    const store = await mutateStore(adapter, (s) => {
        const trimmed = name.trim();
        if (!trimmed)
            throw new Error('El nombre del proyecto no puede estar vacío');
        let id = slugId(trimmed);
        if (s.projects.some((p) => p.id === id))
            id = `${id}-${s.projects.length + 1}`;
        project = { id, name: trimmed, tags: [] };
        s.projects.push(project);
    });
    return { store, project: project };
}
export async function deleteProjectOnAdapter(adapter, id) {
    return mutateStore(adapter, (s) => {
        s.projects = s.projects.filter((p) => p.id !== id);
        for (const p of s.people)
            p.projectIds = p.projectIds.filter((x) => x !== id);
        for (const m of s.meetings)
            m.projectIds = m.projectIds.filter((x) => x !== id);
        for (const t of s.todos)
            t.projectIds = t.projectIds.filter((x) => x !== id);
    });
}
export async function mergePersonsIntoCanonicalOnAdapter(adapter, canonicalId, mergeIds) {
    const toMerge = [...new Set(mergeIds.filter((id) => id && id !== canonicalId))];
    if (toMerge.length === 0)
        throw new Error('Seleccioná al menos un contacto para unificar');
    let result;
    const store = await mutateStore(adapter, (s) => {
        const canonical = s.people.find((p) => p.id === canonicalId);
        if (!canonical)
            throw new Error('Contacto principal no encontrado');
        const mergeSet = new Set(toMerge);
        const aliases = new Set(canonical.aliases);
        const teamIds = new Set(canonical.teamIds);
        const projectIds = new Set(canonical.projectIds);
        const emails = new Set(canonical.emails ?? []);
        const emailMeta = { ...(canonical.emailMeta ?? {}) };
        const aliasesAdded = [];
        for (const id of toMerge) {
            const p = s.people.find((x) => x.id === id);
            if (!p)
                continue;
            if (p.displayName !== canonical.displayName) {
                aliases.add(p.displayName);
                aliasesAdded.push(p.displayName);
            }
            for (const a of p.aliases)
                if (a !== canonical.displayName)
                    aliases.add(a);
            for (const t of p.teamIds)
                teamIds.add(t);
            for (const pid of p.projectIds ?? [])
                projectIds.add(pid);
            for (const e of p.emails ?? [])
                emails.add(e);
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
            if (!m.personIds.some((pid) => mergeSet.has(pid)))
                continue;
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
    return { ...result, store };
}
export async function mergePersonsIntoCanonical(uid, canonicalId, mergeIds) {
    return mergePersonsIntoCanonicalOnAdapter(userStoreAdapter(uid), canonicalId, mergeIds);
}
export async function promoteProspectToContactOnAdapter(adapter, prospectId, email, displayName) {
    const loaded = await adapter.load();
    const prospect = loaded.prospects.find((p) => p.id === prospectId);
    if (!prospect)
        throw new Error('Posible contacto no encontrado');
    const name = displayName?.trim() || prospect.displayName;
    let person;
    const store = await mutateStore(adapter, (s) => {
        person = createPersonInStore(s, name, email);
        const p = s.people.find((x) => x.id === person.id);
        const pr = s.prospects.find((x) => x.id === prospectId);
        const aliases = new Set(p.aliases);
        for (const a of pr.aliases)
            aliases.add(a);
        if (pr.displayName !== p.displayName)
            aliases.add(pr.displayName);
        p.aliases = [...aliases].filter((a) => a !== p.displayName);
        for (const m of s.meetings) {
            if (!m.prospectIds?.includes(prospectId))
                continue;
            m.personIds = [...new Set([...m.personIds, p.id])];
            m.prospectIds = m.prospectIds.filter((id) => id !== prospectId);
        }
        s.prospects = s.prospects.filter((x) => x.id !== prospectId);
    });
    return { store, person: store.people.find((x) => x.id === person.id) };
}
export async function promoteProspectToContact(uid, prospectId, email, displayName) {
    return promoteProspectToContactOnAdapter(userStoreAdapter(uid), prospectId, email, displayName);
}
export async function linkProspectToContactOnAdapter(adapter, prospectId, personId) {
    return mutateStore(adapter, (s) => {
        const prospect = s.prospects.find((p) => p.id === prospectId);
        const person = s.people.find((p) => p.id === personId);
        if (!prospect)
            throw new Error('Posible contacto no encontrado');
        if (!person)
            throw new Error('Contacto no encontrado');
        if (!isValidContact(person))
            throw new Error('El contacto destino debe tener email');
        const aliases = new Set(person.aliases);
        aliases.add(prospect.displayName);
        for (const a of prospect.aliases)
            aliases.add(a);
        person.aliases = [...aliases].filter((a) => a !== person.displayName);
        for (const m of s.meetings) {
            if (!m.prospectIds?.includes(prospectId))
                continue;
            m.personIds = [...new Set([...m.personIds, personId])];
            m.prospectIds = m.prospectIds.filter((id) => id !== prospectId);
        }
        s.prospects = s.prospects.filter((x) => x.id !== prospectId);
    });
}
export async function linkProspectToContact(uid, prospectId, personId) {
    return linkProspectToContactOnAdapter(userStoreAdapter(uid), prospectId, personId);
}
export async function acceptTodosBatchOnAdapter(adapter, todoIds) {
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
export async function dismissTodosBatchOnAdapter(adapter, todoIds) {
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
export async function acceptTodosBatch(uid, todoIds) {
    return acceptTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}
export async function dismissTodosBatch(uid, todoIds) {
    return dismissTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}
