import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pickLatestIso } from '@shared/recency-sort.js';
import type { SyncProgressResponse } from '@shared/types.js';
import { api } from '../lib/api.js';
import { formatSyncCompletionToast, formatSyncProgressStatus } from '../lib/sync-progress.js';
import { toast } from './ds.js';
import { qk, useInvalidateViews, useSyncProgress, useSyncStatus } from './hooks.js';

interface SyncContextValue {
  running: boolean;
  progress: SyncProgressResponse | undefined;
  statusLabel: string;
  lastSyncAt: string | undefined;
  /** Último resultado persistido del pipeline (visible tras completar). */
  lastSyncResult: SyncProgressResponse | undefined;
  hasGoogleIntegration: boolean;
  setupComplete: boolean;
  startSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

async function fetchLatestSyncProgress(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<SyncProgressResponse> {
  return queryClient.fetchQuery({
    queryKey: qk.syncProgress,
    queryFn: () => api.syncProgress(),
    staleTime: 0,
  });
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const wasRunning = useRef(false);
  const invalidateViews = useInvalidateViews();
  const queryClient = useQueryClient();
  const statusQuery = useSyncStatus();
  const progressQuery = useSyncProgress(active);

  const serverRunning = statusQuery.data?.syncRunning === true;

  useEffect(() => {
    if (serverRunning) setActive(true);
  }, [serverRunning]);

  const running =
    active && (progressQuery.data ? progressQuery.data.running === true : true);

  const refreshSyncMeta = useCallback(() => {
    invalidateViews();
    void queryClient.invalidateQueries({ queryKey: qk.syncStatus });
    void queryClient.invalidateQueries({ queryKey: qk.dashboard });
  }, [invalidateViews, queryClient]);

  const [recentFinishedAt, setRecentFinishedAt] = useState<string | undefined>();
  const [lastSyncResult, setLastSyncResult] = useState<SyncProgressResponse | undefined>();

  useEffect(() => {
    if (running) {
      wasRunning.current = true;
      return;
    }
    if (!wasRunning.current) return;

    wasRunning.current = false;

    void (async () => {
      let final = progressQuery.data;
      if (!final?.done || !final.result) {
        try {
          final = await fetchLatestSyncProgress(queryClient);
        } catch {
          // Mantener último poll si el refetch falla.
        }
      }

      setActive(false);

      if (final?.finishedAt) {
        setRecentFinishedAt((prev) => pickLatestIso(prev, final?.finishedAt) ?? final?.finishedAt);
      }
      if (final?.done) {
        setLastSyncResult(final);
      }

      await queryClient.refetchQueries({ queryKey: qk.syncStatus });
      refreshSyncMeta();

      const { message, type } = formatSyncCompletionToast(final ?? { phase: 'idle', current: 0, total: 0, done: true });
      toast(message, type);
    })();
  }, [running, refreshSyncMeta, progressQuery.data, queryClient]);

  const startSync = useCallback(async () => {
    if (running) return;
    try {
      setLastSyncResult(undefined);
      setActive(true);
      await api.syncPipeline();
    } catch (e) {
      setActive(false);
      toast(e instanceof Error ? e.message : 'Error al iniciar sync', 'error');
    }
  }, [running]);

  const statusLabel = running
    ? progressQuery.data
      ? formatSyncProgressStatus(progressQuery.data)
      : 'Sincronizando…'
    : lastSyncResult
      ? formatSyncProgressStatus(lastSyncResult)
      : 'Listo';

  const value = useMemo<SyncContextValue>(
    () => ({
      running,
      progress: progressQuery.data,
      statusLabel,
      lastSyncResult,
      lastSyncAt: pickLatestIso(
        recentFinishedAt,
        statusQuery.data?.lastSyncAt,
        statusQuery.data?.syncSchedule?.lastRunAt,
        progressQuery.data?.done ? progressQuery.data.finishedAt : undefined,
        lastSyncResult?.finishedAt,
      ),
      hasGoogleIntegration: statusQuery.data?.hasGoogleIntegration === true,
      setupComplete: statusQuery.data?.setupComplete === true,
      startSync,
    }),
    [
      running,
      progressQuery.data,
      statusLabel,
      lastSyncResult,
      recentFinishedAt,
      statusQuery.data?.lastSyncAt,
      statusQuery.data?.syncSchedule?.lastRunAt,
      statusQuery.data?.hasGoogleIntegration,
      statusQuery.data?.setupComplete,
      startSync,
    ],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
