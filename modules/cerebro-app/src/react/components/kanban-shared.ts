import type { MeetingTodo } from '@shared/types.js';
import { sortTodosByRecency } from '@shared/recency-sort.js';

export const KANBAN_COLUMNS: Array<{ id: MeetingTodo['status']; title: string }> = [
  { id: 'suggested', title: 'Sugeridas' },
  { id: 'open', title: 'Por hacer' },
  { id: 'done', title: 'Hechas' },
];

export const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

export const STATUS_SECTIONS: Array<{ id: MeetingTodo['status']; title: string; defaultCollapsed?: boolean }> = [
  { id: 'suggested', title: 'Sugeridas' },
  { id: 'open', title: 'Por hacer' },
  { id: 'done', title: 'Hechas', defaultCollapsed: true },
];

export function sortKanbanTodos(todos: MeetingTodo[]): MeetingTodo[] {
  return sortTodosByRecency(todos);
}

export type TodoCardAction = 'accept' | 'dismiss' | 'complete' | 'reopen';

export function formatGroupCounts(counts: { suggested: number; open: number; done: number }): string {
  const parts: string[] = [];
  if (counts.suggested) parts.push(`${counts.suggested} sug`);
  if (counts.open) parts.push(`${counts.open} hacer`);
  if (counts.done) parts.push(`${counts.done} hechas`);
  return parts.length ? parts.join(' · ') : 'Sin tareas';
}
