import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from './types.js';
import {
  DEFAULT_APP_TIMEZONE,
  defaultLocaleSettings,
  isValidIanaTimezone,
  resolveUserTimezone,
} from './timezone.js';

describe('timezone', () => {
  it('validates IANA timezones', () => {
    assert.equal(isValidIanaTimezone('America/Argentina/Buenos_Aires'), true);
    assert.equal(isValidIanaTimezone('Not/A_Zone'), false);
    assert.equal(isValidIanaTimezone(''), false);
  });

  it('resolves device source with client TZ', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      locale: { timezoneSource: 'device' as const, timezone: 'Europe/Madrid' },
    };
    assert.equal(
      resolveUserTimezone(settings, 'America/New_York'),
      'America/New_York',
    );
  });

  it('falls back to stored TZ for device without client', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      locale: { timezoneSource: 'device' as const, timezone: 'Europe/Madrid' },
    };
    assert.equal(resolveUserTimezone(settings), 'Europe/Madrid');
  });

  it('resolves manual source ignoring client', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      locale: { timezoneSource: 'manual' as const, timezone: 'Europe/Paris' },
    };
    assert.equal(
      resolveUserTimezone(settings, 'America/New_York'),
      'Europe/Paris',
    );
  });

  it('resolves google_calendar from cache', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      locale: {
        timezoneSource: 'google_calendar' as const,
        timezone: 'Europe/Madrid',
        googleCalendarTimezone: 'America/Argentina/Buenos_Aires',
      },
    };
    assert.equal(resolveUserTimezone(settings), 'America/Argentina/Buenos_Aires');
  });

  it('migrates from syncSchedule when locale missing', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      locale: undefined,
      syncSchedule: { ...DEFAULT_SETTINGS.syncSchedule!, timezone: 'Europe/London' },
    };
    assert.equal(resolveUserTimezone(settings), 'Europe/London');
  });

  it('defaultLocaleSettings marks custom sync TZ as manual', () => {
    const locale = defaultLocaleSettings('Europe/London');
    assert.equal(locale.timezoneSource, 'manual');
    assert.equal(locale.timezone, 'Europe/London');
  });

  it('defaultLocaleSettings uses device for default TZ', () => {
    const locale = defaultLocaleSettings(DEFAULT_APP_TIMEZONE);
    assert.equal(locale.timezoneSource, 'device');
    assert.equal(locale.timezone, DEFAULT_APP_TIMEZONE);
  });
});
