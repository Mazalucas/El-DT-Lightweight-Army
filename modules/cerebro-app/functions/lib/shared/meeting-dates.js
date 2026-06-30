import { parseDateFromMeetFilename } from './parse-meet-filename.js';
function parseFromName(name) {
    if (!name?.trim())
        return {};
    const parsed = parseDateFromMeetFilename(name);
    return { startedAt: parsed.startedAt, timezone: parsed.timezone };
}
/** Elige la mejor fecha: nombre de archivo (canónico) → título → valor guardado. */
export function resolveMeetingStartedAt(m) {
    const fromFile = parseFromName(m.sourceFile);
    if (fromFile.startedAt)
        return fromFile.startedAt;
    const fromTitle = parseFromName(m.title);
    if (fromTitle.startedAt)
        return fromTitle.startedAt;
    return m.startedAt;
}
export function resolveMeetingTimezone(m) {
    const fromFile = parseFromName(m.sourceFile);
    const fromTitle = parseFromName(m.title);
    return m.timezone ?? fromFile.timezone ?? fromTitle.timezone;
}
/** Rellena startedAt/timezone desde sourceFile o título si faltan o son solo fecha. */
export function enrichMeetingRecord(m) {
    const resolved = resolveMeetingStartedAt(m);
    const timezone = resolveMeetingTimezone(m);
    if (resolved === m.startedAt && timezone === m.timezone)
        return m;
    return {
        ...m,
        ...(resolved ? { startedAt: resolved } : {}),
        ...(timezone ? { timezone } : {}),
    };
}
export function enrichMeetings(meetings) {
    return meetings.map(enrichMeetingRecord);
}
