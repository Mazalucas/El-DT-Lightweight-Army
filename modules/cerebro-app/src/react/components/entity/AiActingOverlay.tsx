import type { ElementLifecycle } from '@shared/cerebro-elements.js';

export function AiActingOverlay({ lifecycle }: { lifecycle: ElementLifecycle }) {
  if (lifecycle !== 'ai_acting') return null;
  return (
    <div className="cerebro-ai-acting-overlay" aria-hidden="true">
      <span className="cerebro-ai-acting-pulse" />
    </div>
  );
}
