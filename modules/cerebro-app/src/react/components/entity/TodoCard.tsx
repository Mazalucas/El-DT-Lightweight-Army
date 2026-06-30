import { useDraggable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BoardView, MeetingTodo } from '@shared/types.js';
import { formatDueHint } from '../../../lib/todo-daily.js';
import { Button, formatDate } from '../../ds.js';
import { CerebroElement } from './CerebroElement.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';
import { useCerebroUi } from '../cerebro/CerebroProvider.js';

const SOURCE_LABELS: Record<string, string> = {
  extracted: 'Reunión',
  ai: 'IA',
  manual: 'Manual',
  'cursor-chat': 'Chat',
};

function lookupNames(ids: string[], catalog: Array<{ id: string; name?: string; displayName?: string }>): string {
  return ids
    .map((id) => catalog.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => x.name ?? x.displayName ?? x.id)
    .join(', ');
}

function EntityChip({
  ids,
  catalog,
}: {
  ids: string[];
  catalog: Array<{ id: string; name?: string; displayName?: string }>;
}) {
  if (!ids.length) return null;
  const primary = lookupNames([ids[0]], catalog);
  const extra = ids.length - 1;
  return (
    <span className="kanban-chip">
      {primary}
      {extra > 0 ? <span className="kanban-chip-extra">+{extra}</span> : null}
    </span>
  );
}

export function TodoCard({
  todo,
  board,
  onAction,
  onEdit,
  draggable,
  sortable,
  selectable,
  selected,
  onToggleSelect,
  orgId,
}: {
  todo: MeetingTodo;
  board: BoardView;
  onAction: (action: 'accept' | 'dismiss' | 'complete' | 'reopen', todo: MeetingTodo) => void;
  onEdit: (todo: MeetingTodo) => void;
  draggable: boolean;
  /** Orden dentro de columna (@dnd-kit/sortable). */
  sortable?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  orgId?: string;
}) {
  const setFocusedEntity = useEntityLifecycleStore((s) => s.setFocusedEntity);
  const { setPanelOpen, askAboutEntity } = useCerebroUi();
  const assigneeIds = todo.assigneePersonIds ?? todo.personIds;
  const entityRef = { kind: 'todo' as const, id: todo.id, orgId };

  const useSortableDnD = Boolean(sortable && draggable && !selectable);
  const draggableHook = useDraggable({
    id: todo.id,
    disabled: !draggable || selectable || useSortableDnD,
    data: { todo, status: todo.status },
  });
  const sortableHook = useSortable({
    id: todo.id,
    disabled: !useSortableDnD,
    data: { todo, status: todo.status },
  });

  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortableDnD
    ? sortableHook
    : draggableHook;

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.35 : 1,
      }
    : undefined;

  return (
    <CerebroElement
      entityRef={entityRef}
      layoutId={todo.id}
      className={`kanban-card kanban-card--todo kanban-card--${todo.status}${selected ? ' kanban-card--selected' : ''}`}
      onFocusEntity={() => setFocusedEntity(entityRef)}
    >
      <div ref={setNodeRef} style={style} {...(draggable && !selectable ? { ...listeners, ...attributes } : {})}>
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
          {todo.projectIds.length ? <EntityChip ids={todo.projectIds} catalog={board.projects} /> : null}
          {todo.teamIds.length ? <EntityChip ids={todo.teamIds} catalog={board.teams} /> : null}
          {assigneeIds.length ? (
            <span className="kanban-chip">{lookupNames(assigneeIds, board.people)}</span>
          ) : todo.assigneeLabel ? (
            <span className="kanban-chip">{todo.assigneeLabel}</span>
          ) : null}
          {todo.dueAt ? (
            <span className="kanban-chip kanban-chip--due">{formatDueHint(todo.dueAt)}</span>
          ) : null}
          <span className="kanban-chip kanban-chip--muted">{SOURCE_LABELS[todo.source ?? 'extracted'] ?? todo.source}</span>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFocusedEntity(entityRef);
              setPanelOpen(true);
              askAboutEntity({
                ref: entityRef,
                prompt: `Sobre la tarea «${todo.text}» (id: ${todo.id}): `,
              });
            }}
          >
            Cerebro
          </Button>
          {todo.status === 'done' && todo.completedAt ? (
            <span className="muted kanban-done-hint">Completada {formatDate(todo.completedAt)}</span>
          ) : null}
        </div>
      </div>
    </CerebroElement>
  );
}
