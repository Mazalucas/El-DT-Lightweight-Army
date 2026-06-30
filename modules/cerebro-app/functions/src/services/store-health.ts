import type { CerebroStore, StoreHealthMetrics } from '../shared/types.js';
import { isLikelyPersonName } from '../core/profesional/person-name-clean.js';
import { isValidContact } from '../core/profesional/merge-person-incremental.js';
import { listActivePendingSuggestions } from './pending-suggestions.js';

function isUuidProjectId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function computeStoreHealth(store: CerebroStore): StoreHealthMetrics {
  const meetingsTotal = store.meetings.length;
  const meetingsSynced = store.meetings.filter((m) => m.syncStatus === 'synced').length;

  const peopleById = new Set(store.people.map((p) => p.id));
  const prospectsById = new Set(store.prospects.map((p) => p.id));

  let meetingsWithoutResolvedParticipants = 0;
  let staleParticipantLinks = 0;

  for (const m of store.meetings) {
    const hasNames = m.participants.filter(Boolean).length > 0;
    const hasEmails = (m.participantEmails ?? []).length > 0;
    if (!hasNames && !hasEmails) continue;

    const validPeople = (m.personIds ?? []).filter((id) => peopleById.has(id)).length;
    const validProspects = (m.prospectIds ?? []).filter((id) => prospectsById.has(id)).length;
    const rawLinks = (m.personIds?.length ?? 0) + (m.prospectIds?.length ?? 0);
    if (rawLinks > validPeople + validProspects) staleParticipantLinks++;

    if (validPeople + validProspects === 0 && hasNames) meetingsWithoutResolvedParticipants++;
  }

  const pending = listActivePendingSuggestions(store);
  const projectSuggestionsPending = pending.filter((s) => s.kind === 'assign_project').length;
  const teamSuggestionsPending = pending.filter((s) => s.kind === 'assign_team').length;

  const projectIdsUsed = new Set<string>();
  for (const m of store.meetings) {
    for (const pid of m.projectIds) projectIdsUsed.add(pid);
  }
  for (const p of store.people) {
    for (const pid of p.projectIds ?? []) projectIdsUsed.add(pid);
  }

  const uuidProjects = store.projects.filter((p) => isUuidProjectId(p.id)).length;
  const orphanProjects = store.projects.filter(
    (p) => !projectIdsUsed.has(p.id) || isUuidProjectId(p.id),
  ).length;

  const needsRepair =
    (meetingsSynced > 0 && store.people.filter(isValidContact).length === 0) ||
    uuidProjects > 20 ||
    staleParticipantLinks > 10;

  return {
    meetingsTotal,
    meetingsSynced,
    meetingsWithoutResolvedParticipants,
    staleParticipantLinks,
    prospectsPending: store.prospects.filter(
      (p) => !p.linkedPersonId && isLikelyPersonName(p.displayName),
    ).length,
    projectSuggestionsPending,
    teamSuggestionsPending,
    todosSuggested: store.todos.filter((t) => t.status === 'suggested').length,
    todosOpen: store.todos.filter((t) => t.status === 'open').length,
    orphanProjects,
    uuidProjects,
    contactsCount: store.people.filter(isValidContact).length,
    needsRepair,
    generatedAt: new Date().toISOString(),
  };
}
