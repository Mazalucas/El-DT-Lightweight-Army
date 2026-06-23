function parseMeetingTime(iso) {
    if (!iso?.trim())
        return null;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : null;
}
/** Timestamp for ordering: startedAt → updatedAt → 0 (sin fecha al final). */
export function meetingRecencyTimestamp(m) {
    return parseMeetingTime(m.startedAt) ?? parseMeetingTime(m.updatedAt) ?? 0;
}
/** Más reciente primero; reuniones sin fecha al final; desempate por título e id. */
export function compareMeetingsByRecency(a, b) {
    const ta = meetingRecencyTimestamp(a);
    const tb = meetingRecencyTimestamp(b);
    if (ta !== tb)
        return tb - ta;
    const titleCmp = a.title.localeCompare(b.title, 'es');
    if (titleCmp !== 0)
        return titleCmp;
    return a.id.localeCompare(b.id);
}
export function sortMeetingsByRecency(meetings) {
    return [...meetings].sort(compareMeetingsByRecency);
}
