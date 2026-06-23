import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../../ds.js';
import { useOrgBoardView } from '../../hooks.js';
import { KanbanBoard, type BoardActions } from '../../components/KanbanBoard.js';

function orgActions(orgId: string): BoardActions {
  return {
    moveTodo: (id, status) => api.orgMoveTodo(orgId, id, { status }),
    createTodo: (input) => api.orgCreateTodo(orgId, input),
    updateTodo: (id, patch) => api.orgUpdateTodo(orgId, id, patch),
    acceptTodo: (id) => api.orgAcceptTodosBatch(orgId, [id]),
    dismissTodo: (id) => api.orgDismissTodosBatch(orgId, [id]),
    acceptTodosBatch: (ids) => api.orgAcceptTodosBatch(orgId, ids),
    dismissTodosBatch: (ids) => api.orgDismissTodosBatch(orgId, ids),
    completeTodo: (id) => api.orgCompleteTodosBatch(orgId, [id]),
    reopenTodo: (id) => api.orgReopenTodosBatch(orgId, [id]),
  };
}

export default function OrgTareas() {
  const { orgId = '' } = useParams();
  const { data, isPending, error, refetch } = useOrgBoardView(orgId);

  return (
    <div>
      <PageHeader title="Tareas del equipo" desc="Tablero compartido de la organización." />
      {isPending ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <KanbanBoard board={data} actions={orgActions(orgId)} />
      )}
    </div>
  );
}
