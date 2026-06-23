import { normalizePersonNameKey } from '../core/profesional/person-name-clean.js';
import { listActiveSuggestionsFromStore } from './pending-suggestions.js';
import { buildGraphSnapshot } from './graph-edges.js';
import { loadStore } from './store.js';
export function buildDerivedSuggestions(store) {
    const now = new Date().toISOString();
    const out = [];
    for (const t of store.todos.filter((x) => x.status === 'suggested').slice(0, 20)) {
        out.push({
            id: `todo-${t.id}`,
            kind: 'accept_todo',
            title: t.text.slice(0, 120),
            detail: t.meetingTitle,
            payload: { todoId: t.id },
            createdAt: t.updatedAt ?? now,
        });
    }
    for (const p of store.prospects.filter((x) => !x.linkedPersonId).slice(0, 25)) {
        out.push({
            id: `prospect-${p.id}`,
            kind: 'promote_prospect',
            title: p.displayName,
            detail: `${p.meetingIds.length} reuniones sin email`,
            payload: { prospectId: p.id },
            createdAt: p.lastSeenAt ?? now,
        });
    }
    for (const m of store.meetings.filter((x) => x.analysisStatus === 'needs_review').slice(0, 10)) {
        out.push({
            id: `meeting-${m.id}`,
            kind: 'review_meeting',
            title: m.title,
            detail: 'Revisar análisis IA',
            payload: { meetingId: m.id },
            createdAt: m.updatedAt,
        });
    }
    const byEmail = new Map();
    for (const p of store.people) {
        for (const e of p.emails ?? []) {
            const key = e.toLowerCase();
            if (!byEmail.has(key))
                byEmail.set(key, []);
            byEmail.get(key).push(p.id);
        }
    }
    for (const [email, ids] of byEmail) {
        if (ids.length < 2)
            continue;
        out.push({
            id: `merge-email-${email}`,
            kind: 'merge_contacts',
            title: `Unificar ${ids.length} contactos`,
            detail: email,
            payload: { personIds: ids, reason: 'same_email' },
            createdAt: now,
        });
    }
    const nameBuckets = new Map();
    for (const p of store.people) {
        const key = normalizePersonNameKey(p.displayName);
        if (key.split(/\s+/).length < 2)
            continue;
        if (!nameBuckets.has(key))
            nameBuckets.set(key, []);
        nameBuckets.get(key).push(p.id);
    }
    for (const [name, ids] of nameBuckets) {
        if (ids.length < 2)
            continue;
        out.push({
            id: `merge-name-${name}`,
            kind: 'merge_contacts',
            title: `¿Mismo contacto? (${ids.length})`,
            detail: name,
            payload: { personIds: ids, reason: 'similar_name' },
            createdAt: now,
        });
    }
    return out;
}
export function buildSuggestionsFromStore(store) {
    const pending = listActiveSuggestionsFromStore(store);
    const derived = buildDerivedSuggestions(store);
    const seen = new Set();
    const merged = [];
    for (const s of [...pending, ...derived]) {
        const key = `${s.kind}:${s.title}:${JSON.stringify(s.payload)}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        merged.push(s);
    }
    return merged.slice(0, 80);
}
export async function getSuggestions(uid) {
    const store = await loadStore(uid);
    return buildSuggestionsFromStore(store);
}
export function buildGraphFromStore(store, opts) {
    return buildGraphSnapshot(store, opts);
}
export async function getGraph(uid, opts) {
    const store = await loadStore(uid);
    return buildGraphSnapshot(store, opts);
}
