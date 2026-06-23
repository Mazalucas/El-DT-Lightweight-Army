import type { MeetingTodo, Person, Project, Team } from '../core/models';
import {
  collectTodoTags,
  filterReminderTodos,
  formatRelativeDueDate,
  sortByDueAt,
  type ReminderView,
} from '../core/lib/todo-filters';
import { escapeHtml } from './format';
import { bindTodoUi, renderTodoCard, type TodoUiHandlers } from './todo-ui';

const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  personal: { label: 'Personal', icon: '🏠', color: '#22c55e' },
  trabajo: { label: 'Trabajo', icon: '💼', color: '#3b82f6' },
};

export interface RemindersPageOpts {
  todos: MeetingTodo[];
  people: Person[];
  teams: Team[];
  projects: Project[];
  view: ReminderView;
  q: string;
  tag: string;
  quickAdd: string;
}

export interface RemindersPageHandlers extends TodoUiHandlers {
  onViewChange: (view: ReminderView) => void;
  onSearchChange: (q: string) => void;
  onTagFilter: (tag: string) => void;
  onQuickAdd: (raw: string) => void;
}

function tab(view: ReminderView, id: ReminderView, label: string, count: number, active: ReminderView): string {
  return `<button type="button" class="reminders-tab ${active === id ? 'reminders-tab--active' : ''}" data-reminders-view="${id}">${label}<span class="reminders-tab-count">${count}</span></button>`;
}

export function renderRemindersPage(opts: RemindersPageOpts): string {
  const openTodos = opts.todos.filter((t) => t.status === 'open');
  const todayCount = filterReminderTodos(openTodos, 'today').length;
  const overdueCount = filterReminderTodos(openTodos, 'overdue').length;
  const upcomingCount = filterReminderTodos(openTodos, 'upcoming').length;
  const allWithDate = filterReminderTodos(openTodos, 'all').length;

  let list = filterReminderTodos(openTodos, opts.view);
  const needle = opts.q.trim().toLowerCase();
  if (needle) {
    list = list.filter((t) => {
      const hay = [t.text, t.notes, ...(t.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }
  if (opts.tag) {
    const tag = opts.tag.toLowerCase();
    list = list.filter((t) => (t.tags ?? []).some((x) => x.toLowerCase() === tag));
  }
  list = sortByDueAt(list);

  const tagCloud = collectTodoTags(openTodos)
    .slice(0, 12)
    .map(
      ({ tag, count }) =>
        `<button type="button" class="reminders-tag ${opts.tag === tag ? 'reminders-tag--active' : ''}" data-reminders-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} <span>${count}</span></button>`,
    )
    .join('');

  const cards =
    list.length === 0
      ? `<div class="reminders-empty">
          <p class="reminders-empty-title">Sin recordatorios en esta vista</p>
          <p class="meta">Usá la captura rápida: <code>@trabajo #tag mañana revisar propuesta</code></p>
        </div>`
      : `<div class="reminders-list">${list
          .map((t) => {
            const cat = CATEGORIES[t.categoryId ?? 'personal'];
            const due = formatRelativeDueDate(t.dueAt);
            const card = renderTodoCard(t, opts.people, opts.teams, opts.projects);
            return `<div class="reminders-item" data-reminder-id="${escapeHtml(t.id)}">
              <div class="reminders-item-meta">
                <span class="reminders-due" style="--cat-color:${cat?.color ?? '#64748b'}">${due}</span>
                ${cat ? `<span class="reminders-cat">${cat.icon} ${escapeHtml(cat.label)}</span>` : ''}
              </div>
              ${card}
            </div>`;
          })
          .join('')}</div>`;

  return `
    <div class="reminders-page">
      <header class="reminders-hero">
        <div>
          <h2 class="reminders-title">Recordatorios</h2>
          <p class="reminders-subtitle">${allWithDate} con fecha · tareas y recordatorios unificados</p>
        </div>
      </header>

      <form class="reminders-quick-add" data-reminders-quick-form>
        <input type="text" name="quick" class="reminders-quick-input" placeholder="@trabajo #tag mañana ¿Qué recordar?" value="${escapeHtml(opts.quickAdd)}" autocomplete="off" />
        <button type="submit" class="btn-primary">Añadir</button>
      </form>

      <div class="reminders-tabs" role="tablist">
        ${tab('today', 'today', 'Hoy', todayCount, opts.view)}
        ${tab('overdue', 'overdue', 'Vencidos', overdueCount, opts.view)}
        ${tab('upcoming', 'upcoming', 'Próximos', upcomingCount, opts.view)}
        ${tab('all', 'all', 'Con fecha', allWithDate, opts.view)}
      </div>

      <div class="reminders-toolbar">
        <input type="search" class="reminders-search" id="reminders-search" placeholder="Buscar…" value="${escapeHtml(opts.q)}" autocomplete="off" />
        ${opts.tag ? `<button type="button" class="btn-ghost btn-sm" data-reminders-tag-clear>Limpiar tag</button>` : ''}
      </div>

      ${tagCloud ? `<div class="reminders-tags">${tagCloud}</div>` : ''}

      ${cards}
    </div>`;
}

export function bindRemindersPage(root: HTMLElement, handlers: RemindersPageHandlers): void {
  bindTodoUi(root, handlers);

  root.querySelectorAll('[data-reminders-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = (btn as HTMLElement).dataset.remindersView as ReminderView;
      handlers.onViewChange(view);
    });
  });

  root.querySelector('#reminders-search')?.addEventListener('input', (e) => {
    handlers.onSearchChange((e.target as HTMLInputElement).value);
  });

  root.querySelectorAll('[data-reminders-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onTagFilter((btn as HTMLElement).dataset.remindersTag ?? '');
    });
  });

  root.querySelector('[data-reminders-tag-clear]')?.addEventListener('click', () => {
    handlers.onTagFilter('');
  });

  root.querySelector('[data-reminders-quick-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector('[name="quick"]') as HTMLInputElement;
    if (input?.value.trim()) handlers.onQuickAdd(input.value.trim());
  });
}
