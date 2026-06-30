import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { EntityEffect, EntityRef } from '@shared/cerebro-elements.js';
import type { BoardView, MeetingTodo } from '@shared/types.js';
import { useSettings } from '../../hooks.js';
import { qk } from '../../hooks.js';
import {
  optimisticMoveTodo,
  patchTodoOnBoard,
  patchTodosBatchOnBoard,
  restoreBoardSnapshot,
  type BoardCacheSnapshot,
} from './board-cache.js';
import { patchTodoOnDashboard, patchTodosOnDashboard, restoreDashboardSnapshot } from './dashboard-cache.js';
import { useEntityLifecycleStore } from './entity-lifecycle-store.js';
import { scheduleEntityViewsRefetch } from './schedule-refetch.js';

interface EntityActionBusState {
  liveElements: boolean;
  orgId?: string;
  applyEffect: (effect: EntityEffect) => void;
  optimisticTodoPatch: (todo: MeetingTodo) => BoardCacheSnapshot | undefined;
  optimisticTodoMove: (todoId: string, status: MeetingTodo['status']) => BoardCacheSnapshot | undefined;
  rollbackBoard: (snapshot: BoardCacheSnapshot) => void;
  afterMutation: () => void;
  setFocusedEntity: (ref: EntityRef | null) => void;
  focusedEntity: EntityRef | null;
}

const EntityActionBusContext = createContext<EntityActionBusState | null>(null);

export function EntityActionBusProvider({
  children,
  orgId,
}: {
  children: ReactNode;
  orgId?: string;
}) {
  const client = useQueryClient();
  const { data: settings } = useSettings();
  const liveElements = settings?.cerebro?.liveElements === true;
  const focusedEntity = useEntityLifecycleStore((s) => s.focusedEntity);
  const setFocusedEntity = useEntityLifecycleStore((s) => s.setFocusedEntity);
  const setLifecycle = useEntityLifecycleStore((s) => s.setLifecycle);
  const clearLifecycle = useEntityLifecycleStore((s) => s.clearLifecycle);

  const applyEffect = useCallback(
    (effect: EntityEffect) => {
      if (effect.op === 'highlight') {
        setLifecycle(effect.ref, 'ai_acting');
        window.setTimeout(() => clearLifecycle(effect.ref), 2400);
        return;
      }
      if (effect.ref.kind !== 'todo') return;

      const scopeOrgId = effect.ref.orgId ?? orgId;
      const board = client.getQueryData<BoardView>(
        scopeOrgId ? qk.orgBoard(scopeOrgId) : qk.board,
      );
      const existing = board?.todos.find((t) => t.id === effect.ref.id);
      const patch = effect.patch ?? {};
      const status = (patch.status as MeetingTodo['status'] | undefined) ?? existing?.status ?? 'open';

      if (effect.op === 'delete' || status === 'dismissed') {
        if (existing) {
          patchTodoOnBoard(client, { ...existing, status: 'dismissed' }, scopeOrgId);
        }
        if (effect.source === 'cerebro') {
          setLifecycle(effect.ref, 'exiting');
          window.setTimeout(() => clearLifecycle(effect.ref), 800);
        }
        return;
      }

      const now = new Date().toISOString();
      const base: MeetingTodo =
        existing ??
        ({
          id: effect.ref.id,
          text: '',
          meetingId: 'manual',
          status: 'open',
          personIds: [],
          teamIds: [],
          projectIds: [],
          createdAt: now,
          updatedAt: now,
        } satisfies MeetingTodo);

      const todo: MeetingTodo = {
        ...base,
        ...patch,
        id: effect.ref.id,
        status,
        updatedAt: new Date().toISOString(),
      };

      if (effect.source === 'cerebro') setLifecycle(effect.ref, 'ai_acting');
      patchTodoOnBoard(client, todo, scopeOrgId);
      patchTodoOnDashboard(client, todo);
      if (effect.source === 'cerebro') {
        window.setTimeout(() => clearLifecycle(effect.ref), 1200);
      }
    },
    [client, orgId, setLifecycle, clearLifecycle],
  );

  const optimisticTodoPatch = useCallback(
    (todo: MeetingTodo) => {
      if (!liveElements) return undefined;
      patchTodoOnDashboard(client, todo);
      return patchTodoOnBoard(client, todo, orgId);
    },
    [client, liveElements, orgId],
  );

  const optimisticTodoMove = useCallback(
    (todoId: string, status: MeetingTodo['status']) => {
      if (!liveElements) return undefined;
      const { snapshot } = optimisticMoveTodo(client, todoId, status, orgId);
      if (snapshot?.personal || snapshot?.org) {
        const todo = (snapshot.personal ?? snapshot.org?.board)?.todos.find((t) => t.id === todoId);
        if (todo) patchTodoOnDashboard(client, todo);
      }
      return snapshot;
    },
    [client, liveElements, orgId],
  );

  const rollbackBoard = useCallback(
    (snapshot: BoardCacheSnapshot) => {
      restoreBoardSnapshot(client, snapshot);
    },
    [client],
  );

  const afterMutation = useCallback(() => {
    scheduleEntityViewsRefetch(client, orgId);
  }, [client, orgId]);

  const value = useMemo(
    () => ({
      liveElements,
      orgId,
      applyEffect,
      optimisticTodoPatch,
      optimisticTodoMove,
      rollbackBoard,
      afterMutation,
      setFocusedEntity,
      focusedEntity,
    }),
    [
      liveElements,
      orgId,
      applyEffect,
      optimisticTodoPatch,
      optimisticTodoMove,
      rollbackBoard,
      afterMutation,
      setFocusedEntity,
      focusedEntity,
    ],
  );

  return <EntityActionBusContext.Provider value={value}>{children}</EntityActionBusContext.Provider>;
}

export function useEntityActionBus(): EntityActionBusState {
  const ctx = useContext(EntityActionBusContext);
  if (!ctx) throw new Error('useEntityActionBus debe usarse dentro de EntityActionBusProvider');
  return ctx;
}

export function useOptionalEntityActionBus(): EntityActionBusState | null {
  return useContext(EntityActionBusContext);
}

export { patchTodosBatchOnBoard, restoreDashboardSnapshot };
