import type { MeetingTodo } from '@shared/types.js';

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function filterDailyTodos(todos: MeetingTodo[], now = new Date()): {
  today: MeetingTodo[];
  overdue: MeetingTodo[];
  noDate: MeetingTodo[];
} {
  const open = todos.filter((t) => t.status === 'open');
  const todayStart = startOfDay(now).getTime();

  const today: MeetingTodo[] = [];
  const overdue: MeetingTodo[] = [];
  const noDate: MeetingTodo[] = [];

  for (const t of open) {
    if (!t.dueAt) {
      noDate.push(t);
      continue;
    }
    const due = new Date(t.dueAt);
    if (due.getTime() < todayStart) {
      overdue.push(t);
    } else if (isSameCalendarDay(due, now)) {
      today.push(t);
    }
  }

  const byDue = (a: MeetingTodo, b: MeetingTodo) =>
    (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0);

  return {
    today: today.sort(byDue),
    overdue: overdue.sort(byDue),
    noDate: noDate.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')),
  };
}

export function formatDueHint(iso?: string): string {
  if (!iso) return '';
  const due = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const target = startOfDay(due);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays < 0) return `Vencida · ${due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  return due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function greetingForHour(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function meetingsInLastDays(meetings: { startedAt?: string }[], days: number, now = new Date()): number {
  const cutoff = now.getTime() - days * 86400000;
  return meetings.filter((m) => m.startedAt && new Date(m.startedAt).getTime() >= cutoff).length;
}
