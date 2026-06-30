import type { CerebroStore, CreateTodoInput, MoveTodoInput, OrgRole, UpdateTodoInput } from '../shared/types.js';
import { getBoardSnapshotOnAdapter } from '../domain/board.service.js';
import {
  completeTodosBatchOnAdapter,
  createTodoOnAdapter,
  moveTodoOnAdapter,
  reopenTodosBatchOnAdapter,
  updateTodoOnAdapter,
} from '../domain/todos.service.js';
import {
  acceptTodosBatchOnAdapter,
  createProjectOnAdapter,
  createTeamOnAdapter,
  deleteProjectOnAdapter,
  deleteTeamOnAdapter,
  dismissTodosBatchOnAdapter,
  dismissProspectOnAdapter,
  dismissMergeContactOnAdapter,
  restoreProspectDismissOnAdapter,
  linkProspectToContactOnAdapter,
  mergePersonsIntoCanonicalOnAdapter,
  promoteProspectToContactOnAdapter,
  updatePersonOnAdapter,
  type StoreAdapter,
} from './catalog-mutate.js';
import {
  acceptProjectSuggestionOnAdapter,
  acceptTeamSuggestionOnAdapter,
  batchAcceptProjectSuggestionsOnAdapter,
  batchAcceptTeamSuggestionsOnAdapter,
  batchDismissSuggestionsOnAdapter,
  dismissSuggestionOnAdapter,
} from './pending-suggestions.js';
import { loadOrgStore, requireOrgRole, saveOrgStore } from './org.js';

const ORG_MEMBER_ROLES: OrgRole[] = ['org_owner', 'org_admin', 'org_member'];

function orgAdapter(orgId: string): StoreAdapter {
  return {
    load: () => loadOrgStore(orgId),
    save: (store) => saveOrgStore(orgId, store),
  };
}

async function withOrgCatalog<T>(orgId: string, uid: string, fn: () => Promise<T>): Promise<T> {
  await requireOrgRole(orgId, uid, ORG_MEMBER_ROLES);
  return fn();
}

export async function mergePersonsIntoCanonicalForOrg(
  orgId: string,
  uid: string,
  canonicalId: string,
  mergeIds: string[],
) {
  return withOrgCatalog(orgId, uid, () =>
    mergePersonsIntoCanonicalOnAdapter(orgAdapter(orgId), canonicalId, mergeIds),
  );
}

export async function promoteProspectToContactForOrg(
  orgId: string,
  uid: string,
  prospectId: string,
  email: string,
  displayName?: string,
  enrichment?: { aliases?: string[]; teamIds?: string[]; projectIds?: string[] },
) {
  return withOrgCatalog(orgId, uid, () =>
    promoteProspectToContactOnAdapter(orgAdapter(orgId), prospectId, email, displayName, enrichment),
  );
}

export async function linkProspectToContactForOrg(
  orgId: string,
  uid: string,
  prospectId: string,
  personId: string,
  enrichment?: { aliases?: string[]; teamIds?: string[]; projectIds?: string[] },
) {
  return withOrgCatalog(orgId, uid, () =>
    linkProspectToContactOnAdapter(orgAdapter(orgId), prospectId, personId, enrichment),
  );
}

export async function dismissProspectForOrg(orgId: string, uid: string, prospectId: string) {
  return withOrgCatalog(orgId, uid, () => dismissProspectOnAdapter(orgAdapter(orgId), prospectId));
}

export async function restoreProspectDismissForOrg(
  orgId: string,
  uid: string,
  snapshot: import('../shared/types.js').ProspectDismissUndoSnapshot,
) {
  return withOrgCatalog(orgId, uid, () => restoreProspectDismissOnAdapter(orgAdapter(orgId), snapshot));
}

export async function dismissMergeContactForOrg(orgId: string, uid: string, suggestionId: string) {
  return withOrgCatalog(orgId, uid, () => dismissMergeContactOnAdapter(orgAdapter(orgId), suggestionId));
}

export async function updatePersonForOrg(
  orgId: string,
  uid: string,
  personId: string,
  patch: Parameters<typeof updatePersonOnAdapter>[2],
): Promise<CerebroStore> {
  return withOrgCatalog(orgId, uid, () => updatePersonOnAdapter(orgAdapter(orgId), personId, patch));
}

export async function acceptTodosBatchForOrg(orgId: string, uid: string, todoIds: string[]) {
  return withOrgCatalog(orgId, uid, () => acceptTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}

export async function dismissTodosBatchForOrg(orgId: string, uid: string, todoIds: string[]) {
  return withOrgCatalog(orgId, uid, () => dismissTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}

export async function createTeamForOrg(orgId: string, uid: string, name: string) {
  return withOrgCatalog(orgId, uid, () => createTeamOnAdapter(orgAdapter(orgId), name));
}

export async function deleteTeamForOrg(orgId: string, uid: string, id: string) {
  return withOrgCatalog(orgId, uid, async () => ({ store: await deleteTeamOnAdapter(orgAdapter(orgId), id) }));
}

export async function createProjectForOrg(orgId: string, uid: string, name: string) {
  return withOrgCatalog(orgId, uid, () => createProjectOnAdapter(orgAdapter(orgId), name));
}

export async function deleteProjectForOrg(orgId: string, uid: string, id: string) {
  return withOrgCatalog(orgId, uid, async () => ({ store: await deleteProjectOnAdapter(orgAdapter(orgId), id) }));
}

export async function dismissSuggestionForOrg(orgId: string, uid: string, suggestionId: string) {
  return withOrgCatalog(orgId, uid, () => dismissSuggestionOnAdapter(orgAdapter(orgId), suggestionId));
}

export async function acceptProjectSuggestionForOrg(
  orgId: string,
  uid: string,
  suggestionId: string,
  opts?: { existingProjectId?: string; projectName?: string },
) {
  return withOrgCatalog(orgId, uid, () =>
    acceptProjectSuggestionOnAdapter(orgAdapter(orgId), suggestionId, opts),
  );
}

export async function acceptTeamSuggestionForOrg(orgId: string, uid: string, suggestionId: string) {
  return withOrgCatalog(orgId, uid, () => acceptTeamSuggestionOnAdapter(orgAdapter(orgId), suggestionId));
}

export async function batchDismissSuggestionsForOrg(orgId: string, uid: string, ids: string[]) {
  return withOrgCatalog(orgId, uid, () => batchDismissSuggestionsOnAdapter(orgAdapter(orgId), ids));
}

export async function batchAcceptProjectSuggestionsForOrg(
  orgId: string,
  uid: string,
  ids: string[],
  opts?: { existingProjectId?: string; projectName?: string },
) {
  return withOrgCatalog(orgId, uid, () =>
    batchAcceptProjectSuggestionsOnAdapter(orgAdapter(orgId), ids, opts),
  );
}

export async function batchAcceptTeamSuggestionsForOrg(orgId: string, uid: string, ids: string[]) {
  return withOrgCatalog(orgId, uid, () => batchAcceptTeamSuggestionsOnAdapter(orgAdapter(orgId), ids));
}

export async function getBoardSnapshotForOrg(orgId: string, uid: string) {
  return withOrgCatalog(orgId, uid, () => getBoardSnapshotOnAdapter(orgAdapter(orgId)));
}

export async function createTodoForOrg(orgId: string, uid: string, input: CreateTodoInput) {
  return withOrgCatalog(orgId, uid, () => createTodoOnAdapter(orgAdapter(orgId), input));
}

export async function updateTodoForOrg(
  orgId: string,
  uid: string,
  todoId: string,
  patch: UpdateTodoInput,
) {
  return withOrgCatalog(orgId, uid, () => updateTodoOnAdapter(orgAdapter(orgId), todoId, patch));
}

export async function moveTodoForOrg(orgId: string, uid: string, todoId: string, input: MoveTodoInput) {
  return withOrgCatalog(orgId, uid, () => moveTodoOnAdapter(orgAdapter(orgId), todoId, input));
}

export async function completeTodosBatchForOrg(orgId: string, uid: string, todoIds: string[]) {
  return withOrgCatalog(orgId, uid, () => completeTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}

export async function reopenTodosBatchForOrg(orgId: string, uid: string, todoIds: string[]) {
  return withOrgCatalog(orgId, uid, () => reopenTodosBatchOnAdapter(orgAdapter(orgId), todoIds));
}
