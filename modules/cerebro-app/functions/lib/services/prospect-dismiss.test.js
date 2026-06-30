import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectProspectNameKeys, isProspectDismissed, listActiveProspectsForMaintenance, mergeDismissedMaintenanceMeta, mergeDismissedMaintenanceMetaFromRecord, } from '../core/profesional/prospect-dismiss.js';
import { normalizePersonNameKey } from '../core/profesional/person-name-clean.js';
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
        assert.ok(keys.includes('lucas mazalan'));
    });
    it('mergeDismissedMaintenanceMeta unions overlay keys', () => {
        const target = emptyStore();
        target.dismissedProspectKeys = ['a'];
        const source = emptyStore();
        source.dismissedProspectKeys = ['b'];
        source.dismissedMergeContactKeys = ['merge-email-x@y.com'];
        mergeDismissedMaintenanceMeta(target, source);
        assert.deepEqual(target.dismissedProspectKeys, ['a', 'b']);
        assert.deepEqual(target.dismissedMergeContactKeys, ['merge-email-x@y.com']);
    });
    it('isProspectDismissed matches alias variants', () => {
        const store = emptyStore();
        store.dismissedProspectKeys = ['lucas mazalan'];
        assert.equal(isProspectDismissed(store, {
            id: 'other-id',
            displayName: 'Herramienta Lucas Mazalan',
            aliases: [],
        }), true);
    });
    it('isProspectDismissed matches dismissed id', () => {
        const store = emptyStore();
        store.dismissedProspectIds = ['ghost-id'];
        assert.equal(isProspectDismissed(store, { id: 'ghost-id', displayName: 'Anyone', aliases: [] }), true);
    });
    it('mergeDismissedMaintenanceMetaFromRecord unions meta into store', () => {
        const store = emptyStore();
        mergeDismissedMaintenanceMetaFromRecord(store, {
            dismissedProspectKeys: ['a'],
            dismissedMergeContactKeys: ['merge-email-x@y.com'],
        });
        assert.deepEqual(store.dismissedProspectKeys, ['a']);
        assert.deepEqual(store.dismissedMergeContactKeys, ['merge-email-x@y.com']);
    });
    it('listActiveProspectsForMaintenance excludes dismissed and caps reflect real count', () => {
        const store = emptyStore();
        for (let i = 0; i < 30; i++) {
            store.prospects.push({
                id: `p-${i}`,
                displayName: `Persona ${i}`,
                aliases: [],
                meetingIds: ['m1'],
                sources: ['participant'],
                lastSeenAt: new Date().toISOString(),
            });
        }
        assert.equal(listActiveProspectsForMaintenance(store).length, 30);
        store.dismissedProspectKeys = [normalizePersonNameKey('Persona 0')];
        assert.equal(listActiveProspectsForMaintenance(store).length, 29);
    });
});
