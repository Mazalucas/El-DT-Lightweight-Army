import type { MeetingTodo } from '@shared/types.js';
import { filterDailyTodos as filterDailyTodosShared } from '@shared/filter-daily-todos.js';

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export { filterDailyTodosShared as filterDailyTodos };

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

export { meetingsInLastDays } from '@shared/filter-daily-todos.js';
