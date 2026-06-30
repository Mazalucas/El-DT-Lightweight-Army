import { useNavigate, Link } from 'react-router-dom';
import type { MeetingListItem } from '@shared/types.js';
import { formatDate } from '../../ds.js';

export function HoyRecentMeetings({ meetings, limit = 4 }: { meetings: MeetingListItem[]; limit?: number }) {
  const navigate = useNavigate();
  const visible = meetings.slice(0, limit);
  const rest = meetings.length - visible.length;

  return (
    <section className="dash-panel dash-panel--meetings hoy-recent-panel">
      <div className="dash-panel-head">
        <div>
          <h3>Reuniones recientes</h3>
          <p className="hoy-panel-desc">Contexto de los últimos días — acceso rápido a notas y tareas.</p>
        </div>
        <Link to="/reuniones" className="btn btn-ghost btn-sm">
          {rest > 0 ? `Ver todas (${meetings.length}) →` : 'Ver todas →'}
        </Link>
      </div>
      <ul className="dash-meeting-list hoy-recent-list">
        {visible.length ? (
          visible.map((m) => (
            <li
              key={m.id}
              className={`dash-meeting hoy-recent-item${m.openTodoCount ? ' dash-meeting--pending' : ''}${m.analysisStatus === 'needs_review' ? ' dash-meeting--review' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/reuniones/${m.id}`)}
            >
              <div className="dash-meeting-head">
                <span className="dash-meeting-status" title={m.analysisStatus}>
                  {m.analysisStatus === 'analyzed' ? '✓' : m.analysisStatus === 'needs_review' ? '?' : '○'}
                </span>
                <strong className="hoy-recent-title">{m.title}</strong>
              </div>
              <span className="muted hoy-recent-meta">
                {formatDate(m.displayDate ?? m.startedAt)}
                {m.openTodoCount ? ` · ${m.openTodoCount} tareas` : ''}
              </span>
            </li>
          ))
        ) : (
          <li className="dash-empty muted">Sin reuniones indexadas — conectá Google y sincronizá.</li>
        )}
      </ul>
    </section>
  );
}
