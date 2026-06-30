import type { BoardView, MeetingTodo } from '@shared/types.js';
import type { TodoGroup } from '@shared/todo-groups.js';
import { EmptyState } from '../ds.js';
import { TodoCard } from './entity/TodoCard.js';
import { STATUS_SECTIONS, sortKanbanTodos, type TodoCardAction, formatGroupCounts } from './kanban-shared.js';

export type GroupedListHandlers = {
  onAction: (action: TodoCardAction, todo: MeetingTodo) => void;
  onEdit: (todo: MeetingTodo) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onBatchAccept: (ids: string[]) => void;
  collapsedGroupIds: Set<string>;
  onToggleGroupCollapsed: (groupId: string) => void;
  collapsedDoneSections: Set<string>;
  onToggleDoneSection: (groupId: string) => void;
};

export function KanbanGroupedList({
  groups,
  board,
  orgId,
  handlers,
}: {
  groups: TodoGroup[];
  board: BoardView;
  orgId?: string;
  handlers: GroupedListHandlers;
}) {
  if (!groups.length) {
    return <EmptyState title="Sin tareas" desc="Creá una tarea o aceptá sugerencias." />;
  }

  return (
    <div className="kanban-grouped-list">
      {groups.map((group) => (
        <KanbanGroupSection
          key={group.id}
          group={group}
          board={board}
          orgId={orgId}
          handlers={handlers}
        />
      ))}
    </div>
  );
}

function KanbanGroupSection({
  group,
  board,
  orgId,
  handlers,
}: {
  group: TodoGroup;
  board: BoardView;
  orgId?: string;
  handlers: GroupedListHandlers;
}) {
  const collapsed = handlers.collapsedGroupIds.has(group.id);
  const suggested = sortKanbanTodos(group.todos.filter((t) => t.status === 'suggested'));
  const open = sortKanbanTodos(group.todos.filter((t) => t.status === 'open'));
  const done = sortKanbanTodos(group.todos.filter((t) => t.status === 'done'));
  const doneCollapsed = handlers.collapsedDoneSections.has(group.id);

  return (
    <section className="kanban-group" data-group-id={group.id}>
      <header className="kanban-group-header">
        <button
          type="button"
          className="kanban-group-toggle"
          aria-expanded={!collapsed}
          onClick={() => handlers.onToggleGroupCollapsed(group.id)}
        >
          <span className="kanban-group-chevron" aria-hidden="true">
            {collapsed ? '▸' : '▾'}
          </span>
          {group.color ? (
            <span className="kanban-group-dot" style={{ background: group.color }} aria-hidden="true" />
          ) : null}
          <span className="kanban-group-name">{group.label}</span>
          <span className="kanban-group-counts muted">{formatGroupCounts(group.counts)}</span>
        </button>
        {suggested.length && !collapsed ? (
          <button
            type="button"
            className="kanban-group-batch-link"
            onClick={() => handlers.onBatchAccept(suggested.map((t) => t.id))}
          >
            Aceptar todas las sugeridas ({suggested.length})
          </button>
        ) : null}
      </header>

      {!collapsed ? (
        <div className="kanban-group-body">
          {STATUS_SECTIONS.map((section) => {
            const items =
              section.id === 'suggested' ? suggested : section.id === 'open' ? open : done;
            if (!items.length) return null;
            const sectionCollapsed = section.id === 'done' && doneCollapsed;
            return (
              <div key={section.id} className={`kanban-group-status kanban-group-status--${section.id}`}>
                <button
                  type="button"
                  className="kanban-group-status-head"
                  aria-expanded={!sectionCollapsed}
                  onClick={() => {
                    if (section.id === 'done') handlers.onToggleDoneSection(group.id);
                  }}
                  disabled={section.id !== 'done'}
                >
                  <span>{section.title}</span>
                  <span className="kanban-group-status-count">{items.length}</span>
                  {section.id === 'done' ? (
                    <span className="kanban-group-chevron kanban-group-chevron--sm" aria-hidden="true">
                      {sectionCollapsed ? '▸' : '▾'}
                    </span>
                  ) : null}
                </button>
                {!sectionCollapsed ? (
                  <div className="kanban-group-cards">
                    {items.map((t) => (
                      <TodoCard
                        key={t.id}
                        todo={t}
                        board={board}
                        orgId={orgId}
                        onAction={handlers.onAction}
                        onEdit={handlers.onEdit}
                        draggable={false}
                        selectable={t.status === 'suggested'}
                        selected={handlers.selectedIds.has(t.id)}
                        onToggleSelect={() => handlers.onToggleSelect(t.id)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
