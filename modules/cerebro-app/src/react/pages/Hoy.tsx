import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { greetingForHour } from '../../lib/todo-daily.js';
import { Button, EmptyState, ErrorState, formatDate, Skeleton, toast } from '../ds.js';
import { useDashboard, useInvalidateViews } from '../hooks.js';
import { SmartSuggestionCard } from '../components/SmartSuggestionCard.js';
import { SyncButton } from '../components/SyncControls.js';
import { TodoList } from '../components/TodoItem.js';

export default function Hoy() {
  const { data, isPending, error, refetch } = useDashboard();
  const navigate = useNavigate();
  const invalidate = useInvalidateViews();

  const regenerate = useMutation({
    mutationFn: api.runIntelligence,
    onSuccess: (r) => {
      invalidate();
      toast(r.suggestions ? `${r.suggestions} sugerencias nuevas` : 'Sin sugerencias nuevas por ahora');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  if (isPending) {
    return (
      <div className="prof-dashboard">
        <Skeleton lines={6} />
      </div>
    );
  }
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  const d = data;
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="prof-dashboard">
      <header className="dash-hero">
        <div>
          <p className="dash-greeting">{greetingForHour()}</p>
          <h2 className="dash-title">Hoy</h2>
          <p className="dash-subtitle">{dateLabel}</p>
        </div>
        <div className="dash-sync-card">
          <span className="dash-sync-label">Última sincronización</span>
          <strong>{d.lastSyncAt ? formatDate(d.lastSyncAt) : d.hasGoogleIntegration ? 'Listo para sync' : 'Sin Google'}</strong>
          <SyncButton running={d.syncRunning} />
        </div>
      </header>

      {!d.setupComplete ? (
        <EmptyState
          title="Configurá la ingesta automática"
          desc="Conectá Google y elegí tus carpetas de Meet para que las reuniones entren solas."
          action={<Button onClick={() => navigate('/ajustes?section=profesional')}>Ir a Ajustes</Button>}
        />
      ) : null}

      {d.digest ? (
        <section className="hoy-digest">
          <h3 className="hoy-digest-headline">{d.digest.headline}</h3>
          <p className="hoy-digest-summary">{d.digest.summary}</p>
          {d.digest.focus.length ? (
            <ul className="hoy-focus-list">
              {d.digest.focus.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-value">{d.openTodoCount}</span>
          <span className="kpi-label">Tareas abiertas</span>
          <button type="button" className="kpi-link" onClick={() => navigate('/tareas')}>
            Ver tareas →
          </button>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-value">{d.suggestions.length}</span>
          <span className="kpi-label">Sugerencias</span>
          <span className="kpi-muted">{d.suggestedTodoCount} tareas por aceptar</span>
        </article>
        <article className="kpi-card">
          <span className="kpi-value">{d.meetingCount}</span>
          <span className="kpi-label">Reuniones</span>
          <button type="button" className="kpi-link" onClick={() => navigate('/reuniones')}>
            Ver reuniones →
          </button>
        </article>
        <article className="kpi-card">
          <span className="kpi-value">{d.peopleCount}</span>
          <span className="kpi-label">Personas</span>
          <button type="button" className="kpi-link" onClick={() => navigate('/personas')}>
            Ver personas →
          </button>
        </article>
        {d.maintenanceCount > 0 ? (
          <article className="kpi-card">
            <span className="kpi-value">{d.maintenanceCount}</span>
            <span className="kpi-label">Mantenimiento</span>
            <button type="button" className="kpi-link" onClick={() => navigate('/mantenimiento')}>
              Revisar datos →
            </button>
          </article>
        ) : null}
      </div>

      <div className="dash-grid">
        <section className="dash-panel dash-panel--suggestions">
          <div className="dash-panel-head">
            <h3>Sugerencias</h3>
            {d.hasLlmKey ? (
              <Button
                variant="ghost"
                size="sm"
                loading={regenerate.isPending}
                onClick={() => regenerate.mutate()}
              >
                Regenerar
              </Button>
            ) : null}
          </div>
          {d.suggestions.length ? (
            <div className="smart-suggestion-list">
              {d.suggestions.map((s) => (
                <SmartSuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          ) : (
            <p className="dash-empty muted">
              {d.hasLlmKey
                ? 'Sin sugerencias por ahora — se generan tras cada sincronización o con «Regenerar».'
                : 'Configurá una API key de IA en Ajustes para recibir sugerencias inteligentes.'}
            </p>
          )}
        </section>

        <section className="dash-panel dash-panel--today">
          <div className="dash-panel-head">
            <h3>Para hoy</h3>
            <Link to="/tareas" className="btn btn-ghost btn-sm">
              Ir a tareas →
            </Link>
          </div>
          <TodoList todos={d.dueTodos} empty="Nada urgente para hoy." showDue />
        </section>

        <section className="dash-panel dash-panel--meetings dash-panel--wide">
          <div className="dash-panel-head">
            <h3>Reuniones recientes</h3>
            <Link to="/reuniones" className="btn btn-ghost btn-sm">
              Ver todas →
            </Link>
          </div>
          <ul className="dash-meeting-list">
            {d.recentMeetings.length ? (
              d.recentMeetings.map((m) => (
                <li
                  key={m.id}
                  className="dash-meeting"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/reuniones/${m.id}`)}
                >
                  <div className="dash-meeting-head">
                    <span className="dash-meeting-status" title={m.analysisStatus}>
                      {m.analysisStatus === 'analyzed' ? '✓' : m.analysisStatus === 'needs_review' ? '?' : '○'}
                    </span>
                    <strong>{m.title}</strong>
                  </div>
                  <span className="muted">
                    {formatDate(m.startedAt)}
                    {m.openTodoCount ? ` · ${m.openTodoCount} tareas` : ''}
                  </span>
                  {m.summary ? (
                    <p className="dash-meeting-summary">
                      {m.summary.slice(0, 120)}
                      {m.summary.length > 120 ? '…' : ''}
                    </p>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="dash-empty muted">Sin reuniones indexadas — conectá Google y sincronizá.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
