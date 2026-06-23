import type { UserAppSettings } from '../shared/types.js';
import { DEFAULT_SETTINGS } from '../shared/types.js';
import { settingsRef } from './firebase.js';

function normalizeMeetSources(value: unknown): UserAppSettings['meetSources'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is UserAppSettings['meetSources'][number] =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { driveFolderId?: unknown }).driveFolderId === 'string' &&
      typeof (item as { label?: unknown }).label === 'string',
  );
}

function normalizeTeams(value: unknown): UserAppSettings['teams'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is UserAppSettings['teams'][number] =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { id?: unknown }).id === 'string' &&
      typeof (item as { name?: unknown }).name === 'string',
  );
}

export async function loadSettings(uid: string): Promise<UserAppSettings> {
  const snap = await settingsRef(uid).get();
  if (!snap.exists) return structuredClone(DEFAULT_SETTINGS);
  const data = snap.data() as Partial<UserAppSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    meetSources: normalizeMeetSources(data.meetSources),
    teams: normalizeTeams(data.teams),
    appearance: { ...DEFAULT_SETTINGS.appearance, ...data.appearance },
    reminders: { ...DEFAULT_SETTINGS.reminders, ...data.reminders },
    ai: { ...DEFAULT_SETTINGS.ai, ...data.ai },
    syncSchedule: { ...DEFAULT_SETTINGS.syncSchedule!, ...data.syncSchedule },
    setupProgress: { ...DEFAULT_SETTINGS.setupProgress, ...data.setupProgress },
  };
}

export async function saveSettings(uid: string, patch: Partial<UserAppSettings>): Promise<UserAppSettings> {
  const current = await loadSettings(uid);
  const merged: UserAppSettings = {
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
