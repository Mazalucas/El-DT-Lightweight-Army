import type { CerebroContentBlock, EntityCardBlock, MomentCardBlock, PlanCardBlock } from '@shared/cerebro-chat.js';
import { entityDomId } from '@shared/cerebro-elements.js';
import { dismissMoment, resolveMomentKey } from '../../../lib/cerebro-context.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';
import { Button } from '../../ds.js';
import { MarkdownContent } from '../MarkdownContent.js';
import { useCerebroUi } from './CerebroProvider.js';

export function BlockRenderer({
  block,
  onAction,
  onDismissMoment,
  conversationId,
}: {
  block: CerebroContentBlock;
  onAction?: (payload: string) => void;
  onDismissMoment?: (block: MomentCardBlock) => void | Promise<void>;
  conversationId?: string;
}) {
  const { applyCue } = useCerebroUi();
  const setLifecycle = useEntityLifecycleStore((s) => s.setLifecycle);
  const clearLifecycle = useEntityLifecycleStore((s) => s.clearLifecycle);

  if (block.type === 'text') {
    return <MarkdownContent content={block.content} />;
  }

  if (block.type === 'moment_card') {
    return <MomentCardView block={block} onAction={onAction} onDismiss={onDismissMoment} conversationId={conversationId} />;
  }

  if (block.type === 'plan_card') {
    return <PlanCardView block={block} onAction={onAction} />;
  }

  if (block.type === 'entity_card') {
    return (
      <EntityCardView
        block={block}
        onHighlight={() => {
          setLifecycle(block.ref, 'ai_acting');
          applyCue({
            id: `entity:${entityDomId(block.ref)}`,
            targetId: 'nav.tareas',
            action: 'pulse',
            entityRef: block.ref,
            message: block.title,
          });
          window.setTimeout(() => clearLifecycle(block.ref), 2400);
        }}
      />
    );
  }

  return null;
}

function EntityCardView({ block, onHighlight }: { block: EntityCardBlock; onHighlight: () => void }) {
  return (
    <button
      type="button"
      className="cerebro-entity-card"
      data-cerebro-entity={entityDomId(block.ref)}
      onClick={onHighlight}
    >
      <span className="cerebro-entity-card-kind">{block.ref.kind}</span>
      <strong>{block.title}</strong>
      {block.subtitle ? <span className="muted cerebro-entity-card-sub">{block.subtitle}</span> : null}
      {block.statusLabel ? <span className="cerebro-entity-card-status">{block.statusLabel}</span> : null}
    </button>
  );
}

function MomentCardView({
  block,
  onAction,
  onDismiss,
}: {
  block: MomentCardBlock;
  onAction?: (payload: string) => void;
  onDismiss?: (block: MomentCardBlock) => void | Promise<void>;
  conversationId?: string;
}) {
  return (
    <div className="cerebro-moment-card" role="status">
      <div className="cerebro-moment-card-head">
        <span className="cerebro-moment-icon" aria-hidden="true">
          ⏱
        </span>
        <strong>{block.title}</strong>
      </div>
      <p>{block.body}</p>
      <div className="cerebro-moment-actions">
        {block.actions.map((a) => (
          <Button
            key={a.id}
            size="sm"
            variant={a.kind === 'dismiss' ? 'ghost' : 'secondary'}
            onClick={() => {
              if (a.kind === 'dismiss') {
                dismissMoment(resolveMomentKey(block));
                void onDismiss?.(block);
                return;
              }
              if (a.payload) onAction?.(a.payload);
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function PlanCardView({
  block,
  onAction,
}: {
  block: PlanCardBlock;
  onAction?: (payload: string) => void;
}) {
  const setFocusedEntity = useEntityLifecycleStore((s) => s.setFocusedEntity);
  const { applyCue } = useCerebroUi();

  return (
    <div className="cerebro-plan-card">
      <h4>{block.title}</h4>
      <p className="muted">{block.summary}</p>
      <ol className="cerebro-plan-steps">
        {block.steps.map((s) => (
          <li key={s.id} className={`cerebro-plan-step cerebro-plan-step--${s.status}`}>
            {s.entityRef ? (
              <button
                type="button"
                className="cerebro-plan-step-entity"
                data-cerebro-entity={entityDomId(s.entityRef)}
                onClick={() => {
                  setFocusedEntity(s.entityRef!);
                  applyCue({
                    id: `plan-step:${s.id}`,
                    targetId: 'nav.tareas',
                    action: 'pulse',
                    entityRef: s.entityRef,
                    message: s.label,
                  });
                }}
              >
                {s.label}
              </button>
            ) : (
              s.label
            )}
          </li>
        ))}
      </ol>
      {block.status === 'proposed' ? (
        <div className="cerebro-plan-actions">
          <Button size="sm" onClick={() => onAction?.(`confirm_plan:${block.planId}`)}>
            Confirmar plan
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction?.(`cancel_plan:${block.planId}`)}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
