import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDerivedSuggestions, listActiveProspectsForMaintenance } from './suggestions-graph.js';
function emptyStore() {
    return {
        version: 1,
        savedAt: new Date().toISOString(),
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [],
        todos: [],
        pendingSuggestions: [],
        graphEdges: [],
    };
}
function addProspect(store, id, name) {
    store.prospects.push({
        id,
        displayName: name,
        aliases: [],
        meetingIds: ['m1'],
        sources: ['participant'],
        lastSeenAt: new Date().toISOString(),
    });
}
describe('suggestions-graph maintenance prospects', () => {
    it('listActiveProspectsForMaintenance excludes dismissed keys', () => {
        const store = emptyStore();
        addProspect(store, 'lucas', 'Lucas Mazalan');
        store.dismissedProspectKeys = ['lucas mazalan'];
        assert.equal(listActiveProspectsForMaintenance(store).length, 0);
    });
    it('buildDerivedSuggestions caps prospects by default at 25', () => {
        const store = emptyStore();
        for (let i = 0; i < 30; i++)
            addProspect(store, `p-${i}`, `Persona ${i}`);
        const suggestions = buildDerivedSuggestions(store);
        assert.equal(suggestions.filter((s) => s.kind === 'promote_prospect').length, 25);
    });
    it('buildDerivedSuggestions lists all prospects for maintenance when maxProspects is null', () => {
        const store = emptyStore();
        for (let i = 0; i < 30; i++)
            addProspect(store, `p-${i}`, `Persona ${i}`);
        const suggestions = buildDerivedSuggestions(store, { maxProspects: null });
        assert.equal(suggestions.filter((s) => s.kind === 'promote_prospect').length, 30);
    });
    it('buildDerivedSuggestions drops dismissed prospects from maintenance list', () => {
        const store = emptyStore();
        for (let i = 0; i < 30; i++)
            addProspect(store, `p-${i}`, `Persona ${i}`);
        store.dismissedProspectIds = ['p-0', 'p-1', 'p-2'];
        store.prospects = store.prospects.filter((p) => !store.dismissedProspectIds.includes(p.id));
        const suggestions = buildDerivedSuggestions(store, { maxProspects: null });
        assert.equal(suggestions.filter((s) => s.kind === 'promote_prospect').length, 27);
    });
});
