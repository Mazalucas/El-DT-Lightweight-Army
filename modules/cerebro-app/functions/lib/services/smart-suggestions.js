import { smartSuggestionsCol } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
const BATCH_SIZE = 400;
export async function listSmartSuggestions(uid, opts) {
    const status = opts?.status ?? 'pending';
    const snap = await smartSuggestionsCol(uid).where('status', '==', status).get();
    const now = new Date().toISOString();
    const rows = snap.docs.map((d) => d.data());
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
export async function getSmartSuggestion(uid, id) {
    const snap = await smartSuggestionsCol(uid).doc(id).get();
    return snap.exists ? snap.data() : null;
}
export async function saveSmartSuggestions(uid, suggestions) {
    const db = smartSuggestionsCol(uid).firestore;
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const s of suggestions.slice(i, i + BATCH_SIZE)) {
            batch.set(smartSuggestionsCol(uid).doc(s.id), stripUndefined(s), {
                merge: true,
            });
        }
        await batch.commit();
    }
}
export async function setSmartSuggestionStatus(uid, id, status) {
    const ref = smartSuggestionsCol(uid).doc(id);
    const snap = await ref.get();
    if (!snap.exists)
        throw new Error('Sugerencia no encontrada');
    const updated = {
        ...snap.data(),
        status,
        updatedAt: new Date().toISOString(),
    };
    await ref.set(stripUndefined(updated));
    return updated;
}
