import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

initializeApp();

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export const bucket = getStorage().bucket();

export function userRef(uid: string) {
  return db.collection('users').doc(uid);
}

export function settingsRef(uid: string) {
  return userRef(uid).collection('settings').doc('app');
}

export function googleIntegrationRef(uid: string) {
  return userRef(uid).collection('integrations').doc('google');
}

export function llmProviderRef(uid: string, providerId: string) {
  return userRef(uid).collection('integrations').doc('llm').collection('providers').doc(providerId);
}

export function meetingsCol(uid: string) {
  return userRef(uid).collection('meetings');
}

export function syncRef(uid: string) {
  return userRef(uid).collection('sync').doc('progress');
}

export function syncLastRunRef(uid: string) {
  return userRef(uid).collection('sync').doc('lastRun');
}

export function jobsCol(uid: string) {
  return userRef(uid).collection('jobs');
}

export function storeRef(uid: string) {
  return userRef(uid).collection('store').doc('main');
}

export function storeMetaRef(uid: string) {
  return userRef(uid).collection('store').doc('meta');
}

/** Catálogo normalizado v3 — 1 doc por entidad bajo users/{uid}/ */
export function peopleCol(uid: string) {
  return userRef(uid).collection('people');
}

export function prospectsCol(uid: string) {
  return userRef(uid).collection('prospects');
}

export function projectsCol(uid: string) {
  return userRef(uid).collection('projects');
}

export function teamsCol(uid: string) {
  return userRef(uid).collection('teams');
}

export function todosCol(uid: string) {
  return userRef(uid).collection('todos');
}

export function suggestionsCol(uid: string) {
  return userRef(uid).collection('suggestions');
}

/** Sugerencias generadas por el motor de inteligencia (Suggestion Engine v2). */
export function smartSuggestionsCol(uid: string) {
  return userRef(uid).collection('smartSuggestions');
}

/** Digest diario generado por LLM; doc id = YYYY-MM-DD. */
export function digestsCol(uid: string) {
  return userRef(uid).collection('digests');
}

/** Embeddings de mirrors para búsqueda semántica; doc id = meetingId. */
export function meetingEmbeddingsCol(uid: string) {
  return userRef(uid).collection('meetingEmbeddings');
}

export function assistantConversationsCol(uid: string) {
  return userRef(uid).collection('assistant').doc('data').collection('conversations');
}

export function facturasRef(uid: string) {
  return userRef(uid).collection('facturas').doc('main');
}

export function membershipRef(uid: string, orgId: string) {
  return userRef(uid).collection('memberships').doc(orgId);
}

export function membershipsCol(uid: string) {
  return userRef(uid).collection('memberships');
}

export function orgRef(orgId: string) {
  return db.collection('orgs').doc(orgId);
}

export function orgStoreRef(orgId: string) {
  return orgRef(orgId).collection('store').doc('main');
}

export function orgMembersCol(orgId: string) {
  return orgRef(orgId).collection('members');
}

export function orgMemberRef(orgId: string, uid: string) {
  return orgMembersCol(orgId).doc(uid);
}

export function orgInvitesCol(orgId: string) {
  return orgRef(orgId).collection('invites');
}

export function orgJoinRequestsCol(orgId: string) {
  return orgRef(orgId).collection('joinRequests');
}

export function mirrorPath(uid: string, meetingId: string): string {
  return `users/${uid}/mirror/${meetingId}.md`;
}
