import { getMeetingMirrorContent } from '../../domain/meetings.service.js';
import { buildMeetingPrepFacts, buildTemplateMeetingPrepInsights, normalizeCalendarTitle, } from '../../domain/meeting-prep-insights.service.js';
import { sortMeetingsByRecency } from '../../domain/meeting-sort.js';
import { enrichMeetings, resolveMeetingStartedAt } from '../../shared/meeting-dates.js';
import { getCalendarTodayView } from '../../services/calendar.service.js';
import { loadSettings } from '../../lib/settings.js';
import { resolveUserTimezone } from '../../shared/timezone.js';
import { loadStore } from '../../services/store.js';
import { getUserEmail } from '../../lib/auth-middleware.js';
function matchEventByQuery(events, query) {
    if (!query?.trim())
        return undefined;
    const q = normalizeCalendarTitle(query);
    return events.find((e) => {
        const t = normalizeCalendarTitle(e.title);
        return t.includes(q) || q.includes(t);
    });
}
export const meetingPrepProvider = {
    id: 'meeting-prep',
    toolNames: ['get_meeting_prep'],
    declarations: [
        {
            name: 'get_meeting_prep',
            description: 'Preparación para una reunión: pendientes, compromisos abiertos, reuniones previas de la misma serie o con los mismos participantes, y preview de notas. Usá esto cuando el usuario pregunte qué entregar, preparar o recordar antes de una reunión.',
            parameters: {
                type: 'object',
                properties: {
                    eventTitle: {
                        type: 'string',
                        description: 'Título o fragmento del evento (ej. "Weekly Milø"). Si omitís, usa la próxima reunión del calendario.',
                    },
                    calendarEventId: { type: 'string', description: 'ID del evento de Google Calendar si lo conocés.' },
                    includeNotePreview: {
                        type: 'boolean',
                        description: 'Incluir extracto de notas de reuniones previas relacionadas (default true).',
                    },
                },
            },
        },
    ],
    async execute(ctx, name, args) {
        if (name !== 'get_meeting_prep')
            throw new Error(`meeting-prep provider: ${name}`);
        const [store, settings, operatorEmail] = await Promise.all([
            loadStore(ctx.uid),
            loadSettings(ctx.uid),
            getUserEmail(ctx.uid),
        ]);
        const calendar = await getCalendarTodayView(ctx.uid, {
            timezone: resolveUserTimezone(settings),
        });
        const titleQuery = args.eventTitle ? String(args.eventTitle) : undefined;
        const eventId = args.calendarEventId ? String(args.calendarEventId) : undefined;
        const includePreview = args.includeNotePreview !== false;
        let event = (eventId ? calendar.events.find((e) => e.id === eventId) : undefined) ??
            matchEventByQuery(calendar.events, titleQuery) ??
            calendar.events.find((e) => e.status === 'upcoming') ??
            calendar.events.find((e) => e.status === 'ongoing');
        if (!event) {
            return {
                found: false,
                message: calendar.hasCalendarAccess
                    ? 'No hay eventos de calendario hoy que coincidan.'
                    : 'Calendario no conectado. Podés buscar reuniones pasadas con search_meetings o semantic_search.',
            };
        }
        const facts = buildMeetingPrepFacts(calendar, store, operatorEmail ?? '');
        const eventFacts = facts.filter((f) => f.calendarEventId === event.id);
        const insights = buildTemplateMeetingPrepInsights(eventFacts, [event], store);
        const relatedMeetingIds = [
            ...new Set([
                ...(event.linkedMeetingId ? [event.linkedMeetingId] : []),
                ...eventFacts.flatMap((f) => f.relatedMeetingIds ?? []),
            ]),
        ].slice(0, 3);
        const normalizedTitle = normalizeCalendarTitle(event.title);
        const pastSeries = sortMeetingsByRecency(enrichMeetings(store.meetings)).filter((m) => {
            const started = resolveMeetingStartedAt(m);
            if (!started)
                return false;
            const mt = normalizeCalendarTitle(m.title);
            return (mt === normalizedTitle ||
                mt.includes(normalizedTitle) ||
                normalizedTitle.includes(mt));
        });
        if (!relatedMeetingIds.length && pastSeries[0]) {
            relatedMeetingIds.push(pastSeries[0].id);
        }
        const openTodos = store.todos.filter((t) => (t.status === 'open' || t.status === 'suggested') &&
            (relatedMeetingIds.includes(t.meetingId ?? '') ||
                eventFacts.some((f) => f.relatedTodoIds?.includes(t.id))));
        const notePreviews = [];
        if (includePreview) {
            for (const mid of relatedMeetingIds.slice(0, 2)) {
                const meeting = store.meetings.find((m) => m.id === mid);
                const content = await getMeetingMirrorContent(ctx.uid, mid);
                if (content) {
                    notePreviews.push({
                        meetingId: mid,
                        title: meeting?.title ?? mid,
                        preview: content.slice(0, 2500),
                    });
                }
            }
        }
        return {
            found: true,
            event: {
                id: event.id,
                title: event.title,
                startAt: event.startAt,
                minutesUntil: Math.max(0, Math.round((new Date(event.startAt).getTime() - Date.now()) / 60_000)),
                linkedMeetingId: event.linkedMeetingId,
                meetLink: event.meetLink,
            },
            insights,
            facts: eventFacts.map((f) => ({ kind: f.kind, hint: f.summaryHint })),
            openTodos: openTodos.slice(0, 8).map((t) => ({
                id: t.id,
                text: t.text,
                dueAt: t.dueAt,
                status: t.status,
                meetingId: t.meetingId,
            })),
            relatedMeetings: relatedMeetingIds.map((id) => {
                const m = store.meetings.find((x) => x.id === id);
                return { id, title: m?.title, startedAt: m ? resolveMeetingStartedAt(m) : undefined };
            }),
            notePreviews,
            pastSeriesCount: pastSeries.length,
        };
    },
};
export function meetingPrepDeclarations() {
    return meetingPrepProvider.declarations;
}
