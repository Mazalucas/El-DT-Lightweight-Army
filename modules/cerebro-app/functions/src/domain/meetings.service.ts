import type { Meeting } from '../shared/types.js';
import { sortMeetingsByRecency } from './meeting-sort.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { getMirrorContent, listMeetings } from '../services/sync.js';

export async function listMeetingsPage(
  uid: string,
  opts?: { limit?: number; offset?: number },
): Promise<{ meetings: Meeting[]; total: number }> {
  const store = await loadStoreFromRepository(uid);
  const sorted = sortMeetingsByRecency(store.meetings);
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  return {
    meetings: sorted.slice(offset, offset + limit),
    total: sorted.length,
  };
}

export async function getMeeting(uid: string, meetingId: string): Promise<Meeting | null> {
  const store = await loadStoreFromRepository(uid);
  return store.meetings.find((m) => m.id === meetingId) ?? null;
}

export async function getMeetingMirrorContent(uid: string, meetingId: string): Promise<string | null> {
  return getMirrorContent(uid, meetingId);
}

export async function searchMeetingsMetadata(
  uid: string,
  query: string,
  limit = 20,
): Promise<Meeting[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const store = await loadStoreFromRepository(uid);
  return sortMeetingsByRecency(
    store.meetings.filter((m) => {
      const hay = [
        m.title,
        ...(m.participants ?? []),
        ...(m.participantEmails ?? []),
        m.summary ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    }),
  ).slice(0, limit);
}

export async function listManifestMeetings(uid: string) {
  return listMeetings(uid);
}
