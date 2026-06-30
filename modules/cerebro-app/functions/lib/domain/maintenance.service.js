import { assignEmailToTeam, createTeam, dismissProspect, dismissMergeContactSuggestion, dismissTeamEmailReassign, linkProspectToContact, promoteProspectToContact, userStoreAdapter, } from '../services/catalog-mutate.js';
import { batchAcceptProjectSuggestionsOnAdapter, batchAcceptTeamSuggestionsOnAdapter, batchDismissSuggestionsOnAdapter, } from '../services/pending-suggestions.js';
import { rankProspectLinkCandidates } from '../services/prospect-matching.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { getMaintenanceView } from './views.service.js';
export async function listMaintenance(uid) {
    return getMaintenanceView(uid);
}
export async function acceptProjectSuggestions(uid, ids, opts) {
    return batchAcceptProjectSuggestionsOnAdapter(userStoreAdapter(uid), ids, opts);
}
export async function acceptTeamSuggestions(uid, ids) {
    return batchAcceptTeamSuggestionsOnAdapter(userStoreAdapter(uid), ids);
}
export async function batchDismissSuggestions(uid, ids) {
    return batchDismissSuggestionsOnAdapter(userStoreAdapter(uid), ids);
}
export async function dismissProspectForUser(uid, prospectId) {
    await dismissProspect(uid, prospectId);
    return { dismissed: true, prospectId };
}
export async function promoteProspectForUser(uid, prospectId, email, displayName) {
    const result = await promoteProspectToContact(uid, prospectId, email, displayName);
    return { personId: result.person.id, displayName: result.person.displayName };
}
export async function linkProspectForUser(uid, prospectId, personId) {
    await linkProspectToContact(uid, prospectId, personId);
    return { linked: true, prospectId, personId };
}
export async function getProspectLinkCandidates(uid, prospectId) {
    const store = await loadStoreFromRepository(uid);
    return rankProspectLinkCandidates(store, prospectId);
}
export async function assignEmailToTeamForUser(uid, teamId, email) {
    await assignEmailToTeam(uid, teamId, email);
    return { assigned: true, teamId, email };
}
export async function dismissTeamEmailReassignForUser(uid, personId, email) {
    await dismissTeamEmailReassign(uid, personId, email);
    return { dismissed: true, personId, email };
}
export async function dismissMergeContactForUser(uid, suggestionId) {
    await dismissMergeContactSuggestion(uid, suggestionId);
    return { dismissed: true, suggestionId };
}
export async function createTeamForUser(uid, name) {
    const result = await createTeam(uid, name);
    return { teamId: result.team.id, name: result.team.name };
}
