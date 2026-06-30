import { resolveMeetingStartedAt } from './meeting-dates.js';
/** Parse ISO-ish date strings to epoch ms; null if missing/invalid. */
export function parseRecencyTime(iso) {
    if (!iso?.trim())
        return null;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : null;
}
/** Devuelve el ISO más reciente entre candidatos (p. ej. fuentes de última sync). */
export function pickLatestIso(...candidates) {
    let best;
    let bestMs = 0;
    for (const iso of candidates) {
        if (!iso)
            continue;
        const ms = Date.parse(iso);
        if (Number.isFinite(ms) && ms >= bestMs) {
            bestMs = ms;
            best = iso;
        }
    }
    return best;
}
export const MEETING_SORT_OPTIONS = [
    { value: 'date_desc', label: 'Fecha reunión (más reciente)' },
    { value: 'date_asc', label: 'Fecha reunión (más antigua)' },
    { value: 'synced_desc', label: 'Sincronización (más reciente)' },
    { value: 'synced_asc', label: 'Sincronización (más antigua)' },
    { value: 'title_asc', label: 'Título (A → Z)' },
];
export function parseMeetingSortKey(raw) {
    if (raw === 'date_asc' || raw === 'synced_desc' || raw === 'synced_asc' || raw === 'title_asc') {
        return raw;
    }
    return 'date_desc';
}
/** Fecha en que ocurrió la reunión (startedAt resuelto desde archivo/título/store). */
export function meetingDateTimestamp(m) {
    return parseRecencyTime(resolveMeetingStartedAt(m)) ?? 0;
}
/** Cuándo se sincronizó por última vez al cerebro. */
export function meetingSyncedTimestamp(m) {
    return parseRecencyTime(m.lastSyncedAt) ?? parseRecencyTime(m.updatedAt) ?? 0;
}
/** @deprecated Use meetingDateTimestamp — mantiene compat con código existente. */
export function meetingRecencyTimestamp(m) {
    const date = meetingDateTimestamp(m);
    if (date > 0)
        return date;
    return meetingSyncedTimestamp(m);
}
export function compareMeetings(a, b, sort = 'date_desc') {
    let cmp = 0;
    switch (sort) {
        case 'date_desc':
            cmp = meetingDateTimestamp(b) - meetingDateTimestamp(a);
            break;
        case 'date_asc':
            cmp = meetingDateTimestamp(a) - meetingDateTimestamp(b);
            break;
        case 'synced_desc':
            cmp = meetingSyncedTimestamp(b) - meetingSyncedTimestamp(a);
            break;
        case 'synced_asc':
            cmp = meetingSyncedTimestamp(a) - meetingSyncedTimestamp(b);
            break;
        case 'title_asc':
            cmp = a.title.localeCompare(b.title, 'es');
            break;
        default: {
            const _exhaustive = sort;
            return _exhaustive;
        }
    }
    if (cmp !== 0)
        return cmp;
    return a.id.localeCompare(b.id);
}
/** Más reciente primero por fecha de reunión (default histórico). */
export function compareMeetingsByRecency(a, b) {
    return compareMeetings(a, b, 'date_desc');
}
export function sortMeetings(meetings, sort = 'date_desc') {
    return [...meetings].sort((a, b) => compareMeetings(a, b, sort));
}
export function sortMeetingsByRecency(meetings) {
    return sortMeetings(meetings, 'date_desc');
}
/** Tareas: reunión más reciente primero; boardPosition explícito (>0) gana. */
export function todoRecencyTimestamp(t) {
    return (parseRecencyTime(t.meetingStartedAt) ??
        parseRecencyTime(t.updatedAt) ??
        parseRecencyTime(t.createdAt) ??
        0);
}
export function compareTodosByRecency(a, b) {
    if (a.status === 'done' && b.status === 'done') {
        const ca = parseRecencyTime(a.completedAt) ?? todoRecencyTimestamp(a);
        const cb = parseRecencyTime(b.completedAt) ?? todoRecencyTimestamp(b);
        if (ca !== cb)
            return cb - ca;
    }
    const pa = a.boardPosition ?? 0;
    const pb = b.boardPosition ?? 0;
    if (pa > 0 && pb > 0 && pa !== pb)
        return pb - pa;
    const ta = todoRecencyTimestamp(a);
    const tb = todoRecencyTimestamp(b);
    if (ta !== tb)
        return tb - ta;
    return a.id.localeCompare(b.id);
}
export function sortTodosByRecency(todos) {
    return [...todos].sort(compareTodosByRecency);
}
export function comparePeopleByLastMeeting(a, b) {
    const ta = parseRecencyTime(a.lastMeetingAt) ?? 0;
    const tb = parseRecencyTime(b.lastMeetingAt) ?? 0;
    if (ta !== tb)
        return tb - ta;
    if (a.meetingCount !== b.meetingCount)
        return b.meetingCount - a.meetingCount;
    return a.displayName.localeCompare(b.displayName, 'es');
}
export function sortPeopleByLastMeeting(people) {
    return [...people].sort(comparePeopleByLastMeeting);
}
