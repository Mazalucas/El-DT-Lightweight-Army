import { resolveMeetingStartedAt } from './meeting-dates.js';

export interface SyncPolicyConfig {
  /** 0 = sin límite. Afecta sync, import, reindex y análisis IA — no borra datos. */
  processLookbackDays: number;
}

export const DEFAULT_SYNC_POLICY: SyncPolicyConfig = {
  processLookbackDays: 30,
};

export const PROCESS_LOOKBACK_PRESETS = [7, 30, 90, 365, 0] as const;

export type ProcessLookbackPreset = (typeof PROCESS_LOOKBACK_PRESETS)[number];

export function processLookbackLabel(days: number): string {
  if (days <= 0) return 'Todas (sin límite)';
  if (days === 1) return '1 día';
  return `${days} días`;
}

export function resolveProcessLookbackDays(policy?: SyncPolicyConfig | null): number {
  const raw = policy?.processLookbackDays ?? DEFAULT_SYNC_POLICY.processLookbackDays;
  return raw >= 0 ? raw : DEFAULT_SYNC_POLICY.processLookbackDays;
}

export type MeetingDateLike = {
  startedAt?: string;
  sourceFile?: string;
  title?: string;
  timezone?: string;
};

export function meetingStartedAtMs(entry: MeetingDateLike): number | undefined {
  const iso = resolveMeetingStartedAt({
    startedAt: entry.startedAt,
    sourceFile: entry.sourceFile ?? '',
    title: entry.title ?? '',
    timezone: entry.timezone,
  });
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
}

/** Sin fecha en el nombre → se procesa (evita perder reuniones recientes mal nombradas). */
export function isWithinProcessLookback(
  entry: MeetingDateLike,
  lookbackDays: number,
  nowMs = Date.now(),
): boolean {
  if (lookbackDays <= 0) return true;
  const started = meetingStartedAtMs(entry);
  if (started === undefined) return true;
  const cutoff = nowMs - lookbackDays * 86_400_000;
  return started >= cutoff;
}

export function filterByProcessLookback<T extends MeetingDateLike>(
  items: T[],
  lookbackDays: number,
): { inWindow: T[]; skipped: number } {
  if (lookbackDays <= 0) return { inWindow: items, skipped: 0 };
  const inWindow: T[] = [];
  let skipped = 0;
  for (const item of items) {
    if (isWithinProcessLookback(item, lookbackDays)) inWindow.push(item);
    else skipped++;
  }
  return { inWindow, skipped };
}

export function sortByMeetingDateDesc<T extends MeetingDateLike>(items: T[]): T[] {
  return [...items].sort((a, b) => (meetingStartedAtMs(b) ?? 0) - (meetingStartedAtMs(a) ?? 0));
}
