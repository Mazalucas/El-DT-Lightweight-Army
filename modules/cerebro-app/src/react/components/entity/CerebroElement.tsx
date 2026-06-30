import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { ElementLifecycle, EntityRef } from '@shared/cerebro-elements.js';
import { entityDomId } from '@shared/cerebro-elements.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';
import { AiActingOverlay } from './AiActingOverlay.js';

const lifecycleClass: Record<ElementLifecycle, string> = {
  idle: '',
  dragging: 'cerebro-element--dragging',
  pending: 'cerebro-element--pending',
  ai_acting: 'cerebro-element--ai-acting',
  entering: 'cerebro-element--entering',
  exiting: 'cerebro-element--exiting',
  error: 'cerebro-element--error',
};

export function CerebroElement({
  entityRef,
  children,
  className = '',
  layoutId,
  onFocusEntity,
}: {
  entityRef: EntityRef;
  children: ReactNode;
  className?: string;
  layoutId?: string;
  onFocusEntity?: () => void;
}) {
  const lifecycle = useEntityLifecycleStore((s) => s.byKey[entityDomId(entityRef)] ?? 'idle');

  return (
    <motion.div
      layout={Boolean(layoutId)}
      layoutId={layoutId}
      className={`cerebro-element ${lifecycleClass[lifecycle]} ${className}`.trim()}
      data-cerebro-entity={entityDomId(entityRef)}
      initial={lifecycle === 'entering' ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onClick={onFocusEntity}
    >
      <AiActingOverlay lifecycle={lifecycle} />
      {children}
    </motion.div>
  );
}
