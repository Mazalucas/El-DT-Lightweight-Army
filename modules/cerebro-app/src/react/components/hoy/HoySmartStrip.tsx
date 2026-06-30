import type { SmartSuggestion } from '@shared/types.js';
import { SmartSuggestionCard } from '../SmartSuggestionCard.js';

const MAX_VISIBLE = 2;

export function HoySmartStrip({ suggestions }: { suggestions: SmartSuggestion[] }) {
  if (!suggestions.length) return null;

  return (
    <section className="dash-panel hoy-strip-panel hoy-smart-strip" id="hoy-smart">
      <div className="dash-panel-head">
        <div>
          <h3>Sugerencias IA</h3>
          <p className="hoy-panel-desc">Ideas accionables basadas en reuniones y tareas recientes.</p>
        </div>
      </div>
      <div className="smart-suggestion-list hoy-smart-list">
        {suggestions.slice(0, MAX_VISIBLE).map((s) => (
          <SmartSuggestionCard key={s.id} suggestion={s} compact />
        ))}
      </div>
    </section>
  );
}
