import type { ApiStatus, CerebroStore, Meeting, MeetingTodo } from '@shared/types.js';
import type { ProfTab } from '../lib/router.js';
import {
  filterDailyTodos,
  formatDueHint,
  greetingForHour,
  meetingsInLastDays,
} from '../lib/todo-daily.js';
import { escapeHtml, formatDate } from '../lib/ui.js';
import { button } from '../ui/primitives.js';

export type ProfesionalDashboardHandlers = {
  onNavigate: (tab: ProfTab) => void;
  onMeeting: (meetingId: string) => void;
  onTodoDone?: (todo: MeetingTodo) => void | Promise<void>;
  onTodoAccept: (todo: MeetingTodo) => void | Promise<void>;
  onTodoDismiss: (todo: MeetingTodo) => void | Promise<void>;
};

export type ProfesionalDashboardInput = {
  store: CerebroStore;
  status: ApiStatus;
  handlers: ProfesionalDashboardHandlers;
};

function countByStatus(todos: MeetingTodo[], status: MeetingTodo['status']): number {
  return todos.filter((t) => t.status === status).length;
}

function renderTodoLi(
  t: MeetingTodo,
  opts: {
    handlers: ProfesionalDashboardHandlers;
    showDue?: boolean;
    overdue?: boolean;
    compactActions?: boolean;
  },
): HTMLLIElement {
  const li = document.createElement('li');
  li.className = `todo-item${t.status === 'suggested' ? ' todo-item--suggested' : ''}${opts.overdue ? ' todo-item--overdue' : ''}`;

  if (t.status === 'open' && opts.handlers.onTodoDone) {
    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'todo-check';
    check.setAttribute('aria-label', 'Marcar hecho');
    check.addEventListener('click', () => void opts.handlers.onTodoDone?.(t));
    li.appendChild(check);
  }

  const body = document.createElement('div');
  body.className = 'dash-todo-body';
  const dueHint = opts.showDue && t.dueAt ? formatDueHint(t.dueAt) : '';
  body.innerHTML = `
    <span class="dash-todo-text">${escapeHtml(t.text)}</span>
    ${t.meetingTitle ? `<span class="muted dash-todo-meta">${escapeHtml(t.meetingTitle)}</span>` : ''}
    ${dueHint ? `<span class="dash-todo-due${opts.overdue ? ' dash-todo-due--overdue' : ''}">${escapeHtml(dueHint)}</span>` : ''}
  `;
  li.appendChild(body);

  if (t.status === 'suggested') {
    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    actions.append(
      button('Aceptar', {
        variant: 'secondary',
        size: 'sm',
        onClick: () => void opts.handlers.onTodoAccept(t),
      }),
      button('Descartar', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => void opts.handlers.onTodoDismiss(t),
      }),
    );
    li.appendChild(actions);
  }

  return li;
}

function renderMeetingLi(m: Meeting, onMeeting: (id: string) => void): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'dash-meeting';
  const statusIcon =
    m.analysisStatus === 'analyzed' ? '✓' : m.analysisStatus === 'needs_review' ? '?' : '○';
  li.innerHTML = `
    <div class="dash-meeting-head">
      <span class="dash-meeting-status" title="${escapeHtml(m.analysisStatus)}">${statusIcon}</span>
      <strong>${escapeHtml(m.title)}</strong>
    </div>
    <span class="muted">${formatDate(m.startedAt)}</span>
    ${m.summary ? `<p class="dash-meeting-summary">${escapeHtml(m.summary.slice(0, 120))}${m.summary.length > 120 ? '…' : ''}</p>` : ''}
  `;
  li.style.cursor = 'pointer';
  li.addEventListener('click', () => onMeeting(m.id));
  return li;
}

function appendList(
  ul: HTMLUListElement,
  items: MeetingTodo[],
  emptyText: string,
  opts: Parameters<typeof renderTodoLi>[1],
): void {
  ul.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'dash-empty muted';
    li.textContent = emptyText;
    ul.appendChild(li);
    return;
  }
  items.forEach((t) => ul.appendChild(renderTodoLi(t, opts)));
}

export function renderProfesionalDashboard(host: HTMLElement, input: ProfesionalDashboardInput): void {
  const { store, status, handlers } = input;
  const suggestedCount = countByStatus(store.todos, 'suggested');
  const openCount = countByStatus(store.todos, 'open');
  const analyzedCount = store.meetings.filter((m) => m.analysisStatus === 'analyzed').length;
  const needsReview = store.meetings.filter((m) => m.analysisStatus === 'needs_review').length;
  const weekMeetings = meetingsInLastDays(store.meetings, 7);
  const daily = filterDailyTodos(store.todos);
  const dailyFocus = [...daily.overdue, ...daily.today].slice(0, 10);
  const suggested = store.todos.filter((t) => t.status === 'suggested').slice(0, 6);
  const recentMeetings = [...store.meetings]
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .slice(0, 6);

  const syncLabel = status.syncSchedule?.lastRunAt
    ? formatDate(status.syncSchedule.lastRunAt)
    : status.hasGoogleIntegration
      ? 'Listo para sync'
      : 'Sin Google';

  const root = document.createElement('div');
  root.className = 'prof-dashboard';

  root.innerHTML = `
    <header class="dash-hero">
      <div>
        <p class="dash-greeting">${greetingForHour()}</p>
        <h2 class="dash-title">Tablero profesional</h2>
        <p class="dash-subtitle">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div class="dash-sync-card">
        <span class="dash-sync-label">Última sincronización</span>
        <strong>${escapeHtml(syncLabel)}</strong>
        <span class="muted">${status.syncRunning ? 'Sync en curso…' : status.syncSchedule?.lastRunSummary ?? ''}</span>
      </div>
    </header>

    <div class="kpi-grid">
      <article class="kpi-card">
        <span class="kpi-value">${store.meetings.length}</span>
        <span class="kpi-label">Reuniones</span>
        <button type="button" class="kpi-link" data-nav="reuniones">${weekMeetings} esta semana →</button>
      </article>
      <article class="kpi-card kpi-card--accent">
        <span class="kpi-value">${suggestedCount}</span>
        <span class="kpi-label">Sugerencias</span>
        <button type="button" class="kpi-link" data-nav="tablero">Ir al tablero →</button>
      </article>
      <article class="kpi-card">
        <span class="kpi-value">${openCount}</span>
        <span class="kpi-label">Tareas abiertas</span>
        <button type="button" class="kpi-link" data-nav="tablero">Ver tablero →</button>
      </article>
      <article class="kpi-card">
        <span class="kpi-value">${store.people.length}</span>
        <span class="kpi-label">Contactos</span>
        <button type="button" class="kpi-link" data-nav="contactos">Ver contactos →</button>
      </article>
      <article class="kpi-card">
        <span class="kpi-value">${analyzedCount}<span class="kpi-muted">/${store.meetings.length}</span></span>
        <span class="kpi-label">Analizadas</span>
        ${needsReview ? `<button type="button" class="kpi-link" data-nav="tablero">${needsReview} por revisar →</button>` : '<span class="kpi-muted">Al día</span>'}
      </article>
      <article class="kpi-card">
        <span class="kpi-value">${daily.today.length + daily.overdue.length}</span>
        <span class="kpi-label">Para hoy</span>
        <span class="kpi-muted">${daily.overdue.length ? `${daily.overdue.length} vencidas` : 'Sin vencidas'}</span>
      </article>
    </div>

    <div class="dash-grid">
      <section class="dash-panel dash-panel--today">
        <div class="dash-panel-head">
          <h3>Para hoy</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-nav="tablero">${dailyFocus.length} en foco →</button>
        </div>
        <ul class="todo-list" id="dash-today"></ul>
        <div class="dash-panel-subhead">
          <span class="muted">Sin fecha (${daily.noDate.length})</span>
        </div>
        <ul class="todo-list todo-list--muted" id="dash-nodate"></ul>
      </section>

      <section class="dash-panel dash-panel--suggestions">
        <div class="dash-panel-head">
          <h3>Sugerencias de reuniones</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-nav="tablero">${suggestedCount} pendientes →</button>
        </div>
        <ul class="todo-list" id="dash-suggestions"></ul>
      </section>

      <section class="dash-panel dash-panel--meetings dash-panel--wide">
        <div class="dash-panel-head">
          <h3>Reuniones recientes</h3>
          <button type="button" class="btn btn-ghost btn-sm" data-nav="reuniones">Ver agenda →</button>
        </div>
        <ul class="dash-meeting-list" id="dash-meetings"></ul>
      </section>
    </div>
  `;

  host.replaceChildren(root);

  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      const tab = (el as HTMLElement).dataset.nav as ProfTab | undefined;
      if (tab) handlers.onNavigate(tab);
    });
  });

  const todoOpts = { handlers, showDue: true };
  appendList(
    root.querySelector('#dash-today')!,
    dailyFocus,
    'Nada urgente para hoy — revisá sugerencias o abrí tareas abiertas.',
    todoOpts,
  );
  dailyFocus.forEach((t, i) => {
    const li = root.querySelectorAll('#dash-today .todo-item')[i];
    if (li && t.dueAt && daily.overdue.includes(t)) {
      li.classList.add('todo-item--overdue');
    }
  });

  appendList(
    root.querySelector('#dash-nodate')!,
    daily.noDate.slice(0, 4),
    'Sin tareas abiertas sin fecha.',
    { handlers, showDue: false },
  );

  appendList(
    root.querySelector('#dash-suggestions')!,
    suggested,
    'Sin sugerencias — sincronizá reuniones para extraer próximos pasos.',
    todoOpts,
  );

  const meetList = root.querySelector('#dash-meetings')!;
  meetList.replaceChildren();
  if (!recentMeetings.length) {
    const li = document.createElement('li');
    li.className = 'dash-empty muted';
    li.textContent = 'Sin reuniones indexadas — conectá Google y sincronizá.';
    meetList.appendChild(li);
  } else {
    recentMeetings.forEach((m) => meetList.appendChild(renderMeetingLi(m, handlers.onMeeting)));
  }
}
