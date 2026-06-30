import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyProspectDismissInStore, applyProspectRestoreInStore } from './prospect-dismiss-store.js';
function emptyStore() {
    return {
        version: 1,
        savedAt: new Date().toISOString(),
        meetings: [
            {
                id: 'm1',
                sourceFile: 'm1.md',
                title: 'Meet',
                startedAt: '2026-01-01T00:00:00.000Z',
                participants: [],
                personIds: [],
                prospectIds: ['lucas-1'],
                teamIds: [],
                projectIds: [],
                syncStatus: 'synced',
                analysisStatus: 'analyzed',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ],
        people: [],
        prospects: [
            {
                id: 'lucas-1',
                displayName: 'Lucas Mazalan',
                aliases: [],
                meetingIds: ['m1'],
            },
        ],
        projects: [],
        teams: [],
        todos: [],
        pendingSuggestions: [],
        graphEdges: [],
    };
}
describe('prospect-dismiss-undo', () => {
    it('dismiss then restore reverts prospect, meetings and dismissed meta', () => {
        const store = emptyStore();
        const { undoSnapshot } = applyProspectDismissInStore(store, 'lucas-1');
        assert.equal(store.prospects.length, 0);
        assert.ok(store.dismissedProspectIds?.includes('lucas-1'));
        assert.deepEqual(store.meetings[0].prospectIds, []);
        applyProspectRestoreInStore(store, undoSnapshot);
        assert.equal(store.prospects.length, 1);
        assert.equal(store.prospects[0].displayName, 'Lucas Mazalan');
        assert.ok(!store.dismissedProspectIds?.includes('lucas-1'));
        assert.deepEqual(store.meetings[0].prospectIds, ['lucas-1']);
    });
});
