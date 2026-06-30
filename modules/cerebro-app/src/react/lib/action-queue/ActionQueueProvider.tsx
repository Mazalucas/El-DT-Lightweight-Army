import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../../../lib/ui.js';
import { useSettings } from '../../hooks.js';
import { scheduleCatalogViewsRefetch } from './maintenance-cache.js';
import {
  optimisticMoveTodo,
  patchTodoOnBoard,
  restoreBoardSnapshot,
  type BoardCacheSnapshot,
} from '../entity-action/board-cache.js';
import { patchTodoOnDashboard } from '../entity-action/dashboard-cache.js';
import { scheduleEntityViewsRefetch } from '../entity-action/schedule-refetch.js';
import {
  patchAddProjectToBoard,
  patchAddTeamToBoard,
  patchRemoveProjectFromBoard,
  patchRemoveTeamFromBoard,
  restoreCatalogBoardSnapshot,
  type CatalogBoardSnapshot,
} from '../entity-action/catalog-cache.js';
import {
  applyCatalogOptimisticPatch,
  patchRestoreCatalogSnapshot,
  type CatalogOptimisticSnapshot,
} from './people-cache.js';
import { SerialQueue } from './serial-queue.js';
import type { ActionQueueState, EnqueueAction } from './types.js';

const ActionQueueContext = createContext<ActionQueueState | null>(null);

export function ActionQueueProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const liveElements = settings?.cerebro?.liveElements === true;
  const queueRef = useRef(new SerialQueue());
  const pendingKeysRef = useRef(new Set<string>());
  const pendingProspectIdsRef = useRef(new Set<string>());
  const [pendingCount, setPendingCount] = useState(0);
  const [, bump] = useState(0);

  const syncPending = useCallback(() => {
    bump((n) => n + 1);
  }, []);

  const isPending = useCallback((key: string) => pendingKeysRef.current.has(key), []);

  const isProspectPending = useCallback(
    (prospectId: string) => pendingProspectIdsRef.current.has(prospectId),
    [],
  );

  const trackProspectPending = useCallback(
    (prospectIds: string[] | undefined, add: boolean) => {
      if (!prospectIds?.length) return;
      for (const id of prospectIds) {
        if (add) pendingProspectIdsRef.current.add(id);
        else pendingProspectIdsRef.current.delete(id);
      }
      syncPending();
    },
    [syncPending],
  );

  const enqueue = useCallback(
    <T,>(action: EnqueueAction<T>) => {
      if (pendingKeysRef.current.has(action.key)) return;

      const optimistic: CatalogOptimisticSnapshot | undefined = applyCatalogOptimisticPatch(queryClient, {
        itemIds: action.itemIds,
        prospectIds: action.prospectIds,
        removePersonIds: action.removePersonIds,
      });

      let boardSnapshot: BoardCacheSnapshot | undefined;
      let catalogBoardSnapshot: CatalogBoardSnapshot | undefined;
      const orgId = action.orgId ?? action.todoMove?.orgId ?? action.todoMoves?.[0]?.orgId ?? action.catalogBoard?.orgId;

      if (liveElements) {
        if (action.todoMoves?.length) {
          for (const move of action.todoMoves) {
            const result = optimisticMoveTodo(queryClient, move.todoId, move.status, move.orgId ?? orgId);
            boardSnapshot = result.snapshot ?? boardSnapshot;
            const todo = (result.snapshot?.personal ?? result.snapshot?.org?.board)?.todos.find(
              (t) => t.id === move.todoId,
            );
            if (todo) patchTodoOnDashboard(queryClient, todo);
          }
        } else if (action.todoMove) {
          const result = optimisticMoveTodo(
            queryClient,
            action.todoMove.todoId,
            action.todoMove.status,
            action.todoMove.orgId ?? orgId,
            action.todoMove.boardPosition,
          );
          boardSnapshot = result.snapshot;
          const todo = (result.snapshot?.personal ?? result.snapshot?.org?.board)?.todos.find(
            (t) => t.id === action.todoMove!.todoId,
          );
          if (todo) patchTodoOnDashboard(queryClient, todo);
        } else if (action.todoPatch) {
          boardSnapshot = patchTodoOnBoard(queryClient, action.todoPatch, orgId);
          patchTodoOnDashboard(queryClient, action.todoPatch);
        }

        if (action.catalogBoard) {
          const cb = action.catalogBoard;
          const scopeOrg = cb.orgId ?? orgId;
          if (cb.addProject) {
            catalogBoardSnapshot = patchAddProjectToBoard(queryClient, cb.addProject, scopeOrg) ?? catalogBoardSnapshot;
          }
          if (cb.removeProjectId) {
            catalogBoardSnapshot =
              patchRemoveProjectFromBoard(queryClient, cb.removeProjectId, scopeOrg) ?? catalogBoardSnapshot;
          }
          if (cb.addTeam) {
            catalogBoardSnapshot = patchAddTeamToBoard(queryClient, cb.addTeam, scopeOrg) ?? catalogBoardSnapshot;
          }
          if (cb.removeTeamId) {
            catalogBoardSnapshot =
              patchRemoveTeamFromBoard(queryClient, cb.removeTeamId, scopeOrg) ?? catalogBoardSnapshot;
          }
        }
      }

      pendingKeysRef.current.add(action.key);
      trackProspectPending(action.prospectIds, true);
      setPendingCount((c) => c + 1);
      syncPending();

      void queueRef.current.enqueue(async () => {
        try {
          const result = await action.execute();
          const message =
            typeof action.successMessage === 'function'
              ? action.successMessage(result)
              : action.successMessage;

          toast(message, {
            undo: action.undo
              ? {
                  run: async () => {
                    await action.undo!(result);
                    if (optimistic) patchRestoreCatalogSnapshot(queryClient, optimistic);
                    scheduleCatalogViewsRefetch(queryClient);
                    toast('Acción deshecha');
                  },
                }
              : undefined,
          });
        } catch (e) {
          if (optimistic) patchRestoreCatalogSnapshot(queryClient, optimistic);
          if (boardSnapshot) restoreBoardSnapshot(queryClient, boardSnapshot);
          if (catalogBoardSnapshot) restoreCatalogBoardSnapshot(queryClient, catalogBoardSnapshot);
          const fallback = action.errorMessage ?? (e instanceof Error ? e.message : 'Error');
          toast(fallback, 'error');
        } finally {
          pendingKeysRef.current.delete(action.key);
          trackProspectPending(action.prospectIds, false);
          setPendingCount((c) => Math.max(0, c - 1));
          syncPending();
          if (action.entityMutation) {
            if (liveElements) scheduleEntityViewsRefetch(queryClient, orgId);
            else {
              void queryClient.invalidateQueries({ queryKey: ['views'] });
              void queryClient.invalidateQueries({ queryKey: ['org'] });
            }
          } else scheduleCatalogViewsRefetch(queryClient);
        }
      });
    },
    [queryClient, liveElements, syncPending, trackProspectPending],
  );

  const value = useMemo<ActionQueueState>(
    () => ({ pendingCount, isPending, isProspectPending, enqueue }),
    [pendingCount, isPending, isProspectPending, enqueue],
  );

  return <ActionQueueContext.Provider value={value}>{children}</ActionQueueContext.Provider>;
}

export function useActionQueue(): ActionQueueState {
  const ctx = useContext(ActionQueueContext);
  if (!ctx) {
    throw new Error('useActionQueue debe usarse dentro de ActionQueueProvider');
  }
  return ctx;
}

/** Provider opcional — devuelve noop si no hay contexto (p. ej. tests). */
export function useOptionalActionQueue(): ActionQueueState | null {
  return useContext(ActionQueueContext);
}
