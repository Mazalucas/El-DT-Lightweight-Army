/** Cerebro in-app chat — shared protocol types (SPA + Cloud Functions). */
export const DEFAULT_CEREBRO_PREFERENCES = {
    proactiveLevel: 'subtle',
    meetingReminderMinutes: 10,
    chipMeetingMinutesMax: 90,
    liveElements: false,
};
export function cerebroMomentKey(kind, eventId) {
    return eventId ? `${kind}:${eventId}` : kind;
}
export function resolveMomentKey(block) {
    if (block.momentKey)
        return block.momentKey;
    const eventId = block.meta?.eventId ??
        block.meta?.linkedMeetingId ??
        block.meta?.startAt ??
        block.kind;
    return cerebroMomentKey(block.kind, String(eventId));
}
