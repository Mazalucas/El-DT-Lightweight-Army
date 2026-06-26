/** Shared types — cerebro-app SPA + Cloud Functions */

export type SyncStatus = 'discovered' | 'synced' | 'sync_error' | 'skipped' | 'content_pending';
export type AnalysisStatus = 'pending' | 'analyzed' | 'needs_review';

export type MeetSourceType = 'primary' | 'team' | 'shared_inbox';

export interface MeetSourceConfig {
  driveFolderId: string;
  label: string;
  teamId?: string;
  sourceType?: MeetSourceType;
}

export interface SyncScheduleConfig {
  enabled: boolean;
  hour: number;
  minute: number;
  timezone: string;
  lastRunAt?: string;
  lastRunStatus?: 'ok' | 'error' | 'partial' | 'skipped';
  lastRunSummary?: string;
}

export interface SyncPolicyConfig {
  /** 0 = sin límite. Sync, import, contactos, tareas y análisis IA. */
  processLookbackDays: number;
}

export interface SetupProgress {
  sharedInboxGuideDone?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  tags?: string[];
  emails?: string[];
}

export type ThemePreference = 'dark' | 'light' | 'system';

/** Preferencias del copiloto in-app Cerebro (Ajustes → Cerebro). */
export interface CerebroSettingsPrefs {
  proactiveLevel: 'off' | 'subtle' | 'active';
  meetingReminderMinutes: 10 | 15 | 30;
  chipMeetingMinutesMax: 60 | 90 | 120;
}

export type TimezoneSource = 'device' | 'google_calendar' | 'manual';

export interface LocaleSettings {
  timezoneSource: TimezoneSource;
  /** IANA: valor manual, cache de Google, o última TZ del dispositivo */
  timezone: string;
  /** Cache de calendars.get('primary').timeZone */
  googleCalendarTimezone?: string;
}

export interface UserAppSettings {
  meetSources: MeetSourceConfig[];
  teams: Team[];
  appearance: {
    theme: ThemePreference;
  };
  reminders: {
    defaultCategoryId: string;
    pollIntervalMs: number;
  };
  ai: {
    defaultProviderId: string;
    autoAnalyzeAfterSync?: boolean;
  };
  cerebro?: CerebroSettingsPrefs;
  locale?: LocaleSettings;
  syncSchedule?: SyncScheduleConfig;
  syncPolicy?: SyncPolicyConfig;
  setupProgress?: SetupProgress;
}

export const DEFAULT_SETTINGS: UserAppSettings = {
  meetSources: [],
  appearance: {
    theme: 'system',
  },
  teams: [
    { id: 'innovacion', name: 'Innovación', color: '#3b82f6' },
    { id: 'general', name: 'General', color: '#64748b' },
  ],
  reminders: {
    defaultCategoryId: 'personal',
    pollIntervalMs: 30000,
  },
  ai: {
    defaultProviderId: 'google_gemini',
    autoAnalyzeAfterSync: true,
  },
  cerebro: {
    proactiveLevel: 'subtle',
    meetingReminderMinutes: 10,
    chipMeetingMinutesMax: 90,
  },
  locale: {
    timezoneSource: 'device',
    timezone: 'America/Argentina/Buenos_Aires',
  },
  syncSchedule: {
    enabled: false,
    hour: 8,
    minute: 0,
    timezone: 'America/Argentina/Buenos_Aires',
  },
  syncPolicy: {
    processLookbackDays: 30,
  },
  setupProgress: {},
};

export type EmailSource =
  | 'invite'
  | 'mention'
  | 'drive'
  | 'transcript'
  | 'owner'
  | 'participant';

export interface EmailMetaEntry {
  sources: EmailSource[];
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface Person {
  id: string;
  displayName: string;
  aliases: string[];
  teamIds: string[];
  projectIds: string[];
  emails: string[];
  emailMeta?: Record<string, EmailMetaEntry>;
  notes?: string;
}

export interface PersonProspect {
  id: string;
  displayName: string;
  aliases: string[];
  meetingIds: string[];
  sources?: EmailSource[];
  linkedPersonId?: string;
  lastSeenAt?: string;
}

export interface Project {
  id: string;
  name: string;
  tags: string[];
}

export interface Meeting {
  id: string;
  docId?: string;
  sourceFile: string;
  title: string;
  startedAt?: string;
  timezone?: string;
  summary?: string;
  participants: string[];
  participantEmails?: string[];
  personIds: string[];
  prospectIds: string[];
  teamIds: string[];
  projectIds: string[];
  syncStatus: SyncStatus;
  analysisStatus: AnalysisStatus;
  actionItems?: string[];
  bodyPreview?: string;
  updatedAt: string;
  /** Última vez que el mirror/contenido se sincronizó desde Drive. */
  lastSyncedAt?: string;
  driveFolderId?: string;
  teamId?: string;
  contributorUids?: string[];
}

export type TodoSourceSection = 'proximos_pasos' | 'sugerencias' | 'analysis';
export type MeetingTodoSource = 'extracted' | 'manual' | 'cursor-chat' | 'ai';

export type TodoPriority = 'low' | 'normal' | 'high';

export interface MeetingTodo {
  id: string;
  text: string;
  meetingId: string;
  meetingTitle?: string;
  meetingStartedAt?: string;
  assigneeLabel?: string;
  assigneePersonIds?: string[];
  status: 'suggested' | 'open' | 'done' | 'dismissed';
  dueAt?: string;
  tags?: string[];
  categoryId?: string;
  personIds: string[];
  teamIds: string[];
  projectIds: string[];
  source?: MeetingTodoSource;
  sourceSection?: TodoSourceSection;
  extractedAt?: string;
  completedAt?: string;
  notes?: string;
  boardPosition?: number;
  priority?: TodoPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  text: string;
  projectIds?: string[];
  teamIds?: string[];
  assigneePersonIds?: string[];
  dueAt?: string;
  notes?: string;
  priority?: TodoPriority;
}

export interface UpdateTodoInput {
  text?: string;
  projectIds?: string[];
  teamIds?: string[];
  assigneePersonIds?: string[];
  dueAt?: string | null;
  notes?: string;
  priority?: TodoPriority;
  boardPosition?: number;
}

export interface MoveTodoInput {
  status: MeetingTodo['status'];
  boardPosition?: number;
}

export interface BoardCounts {
  suggested: number;
  open: number;
  done: number;
  suggestions: number;
}

export interface BoardSnapshot {
  todos: MeetingTodo[];
  suggestions: Suggestion[];
  projects: Project[];
  teams: Team[];
  people: Person[];
  counts: BoardCounts;
}

export interface CerebroStore {
  version: number;
  savedAt: string;
  meetings: Meeting[];
  people: Person[];
  prospects: PersonProspect[];
  /** Claves normalizadas de nombres descartados como prospect (no reindexar). */
  dismissedProspectKeys?: string[];
  /** IDs de prospect descartados (huérfanos en reuniones). */
  dismissedProspectIds?: string[];
  /** Claves personId:email de reasignaciones de equipo descartadas. */
  dismissedTeamEmailKeys?: string[];
  /** IDs de sugerencias merge_contacts descartadas (merge-email-*, merge-name-*). */
  dismissedMergeContactKeys?: string[];
  projects: Project[];
  teams: Team[];
  todos: MeetingTodo[];
  pendingSuggestions?: PendingSuggestion[];
  graphEdges?: StoredGraphEdge[];
}

export interface ManifestEntry {
  meetingId: string;
  docId?: string;
  driveFileId?: string;
  sourceFile: string;
  title: string;
  startedAt?: string;
  timezone?: string;
  teamId?: string;
  syncStatus: SyncStatus;
  analysisStatus: AnalysisStatus;
  lastSyncedAt?: string;
  syncError?: string;
  contentHash?: string;
  driveFolderId?: string;
  /** Google Drive modifiedTime — detectar cambios sin re-descargar todo. */
  driveModifiedTime?: string;
}

export interface SyncProgress {
  phase: 'idle' | 'scan' | 'sync' | 'import' | 'reindex' | 'todos' | 'analyze' | 'pipeline' | 'repair';
  current: number;
  total: number;
  done: boolean;
  currentTitle?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: {
    scanned: number;
    synced: number;
    skipped: number;
    errors: number;
    messages: string[];
    imported?: number;
    analysisJobId?: string;
  };
}

export interface SyncProgressResponse extends SyncProgress {
  running?: boolean;
}

export type LlmProviderId = 'google_gemini' | 'openai';

export interface LlmProviderMeta {
  providerId: LlmProviderId;
  label: string;
  keyHint: string;
  modelDefault: string;
  enabled: boolean;
  lastValidatedAt?: string;
  lastError?: string;
}

export interface AnalysisPayload {
  analysisVersion: 1;
  id: string;
  meetingId: string;
  people?: Array<{ displayName: string; teamIds?: string[] }>;
  summary?: string;
  themes?: string[];
  objectives?: string[];
  actionItems?: string[];
  projects?: string[];
  confidence?: 'high' | 'medium' | 'low';
  needsReview?: boolean;
}

export interface AiJob {
  id: string;
  type: 'analyze_one' | 'analyze_batch';
  status: 'pending' | 'running' | 'done' | 'error';
  meetingIds: string[];
  progress: number;
  total: number;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface PipelineRunResult {
  scanned: number;
  synced: number;
  skipped: number;
  errors: number;
  imported: number;
  analysisJobId?: string;
  messages: string[];
}

export interface ApiStatus {
  hasFirebaseAuth: boolean;
  hasGoogleIntegration: boolean;
  meetingCount: number;
  mirrorCount: number;
  syncRunning: boolean;
  syncProgress?: SyncProgress;
  llmProviders: LlmProviderMeta[];
  meetSourceCount: number;
  setupComplete: boolean;
  syncSchedule?: SyncScheduleConfig;
  /** Mejor timestamp disponible (schedule, lastRun doc, progreso). */
  lastSyncAt?: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

// --- Organizaciones (SaaS) ---

export type OrgRole = 'org_owner' | 'org_admin' | 'org_member';
export type OrgJoinPolicy = 'invite_only' | 'domain_request' | 'domain_auto';
export type OrgMemberStatus = 'active' | 'pending' | 'removed';
export type OrgInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface OrgBranding {
  logoUrl?: string;
  accentColor?: string;
  displayName?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domains: string[];
  joinPolicy: OrgJoinPolicy;
  plan: 'free' | 'team' | 'business';
  createdAt: string;
  createdBy: string;
  branding?: OrgBranding;
}

export interface OrgMember {
  uid: string;
  email: string;
  displayName?: string;
  role: OrgRole;
  status: OrgMemberStatus;
  joinedAt: string;
  invitedVia?: string;
  lastSyncAt?: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: OrgRole;
  status: OrgInviteStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export type OrgJoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OrgJoinRequest {
  id: string;
  uid: string;
  email: string;
  status: OrgJoinRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface UserMembership {
  orgId: string;
  orgName: string;
  role: OrgRole;
}

// --- Sugerencias (inbox) ---

export type SuggestionKind =
  | 'merge_contacts'
  | 'promote_prospect'
  | 'link_prospect'
  | 'assign_project'
  | 'assign_team'
  | 'reassign_team_email'
  | 'accept_todo'
  | 'review_meeting';

export type PendingSuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export type PendingSuggestionSource = 'import' | 'ai' | 'inferred' | 'co_attendance';

export interface PendingSuggestion {
  id: string;
  kind: SuggestionKind;
  status: PendingSuggestionStatus;
  title: string;
  detail?: string;
  payload: Record<string, unknown>;
  meetingId?: string;
  source: PendingSuggestionSource;
  confidence?: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  detail?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface StoreHealthMetrics {
  meetingsTotal: number;
  meetingsSynced: number;
  meetingsWithoutResolvedParticipants: number;
  staleParticipantLinks?: number;
  prospectsPending: number;
  projectSuggestionsPending: number;
  teamSuggestionsPending: number;
  todosSuggested: number;
  todosOpen: number;
  orphanProjects: number;
  uuidProjects?: number;
  contactsCount: number;
  needsRepair?: boolean;
  orgIngestLagMs?: number;
  generatedAt: string;
}

// --- Inteligencia (Suggestion Engine v2) ---

export type SmartSuggestionKind =
  | 'follow_up'
  | 'commitment'
  | 'no_next_steps'
  | 'reconnect'
  | 'prepare'
  | 'insight';

export type SmartSuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'expired';

export interface SmartSuggestionEvidence {
  meetingId?: string;
  meetingTitle?: string;
  meetingDate?: string;
  quote?: string;
  personIds?: string[];
  personNames?: string[];
}

export type SmartSuggestionActionKind = 'create_todo' | 'open_meeting' | 'open_person' | 'none';

export interface SmartSuggestionAction {
  kind: SmartSuggestionActionKind;
  /** Para create_todo: { text, dueAt?, assigneeLabel? }; para open_*: { meetingId } | { personId } */
  payload?: Record<string, unknown>;
}

/** Sugerencia generada por el motor de inteligencia: qué + por qué + acción de un click. */
export interface SmartSuggestion {
  id: string;
  kind: SmartSuggestionKind;
  title: string;
  /** Por qué se sugiere — evidencia citada en lenguaje natural. */
  reason: string;
  evidence?: SmartSuggestionEvidence;
  action: SmartSuggestionAction;
  /** 0–100; mayor = más urgente/relevante. */
  score: number;
  status: SmartSuggestionStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingPrepFactKind = 'same_people' | 'same_project' | 'recurring_series' | 'open_commitment';

export interface MeetingPrepFact {
  kind: MeetingPrepFactKind;
  calendarEventId: string;
  relatedMeetingIds?: string[];
  relatedPersonIds?: string[];
  relatedProjectIds?: string[];
  relatedTodoIds?: string[];
  /** Texto corto para el LLM; no es copy final de UI. */
  summaryHint: string;
}

export type MeetingPrepEvidenceType = 'meeting' | 'person' | 'todo' | 'project';

export interface MeetingPrepEvidence {
  type: MeetingPrepEvidenceType;
  id: string;
  label: string;
}

export interface MeetingPrepInsight {
  calendarEventId: string;
  eventTitle: string;
  eventStart: string;
  headline: string;
  bullets?: string[];
  evidence: MeetingPrepEvidence[];
}

/** Resumen diario generado por LLM tras cada pipeline; alimenta la pantalla Hoy. */
export interface DailyDigest {
  id: string;
  date: string;
  generatedAt: string;
  headline: string;
  summary: string;
  focus: string[];
  suggestionIds: string[];
  meetingPrepInsights?: MeetingPrepInsight[];
}

// --- Vistas por pantalla (API /api/views) ---

/** Hit de búsqueda semántica sobre el contenido de los mirrors. */
export interface SemanticSearchHit {
  meetingId: string;
  title: string;
  startedAt?: string;
  /** Similitud coseno 0–1 redondeada a 3 decimales. */
  score: number;
  snippet: string;
}

/** Resultado de la búsqueda global (`GET /api/views/search`). */
export interface SearchView {
  meetings: Meeting[];
  people: Array<{ id: string; displayName: string; emails?: string[] }>;
  projects: Array<{ id: string; name: string }>;
  /** Solo presente con índice de embeddings y API key configurada. */
  semantic?: SemanticSearchHit[];
}

export interface MeetingListItem {
  id: string;
  title: string;
  startedAt?: string;
  /** Fecha efectiva para ordenar/mostrar (startedAt o inferida del archivo). */
  displayDate?: string;
  lastSyncedAt?: string;
  summary?: string;
  participants: string[];
  personIds: string[];
  prospectIds: string[];
  teamIds: string[];
  projectIds: string[];
  syncStatus: SyncStatus;
  analysisStatus: AnalysisStatus;
  todoCount: number;
  openTodoCount: number;
}

export type MeetingSortKey =
  | 'date_desc'
  | 'date_asc'
  | 'synced_desc'
  | 'synced_asc'
  | 'title_asc';

export interface MeetingsView {
  meetings: MeetingListItem[];
  total: number;
  limit: number;
  offset: number;
  sort: MeetingSortKey;
  projects: Project[];
  teams: Team[];
}

export interface MeetingDetailView {
  meeting: Meeting;
  todos: MeetingTodo[];
  people: Array<{ id: string; displayName: string; emails: string[] }>;
  prospects: Array<{ id: string; displayName: string }>;
  projects: Project[];
  teams: Team[];
}

export interface PersonListItem {
  id: string;
  kind: 'person' | 'prospect';
  displayName: string;
  emails: string[];
  teamIds: string[];
  projectIds: string[];
  meetingCount: number;
  lastMeetingAt?: string;
  lastMeetingTitle?: string;
  linkedPersonId?: string;
  /** confirmed = contacto con email; inferred = prospect detectado en notas. */
  confidence: 'confirmed' | 'inferred';
}

export interface PeopleView {
  people: PersonListItem[];
  total: number;
  teams: Team[];
  projects: Project[];
}

export interface BoardView {
  todos: MeetingTodo[];
  projects: Project[];
  teams: Team[];
  people: Array<{ id: string; displayName: string }>;
  counts: BoardCounts;
}

/** Acción de mantenimiento de datos (heurística, no IA): merges, asignaciones, prospects. */
export interface MaintenanceItem extends Suggestion {
  source?: PendingSuggestionSource;
  confidence?: 'high' | 'medium' | 'low';
}

export interface MaintenanceView {
  items: MaintenanceItem[];
  counts: Partial<Record<SuggestionKind, number>>;
  total: number;
  generatedAt: string;
}

/** Snapshot mínimo para deshacer un accept de sugerencia de mantenimiento. */
export interface SuggestionAcceptUndoSnapshot {
  suggestionId: string;
  meetingId: string;
  addedProjectId?: string;
  addedTeamId?: string;
}

export interface DashboardDailyTodos {
  overdue: MeetingTodo[];
  today: MeetingTodo[];
  noDate: MeetingTodo[];
  suggested: MeetingTodo[];
}

export interface DashboardAttention {
  maintenanceCount: number;
  maintenancePreview: MaintenanceItem[];
  meetingsNeedsReview: number;
  overdueCount: number;
  todayCount: number;
  suggestedCount: number;
  weekMeetingCount: number;
  syncStale: boolean;
}

export type CalendarEventStatus = 'upcoming' | 'ongoing' | 'past';

export interface CalendarEventItem {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string;
  meetLink?: string;
  htmlLink?: string;
  status?: CalendarEventStatus;
  linkedMeetingId?: string;
  attendeeEmails?: string[];
  recurringEventId?: string;
  /** RRULE crudo de Google Calendar. */
  recurrence?: string[];
  isRecurring?: boolean;
}

export interface CalendarTodayView {
  date: string;
  timezone: string;
  hasCalendarAccess: boolean;
  events: CalendarEventItem[];
  nextEvent?: CalendarEventItem;
  ongoingEvent?: CalendarEventItem;
  eventCount: number;
}

export interface DashboardView {
  date: string;
  digest: DailyDigest | null;
  suggestions: SmartSuggestion[];
  /** @deprecated use dailyTodos */
  dueTodos: MeetingTodo[];
  dailyTodos: DashboardDailyTodos;
  attention: DashboardAttention;
  openTodoCount: number;
  suggestedTodoCount: number;
  recentMeetings: MeetingListItem[];
  meetingCount: number;
  peopleCount: number;
  maintenanceCount: number;
  health: StoreHealthMetrics;
  syncRunning: boolean;
  setupComplete: boolean;
  hasGoogleIntegration: boolean;
  hasLlmKey: boolean;
  lastSyncAt?: string;
  meetingPrepInsights?: MeetingPrepInsight[];
}

// --- Graph ---

export type GraphNodeType = 'person' | 'meeting' | 'project' | 'team' | 'member' | 'prospect' | 'todo';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  meta?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
  weight?: number;
}

export interface StoredGraphEdge extends GraphEdge {
  updatedAt: string;
}

export interface GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
  centerId?: string;
  depth?: number;
  /** Nodo del operador actual (person:* por email de login o member:* en org). */
  selfNodeId?: string;
}
