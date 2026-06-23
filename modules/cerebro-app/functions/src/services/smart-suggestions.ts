import type { SmartSuggestion, SmartSuggestionStatus } from '../shared/types.js';
import { smartSuggestionsCol } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';

const BATCH_SIZE = 400;

export async function listSmartSuggestions(
  uid: string,
  opts?: { status?: SmartSuggestionStatus; limit?: number },
): Promise<SmartSuggestion[]> {
  const status = opts?.status ?? 'pending';
  const snap = await smartSuggestionsCol(uid).where('status', '==', status).get();
  const now = new Date().toISOString();
  const rows = snap.docs.map((d) => d.data() as SmartSuggestion);

  const expired = rows.filter((s) => s.expiresAt && s.expiresAt < now);
  if (expired.length) {
    const db = smartSuggestionsCol(uid).firestore;
    const batch = db.batch();
    for (const s of expired) {
      batch.set(smartSuggestionsCol(uid).doc(s.id), { status: 'expired', updatedAt: now }, { merge: true });
    }
    await batch.commit();
  }

  const active = rows
    .filter((s) => !s.expiresAt || s.expiresAt >= now)
    .sort((a, b) => b.score - a.score);
  return opts?.limit ? active.slice(0, opts.limit) : active;
}

export async function getSmartSuggestion(uid: string, id: string): Promise<SmartSuggestion | null> {
  const snap = await smartSuggestionsCol(uid).doc(id).get();
  return snap.exists ? (snap.data() as SmartSuggestion) : null;
}

export async function saveSmartSuggestions(uid: string, suggestions: SmartSuggestion[]): Promise<void> {
  const db = smartSuggestionsCol(uid).firestore;
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const s of suggestions.slice(i, i + BATCH_SIZE)) {
      batch.set(smartSuggestionsCol(uid).doc(s.id), stripUndefined(s as unknown as Record<string, unknown>), {
        merge: true,
      });
    }
    await batch.commit();
  }
}

export async function setSmartSuggestionStatus(
  uid: string,
  id: string,
  status: SmartSuggestionStatus,
): Promise<SmartSuggestion> {
  const ref = smartSuggestionsCol(uid).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Sugerencia no encontrada');
  const updated: SmartSuggestion = {
    ...(snap.data() as SmartSuggestion),
    status,
    updatedAt: new Date().toISOString(),
  };
  await ref.set(stripUndefined(updated as unknown as Record<string, unknown>));
  return updated;
}
