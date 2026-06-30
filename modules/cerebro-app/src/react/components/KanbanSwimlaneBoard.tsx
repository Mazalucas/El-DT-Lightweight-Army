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
import { useState } from 'react';
import type { BoardView, MeetingTodo, MoveTodoInput, UpdateTodoInput } from '@shared/types.js';
import {
  NONE_GROUP_ID,
  groupColumnDroppableId,
  parseGroupColumnDroppableId,
  resolveTodoGroupId,
  type TodoGroup,
  type TodoGroupBy,
} from '@shared/todo-groups.js';
import { Button, EmptyState } from '../ds.js';
import { EntityGhost } from './entity/EntityGhost.js';
import { TodoCard } from './entity/TodoCard.js';
import { KANBAN_COLUMNS, sortKanbanTodos, type TodoCardAction } from './kanban-shared.js';

function SwimlaneColumnBody({
  droppableId,
  children,
}: {
  droppableId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  return (
    <div
      ref={setNodeRef}
      className={`kanban-swimlane-cell-body${isOver ? ' kanban-column--drag-over' : ''}`}
    >
      {children}
    </div>
  );
}

export type SwimlaneHandlers = {
  onAction: (action: TodoCardAction, todo: MeetingTodo) => void;
  onEdit: (todo: MeetingTodo) => void;
  onMove: (todoId: string, input: MoveTodoInput) => void;
  onUpdateEntity: (todoId: string, patch: UpdateTodoInput) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAllSuggested: (ids: string[]) => void;
  suggestedVisibleByGroup: Map<string, number>;
  onShowMoreSuggested: (groupId: string, increment: number) => void;
};

const SUGGESTED_PAGE_SIZE = 40;

export function KanbanSwimlaneBoard({
  groups,
  groupBy,
  board,
  orgId,
  handlers,
}: {
  groups: TodoGroup[];
  groupBy: Exclude<TodoGroupBy, 'none'>;
  board: BoardView;
  orgId?: string;
  handlers: SwimlaneHandlers;
}) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function todosInCell(groupId: string, status: MeetingTodo['status']): MeetingTodo[] {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    const list = sortKanbanTodos(group.todos.filter((t) => t.status === status));
    if (status !== 'suggested') return list;
    const visible = handlers.suggestedVisibleByGroup.get(groupId) ?? SUGGESTED_PAGE_SIZE;
    return list.slice(0, visible);
  }

  function totalInCell(groupId: string, status: MeetingTodo['status']): number {
    const group = groups.find((g) => g.id === groupId);
    return group?.todos.filter((t) => t.status === status).length ?? 0;
  }

  function entityPatchForGroup(groupId: string): UpdateTodoInput {
    if (groupBy === 'team') {
      return { teamIds: groupId === NONE_GROUP_ID ? [] : [groupId] };
    }
    return { projectIds: groupId === NONE_GROUP_ID ? [] : [groupId] };
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const todoId = String(active.id);
    const todo = board.todos.find((t) => t.id === todoId);
    if (!todo) return;

    const overId = String(over.id);
    const sourceGroupId = resolveTodoGroupId(todo, groupBy);

    const columnDrop = parseGroupColumnDroppableId(overId);
    if (columnDrop) {
      const { groupId: targetGroupId, status: targetStatus } = columnDrop;
      applyCrossCellMove(todo, targetGroupId, targetStatus, sourceGroupId);
      return;
    }

    const overTodo = board.todos.find((t) => t.id === overId);
    if (!overTodo) return;

    const targetGroupId = resolveTodoGroupId(overTodo, groupBy);
    if (overTodo.status === todo.status && overId !== todoId && targetGroupId === sourceGroupId) {
      const columnTodos = todosInCell(sourceGroupId, todo.status);
      const oldIndex = columnTodos.findIndex((t) => t.id === todoId);
      const newIndex = columnTodos.findIndex((t) => t.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const reordered = arrayMove(columnTodos, oldIndex, newIndex);
      const rank = reordered.findIndex((t) => t.id === todoId);
      const boardPosition = (reordered.length - rank) * 1000 + (Date.now() % 1000);
      handlers.onMove(todoId, { status: todo.status, boardPosition });
      return;
    }

    applyCrossCellMove(todo, targetGroupId, overTodo.status, sourceGroupId);
  }

  function applyCrossCellMove(
    todo: MeetingTodo,
    targetGroupId: string,
    targetStatus: MeetingTodo['status'],
    sourceGroupId: string,
  ) {
    const todoId = todo.id;
    const statusChanged = targetStatus !== todo.status;
    const groupChanged = targetGroupId !== sourceGroupId;

    if (statusChanged) {
      handlers.onMove(todoId, { status: targetStatus, boardPosition: Date.now() });
    }
    if (groupChanged) {
      handlers.onUpdateEntity(todoId, entityPatchForGroup(targetGroupId));
    }
  }

  if (!groups.length) {
    return <EmptyState title="Sin tareas" desc="Creá una tarea o aceptá sugerencias." />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveDragId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-swimlanes-scroll">
        <div className="kanban-swimlanes">
          <div className="kanban-swimlane-head-row" aria-hidden="true">
            <div className="kanban-swimlane-label-col" />
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.id} className="kanban-swimlane-col-head">
                {col.title}
              </div>
            ))}
          </div>

          {groups.map((group) => {
            const suggestedAll = group.todos.filter((t) => t.status === 'suggested');
            const suggestedVisible = handlers.suggestedVisibleByGroup.get(group.id) ?? SUGGESTED_PAGE_SIZE;
            const remainingSuggested = suggestedAll.length - Math.min(suggestedAll.length, suggestedVisible);

            return (
              <div key={group.id} className="kanban-swimlane-row">
                <div className="kanban-swimlane-label-col">
                  {group.color ? (
                    <span className="kanban-group-dot" style={{ background: group.color }} aria-hidden="true" />
                  ) : null}
                  <span className="kanban-swimlane-label">{group.label}</span>
                </div>

                {KANBAN_COLUMNS.map((col) => {
                  const droppableId = groupColumnDroppableId(group.id, col.id);
                  const todos = todosInCell(group.id, col.id);
                  const total = totalInCell(group.id, col.id);
                  const allSuggestedSelected =
                    col.id === 'suggested' &&
                    suggestedAll.length > 0 &&
                    suggestedAll.every((t) => handlers.selectedIds.has(t.id));

                  return (
                    <section key={col.id} className="kanban-swimlane-col">
                      <header className="kanban-swimlane-col-meta">
                        <span className="kanban-column-count kanban-column-count--active">{total}</span>
                        {col.id === 'suggested' && suggestedAll.length ? (
                          <button
                            type="button"
                            className="kanban-select-all-link"
                            onClick={() =>
                              handlers.onToggleSelectAllSuggested(suggestedAll.map((t) => t.id))
                            }
                          >
                            {allSuggestedSelected ? 'Deseleccionar' : 'Sel. todas'}
                          </button>
                        ) : null}
                      </header>
                      <SwimlaneColumnBody droppableId={droppableId}>
                        <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                          {todos.length ? (
                            todos.map((t) => (
                              <TodoCard
                                key={t.id}
                                todo={t}
                                board={board}
                                orgId={orgId}
                                onAction={handlers.onAction}
                                onEdit={handlers.onEdit}
                                draggable={col.id !== 'suggested'}
                                sortable={col.id !== 'suggested'}
                                selectable={col.id === 'suggested'}
                                selected={handlers.selectedIds.has(t.id)}
                                onToggleSelect={() => handlers.onToggleSelect(t.id)}
                              />
                            ))
                          ) : (
                            <p className="muted kanban-swimlane-empty">Vacío</p>
                          )}
                        </SortableContext>
                        {col.id === 'suggested' && remainingSuggested > 0 ? (
                          <div className="kanban-more-row">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handlers.onShowMoreSuggested(group.id, SUGGESTED_PAGE_SIZE)
                              }
                            >
                              Ver más ({remainingSuggested})
                            </Button>
                          </div>
                        ) : null}
                      </SwimlaneColumnBody>
                    </section>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeDragId ? (
          <EntityGhost label={board.todos.find((t) => t.id === activeDragId)?.text ?? 'Moviendo…'} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
