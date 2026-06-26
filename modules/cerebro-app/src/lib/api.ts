import { getIdToken } from './firebase.js';
import type {
  ApiStatus,
  BoardSnapshot,
  BoardView,
  CerebroStore,
  CreateTodoInput,
  CalendarTodayView,
  DashboardView,
  GraphSnapshot,
  LlmProviderId,
  LlmProviderMeta,
  MaintenanceView,
  MeetingDetailView,
  MeetingsView,
  MeetingTodo,
  MoveTodoInput,
  OrgInvite,
  OrgJoinRequest,
  OrgMember,
  OrgRole,
  Organization,
  PeopleView,
  SearchView,
  SmartSuggestion,
  StoreHealthMetrics,
  Suggestion,
  SyncProgressResponse,
  UpdateTodoInput,
  UserAppSettings,
  UserMembership,
} from '@shared/types.js';

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  acceptStatuses: number[] = [],
): Promise<T> {
  const token = await getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  if (!res.ok && !acceptStatuses.includes(res.status)) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(err.error || err.message || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<{ ok: boolean }>('/api/health'),

  // --- Vistas por pantalla (una request por vista) ---
  getDashboardView: () => apiFetch<DashboardView>('/api/views/dashboard'),
  getCalendarToday: (timezone?: string) => {
    const q = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
    return apiFetch<CalendarTodayView>(`/api/views/calendar/today${q}`);
  },
  getMeetingsView: (opts?: {
    limit?: number;
    offset?: number;
    q?: string;
    projectId?: string;
    teamId?: string;
    sort?: string;
  }) => {
    const q = new URLSearchParams();
    q.set('limit', String(opts?.limit ?? 50));
    if (opts?.offset !== undefined) q.set('offset', String(opts.offset));
    if (opts?.q) q.set('q', opts.q);
    if (opts?.projectId) q.set('projectId', opts.projectId);
    if (opts?.teamId) q.set('teamId', opts.teamId);
    if (opts?.sort) q.set('sort', opts.sort);
    const qs = q.toString();
    return apiFetch<MeetingsView>(`/api/views/meetings${qs ? `?${qs}` : ''}`);
  },
  getMeetingDetailView: (id: string) =>
    apiFetch<MeetingDetailView>(`/api/views/meetings/${encodeURIComponent(id)}`),
  getPeopleView: (opts?: { q?: string }) =>
    apiFetch<PeopleView>(`/api/views/people${opts?.q ? `?q=${encodeURIComponent(opts.q)}` : ''}`),
  getBoardView: () => apiFetch<BoardView>('/api/views/board'),
  getMaintenanceView: () => apiFetch<MaintenanceView>('/api/views/maintenance'),
  search: (q: string, limit?: number) =>
    apiFetch<SearchView>(
      `/api/views/search?q=${encodeURIComponent(q)}${limit ? `&limit=${limit}` : ''}`,
    ),
  acceptSmartSuggestion: (id: string) =>
    apiFetch<{ suggestion: SmartSuggestion; createdTodoId?: string }>(
      `/api/views/suggestions/${encodeURIComponent(id)}/accept`,
      { method: 'POST' },
    ),
  dismissSmartSuggestion: (id: string) =>
    apiFetch<{ suggestion: SmartSuggestion }>(
      `/api/views/suggestions/${encodeURIComponent(id)}/dismiss`,
      { method: 'POST' },
    ),

  runIntelligence: () =>
    apiFetch<{ suggestions: number; digest: boolean }>('/api/views/intelligence/run', { method: 'POST' }),

  // --- Vistas por pantalla (scope organización) ---
  getOrgMeetingsView: (
    orgId: string,
    opts?: { limit?: number; offset?: number; q?: string; projectId?: string; teamId?: string; sort?: string },
  ) => {
    const q = new URLSearchParams();
    q.set('limit', String(opts?.limit ?? 50));
    if (opts?.offset !== undefined) q.set('offset', String(opts.offset));
    if (opts?.q) q.set('q', opts.q);
    if (opts?.projectId) q.set('projectId', opts.projectId);
    if (opts?.teamId) q.set('teamId', opts.teamId);
    if (opts?.sort) q.set('sort', opts.sort);
    const qs = q.toString();
    return apiFetch<MeetingsView>(`/api/orgs/${orgId}/views/meetings${qs ? `?${qs}` : ''}`);
  },
  getOrgMeetingDetailView: (orgId: string, id: string) =>
    apiFetch<MeetingDetailView>(`/api/orgs/${orgId}/views/meetings/${encodeURIComponent(id)}`),
  getOrgPeopleView: (orgId: string, opts?: { q?: string }) =>
    apiFetch<PeopleView>(`/api/orgs/${orgId}/views/people${opts?.q ? `?q=${encodeURIComponent(opts.q)}` : ''}`),
  getOrgBoardView: (orgId: string) => apiFetch<BoardView>(`/api/orgs/${orgId}/views/board`),
  getOrgMaintenanceView: (orgId: string) => apiFetch<MaintenanceView>(`/api/orgs/${orgId}/views/maintenance`),

  getConfig: () => apiFetch<UserAppSettings>('/api/config'),
  saveConfig: (patch: Partial<UserAppSettings>) =>
    apiFetch<UserAppSettings>('/api/config', { method: 'PUT', body: JSON.stringify(patch) }),

  googleStatus: () => apiFetch<{ connected: boolean; hasCalendarScope?: boolean }>('/api/auth/status'),
  refreshGoogleTimezone: () =>
    apiFetch<{ timezone: string; locale?: UserAppSettings['locale'] }>('/api/auth/google/refresh-timezone', {
      method: 'POST',
    }),
  googleStart: () => apiFetch<{ url: string }>('/api/auth/google/start'),
  googleCalendarStart: () => apiFetch<{ url: string }>('/api/auth/google/calendar/start'),
  googleRevoke: () => apiFetch<{ ok: boolean }>('/api/auth/google/revoke', { method: 'POST' }),
  googlePickerConfig: () =>
    apiFetch<{ accessToken: string; apiKey?: string; appId: string; clientId: string }>(
      '/api/auth/google/picker-config',
    ),

  listFolders: (parentId = 'root', q?: string, sharedWithMe = false) =>
    apiFetch<{ folders: Array<{ id: string; name: string }> }>(
      `/api/drive/folders?parentId=${encodeURIComponent(parentId)}${q ? `&q=${encodeURIComponent(q)}` : ''}${sharedWithMe ? '&sharedWithMe=true' : ''}`,
    ),
  suggestFolders: () => apiFetch<{ folders: Array<{ id: string; name: string }> }>('/api/drive/folders/suggest'),
  testFolder: (folderId: string) =>
    apiFetch<{ ok: boolean; docCount: number; sample: string[] }>('/api/drive/test-folder', {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    }),
  testAllSources: () =>
    apiFetch<{ results: Array<{ label: string; folderId: string; ok: boolean; docCount: number; sample: string[] }> }>(
      '/api/drive/test-all-sources',
      { method: 'POST' },
    ),

  syncStatus: () => apiFetch<ApiStatus>('/api/sync/status'),
  syncScan: () => apiFetch<{ scanned: number }>('/api/sync/scan', { method: 'POST' }),
  syncRun: (limit?: number) =>
    apiFetch<{ started?: boolean; alreadyRunning?: boolean; startedAt?: string; message?: string }>(
      '/api/sync/run',
      {
        method: 'POST',
        body: JSON.stringify({ limit }),
      },
      [202],
    ),
  syncPipeline: (options?: { limit?: number; skipAnalysis?: boolean }) =>
    apiFetch<{ started?: boolean; alreadyRunning?: boolean; startedAt?: string; message?: string }>(
      '/api/sync/pipeline',
      {
        method: 'POST',
        body: JSON.stringify(options ?? {}),
      },
      [202],
    ),
  syncProgress: () => apiFetch<SyncProgressResponse>('/api/sync/progress'),

  listMeetings: () => apiFetch<{ meetings: unknown[] }>('/api/meetings'),
  meetingContent: (id: string) => apiFetch<{ content: string }>(`/api/meetings/${id}/content`),
  importMeetings: () => apiFetch<CerebroStore>('/api/meetings/import', { method: 'POST' }),

  getStore: () => apiFetch<CerebroStore>('/api/store'),
  getStoreSummary: () =>
    apiFetch<{
      meta: Record<string, unknown> | null;
      health: StoreHealthMetrics;
      storeVersion?: number;
      needsMigration?: boolean;
    }>('/api/store/summary'),
  listStoreMeetings: (opts?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set('limit', String(opts.limit));
    if (opts?.offset !== undefined) q.set('offset', String(opts.offset));
    const qs = q.toString();
    return apiFetch<{ meetings: unknown[]; total: number }>(`/api/store/meetings${qs ? `?${qs}` : ''}`);
  },
  saveStore: (store: CerebroStore) =>
    apiFetch<{ ok: boolean }>('/api/store', { method: 'PUT', body: JSON.stringify(store) }),
  migrateStoreV2: () =>
    apiFetch<{ ok: boolean; meta: Record<string, unknown> }>('/api/admin/migrate-store-v2', { method: 'POST' }),

  assistantStatus: () => apiFetch<{ ok: boolean; llmConfigured: boolean }>('/api/assistant/status'),
  assistantConversations: () =>
    apiFetch<{
      conversations: Array<{ id: string; title: string; updatedAt: string; createdAt?: string }>;
    }>('/api/assistant/conversations'),
  getAssistantConversation: (id: string) =>
    apiFetch<{
      id: string;
      title: string;
      messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        createdAt?: string;
        toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: unknown }>;
      }>;
      updatedAt: string;
    }>(`/api/assistant/conversations/${encodeURIComponent(id)}`),
  deleteAssistantConversation: (id: string) =>
    apiFetch<void>(`/api/assistant/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }, [204]),
  assistantChat: async (
    message: string,
    conversationId: string | undefined,
    pageContext: Record<string, unknown> | undefined,
    onEvent: (event: {
      type: string;
      message?: string;
      delta?: string;
      conversationId?: string;
      name?: string;
      args?: Record<string, unknown>;
      result?: unknown;
    }) => void,
  ): Promise<void> => {
    const token = await getIdToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversationId, pageContext }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || `${res.status} ${res.statusText}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Sin stream de respuesta');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as { type: string });
        } catch {
          /* ignore malformed */
        }
      }
    }
  },

  cerebroStatus: () => apiFetch<{ ok: boolean; llmConfigured: boolean }>('/api/cerebro/status'),
  cerebroContext: (clientContext: Record<string, unknown>, dismissed?: string[]) =>
    apiFetch<import('@shared/cerebro-chat.js').CerebroContextResponse>('/api/cerebro/context', {
      method: 'POST',
      body: JSON.stringify({ clientContext, dismissedMomentKeys: dismissed }),
    }),
  cerebroChat: async (
    message: string,
    conversationId: string | undefined,
    clientContext: Record<string, unknown>,
    dismissedMomentKeys: string[] | undefined,
    onEvent: (event: Record<string, unknown>) => void,
  ): Promise<void> => {
    const token = await getIdToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch('/api/cerebro/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversationId, clientContext, dismissedMomentKeys }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || `${res.status} ${res.statusText}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Sin stream de respuesta');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          onEvent(JSON.parse(line.slice(6)) as Record<string, unknown>);
        } catch {
          /* ignore */
        }
      }
    }
  },

  cerebroConversations: () =>
    apiFetch<{
      conversations: Array<{ id: string; title: string; updatedAt: string; createdAt?: string }>;
    }>('/api/cerebro/conversations'),
  deleteCerebroConversation: (id: string) =>
    apiFetch<void>(`/api/cerebro/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }, [204]),
  cerebroDismissMoment: (conversationId: string, momentKey: string) =>
    apiFetch<{ ok: boolean }>('/api/cerebro/moments/dismiss', {
      method: 'POST',
      body: JSON.stringify({ conversationId, momentKey }),
    }),

  listProviders: () => apiFetch<{ providers: LlmProviderMeta[] }>('/api/secrets/providers'),
  setProviderKey: (providerId: LlmProviderId, apiKey: string, modelDefault?: string) =>
    apiFetch<{ provider: LlmProviderMeta }>(`/api/secrets/providers/${providerId}`, {
      method: 'POST',
      body: JSON.stringify({ apiKey, modelDefault }),
    }),
  testProvider: (providerId: LlmProviderId) =>
    apiFetch<{ ok: boolean }>(`/api/secrets/providers/${providerId}/test`, { method: 'POST' }),
  deleteProvider: (providerId: LlmProviderId) =>
    apiFetch<{ ok: boolean }>(`/api/secrets/providers/${providerId}`, { method: 'DELETE' }),

  analyzeMeeting: (meetingId: string) =>
    apiFetch<{ analysis: unknown; store: CerebroStore }>(`/api/ai/analyze/${meetingId}`, { method: 'POST' }),
  analyzeBatch: (meetingIds?: string[]) =>
    apiFetch<{ jobId: string }>('/api/ai/analyze-batch', {
      method: 'POST',
      body: JSON.stringify({ meetingIds }),
    }),
  getJob: (jobId: string) => apiFetch<unknown>(`/api/ai/jobs/${jobId}`),

  getSuggestions: () => apiFetch<{ suggestions: Suggestion[] }>('/api/catalog/suggestions'),
  getBoard: () => apiFetch<{ board: BoardSnapshot }>('/api/catalog/board'),
  createTodo: (input: CreateTodoInput) =>
    apiFetch<{ store: CerebroStore; todo: MeetingTodo }>('/api/catalog/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateTodo: (id: string, patch: UpdateTodoInput) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  moveTodo: (id: string, input: MoveTodoInput) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/todos/${encodeURIComponent(id)}/move`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  completeTodosBatch: (todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/todos/complete-batch', {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  reopenTodosBatch: (todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/todos/reopen-batch', {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  getCatalogHealth: () => apiFetch<{ health: StoreHealthMetrics }>('/api/catalog/health'),
  getGraph: (opts?: { limit?: number; center?: string; depth?: number; types?: string[] }) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set('limit', String(opts.limit));
    if (opts?.center) q.set('center', opts.center);
    if (opts?.depth) q.set('depth', String(opts.depth));
    if (opts?.types?.length) q.set('types', opts.types.join(','));
    const qs = q.toString();
    return apiFetch<{ graph: GraphSnapshot }>(`/api/catalog/graph${qs ? `?${qs}` : ''}`);
  },
  dismissSuggestion: (id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/suggestions/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
    }),
  acceptProjectSuggestion: (id: string, body?: { existingProjectId?: string; projectName?: string }) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/suggestions/${encodeURIComponent(id)}/accept-project`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  acceptTeamSuggestion: (id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/suggestions/${encodeURIComponent(id)}/accept-team`, {
      method: 'POST',
    }),
  batchDismissSuggestions: (ids: string[]) =>
    apiFetch<{ dismissed: number }>('/api/catalog/suggestions/batch/dismiss', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  batchAcceptProjectSuggestions: (
    ids: string[],
    body?: { existingProjectId?: string; projectName?: string },
  ) =>
    apiFetch<{ accepted: number; skipped: number; undoSnapshots: import('@shared/types.js').SuggestionAcceptUndoSnapshot[] }>(
      '/api/catalog/suggestions/batch/accept-project',
      { method: 'POST', body: JSON.stringify({ ids, ...body }) },
    ),
  batchAcceptTeamSuggestions: (ids: string[]) =>
    apiFetch<{ accepted: number; skipped: number; undoSnapshots: import('@shared/types.js').SuggestionAcceptUndoSnapshot[] }>(
      '/api/catalog/suggestions/batch/accept-team',
      { method: 'POST', body: JSON.stringify({ ids }) },
    ),
  restorePendingSuggestions: (ids: string[]) =>
    apiFetch<{ restored: number }>('/api/catalog/suggestions/batch/restore', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  revertSuggestionAccept: (snapshots: import('@shared/types.js').SuggestionAcceptUndoSnapshot[]) =>
    apiFetch<{ reverted: number }>('/api/catalog/suggestions/batch/revert-accept', {
      method: 'POST',
      body: JSON.stringify({ snapshots }),
    }),
  getProspectCandidates: (prospectId: string) =>
    apiFetch<{
      candidates: Array<{
        personId: string;
        displayName: string;
        emails: string[];
        score: number;
        sharedMeetings: number;
      }>;
    }>(`/api/catalog/prospects/${encodeURIComponent(prospectId)}/candidates`),
  repairStore: (orgId?: string) =>
    apiFetch<{
      ok: boolean;
      started?: boolean;
      alreadyRunning?: boolean;
      startedAt?: string;
      message?: string;
    }>('/api/admin/repair-store', {
      method: 'POST',
      body: JSON.stringify(orgId ? { orgId } : {}),
    }, [202]),

  createTeam: (name: string) =>
    apiFetch<{ store: CerebroStore; team: { id: string; name: string } }>('/api/catalog/teams', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateTeam: (id: string, patch: Record<string, unknown>) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/teams/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  assignEmailToTeam: (teamId: string, email: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/teams/${encodeURIComponent(teamId)}/assign-email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  deleteTeam: (id: string) => apiFetch<{ store: CerebroStore }>(`/api/catalog/teams/${id}`, { method: 'DELETE' }),
  createProject: (name: string) =>
    apiFetch<{ store: CerebroStore; project: { id: string; name: string } }>('/api/catalog/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteProject: (id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/projects/${id}`, { method: 'DELETE' }),
  updatePerson: (id: string, patch: Record<string, unknown>) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  mergePeople: (canonicalId: string, mergeIds: string[]) =>
    apiFetch<{ store: CerebroStore; merged: number }>('/api/catalog/people/merge', {
      method: 'POST',
      body: JSON.stringify({ canonicalId, mergeIds }),
    }),
  promoteProspect: (
    prospectId: string,
    email: string,
    displayName?: string,
    enrichment?: import('@shared/types.js').ProspectResolveEnrichment,
  ) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/prospects/${prospectId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ email, displayName, ...enrichment }),
    }),
  linkProspect: (
    prospectId: string,
    personId: string,
    enrichment?: import('@shared/types.js').ProspectResolveEnrichment,
  ) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/prospects/${prospectId}/link`, {
      method: 'POST',
      body: JSON.stringify({ personId, ...enrichment }),
    }),
  dismissProspect: (prospectId: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/catalog/prospects/${prospectId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  dismissTeamEmailReassign: (personId: string, email: string) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/maintenance/dismiss-team-email', {
      method: 'POST',
      body: JSON.stringify({ personId, email }),
    }),
  dismissMergeContact: (suggestionId: string) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/maintenance/dismiss-merge', {
      method: 'POST',
      body: JSON.stringify({ suggestionId }),
    }),
  acceptTodosBatch: (todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/todos/accept-batch', {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  dismissTodosBatch: (todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>('/api/catalog/todos/dismiss-batch', {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),

  listOrgs: () => apiFetch<{ memberships: UserMembership[] }>('/api/orgs'),
  listOrgsByDomain: () => apiFetch<{ orgs: Organization[] }>('/api/orgs/match-domain'),
  createOrg: (body: { name: string; slug?: string; domains?: string[]; joinPolicy?: Organization['joinPolicy'] }) =>
    apiFetch<{ org: Organization; member: OrgMember }>('/api/orgs', { method: 'POST', body: JSON.stringify(body) }),
  updateOrg: (
    orgId: string,
    patch: { name?: string; domains?: string[]; joinPolicy?: Organization['joinPolicy']; branding?: Organization['branding'] | Record<string, never> },
  ) =>
    apiFetch<{ org: Organization }>(`/api/orgs/${orgId}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  uploadOrgLogo: (orgId: string, body: { dataBase64: string; mimeType: string; fileName: string }) =>
    apiFetch<{ logoUrl: string; org: Organization }>(`/api/orgs/${orgId}/branding/logo`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  requestOrgJoin: (orgId: string) =>
    apiFetch<{ status: 'joined' | 'pending'; orgId: string }>(`/api/orgs/${orgId}/join-request`, { method: 'POST' }),
  listOrgJoinRequests: (orgId: string) => apiFetch<{ requests: OrgJoinRequest[] }>(`/api/orgs/${orgId}/join-requests`),
  approveOrgJoinRequest: (orgId: string, requestId: string) =>
    apiFetch<{ ok: boolean }>(`/api/orgs/${orgId}/join-requests/${requestId}/approve`, { method: 'POST' }),
  rejectOrgJoinRequest: (orgId: string, requestId: string) =>
    apiFetch<{ ok: boolean }>(`/api/orgs/${orgId}/join-requests/${requestId}/reject`, { method: 'POST' }),
  getOrg: (orgId: string) => apiFetch<{ org: Organization }>(`/api/orgs/${orgId}`),
  getOrgStore: (orgId: string) => apiFetch<CerebroStore>(`/api/orgs/${orgId}/store`),
  ingestOrg: (orgId: string) => apiFetch<{ merged: number }>(`/api/orgs/${orgId}/ingest`, { method: 'POST' }),
  listOrgMembers: (orgId: string) => apiFetch<{ members: OrgMember[] }>(`/api/orgs/${orgId}/members`),
  createOrgInvite: (orgId: string, email: string, role?: OrgRole) =>
    apiFetch<{ invite: OrgInvite; token: string; joinUrl: string }>(`/api/orgs/${orgId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  listOrgInvites: (orgId: string) => apiFetch<{ invites: OrgInvite[] }>(`/api/orgs/${orgId}/invites`),
  joinOrg: (token: string) => apiFetch<{ orgId: string; role: OrgRole }>(`/api/orgs/join/${token}`, { method: 'POST' }),
  getOrgSuggestions: (orgId: string) => apiFetch<{ suggestions: Suggestion[] }>(`/api/orgs/${orgId}/suggestions`),
  getOrgBoard: (orgId: string) => apiFetch<{ board: BoardSnapshot }>(`/api/orgs/${orgId}/catalog/board`),
  orgCreateTodo: (orgId: string, input: CreateTodoInput) =>
    apiFetch<{ store: CerebroStore; todo: MeetingTodo }>(`/api/orgs/${orgId}/catalog/todos`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  orgUpdateTodo: (orgId: string, id: string, patch: UpdateTodoInput) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  orgMoveTodo: (orgId: string, id: string, input: MoveTodoInput) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/${encodeURIComponent(id)}/move`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  orgCompleteTodosBatch: (orgId: string, todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/complete-batch`, {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  orgReopenTodosBatch: (orgId: string, todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/reopen-batch`, {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  getOrgHealth: (orgId: string) => apiFetch<{ health: StoreHealthMetrics }>(`/api/orgs/${orgId}/health`),
  getOrgGraph: (
    orgId: string,
    opts?: { limit?: number; center?: string; depth?: number; types?: string[]; memberUid?: string },
  ) => {
    const q = new URLSearchParams();
    if (opts?.limit) q.set('limit', String(opts.limit));
    if (opts?.center) q.set('center', opts.center);
    if (opts?.depth) q.set('depth', String(opts.depth));
    if (opts?.types?.length) q.set('types', opts.types.join(','));
    if (opts?.memberUid) q.set('memberUid', opts.memberUid);
    const qs = q.toString();
    return apiFetch<{ graph: GraphSnapshot }>(`/api/orgs/${orgId}/graph${qs ? `?${qs}` : ''}`);
  },
  orgDismissSuggestion: (orgId: string, id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/suggestions/${encodeURIComponent(id)}/dismiss`, {
      method: 'POST',
    }),
  orgAcceptProjectSuggestion: (
    orgId: string,
    id: string,
    body?: { existingProjectId?: string; projectName?: string },
  ) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/suggestions/${encodeURIComponent(id)}/accept-project`, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  orgAcceptTeamSuggestion: (orgId: string, id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/suggestions/${encodeURIComponent(id)}/accept-team`, {
      method: 'POST',
    }),
  orgGetProspectCandidates: (orgId: string, prospectId: string) =>
    apiFetch<{
      candidates: Array<{
        personId: string;
        displayName: string;
        emails: string[];
        score: number;
        sharedMeetings: number;
      }>;
    }>(`/api/orgs/${orgId}/prospects/${encodeURIComponent(prospectId)}/candidates`),

  orgMergePeople: (orgId: string, canonicalId: string, mergeIds: string[]) =>
    apiFetch<{ store: CerebroStore; merged: number }>(`/api/orgs/${orgId}/catalog/people/merge`, {
      method: 'POST',
      body: JSON.stringify({ canonicalId, mergeIds }),
    }),
  orgPromoteProspect: (
    orgId: string,
    prospectId: string,
    email: string,
    displayName?: string,
    enrichment?: import('@shared/types.js').ProspectResolveEnrichment,
  ) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/prospects/${prospectId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ email, displayName, ...enrichment }),
    }),
  orgLinkProspect: (
    orgId: string,
    prospectId: string,
    personId: string,
    enrichment?: import('@shared/types.js').ProspectResolveEnrichment,
  ) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/prospects/${prospectId}/link`, {
      method: 'POST',
      body: JSON.stringify({ personId, ...enrichment }),
    }),
  orgDismissProspect: (orgId: string, prospectId: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/prospects/${prospectId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  orgUpdatePerson: (orgId: string, personId: string, patch: Record<string, unknown>) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/people/${personId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  orgAcceptTodosBatch: (orgId: string, todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/accept-batch`, {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  orgDismissTodosBatch: (orgId: string, todoIds: string[]) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/todos/dismiss-batch`, {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
  orgCreateTeam: (orgId: string, name: string) =>
    apiFetch<{ store: CerebroStore; team: { id: string; name: string } }>(`/api/orgs/${orgId}/catalog/teams`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  orgDeleteTeam: (orgId: string, id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/teams/${id}`, { method: 'DELETE' }),
  orgCreateProject: (orgId: string, name: string) =>
    apiFetch<{ store: CerebroStore; project: { id: string; name: string } }>(`/api/orgs/${orgId}/catalog/projects`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  orgDeleteProject: (orgId: string, id: string) =>
    apiFetch<{ store: CerebroStore }>(`/api/orgs/${orgId}/catalog/projects/${id}`, { method: 'DELETE' }),
};
