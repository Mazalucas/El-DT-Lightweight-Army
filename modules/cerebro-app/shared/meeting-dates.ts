import type { Meeting } from './types.js';
import { parseDateFromMeetFilename } from './parse-meet-filename.js';

type MeetingLike = Pick<Meeting, 'startedAt' | 'sourceFile' | 'title' | 'timezone'>;

function parseFromName(name?: string): { startedAt?: string; timezone?: string } {
  if (!name?.trim()) return {};
  const parsed = parseDateFromMeetFilename(name);
  return { startedAt: parsed.startedAt, timezone: parsed.timezone };
}

/** Elige la mejor fecha: nombre de archivo (canónico) → título → valor guardado. */
export function resolveMeetingStartedAt(m: MeetingLike): string | undefined {
  const fromFile = parseFromName(m.sourceFile);
  if (fromFile.startedAt) return fromFile.startedAt;
  const fromTitle = parseFromName(m.title);
  if (fromTitle.startedAt) return fromTitle.startedAt;
  return m.startedAt;
}

export function resolveMeetingTimezone(m: MeetingLike): string | undefined {
  const fromFile = parseFromName(m.sourceFile);
  const fromTitle = parseFromName(m.title);
  return m.timezone ?? fromFile.timezone ?? fromTitle.timezone;
}

/** Rellena startedAt/timezone desde sourceFile o título si faltan o son solo fecha. */
export function enrichMeetingRecord<T extends Meeting>(m: T): T {
  const resolved = resolveMeetingStartedAt(m);
  const timezone = resolveMeetingTimezone(m);
  if (resolved === m.startedAt && timezone === m.timezone) return m;
  return {
    ...m,
    ...(resolved ? { startedAt: resolved } : {}),
    ...(timezone ? { timezone } : {}),
  };
}

export function enrichMeetings<T extends Meeting>(meetings: T[]): T[] {
  return meetings.map(enrichMeetingRecord);
}
