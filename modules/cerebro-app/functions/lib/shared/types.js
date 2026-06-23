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
    syncSchedule: {
        enabled: false,
        hour: 8,
        minute: 0,
        timezone: 'Europe/Madrid',
    },
    setupProgress: {},
};
