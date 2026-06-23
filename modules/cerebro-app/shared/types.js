"use strict";
/** Shared types — cerebro-app SPA + Cloud Functions */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.DEFAULT_SETTINGS = {
    meetSources: [],
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
        autoAnalyzeAfterSync: false,
    },
};
