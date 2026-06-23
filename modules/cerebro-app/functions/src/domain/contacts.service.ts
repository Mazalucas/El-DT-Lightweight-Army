import type { Person, PersonProspect } from '../shared/types.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import {
  createPerson,
  linkProspectToContact,
  mergePersonsIntoCanonical,
  promoteProspectToContact,
} from '../services/catalog-mutate.js';

export async function listPeople(uid: string, limit = 100): Promise<Person[]> {
  const store = await loadStoreFromRepository(uid);
  return store.people.slice(0, limit);
}

export async function listProspects(uid: string, limit = 100): Promise<PersonProspect[]> {
  const store = await loadStoreFromRepository(uid);
  return store.prospects.filter((p) => !p.linkedPersonId).slice(0, limit);
}

export async function listProjects(uid: string) {
  const store = await loadStoreFromRepository(uid);
  return store.projects;
}

export async function listTeams(uid: string) {
  const store = await loadStoreFromRepository(uid);
  return store.teams;
}

export {
  createPerson,
  linkProspectToContact,
  mergePersonsIntoCanonical,
  promoteProspectToContact,
};
