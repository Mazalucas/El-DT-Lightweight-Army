import type { Category } from '../core/models/category';
import type { Reminder } from '../core/models/reminder';

export function formatRelativeDate(iso: string | undefined): string {
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

export function categoryStyle(cat: Category | undefined): string {
  return cat ? `--cat-color: ${cat.color}` : '--cat-color: #64748b';
}

export function renderTagPills(tags: string[], onTagClick?: (tag: string) => void): string {
  return tags
    .map(
      (t) =>
        `<button type="button" class="tag-pill" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`,
    )
    .join('');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

export function renderReminderRow(
  reminder: Reminder,
  category: Category | undefined,
): string {
  const done = reminder.status === 'done';
  return `
    <article class="reminder-row ${done ? 'is-done' : ''}" data-id="${reminder.id}" style="${categoryStyle(category)}">
      <div class="reminder-accent"></div>
      <label class="reminder-check">
        <input type="checkbox" ${done ? 'checked' : ''} aria-label="Marcar hecho" />
      </label>
      <div class="reminder-body">
        <div class="reminder-title">${escapeHtml(reminder.title)}</div>
        <div class="reminder-meta">
          <span class="reminder-cat">${category ? `${category.icon} ${escapeHtml(category.label)}` : ''}</span>
          <span class="reminder-date">${formatRelativeDate(reminder.dueAt)}</span>
        </div>
        ${reminder.tags.length ? `<div class="reminder-tags">${renderTagPills(reminder.tags)}</div>` : ''}
      </div>
    </article>
  `;
}
