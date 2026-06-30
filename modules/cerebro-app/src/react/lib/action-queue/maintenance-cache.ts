import type { MaintenanceItem, MaintenanceView, SuggestionKind } from '@shared/types.js';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';
import type { MaintenanceOptimisticSnapshot } from './types.js';

function rebuildMaintenanceView(items: MaintenanceItem[]): MaintenanceView {
  const counts: Partial<Record<SuggestionKind, number>> = {};
  for (const item of items) {
    counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  }
  return {
    items,
    counts,
    total: items.length,
    generatedAt: new Date().toISOString(),
  };
}

function sortMaintenanceItems(items: MaintenanceItem[]): MaintenanceItem[] {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.createdAt ?? '') || 0;
    const tb = Date.parse(b.createdAt ?? '') || 0;
    return tb - ta;
  });
}

/** Quita ítems del cache de mantenimiento; devuelve snapshot para rollback. */
export function patchRemoveMaintenanceItems(
  client: QueryClient,
  itemIds: string[],
): MaintenanceOptimisticSnapshot | undefined {
  if (!itemIds.length) return undefined;
  const idSet = new Set(itemIds);
  let removedItems: MaintenanceItem[] = [];

  client.setQueryData<MaintenanceView>(qk.maintenance, (prev) => {
    if (!prev) return prev;
    removedItems = prev.items.filter((i) => idSet.has(i.id));
    const items = prev.items.filter((i) => !idSet.has(i.id));
    return rebuildMaintenanceView(items);
  });

  return removedItems.length ? { itemIds, removedItems } : undefined;
}

/** Restaura ítems previamente quitados (error o undo). */
export function patchRestoreMaintenanceItems(
  client: QueryClient,
  snapshot: MaintenanceOptimisticSnapshot,
): void {
  client.setQueryData<MaintenanceView>(qk.maintenance, (prev) => {
    if (!prev) return prev;
    const existingIds = new Set(prev.items.map((i) => i.id));
    const toAdd = snapshot.removedItems.filter((i) => !existingIds.has(i.id));
    if (!toAdd.length) return prev;
    return rebuildMaintenanceView(sortMaintenanceItems([...prev.items, ...toAdd]));
  });
}

let debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

/** Refetch suave de vistas afectadas tras drenar la cola. */
export function scheduleCatalogViewsRefetch(client: QueryClient, delayMs = 400): void {
  if (debounceTimer) globalThis.clearTimeout(debounceTimer);
  debounceTimer = globalThis.setTimeout(() => {
    void client.invalidateQueries({ queryKey: qk.maintenance });
    void client.invalidateQueries({
      predicate: (q) => {
        const key = q.queryKey;
        const i = key.indexOf('people');
        return i > 0 && key[i - 1] === 'views';
      },
    });
    void client.invalidateQueries({ queryKey: qk.dashboard });
    void client.invalidateQueries({ queryKey: qk.board });
    void client.invalidateQueries({ queryKey: ['views', 'graph'] });
    debounceTimer = null;
  }, delayMs);
}

/** @deprecated Use scheduleCatalogViewsRefetch */
export const scheduleMaintenanceViewsRefetch = scheduleCatalogViewsRefetch;
