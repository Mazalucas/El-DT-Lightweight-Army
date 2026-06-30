import { useMutation } from '@tanstack/react-query';
import type { MeetingTodo } from '@shared/types.js';
import { api } from '../../../lib/api.js';
import { toast } from '../../ds.js';
import { useInvalidateViews } from '../../hooks.js';
import { useOptionalActionQueue } from '../action-queue/ActionQueueProvider.js';

const STATUS_MAP = {
  done: 'done',
  accept: 'open',
  dismiss: 'dismissed',
} as const satisfies Record<'done' | 'accept' | 'dismiss', MeetingTodo['status']>;

const LABELS: Record<'done' | 'accept' | 'dismiss', string> = {
  done: 'Marcado como hecho',
  accept: 'Sugerencia aceptada',
  dismiss: 'Descartado',
};

async function runTodoApi(action: 'done' | 'accept' | 'dismiss', todoId: string, orgId?: string): Promise<void> {
  if (orgId) {
    if (action === 'done') await api.orgCompleteTodosBatch(orgId, [todoId]);
    if (action === 'accept') await api.orgAcceptTodosBatch(orgId, [todoId]);
    if (action === 'dismiss') await api.orgDismissTodosBatch(orgId, [todoId]);
    return;
  }
  if (action === 'done') await api.completeTodosBatch([todoId]);
  if (action === 'accept') await api.acceptTodosBatch([todoId]);
  if (action === 'dismiss') await api.dismissTodosBatch([todoId]);
}

export function useTodoEntityAction(todo: MeetingTodo, orgId?: string) {
  const invalidate = useInvalidateViews();
  const queue = useOptionalActionQueue();

  const mutate = useMutation({
    mutationFn: (action: 'done' | 'accept' | 'dismiss') => runTodoApi(action, todo.id, orgId),
    onSuccess: (_data, action) => {
      invalidate();
      toast(LABELS[action]);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const runAction = (action: 'done' | 'accept' | 'dismiss') => {
    if (queue) {
      queue.enqueue({
        key: `todo:${todo.id}:${action}`,
        entityMutation: true,
        orgId,
        todoMove: { todoId: todo.id, status: STATUS_MAP[action], orgId },
        execute: () => runTodoApi(action, todo.id, orgId),
        successMessage: LABELS[action],
      });
      return;
    }
    mutate.mutate(action);
  };

  const isActionPending = (action: string) =>
    queue?.isPending(`todo:${todo.id}:${action}`) ?? mutate.isPending;

  return { runAction, isActionPending };
}
