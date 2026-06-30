import { useEffect } from 'react';
import { parseEntityDomId, type EntityRef } from '@shared/cerebro-elements.js';
import { useEntityLifecycleStore } from './entity-lifecycle-store.js';

function observeEntityNodes(root: Element, observer: IntersectionObserver): void {
  if (root.hasAttribute('data-cerebro-entity')) observer.observe(root);
  root.querySelectorAll('[data-cerebro-entity]').forEach((el) => observer.observe(el));
}

/** Rastrea entidades con data-cerebro-entity visibles en viewport (IntersectionObserver). */
export function useVisibleEntitiesObserver(): void {
  const setVisibleEntities = useEntityLifecycleStore((s) => s.setVisibleEntities);

  useEffect(() => {
    const visibleKeys = new Map<string, EntityRef>();

    const publish = () => {
      setVisibleEntities([...visibleKeys.values()]);
    };

    const intersection = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const raw = entry.target.getAttribute('data-cerebro-entity');
          if (!raw) continue;
          const ref = parseEntityDomId(raw);
          if (!ref) continue;
          if (entry.isIntersecting) {
            if (!visibleKeys.has(raw)) {
              visibleKeys.set(raw, ref);
              changed = true;
            }
          } else if (visibleKeys.delete(raw)) {
            changed = true;
          }
        }
        if (changed) publish();
      },
      { root: null, rootMargin: '0px', threshold: 0.2 },
    );

    observeEntityNodes(document.body, intersection);

    let mutationTimer: ReturnType<typeof setTimeout> | undefined;
    const mutation = new MutationObserver((records) => {
      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element) observeEntityNodes(node, intersection);
          }
        }
      }, 50);
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (mutationTimer) clearTimeout(mutationTimer);
      intersection.disconnect();
      mutation.disconnect();
      setVisibleEntities([]);
    };
  }, [setVisibleEntities]);
}

export function VisibleEntitiesTracker() {
  useVisibleEntitiesObserver();
  return null;
}
