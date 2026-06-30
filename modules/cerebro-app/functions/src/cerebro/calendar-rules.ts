/** Calendar visibility rules — chip, LCS prompt, proactive moments. */

export function calendarDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function isSameCalendarDay(iso: string, now: Date, timezone: string): boolean {
  const eventDay = calendarDateKey(new Date(iso), timezone);
  const today = calendarDateKey(now, timezone);
  return eventDay === today;
}

export interface CalendarEventCompact {
  startAt: string;
  minutesUntil: number;
  status: 'upcoming' | 'ongoing' | 'past';
}

export function isChipEligible(
  next: CalendarEventCompact | undefined,
  timezone: string,
  maxMins = 90,
  now = new Date(),
): boolean {
  if (!next || next.status !== 'upcoming') return false;
  if (!isSameCalendarDay(next.startAt, now, timezone)) return false;
  return next.minutesUntil <= maxMins;
}

export function shouldIncludeCalendarInPrompt(
  next: CalendarEventCompact | undefined,
  timezone: string,
  now = new Date(),
): boolean {
  if (!next) return false;
  if (isSameCalendarDay(next.startAt, now, timezone)) return true;
  return next.status === 'upcoming' && next.minutesUntil <= 240;
}

export function minutesUntil(iso: string, now = new Date()): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - now.getTime()) / 60_000));
}

export function minutesRemaining(endIso: string, now = new Date()): number {
  return Math.max(0, Math.round((new Date(endIso).getTime() - now.getTime()) / 60_000));
}
