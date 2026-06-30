export { acceptPendingSuggestion, acceptProjectSuggestionInStore, acceptTeamSuggestionInStore, batchAcceptProjectSuggestionsInStore, batchAcceptTeamSuggestionsInStore, batchDismissSuggestionsInStore, dismissPendingSuggestion, emitProjectSuggestion, emitTeamSuggestion, ensurePendingSuggestions, listActivePendingSuggestions, listActiveSuggestionsFromStore, pendingToSuggestion, restorePendingSuggestion, restorePendingSuggestionsInStore, revertSuggestionAcceptInStore, revertSuggestionAcceptsInStore, stableSuggestionId, upsertPendingSuggestion, } from './pending-suggestions-store.js';
import { mutateStore } from './catalog-mutate.js';
import { acceptProjectSuggestionInStore, acceptTeamSuggestionInStore, batchAcceptProjectSuggestionsInStore, batchAcceptTeamSuggestionsInStore, batchDismissSuggestionsInStore, dismissPendingSuggestion, restorePendingSuggestionsInStore, revertSuggestionAcceptsInStore, } from './pending-suggestions-store.js';
export async function dismissSuggestionOnAdapter(adapter, id) {
    return mutateStore(adapter, (store) => {
        if (!dismissPendingSuggestion(store, id))
            throw new Error('Sugerencia no encontrada');
    });
}
export async function acceptProjectSuggestionOnAdapter(adapter, id, opts) {
    return mutateStore(adapter, (store) => {
        acceptProjectSuggestionInStore(store, id, opts);
    });
}
export async function acceptTeamSuggestionOnAdapter(adapter, id) {
    return mutateStore(adapter, (store) => {
        acceptTeamSuggestionInStore(store, id);
    });
}
export async function batchDismissSuggestionsOnAdapter(adapter, ids) {
    let dismissed = 0;
    const store = await mutateStore(adapter, (s) => {
        dismissed = batchDismissSuggestionsInStore(s, ids);
    });
    return { store, dismissed };
}
export async function batchAcceptProjectSuggestionsOnAdapter(adapter, ids, opts) {
    let result = { accepted: 0, skipped: 0, undoSnapshots: [] };
    const store = await mutateStore(adapter, (s) => {
        result = batchAcceptProjectSuggestionsInStore(s, ids, opts);
    });
    return { store, ...result };
}
export async function batchAcceptTeamSuggestionsOnAdapter(adapter, ids) {
    let result = { accepted: 0, skipped: 0, undoSnapshots: [] };
    const store = await mutateStore(adapter, (s) => {
        result = batchAcceptTeamSuggestionsInStore(s, ids);
    });
    return { store, ...result };
}
export async function restorePendingSuggestionsOnAdapter(adapter, ids) {
    let restored = 0;
    const store = await mutateStore(adapter, (s) => {
        restored = restorePendingSuggestionsInStore(s, ids);
    });
    return { store, restored };
}
export async function revertSuggestionAcceptsOnAdapter(adapter, snapshots) {
    let reverted = 0;
    const store = await mutateStore(adapter, (s) => {
        reverted = revertSuggestionAcceptsInStore(s, snapshots);
    });
    return { store, reverted };
}
