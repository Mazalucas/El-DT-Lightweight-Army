import type { BoardView, MeetingTodo } from '@shared/types.js';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';
import { recountBoardCounts } from './board-counts.js';

export { recountBoardCounts } from './board-counts.js';
export type BoardCacheSnapshot = {
  personal?: BoardView;
  org?: { orgId: string; board: BoardView };
};

function patchBoard(client: QueryClient, orgId: string | undefined, updater: (prev: BoardView) => BoardView): void {
  if (orgId) {
    client.setQueryData<BoardView>(qk.orgBoard(orgId), (prev) => (prev ? updater(prev) : prev));
  } else {
    client.setQueryData<BoardView>(qk.board, (prev) => (prev ? updater(prev) : prev));
  }
}

function upsertTodo(todos: MeetingTodo[], todo: MeetingTodo): MeetingTodo[] {
  const idx = todos.findIndex((t) => t.id === todo.id);
  if (idx === -1) return [...todos, todo];
  const next = [...todos];
  next[idx] = { ...next[idx], ...todo };
  return next;
}

export function patchTodoOnBoard(
  client: QueryClient,
  todo: MeetingTodo,
  orgId?: string,
): BoardCacheSnapshot | undefined {
  let personal: BoardView | undefined;
  let orgBoard: BoardView | undefined;

  patchBoard(client, orgId, (prev) => {
    const todos =
      todo.status === 'dismissed'
        ? prev.todos.filter((t) => t.id !== todo.id)
        : upsertTodo(prev.todos, todo);
    const next = { ...prev, todos, counts: recountBoardCounts(todos) };
    if (orgId) orgBoard = next;
    else personal = next;
    return next;
  });

  const snapshot: BoardCacheSnapshot = {};
  if (personal) snapshot.personal = personal;
  if (orgBoard && orgId) snapshot.org = { orgId, board: orgBoard };
  return Object.keys(snapshot).length ? snapshot : undefined;
}

export function patchTodosBatchOnBoard(
  client: QueryClient,
  todos: MeetingTodo[],
  orgId?: string,
): BoardCacheSnapshot | undefined {
  let snapshot: BoardCacheSnapshot | undefined;
  for (const todo of todos) {
    snapshot = patchTodoOnBoard(client, todo, orgId) ?? snapshot;
  }
  return snapshot;
}

export function restoreBoardSnapshot(client: QueryClient, snapshot: BoardCacheSnapshot): void {
  if (snapshot.personal) {
    client.setQueryData(qk.board, snapshot.personal);
  }
  if (snapshot.org) {
    client.setQueryData(qk.orgBoard(snapshot.org.orgId), snapshot.org.board);
  }
}

export function optimisticMoveTodo(
  client: QueryClient,
  todoId: string,
  status: MeetingTodo['status'],
  orgId?: string,
  boardPosition?: number,
): { snapshot?: BoardCacheSnapshot; previous?: BoardCacheSnapshot } {
  let previous: BoardCacheSnapshot | undefined;
  let moved!: MeetingTodo;

  patchBoard(client, orgId, (prev) => {
    previous = orgId ? { org: { orgId, board: prev } } : { personal: prev };
    const todo = prev.todos.find((t) => t.id === todoId);
    if (!todo) return prev;
    const now = new Date().toISOString();
    moved = {
      ...todo,
      status,
      boardPosition: boardPosition ?? todo.boardPosition,
      updatedAt: now,
      completedAt: status === 'done' ? now : status === 'open' || status === 'suggested' ? undefined : todo.completedAt,
    };
    const todos =
      status === 'dismissed'
        ? prev.todos.filter((t) => t.id !== todoId)
        : upsertTodo(prev.todos, moved);
    return { ...prev, todos, counts: recountBoardCounts(todos) };
  });

  const snapshot = moved! ? patchTodoOnBoard(client, moved, orgId) : undefined;
  return { snapshot, previous };
}
