import { getBoardSnapshotOnAdapter } from '../domain/board.service.js';
import { completeTodosBatchOnAdapter, createTodoOnAdapter, moveTodoOnAdapter, reopenTodosBatchOnAdapter, updateTodoOnAdapter, } from '../domain/todos.service.js';
import { acceptTodosBatchOnAdapter, createProjectOnAdapter, createTeamOnAdapter, deleteProjectOnAdapter, deleteTeamOnAdapter, dismissTodosBatchOnAdapter, linkProspectToContactOnAdapter, mergePersonsIntoCanonicalOnAdapter, promoteProspectToContactOnAdapter, updatePersonOnAdapter, } from './catalog-mutate.js';
import { acceptProjectSuggestionOnAdapter, acceptTeamSuggestionOnAdapter, dismissSuggestionOnAdapter, } from './pending-suggestions.js';
import { loadOrgStore, requireOrgRole, saveOrgStore } from './org.js';
const ORG_MEMBER_ROLES = ['org_owner', 'org_admin', 'org_member'];
function orgAdapter(orgId) {
    return {
        load: () => loadOrgStore(orgId),
        save: (store) => saveOrgStore(orgId, store),
    };
}
async function withOrgCatalog(orgId, uid, fn) {
    await requireOrgRole(orgId, uid, ORG_MEMBER_ROLES);
    return fn();
}
export async function mergePersonsIntoCanonicalForOrg(orgId, uid, canonicalId, mergeIds) {
    return withOrgCatalog(orgId, uid, () => mergePersonsIntoCanonicalOnAdapter(orgAdapter(orgId), canonicalId, mergeIds));
}
export async function promoteProspectToContactForOrg(orgId, uid, prospectId, email, displayName) {
    return withOrgCatalog(orgId, uid, () => promoteProspectToContactOnAdapter(orgAdapter(orgId), prospectId, email, displayName));
}
export async function linkProspectToContactForOrg(orgId, uid, prospectId, personId) {
    return withOrgCatalog(orgId, uid, () => linkProspectToContactOnAdapter(orgAdapter(orgId), prospectId, personId));
}
export async function updatePersonForOrg(orgId, uid, personId, patch) {
    return withOrgCatalog(orgId, uid, () => updatePersonOnAdapter(orgAdapter(orgId), personId, patch));
}
export async function acceptTodosBatchForOrg(orgId, uid, todoIds) {
    return withOrgCatalog(orgId, uid, () => acceptTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}
export async function dismissTodosBatchForOrg(orgId, uid, todoIds) {
    return withOrgCatalog(orgId, uid, () => dismissTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}
export async function createTeamForOrg(orgId, uid, name) {
    return withOrgCatalog(orgId, uid, () => createTeamOnAdapter(orgAdapter(orgId), name));
}
export async function deleteTeamForOrg(orgId, uid, id) {
    return withOrgCatalog(orgId, uid, async () => ({ store: await deleteTeamOnAdapter(orgAdapter(orgId), id) }));
}
export async function createProjectForOrg(orgId, uid, name) {
    return withOrgCatalog(orgId, uid, () => createProjectOnAdapter(orgAdapter(orgId), name));
}
export async function deleteProjectForOrg(orgId, uid, id) {
    return withOrgCatalog(orgId, uid, async () => ({ store: await deleteProjectOnAdapter(orgAdapter(orgId), id) }));
}
export async function dismissSuggestionForOrg(orgId, uid, suggestionId) {
    return withOrgCatalog(orgId, uid, () => dismissSuggestionOnAdapter(orgAdapter(orgId), suggestionId));
}
export async function acceptProjectSuggestionForOrg(orgId, uid, suggestionId, opts) {
    return withOrgCatalog(orgId, uid, () => acceptProjectSuggestionOnAdapter(orgAdapter(orgId), suggestionId, opts));
}
export async function acceptTeamSuggestionForOrg(orgId, uid, suggestionId) {
    return withOrgCatalog(orgId, uid, () => acceptTeamSuggestionOnAdapter(orgAdapter(orgId), suggestionId));
}
export async function getBoardSnapshotForOrg(orgId, uid) {
    return withOrgCatalog(orgId, uid, () => getBoardSnapshotOnAdapter(orgAdapter(orgId)));
}
export async function createTodoForOrg(orgId, uid, input) {
    return withOrgCatalog(orgId, uid, () => createTodoOnAdapter(orgAdapter(orgId), input));
}
export async function updateTodoForOrg(orgId, uid, todoId, patch) {
    return withOrgCatalog(orgId, uid, () => updateTodoOnAdapter(orgAdapter(orgId), todoId, patch));
}
export async function moveTodoForOrg(orgId, uid, todoId, input) {
    return withOrgCatalog(orgId, uid, () => moveTodoOnAdapter(orgAdapter(orgId), todoId, input));
}
export async function completeTodosBatchForOrg(orgId, uid, todoIds) {
    return withOrgCatalog(orgId, uid, () => completeTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}
export async function reopenTodosBatchForOrg(orgId, uid, todoIds) {
    return withOrgCatalog(orgId, uid, () => reopenTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}
