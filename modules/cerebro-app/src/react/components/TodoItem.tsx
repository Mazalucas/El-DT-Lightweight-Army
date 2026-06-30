import type { MeetingTodo } from '@shared/types.js';
import { formatDueHint } from '../../lib/todo-daily.js';
import { AsyncActionButton } from './AsyncActionButton.js';
import { useTodoEntityAction } from '../lib/entity-action/use-todo-entity-action.js';

function isOverdue(t: MeetingTodo): boolean {
  if (!t.dueAt || t.status !== 'open') return false;
  const due = new Date(t.dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function TodoItem({
  todo,
  showDue = true,
  readonly = false,
  orgId,
}: {
  todo: MeetingTodo;
  showDue?: boolean;
  readonly?: boolean;
  orgId?: string;
}) {
  const { runAction, isActionPending } = useTodoEntityAction(todo, orgId);

  const overdue = isOverdue(todo);
  const dueHint = showDue && todo.dueAt ? formatDueHint(todo.dueAt) : '';

  return (
    <li
      className={`todo-item${todo.status === 'suggested' ? ' todo-item--suggested' : ''}${overdue ? ' todo-item--overdue' : ''}`}
      data-cerebro-entity={`todo:${todo.id}`}
    >
      {todo.status === 'open' && !readonly ? (
        <button
          type="button"
          className="todo-check"
          aria-label="Marcar hecho"
          disabled={isActionPending('done')}
          onClick={() => runAction('done')}
        />
      ) : null}
      <div className="dash-todo-body">
        <span className="dash-todo-text">{todo.text}</span>
        {todo.meetingTitle ? <span className="muted dash-todo-meta">{todo.meetingTitle}</span> : null}
        {dueHint ? (
          <span className={`dash-todo-due${overdue ? ' dash-todo-due--overdue' : ''}`}>{dueHint}</span>
        ) : null}
      </div>
      {todo.status === 'suggested' && !readonly ? (
        <div className="todo-actions">
          <AsyncActionButton pending={isActionPending('accept')} onClick={() => runAction('accept')}>
            Aceptar
          </AsyncActionButton>
          <AsyncActionButton variant="ghost" pending={isActionPending('dismiss')} onClick={() => runAction('dismiss')}>
            Descartar
          </AsyncActionButton>
        </div>
      ) : null}
    </li>
  );
}

export function TodoList({
  todos,
  empty,
  showDue,
  readonly,
  orgId,
}: {
  todos: MeetingTodo[];
  empty?: string;
  showDue?: boolean;
  readonly?: boolean;
  orgId?: string;
}) {
  if (!todos.length) {
    return empty ? <p className="muted">{empty}</p> : null;
  }
  return (
    <ul className="todo-list">
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} showDue={showDue} readonly={readonly} orgId={orgId} />
      ))}
    </ul>
  );
}
