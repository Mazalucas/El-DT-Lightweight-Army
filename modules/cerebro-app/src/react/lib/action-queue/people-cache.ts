import type { MaintenanceItem, MaintenanceView, PeopleView, PersonListItem, Project, Team } from '@shared/types.js';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';
import { patchRemoveMaintenanceItems, patchRestoreMaintenanceItems } from './maintenance-cache.js';
import type { MaintenanceOptimisticSnapshot } from './types.js';

export type PeopleOptimisticSnapshot = {
  removedPeople: PersonListItem[];
};

export type CatalogOptimisticSnapshot = {
  maintenance?: MaintenanceOptimisticSnapshot;
  people?: PeopleOptimisticSnapshot;
};

function isPeopleViewQueryKey(queryKey: readonly unknown[]): boolean {
  const i = queryKey.indexOf('people');
  return i > 0 && queryKey[i - 1] === 'views';
}

function patchAllPeopleQueries(
  client: QueryClient,
  updater: (prev: PeopleView) => PeopleView,
): void {
  client.setQueriesData<PeopleView>(
    { predicate: (q) => isPeopleViewQueryKey(q.queryKey) },
    (prev) => (prev ? updater(prev) : prev),
  );
}

function mergeMaintenanceSnapshots(
  a?: MaintenanceOptimisticSnapshot,
  b?: MaintenanceOptimisticSnapshot,
): MaintenanceOptimisticSnapshot | undefined {
  if (!a) return b;
  if (!b) return a;
  const itemIds = [...a.itemIds];
  const removedItems = [...a.removedItems];
  for (const item of b.removedItems) {
    if (!itemIds.includes(item.id)) {
      itemIds.push(item.id);
      removedItems.push(item);
    }
  }
  return { itemIds, removedItems };
}

function mergePeopleSnapshots(
  a?: PeopleOptimisticSnapshot,
  b?: PeopleOptimisticSnapshot,
): PeopleOptimisticSnapshot | undefined {
  if (!a) return b;
  if (!b) return a;
  const seen = new Set(a.removedPeople.map((p) => `${p.kind}:${p.id}`));
  const removedPeople = [...a.removedPeople];
  for (const p of b.removedPeople) {
    const key = `${p.kind}:${p.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      removedPeople.push(p);
    }
  }
  return { removedPeople };
}

export function mergeCatalogSnapshots(
  a: CatalogOptimisticSnapshot | undefined,
  b: CatalogOptimisticSnapshot | undefined,
): CatalogOptimisticSnapshot | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    maintenance: mergeMaintenanceSnapshots(a.maintenance, b.maintenance),
    people: mergePeopleSnapshots(a.people, b.people),
  };
}

function removeMaintenanceForProspects(
  client: QueryClient,
  prospectIds: string[],
): MaintenanceOptimisticSnapshot | undefined {
  const idSet = new Set(prospectIds);
  let removedItems: MaintenanceItem[] = [];

  client.setQueryData<MaintenanceView>(qk.maintenance, (prev) => {
    if (!prev) return prev;
    removedItems = prev.items.filter((item) => {
      const pid = String(item.payload.prospectId ?? '');
      return pid && idSet.has(pid);
    });
    if (!removedItems.length) return prev;
    const items = prev.items.filter((item) => {
      const pid = String(item.payload.prospectId ?? '');
      return !(pid && idSet.has(pid));
    });
    const counts = { ...prev.counts };
    for (const item of removedItems) {
      if (item.kind) counts[item.kind] = Math.max(0, (counts[item.kind] ?? 1) - 1);
    }
    return {
      items,
      counts,
      total: items.length,
      generatedAt: new Date().toISOString(),
    };
  });

  return removedItems.length ? { itemIds: removedItems.map((i) => i.id), removedItems } : undefined;
}

/** Quita prospects del listado de personas (todas las queries) y mantenimiento relacionado. */
export function patchRemoveProspectsFromCatalog(
  client: QueryClient,
  prospectIds: string[],
): CatalogOptimisticSnapshot | undefined {
  if (!prospectIds.length) return undefined;
  const idSet = new Set(prospectIds);
  let removedPeople: PersonListItem[] = [];

  patchAllPeopleQueries(client, (prev) => {
    removedPeople = prev.people.filter((p) => p.kind === 'prospect' && idSet.has(p.id));
    const people = prev.people.filter((p) => !(p.kind === 'prospect' && idSet.has(p.id)));
    return { ...prev, people, total: people.length };
  });

  const maintenance = removeMaintenanceForProspects(client, prospectIds);
  if (!removedPeople.length && !maintenance) return undefined;

  return {
    people: removedPeople.length ? { removedPeople } : undefined,
    maintenance,
  };
}

/** Quita contactos del listado (p. ej. tras merge). */
export function patchRemovePeopleFromCatalog(
  client: QueryClient,
  personIds: string[],
): PeopleOptimisticSnapshot | undefined {
  if (!personIds.length) return undefined;
  const idSet = new Set(personIds);
  let removedPeople: PersonListItem[] = [];

  patchAllPeopleQueries(client, (prev) => {
    removedPeople = prev.people.filter((p) => p.kind === 'person' && idSet.has(p.id));
    const people = prev.people.filter((p) => !(p.kind === 'person' && idSet.has(p.id)));
    return { ...prev, people, total: people.length };
  });

  return removedPeople.length ? { removedPeople } : undefined;
}

export function patchRestoreCatalogSnapshot(
  client: QueryClient,
  snapshot: CatalogOptimisticSnapshot,
): void {
  if (snapshot.people?.removedPeople.length) {
    patchAllPeopleQueries(client, (prev) => {
      const existing = new Set(prev.people.map((p) => `${p.kind}:${p.id}`));
      const toAdd = snapshot.people!.removedPeople.filter((p) => !existing.has(`${p.kind}:${p.id}`));
      if (!toAdd.length) return prev;
      const people = [...prev.people, ...toAdd];
      return { ...prev, people, total: people.length };
    });
  }

  if (snapshot.maintenance?.removedItems.length) {
    patchRestoreMaintenanceItems(client, snapshot.maintenance);
  }
}

/** Añade un equipo al catálogo en caché sin invalidar vistas (evita desmontar formularios abiertos). */
export function patchAddTeamToPeopleView(client: QueryClient, team: Team): void {
  patchAllPeopleQueries(client, (prev) => {
    if (prev.teams.some((t) => t.id === team.id)) return prev;
    return { ...prev, teams: [...prev.teams, team] };
  });
}

/** Añade un proyecto al catálogo en caché sin invalidar vistas. */
export function patchAddProjectToPeopleView(client: QueryClient, project: Project): void {
  patchAllPeopleQueries(client, (prev) => {
    if (prev.projects.some((p) => p.id === project.id)) return prev;
    return { ...prev, projects: [...prev.projects, project] };
  });
}

export function applyCatalogOptimisticPatch(
  client: QueryClient,
  action: {
    itemIds?: string[];
    prospectIds?: string[];
    removePersonIds?: string[];
  },
): CatalogOptimisticSnapshot | undefined {
  let snapshot: CatalogOptimisticSnapshot | undefined;

  if (action.itemIds?.length) {
    const maintenance = patchRemoveMaintenanceItems(client, action.itemIds);
    if (maintenance) snapshot = { maintenance };
  }

  if (action.prospectIds?.length) {
    snapshot = mergeCatalogSnapshots(snapshot, patchRemoveProspectsFromCatalog(client, action.prospectIds));
  }

  if (action.removePersonIds?.length) {
    const people = patchRemovePeopleFromCatalog(client, action.removePersonIds);
    if (people) snapshot = mergeCatalogSnapshots(snapshot, { people });
  }

  return snapshot;
}
