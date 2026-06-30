import type { MeetingTodo } from '@shared/types.js';
import { formatDueHint } from '../../../lib/todo-daily.js';
import { Button } from '../../ds.js';
import { truncateText } from './hoy-utils.js';
import { useTodoEntityAction } from '../../lib/entity-action/use-todo-entity-action.js';

function isOverdue(t: MeetingTodo): boolean {
  if (!t.dueAt || t.status !== 'open') return false;
  const due = new Date(t.dueAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function HoyCompactTodoRow({ todo }: { todo: MeetingTodo }) {
  const { runAction, isActionPending } = useTodoEntityAction(todo);
  const overdue = isOverdue(todo);
  const dueHint = todo.dueAt ? formatDueHint(todo.dueAt) : '';

  return (
    <li
      className={`hoy-compact-todo${overdue ? ' hoy-compact-todo--overdue' : ''}${todo.status === 'suggested' ? ' hoy-compact-todo--suggested' : ''}`}
      data-cerebro-entity={`todo:${todo.id}`}
    >
      {todo.status === 'open' ? (
        <button
          type="button"
          className="todo-check hoy-compact-todo-check"
          aria-label="Marcar hecho"
          disabled={isActionPending('done')}
          onClick={() => runAction('done')}
        />
      ) : (
        <span className="hoy-compact-todo-dot" aria-hidden="true" />
      )}
      <div className="hoy-compact-todo-body">
        <span className="hoy-compact-todo-text" title={todo.text}>
          {truncateText(todo.text, 96)}
        </span>
        <span className="hoy-compact-todo-meta">
          {todo.meetingTitle ? (
            <span className="muted" title={todo.meetingTitle}>
              {truncateText(todo.meetingTitle, 36)}
            </span>
          ) : null}
          {dueHint ? (
            <span className={overdue ? 'hoy-compact-todo-due--overdue' : 'muted'}>{dueHint}</span>
          ) : null}
        </span>
      </div>
      {todo.status === 'suggested' ? (
        <div className="hoy-compact-todo-actions">
          <Button variant="secondary" size="sm" disabled={isActionPending('accept')} onClick={() => runAction('accept')}>
            ✓
          </Button>
          <Button variant="ghost" size="sm" disabled={isActionPending('dismiss')} onClick={() => runAction('dismiss')}>
            ×
          </Button>
        </div>
      ) : null}
    </li>
  );
}
