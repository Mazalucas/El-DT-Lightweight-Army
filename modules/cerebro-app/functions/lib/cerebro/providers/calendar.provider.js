import { loadSettings } from '../../lib/settings.js';
import { resolveUserTimezone } from '../../shared/timezone.js';
import { getCalendarTodayView } from '../../services/calendar.service.js';
export const calendarProvider = {
    id: 'calendar',
    toolNames: ['get_calendar_today', 'get_next_imminent_event'],
    declarations: [
        {
            name: 'get_calendar_today',
            description: 'Eventos de Google Calendar para una fecha. Default: hoy. Usá date="mañana" o "tomorrow" para el día siguiente, o YYYY-MM-DD.',
            parameters: {
                type: 'object',
                properties: {
                    timezone: { type: 'string' },
                    date: {
                        type: 'string',
                        description: 'Fecha: omitir o "hoy"/"today" (default), "mañana"/"tomorrow", o YYYY-MM-DD',
                    },
                },
            },
        },
        {
            name: 'get_next_imminent_event',
            description: 'Próximo evento elegible para chip/nudge (hoy + dentro del umbral del usuario).',
            parameters: { type: 'object', properties: {} },
        },
    ],
    async execute(ctx, name, args) {
        if (name === 'get_calendar_today') {
            const settings = await loadSettings(ctx.uid);
            const resolvedTz = args.timezone
                ? String(args.timezone)
                : resolveUserTimezone(settings);
            return getCalendarTodayView(ctx.uid, {
                timezone: resolvedTz,
                date: args.date ? String(args.date) : undefined,
            });
        }
        if (name === 'get_next_imminent_event') {
            const settings = await loadSettings(ctx.uid);
            const view = await getCalendarTodayView(ctx.uid, {
                timezone: resolveUserTimezone(settings),
            });
            const next = view.events.find((e) => e.status === 'upcoming');
            return next
                ? {
                    id: next.id,
                    title: next.title,
                    startAt: next.startAt,
                    linkedMeetingId: next.linkedMeetingId,
                    meetLink: next.meetLink,
                }
                : null;
        }
        throw new Error(`calendar provider: ${name}`);
    },
};
export function calendarDeclarations() {
    return calendarProvider.declarations;
}
