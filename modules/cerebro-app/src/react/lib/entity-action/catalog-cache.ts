import type { BoardView, Project, Team } from '@shared/types.js';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';
import {
  patchAddProjectToPeopleView,
  patchAddTeamToPeopleView,
} from '../action-queue/people-cache.js';

export type CatalogBoardSnapshot = {
  personal?: BoardView;
  org?: { orgId: string; board: BoardView };
};

function patchBoardCatalog(
  client: QueryClient,
  orgId: string | undefined,
  updater: (prev: BoardView) => BoardView,
): CatalogBoardSnapshot | undefined {
  let snapshot: CatalogBoardSnapshot | undefined;
  const apply = (key: readonly unknown[], scope: 'personal' | 'org') => {
    client.setQueryData<BoardView>(key, (prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (scope === 'personal') snapshot = { personal: next };
      else if (orgId) snapshot = { org: { orgId, board: next } };
      return next;
    });
  };
  if (orgId) apply(qk.orgBoard(orgId), 'org');
  else apply(qk.board, 'personal');
  return snapshot;
}

export function patchAddProjectToBoard(
  client: QueryClient,
  project: Pick<Project, 'id' | 'name'>,
  orgId?: string,
): CatalogBoardSnapshot | undefined {
  patchAddProjectToPeopleView(client, project as Project);
  return patchBoardCatalog(client, orgId, (prev) => {
    const full = { tags: [], ...project } as Project;
    if (prev.projects.some((p) => p.id === full.id)) return prev;
    return { ...prev, projects: [...prev.projects, full] };
  });
}

export function patchRemoveProjectFromBoard(
  client: QueryClient,
  projectId: string,
  orgId?: string,
): CatalogBoardSnapshot | undefined {
  return patchBoardCatalog(client, orgId, (prev) => ({
    ...prev,
    projects: prev.projects.filter((p) => p.id !== projectId),
  }));
}

export function patchAddTeamToBoard(
  client: QueryClient,
  team: Pick<Team, 'id' | 'name'> & { emails?: string[]; color?: string },
  orgId?: string,
): CatalogBoardSnapshot | undefined {
  patchAddTeamToPeopleView(client, { ...team, emails: team.emails ?? [], color: team.color ?? '' } as Team);
  return patchBoardCatalog(client, orgId, (prev) => {
    const full = {
      emails: [],
      color: '',
      ...team,
    } as Team;
    if (prev.teams.some((t) => t.id === full.id)) return prev;
    return { ...prev, teams: [...prev.teams, full] };
  });
}

export function patchRemoveTeamFromBoard(
  client: QueryClient,
  teamId: string,
  orgId?: string,
): CatalogBoardSnapshot | undefined {
  return patchBoardCatalog(client, orgId, (prev) => ({
    ...prev,
    teams: prev.teams.filter((t) => t.id !== teamId),
  }));
}

export function restoreCatalogBoardSnapshot(client: QueryClient, snapshot: CatalogBoardSnapshot): void {
  if (snapshot.personal) client.setQueryData(qk.board, snapshot.personal);
  if (snapshot.org) client.setQueryData(qk.orgBoard(snapshot.org.orgId), snapshot.org.board);
}
