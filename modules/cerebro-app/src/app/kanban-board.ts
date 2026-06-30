import type { BoardSnapshot, CerebroStore, CreateTodoInput, MeetingTodo, UpdateTodoInput } from '@shared/types.js';
import { sortTodosByRecency } from '@shared/recency-sort.js';
import { escapeHtml, toast } from '../lib/ui.js';
import { button, emptyState, section, segmentedControl } from '../ui/primitives.js';
import { openModal } from '../ui/modal.js';
import { renderBoardTodoCard } from './board-todo-card.js';
import { renderSuggestionCard, type InboxHandlers } from './inbox-view.js';

export type KanbanColumnId = 'suggested' | 'open' | 'done';

export interface KanbanHandlers {
  loadBoard: () => Promise<BoardSnapshot>;
  onStore: (store: CerebroStore) => void;
  moveTodo: (todoId: string, status: MeetingTodo['status']) => Promise<CerebroStore>;
  createTodo: (input: CreateTodoInput) => Promise<{ store: CerebroStore; todo: MeetingTodo }>;
  updateTodo: (todoId: string, patch: UpdateTodoInput) => Promise<CerebroStore>;
  acceptTodo: (todoId: string) => Promise<CerebroStore>;
  dismissTodo: (todoId: string) => Promise<CerebroStore>;
  completeTodo: (todoId: string) => Promise<CerebroStore>;
  reopenTodo: (todoId: string) => Promise<CerebroStore>;
  inbox: Omit<InboxHandlers, 'loadSuggestions' | 'onStore' | 'onActionComplete'>;
}

type BoardFilters = {
  projectId: string;
  teamId: string;
  assigneeId: string;
};

const COLUMN_DEFS: { id: KanbanColumnId; title: string; status: MeetingTodo['status'] }[] = [
  { id: 'suggested', title: 'Sugerencias', status: 'suggested' },
  { id: 'open', title: 'Por hacer', status: 'open' },
  { id: 'done', title: 'Hechas', status: 'done' },
];

const SUGGESTION_PAGE_SIZE = 25;

function sortTodos(todos: MeetingTodo[]): MeetingTodo[] {
  return sortTodosByRecency(todos);
}

function matchesFilters(todo: MeetingTodo, filters: BoardFilters): boolean {
  if (filters.projectId && !todo.projectIds.includes(filters.projectId)) return false;
  if (filters.teamId && !todo.teamIds.includes(filters.teamId)) return false;
  if (filters.assigneeId) {
    const ids = todo.assigneePersonIds ?? todo.personIds;
    if (!ids.includes(filters.assigneeId)) return false;
  }
  return true;
}

function statusForColumn(columnId: KanbanColumnId): MeetingTodo['status'] {
  return COLUMN_DEFS.find((c) => c.id === columnId)?.status ?? 'open';
}

function openCreateTodoModal(board: BoardSnapshot, handlers: KanbanHandlers, refresh: () => void): void {
  const body = document.createElement('div');
  body.className = 'kanban-form';
  body.innerHTML = `
    <label class="field"><span class="field-label">Tarea</span><input class="field-input" id="kb-text" type="text" placeholder="Qué hay que hacer" /></label>
    <label class="field"><span class="field-label">Fecha límite</span><input class="field-input" id="kb-due" type="datetime-local" /></label>
  `;

  const projectSel = document.createElement('select');
  projectSel.className = 'field-input';
  projectSel.id = 'kb-project';
  projectSel.appendChild(new Option('Sin proyecto', ''));
  board.projects.forEach((p) => projectSel.appendChild(new Option(p.name, p.id)));

  const teamSel = document.createElement('select');
  teamSel.className = 'field-input';
  teamSel.id = 'kb-team';
  teamSel.appendChild(new Option('Sin equipo', ''));
  board.teams.forEach((t) => teamSel.appendChild(new Option(t.name, t.id)));

  const assigneeSel = document.createElement('select');
  assigneeSel.className = 'field-input';
  assigneeSel.id = 'kb-assignee';
  assigneeSel.appendChild(new Option('Sin asignado', ''));
  board.people.forEach((p) => assigneeSel.appendChild(new Option(p.displayName, p.id)));

  body.append(
    Object.assign(document.createElement('label'), { className: 'field', innerHTML: '<span class="field-label">Proyecto</span>' }),
    projectSel,
    Object.assign(document.createElement('label'), { className: 'field', innerHTML: '<span class="field-label">Equipo</span>' }),
    teamSel,
    Object.assign(document.createElement('label'), { className: 'field', innerHTML: '<span class="field-label">Asignado</span>' }),
    assigneeSel,
  );

  const footer = document.createElement('div');
  footer.className = 'btn-row';
  const closeModal = openModal({ title: 'Nueva tarea', body, footer });
  footer.append(
    button('Cancelar', { variant: 'ghost', onClick: () => closeModal() }),
    button('Crear', {
      variant: 'primary',
      onClick: async () => {
        const text = (body.querySelector('#kb-text') as HTMLInputElement).value.trim();
        if (!text) {
          toast('Escribí la tarea', 'error');
          return;
        }
        const dueRaw = (body.querySelector('#kb-due') as HTMLInputElement).value;
        const projectId = projectSel.value;
        const teamId = teamSel.value;
        const assigneeId = assigneeSel.value;
        try {
          const input: CreateTodoInput = {
            text,
            dueAt: dueRaw ? new Date(dueRaw).toISOString() : undefined,
            projectIds: projectId ? [projectId] : undefined,
            teamIds: teamId ? [teamId] : undefined,
            assigneePersonIds: assigneeId ? [assigneeId] : undefined,
          };
          const { store } = await handlers.createTodo(input);
          handlers.onStore(store);
          toast('Tarea creada');
          closeModal();
          refresh();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
}

function openEditTodoModal(todo: MeetingTodo, board: BoardSnapshot, handlers: KanbanHandlers, refresh: () => void): void {
  const body = document.createElement('div');
  body.className = 'kanban-form';
  const textInput = document.createElement('input');
  textInput.className = 'field-input';
  textInput.type = 'text';
  textInput.value = todo.text;
  const dueInput = document.createElement('input');
  dueInput.className = 'field-input';
  dueInput.type = 'datetime-local';
  if (todo.dueAt) {
    const d = new Date(todo.dueAt);
    dueInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  const projectSel = document.createElement('select');
  projectSel.className = 'field-input';
  projectSel.appendChild(new Option('Sin proyecto', ''));
  board.projects.forEach((p) => {
    const opt = new Option(p.name, p.id);
    if (todo.projectIds.includes(p.id)) opt.selected = true;
    projectSel.appendChild(opt);
  });

  const teamSel = document.createElement('select');
  teamSel.className = 'field-input';
  teamSel.appendChild(new Option('Sin equipo', ''));
  board.teams.forEach((t) => {
    const opt = new Option(t.name, t.id);
    if (todo.teamIds.includes(t.id)) opt.selected = true;
    teamSel.appendChild(opt);
  });

  const assigneeSel = document.createElement('select');
  assigneeSel.className = 'field-input';
  assigneeSel.appendChild(new Option('Sin asignado', ''));
  const assigneeIds = todo.assigneePersonIds ?? todo.personIds;
  board.people.forEach((p) => {
    const opt = new Option(p.displayName, p.id);
    if (assigneeIds.includes(p.id)) opt.selected = true;
    assigneeSel.appendChild(opt);
  });

  body.innerHTML = '<label class="field"><span class="field-label">Tarea</span></label><label class="field"><span class="field-label">Fecha límite</span></label><label class="field"><span class="field-label">Proyecto</span></label><label class="field"><span class="field-label">Equipo</span></label><label class="field"><span class="field-label">Asignado</span></label>';
  const labels = body.querySelectorAll('.field');
  labels[0]!.appendChild(textInput);
  labels[1]!.appendChild(dueInput);
  labels[2]!.appendChild(projectSel);
  labels[3]!.appendChild(teamSel);
  labels[4]!.appendChild(assigneeSel);

  const footer = document.createElement('div');
  footer.className = 'btn-row';
  const closeModal = openModal({ title: 'Editar tarea', body, footer });
  footer.append(
    button('Cancelar', { variant: 'ghost', onClick: () => closeModal() }),
    button('Guardar', {
      variant: 'primary',
      onClick: async () => {
        const text = textInput.value.trim();
        if (!text) {
          toast('Escribí la tarea', 'error');
          return;
        }
        try {
          const store = await handlers.updateTodo(todo.id, {
            text,
            dueAt: dueInput.value ? new Date(dueInput.value).toISOString() : null,
            projectIds: projectSel.value ? [projectSel.value] : [],
            teamIds: teamSel.value ? [teamSel.value] : [],
            assigneePersonIds: assigneeSel.value ? [assigneeSel.value] : [],
          });
          handlers.onStore(store);
          toast('Tarea actualizada');
          closeModal();
          refresh();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
}

function setupColumnDrop(
  columnEl: HTMLElement,
  columnId: KanbanColumnId,
  handlers: KanbanHandlers,
  refresh: () => void,
): void {
  columnEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    columnEl.classList.add('kanban-column--drag-over');
  });
  columnEl.addEventListener('dragleave', () => columnEl.classList.remove('kanban-column--drag-over'));
  columnEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    columnEl.classList.remove('kanban-column--drag-over');
    const todoId = e.dataTransfer?.getData('text/todo-id');
    if (!todoId) return;
    const targetStatus = statusForColumn(columnId);
    try {
      const store = await handlers.moveTodo(todoId, targetStatus);
      handlers.onStore(store);
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo mover', 'error');
      refresh();
    }
  });
}

export async function renderKanbanBoard(host: HTMLElement, handlers: KanbanHandlers): Promise<void> {
  const sec = section(
    'Tablero',
    'Sugerencias de IA, inbox y tareas en un solo tablero. Arrastrá las tarjetas entre columnas o usá las acciones inline.',
  );
  host.replaceChildren(sec.el);
  sec.body.innerHTML = '<p class="muted">Cargando tablero…</p>';

  let board: BoardSnapshot;
  try {
    board = await handlers.loadBoard();
  } catch (e) {
    sec.body.innerHTML = `<p class="muted">Error: ${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`;
    return;
  }

  const filters: BoardFilters = { projectId: '', teamId: '', assigneeId: '' };
  let viewMode: 'board' | 'list' = 'board';
  let suggestionLimit = SUGGESTION_PAGE_SIZE;

  const toolbar = document.createElement('div');
  toolbar.className = 'kanban-toolbar';

  const filterRow = document.createElement('div');
  filterRow.className = 'kanban-filters';

  function makeFilterSelect(label: string, options: { id: string; name: string }[], key: keyof BoardFilters): HTMLElement {
    const wrap = document.createElement('label');
    wrap.className = 'kanban-filter-field';
    const span = document.createElement('span');
    span.className = 'kanban-filter-label';
    span.textContent = label;
    const sel = document.createElement('select');
    sel.className = 'field-input kanban-filter-select';
    sel.appendChild(new Option(`Todos`, ''));
    options.forEach((o) => sel.appendChild(new Option(o.name, o.id)));
    sel.addEventListener('change', () => {
      filters[key] = sel.value;
      suggestionLimit = SUGGESTION_PAGE_SIZE;
      paint();
    });
    wrap.append(span, sel);
    return wrap;
  }

  filterRow.append(
    makeFilterSelect('Proyecto', board.projects.map((p) => ({ id: p.id, name: p.name })), 'projectId'),
    makeFilterSelect('Equipo', board.teams.map((t) => ({ id: t.id, name: t.name })), 'teamId'),
    makeFilterSelect('Asignado', board.people.map((p) => ({ id: p.id, name: p.displayName })), 'assigneeId'),
  );

  const actionsRow = document.createElement('div');
  actionsRow.className = 'kanban-actions';

  const viewToggle = segmentedControl(
    [
      { id: 'board' as const, label: 'Tablero' },
      { id: 'list' as const, label: 'Lista' },
    ],
    viewMode,
    (next) => {
      viewMode = next;
      paint();
    },
    'Vista del tablero',
  );

  actionsRow.append(
    viewToggle,
    button('Nueva tarea', {
      variant: 'primary',
      size: 'sm',
      onClick: () => openCreateTodoModal(board, handlers, () => void reload()),
    }),
  );

  toolbar.append(filterRow, actionsRow);

  const content = document.createElement('div');
  content.className = 'kanban-host';

  async function reload(): Promise<void> {
    try {
      board = await handlers.loadBoard();
      paint();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al recargar', 'error');
    }
  }

  const todoHandlers = {
    onAccept: async (todo: MeetingTodo) => {
      handlers.onStore(await handlers.acceptTodo(todo.id));
      toast('Tarea aceptada');
      void reload();
    },
    onDismiss: async (todo: MeetingTodo) => {
      handlers.onStore(await handlers.dismissTodo(todo.id));
      void reload();
    },
    onComplete: async (todo: MeetingTodo) => {
      handlers.onStore(await handlers.completeTodo(todo.id));
      void reload();
    },
    onReopen: async (todo: MeetingTodo) => {
      handlers.onStore(await handlers.reopenTodo(todo.id));
      void reload();
    },
    onEdit: (todo: MeetingTodo) => openEditTodoModal(todo, board, handlers, () => void reload()),
  };

  function paintList(): void {
    content.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'kanban-list-view';
    const items = sortTodos(board.todos.filter((t) => matchesFilters(t, filters)));
    if (!items.length) {
      wrap.appendChild(emptyState('Sin tareas', 'Creá una tarea o aceptá sugerencias.'));
      content.appendChild(wrap);
      return;
    }
    items.forEach((todo) => {
      const card = renderBoardTodoCard(todo, board, todoHandlers);
      card.draggable = false;
      wrap.appendChild(card);
    });
    content.appendChild(wrap);
  }

  function paintBoard(): void {
    content.replaceChildren();
    const boardEl = document.createElement('div');
    boardEl.className = 'kanban-board';

    for (const col of COLUMN_DEFS) {
      const column = document.createElement('section');
      column.className = 'kanban-column';
      column.dataset.column = col.id;

      const todos = sortTodos(
        board.todos.filter((t) => t.status === col.status && matchesFilters(t, filters)),
      );

      const header = document.createElement('header');
      header.className = 'kanban-column-header';
      const count =
        col.id === 'suggested' ? todos.length + board.suggestions.length : todos.length;
      header.innerHTML = `<h3>${escapeHtml(col.title)}</h3><span class="kanban-column-count${count ? ' kanban-column-count--active' : ''}">${count}</span>`;
      column.appendChild(header);

      const body = document.createElement('div');
      body.className = 'kanban-column-body';

      if (col.id === 'suggested') {
        const suggestionHost = document.createElement('ul');
        suggestionHost.className = 'kanban-suggestions';
        const inboxHandlers: InboxHandlers = {
          ...handlers.inbox,
          loadSuggestions: async () => board.suggestions,
          onStore: handlers.onStore,
          onActionComplete: () => void reload(),
        };
        const visibleSuggestions = board.suggestions.slice(0, suggestionLimit);
        visibleSuggestions.forEach((s) => {
          const li = renderSuggestionCard(s, inboxHandlers, body, { layout: 'kanban' });
          suggestionHost.appendChild(li);
        });
        if (visibleSuggestions.length) body.appendChild(suggestionHost);

        const remaining = board.suggestions.length - visibleSuggestions.length;
        if (remaining > 0) {
          const moreRow = document.createElement('div');
          moreRow.className = 'kanban-more-row';
          moreRow.appendChild(
            button(`Ver más (${remaining})`, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                suggestionLimit += SUGGESTION_PAGE_SIZE;
                paint();
              },
            }),
          );
          body.appendChild(moreRow);
        }
      }

      todos.forEach((todo) => {
        const card = renderBoardTodoCard(todo, board, todoHandlers);
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer?.setData('text/todo-id', todo.id);
          card.classList.add('kanban-card--dragging');
        });
        card.addEventListener('dragend', () => card.classList.remove('kanban-card--dragging'));
        body.appendChild(card);
      });

      if (!body.childElementCount) {
        const empty = emptyState(
          'Vacío',
          col.id === 'suggested' ? 'Sin sugerencias pendientes.' : 'Sin tareas aquí.',
        );
        empty.classList.add('empty-state--compact');
        body.appendChild(empty);
      }

      setupColumnDrop(body, col.id, handlers, () => void reload());
      column.appendChild(body);
      boardEl.appendChild(column);
    }

    content.appendChild(boardEl);
  }

  function paint(): void {
    if (viewMode === 'list') paintList();
    else paintBoard();
  }

  sec.body.replaceChildren(toolbar, content);
  paint();
}
