import { useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../../ds.js';
import { useOrgBoardView } from '../../hooks.js';
import { KanbanBoard, type BoardActions } from '../../components/KanbanBoard.js';
import { saveKanbanGroupBy, resolveKanbanGroupBy } from '../../lib/kanban-prefs.js';
import type { TodoGroupBy } from '@shared/todo-groups.js';

function orgActions(orgId: string): BoardActions {
  return {
    moveTodo: (id, input) => api.orgMoveTodo(orgId, id, input),
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
  const [params, setParams] = useSearchParams();
  const groupBy = resolveKanbanGroupBy(params.get('group'), orgId);

  const setGroupBy = useCallback(
    (next: TodoGroupBy) => {
      const nextParams = new URLSearchParams(params);
      if (next === 'none') nextParams.delete('group');
      else nextParams.set('group', next);
      setParams(nextParams, { replace: true });
      saveKanbanGroupBy(next, orgId);
    },
    [params, setParams, orgId],
  );

  return (
    <div>
      <PageHeader title="Tareas del equipo" desc="Tablero compartido de la organización." />
      {isPending ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <KanbanBoard
          board={data}
          actions={orgActions(orgId)}
          orgId={orgId}
          prefsScope={orgId}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
        />
      )}
    </div>
  );
}
