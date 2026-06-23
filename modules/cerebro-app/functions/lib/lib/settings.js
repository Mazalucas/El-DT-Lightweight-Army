import { DEFAULT_SETTINGS } from '../shared/types.js';
import { settingsRef } from './firebase.js';
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
export async function loadSettings(uid) {
    const snap = await settingsRef(uid).get();
    if (!snap.exists)
        return structuredClone(DEFAULT_SETTINGS);
    const data = snap.data();
    return {
        ...DEFAULT_SETTINGS,
        ...data,
        meetSources: normalizeMeetSources(data.meetSources),
        teams: normalizeTeams(data.teams),
        appearance: { ...DEFAULT_SETTINGS.appearance, ...data.appearance },
        reminders: { ...DEFAULT_SETTINGS.reminders, ...data.reminders },
        ai: { ...DEFAULT_SETTINGS.ai, ...data.ai },
        syncSchedule: { ...DEFAULT_SETTINGS.syncSchedule, ...data.syncSchedule },
        setupProgress: { ...DEFAULT_SETTINGS.setupProgress, ...data.setupProgress },
    };
}
export async function saveSettings(uid, patch) {
    const current = await loadSettings(uid);
    const merged = {
        ...current,
        ...patch,
        meetSources: patch.meetSources !== undefined ? normalizeMeetSources(patch.meetSources) : current.meetSources,
        teams: patch.teams !== undefined ? normalizeTeams(patch.teams) : current.teams,
        appearance: { ...current.appearance, ...patch.appearance },
        reminders: { ...current.reminders, ...patch.reminders },
        ai: { ...current.ai, ...patch.ai },
        syncSchedule: patch.syncSchedule ? { ...current.syncSchedule, ...DEFAULT_SETTINGS.syncSchedule, ...patch.syncSchedule } : current.syncSchedule,
        setupProgress: patch.setupProgress ? { ...current.setupProgress, ...patch.setupProgress } : current.setupProgress,
    };
    await settingsRef(uid).set(merged, { merge: true });
    return loadSettings(uid);
}
