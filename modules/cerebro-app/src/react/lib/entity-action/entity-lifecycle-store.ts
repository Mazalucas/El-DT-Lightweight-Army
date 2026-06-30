import { create } from 'zustand';
import type { ElementLifecycle, EntityRef } from '@shared/cerebro-elements.js';
import { entityDomId } from '@shared/cerebro-elements.js';

function sameEntityRefs(a: EntityRef[], b: EntityRef[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].kind !== b[i].kind || a[i].id !== b[i].id) return false;
  }
  return true;
}

interface LifecycleState {
  byKey: Record<string, ElementLifecycle>;
  focusedEntity: EntityRef | null;
  visibleEntities: EntityRef[];
  setLifecycle: (ref: EntityRef, lifecycle: ElementLifecycle) => void;
  clearLifecycle: (ref: EntityRef) => void;
  setFocusedEntity: (ref: EntityRef | null) => void;
  setVisibleEntities: (refs: EntityRef[]) => void;
}

export const useEntityLifecycleStore = create<LifecycleState>((set) => ({
  byKey: {},
  focusedEntity: null,
  visibleEntities: [],
  setLifecycle: (ref, lifecycle) =>
    set((s) => ({ byKey: { ...s.byKey, [entityDomId(ref)]: lifecycle } })),
  clearLifecycle: (ref) =>
    set((s) => {
      const key = entityDomId(ref);
      if (!(key in s.byKey)) return s;
      const next = { ...s.byKey };
      delete next[key];
      return { byKey: next };
    }),
  setFocusedEntity: (focusedEntity) => set({ focusedEntity }),
  setVisibleEntities: (visibleEntities) =>
    set((s) => (sameEntityRefs(s.visibleEntities, visibleEntities) ? s : { visibleEntities })),
}));

export function getEntityLifecycle(ref: EntityRef): ElementLifecycle {
  return useEntityLifecycleStore.getState().byKey[entityDomId(ref)] ?? 'idle';
}
