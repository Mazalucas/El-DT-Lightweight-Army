import { searchMeetingsMetadata } from './meetings.service.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { semanticSearchMeetings } from '../services/embeddings.js';
/** Metadata + embeddings (si hay índice y API key): los hits semánticos van primero. */
export async function searchCatalog(uid, query, opts) {
    const q = query.toLowerCase().trim();
    const limit = opts?.limit ?? 15;
    if (!q)
        return { meetings: [], people: [], projects: [] };
    const [meetings, store, semantic] = await Promise.all([
        searchMeetingsMetadata(uid, q, limit),
        loadStoreFromRepository(uid),
        semanticSearchMeetings(uid, query, limit).catch(() => null),
    ]);
    const people = store.people
        .filter((p) => {
        const hay = [p.displayName, ...(p.emails ?? []), ...(p.aliases ?? []), p.notes ?? ''].join(' ').toLowerCase();
        return hay.includes(q);
    })
        .slice(0, limit)
        .map((p) => ({ id: p.id, displayName: p.displayName, emails: p.emails }));
    const projects = store.projects
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, limit)
        .map((p) => ({ id: p.id, name: p.name }));
    return { meetings, people, projects, semantic: semantic ?? undefined };
}
