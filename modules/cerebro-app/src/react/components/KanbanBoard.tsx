import { useState, type DragEvent } from 'react';
import type { BoardView, CreateTodoInput, MeetingTodo, UpdateTodoInput } from '@shared/types.js';
import { useMutation } from '@tanstack/react-query';
import { formatDueHint } from '../../lib/todo-daily.js';
import { Badge, Button, EmptyState, Field, Modal, Segmented, formatDate, toast } from '../ds.js';
import { useInvalidateViews } from '../hooks.js';

/** Mutaciones del tablero — parametrizadas para reutilizar en contexto personal y org. */
export interface BoardActions {
  moveTodo: (todoId: string, status: MeetingTodo['status']) => Promise<unknown>;
  createTodo: (input: CreateTodoInput) => Promise<unknown>;
  updateTodo: (todoId: string, patch: UpdateTodoInput) => Promise<unknown>;
  acceptTodo: (todoId: string) => Promise<unknown>;
  dismissTodo: (todoId: string) => Promise<unknown>;
  acceptTodosBatch: (todoIds: string[]) => Promise<unknown>;
  dismissTodosBatch: (todoIds: string[]) => Promise<unknown>;
  completeTodo: (todoId: string) => Promise<unknown>;
  reopenTodo: (todoId: string) => Promise<unknown>;
}

const SUGGESTED_PAGE_SIZE = 40;
const BATCH_CHUNK = 100;

const COLUMNS: Array<{ id: MeetingTodo['status']; title: string }> = [
  { id: 'suggested', title: 'Sugeridas' },
  { id: 'open', title: 'Por hacer' },
  { id: 'done', title: 'Hechas' },
];

const SOURCE_LABELS: Record<string, string> = {
  extracted: 'Reunión',
  ai: 'IA',
  manual: 'Manual',
  'cursor-chat': 'Chat',
};

function sortTodos(todos: MeetingTodo[]): MeetingTodo[] {
  return [...todos].sort((a, b) => {
    const pa = a.boardPosition ?? 0;
    const pb = b.boardPosition ?? 0;
    if (pa !== pb) return pa - pb;
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
  });
}

function lookupNames(ids: string[], catalog: Array<{ id: string; name?: string; displayName?: string }>): string {
  return ids
    .map((id) => catalog.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => x.name ?? x.displayName ?? x.id)
    .join(', ');
}

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

function TodoCard({
  todo,
  board,
  onAction,
  onEdit,
  draggable,
  selectable,
  selected,
  onToggleSelect,
}: {
  todo: MeetingTodo;
  board: BoardView;
  onAction: (action: 'accept' | 'dismiss' | 'complete' | 'reopen', todo: MeetingTodo) => void;
  onEdit: (todo: MeetingTodo) => void;
  draggable: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const assigneeIds = todo.assigneePersonIds ?? todo.personIds;
  return (
    <div
      className={`kanban-card kanban-card--todo kanban-card--${todo.status}${selected ? ' kanban-card--selected' : ''}`}
      draggable={draggable && !selectable}
      onDragStart={(e: DragEvent) => {
        if (selectable) return;
        e.dataTransfer.setData('text/todo-id', todo.id);
      }}
    >
      <div className="kanban-card-head">
        {selectable ? (
          <label className="kanban-card-select">
            <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect?.()} />
            <span className="kanban-card-title">{todo.text}</span>
          </label>
        ) : (
          <p className="kanban-card-title">{todo.text}</p>
        )}
      </div>
      <div className="kanban-card-meta">
        {todo.projectIds.length ? <span className="kanban-chip">{lookupNames(todo.projectIds, board.projects)}</span> : null}
        {todo.teamIds.length ? <span className="kanban-chip">{lookupNames(todo.teamIds, board.teams)}</span> : null}
        {assigneeIds.length ? (
          <span className="kanban-chip">{lookupNames(assigneeIds, board.people)}</span>
        ) : todo.assigneeLabel ? (
          <span className="kanban-chip">{todo.assigneeLabel}</span>
        ) : null}
        {todo.dueAt ? <span className="kanban-chip kanban-chip--due">{formatDueHint(todo.dueAt)}</span> : null}
        <span className="kanban-chip kanban-chip--muted">{SOURCE_LABELS[todo.source ?? 'extracted'] ?? todo.source}</span>
        {todo.meetingTitle && todo.meetingId !== 'manual' ? (
          <span className="kanban-chip kanban-chip--muted">{todo.meetingTitle}</span>
        ) : null}
      </div>
      <div className="kanban-card-actions">
        {todo.status === 'suggested' ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => onAction('accept', todo)}>
              Aceptar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction('dismiss', todo)}>
              Descartar
            </Button>
          </>
        ) : null}
        {todo.status === 'open' ? (
          <Button variant="ghost" size="sm" onClick={() => onAction('complete', todo)}>
            Hecha
          </Button>
        ) : null}
        {todo.status === 'done' ? (
          <Button variant="ghost" size="sm" onClick={() => onAction('reopen', todo)}>
            Reabrir
          </Button>
        ) : null}
        {todo.status !== 'done' ? (
          <Button variant="ghost" size="sm" onClick={() => onEdit(todo)}>
            Editar
          </Button>
        ) : null}
        {todo.status === 'done' && todo.completedAt ? (
          <span className="muted kanban-done-hint">Completada {formatDate(todo.completedAt)}</span>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoard({ board, actions }: { board: BoardView; actions: BoardActions }) {
  const invalidate = useInvalidateViews();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [projectId, setProjectId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; todo: MeetingTodo } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [suggestedVisible, setSuggestedVisible] = useState(SUGGESTED_PAGE_SIZE);
  const [confirmDismissCount, setConfirmDismissCount] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async (op: () => Promise<unknown>) => op(),
    onSuccess: invalidate,
    onError: (e) => {
      toast(e instanceof Error ? e.message : 'Error', 'error');
      invalidate();
    },
  });

  function run(op: () => Promise<unknown>) {
    mutation.mutate(op);
  }

  function handleAction(action: 'accept' | 'dismiss' | 'complete' | 'reopen', todo: MeetingTodo) {
    const map = {
      accept: actions.acceptTodo,
      dismiss: actions.dismissTodo,
      complete: actions.completeTodo,
      reopen: actions.reopenTodo,
    } as const;
    run(() => map[action](todo.id));
  }

  function matches(t: MeetingTodo): boolean {
    if (projectId && !t.projectIds.includes(projectId)) return false;
    if (teamId && !t.teamIds.includes(teamId)) return false;
    if (assigneeId && !(t.assigneePersonIds ?? t.personIds).includes(assigneeId)) return false;
    return true;
  }

  const filtered = board.todos.filter(matches);
  const suggestedTodos = sortTodos(filtered.filter((t) => t.status === 'suggested'));
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

  function selectAllSuggested(): void {
    setSelectedIds(new Set(suggestedTodos.map((t) => t.id)));
  }

  function clearSelection(): void {
    setSelectedIds(new Set());
  }

  function toggleSelectAllSuggested(): void {
    if (allSuggestedSelected) clearSelection();
    else selectAllSuggested();
  }

  async function runBatchAccept(ids: string[]): Promise<void> {
    await runInChunks(ids, (chunk) => actions.acceptTodosBatch(chunk));
    clearSelection();
    toast(ids.length === 1 ? 'Tarea aceptada' : `${ids.length} tareas aceptadas`);
  }

  async function runBatchDismiss(ids: string[]): Promise<void> {
    await runInChunks(ids, (chunk) => actions.dismissTodosBatch(chunk));
    clearSelection();
    toast(ids.length === 1 ? 'Tarea descartada' : `${ids.length} tareas descartadas`);
  }

  function requestBatchDismiss(): void {
    const ids = [...selectedIds];
    if (!ids.length) return;
    if (ids.length > 15) {
      setConfirmDismissCount(ids.length);
      return;
    }
    run(() => runBatchDismiss(ids));
  }

  function requestBatchAccept(): void {
    const ids = [...selectedIds];
    if (!ids.length) return;
    run(() => runBatchAccept(ids));
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
      run(() =>
        actions.updateTodo(modal.todo.id, { text: values.text, dueAt: values.dueAt ?? null, ...common }),
      );
    } else {
      run(() =>
        actions.createTodo({
          text: values.text,
          dueAt: values.dueAt ?? undefined,
          projectIds: common.projectIds.length ? common.projectIds : undefined,
          teamIds: common.teamIds.length ? common.teamIds : undefined,
          assigneePersonIds: common.assigneePersonIds.length ? common.assigneePersonIds : undefined,
        }),
      );
    }
    setModal(null);
  }

  return (
    <div>
      <div className="kanban-toolbar">
        <div className="kanban-filters">
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

      {viewMode === 'list' ? (
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
                <span>
                  Seleccionar todas las sugeridas ({suggestedTodos.length})
                </span>
              </label>
            </div>
          ) : null}
          {filtered.length ? (
            sortTodos(filtered).map((t) => (
              <TodoCard
                key={t.id}
                todo={t}
                board={board}
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
      ) : (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const todos =
              col.id === 'suggested'
                ? visibleSuggested
                : sortTodos(filtered.filter((t) => t.status === col.id));
            const totalInColumn =
              col.id === 'suggested'
                ? suggestedTodos.length
                : sortTodos(filtered.filter((t) => t.status === col.id)).length;
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
                <div
                  className={`kanban-column-body${dragOver === col.id ? ' kanban-column--drag-over' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(col.id);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const todoId = e.dataTransfer.getData('text/todo-id');
                    if (todoId) run(() => actions.moveTodo(todoId, col.id));
                  }}
                >
                  {todos.length ? (
                    todos.map((t) => (
                      <TodoCard
                        key={t.id}
                        todo={t}
                        board={board}
                        onAction={handleAction}
                        onEdit={(todo) => setModal({ mode: 'edit', todo })}
                        draggable={col.id !== 'suggested'}
                        selectable={col.id === 'suggested'}
                        selected={selectedIds.has(t.id)}
                        onToggleSelect={() => toggleSelect(t.id)}
                      />
                    ))
                  ) : (
                    <EmptyState title="Vacío" desc={col.id === 'suggested' ? 'Sin sugerencias pendientes.' : 'Sin tareas aquí.'} />
                  )}
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
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selectedIds.size > 0 ? (
        <div className="kanban-bulk-bar" role="toolbar" aria-label="Acciones en lote">
          <span className="kanban-bulk-count">
            {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
          </span>
          <div className="kanban-bulk-actions">
            <Button size="sm" variant="secondary" loading={mutation.isPending} onClick={requestBatchAccept}>
              Aceptar
            </Button>
            <Button size="sm" variant="ghost" loading={mutation.isPending} onClick={requestBatchDismiss}>
              Descartar
            </Button>
            <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={clearSelection}>
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
                loading={mutation.isPending}
                onClick={() => {
                  const ids = [...selectedIds];
                  setConfirmDismissCount(null);
                  run(() => runBatchDismiss(ids));
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
          busy={mutation.isPending}
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
