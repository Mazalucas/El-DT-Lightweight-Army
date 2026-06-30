/** Calendar visibility rules — chip, LCS prompt, proactive moments. */
export function calendarDateKey(date, timezone) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}
export function isSameCalendarDay(iso, now, timezone) {
    const eventDay = calendarDateKey(new Date(iso), timezone);
    const today = calendarDateKey(now, timezone);
    return eventDay === today;
}
export function isChipEligible(next, timezone, maxMins = 90, now = new Date()) {
    if (!next || next.status !== 'upcoming')
        return false;
    if (!isSameCalendarDay(next.startAt, now, timezone))
        return false;
    return next.minutesUntil <= maxMins;
}
export function shouldIncludeCalendarInPrompt(next, timezone, now = new Date()) {
    if (!next)
        return false;
    if (isSameCalendarDay(next.startAt, now, timezone))
        return true;
    return next.status === 'upcoming' && next.minutesUntil <= 240;
}
export function minutesUntil(iso, now = new Date()) {
    return Math.max(0, Math.round((new Date(iso).getTime() - now.getTime()) / 60_000));
}
export function minutesRemaining(endIso, now = new Date()) {
    return Math.max(0, Math.round((new Date(endIso).getTime() - now.getTime()) / 60_000));
}
