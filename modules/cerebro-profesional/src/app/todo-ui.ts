import type { MeetingTodo, Person, Project, Team } from '../core/models';
import { isManualTodo } from '../core/meeting-todos';
import { personInitials, avatarHue } from './contacts-view';
import { escapeHtml, formatDateShort } from './format';
import {
  iconCalendar,
  iconCheckCircle,
  iconCheckCircleFilled,
  iconChevronRight,
  iconPencil,
  iconPin,
  iconSquare,
  iconSquareChecked,
  iconTrash,
  iconUndo,
} from './todo-icons';

export type TodoStatusFilter = 'suggested' | 'open' | 'done' | 'dismissed' | 'all';
export type TodoSort = 'date-desc' | 'date-asc' | 'alpha';

export interface TodoUiHandlers {
  onTodoStatus: (id: string, status: MeetingTodo['status']) => void;
  onAcceptSuggestion?: (id: string) => void;
  onAcceptSuggestionEdit?: (id: string) => void;
  onOpenMeeting: (id: string) => void;
  onOpenPerson: (id: string) => void;
  onOpenTeam: (id: string) => void;
  onOpenProject: (id: string) => void;
}

function primaryTeamColor(todo: MeetingTodo, teams: Team[]): string {
  const t = teams.find((x) => todo.teamIds.includes(x.id));
  return t?.color ?? '#3b82f6';
}

function statusLabel(status: MeetingTodo['status']): string {
  if (status === 'done') return 'Hecho';
  if (status === 'dismissed') return 'Descartado';
  if (status === 'suggested') return 'Sugerencia';
  return 'Abierto';
}

export function sourceSectionLabel(section?: MeetingTodo['sourceSection']): string {
  if (section === 'proximos_pasos') return 'Próximo paso';
  if (section === 'sugerencias') return 'Sugerencia IA';
  if (section === 'analysis') return 'Análisis Cursor';
  return 'Reunión';
}

function refsHtml(
  todo: MeetingTodo,
  people: Person[],
  teams: Team[],
  projects: Project[],
): string {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const assigneeSet = new Set(todo.assigneePersonIds ?? []);
  const parts: string[] = [];

  for (const pid of todo.personIds) {
    const p = peopleById.get(pid);
    if (!p) continue;
    const hue = avatarHue(p.id);
    const isAssignee = assigneeSet.has(pid);
    parts.push(
      `<button type="button" class="todo-ref todo-ref--person${isAssignee ? ' todo-ref--assignee' : ''}" data-person-id="${escapeHtml(p.id)}" title="${isAssignee ? 'Asignado · ver contacto' : 'Participante · ver contacto'}">
        <span class="todo-ref-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(p.displayName))}</span>
        ${escapeHtml(p.displayName)}${isAssignee ? '<span class="todo-ref-tag">asignado</span>' : ''}
      </button>`,
    );
  }
  if (todo.personIds.length === 0 && todo.assigneeLabel) {
    parts.push(`<span class="todo-ref todo-ref--muted">${escapeHtml(todo.assigneeLabel)}</span>`);
  }
  for (const tid of todo.teamIds) {
    const t = teamsById.get(tid);
    if (t) {
      parts.push(
        `<button type="button" class="todo-ref todo-ref--team" data-team-id="${escapeHtml(t.id)}" style="--chip-color:${escapeHtml(t.color)}" title="Ver equipo">${escapeHtml(t.name)}</button>`,
      );
    }
  }
  for (const pid of todo.projectIds) {
    const p = projectsById.get(pid);
    if (p) {
      parts.push(
        `<button type="button" class="todo-ref todo-ref--project" data-project-id="${escapeHtml(p.id)}" title="Ver proyecto">${escapeHtml(p.name)}</button>`,
      );
    }
  }
  return parts.join('');
}

function renderToggleLead(todo: MeetingTodo, selectMode: boolean, selected: boolean): string {
  if (selectMode) {
    return `
      <button type="button" class="todo-lead-btn todo-lead-btn--select${selected ? ' todo-lead-btn--active' : ''}" data-todo-select-btn="${escapeHtml(todo.id)}" aria-pressed="${selected}" aria-label="${selected ? 'Quitar de la selección' : 'Seleccionar'}">
        ${selected ? iconSquareChecked : iconSquare}
      </button>`;
  }

  const done = todo.status === 'done';
  const dismissed = todo.status === 'dismissed';
  const label = done ? 'Marcar pendiente' : dismissed ? 'No disponible' : 'Marcar hecho';

  return `
    <button type="button" class="todo-lead-btn todo-lead-btn--toggle${done ? ' todo-lead-btn--done' : ''}" data-todo-toggle-btn="${escapeHtml(todo.id)}" aria-pressed="${done}" aria-label="${label}" ${dismissed ? 'disabled' : ''}>
      ${done ? iconCheckCircleFilled : iconCheckCircle}
    </button>`;
}

function renderSuggestedActions(todo: MeetingTodo, selectMode: boolean): string {
  if (selectMode) return '';
  return `
    <footer class="todo-card-actions" role="toolbar" aria-label="Acciones sugerencia">
      <button type="button" class="todo-action todo-action--primary" data-todo-accept="${escapeHtml(todo.id)}">
        Aceptar
      </button>
      <div class="todo-action-group" role="group" aria-label="Más acciones">
        <button type="button" class="todo-action todo-action--icon" data-todo-accept-edit="${escapeHtml(todo.id)}" aria-label="Editar y aceptar" title="Editar y aceptar">
          ${iconPencil}
        </button>
        <button type="button" class="todo-action todo-action--icon todo-action--danger" data-todo-dismiss="${escapeHtml(todo.id)}" aria-label="Descartar" title="Descartar">
          ${iconTrash}
        </button>
      </div>
    </footer>`;
}

function renderToolbar(todo: MeetingTodo, selectMode: boolean): string {
  if (selectMode || todo.status === 'suggested') return '';

  const editBtn = `<button type="button" class="todo-tool-btn" data-todo-edit="${escapeHtml(todo.id)}" aria-label="Editar to-do" title="Editar">${iconPencil}</button>`;

  const restoreBtn =
    todo.status === 'dismissed'
      ? `<button type="button" class="todo-tool-btn todo-tool-btn--accent" data-todo-restore="${escapeHtml(todo.id)}" aria-label="Restaurar to-do" title="Restaurar">${iconUndo}</button>`
      : '';

  const dismissBtn =
    todo.status !== 'dismissed'
      ? `<button type="button" class="todo-tool-btn todo-tool-btn--danger" data-todo-dismiss="${escapeHtml(todo.id)}" aria-label="Descartar to-do" title="Descartar">${iconTrash}</button>`
      : '';

  const row =
    todo.status === 'dismissed'
      ? `<div class="todo-card-toolbar-row">${restoreBtn}${editBtn}</div>`
      : `<div class="todo-card-toolbar-row">${editBtn}${dismissBtn}</div>`;

  return `<div class="todo-card-toolbar" role="toolbar" aria-label="Acciones">${row}</div>`;
}

export type TodoAsideMode = 'suggestions' | 'tasks';

/** Ítem compacto para panel lateral de la página Tareas. */
export function renderTodoAsideItem(todo: MeetingTodo, mode: TodoAsideMode): string {
  const text = todo.text.length > 140 ? `${todo.text.slice(0, 140)}…` : todo.text;
  const meetingMeta =
    todo.meetingTitle && todo.meetingId !== 'manual'
      ? `<span class="todos-aside-meta">${escapeHtml(formatDateShort(todo.meetingStartedAt))} · ${escapeHtml(todo.meetingTitle.length > 36 ? `${todo.meetingTitle.slice(0, 36)}…` : todo.meetingTitle)}</span>`
      : '';

  if (mode === 'suggestions') {
    const section = todo.sourceSection ?? 'sugerencias';
    return `
      <article class="todos-aside-item todos-aside-item--suggested" data-todo-id="${escapeHtml(todo.id)}">
        <div class="todos-aside-item-head">
          <span class="todo-source-badge todo-source-badge--${section}">${sourceSectionLabel(todo.sourceSection)}</span>
        </div>
        <p class="todos-aside-text">${escapeHtml(text)}</p>
        ${meetingMeta}
        <div class="todos-aside-actions">
          <button type="button" class="todo-action todo-action--primary todo-action--sm" data-todo-accept="${escapeHtml(todo.id)}">Aceptar</button>
          <button type="button" class="todo-action todo-action--icon todo-action--sm" data-todo-accept-edit="${escapeHtml(todo.id)}" aria-label="Editar y aceptar" title="Editar y aceptar">
            ${iconPencil}
          </button>
          <button type="button" class="todo-action todo-action--icon todo-action--sm todo-action--danger" data-todo-dismiss="${escapeHtml(todo.id)}" aria-label="Descartar" title="Descartar">
            ${iconTrash}
          </button>
        </div>
      </article>`;
  }

  return `
    <article class="todos-aside-item todos-aside-item--task" data-todo-id="${escapeHtml(todo.id)}">
      <p class="todos-aside-text">${escapeHtml(text)}</p>
      ${meetingMeta}
    </article>`;
}

/** Tarjeta compacta (dashboard). */
export function renderTodoCompact(
  todo: MeetingTodo,
  people: Person[],
  teams: Team[],
  projects: Project[],
): string {
  if (todo.status === 'dismissed') return '';
  const suggested = todo.status === 'suggested';
  const done = todo.status === 'done';
  const refs: string[] = [];
  if (todo.meetingId && todo.meetingTitle && todo.meetingId !== 'manual') {
    refs.push(
      `<button type="button" class="ref-chip ref-meeting" data-meeting-id="${escapeHtml(todo.meetingId)}" title="${escapeHtml(todo.meetingTitle)}">${iconCalendar}<span>${escapeHtml(formatDateShort(todo.meetingStartedAt))} · ${escapeHtml(todo.meetingTitle.length > 42 ? todo.meetingTitle.slice(0, 42) + '…' : todo.meetingTitle)}</span></button>`,
    );
  }
  const refsBlock = refsHtml(todo, people, teams, projects);

  if (suggested) {
    const section = todo.sourceSection ?? 'sugerencias';
    return `
    <li class="todo-item todo-item--suggested" data-todo-id="${escapeHtml(todo.id)}">
      <div class="todo-item-suggested-head">
        <span class="todo-source-badge todo-source-badge--${section}">${sourceSectionLabel(todo.sourceSection)}</span>
        <div class="todo-item-suggested-actions">
          <button type="button" class="todo-action todo-action--primary todo-action--sm" data-todo-accept="${escapeHtml(todo.id)}">Aceptar</button>
          <button type="button" class="todo-action todo-action--icon todo-action--sm todo-action--danger" data-todo-dismiss="${escapeHtml(todo.id)}" aria-label="Descartar">${iconTrash}</button>
        </div>
      </div>
      <p class="todo-text">${escapeHtml(todo.text)}</p>
      ${refs.length || refsBlock ? `<div class="todo-refs">${refs.join('')}${refsBlock}</div>` : ''}
    </li>`;
  }

  return `
    <li class="todo-item${done ? ' todo-item--done' : ''}" data-todo-id="${escapeHtml(todo.id)}">
      <div class="todo-item-row">
        <button type="button" class="todo-lead-btn todo-lead-btn--toggle todo-lead-btn--sm${done ? ' todo-lead-btn--done' : ''}" data-todo-toggle-btn="${escapeHtml(todo.id)}" aria-pressed="${done}" aria-label="${done ? 'Marcar pendiente' : 'Marcar hecho'}">
          ${done ? iconCheckCircleFilled : iconCheckCircle}
        </button>
        <p class="todo-text">${escapeHtml(todo.text)}</p>
        <button type="button" class="todo-tool-btn todo-tool-btn--sm todo-tool-btn--danger" data-todo-dismiss="${escapeHtml(todo.id)}" aria-label="Descartar" title="Descartar">${iconTrash}</button>
      </div>
      ${refs.length || refsBlock ? `<div class="todo-refs">${refs.join('')}${refsBlock}</div>` : ''}
    </li>`;
}

function renderMeetingContext(todo: MeetingTodo, isManual: boolean): string {
  if (!isManual && todo.meetingId && todo.meetingTitle && todo.meetingId !== 'manual') {
    return `<button type="button" class="todo-card-context todo-card-context--meeting" data-meeting-id="${escapeHtml(todo.meetingId)}" title="Abrir reunión">
      <span class="todo-card-context-icon">${iconCalendar}</span>
      <span class="todo-card-context-body">
        <span class="todo-card-context-label">Reunión</span>
        <strong>${escapeHtml(todo.meetingTitle)}</strong>
        <span class="todo-card-context-meta">${escapeHtml(formatDateShort(todo.meetingStartedAt))}</span>
      </span>
      <span class="todo-card-context-arrow">${iconChevronRight}</span>
    </button>`;
  }
  if (isManual) {
    return `<div class="todo-card-context todo-card-context--manual">
      <span class="todo-card-context-icon">${iconPin}</span>
      <span class="todo-card-context-body">
        <span class="todo-card-context-label">Creado manualmente</span>
        <span class="todo-card-context-meta">${escapeHtml(formatDateShort(todo.meetingStartedAt))}</span>
      </span>
    </div>`;
  }
  return '';
}

/** Tarjeta completa (página To-dos). */
export function renderTodoCard(
  todo: MeetingTodo,
  people: Person[],
  teams: Team[],
  projects: Project[],
  opts?: { selectMode?: boolean; selected?: boolean },
): string {
  const accent = primaryTeamColor(todo, teams);
  const isManual = isManualTodo(todo);
  const selectMode = opts?.selectMode ?? false;
  const selected = opts?.selected ?? false;
  const refs = refsHtml(todo, people, teams, projects);
  const contextRow = renderMeetingContext(todo, isManual);

  if (todo.status === 'suggested') {
    const section = todo.sourceSection ?? 'sugerencias';
    return `
    <article class="todo-card todo-card--suggested${selected ? ' todo-card--selected' : ''}${selectMode ? ' todo-card--select-mode' : ''}" data-todo-id="${escapeHtml(todo.id)}" data-todo-status="suggested" style="--todo-accent:var(--suggestion)">
      <div class="todo-card-accent" aria-hidden="true"></div>
      <div class="todo-card-inner">
        <header class="todo-card-meta">
          ${selectMode ? `<div class="todo-card-meta-select">${renderToggleLead(todo, true, selected)}</div>` : ''}
          <span class="todo-source-badge todo-source-badge--${section}">${sourceSectionLabel(todo.sourceSection)}</span>
        </header>
        <div class="todo-card-body">
          <p class="todo-card-text">${escapeHtml(todo.text)}</p>
          ${contextRow}
          ${refs ? `<div class="todo-card-refs">${refs}</div>` : ''}
        </div>
        ${renderSuggestedActions(todo, selectMode)}
      </div>
    </article>`;
  }

  const statusClass =
    todo.status === 'done'
      ? 'todo-card--done'
      : todo.status === 'dismissed'
        ? 'todo-card--dismissed'
        : 'todo-card--open';

  const statusPill =
    todo.status !== 'open'
      ? `<span class="todo-status-pill todo-status-pill--${todo.status}">${statusLabel(todo.status)}</span>`
      : '';

  return `
    <article class="todo-card ${statusClass}${selected ? ' todo-card--selected' : ''}${selectMode ? ' todo-card--select-mode' : ''}${isManual ? ' todo-card--manual' : ''}" data-todo-id="${escapeHtml(todo.id)}" data-todo-status="${todo.status}"${isManual ? ' data-todo-manual="true"' : ''} style="--todo-accent:${escapeHtml(accent)}">
      <div class="todo-card-accent" aria-hidden="true"></div>
      <div class="todo-card-lead">${renderToggleLead(todo, selectMode, selected)}</div>
      <div class="todo-card-body">
        <div class="todo-card-headline">
          <p class="todo-card-text">${escapeHtml(todo.text)}</p>
          ${statusPill ? `<div class="todo-card-pills">${statusPill}</div>` : ''}
        </div>
        ${contextRow}
        ${refs ? `<div class="todo-card-refs">${refs}</div>` : ''}
      </div>
      ${renderToolbar(todo, selectMode)}
    </article>`;
}

export function bindTodoUi(root: HTMLElement, handlers: TodoUiHandlers): void {
  root.querySelectorAll('[data-todo-toggle-btn]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = btn as HTMLButtonElement;
      if (el.disabled) return;
      const id = el.dataset.todoToggleBtn;
      if (!id) return;
      const pressed = el.getAttribute('aria-pressed') === 'true';
      handlers.onTodoStatus(id, pressed ? 'open' : 'done');
    });
  });

  root.querySelectorAll('[data-todo-accept]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoAccept;
      if (id) handlers.onAcceptSuggestion?.(id);
    });
  });

  root.querySelectorAll('[data-todo-accept-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoAcceptEdit;
      if (id) handlers.onAcceptSuggestionEdit?.(id);
    });
  });

  root.querySelectorAll('[data-todo-dismiss]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoDismiss;
      if (id) handlers.onTodoStatus(id, 'dismissed');
    });
  });

  root.querySelectorAll('[data-todo-restore]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoRestore;
      if (id) handlers.onTodoStatus(id, 'open');
    });
  });

  root.querySelectorAll('[data-meeting-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.meetingId;
      if (id && id !== 'manual') handlers.onOpenMeeting(id);
    });
  });

  root.querySelectorAll('[data-person-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.personId;
      if (id) handlers.onOpenPerson(id);
    });
  });

  root.querySelectorAll('[data-team-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.teamId;
      if (id) handlers.onOpenTeam(id);
    });
  });

  root.querySelectorAll('[data-project-id]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.projectId;
      if (id) handlers.onOpenProject(id);
    });
  });
}

/** Actualiza una tarjeta en el DOM sin re-render completo. */
export function patchTodoCardStatus(root: HTMLElement, id: string, status: MeetingTodo['status']): boolean {
  const card = root.querySelector(`[data-todo-id="${CSS.escape(id)}"]`);
  if (!card) return false;

  if (status === 'suggested' || card.classList.contains('todo-card--suggested')) {
    return false;
  }

  card.classList.remove('todo-card--open', 'todo-card--done', 'todo-card--dismissed');
  card.classList.add(status === 'open' ? 'todo-card--open' : `todo-card--${status}`);
  card.setAttribute('data-todo-status', status);

  const toggle = card.querySelector('[data-todo-toggle-btn]') as HTMLButtonElement | null;
  if (toggle) {
    const done = status === 'done';
    toggle.setAttribute('aria-pressed', String(done));
    toggle.classList.toggle('todo-lead-btn--done', done);
    toggle.disabled = status === 'dismissed';
    toggle.innerHTML = done ? iconCheckCircleFilled : iconCheckCircle;
    toggle.setAttribute('aria-label', done ? 'Marcar pendiente' : status === 'dismissed' ? 'No disponible' : 'Marcar hecho');
  }

  const pill = card.querySelector('.todo-status-pill');
  if (status === 'open') {
    pill?.remove();
  } else {
    const headline = card.querySelector('.todo-card-headline');
    if (headline && !pill) {
      headline.insertAdjacentHTML(
        'beforeend',
        `<span class="todo-status-pill todo-status-pill--${status}">${statusLabel(status)}</span>`,
      );
    } else if (pill) {
      pill.className = `todo-status-pill todo-status-pill--${status}`;
      pill.textContent = statusLabel(status);
    }
  }

  const text = card.querySelector('.todo-card-text');
  text?.classList.toggle('todo-card-text--struck', status === 'done');

  return true;
}

export function animateTodoCardExit(root: HTMLElement, id: string, onDone: () => void): void {
  const card = root.querySelector(`[data-todo-id="${CSS.escape(id)}"]`);
  if (!card) {
    onDone();
    return;
  }
  card.classList.add('todo-card--leaving');
  window.setTimeout(onDone, 280);
}

export function filterTodos(
  todos: MeetingTodo[],
  opts: {
    status: TodoStatusFilter;
    q: string;
    teamId: string;
    projectId: string;
    sort: TodoSort;
  },
): MeetingTodo[] {
  const needle = opts.q.trim().toLowerCase();
  let list = todos.filter((t) => {
    if (opts.status !== 'all' && t.status !== opts.status) return false;
    if (opts.teamId && !t.teamIds.includes(opts.teamId)) return false;
    if (opts.projectId && !t.projectIds.includes(opts.projectId)) return false;
    if (!needle) return true;
    const hay = [
      t.text,
      t.assigneeLabel,
      t.meetingTitle,
      t.meetingId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  });

  list = [...list].sort((a, b) => {
    if (opts.sort === 'alpha') return a.text.localeCompare(b.text, 'es');
    const da = a.meetingStartedAt ?? '';
    const db = b.meetingStartedAt ?? '';
    if (opts.sort === 'date-asc') return da.localeCompare(db);
    return db.localeCompare(da);
  });
  return list;
}
