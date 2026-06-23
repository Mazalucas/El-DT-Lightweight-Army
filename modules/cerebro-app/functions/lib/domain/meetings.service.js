import { sortMeetingsByRecency } from './meeting-sort.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { getMirrorContent, listMeetings } from '../services/sync.js';
export async function listMeetingsPage(uid, opts) {
    const store = await loadStoreFromRepository(uid);
    const sorted = sortMeetingsByRecency(store.meetings);
    const limit = opts?.limit ?? 50;
    const offset = opts?.offset ?? 0;
    return {
        meetings: sorted.slice(offset, offset + limit),
        total: sorted.length,
    };
}
export async function getMeeting(uid, meetingId) {
    const store = await loadStoreFromRepository(uid);
    return store.meetings.find((m) => m.id === meetingId) ?? null;
}
export async function getMeetingMirrorContent(uid, meetingId) {
    return getMirrorContent(uid, meetingId);
}
export async function searchMeetingsMetadata(uid, query, limit = 20) {
    const q = query.toLowerCase().trim();
    if (!q)
        return [];
    const store = await loadStoreFromRepository(uid);
    return sortMeetingsByRecency(store.meetings.filter((m) => {
        const hay = [
            m.title,
            ...(m.participants ?? []),
            ...(m.participantEmails ?? []),
            m.summary ?? '',
        ]
            .join(' ')
            .toLowerCase();
        return hay.includes(q);
    })).slice(0, limit);
}
export async function listManifestMeetings(uid) {
    return listMeetings(uid);
}
