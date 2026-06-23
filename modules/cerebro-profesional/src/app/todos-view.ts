import type { Meeting, MeetingTodo, Person, Project, Team } from '../core/models';
import { MANUAL_TODO_MEETING_ID } from '../core/meeting-todos';
import { escapeHtml, formatDateShort } from './format';
import {
  bindTodoUi,
  filterTodos,
  renderTodoAsideItem,
  renderTodoCard,
  type TodoAsideMode,
  type TodoSort,
  type TodoStatusFilter,
  type TodoUiHandlers,
} from './todo-ui';
import { iconSquare, iconSquareChecked } from './todo-icons';

const PAGE_SIZE = 40;
const ASIDE_LIMIT = 24;

function filterAsideTodos(
  todos: MeetingTodo[],
  status: MeetingTodo['status'],
  opts: Pick<TodosPageOpts, 'teamId' | 'projectId' | 'sort'>,
): MeetingTodo[] {
  let list = todos.filter((t) => t.status === status);
  if (opts.teamId) list = list.filter((t) => t.teamIds.includes(opts.teamId));
  if (opts.projectId) list = list.filter((t) => t.projectIds.includes(opts.projectId));
  list = [...list].sort((a, b) => {
    if (opts.sort === 'alpha') return a.text.localeCompare(b.text, 'es');
    const da = a.meetingStartedAt ?? '';
    const db = b.meetingStartedAt ?? '';
    if (opts.sort === 'date-asc') return da.localeCompare(db);
    return db.localeCompare(da);
  });
  return list.slice(0, ASIDE_LIMIT);
}

function renderTodosAside(opts: TodosPageOpts, mode: TodoAsideMode): string {
  const isSuggestions = mode === 'suggestions';
  const items = filterAsideTodos(
    opts.todos,
    isSuggestions ? 'suggested' : 'open',
    opts,
  );
  const total = opts.todos.filter((t) => t.status === (isSuggestions ? 'suggested' : 'open')).length;

  const listHtml =
    items.length === 0
      ? `<p class="todos-aside-empty">${isSuggestions ? 'No hay sugerencias pendientes.' : 'Aún no hay tareas confirmadas.'}</p>`
      : `<div class="todos-aside-list">${items.map((t) => renderTodoAsideItem(t, mode)).join('')}</div>`;

  const switchTab = isSuggestions ? 'suggested' : 'open';
  const switchLabel = isSuggestions ? 'Ver en Sugerencias' : 'Ver en Tareas';

  return `
    <aside class="todos-page-aside" aria-label="${isSuggestions ? 'Sugerencias pendientes' : 'Tareas confirmadas'}">
      <div class="todos-aside-panel">
        <header class="todos-aside-head">
          <div>
            <h3 class="todos-aside-title">${isSuggestions ? 'Por incorporar' : 'Tareas confirmadas'}</h3>
            <p class="todos-aside-subtitle meta">${items.length} de ${total}${total > ASIDE_LIMIT ? ` · primeras ${ASIDE_LIMIT}` : ''}</p>
          </div>
          <button type="button" class="todos-aside-tab-link" data-todos-status="${switchTab}">${switchLabel}</button>
        </header>
        ${listHtml}
      </div>
    </aside>`;
}

export interface TodosPageOpts {
  todos: MeetingTodo[];
  meetings: Meeting[];
  people: Person[];
  teams: Team[];
  projects: Project[];
  status: TodoStatusFilter;
  q: string;
  teamId: string;
  projectId: string;
  sort: TodoSort;
  page: number;
  selectMode: boolean;
  selectedIds: string[];
  createOpen: boolean;
  editingId: string | null;
  acceptingId: string | null;
}

export type TodoFormInput = {
  text: string;
  meetingId: string;
  teamId: string;
  projectId: string;
  personId: string;
  dueAt?: string;
  tags?: string;
  notes?: string;
  categoryId?: string;
};

export interface TodosPageHandlers extends TodoUiHandlers {
  onAcceptSuggestion?: (id: string) => void;
  onAcceptSuggestionEdit?: (id: string) => void;
  onAcceptSuggestionsBulk?: (ids: string[]) => void;
  onDismissAllSuggestions?: () => void;
  onFilterChange: (
    patch: Partial<{
      status: TodoStatusFilter;
      q: string;
      teamId: string;
      projectId: string;
      sort: TodoSort;
      page: number;
      selectMode: boolean;
      selectedIds: string[];
      createOpen: boolean;
      editingId: string | null;
      acceptingId: string | null;
    }>,
    opts?: { patchOnly?: boolean },
  ) => void;
  onBulkStatus: (ids: string[], status: MeetingTodo['status']) => void;
  onCreateTodo: (input: TodoFormInput) => void;
  onUpdateTodo: (id: string, input: TodoFormInput) => void;
  onAcceptTodo?: (id: string, input: TodoFormInput) => void;
}

function todoFormValuesFromTodo(todo: MeetingTodo): TodoFormInput {
  return {
    text: todo.text,
    meetingId: todo.meetingId === MANUAL_TODO_MEETING_ID ? '' : todo.meetingId,
    teamId: todo.teamIds[0] ?? '',
    projectId: todo.projectIds[0] ?? '',
    personId: todo.personIds[0] ?? '',
    dueAt: todo.dueAt ? todo.dueAt.slice(0, 16) : '',
    tags: (todo.tags ?? []).join(' '),
    notes: todo.notes ?? '',
    categoryId: todo.categoryId ?? '',
  };
}

function renderTodoFormFields(
  opts: TodosPageOpts,
  meetings: Meeting[],
  people: Person[],
  values: TodoFormInput,
): string {
  const sortedMeetings = meetings
    .slice()
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
  const topMeetings = sortedMeetings.slice(0, 40);
  const linked =
    values.meetingId && !topMeetings.some((m) => m.id === values.meetingId)
      ? sortedMeetings.find((m) => m.id === values.meetingId)
      : undefined;
  const meetingList = linked ? [linked, ...topMeetings] : topMeetings;

  const meetingOpts = [
    `<option value=""${!values.meetingId ? ' selected' : ''}>Sin reunión (manual)</option>`,
    ...meetingList.map((m) => {
      const sel = values.meetingId === m.id ? ' selected' : '';
      return `<option value="${escapeHtml(m.id)}"${sel}>${escapeHtml(formatDateShort(m.startedAt))} · ${escapeHtml(m.title.length > 50 ? m.title.slice(0, 50) + '…' : m.title)}</option>`;
    }),
  ].join('');

  const teamOpts = [
    `<option value="">— Equipo —</option>`,
    ...opts.teams.map(
      (t) =>
        `<option value="${escapeHtml(t.id)}"${values.teamId === t.id ? ' selected' : ''}>${escapeHtml(t.name)}</option>`,
    ),
  ].join('');

  const projectOpts = [
    `<option value="">— Proyecto —</option>`,
    ...opts.projects.map(
      (p) =>
        `<option value="${escapeHtml(p.id)}"${values.projectId === p.id ? ' selected' : ''}>${escapeHtml(p.name)}</option>`,
    ),
  ].join('');

  const personOpts = [
    `<option value="">— Asignado —</option>`,
    ...people
      .filter((p) => (p.emails?.length ?? 0) > 0)
      .slice(0, 80)
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}"${values.personId === p.id ? ' selected' : ''}>${escapeHtml(p.displayName)}</option>`,
      ),
  ].join('');

  const categoryOpts = [
    `<option value="">— Categoría —</option>`,
    `<option value="personal"${values.categoryId === 'personal' ? ' selected' : ''}>Personal</option>`,
    `<option value="trabajo"${values.categoryId === 'trabajo' ? ' selected' : ''}>Trabajo</option>`,
  ].join('');

  return `
      <textarea name="text" class="todos-create-text" rows="3" placeholder="¿Qué hay que hacer?" required minlength="3">${escapeHtml(values.text)}</textarea>
      <div class="todos-create-row">
        <input type="datetime-local" name="dueAt" class="todos-create-input" aria-label="Fecha recordatorio" value="${escapeHtml(values.dueAt ?? '')}" placeholder="Fecha (opcional)" />
        <input type="text" name="tags" class="todos-create-input" aria-label="Tags" value="${escapeHtml(values.tags ?? '')}" placeholder="#tags separados por espacio" />
      </div>
      <div class="todos-create-row">
        <select name="meetingId" class="todos-create-select" aria-label="Reunión vinculada">${meetingOpts}</select>
        <select name="teamId" class="todos-create-select" aria-label="Equipo">${teamOpts}</select>
      </div>
      <div class="todos-create-row">
        <select name="projectId" class="todos-create-select" aria-label="Proyecto">${projectOpts}</select>
        <select name="personId" class="todos-create-select" aria-label="Asignado">${personOpts}</select>
      </div>
      <div class="todos-create-row">
        <select name="categoryId" class="todos-create-select" aria-label="Categoría">${categoryOpts}</select>
        <input type="text" name="notes" class="todos-create-input" aria-label="Notas" value="${escapeHtml(values.notes ?? '')}" placeholder="Notas (opcional)" />
      </div>`;
}

function renderTodoEditCard(todo: MeetingTodo, opts: TodosPageOpts, mode: 'edit' | 'accept' = 'edit'): string {
  const values = todoFormValuesFromTodo(todo);
  const isAccept = mode === 'accept';
  return `
    <article class="todo-card todo-card--editing ${isAccept ? 'todo-card--suggested' : 'todo-card--open'}" data-todo-id="${escapeHtml(todo.id)}">
      <form class="todos-create-panel todos-edit-panel" data-todos-${isAccept ? 'accept' : 'edit'}-form data-todo-edit-id="${escapeHtml(todo.id)}">
        <div class="todos-create-head">
          <strong>${isAccept ? 'Editar y aceptar sugerencia' : 'Editar to-do'}</strong>
          <button type="button" class="todo-card-action todo-card-action--muted" data-todos-edit-cancel>Cancelar</button>
        </div>
        ${renderTodoFormFields(opts, opts.meetings, opts.people, values)}
        <div class="todos-create-actions">
          <button type="submit" class="btn-primary">${isAccept ? 'Aceptar' : 'Guardar cambios'}</button>
        </div>
      </form>
    </article>`;
}

function renderCreatePanel(opts: TodosPageOpts): string {
  if (!opts.createOpen) {
    return `<button type="button" class="btn-primary todos-new-btn" data-todos-create-open>+ Nuevo to-do</button>`;
  }

  const emptyValues: TodoFormInput = {
    text: '',
    meetingId: '',
    teamId: '',
    projectId: '',
    personId: '',
  };

  return `
    <form class="todos-create-panel" data-todos-create-form>
      <div class="todos-create-head">
        <strong>Nuevo to-do</strong>
        <button type="button" class="todo-card-action todo-card-action--muted" data-todos-create-close>Cerrar</button>
      </div>
      ${renderTodoFormFields(opts, opts.meetings, opts.people, emptyValues)}
      <div class="todos-create-actions">
        <button type="submit" class="btn-primary">Crear to-do</button>
      </div>
    </form>`;
}

function renderBulkBar(selectedCount: number, status: TodoStatusFilter): string {
  if (selectedCount === 0) return '';
  const suggestedActions =
    status === 'suggested'
      ? `<button type="button" class="todos-bulk-btn todos-bulk-btn--accept" data-todos-bulk-accept title="Aceptar seleccionados">✓ Aceptar</button>
         <button type="button" class="todos-bulk-btn todos-bulk-btn--danger" data-todos-bulk="dismissed" title="Descartar">🗑 Descartar</button>`
      : `<button type="button" class="todos-bulk-btn" data-todos-bulk="done" title="Marcar hechos">✓ Hecho</button>
         <button type="button" class="todos-bulk-btn" data-todos-bulk="open" title="Reabrir">↩ Reabrir</button>
         <button type="button" class="todos-bulk-btn todos-bulk-btn--danger" data-todos-bulk="dismissed" title="Descartar">🗑 Descartar</button>`;
  return `
    <div class="todos-bulk-bar" role="toolbar" aria-label="Acciones en lote">
      <span class="todos-bulk-count"><strong>${selectedCount}</strong> seleccionados</span>
      ${suggestedActions}
      <button type="button" class="todos-bulk-clear" data-todos-clear-selection>Limpiar</button>
    </div>`;
}

/** Actualiza selección y barra flotante sin re-render completo. */
export function patchTodosSelectionUi(
  root: HTMLElement,
  selectedIds: string[],
  status: TodoStatusFilter = 'open',
): void {
  root.querySelectorAll('.todo-card[data-todo-id]').forEach((card) => {
    const id = (card as HTMLElement).dataset.todoId;
    if (!id) return;
    const selected = selectedIds.includes(id);
    card.classList.toggle('todo-card--selected', selected);

    const btn = card.querySelector('[data-todo-select-btn]') as HTMLButtonElement | null;
    if (btn) {
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('todo-lead-btn--active', selected);
      btn.innerHTML = selected ? iconSquareChecked : iconSquare;
    }
  });

  const page = root.querySelector('.todos-page');
  if (!page) return;

  const existing = page.querySelector('.todos-bulk-bar');
  if (selectedIds.length === 0) {
    existing?.remove();
    return;
  }

  const html = renderBulkBar(selectedIds.length, status);
  if (existing) {
    existing.outerHTML = html;
  } else {
    page.insertAdjacentHTML('beforeend', html);
  }
}

export function renderTodosPage(opts: TodosPageOpts): string {
  const filtered = filterTodos(opts.todos, {
    status: opts.status,
    q: opts.q,
    teamId: opts.teamId,
    projectId: opts.projectId,
    sort: opts.sort,
  });

  const suggestedCount = opts.todos.filter((t) => t.status === 'suggested').length;
  const openCount = opts.todos.filter((t) => t.status === 'open').length;
  const doneCount = opts.todos.filter((t) => t.status === 'done').length;
  const dismissedCount = opts.todos.filter((t) => t.status === 'dismissed').length;
  const manualCount = opts.todos.filter((t) => t.source === 'manual').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(opts.page, totalPages);
  const slice = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = slice.length < filtered.length;
  const visibleIds = slice.map((t) => t.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => opts.selectedIds.includes(id));

  const teamChips = opts.teams
    .map(
      (t) =>
        `<button type="button" class="todos-chip ${opts.teamId === t.id ? 'todos-chip--active' : ''}" data-todos-team="${escapeHtml(t.id)}" style="--chip-color:${escapeHtml(t.color)}">${escapeHtml(t.name)}</button>`,
    )
    .join('');

  const projectChips = opts.projects
    .slice(0, 12)
    .map(
      (p) =>
        `<button type="button" class="todos-chip todos-chip--project ${opts.projectId === p.id ? 'todos-chip--active' : ''}" data-todos-project="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`,
    )
    .join('');

  const cards =
    slice.length === 0
      ? `<div class="todos-empty">
          <div class="todos-empty-icon">${opts.status === 'suggested' ? '💡' : '☐'}</div>
          <p class="todos-empty-title">${opts.status === 'suggested' ? 'Sin sugerencias pendientes' : 'Sin to-dos en esta vista'}</p>
          <p class="meta">${opts.status === 'suggested' ? 'Las nuevas sugerencias de reuniones aparecerán aquí tras sincronizar.' : 'Creá uno con «+ Nuevo to-do» o sincronizá reuniones.'}</p>
        </div>`
      : `<div class="todos-grid">${slice
          .map((t) => {
            if (opts.acceptingId === t.id) return renderTodoEditCard(t, opts, 'accept');
            if (opts.editingId === t.id) return renderTodoEditCard(t, opts, 'edit');
            return renderTodoCard(t, opts.people, opts.teams, opts.projects, {
              selectMode: opts.selectMode,
              selected: opts.selectedIds.includes(t.id),
            });
          })
          .join('')}</div>`;

  const tab = (id: TodoStatusFilter, label: string, count: number) =>
    `<button type="button" class="todos-tab ${opts.status === id ? 'todos-tab--active' : ''}${id === 'suggested' && count > 0 ? ' todos-tab--suggestions' : ''}" data-todos-status="${id}">${label}<span class="todos-tab-count">${count}</span></button>`;

  const showAside = opts.status === 'open' || opts.status === 'suggested';
  const asideMode: TodoAsideMode = opts.status === 'open' ? 'suggestions' : 'tasks';
  const asideHtml = showAside ? renderTodosAside(opts, asideMode) : '';

  return `
    <div class="todos-page${opts.selectMode ? ' todos-page--select-mode' : ''}${showAside ? ' todos-page--with-aside' : ''}">
      <header class="todos-hero">
        <div>
          <h2 class="todos-title">Tareas</h2>
          <p class="todos-subtitle">${opts.todos.length} en total · ${suggestedCount} sugerencias · ${openCount} tareas · ${manualCount} manuales</p>
          <p class="todos-hint">${opts.status === 'suggested' ? '✓ aceptar · ✏️ editar y aceptar · 🗑 descartar' : '✏️ editar · 🗑 descartar — doble clic para editar'}</p>
        </div>
        <div class="todos-hero-actions">
          ${renderCreatePanel(opts)}
        </div>
      </header>

      <div class="todos-tabs-row">
        <div class="todos-tabs" role="tablist">
          ${tab('suggested', 'Sugerencias', suggestedCount)}
          ${tab('open', 'Tareas', openCount)}
          ${tab('done', 'Hechos', doneCount)}
          ${tab('dismissed', 'Descartados', dismissedCount)}
          ${tab('all', 'Todos', opts.todos.length)}
        </div>
        ${
          opts.status === 'suggested' && suggestedCount > 0
            ? `<button type="button" class="todos-dismiss-all-btn" data-todos-dismiss-all title="Descartar todas las sugerencias pendientes">
                Descartar todas (${suggestedCount})
              </button>`
            : ''
        }
      </div>

      <div class="todos-toolbar">
        <input type="search" class="todos-search" id="todos-search" placeholder="Buscar en to-dos, reuniones, asignados…" value="${escapeHtml(opts.q)}" autocomplete="off" />
        <select class="todos-sort" id="todos-sort" aria-label="Ordenar">
          <option value="date-desc" ${opts.sort === 'date-desc' ? 'selected' : ''}>Fecha · reciente primero (Z→A)</option>
          <option value="date-asc" ${opts.sort === 'date-asc' ? 'selected' : ''}>Fecha · antigua primero (A→Z)</option>
          <option value="alpha" ${opts.sort === 'alpha' ? 'selected' : ''}>Texto A–Z</option>
        </select>
        <button type="button" class="btn-ghost todos-select-toggle ${opts.selectMode ? 'todos-select-toggle--active' : ''}" data-todos-select-mode>
          ${opts.selectMode ? '✓ Selección' : 'Seleccionar'}
        </button>
        ${
          opts.selectMode
            ? `<button type="button" class="btn-ghost btn-sm" data-todos-select-all>${allVisibleSelected ? 'Deseleccionar vista' : 'Seleccionar vista'}</button>`
            : ''
        }
      </div>

      <div class="todos-filters">
        <span class="todos-filters-label">Equipo</span>
        <button type="button" class="todos-chip ${!opts.teamId ? 'todos-chip--active' : ''}" data-todos-team="">Todos</button>
        ${teamChips}
      </div>
      ${
        projectChips
          ? `<div class="todos-filters todos-filters--projects">
        <span class="todos-filters-label">Proyecto</span>
        <button type="button" class="todos-chip todos-chip--project ${!opts.projectId ? 'todos-chip--active' : ''}" data-todos-project="">Todos</button>
        ${projectChips}
      </div>`
          : ''
      }

      <div class="todos-page-body${showAside ? '' : ' todos-page-body--solo'}">
        <div class="todos-page-main">
          <p class="todos-result-count meta" aria-live="polite">
            Mostrando ${slice.length} de ${filtered.length}${filtered.length !== opts.todos.length ? ` (filtrados de ${opts.todos.length})` : ''}
          </p>

          ${cards}

          ${
            hasMore
              ? `<div class="todos-more-wrap">
            <button type="button" class="btn-primary todos-more-btn" data-todos-more>Cargar más (${filtered.length - slice.length} restantes)</button>
          </div>`
              : ''
          }

          ${renderBulkBar(opts.selectedIds.length, opts.status)}
        </div>
        ${asideHtml}
      </div>
    </div>`;
}

export function bindTodosPage(
  root: HTMLElement,
  opts: Pick<TodosPageOpts, 'page' | 'selectMode' | 'selectedIds'>,
  visibleIds: string[],
  handlers: TodosPageHandlers,
): void {
  const getSelectedIds = (): string[] =>
    [...root.querySelectorAll('.todo-card--selected')]
      .map((c) => (c as HTMLElement).dataset.todoId ?? '')
      .filter(Boolean);

  const pageEl = root.querySelector('.todos-page');
  pageEl?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const bulkAccept = target.closest('[data-todos-bulk-accept]') as HTMLElement | null;
    const ids = getSelectedIds();
    if (bulkAccept && ids.length) {
      handlers.onAcceptSuggestionsBulk?.(ids);
      return;
    }
    const bulkBtn = target.closest('[data-todos-bulk]') as HTMLElement | null;
    if (bulkBtn && ids.length) {
      const status = bulkBtn.dataset.todosBulk as MeetingTodo['status'];
      handlers.onBulkStatus(ids, status);
      return;
    }
    if (target.closest('[data-todos-clear-selection]')) {
      handlers.onFilterChange({ selectedIds: [] }, { patchOnly: true });
      return;
    }
    if (target.closest('[data-todos-dismiss-all]')) {
      handlers.onDismissAllSuggestions?.();
    }
  });

  if (!opts.selectMode) {
    bindTodoUi(root, handlers);
  } else {
    bindTodoUi(root, handlers);
    root.querySelectorAll('[data-meeting-id], [data-person-id], [data-team-id], [data-project-id]').forEach((el) => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  const toggleSelect = (id: string) => {
    const next = new Set(getSelectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    handlers.onFilterChange({ selectedIds: [...next] }, { patchOnly: true });
  };

  root.querySelectorAll('[data-todo-select-btn]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoSelectBtn;
      if (id) toggleSelect(id);
    });
  });

  if (opts.selectMode) {
    root.querySelectorAll('.todo-card:not(.todo-card--editing)').forEach((card) => {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, textarea, select, form, [data-todos-edit-form]')) return;
        const id = (card as HTMLElement).dataset.todoId;
        if (id) toggleSelect(id);
      });
    });
  }

  root.querySelector('[data-todos-select-mode]')?.addEventListener('click', () => {
    handlers.onFilterChange({
      selectMode: !opts.selectMode,
      selectedIds: [],
    });
  });

  root.querySelector('[data-todos-select-all]')?.addEventListener('click', () => {
    const current = getSelectedIds();
    const allSelected = visibleIds.every((id) => current.includes(id));
    handlers.onFilterChange({
      selectedIds: allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    }, { patchOnly: true });
  });

  root.querySelector('[data-todos-create-open]')?.addEventListener('click', () => {
    handlers.onFilterChange({ createOpen: true, editingId: null });
  });

  root.querySelector('[data-todos-create-close]')?.addEventListener('click', () => {
    handlers.onFilterChange({ createOpen: false });
  });

  root.querySelectorAll('[data-todo-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.todoEdit;
      if (id) handlers.onFilterChange({ editingId: id, createOpen: false, selectMode: false, selectedIds: [] });
    });
  });

  root.querySelectorAll('.todo-card:not(.todo-card--editing)[data-todo-id]').forEach((card) => {
    card.addEventListener('dblclick', (e) => {
      if (opts.selectMode) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, select, form, [data-todos-edit-form]')) return;
      const id = (card as HTMLElement).dataset.todoId;
      if (id) handlers.onFilterChange({ editingId: id, createOpen: false, selectMode: false, selectedIds: [] });
    });
  });

  root.querySelectorAll('[data-todos-edit-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onFilterChange({ editingId: null, acceptingId: null });
    });
  });

  const parseFormInput = (fd: FormData): TodoFormInput => ({
    text: String(fd.get('text') ?? ''),
    meetingId: String(fd.get('meetingId') ?? ''),
    teamId: String(fd.get('teamId') ?? ''),
    projectId: String(fd.get('projectId') ?? ''),
    personId: String(fd.get('personId') ?? ''),
    dueAt: String(fd.get('dueAt') ?? '') || undefined,
    tags: String(fd.get('tags') ?? '') || undefined,
    notes: String(fd.get('notes') ?? '') || undefined,
    categoryId: String(fd.get('categoryId') ?? '') || undefined,
  });

  root.querySelectorAll('[data-todos-edit-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const el = e.target as HTMLFormElement;
      const id = el.dataset.todoEditId;
      if (!id) return;
      handlers.onUpdateTodo(id, parseFormInput(new FormData(el)));
    });
  });

  root.querySelectorAll('[data-todos-accept-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const el = e.target as HTMLFormElement;
      const id = el.dataset.todoEditId;
      if (!id) return;
      handlers.onAcceptTodo?.(id, parseFormInput(new FormData(el)));
    });
  });

  root.querySelector('[data-todos-create-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    handlers.onCreateTodo(parseFormInput(fd));
  });

  root.querySelector('#todos-search')?.addEventListener('input', (e) => {
    handlers.onFilterChange({ q: (e.target as HTMLInputElement).value, page: 1, selectedIds: [] });
  });

  root.querySelector('#todos-sort')?.addEventListener('change', (e) => {
    handlers.onFilterChange({
      sort: (e.target as HTMLSelectElement).value as TodoSort,
      page: 1,
    });
  });

  root.querySelectorAll('[data-todos-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onFilterChange({
        status: (btn as HTMLElement).dataset.todosStatus as TodoStatusFilter,
        page: 1,
        selectedIds: [],
      });
    });
  });

  root.querySelectorAll('[data-todos-team]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onFilterChange({
        teamId: (btn as HTMLElement).dataset.todosTeam ?? '',
        page: 1,
        selectedIds: [],
      });
    });
  });

  root.querySelectorAll('[data-todos-project]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onFilterChange({
        projectId: (btn as HTMLElement).dataset.todosProject ?? '',
        page: 1,
        selectedIds: [],
      });
    });
  });

  root.querySelector('[data-todos-more]')?.addEventListener('click', () => {
    handlers.onFilterChange({ page: opts.page + 1 });
  });
}

export { filterTodos, PAGE_SIZE };
