import { cerebroMomentKey, DEFAULT_CEREBRO_PREFERENCES } from '../shared/cerebro-chat.js';
import { isSameCalendarDay } from './calendar-rules.js';
function wasDismissed(keys, key) {
    return (keys ?? []).includes(key);
}
export function evaluateProactiveMoment(input) {
    const { snapshot } = input;
    const prefs = snapshot.preferences ?? DEFAULT_CEREBRO_PREFERENCES;
    if (prefs.proactiveLevel === 'off')
        return undefined;
    if (input.userTyping || input.toolRunning || input.planPending)
        return undefined;
    const dismissed = input.dismissedMomentKeys ?? [];
    const tz = snapshot.user.timezone;
    const next = snapshot.calendar.nextEvent;
    const ongoing = snapshot.calendar.ongoingEvent;
    if (ongoing) {
        const key = cerebroMomentKey('meeting_now', 'ongoing');
        if (!wasDismissed(dismissed, key)) {
            return {
                type: 'moment_card',
                kind: 'meeting_now',
                momentKey: key,
                title: 'Reunión en curso',
                body: `Estás en «${ongoing.title}» (${ongoing.minutesRemaining} min restantes).`,
                meta: { minutesUntil: 0 },
                actions: [
                    { id: 'dismiss', label: 'Entendido', kind: 'dismiss' },
                ],
                dismissible: true,
            };
        }
    }
    if (next && isSameCalendarDay(next.startAt, new Date(), tz)) {
        if (next.minutesUntil <= prefs.meetingReminderMinutes) {
            const key = cerebroMomentKey('meeting_imminent', next.id);
            if (!wasDismissed(dismissed, key)) {
                return {
                    type: 'moment_card',
                    kind: 'meeting_imminent',
                    momentKey: key,
                    title: 'Tu próxima reunión',
                    body: `En ${next.minutesUntil} min: ${next.title}`,
                    meta: {
                        eventId: next.id,
                        startAt: next.startAt,
                        minutesUntil: next.minutesUntil,
                        meetLink: next.meetLink,
                        linkedMeetingId: next.linkedMeetingId,
                    },
                    actions: [
                        ...(next.meetLink
                            ? [{ id: 'meet', label: 'Abrir Meet', kind: 'navigate', payload: next.meetLink }]
                            : []),
                        ...(next.linkedMeetingId
                            ? [
                                {
                                    id: 'prep',
                                    label: 'Ver reunión',
                                    kind: 'navigate',
                                    payload: `#/reuniones/${next.linkedMeetingId}`,
                                },
                            ]
                            : []),
                        { id: 'dismiss', label: 'Posponer aviso', kind: 'dismiss' },
                    ],
                    dismissible: true,
                };
            }
        }
        else if (next.minutesUntil <= 15) {
            const key = cerebroMomentKey('meeting_soon', next.id);
            if (!wasDismissed(dismissed, key)) {
                return {
                    type: 'moment_card',
                    kind: 'meeting_soon',
                    momentKey: key,
                    title: 'Reunión pronto',
                    body: `En ${next.minutesUntil} min: ${next.title}`,
                    meta: {
                        eventId: next.id,
                        startAt: next.startAt,
                        minutesUntil: next.minutesUntil,
                        linkedMeetingId: next.linkedMeetingId,
                    },
                    actions: [{ id: 'dismiss', label: 'Entendido', kind: 'dismiss' }],
                    dismissible: true,
                };
            }
        }
    }
    if (snapshot.workload.syncStale &&
        !['login', 'ajustes'].includes(snapshot.navigation.route) &&
        !wasDismissed(dismissed, cerebroMomentKey('sync_stale'))) {
        const key = cerebroMomentKey('sync_stale');
        return {
            type: 'moment_card',
            kind: 'sync_stale',
            momentKey: key,
            title: 'Sync desactualizado',
            body: 'Hace más de 24 h sin sincronizar. ¿Querés actualizar tus notas de Meet?',
            actions: [
                { id: 'sync', label: 'Ir a sync', kind: 'message', payload: '¿Dónde sincronizo?' },
                { id: 'dismiss', label: 'Después', kind: 'dismiss' },
            ],
            dismissible: true,
        };
    }
    if (snapshot.workload.overdueTodos >= 3 &&
        (input.conversationAgeMinutes ?? 0) >= 5 &&
        !wasDismissed(dismissed, cerebroMomentKey('overdue_todos'))) {
        const key = cerebroMomentKey('overdue_todos');
        return {
            type: 'moment_card',
            kind: 'overdue_todos',
            momentKey: key,
            title: 'Tareas vencidas',
            body: `Tenés ${snapshot.workload.overdueTodos} tareas vencidas. ¿Las revisamos?`,
            actions: [
                { id: 'tareas', label: 'Ver tareas', kind: 'navigate', payload: '#/tareas' },
                { id: 'dismiss', label: 'Después', kind: 'dismiss' },
            ],
            dismissible: true,
        };
    }
    // isChipEligible used in context-builder for chip rules
    return undefined;
}
