import type { MaintenanceView } from '../shared/types.js';
import {
  assignEmailToTeam,
  createTeam,
  dismissProspect,
  dismissMergeContactSuggestion,
  dismissTeamEmailReassign,
  linkProspectToContact,
  promoteProspectToContact,
  userStoreAdapter,
} from '../services/catalog-mutate.js';
import {
  batchAcceptProjectSuggestionsOnAdapter,
  batchAcceptTeamSuggestionsOnAdapter,
  batchDismissSuggestionsOnAdapter,
} from '../services/pending-suggestions.js';
import { rankProspectLinkCandidates } from '../services/prospect-matching.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { getMaintenanceView } from './views.service.js';

export async function listMaintenance(uid: string): Promise<MaintenanceView> {
  return getMaintenanceView(uid);
}

export async function acceptProjectSuggestions(
  uid: string,
  ids: string[],
  opts?: { existingProjectId?: string; projectName?: string },
) {
  return batchAcceptProjectSuggestionsOnAdapter(userStoreAdapter(uid), ids, opts);
}

export async function acceptTeamSuggestions(uid: string, ids: string[]) {
  return batchAcceptTeamSuggestionsOnAdapter(userStoreAdapter(uid), ids);
}

export async function batchDismissSuggestions(uid: string, ids: string[]) {
  return batchDismissSuggestionsOnAdapter(userStoreAdapter(uid), ids);
}

export async function dismissProspectForUser(uid: string, prospectId: string) {
  await dismissProspect(uid, prospectId);
  return { dismissed: true, prospectId };
}

export async function promoteProspectForUser(
  uid: string,
  prospectId: string,
  email: string,
  displayName?: string,
) {
  const result = await promoteProspectToContact(uid, prospectId, email, displayName);
  return { personId: result.person.id, displayName: result.person.displayName };
}

export async function linkProspectForUser(uid: string, prospectId: string, personId: string) {
  await linkProspectToContact(uid, prospectId, personId);
  return { linked: true, prospectId, personId };
}

export async function getProspectLinkCandidates(uid: string, prospectId: string) {
  const store = await loadStoreFromRepository(uid);
  return rankProspectLinkCandidates(store, prospectId);
}

export async function assignEmailToTeamForUser(uid: string, teamId: string, email: string) {
  await assignEmailToTeam(uid, teamId, email);
  return { assigned: true, teamId, email };
}

export async function dismissTeamEmailReassignForUser(uid: string, personId: string, email: string) {
  await dismissTeamEmailReassign(uid, personId, email);
  return { dismissed: true, personId, email };
}

export async function dismissMergeContactForUser(uid: string, suggestionId: string) {
  await dismissMergeContactSuggestion(uid, suggestionId);
  return { dismissed: true, suggestionId };
}

export async function createTeamForUser(uid: string, name: string) {
  const result = await createTeam(uid, name);
  return { teamId: result.team.id, name: result.team.name };
}
