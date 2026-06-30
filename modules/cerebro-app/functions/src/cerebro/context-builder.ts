import type {
  CerebroCalendarContext,
  CerebroClientContextInput,
  CerebroContextSnapshot,
  CerebroPreferences,
  CerebroWorkloadContext,
} from '../shared/cerebro-chat.js';
import { DEFAULT_CEREBRO_PREFERENCES as DEFAULT_PREFS } from '../shared/cerebro-chat.js';
import { filterDailyTodos } from '../shared/filter-daily-todos.js';
import { getBoardSnapshot } from '../domain/board.service.js';
import { getBoardSnapshotForOrg } from '../services/org-catalog.js';
import { getUserEmail, getUserFirstName } from '../lib/auth-middleware.js';
import { loadSettings } from '../lib/settings.js';
import { resolveLastSyncAt } from '../services/sync.js';
import { resolveUserTimezone } from '../shared/timezone.js';
import { getCalendarTodayView } from '../services/calendar.service.js';
import {
  isChipEligible,
  minutesRemaining,
  minutesUntil,
  shouldIncludeCalendarInPrompt,
} from './calendar-rules.js';

function buildCalendarContext(
  calendarView: Awaited<ReturnType<typeof getCalendarTodayView>>,
  now: Date,
): CerebroCalendarContext {
  const events = calendarView.events ?? [];
  const upcoming = events.filter((e) => e.status === 'upcoming');
  const ongoing = events.find((e) => e.status === 'ongoing');
  const nextUpcoming = upcoming[0];

  let nextEvent: CerebroCalendarContext['nextEvent'];
  if (nextUpcoming) {
    nextEvent = {
      id: nextUpcoming.id,
      title: nextUpcoming.title,
      startAt: nextUpcoming.startAt,
      minutesUntil: minutesUntil(nextUpcoming.startAt, now),
      linkedMeetingId: nextUpcoming.linkedMeetingId,
      meetLink: nextUpcoming.meetLink,
      status: 'upcoming',
    };
  }

  let ongoingEvent: CerebroCalendarContext['ongoingEvent'];
  if (ongoing) {
    ongoingEvent = {
      title: ongoing.title,
      minutesRemaining: minutesRemaining(ongoing.endAt, now),
    };
  }

  return {
    hasAccess: calendarView.hasCalendarAccess,
    nextEvent,
    ongoingEvent,
    todayEventCount: events.length,
  };
}

async function buildWorkload(uid: string): Promise<CerebroWorkloadContext> {
  const [board, lastSyncAt] = await Promise.all([getBoardSnapshot(uid), resolveLastSyncAt(uid)]);
  const store = { todos: board.todos };
  const daily = filterDailyTodos(store.todos);
  const syncStale = lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() > 86_400_000 : false;

  return {
    overdueTodos: daily.overdue.length,
    todayTodos: daily.today.length,
    pendingSuggestions: board.counts.suggestions,
    syncStale,
    lastSyncAt,
  };
}

export function buildSituationalPromptLayer(snapshot: CerebroContextSnapshot): string {
  const { user, navigation, calendar, workload } = snapshot;
  const tz = user.timezone;
  const lines = [
    `## Situación actual (${snapshot.capturedAt})`,
    `- Usuario: ${user.firstName}${user.email ? ` (${user.email})` : ''}${user.orgName ? ` · Org: ${user.orgName}` : ''}${user.orgRole ? ` · Rol: ${user.orgRole}` : ''}`,
    `- Pantalla: ${navigation.pageTitle}${navigation.pageDescription ? ` — ${navigation.pageDescription}` : ''}`,
  ];

  if (calendar.ongoingEvent) {
    lines.push(
      `- Calendario: en curso «${calendar.ongoingEvent.title}» (${calendar.ongoingEvent.minutesRemaining} min restantes)`,
    );
  } else if (
    calendar.nextEvent &&
    shouldIncludeCalendarInPrompt(
      {
        startAt: calendar.nextEvent.startAt,
        minutesUntil: calendar.nextEvent.minutesUntil,
        status: calendar.nextEvent.status,
      },
      tz,
    )
  ) {
    const linked = calendar.nextEvent.linkedMeetingId
      ? ` · reunión vinculada id=${calendar.nextEvent.linkedMeetingId}`
      : '';
    lines.push(
      `- Calendario (solo contexto automático de hoy): próxima «${calendar.nextEvent.title}» en ${calendar.nextEvent.minutesUntil} min${linked}`,
    );
    lines.push(
      `- Si pregunta qué preparar/entregar para esa reunión: llamá get_meeting_prep (eventTitle="${calendar.nextEvent.title}") antes de decir que no podés.`,
    );
  } else if (calendar.hasAccess) {
    lines.push(
      '- Calendario (solo hoy en este snapshot): sin eventos próximos en ventana activa — otras fechas vía get_calendar_today(date=...)',
    );
  } else {
    lines.push(
      '- Calendario en snapshot: sin acceso aparente — igual llamá get_calendar_today si preguntan por agenda antes de negar',
    );
  }

  lines.push(
    `- Carga: ${workload.overdueTodos} tareas vencidas · ${workload.pendingSuggestions} sugerencias · sync ${workload.syncStale ? 'atrasado' : 'ok'}`,
    '',
    'Este bloque es un snapshot parcial. Usá lo que ya figure acá sin repreguntar.',
    'Si la pregunta pide más (otra fecha, notas, contactos, búsqueda): llamá herramientas — no digas que no podés sin intentar.',
    'Si habla de otra cosa y la reunión es en ≤15 min, podés mencionarlo con tacto.',
  );

  if (snapshot.conversation?.focusTopic) {
    lines.push(`- Tema del hilo: ${snapshot.conversation.focusTopic}`);
  }

  if (navigation.focusedEntity) {
    const fe = navigation.focusedEntity;
    const detail = navigation.focusedEntityDetail ? ` — ${navigation.focusedEntityDetail}` : '';
    lines.push(
      `- Entidad en foco: ${fe.kind} id=${fe.id}${fe.orgId ? ` (org ${fe.orgId})` : ''}${detail} — priorizá tools sobre esta entidad si la pregunta es ambigua.`,
    );
  }
  if (navigation.meetingPrepFocus) {
    const mp = navigation.meetingPrepFocus;
    lines.push(
      `- Preparación de reunión (desde chip UI): «${mp.eventTitle}» · chip: ${mp.chipLabel} · kind=${mp.factKind} · calendarEventId=${mp.calendarEventId}`,
    );
    lines.push(
      `- OBLIGATORIO: llamá get_meeting_prep(calendarEventId="${mp.calendarEventId}") antes de responder sobre este contexto.`,
    );
  }
  if (navigation.visibleEntities?.length) {
    const sample = navigation.visibleEntities
      .slice(0, 10)
      .map((e) => `${e.kind}:${e.id}`)
      .join(', ');
    lines.push(`- Entidades visibles en pantalla (${navigation.visibleEntities.length}): ${sample}`);
  }

  return lines.join('\n');
}

export async function buildCerebroContextSnapshot(
  uid: string,
  client: CerebroClientContextInput,
): Promise<CerebroContextSnapshot> {
  const now = new Date();
  const [settings, firstName, email, workload] = await Promise.all([
    loadSettings(uid),
    getUserFirstName(uid),
    getUserEmail(uid),
    buildWorkload(uid),
  ]);

  const timezone = resolveUserTimezone(settings, client.user?.timezone);
  const calendarView = await getCalendarTodayView(uid, { timezone });
  const calendar = buildCalendarContext(calendarView, now);

  const preferences: CerebroPreferences = {
    ...DEFAULT_PREFS,
    ...(settings.cerebro ?? {}),
    ...client.preferences,
  };

  let conversation = client.conversation;
  if (client.conversation?.id) {
    const { getConversation } = await import('../assistant/conversation.service.js');
    const conv = await getConversation(uid, client.conversation.id);
    if (conv?.metadata) {
      conversation = {
        id: client.conversation.id,
        focusTopic: conv.metadata.focusTopic ?? client.conversation.focusTopic,
      };
    }
  }

  let navigation = { ...client.navigation };

  if (navigation.focusedEntity?.kind === 'todo') {
    try {
      const fe = navigation.focusedEntity;
      const board = fe.orgId ? await getBoardSnapshotForOrg(fe.orgId, uid) : await getBoardSnapshot(uid);
      const todo = board.todos.find((t) => t.id === fe.id);
      if (todo) {
        const due = todo.dueAt ? ` · vence ${todo.dueAt.slice(0, 10)}` : '';
        navigation = {
          ...navigation,
          focusedEntityDetail: `«${todo.text}» · ${todo.status}${due}`,
        };
      }
    } catch {
      /* optional enrichment */
    }
  }

  return {
    capturedAt: now.toISOString(),
    navigation,
    user: {
      firstName: client.user?.firstName?.trim() || firstName,
      displayName: client.user?.displayName,
      email: client.user?.email || email || undefined,
      orgName: client.user?.orgName,
      orgRole: client.user?.orgRole,
      timezone,
    },
    calendar,
    workload,
    ambient: client.ambient ?? { visibleTargets: [] },
    conversation,
    preferences,
  };
}

export function buildContextChip(
  snapshot: CerebroContextSnapshot,
): { label: string; kind: 'screen' | 'meeting'; meetingId?: string; meetLink?: string } {
  const prefs = snapshot.preferences ?? DEFAULT_PREFS;
  const next = snapshot.calendar.nextEvent;

  if (
    next &&
    isChipEligible(
      { startAt: next.startAt, minutesUntil: next.minutesUntil, status: next.status },
      snapshot.user.timezone,
      prefs.chipMeetingMinutesMax,
    )
  ) {
    return {
      label: `Próx: ${next.title} · ${next.minutesUntil} min`,
      kind: 'meeting',
      meetingId: next.linkedMeetingId,
      meetLink: next.meetLink,
    };
  }

  return { label: snapshot.navigation.pageTitle, kind: 'screen' };
}
