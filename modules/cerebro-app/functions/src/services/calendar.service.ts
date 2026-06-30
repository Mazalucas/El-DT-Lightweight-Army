import { google } from 'googleapis';
import type { CalendarEventItem, CalendarEventStatus, CalendarTodayView, CerebroStore, Meeting } from '../shared/types.js';
import { enrichMeetings, resolveMeetingStartedAt } from '../shared/meeting-dates.js';
import { getUserEmail } from '../lib/auth-middleware.js';
import {
  formatGoogleApiError,
  getGoogleClient,
  hasCalendarScope,
  hasGoogleIntegration,
  CALENDAR_SCOPE,
} from './google.js';
import { CALENDAR_DEFAULT_TIMEZONE, parseCalendarDateInput } from './calendar-date.js';

const DEFAULT_TIMEZONE = CALENDAR_DEFAULT_TIMEZONE;

function dayBoundsInTimezone(date: Date, timezone: string): { timeMin: string; timeMax: string; dateKey: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateKey = fmt.format(date);
  const [y, m, d] = dateKey.split('-').map(Number);
  const probe = new Date(Date.UTC(y!, m! - 1, d!, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(probe);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = 0;
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const mins = match[3] ? Number(match[3]) : 0;
    offsetMinutes = sign * (hours * 60 + mins);
  }
  const startUtc = Date.UTC(y!, m! - 1, d!, 0, 0, 0) - offsetMinutes * 60_000;
  const endUtc = startUtc + 86400000 - 1;
  return {
    timeMin: new Date(startUtc).toISOString(),
    timeMax: new Date(endUtc).toISOString(),
    dateKey,
  };
}

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findLinkedMeeting(eventTitle: string, startAt: string, meetings: Meeting[]): string | undefined {
  const title = normalizeTitle(eventTitle);
  if (!title) return undefined;
  const eventMs = new Date(startAt).getTime();
  const windowMs = 3 * 3600_000;
  let best: { id: string; score: number } | undefined;
  for (const m of meetings) {
    const started = resolveMeetingStartedAt(m);
    if (!started) continue;
    const diff = Math.abs(new Date(started).getTime() - eventMs);
    if (diff > windowMs) continue;
    const mt = normalizeTitle(m.title);
    if (!mt.includes(title) && !title.includes(mt)) continue;
    const score = diff;
    if (!best || score < best.score) best = { id: m.id, score };
  }
  return best?.id;
}

function eventStatus(startAt: string, endAt: string, now: Date): CalendarEventStatus {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const t = now.getTime();
  if (t >= start && t <= end) return 'ongoing';
  if (t > end) return 'past';
  return 'upcoming';
}

function extractMeetLink(entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }>): string | undefined {
  const video = entryPoints?.find((e) => e.entryPointType === 'video' && e.uri);
  return video?.uri ?? undefined;
}

function mapEvent(
  raw: {
    id?: string | null;
    summary?: string | null;
    start?: { dateTime?: string | null; date?: string | null };
    end?: { dateTime?: string | null; date?: string | null };
    location?: string | null;
    htmlLink?: string | null;
    hangoutLink?: string | null;
    conferenceData?: { entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }> };
    attendees?: Array<{ email?: string | null; self?: boolean | null; responseStatus?: string | null }> | null;
    recurrence?: string[] | null;
    recurringEventId?: string | null;
  },
  meetings: Meeting[],
  now: Date,
  operatorEmail?: string,
): CalendarEventItem | null {
  const startRaw = raw.start?.dateTime ?? raw.start?.date;
  const endRaw = raw.end?.dateTime ?? raw.end?.date;
  if (!raw.id || !startRaw) return null;
  const allDay = Boolean(raw.start?.date && !raw.start?.dateTime);
  const startAt = allDay ? `${raw.start!.date}T00:00:00.000Z` : startRaw;
  const endAt = endRaw
    ? allDay
      ? `${raw.end!.date}T23:59:59.999Z`
      : endRaw
    : startAt;
  const title = raw.summary?.trim() || '(Sin título)';
  const opEmail = operatorEmail?.toLowerCase().trim();
  const attendeeEmails = (raw.attendees ?? [])
    .map((a) => a.email?.toLowerCase().trim())
    .filter((e): e is string => Boolean(e && e.includes('@') && e !== opEmail));
  const recurrence = raw.recurrence?.filter(Boolean) as string[] | undefined;
  const isRecurring = Boolean(recurrence?.length || raw.recurringEventId);
  return {
    id: raw.id,
    title,
    startAt,
    endAt,
    allDay,
    location: raw.location ?? undefined,
    meetLink: raw.hangoutLink ?? extractMeetLink(raw.conferenceData?.entryPoints) ?? undefined,
    htmlLink: raw.htmlLink ?? undefined,
    status: eventStatus(startAt, endAt, now),
    linkedMeetingId: findLinkedMeeting(title, startAt, meetings),
    attendeeEmails: attendeeEmails.length ? attendeeEmails : undefined,
    recurringEventId: raw.recurringEventId ?? undefined,
    recurrence: recurrence?.length ? recurrence : undefined,
    isRecurring: isRecurring || undefined,
  };
}

export async function getCalendarTodayView(
  uid: string,
  opts?: { timezone?: string; store?: CerebroStore; date?: string },
): Promise<CalendarTodayView> {
  const timezone = opts?.timezone?.trim() || DEFAULT_TIMEZONE;
  const now = new Date();
  const targetDate = parseCalendarDateInput(opts?.date, timezone, now);
  const { timeMin, timeMax, dateKey } = dayBoundsInTimezone(targetDate, timezone);

  const connected = await hasGoogleIntegration(uid);
  if (!connected) {
    return {
      date: dateKey,
      timezone,
      hasCalendarAccess: false,
      events: [],
      eventCount: 0,
    };
  }

  const calendarGranted = await hasCalendarScope(uid);
  if (!calendarGranted) {
    return {
      date: dateKey,
      timezone,
      hasCalendarAccess: false,
      events: [],
      eventCount: 0,
    };
  }

  try {
    const auth = await getGoogleClient(uid);
    const calendar = google.calendar({ version: 'v3', auth: auth as never });
    const operatorEmail = await getUserEmail(uid);
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 25,
      timeZone: timezone,
    });

    const meetings = enrichMeetings(opts?.store?.meetings ?? []);
    const events = (res.data.items ?? [])
      .map((item) => mapEvent(item, meetings, now, operatorEmail))
      .filter((e): e is CalendarEventItem => Boolean(e));

    const ongoingEvent = events.find((e) => e.status === 'ongoing');
    const nextEvent = events.find((e) => e.status === 'upcoming');

    return {
      date: dateKey,
      timezone,
      hasCalendarAccess: true,
      events,
      ongoingEvent,
      nextEvent,
      eventCount: events.filter((e) => e.status !== 'past').length,
    };
  } catch (e) {
    const msg = formatGoogleApiError(e);
    if (msg.includes('insufficient') || msg.includes('Insufficient Permission')) {
      return {
        date: dateKey,
        timezone,
        hasCalendarAccess: false,
        events: [],
        eventCount: 0,
      };
    }
    throw new Error(msg);
  }
}

export { CALENDAR_SCOPE };

/** TZ IANA del calendario primario de Google (requiere scope Calendar). */
export async function fetchPrimaryCalendarTimezone(uid: string): Promise<string | null> {
  const connected = await hasGoogleIntegration(uid);
  if (!connected) return null;
  const calendarGranted = await hasCalendarScope(uid);
  if (!calendarGranted) return null;
  try {
    const auth = await getGoogleClient(uid);
    const calendar = google.calendar({ version: 'v3', auth: auth as never });
    const res = await calendar.calendars.get({ calendarId: 'primary' });
    const tz = res.data.timeZone?.trim();
    return tz || null;
  } catch (e) {
    const msg = formatGoogleApiError(e);
    if (msg.includes('insufficient') || msg.includes('Insufficient Permission')) return null;
    throw new Error(msg);
  }
}
