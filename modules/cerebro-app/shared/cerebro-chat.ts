/** Cerebro in-app chat — shared protocol types (SPA + Cloud Functions). */

import type { EntityEffect, EntityRef } from './cerebro-elements.js';
import type { MeetingPrepFactKind } from './types.js';

export type { EntityEffect, EntityRef } from './cerebro-elements.js';

export type CerebroViewport = 'mobile' | 'desktop';

export type CerebroProactiveLevel = 'off' | 'subtle' | 'active';

export interface CerebroPreferences {
  proactiveLevel: CerebroProactiveLevel;
  meetingReminderMinutes: 10 | 15 | 30;
  chipMeetingMinutesMax: 60 | 90 | 120;
  liveElements?: boolean;
}

export const DEFAULT_CEREBRO_PREFERENCES: CerebroPreferences = {
  proactiveLevel: 'subtle',
  meetingReminderMinutes: 10,
  chipMeetingMinutesMax: 90,
  liveElements: false,
};

export interface CerebroNavigationContext {
  route: string;
  hash: string;
  pageTitle: string;
  pageDescription?: string;
  profTab?: string;
  meetingId?: string;
  personId?: string;
  settingsSection?: string;
  orgId?: string;
  viewport: CerebroViewport;
  /** Entidad bajo foco/selección del usuario (Cerebro Elements). */
  focusedEntity?: EntityRef;
  /** Entidades visibles en viewport para contexto IA. */
  visibleEntities?: EntityRef[];
  /** Detalle resuelto server-side de la entidad focal (p. ej. texto de tarea). */
  focusedEntityDetail?: string;
  /** Chip de meeting prep desde el que el usuario abrió Cerebro. */
  meetingPrepFocus?: {
    calendarEventId: string;
    eventTitle: string;
    factKind: MeetingPrepFactKind;
    chipLabel: string;
  };
}

export interface CerebroCalendarNextEvent {
  id: string;
  title: string;
  startAt: string;
  minutesUntil: number;
  linkedMeetingId?: string;
  meetLink?: string;
  status: 'upcoming' | 'ongoing' | 'past';
}

export interface CerebroCalendarContext {
  hasAccess: boolean;
  nextEvent?: CerebroCalendarNextEvent;
  ongoingEvent?: { title: string; minutesRemaining: number };
  todayEventCount: number;
}

export interface CerebroWorkloadContext {
  overdueTodos: number;
  todayTodos: number;
  pendingSuggestions: number;
  syncStale: boolean;
  lastSyncAt?: string;
}

export interface CerebroAmbientContext {
  visibleTargets: string[];
  activeCueId?: string;
}

export interface CerebroUserContext {
  firstName: string;
  displayName?: string;
  email?: string;
  orgName?: string;
  orgRole?: string;
  timezone: string;
}

export interface CerebroConversationContext {
  id: string;
  focusTopic?: string;
}

export interface CerebroContextSnapshot {
  capturedAt: string;
  navigation: CerebroNavigationContext;
  user: CerebroUserContext;
  calendar: CerebroCalendarContext;
  workload: CerebroWorkloadContext;
  ambient: CerebroAmbientContext;
  conversation?: CerebroConversationContext;
  preferences?: CerebroPreferences;
}

/** Partial snapshot sent from client; server enriches calendar/workload/user. */
export type CerebroClientContextInput = Pick<
  CerebroContextSnapshot,
  'navigation' | 'ambient' | 'conversation' | 'preferences'
> & {
  user?: Partial<CerebroUserContext>;
};

export type UiCueAction = 'spotlight' | 'pulse' | 'navigate' | 'navigate_and_spotlight' | 'clear';

export interface UiCue {
  id: string;
  targetId: string;
  action: UiCueAction;
  message?: string;
  navigateTo?: string;
  settingsSection?: string;
  /** Spotlight sobre entidad de dominio (data-cerebro-entity). */
  entityRef?: EntityRef;
}

export type MomentKind =
  | 'meeting_imminent'
  | 'meeting_soon'
  | 'meeting_now'
  | 'sync_stale'
  | 'overdue_todos';

export interface MomentCardAction {
  id: string;
  label: string;
  kind: 'navigate' | 'message' | 'dismiss';
  payload?: string;
}

export function cerebroMomentKey(kind: MomentKind, eventId?: string): string {
  return eventId ? `${kind}:${eventId}` : kind;
}

export function resolveMomentKey(block: MomentCardBlock): string {
  if (block.momentKey) return block.momentKey;
  const eventId =
    block.meta?.eventId ??
    block.meta?.linkedMeetingId ??
    block.meta?.startAt ??
    block.kind;
  return cerebroMomentKey(block.kind, String(eventId));
}

export interface MomentCardBlock {
  type: 'moment_card';
  kind: MomentKind;
  /** Stable id for dismiss + dedup (server sets this). */
  momentKey?: string;
  title: string;
  body: string;
  meta?: {
    eventId?: string;
    startAt?: string;
    minutesUntil?: number;
    meetLink?: string;
    linkedMeetingId?: string;
    prepFacts?: string[];
  };
  actions: MomentCardAction[];
  dismissible: true;
}

export interface PlanStepBlock {
  id: string;
  label: string;
  tool?: string;
  /** Entidad objetivo del paso (p. ej. tarea a mover). */
  entityRef?: EntityRef;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
}

export interface PlanCardBlock {
  type: 'plan_card';
  planId: string;
  title: string;
  summary: string;
  steps: PlanStepBlock[];
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed';
}

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface EntityCardBlock {
  type: 'entity_card';
  ref: EntityRef;
  title: string;
  subtitle?: string;
  statusLabel?: string;
}

export type CerebroContentBlock = TextBlock | PlanCardBlock | MomentCardBlock | EntityCardBlock;

export interface ActionPlan {
  id: string;
  title: string;
  summary: string;
  steps: Array<{
    id: string;
    label: string;
    tool: string;
    args: Record<string, unknown>;
    entityRef?: EntityRef;
  }>;
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed';
}

export type CerebroSseEvent =
  | { type: 'status'; message: string }
  | { type: 'plan'; plan: { domains: string[]; intent: string; summary: string; suggestedTools: string[] } }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'text'; delta: string }
  | { type: 'block'; block: CerebroContentBlock }
  | { type: 'ui_cue'; cue: UiCue }
  | { type: 'entity_effect'; effect: EntityEffect }
  | { type: 'proactive_moment'; moment: MomentCardBlock }
  | { type: 'done'; conversationId: string; message: string }
  | { type: 'error'; message: string };

export interface CerebroContextResponse {
  snapshot: CerebroContextSnapshot;
  proactiveMoment?: MomentCardBlock;
  chip?: { label: string; kind: 'screen' | 'meeting'; meetingId?: string; meetLink?: string };
}
