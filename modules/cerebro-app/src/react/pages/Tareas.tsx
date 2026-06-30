import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../ds.js';
import { useBoardView } from '../hooks.js';
import { KanbanBoard, type BoardActions } from '../components/KanbanBoard.js';
import { saveKanbanGroupBy, resolveKanbanGroupBy } from '../lib/kanban-prefs.js';
import type { TodoGroupBy } from '@shared/todo-groups.js';

const personalActions: BoardActions = {
  moveTodo: (id, input) => api.moveTodo(id, input),
  createTodo: (input) => api.createTodo(input),
  updateTodo: (id, patch) => api.updateTodo(id, patch),
  acceptTodo: (id) => api.acceptTodosBatch([id]),
  dismissTodo: (id) => api.dismissTodosBatch([id]),
  acceptTodosBatch: (ids) => api.acceptTodosBatch(ids),
  dismissTodosBatch: (ids) => api.dismissTodosBatch(ids),
  completeTodo: (id) => api.completeTodosBatch([id]),
  reopenTodo: (id) => api.reopenTodosBatch([id]),
};

export default function Tareas() {
  const { data, isPending, error, refetch } = useBoardView();
  const [params, setParams] = useSearchParams();
  const groupBy = resolveKanbanGroupBy(params.get('group'));

  const setGroupBy = useCallback(
    (next: TodoGroupBy) => {
      const nextParams = new URLSearchParams(params);
      if (next === 'none') nextParams.delete('group');
      else nextParams.set('group', next);
      setParams(nextParams, { replace: true });
      saveKanbanGroupBy(next);
    },
    [params, setParams],
  );

  return (
    <div>
      <PageHeader
        title="Tareas"
        desc="Sugeridas, por hacer y hechas. Agrupá por equipo o proyecto, o usá el tablero clásico."
      />
      {isPending ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <KanbanBoard
          board={data}
          actions={personalActions}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      )}
    </div>
  );
}
