import { describe, expect, it } from 'vitest';
import { collectProspectNameKeys, isProspectDismissed, mergeDismissedMaintenanceMeta, } from './prospect-dismiss.js';
import { mergeMemberStoreIntoOrg } from '../../services/org-federated.js';
import { buildDerivedSuggestions } from '../../services/suggestions-graph.js';
import { hydrateCerebroStore } from '../../services/store-persist.js';
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
describe('prospect-dismiss', () => {
    it('collects variant name keys from chip labels', () => {
        const keys = collectProspectNameKeys('Herramienta Lucas Mazalan');
        expect(keys).toContain('lucas mazalan');
    });
    it('mergeMemberStoreIntoOrg skips dismissed personal prospects', () => {
        const org = emptyStore();
        const personal = emptyStore();
        personal.prospects.push({
            id: 'lucas-mazalan',
            displayName: 'Lucas Mazalan',
            aliases: [],
            meetingIds: ['m1'],
            sources: ['participant'],
            lastSeenAt: new Date().toISOString(),
        });
        personal.dismissedProspectKeys = ['lucas mazalan'];
        mergeMemberStoreIntoOrg(org, personal, 'uid-1');
        expect(org.prospects.some((p) => p.id === 'lucas-mazalan')).toBe(false);
    });
    it('buildDerivedSuggestions hides dismissed merge contacts', () => {
        const store = emptyStore();
        store.people.push({
            id: 'a',
            displayName: 'Ana Test',
            aliases: [],
            emails: ['ana@test.com'],
            teamIds: [],
            projectIds: [],
            emailMeta: {},
        }, {
            id: 'b',
            displayName: 'Ana Copy',
            aliases: [],
            emails: ['ana@test.com'],
            teamIds: [],
            projectIds: [],
            emailMeta: {},
        });
        store.dismissedMergeContactKeys = ['merge-email-ana@test.com'];
        const suggestions = buildDerivedSuggestions(store);
        expect(suggestions.some((s) => s.kind === 'merge_contacts')).toBe(false);
    });
    it('hydrateCerebroStore preserves dismissed maintenance fields', async () => {
        const hydrated = await hydrateCerebroStore({
            version: 1,
            savedAt: new Date().toISOString(),
            meetings: [],
            people: [],
            prospects: [],
            projects: [],
            teams: [],
            todos: [],
            dismissedProspectKeys: ['john'],
            dismissedMergeContactKeys: ['merge-name-john doe'],
        });
        expect(hydrated.dismissedProspectKeys).toEqual(['john']);
        expect(hydrated.dismissedMergeContactKeys).toEqual(['merge-name-john doe']);
    });
    it('mergeDismissedMaintenanceMeta unions overlay keys', () => {
        const target = emptyStore();
        target.dismissedProspectKeys = ['a'];
        const source = emptyStore();
        source.dismissedProspectKeys = ['b'];
        source.dismissedMergeContactKeys = ['merge-email-x@y.com'];
        mergeDismissedMaintenanceMeta(target, source);
        expect(target.dismissedProspectKeys).toEqual(['a', 'b']);
        expect(target.dismissedMergeContactKeys).toEqual(['merge-email-x@y.com']);
    });
    it('isProspectDismissed matches alias variants', () => {
        const store = emptyStore();
        store.dismissedProspectKeys = ['lucas mazalan'];
        expect(isProspectDismissed(store, {
            id: 'other-id',
            displayName: 'Herramienta Lucas Mazalan',
            aliases: [],
        })).toBe(true);
    });
});
