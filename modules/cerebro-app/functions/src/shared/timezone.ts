import type { LocaleSettings, TimezoneSource, UserAppSettings } from './types.js';

export const DEFAULT_APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

export function isValidIanaTimezone(tz: string): boolean {
  const trimmed = tz.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function browserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidIanaTimezone(tz) ? tz : DEFAULT_APP_TIMEZONE;
  } catch {
    return DEFAULT_APP_TIMEZONE;
  }
}

function pickValidTimezone(...candidates: (string | undefined)[]): string {
  for (const c of candidates) {
    const t = c?.trim();
    if (t && isValidIanaTimezone(t)) return t;
  }
  return DEFAULT_APP_TIMEZONE;
}

function localeFromSettings(settings: UserAppSettings): LocaleSettings | undefined {
  return settings.locale;
}

/** Resuelve la zona horaria efectiva según preferencias del usuario. */
export function resolveUserTimezone(settings: UserAppSettings, clientTz?: string): string {
  const locale = localeFromSettings(settings);
  const source: TimezoneSource = locale?.timezoneSource ?? 'device';
  const stored = pickValidTimezone(locale?.timezone, settings.syncSchedule?.timezone);
  const client = clientTz?.trim() && isValidIanaTimezone(clientTz) ? clientTz.trim() : undefined;

  switch (source) {
    case 'manual':
      return stored;
    case 'google_calendar':
      return pickValidTimezone(locale?.googleCalendarTimezone, stored);
    case 'device':
    default:
      return client ?? stored;
  }
}

export function defaultLocaleSettings(syncScheduleTz?: string): LocaleSettings {
  const migratedTz = pickValidTimezone(syncScheduleTz, DEFAULT_APP_TIMEZONE);
  const differsFromDefault = migratedTz !== DEFAULT_APP_TIMEZONE;
  return {
    timezoneSource: differsFromDefault ? 'manual' : 'device',
    timezone: migratedTz,
  };
}
