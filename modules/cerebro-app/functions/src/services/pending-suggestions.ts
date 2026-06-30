export type { UpsertPendingInput } from './pending-suggestions-store.js';
export {
  acceptPendingSuggestion,
  acceptProjectSuggestionInStore,
  acceptTeamSuggestionInStore,
  batchAcceptProjectSuggestionsInStore,
  batchAcceptTeamSuggestionsInStore,
  batchDismissSuggestionsInStore,
  dismissPendingSuggestion,
  emitProjectSuggestion,
  emitTeamSuggestion,
  ensurePendingSuggestions,
  listActivePendingSuggestions,
  listActiveSuggestionsFromStore,
  pendingToSuggestion,
  restorePendingSuggestion,
  restorePendingSuggestionsInStore,
  revertSuggestionAcceptInStore,
  revertSuggestionAcceptsInStore,
  stableSuggestionId,
  upsertPendingSuggestion,
} from './pending-suggestions-store.js';

import type { CerebroStore, SuggestionAcceptUndoSnapshot } from '../shared/types.js';
import type { StoreAdapter } from './catalog-mutate.js';
import { mutateStore } from './catalog-mutate.js';
import {
  acceptProjectSuggestionInStore,
  acceptTeamSuggestionInStore,
  batchAcceptProjectSuggestionsInStore,
  batchAcceptTeamSuggestionsInStore,
  batchDismissSuggestionsInStore,
  dismissPendingSuggestion,
  restorePendingSuggestionsInStore,
  revertSuggestionAcceptsInStore,
} from './pending-suggestions-store.js';

export async function dismissSuggestionOnAdapter(adapter: StoreAdapter, id: string): Promise<CerebroStore> {
  return mutateStore(adapter, (store) => {
    if (!dismissPendingSuggestion(store, id)) throw new Error('Sugerencia no encontrada');
  });
}

export async function acceptProjectSuggestionOnAdapter(
  adapter: StoreAdapter,
  id: string,
  opts?: { existingProjectId?: string; projectName?: string },
): Promise<CerebroStore> {
  return mutateStore(adapter, (store) => {
    acceptProjectSuggestionInStore(store, id, opts);
  });
}

export async function acceptTeamSuggestionOnAdapter(
  adapter: StoreAdapter,
  id: string,
): Promise<CerebroStore> {
  return mutateStore(adapter, (store) => {
    acceptTeamSuggestionInStore(store, id);
  });
}

export async function batchDismissSuggestionsOnAdapter(
  adapter: StoreAdapter,
  ids: string[],
): Promise<{ store: CerebroStore; dismissed: number }> {
  let dismissed = 0;
  const store = await mutateStore(adapter, (s) => {
    dismissed = batchDismissSuggestionsInStore(s, ids);
  });
  return { store, dismissed };
}

export async function batchAcceptProjectSuggestionsOnAdapter(
  adapter: StoreAdapter,
  ids: string[],
  opts?: { existingProjectId?: string; projectName?: string },
): Promise<{ store: CerebroStore; accepted: number; skipped: number; undoSnapshots: SuggestionAcceptUndoSnapshot[] }> {
  let result = { accepted: 0, skipped: 0, undoSnapshots: [] as SuggestionAcceptUndoSnapshot[] };
  const store = await mutateStore(adapter, (s) => {
    result = batchAcceptProjectSuggestionsInStore(s, ids, opts);
  });
  return { store, ...result };
}

export async function batchAcceptTeamSuggestionsOnAdapter(
  adapter: StoreAdapter,
  ids: string[],
): Promise<{ store: CerebroStore; accepted: number; skipped: number; undoSnapshots: SuggestionAcceptUndoSnapshot[] }> {
  let result = { accepted: 0, skipped: 0, undoSnapshots: [] as SuggestionAcceptUndoSnapshot[] };
  const store = await mutateStore(adapter, (s) => {
    result = batchAcceptTeamSuggestionsInStore(s, ids);
  });
  return { store, ...result };
}

export async function restorePendingSuggestionsOnAdapter(
  adapter: StoreAdapter,
  ids: string[],
): Promise<{ store: CerebroStore; restored: number }> {
  let restored = 0;
  const store = await mutateStore(adapter, (s) => {
    restored = restorePendingSuggestionsInStore(s, ids);
  });
  return { store, restored };
}

export async function revertSuggestionAcceptsOnAdapter(
  adapter: StoreAdapter,
  snapshots: SuggestionAcceptUndoSnapshot[],
): Promise<{ store: CerebroStore; reverted: number }> {
  let reverted = 0;
  const store = await mutateStore(adapter, (s) => {
    reverted = revertSuggestionAcceptsInStore(s, snapshots);
  });
  return { store, reverted };
}
