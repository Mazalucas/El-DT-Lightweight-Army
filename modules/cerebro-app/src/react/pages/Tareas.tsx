import { api } from '../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../ds.js';
import { useBoardView } from '../hooks.js';
import { KanbanBoard, type BoardActions } from '../components/KanbanBoard.js';

const personalActions: BoardActions = {
  moveTodo: (id, status) => api.moveTodo(id, { status }),
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

  return (
    <div>
      <PageHeader
        title="Tareas"
        desc="Sugeridas por tus reuniones, por hacer y hechas. Arrastrá entre columnas."
      />
      {isPending ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <KanbanBoard board={data} actions={personalActions} />
      )}
    </div>
  );
}
