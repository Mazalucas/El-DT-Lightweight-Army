import { useMutation } from '@tanstack/react-query';
import { toast } from '../../../lib/ui.js';
import { useOptionalActionQueue } from '../action-queue/ActionQueueProvider.js';
import type { EnqueueAction } from '../action-queue/types.js';

type EntityMutationOpts<T> = Omit<EnqueueAction<T>, 'key'> & {
  key: string;
};

/** Encola mutación con entityMutation o ejecuta fallback con useMutation. */
export function useEntityMutation() {
  const queue = useOptionalActionQueue();

  function enqueue<T>(opts: EntityMutationOpts<T>): void {
    if (queue) {
      queue.enqueue({ ...opts, entityMutation: opts.entityMutation ?? true });
      return;
    }
    void opts.execute().then(
      () => {
        const message =
          typeof opts.successMessage === 'function'
            ? opts.successMessage(undefined as T)
            : opts.successMessage;
        toast(message);
      },
      (e) => toast(opts.errorMessage ?? (e instanceof Error ? e.message : 'Error'), 'error'),
    );
  }

  function useEntityMutate<T>(
    key: string,
    mutationFn: () => Promise<T>,
    messages: {
      success: string | ((result: T) => string);
      error?: string;
    },
    extra?: Partial<EnqueueAction<T>>,
  ) {
    const mutate = useMutation({
      mutationFn,
      onSuccess: (result) => {
        const message = typeof messages.success === 'function' ? messages.success(result) : messages.success;
        toast(message);
      },
      onError: (e) => toast(messages.error ?? (e instanceof Error ? e.message : 'Error'), 'error'),
    });

    const run = (): Promise<T | void> => {
      if (queue) {
        queue.enqueue({
          key,
          entityMutation: true,
          execute: mutationFn,
          successMessage: messages.success,
          errorMessage: messages.error,
          ...extra,
        });
        return Promise.resolve();
      }
      return mutate.mutateAsync();
    };

    return { run, isPending: queue?.isPending(key) ?? mutate.isPending };
  }

  return { enqueue, useEntityMutate, hasQueue: Boolean(queue) };
}
