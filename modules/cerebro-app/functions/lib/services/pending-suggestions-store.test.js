import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acceptProjectSuggestionInStore, acceptTeamSuggestionInStore, batchDismissSuggestionsInStore, restorePendingSuggestionsInStore, revertSuggestionAcceptInStore, upsertPendingSuggestion, } from './pending-suggestions-store.js';
function emptyStore(overrides = {}) {
    return {
        version: 1,
        savedAt: '2026-06-26T12:00:00.000Z',
        meetings: [],
        people: [],
        prospects: [],
        projects: [],
        teams: [{ id: 'team-1', name: 'Ops', color: '#000', emails: [] }],
        todos: [],
        pendingSuggestions: [],
        ...overrides,
    };
}
function seedProjectSuggestion(store) {
    store.meetings.push({
        id: 'm1',
        sourceFile: 'm1.md',
        title: 'Sync Alpha',
        startedAt: '2026-06-01T10:00:00.000Z',
        participants: [],
        personIds: [],
        prospectIds: [],
        projectIds: [],
        teamIds: [],
        syncStatus: 'synced',
        analysisStatus: 'analyzed',
        updatedAt: '2026-06-01T10:00:00.000Z',
    });
    return upsertPendingSuggestion(store, {
        kind: 'assign_project',
        title: 'Proyecto: Alpha',
        meetingId: 'm1',
        source: 'inferred',
        stableKey: 'Alpha',
        payload: { projectName: 'Alpha', meetingId: 'm1' },
    });
}
describe('pending-suggestions undo', () => {
    it('restores dismissed suggestions to pending', () => {
        const store = emptyStore();
        const row = seedProjectSuggestion(store);
        batchDismissSuggestionsInStore(store, [row.id]);
        assert.equal(store.pendingSuggestions[0].status, 'dismissed');
        const restored = restorePendingSuggestionsInStore(store, [row.id]);
        assert.equal(restored, 1);
        assert.equal(store.pendingSuggestions[0].status, 'pending');
    });
    it('reverts project accept by removing link and restoring pending', () => {
        const store = emptyStore();
        const row = seedProjectSuggestion(store);
        const snapshot = acceptProjectSuggestionInStore(store, row.id, { projectName: 'Alpha' });
        assert.equal(store.pendingSuggestions[0].status, 'accepted');
        assert.ok(store.meetings[0].projectIds.length);
        const reverted = revertSuggestionAcceptInStore(store, snapshot);
        assert.equal(reverted, true);
        assert.equal(store.pendingSuggestions[0].status, 'pending');
        assert.equal(store.meetings[0].projectIds.length, 0);
    });
    it('reverts team accept', () => {
        const store = emptyStore();
        store.meetings.push({
            id: 'm2',
            sourceFile: 'm2.md',
            title: 'Ops weekly',
            startedAt: '2026-06-02T10:00:00.000Z',
            participants: [],
            personIds: [],
            prospectIds: [],
            projectIds: [],
            teamIds: [],
            syncStatus: 'synced',
            analysisStatus: 'analyzed',
            updatedAt: '2026-06-02T10:00:00.000Z',
        });
        const row = upsertPendingSuggestion(store, {
            kind: 'assign_team',
            title: 'Equipo: Ops',
            meetingId: 'm2',
            source: 'inferred',
            stableKey: 'team-1',
            payload: { teamId: 'team-1', teamName: 'Ops', meetingId: 'm2' },
        });
        const snapshot = acceptTeamSuggestionInStore(store, row.id);
        assert.ok(store.meetings[0].teamIds.includes('team-1'));
        revertSuggestionAcceptInStore(store, snapshot);
        assert.equal(store.pendingSuggestions[0].status, 'pending');
        assert.equal(store.meetings[0].teamIds.length, 0);
    });
});
