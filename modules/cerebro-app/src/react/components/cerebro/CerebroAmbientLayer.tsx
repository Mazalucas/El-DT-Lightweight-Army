import { useEffect, useState } from 'react';
import type { UiCue } from '@shared/cerebro-chat.js';
import { entityDomId } from '@shared/cerebro-elements.js';
import { getUiTarget } from '@shared/cerebro-ui-registry.js';
import { useCerebroUi } from './CerebroProvider.js';

function findCueRect(cue: UiCue): DOMRect | null {
  if (cue.entityRef) {
    const el = document.querySelector(`[data-cerebro-entity="${entityDomId(cue.entityRef)}"]`);
    if (el) return el.getBoundingClientRect();
  }
  const el = document.querySelector(`[data-cerebro-target="${cue.targetId}"]`);
  return el?.getBoundingClientRect() ?? null;
}

export function CerebroAmbientLayer() {
  const { activeCue, clearCue } = useCerebroUi();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!activeCue) {
      setRect(null);
      return;
    }
    const update = () => setRect(findCueRect(activeCue));
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const id = window.setInterval(update, 500);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      window.clearInterval(id);
    };
  }, [activeCue]);

  if (!activeCue || !rect) return null;

  const target = getUiTarget(activeCue.targetId);
  const pad = 6;

  return (
    <div className="cerebro-ambient-root" aria-live="polite">
      <div className="cerebro-ambient-scrim" onClick={clearCue} />
      <div
        className={`cerebro-ambient-spotlight${activeCue.entityRef ? ' cerebro-ambient-spotlight--entity' : ''}`}
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />
      <div
        className="cerebro-ambient-tooltip"
        style={{ top: Math.min(rect.bottom + 12, window.innerHeight - 80), left: rect.left }}
      >
        <p>{activeCue.message ?? target?.label ?? activeCue.targetId}</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={clearCue}>
          Entendido
        </button>
      </div>
    </div>
  );
}
