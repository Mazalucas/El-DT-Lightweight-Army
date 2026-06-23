import type { CerebroStore, StoreHealthMetrics } from '../shared/types.js';
import { computeStoreHealth } from '../services/store-health.js';
import { getStoreMeta, loadStoreFromRepository } from '../services/store-repository.js';
import { runRepairUserStore } from '../services/repair-store.js';
import { getSyncProgress, markSyncStarting } from '../services/sync.js';
import { resolveSyncStartMode } from '../lib/sync-running.js';

export async function getStoreSummary(uid: string): Promise<{
  meta: Awaited<ReturnType<typeof getStoreMeta>>;
  health: StoreHealthMetrics;
}> {
  const [meta, store] = await Promise.all([getStoreMeta(uid), loadStoreFromRepository(uid)]);
  return { meta, health: computeStoreHealth(store) };
}

export async function getHealth(uid: string): Promise<StoreHealthMetrics> {
  const store = await loadStoreFromRepository(uid);
  return computeStoreHealth(store);
}

export async function getFullStore(uid: string): Promise<CerebroStore> {
  return loadStoreFromRepository(uid);
}

export async function startRepair(uid: string): Promise<{
  started: boolean;
  alreadyRunning?: boolean;
  startedAt?: string;
  message: string;
}> {
  const { mode, progress } = await resolveSyncStartMode(uid);
  if (mode === 'join') {
    return {
      started: false,
      alreadyRunning: true,
      startedAt: progress?.startedAt,
      message: 'Ya hay un proceso en curso; consultá get_sync_progress',
    };
  }
  const startedAt = await markSyncStarting(uid, {
    phase: 'repair',
    current: 0,
    total: 0,
    currentTitle: 'Iniciando reparación…',
  });
  void runRepairUserStore(uid).catch(console.error);
  return {
    started: true,
    startedAt,
    message: 'Reparación en segundo plano; consultá get_sync_progress',
  };
}

export async function getSyncProgressForUser(uid: string) {
  return getSyncProgress(uid);
}
