import type { MeetingTodo } from '@shared/types.js';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { formatDueHint } from '../../lib/todo-daily.js';
import { Button, toast } from '../ds.js';
import { useInvalidateViews } from '../hooks.js';

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
}: {
  todo: MeetingTodo;
  showDue?: boolean;
  /** Sin acciones — para scopes donde las mutaciones personales no aplican (org). */
  readonly?: boolean;
}) {
  const invalidate = useInvalidateViews();

  const mutate = useMutation({
    mutationFn: async (action: 'done' | 'accept' | 'dismiss') => {
      if (action === 'done') await api.completeTodosBatch([todo.id]);
      if (action === 'accept') await api.acceptTodosBatch([todo.id]);
      if (action === 'dismiss') await api.dismissTodosBatch([todo.id]);
    },
    onSuccess: invalidate,
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const overdue = isOverdue(todo);
  const dueHint = showDue && todo.dueAt ? formatDueHint(todo.dueAt) : '';

  return (
    <li
      className={`todo-item${todo.status === 'suggested' ? ' todo-item--suggested' : ''}${overdue ? ' todo-item--overdue' : ''}`}
    >
      {todo.status === 'open' && !readonly ? (
        <button
          type="button"
          className="todo-check"
          aria-label="Marcar hecho"
          disabled={mutate.isPending}
          onClick={() => mutate.mutate('done')}
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
          <Button variant="secondary" size="sm" disabled={mutate.isPending} onClick={() => mutate.mutate('accept')}>
            Aceptar
          </Button>
          <Button variant="ghost" size="sm" disabled={mutate.isPending} onClick={() => mutate.mutate('dismiss')}>
            Descartar
          </Button>
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
}: {
  todos: MeetingTodo[];
  empty: string;
  showDue?: boolean;
  readonly?: boolean;
}) {
  if (!todos.length) {
    return (
      <ul className="todo-list">
        <li className="dash-empty muted">{empty}</li>
      </ul>
    );
  }
  return (
    <ul className="todo-list">
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} showDue={showDue} readonly={readonly} />
      ))}
    </ul>
  );
}
