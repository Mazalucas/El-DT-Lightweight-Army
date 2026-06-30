import { resolveMeetingStartedAt } from './meeting-dates.js';
export const DEFAULT_SYNC_POLICY = {
    processLookbackDays: 30,
};
export const PROCESS_LOOKBACK_PRESETS = [7, 30, 90, 365, 0];
export function processLookbackLabel(days) {
    if (days <= 0)
        return 'Todas (sin límite)';
    if (days === 1)
        return '1 día';
    return `${days} días`;
}
export function resolveProcessLookbackDays(policy) {
    const raw = policy?.processLookbackDays ?? DEFAULT_SYNC_POLICY.processLookbackDays;
    return raw >= 0 ? raw : DEFAULT_SYNC_POLICY.processLookbackDays;
}
export function meetingStartedAtMs(entry) {
    const iso = resolveMeetingStartedAt({
        startedAt: entry.startedAt,
        sourceFile: entry.sourceFile ?? '',
        title: entry.title ?? '',
        timezone: entry.timezone,
    });
    if (!iso)
        return undefined;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : undefined;
}
/** Sin fecha en el nombre → se procesa (evita perder reuniones recientes mal nombradas). */
export function isWithinProcessLookback(entry, lookbackDays, nowMs = Date.now()) {
    if (lookbackDays <= 0)
        return true;
    const started = meetingStartedAtMs(entry);
    if (started === undefined)
        return true;
    const cutoff = nowMs - lookbackDays * 86_400_000;
    return started >= cutoff;
}
export function filterByProcessLookback(items, lookbackDays) {
    if (lookbackDays <= 0)
        return { inWindow: items, skipped: 0 };
    const inWindow = [];
    let skipped = 0;
    for (const item of items) {
        if (isWithinProcessLookback(item, lookbackDays))
            inWindow.push(item);
        else
            skipped++;
    }
    return { inWindow, skipped };
}
export function sortByMeetingDateDesc(items) {
    return [...items].sort((a, b) => (meetingStartedAtMs(b) ?? 0) - (meetingStartedAtMs(a) ?? 0));
}
