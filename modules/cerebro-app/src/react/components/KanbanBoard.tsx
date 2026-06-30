import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardView, CreateTodoInput, MeetingTodo, MoveTodoInput, UpdateTodoInput } from '@shared/types.js';
import { buildTodoGroups, type TodoGroupBy } from '@shared/todo-groups.js';
import { Button, EmptyState, Field, Modal, Segmented, toast } from '../ds.js';
import {
  loadCollapsedGroupIds,
  loadKanbanGroupBy,
  loadKanbanViewMode,
  saveCollapsedGroupIds,
  saveKanbanGroupBy,
  saveKanbanViewMode,
  type KanbanViewMode,
} from '../lib/kanban-prefs.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';
import { EntityGhost } from './entity/EntityGhost.js';
import { TodoCard } from './entity/TodoCard.js';
import { KanbanGroupedList } from './KanbanGroupedList.js';
import { KanbanSwimlaneBoard } from './KanbanSwimlaneBoard.js';
import { KANBAN_COLUMNS, KANBAN_COLUMN_IDS, sortKanbanTodos } from './kanban-shared.js';

/** Mutaciones del tablero — parametrizadas para reutilizar en contexto personal y org. */
export interface BoardActions {
  moveTodo: (todoId: string, input: MoveTodoInput) => Promise<unknown>;
  createTodo: (input: CreateTodoInput) => Promise<unknown>;
  updateTodo: (todoId: string, patch: UpdateTodoInput) => Promise<unknown>;
  acceptTodo: (todoId: string) => Promise<unknown>;
  dismissTodo: (todoId: string) => Promise<unknown>;
  acceptTodosBatch: (todoIds: string[]) => Promise<unknown>;
  dismissTodosBatch: (todoIds: string[]) => Promise<unknown>;
  completeTodo: (todoId: string) => Promise<unknown>;
  reopenTodo: (todoId: string) => Promise<unknown>;
}

export type KanbanBoardProps = {
  board: BoardView;
  actions: BoardActions;
  orgId?: string;
  prefsScope?: string;
  groupBy?: TodoGroupBy;
  viewMode?: KanbanViewMode;
  onGroupByChange?: (value: TodoGroupBy) => void;
  onViewModeChange?: (value: KanbanViewMode) => void;
};

const SUGGESTED_PAGE_SIZE = 40;
const BATCH_CHUNK = 100;

async function runInChunks(ids: string[], fn: (chunk: string[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < ids.length; i += BATCH_CHUNK) {
    await fn(ids.slice(i, i + BATCH_CHUNK));
  }
}

function TodoFormModal({
  board,
  todo,
  onClose,
  onSubmit,
  busy,
}: {
  board: BoardView;
  todo?: MeetingTodo;
  onClose: () => void;
  onSubmit: (values: {
    text: string;
    dueAt?: string | null;
    projectId: string;
    teamId: string;
    assigneeId: string;
  }) => void;
  busy: boolean;
}) {
  const [text, setText] = useState(todo?.text ?? '');
  const [due, setDue] = useState(() => {
    if (!todo?.dueAt) return '';
    const d = new Date(todo.dueAt);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [projectId, setProjectId] = useState(todo?.projectIds[0] ?? '');
  const [teamId, setTeamId] = useState(todo?.teamIds[0] ?? '');
  const [assigneeId, setAssigneeId] = useState((todo?.assigneePersonIds ?? todo?.personIds ?? [])[0] ?? '');

  return (
    <Modal
      title={todo ? 'Editar tarea' : 'Nueva tarea'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={busy}
            onClick={() => {
              if (!text.trim()) {
                toast('Escribí la tarea', 'error');
                return;
              }
              onSubmit({
                text: text.trim(),
                dueAt: due ? new Date(due).toISOString() : todo ? null : undefined,
                projectId,
                teamId,
                assigneeId,
              });
            }}
          >
            {todo ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      }
    >
      <div className="kanban-form">
        <Field label="Tarea">
          <input
            className="field-input"
            type="text"
            value={text}
            placeholder="Qué hay que hacer"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Fecha límite">
          <input className="field-input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Proyecto">
          <select className="field-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Sin proyecto</option>
            {board.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Equipo">
          <select className="field-input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Sin equipo</option>
            {board.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Asignado">
          <select className="field-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Sin asignado</option>
            {board.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function KanbanColumnBody({
  columnId,
  children,
}: {
  columnId: MeetingTodo['status'];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-column-body${isOver ? ' kanban-column--drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

export function KanbanBoard({
  board,
  actions,
  orgId,
  prefsScope,
  groupBy: groupByProp,
  viewMode: viewModeProp,
  onGroupByChange,
  onViewModeChange,
}: KanbanBoardProps) {
  const queue = useActionQueue();
  const [internalViewMode, setInternalViewMode] = useState<KanbanViewMode>(() =>
    loadKanbanViewMode(prefsScope),
  );
  const viewMode = viewModeProp ?? internalViewMode;

  const setViewMode = useCallback(
    (next: KanbanViewMode) => {
      if (onViewModeChange) onViewModeChange(next);
      else setInternalViewMode(next);
      saveKanbanViewMode(next, prefsScope);
    },
    [onViewModeChange, prefsScope],
  );

  const [internalGroupBy, setInternalGroupBy] = useState<TodoGroupBy>(() =>
    loadKanbanGroupBy(prefsScope),
  );
  const groupBy = groupByProp ?? internalGroupBy;

  const setGroupBy = useCallback(
    (next: TodoGroupBy) => {
      if (onGroupByChange) onGroupByChange(next);
      else setInternalGroupBy(next);
      saveKanbanGroupBy(next, prefsScope);
      setSelectedIds(new Set());
      setSuggestedVisible(SUGGESTED_PAGE_SIZE);
      setSuggestedVisibleByGroup(new Map());
    },
    [onGroupByChange, prefsScope],
  );

  const [projectId, setProjectId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; todo: MeetingTodo } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suggestedVisible, setSuggestedVisible] = useState(SUGGESTED_PAGE_SIZE);
  const [suggestedVisibleByGroup, setSuggestedVisibleByGroup] = useState<Map<string, number>>(new Map());
  const [confirmDismissCount, setConfirmDismissCount] = useState<number | null>(null);
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() =>
    loadCollapsedGroupIds(groupBy, prefsScope),
  );
  const [collapsedDoneSections, setCollapsedDoneSections] = useState<Set<string>>(() => new Set());

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const actionBusy = queue.pendingCount > 0;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setCollapsedGroupIds(loadCollapsedGroupIds(groupBy, prefsScope));
  }, [groupBy, prefsScope]);

  function enqueueEntity(
    key: string,
    execute: () => Promise<unknown>,
    opts?: {
      todoMove?: { todoId: string; status: MeetingTodo['status']; boardPosition?: number };
      todoMoves?: Array<{ todoId: string; status: MeetingTodo['status'] }>;
      successMessage: string;
    },
  ) {
    queue.enqueue({
      key,
      entityMutation: true,
      orgId,
      todoMove: opts?.todoMove ? { ...opts.todoMove, orgId } : undefined,
      todoMoves: opts?.todoMoves?.map((m) => ({ ...m, orgId })),
      execute,
      successMessage: opts?.successMessage ?? 'Actualizado',
      errorMessage: 'Error',
    });
  }

  function enqueueMove(todoId: string, input: MoveTodoInput) {
    enqueueEntity(`move:${todoId}:${input.status}:${input.boardPosition ?? ''}`, () => actions.moveTodo(todoId, input), {
      todoMove: { todoId, status: input.status, boardPosition: input.boardPosition },
      successMessage: 'Tarea movida',
    });
  }

  function enqueueUpdate(todoId: string, patch: UpdateTodoInput, successMessage = 'Tarea actualizada') {
    enqueueEntity(`update:${todoId}:${JSON.stringify(patch)}`, () => actions.updateTodo(todoId, patch), {
      successMessage,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function matches(t: MeetingTodo): boolean {
    if (groupBy === 'none') {
      if (projectId && !t.projectIds.includes(projectId)) return false;
      if (teamId && !t.teamIds.includes(teamId)) return false;
    }
    if (assigneeId && !(t.assigneePersonIds ?? t.personIds).includes(assigneeId)) return false;
    return true;
  }

  const filtered = useMemo(() => board.todos.filter(matches), [board.todos, groupBy, projectId, teamId, assigneeId]);

  const groups = useMemo(() => {
    if (groupBy === 'none') return [];
    return buildTodoGroups(filtered, groupBy, board);
  }, [filtered, groupBy, board]);

  useEffect(() => {
    if (groupBy === 'none') return;
    setCollapsedDoneSections(new Set(groups.map((g) => g.id)));
  }, [groupBy, groups]);

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const todoId = String(active.id);
    const todo = board.todos.find((t) => t.id === todoId);
    if (!todo) return;

    const overId = String(over.id);

    if (KANBAN_COLUMN_IDS.has(overId as MeetingTodo['status'])) {
      const status = overId as MeetingTodo['status'];
      if (status === todo.status) return;
      enqueueMove(todoId, { status });
      return;
    }

    const overTodo = board.todos.find((t) => t.id === overId);
    if (!overTodo) return;

    if (overTodo.status === todo.status && overId !== todoId) {
      const columnTodos = sortKanbanTodos(filtered.filter((t) => t.status === todo.status));
      const oldIndex = columnTodos.findIndex((t) => t.id === todoId);
      const newIndex = columnTodos.findIndex((t) => t.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(columnTodos, oldIndex, newIndex);
      const rank = reordered.findIndex((t) => t.id === todoId);
      const boardPosition = (reordered.length - rank) * 1000 + (Date.now() % 1000);
      enqueueMove(todoId, { status: todo.status, boardPosition });
      return;
    }

    if (overTodo.status !== todo.status) {
      enqueueMove(todoId, { status: overTodo.status, boardPosition: Date.now() });
    }
  }

  function handleAction(action: 'accept' | 'dismiss' | 'complete' | 'reopen', todo: MeetingTodo) {
    const statusMap = {
      accept: 'open' as const,
      dismiss: 'dismissed' as const,
      complete: 'done' as const,
      reopen: 'open' as const,
    };
    const map = {
      accept: actions.acceptTodo,
      dismiss: actions.dismissTodo,
      complete: actions.completeTodo,
      reopen: actions.reopenTodo,
    } as const;
    enqueueEntity(`todo:${todo.id}:${action}`, () => map[action](todo.id), {
      todoMove: { todoId: todo.id, status: statusMap[action] },
      successMessage: action === 'complete' ? 'Marcada como hecha' : 'Actualizado',
    });
  }

  const suggestedTodos = sortKanbanTodos(filtered.filter((t) => t.status === 'suggested'));
  const visibleSuggested = suggestedTodos.slice(0, suggestedVisible);
  const allSuggestedSelected =
    suggestedTodos.length > 0 && suggestedTodos.every((t) => selectedIds.has(t.id));
  const someSuggestedSelected = suggestedTodos.some((t) => selectedIds.has(t.id));

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection(): void {
    setSelectedIds(new Set());
  }

  function selectAllSuggested(): void {
    setSelectedIds(new Set(suggestedTodos.map((t) => t.id)));
  }

  function toggleSelectAllSuggested(): void {
    if (allSuggestedSelected) clearSelection();
    else selectAllSuggested();
  }

  function toggleSelectAllSuggestedIds(ids: string[]): void {
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) clearSelection();
    else setSelectedIds(new Set(ids));
  }

  async function runBatchAccept(ids: string[]): Promise<void> {
    await runInChunks(ids, (chunk) => actions.acceptTodosBatch(chunk));
    clearSelection();
  }

  async function runBatchDismiss(ids: string[]): Promise<void> {
    await runInChunks(ids, (chunk) => actions.dismissTodosBatch(chunk));
    clearSelection();
  }

  function requestBatchDismiss(): void {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (ids.length > 15) {
      setConfirmDismissCount(ids.length);
      return;
    }
    enqueueEntity(`batch-dismiss:${ids.join(',')}`, () => runBatchDismiss(ids), {
      todoMoves: ids.map((todoId) => ({ todoId, status: 'dismissed' as const })),
      successMessage: ids.length === 1 ? 'Tarea descartada' : `${ids.length} tareas descartadas`,
    });
  }

  function requestBatchAccept(): void {
    const ids = [...selectedIds];
    if (!ids.length) return;
    enqueueEntity(`batch-accept:${ids.join(',')}`, () => runBatchAccept(ids), {
      todoMoves: ids.map((todoId) => ({ todoId, status: 'open' as const })),
      successMessage: ids.length === 1 ? 'Tarea aceptada' : `${ids.length} tareas aceptadas`,
    });
  }

  function requestBatchAcceptIds(ids: string[]): void {
    if (!ids.length) return;
    enqueueEntity(`batch-accept:${ids.join(',')}`, () => runBatchAccept(ids), {
      todoMoves: ids.map((todoId) => ({ todoId, status: 'open' as const })),
      successMessage: ids.length === 1 ? 'Tarea aceptada' : `${ids.length} tareas aceptadas`,
    });
  }

  function toggleGroupCollapsed(groupId: string): void {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      saveCollapsedGroupIds(groupBy, next, prefsScope);
      return next;
    });
  }

  function toggleDoneSection(groupId: string): void {
    setCollapsedDoneSections((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function submitForm(values: {
    text: string;
    dueAt?: string | null;
    projectId: string;
    teamId: string;
    assigneeId: string;
  }) {
    const common = {
      projectIds: values.projectId ? [values.projectId] : [],
      teamIds: values.teamId ? [values.teamId] : [],
      assigneePersonIds: values.assigneeId ? [values.assigneeId] : [],
    };
    if (modal?.mode === 'edit') {
      enqueueUpdate(modal.todo.id, { text: values.text, dueAt: values.dueAt ?? null, ...common });
    } else {
      enqueueEntity('create-todo', () =>
        actions.createTodo({
          text: values.text,
          dueAt: values.dueAt ?? undefined,
          projectIds: common.projectIds.length ? common.projectIds : undefined,
          teamIds: common.teamIds.length ? common.teamIds : undefined,
          assigneePersonIds: common.assigneePersonIds.length ? common.assigneePersonIds : undefined,
        }),
      { successMessage: 'Tarea creada' });
    }
    setModal(null);
  }

  const showEntityFilters = groupBy === 'none';

  function renderContent() {
    if (groupBy !== 'none' && viewMode === 'list') {
      return (
        <KanbanGroupedList
          groups={groups}
          board={board}
          orgId={orgId}
          handlers={{
            onAction: handleAction,
            onEdit: (todo) => setModal({ mode: 'edit', todo }),
            selectedIds,
            onToggleSelect: toggleSelect,
            onBatchAccept: requestBatchAcceptIds,
            collapsedGroupIds,
            onToggleGroupCollapsed: toggleGroupCollapsed,
            collapsedDoneSections,
            onToggleDoneSection: toggleDoneSection,
          }}
        />
      );
    }

    if (groupBy !== 'none' && viewMode === 'board') {
      return (
        <KanbanSwimlaneBoard
          groups={groups}
          groupBy={groupBy}
          board={board}
          orgId={orgId}
          handlers={{
            onAction: handleAction,
            onEdit: (todo) => setModal({ mode: 'edit', todo }),
            onMove: enqueueMove,
            onUpdateEntity: enqueueUpdate,
            selectedIds,
            onToggleSelect: toggleSelect,
            onToggleSelectAllSuggested: toggleSelectAllSuggestedIds,
            suggestedVisibleByGroup,
            onShowMoreSuggested: (groupId, increment) => {
              setSuggestedVisibleByGroup((prev) => {
                const next = new Map(prev);
                next.set(groupId, (next.get(groupId) ?? SUGGESTED_PAGE_SIZE) + increment);
                return next;
              });
            },
          }}
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="kanban-list-view">
          {suggestedTodos.length ? (
            <div className="kanban-column-tools kanban-column-tools--list">
              <label className="kanban-select-all">
                <input
                  type="checkbox"
                  checked={allSuggestedSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSuggestedSelected && !allSuggestedSelected;
                  }}
                  onChange={toggleSelectAllSuggested}
                />
                <span>Seleccionar todas las sugeridas ({suggestedTodos.length})</span>
              </label>
            </div>
          ) : null}
          {filtered.length ? (
            sortKanbanTodos(filtered).map((t) => (
              <TodoCard
                key={t.id}
                todo={t}
                board={board}
                orgId={orgId}
                onAction={handleAction}
                onEdit={(todo) => setModal({ mode: 'edit', todo })}
                draggable={false}
                selectable={t.status === 'suggested'}
                selected={selectedIds.has(t.id)}
                onToggleSelect={() => toggleSelect(t.id)}
              />
            ))
          ) : (
            <EmptyState title="Sin tareas" desc="Creá una tarea o aceptá sugerencias." />
          )}
        </div>
      );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {KANBAN_COLUMNS.map((col) => {
            const todos =
              col.id === 'suggested'
                ? visibleSuggested
                : sortKanbanTodos(filtered.filter((t) => t.status === col.id));
            const totalInColumn =
              col.id === 'suggested'
                ? suggestedTodos.length
                : sortKanbanTodos(filtered.filter((t) => t.status === col.id)).length;
            const remainingSuggested = suggestedTodos.length - visibleSuggested.length;
            return (
              <section key={col.id} className="kanban-column">
                <header className="kanban-column-header">
                  <div className="kanban-column-header-main">
                    {col.id === 'suggested' && suggestedTodos.length ? (
                      <label className="kanban-select-all kanban-select-all--compact" title="Seleccionar todas las sugeridas">
                        <input
                          type="checkbox"
                          checked={allSuggestedSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSuggestedSelected && !allSuggestedSelected;
                          }}
                          onChange={toggleSelectAllSuggested}
                        />
                      </label>
                    ) : null}
                    <h3>{col.title}</h3>
                  </div>
                  <span className={`kanban-column-count${totalInColumn ? ' kanban-column-count--active' : ''}`}>
                    {totalInColumn}
                  </span>
                </header>
                {col.id === 'suggested' && suggestedTodos.length ? (
                  <div className="kanban-column-tools">
                    <button type="button" className="kanban-select-all-link" onClick={toggleSelectAllSuggested}>
                      {allSuggestedSelected ? 'Deseleccionar todas' : `Seleccionar todas (${suggestedTodos.length})`}
                    </button>
                  </div>
                ) : null}
                <KanbanColumnBody columnId={col.id}>
                  <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {todos.length ? (
                      todos.map((t) => (
                        <TodoCard
                          key={t.id}
                          todo={t}
                          board={board}
                          orgId={orgId}
                          onAction={handleAction}
                          onEdit={(todo) => setModal({ mode: 'edit', todo })}
                          draggable={col.id !== 'suggested'}
                          sortable={col.id !== 'suggested'}
                          selectable={col.id === 'suggested'}
                          selected={selectedIds.has(t.id)}
                          onToggleSelect={() => toggleSelect(t.id)}
                        />
                      ))
                    ) : (
                      <EmptyState title="Vacío" desc={col.id === 'suggested' ? 'Sin sugerencias pendientes.' : 'Sin tareas aquí.'} />
                    )}
                  </SortableContext>
                  {col.id === 'suggested' && remainingSuggested > 0 ? (
                    <div className="kanban-more-row">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuggestedVisible((n) => n + SUGGESTED_PAGE_SIZE)}
                      >
                        Ver más ({remainingSuggested})
                      </Button>
                    </div>
                  ) : null}
                </KanbanColumnBody>
              </section>
            );
          })}
        </div>
        <DragOverlay>
          {activeDragId ? (
            <EntityGhost label={board.todos.find((t) => t.id === activeDragId)?.text ?? 'Moviendo…'} />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <div>
      <div className="kanban-toolbar">
        <div className="kanban-filters">
          <div className="kanban-filter-field kanban-filter-field--segmented">
            <span className="kanban-filter-label">Agrupar por</span>
            <Segmented
              options={[
                { id: 'none' as const, label: 'Ninguno' },
                { id: 'team' as const, label: 'Equipo' },
                { id: 'project' as const, label: 'Proyecto' },
              ]}
              value={groupBy}
              onChange={setGroupBy}
              ariaLabel="Agrupar tareas"
            />
          </div>
          {showEntityFilters ? (
            <>
              <label className="kanban-filter-field">
                <span className="kanban-filter-label">Proyecto</span>
                <select
                  className="field-input kanban-filter-select"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    clearSelection();
                    setSuggestedVisible(SUGGESTED_PAGE_SIZE);
                  }}
                >
                  <option value="">Todos</option>
                  {board.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="kanban-filter-field">
                <span className="kanban-filter-label">Equipo</span>
                <select
                  className="field-input kanban-filter-select"
                  value={teamId}
                  onChange={(e) => {
                    setTeamId(e.target.value);
                    clearSelection();
                    setSuggestedVisible(SUGGESTED_PAGE_SIZE);
                  }}
                >
                  <option value="">Todos</option>
                  {board.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
          <label className="kanban-filter-field">
            <span className="kanban-filter-label">Asignado</span>
            <select
              className="field-input kanban-filter-select"
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                clearSelection();
                setSuggestedVisible(SUGGESTED_PAGE_SIZE);
              }}
            >
              <option value="">Todos</option>
              {board.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="kanban-actions">
          <Segmented
            options={[
              { id: 'board' as const, label: 'Tablero' },
              { id: 'list' as const, label: 'Lista' },
            ]}
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="Vista del tablero"
          />
          <Button size="sm" onClick={() => setModal({ mode: 'create' })}>
            Nueva tarea
          </Button>
        </div>
      </div>

      {renderContent()}

      {selectedIds.size > 0 ? (
        <div className="kanban-bulk-bar" role="toolbar" aria-label="Acciones en lote">
          <span className="kanban-bulk-count">
            {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
          </span>
          <div className="kanban-bulk-actions">
            <Button size="sm" variant="secondary" loading={actionBusy} onClick={requestBatchAccept}>
              Aceptar
            </Button>
            <Button size="sm" variant="ghost" loading={actionBusy} onClick={requestBatchDismiss}>
              Descartar
            </Button>
            <Button size="sm" variant="ghost" disabled={actionBusy} onClick={clearSelection}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {confirmDismissCount !== null ? (
        <Modal
          title="Descartar sugerencias"
          onClose={() => setConfirmDismissCount(null)}
          footer={
            <div className="btn-row">
              <Button variant="ghost" onClick={() => setConfirmDismissCount(null)}>
                Cancelar
              </Button>
              <Button
                loading={actionBusy}
                onClick={() => {
                  const ids = [...selectedIds];
                  setConfirmDismissCount(null);
                  enqueueEntity(`batch-dismiss:${ids.join(',')}`, () => runBatchDismiss(ids), {
                    successMessage: `${ids.length} tareas descartadas`,
                  });
                }}
              >
                Descartar {confirmDismissCount}
              </Button>
            </div>
          }
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Vas a descartar {confirmDismissCount} sugerencias. No se pueden recuperar desde el tablero (quedan ocultas).
          </p>
        </Modal>
      ) : null}

      {modal ? (
        <TodoFormModal
          board={board}
          todo={modal.mode === 'edit' ? modal.todo : undefined}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
          busy={actionBusy}
        />
      ) : null}
      {board.counts.suggested + board.counts.open + board.counts.done === 0 ? null : (
        <p className="row-meta" style={{ marginTop: 'var(--space-3)' }}>
          {board.counts.suggested} sugeridas · {board.counts.open} abiertas · {board.counts.done} hechas
        </p>
      )}
    </div>
  );
}
