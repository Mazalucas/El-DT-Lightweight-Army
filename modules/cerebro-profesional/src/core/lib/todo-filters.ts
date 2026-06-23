import type { MeetingTodo } from '../models';

export type ReminderView = 'all' | 'today' | 'overdue' | 'upcoming' | 'no-date';

function isToday(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function startOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function filterReminderTodos(
  todos: MeetingTodo[],
  view: ReminderView,
  now = new Date(),
): MeetingTodo[] {
  const open = todos.filter((t) => t.status === 'open' && t.dueAt);

  if (view === 'today') {
    return open.filter((t) => t.dueAt && isToday(t.dueAt, now));
  }
  if (view === 'overdue') {
    const start = startOfToday(now).getTime();
    return open.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < start);
  }
  if (view === 'upcoming') {
    const end = endOfToday(now).getTime();
    return open.filter((t) => t.dueAt && new Date(t.dueAt).getTime() > end);
  }
  if (view === 'no-date') {
    return todos.filter((t) => t.status === 'open' && !t.dueAt);
  }

  return open;
}

export function sortByDueAt(todos: MeetingTodo[]): MeetingTodo[] {
  return [...todos].sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    }
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
  });
}

export function collectTodoTags(todos: MeetingTodo[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of todos) {
    for (const tag of t.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatRelativeDueDate(iso: string | undefined): string {
  if (!iso) return 'Sin fecha';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (target.getTime() - today.getTime()) / 86400000;

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  if (diff < -1) return `Hace ${Math.abs(Math.round(diff))} días`;
  if (diff > 1 && diff < 7) return `En ${Math.round(diff)} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
