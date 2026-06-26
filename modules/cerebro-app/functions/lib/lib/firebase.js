import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
initializeApp();
export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export const bucket = getStorage().bucket();
export function userRef(uid) {
    return db.collection('users').doc(uid);
}
export function settingsRef(uid) {
    return userRef(uid).collection('settings').doc('app');
}
export function googleIntegrationRef(uid) {
    return userRef(uid).collection('integrations').doc('google');
}
export function llmProviderRef(uid, providerId) {
    return userRef(uid).collection('integrations').doc('llm').collection('providers').doc(providerId);
}
export function meetingsCol(uid) {
    return userRef(uid).collection('meetings');
}
export function syncRef(uid) {
    return userRef(uid).collection('sync').doc('progress');
}
export function syncLastRunRef(uid) {
    return userRef(uid).collection('sync').doc('lastRun');
}
export function jobsCol(uid) {
    return userRef(uid).collection('jobs');
}
export function storeRef(uid) {
    return userRef(uid).collection('store').doc('main');
}
export function storeMetaRef(uid) {
    return userRef(uid).collection('store').doc('meta');
}
/** Catálogo normalizado v3 — 1 doc por entidad bajo users/{uid}/ */
export function peopleCol(uid) {
    return userRef(uid).collection('people');
}
export function prospectsCol(uid) {
    return userRef(uid).collection('prospects');
}
export function projectsCol(uid) {
    return userRef(uid).collection('projects');
}
export function teamsCol(uid) {
    return userRef(uid).collection('teams');
}
export function todosCol(uid) {
    return userRef(uid).collection('todos');
}
export function suggestionsCol(uid) {
    return userRef(uid).collection('suggestions');
}
/** Sugerencias generadas por el motor de inteligencia (Suggestion Engine v2). */
export function smartSuggestionsCol(uid) {
    return userRef(uid).collection('smartSuggestions');
}
/** Digest diario generado por LLM; doc id = YYYY-MM-DD. */
export function digestsCol(uid) {
    return userRef(uid).collection('digests');
}
/** Embeddings de mirrors para búsqueda semántica; doc id = meetingId. */
export function meetingEmbeddingsCol(uid) {
    return userRef(uid).collection('meetingEmbeddings');
}
export function assistantConversationsCol(uid) {
    return userRef(uid).collection('assistant').doc('data').collection('conversations');
}
export function cerebroPlansCol(uid) {
    return userRef(uid).collection('cerebro').doc('data').collection('plans');
}
export function membershipRef(uid, orgId) {
    return userRef(uid).collection('memberships').doc(orgId);
}
export function membershipsCol(uid) {
    return userRef(uid).collection('memberships');
}
export function orgRef(orgId) {
    return db.collection('orgs').doc(orgId);
}
export function orgStoreRef(orgId) {
    return orgRef(orgId).collection('store').doc('main');
}
export function orgMembersCol(orgId) {
    return orgRef(orgId).collection('members');
}
export function orgMemberRef(orgId, uid) {
    return orgMembersCol(orgId).doc(uid);
}
export function orgInvitesCol(orgId) {
    return orgRef(orgId).collection('invites');
}
export function orgJoinRequestsCol(orgId) {
    return orgRef(orgId).collection('joinRequests');
}
export function mirrorPath(uid, meetingId) {
    return `users/${uid}/mirror/${meetingId}.md`;
}
