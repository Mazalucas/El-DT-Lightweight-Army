import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

/** Claves de query centralizadas — invalidar `['views']` refresca todas las vistas. */
export const qk = {
  dashboard: ['views', 'dashboard'] as const,
  meetings: (params?: { limit?: number; offset?: number; q?: string; projectId?: string; teamId?: string }) =>
    ['views', 'meetings', params ?? {}] as const,
  meeting: (id: string) => ['views', 'meeting', id] as const,
  meetingContent: (id: string) => ['views', 'meeting-content', id] as const,
  people: (q?: string) => ['views', 'people', q ?? ''] as const,
  board: ['views', 'board'] as const,
  maintenance: ['views', 'maintenance'] as const,
  graph: (opts?: Record<string, unknown>) => ['views', 'graph', opts ?? {}] as const,
  syncStatus: ['sync', 'status'] as const,
  syncProgress: ['sync', 'progress'] as const,
  settings: ['settings'] as const,
  providers: ['providers'] as const,
  orgs: ['orgs'] as const,
  org: (id: string) => ['org', id] as const,
  orgMembers: (id: string) => ['org', id, 'members'] as const,
  orgInvites: (id: string) => ['org', id, 'invites'] as const,
  orgJoinRequests: (id: string) => ['org', id, 'join-requests'] as const,
  orgBoard: (id: string) => ['org', id, 'views', 'board'] as const,
  orgMeetings: (id: string) => ['org', id, 'views', 'meetings'] as const,
  orgPeople: (id: string) => ['org', id, 'views', 'people'] as const,
  orgGraph: (id: string, opts?: Record<string, unknown>) => ['org', id, 'views', 'graph', opts ?? {}] as const,
  orgStore: (id: string) => ['org', id, 'store'] as const,
  orgHealth: (id: string) => ['org', id, 'health'] as const,
  facturas: ['facturas'] as const,
  assistantStatus: ['assistant', 'status'] as const,
  assistantConversations: ['assistant', 'conversations'] as const,
};

const VIEW_STALE_MS = 30_000;

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: api.getDashboardView, staleTime: VIEW_STALE_MS });
}

export function useMeetingsView(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  projectId?: string;
  teamId?: string;
}) {
  return useQuery({
    queryKey: qk.meetings(params),
    queryFn: () => api.getMeetingsView(params),
    staleTime: VIEW_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

export function useMeetingDetail(id: string) {
  return useQuery({ queryKey: qk.meeting(id), queryFn: () => api.getMeetingDetailView(id), staleTime: VIEW_STALE_MS });
}

export function useMeetingContent(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.meetingContent(id),
    queryFn: () => api.meetingContent(id),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function usePeopleView(q?: string) {
  return useQuery({
    queryKey: qk.people(q),
    queryFn: () => api.getPeopleView(q ? { q } : undefined),
    staleTime: VIEW_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

export function useBoardView() {
  return useQuery({ queryKey: qk.board, queryFn: api.getBoardView, staleTime: VIEW_STALE_MS });
}

export function useMaintenanceView() {
  return useQuery({ queryKey: qk.maintenance, queryFn: api.getMaintenanceView, staleTime: VIEW_STALE_MS });
}

export function useGraph(opts?: { limit?: number; center?: string; depth?: number; types?: string[] }) {
  return useQuery({
    queryKey: qk.graph(opts as Record<string, unknown>),
    queryFn: () => api.getGraph(opts),
    staleTime: 60_000,
  });
}

export function useSyncStatus() {
  return useQuery({ queryKey: qk.syncStatus, queryFn: api.syncStatus, staleTime: VIEW_STALE_MS });
}

export function useSyncProgress(polling: boolean) {
  return useQuery({
    queryKey: qk.syncProgress,
    queryFn: api.syncProgress,
    refetchInterval: polling ? 2500 : false,
    staleTime: 0,
  });
}

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: api.getConfig, staleTime: 60_000 });
}

export function useOrgs() {
  return useQuery({ queryKey: qk.orgs, queryFn: api.listOrgs, staleTime: 5 * 60_000 });
}

export function useOrg(orgId: string | undefined) {
  return useQuery({
    queryKey: qk.org(orgId ?? ''),
    queryFn: () => api.getOrg(orgId!),
    enabled: Boolean(orgId),
    staleTime: 5 * 60_000,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: qk.orgMembers(orgId),
    queryFn: () => api.listOrgMembers(orgId),
    staleTime: 60_000,
  });
}

export function useOrgBoardView(orgId: string) {
  return useQuery({
    queryKey: qk.orgBoard(orgId),
    queryFn: () => api.getOrgBoardView(orgId),
    staleTime: VIEW_STALE_MS,
  });
}

export function useOrgMeetingsView(
  orgId: string,
  params?: { limit?: number; offset?: number; q?: string; projectId?: string; teamId?: string },
) {
  return useQuery({
    queryKey: [...qk.orgMeetings(orgId), params ?? {}],
    queryFn: () => api.getOrgMeetingsView(orgId, params),
    staleTime: VIEW_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

export function useOrgMeetingDetail(orgId: string, id: string) {
  return useQuery({
    queryKey: ['org', orgId, 'views', 'meeting', id],
    queryFn: () => api.getOrgMeetingDetailView(orgId, id),
    staleTime: VIEW_STALE_MS,
  });
}

export function useOrgPeopleView(orgId: string, q?: string) {
  return useQuery({
    queryKey: [...qk.orgPeople(orgId), q ?? ''],
    queryFn: () => api.getOrgPeopleView(orgId, q ? { q } : undefined),
    staleTime: VIEW_STALE_MS,
    placeholderData: (prev) => prev,
  });
}

export function useOrgGraph(orgId: string, opts?: { limit?: number; center?: string; depth?: number }) {
  return useQuery({
    queryKey: qk.orgGraph(orgId, opts as Record<string, unknown>),
    queryFn: () => api.getOrgGraph(orgId, opts),
    staleTime: 60_000,
  });
}

export function useOrgHealth(orgId: string) {
  return useQuery({
    queryKey: qk.orgHealth(orgId),
    queryFn: () => api.getOrgHealth(orgId),
    staleTime: VIEW_STALE_MS,
  });
}

/** Invalida todas las vistas de datos tras una mutación de catálogo/tareas. */
export function useInvalidateViews() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ['views'] });
    void client.invalidateQueries({ queryKey: ['org'] });
  };
}
