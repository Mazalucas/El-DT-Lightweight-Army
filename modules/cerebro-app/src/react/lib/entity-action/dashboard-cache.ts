import type { DashboardView, MeetingTodo } from '@shared/types.js';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '../../hooks.js';

export type DashboardCacheSnapshot = DashboardView | undefined;

function upsertInList(todos: MeetingTodo[], todo: MeetingTodo): MeetingTodo[] {
  const idx = todos.findIndex((t) => t.id === todo.id);
  if (idx === -1) return [...todos, todo];
  const next = [...todos];
  next[idx] = { ...next[idx], ...todo };
  return next;
}

function removeFromList(todos: MeetingTodo[], id: string): MeetingTodo[] {
  return todos.filter((t) => t.id !== id);
}

export function patchTodoOnDashboard(client: QueryClient, todo: MeetingTodo): DashboardCacheSnapshot {
  let snapshot: DashboardView | undefined;
  client.setQueryData<DashboardView>(qk.dashboard, (prev) => {
    if (!prev) return prev;
    const apply = (list: MeetingTodo[]) =>
      todo.status === 'dismissed' ? removeFromList(list, todo.id) : upsertInList(list, todo);

    const dailyTodos = {
      overdue: apply(prev.dailyTodos.overdue),
      today: apply(prev.dailyTodos.today),
      suggested: apply(prev.dailyTodos.suggested),
      noDate: apply(prev.dailyTodos.noDate ?? []),
    };
    const openTodoCount = [...dailyTodos.overdue, ...dailyTodos.today].filter((t) => t.status === 'open').length;
    const suggestedTodoCount = dailyTodos.suggested.filter((t) => t.status === 'suggested').length;
    const next: DashboardView = {
      ...prev,
      dailyTodos,
      dueTodos: [...dailyTodos.overdue, ...dailyTodos.today],
      openTodoCount,
      suggestedTodoCount,
      attention: {
        ...prev.attention,
        overdueCount: dailyTodos.overdue.length,
        todayCount: dailyTodos.today.length,
      },
    };
    snapshot = next;
    return next;
  });
  return snapshot;
}

export function patchTodosOnDashboard(client: QueryClient, todos: MeetingTodo[]): void {
  for (const todo of todos) patchTodoOnDashboard(client, todo);
}

export function restoreDashboardSnapshot(client: QueryClient, snapshot: DashboardCacheSnapshot): void {
  if (snapshot) client.setQueryData(qk.dashboard, snapshot);
}
