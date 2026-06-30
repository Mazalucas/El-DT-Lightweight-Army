import { DEFAULT_SETTINGS } from '../shared/types.js';
import { defaultLocaleSettings, isValidIanaTimezone, resolveUserTimezone, } from '../shared/timezone.js';
import { settingsRef } from './firebase.js';
function normalizeSyncPolicy(value) {
    if (typeof value !== 'object' || value === null)
        return DEFAULT_SETTINGS.syncPolicy;
    const days = value.processLookbackDays;
    const processLookbackDays = typeof days === 'number' && Number.isFinite(days) && days >= 0
        ? Math.floor(days)
        : DEFAULT_SETTINGS.syncPolicy.processLookbackDays;
    return { processLookbackDays };
}
function normalizeCerebroPrefs(value) {
    const defaults = DEFAULT_SETTINGS.cerebro;
    if (typeof value !== 'object' || value === null)
        return defaults;
    const v = value;
    const proactiveLevel = v.proactiveLevel === 'off' || v.proactiveLevel === 'subtle' || v.proactiveLevel === 'active'
        ? v.proactiveLevel
        : defaults.proactiveLevel;
    const meetingReminderMinutes = v.meetingReminderMinutes === 10 || v.meetingReminderMinutes === 15 || v.meetingReminderMinutes === 30
        ? v.meetingReminderMinutes
        : defaults.meetingReminderMinutes;
    const chipMeetingMinutesMax = v.chipMeetingMinutesMax === 60 || v.chipMeetingMinutesMax === 90 || v.chipMeetingMinutesMax === 120
        ? v.chipMeetingMinutesMax
        : defaults.chipMeetingMinutesMax;
    return { proactiveLevel, meetingReminderMinutes, chipMeetingMinutesMax };
}
function normalizeLocale(value, syncScheduleTz) {
    const migrated = defaultLocaleSettings(syncScheduleTz);
    if (typeof value !== 'object' || value === null)
        return migrated;
    const v = value;
    const timezoneSource = v.timezoneSource === 'device' || v.timezoneSource === 'google_calendar' || v.timezoneSource === 'manual'
        ? v.timezoneSource
        : migrated.timezoneSource;
    const timezone = typeof v.timezone === 'string' && isValidIanaTimezone(v.timezone)
        ? v.timezone.trim()
        : migrated.timezone;
    const googleCalendarTimezone = typeof v.googleCalendarTimezone === 'string' && isValidIanaTimezone(v.googleCalendarTimezone)
        ? v.googleCalendarTimezone.trim()
        : undefined;
    return {
        timezoneSource,
        timezone,
        ...(googleCalendarTimezone ? { googleCalendarTimezone } : {}),
    };
}
function mirrorSyncScheduleTimezone(settings) {
    const resolved = resolveUserTimezone(settings);
    const syncSchedule = settings.syncSchedule ?? DEFAULT_SETTINGS.syncSchedule;
    return {
        ...settings,
        syncSchedule: { ...syncSchedule, timezone: resolved },
    };
}
function normalizeMeetSources(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'object' &&
        item !== null &&
        typeof item.driveFolderId === 'string' &&
        typeof item.label === 'string');
}
function normalizeTeams(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string');
}
function buildSettingsFromData(data) {
    const syncSchedule = { ...DEFAULT_SETTINGS.syncSchedule, ...data.syncSchedule };
    const locale = normalizeLocale(data.locale, syncSchedule.timezone);
    const base = {
        ...DEFAULT_SETTINGS,
        ...data,
        meetSources: normalizeMeetSources(data.meetSources),
        teams: normalizeTeams(data.teams),
        appearance: { ...DEFAULT_SETTINGS.appearance, ...data.appearance },
        reminders: { ...DEFAULT_SETTINGS.reminders, ...data.reminders },
        ai: { ...DEFAULT_SETTINGS.ai, ...data.ai },
        cerebro: normalizeCerebroPrefs(data.cerebro),
        locale,
        syncSchedule,
        syncPolicy: normalizeSyncPolicy(data.syncPolicy),
        setupProgress: { ...DEFAULT_SETTINGS.setupProgress, ...data.setupProgress },
    };
    return mirrorSyncScheduleTimezone(base);
}
export async function loadSettings(uid) {
    const snap = await settingsRef(uid).get();
    if (!snap.exists)
        return structuredClone(DEFAULT_SETTINGS);
    return buildSettingsFromData(snap.data());
}
export async function saveSettings(uid, patch) {
    const current = await loadSettings(uid);
    const mergedSyncSchedule = patch.syncSchedule
        ? { ...current.syncSchedule, ...DEFAULT_SETTINGS.syncSchedule, ...patch.syncSchedule }
        : current.syncSchedule;
    const mergedLocale = patch.locale !== undefined
        ? normalizeLocale({ ...current.locale, ...patch.locale }, mergedSyncSchedule?.timezone)
        : current.locale;
    const merged = {
        ...current,
        ...patch,
        meetSources: patch.meetSources !== undefined ? normalizeMeetSources(patch.meetSources) : current.meetSources,
        teams: patch.teams !== undefined ? normalizeTeams(patch.teams) : current.teams,
        appearance: { ...current.appearance, ...patch.appearance },
        reminders: { ...current.reminders, ...patch.reminders },
        ai: { ...current.ai, ...patch.ai },
        cerebro: patch.cerebro !== undefined ? normalizeCerebroPrefs(patch.cerebro) : current.cerebro,
        locale: mergedLocale,
        syncSchedule: mergedSyncSchedule,
        syncPolicy: patch.syncPolicy !== undefined ? normalizeSyncPolicy(patch.syncPolicy) : current.syncPolicy,
        setupProgress: patch.setupProgress ? { ...current.setupProgress, ...patch.setupProgress } : current.setupProgress,
    };
    const withMirror = mirrorSyncScheduleTimezone(merged);
    await settingsRef(uid).set(withMirror, { merge: true });
    return loadSettings(uid);
}
/** Actualiza cache de Google Calendar TZ; opcionalmente la TZ efectiva si source es google_calendar. */
export async function applyGoogleCalendarTimezone(uid, googleTz) {
    if (!isValidIanaTimezone(googleTz))
        return loadSettings(uid);
    const current = await loadSettings(uid);
    const locale = current.locale ?? defaultLocaleSettings();
    const nextLocale = {
        ...locale,
        googleCalendarTimezone: googleTz.trim(),
        ...(locale.timezoneSource === 'google_calendar' ? { timezone: googleTz.trim() } : {}),
    };
    return saveSettings(uid, { locale: nextLocale });
}
