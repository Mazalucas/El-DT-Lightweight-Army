import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendarDateInput } from './calendar-date.js';

const TZ = 'America/Argentina/Buenos_Aires';

describe('parseCalendarDateInput', () => {
  const now = new Date('2026-06-26T15:00:00.000Z');

  it('defaults to now for empty or hoy/today', () => {
    assert.equal(parseCalendarDateInput(undefined, TZ, now).toISOString(), now.toISOString());
    assert.equal(parseCalendarDateInput('hoy', TZ, now).toISOString(), now.toISOString());
    assert.equal(parseCalendarDateInput('today', TZ, now).toISOString(), now.toISOString());
  });

  it('resolves mañana as next calendar day in timezone', () => {
    const tomorrow = parseCalendarDateInput('mañana', TZ, now);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    assert.equal(fmt.format(tomorrow), '2026-06-27');
  });

  it('parses ISO date', () => {
    const d = parseCalendarDateInput('2026-07-01', TZ, now);
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    assert.equal(fmt.format(d), '2026-07-01');
  });
});
