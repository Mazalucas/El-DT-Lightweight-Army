import { loadStoreFromRepository } from '../services/store-repository.js';
import { createPerson, linkProspectToContact, mergePersonsIntoCanonical, promoteProspectToContact, } from '../services/catalog-mutate.js';
export async function listPeople(uid, limit = 100) {
    const store = await loadStoreFromRepository(uid);
    return store.people.slice(0, limit);
}
export async function listProspects(uid, limit = 100) {
    const store = await loadStoreFromRepository(uid);
    return store.prospects.filter((p) => !p.linkedPersonId).slice(0, limit);
}
export async function listProjects(uid) {
    const store = await loadStoreFromRepository(uid);
    return store.projects;
}
export async function listTeams(uid) {
    const store = await loadStoreFromRepository(uid);
    return store.teams;
}
export { createPerson, linkProspectToContact, mergePersonsIntoCanonical, promoteProspectToContact, };
