import { Link } from 'react-router-dom';
import type { DashboardAttention, DashboardDailyTodos } from '@shared/types.js';
import { HoyCompactTodoRow } from './HoyCompactTodoRow.js';

const MAX_VISIBLE = 3;

export function HoyPendingStrip({
  dailyTodos,
  attention,
}: {
  dailyTodos: DashboardDailyTodos;
  attention: DashboardAttention;
}) {
  if (!dailyTodos.suggested.length) return null;

  const rest = attention.suggestedCount - MAX_VISIBLE;

  return (
    <section className="dash-panel hoy-strip-panel" id="hoy-pending">
      <div className="dash-panel-head">
        <div>
          <h3>Pasos de reuniones</h3>
          <p className="hoy-panel-desc">Detectados en notas — aceptá solo lo que vas a hacer.</p>
        </div>
        <Link to="/tareas" className="btn btn-ghost btn-sm">
          Ver todas →
        </Link>
      </div>
      <ul className="hoy-compact-todo-list">
        {dailyTodos.suggested.slice(0, MAX_VISIBLE).map((t) => (
          <HoyCompactTodoRow key={t.id} todo={t} />
        ))}
      </ul>
      {rest > 0 ? (
        <Link to="/tareas" className="hoy-strip-more muted">
          +{rest} más en el tablero
        </Link>
      ) : null}
    </section>
  );
}
