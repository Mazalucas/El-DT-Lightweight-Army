import { Link } from 'react-router-dom';
import type { DashboardAttention, DashboardDailyTodos } from '@shared/types.js';
import { HoyCompactTodoRow } from './HoyCompactTodoRow.js';

const MAX_VISIBLE = 4;

export function HoyUrgentStrip({
  dailyTodos,
  attention,
}: {
  dailyTodos: DashboardDailyTodos;
  attention: DashboardAttention;
}) {
  const urgent = [...dailyTodos.overdue, ...dailyTodos.today];
  if (!urgent.length) return null;

  const total = attention.overdueCount + attention.todayCount;
  const rest = total - Math.min(MAX_VISIBLE, urgent.length);

  return (
    <section className="dash-panel hoy-strip-panel" id="hoy-urgent">
      <div className="dash-panel-head">
        <div>
          <h3>Tareas urgentes</h3>
          <p className="hoy-panel-desc">Vencidas o con fecha hoy — lo mínimo para no perderte plazos.</p>
        </div>
        <Link to="/tareas" className="btn btn-ghost btn-sm">
          Tablero →
        </Link>
      </div>
      <ul className="hoy-compact-todo-list">
        {urgent.slice(0, MAX_VISIBLE).map((t) => (
          <HoyCompactTodoRow key={t.id} todo={t} />
        ))}
      </ul>
      {rest > 0 ? (
        <Link to="/tareas" className="hoy-strip-more muted">
          +{rest} más en Tareas
        </Link>
      ) : null}
    </section>
  );
}
