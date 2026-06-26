/** Shared types — cerebro-app SPA + Cloud Functions */
export const DEFAULT_SETTINGS = {
    meetSources: [],
    appearance: {
        theme: 'system',
    },
    teams: [
        { id: 'innovacion', name: 'Innovación', color: '#3b82f6' },
        { id: 'general', name: 'General', color: '#64748b' },
    ],
    reminders: {
        defaultCategoryId: 'personal',
        pollIntervalMs: 30000,
    },
    ai: {
        defaultProviderId: 'google_gemini',
        autoAnalyzeAfterSync: true,
    },
    cerebro: {
        proactiveLevel: 'subtle',
        meetingReminderMinutes: 10,
        chipMeetingMinutesMax: 90,
    },
    locale: {
        timezoneSource: 'device',
        timezone: 'America/Argentina/Buenos_Aires',
    },
    syncSchedule: {
        enabled: false,
        hour: 8,
        minute: 0,
        timezone: 'America/Argentina/Buenos_Aires',
    },
    syncPolicy: {
        processLookbackDays: 30,
    },
    setupProgress: {},
};
