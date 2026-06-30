import type { ProspectDismissUndoSnapshot } from '@shared/types.js';
import type { EnqueueAction } from './action-queue/types.js';

export type ProspectDismissApiResult = {
  store: unknown;
  undoSnapshot: ProspectDismissUndoSnapshot;
};

export function prospectDismissToastMessage(displayName: string): string {
  return `Descartado: ${displayName}`;
}

export function buildProspectDismissEnqueue<T extends ProspectDismissApiResult>(opts: {
  prospectId: string;
  displayName: string;
  dismiss: () => Promise<T>;
  restore: (snapshot: ProspectDismissUndoSnapshot) => Promise<unknown>;
  itemIds?: string[];
}): EnqueueAction<T> {
  return {
    key: `prospect:dismiss:${opts.prospectId}`,
    itemIds: opts.itemIds,
    prospectIds: [opts.prospectId],
    execute: opts.dismiss,
    successMessage: prospectDismissToastMessage(opts.displayName),
    undo: async (result) => {
      await opts.restore(result.undoSnapshot);
    },
  };
}
