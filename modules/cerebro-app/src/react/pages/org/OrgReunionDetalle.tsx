import { Link, useParams } from 'react-router-dom';
import { Badge, ErrorState, formatDate, PageHeader, Section, Skeleton } from '../../ds.js';
import { useOrgMeetingDetail } from '../../hooks.js';
import { TodoList } from '../../components/TodoItem.js';

export default function OrgReunionDetalle() {
  const { orgId = '', id = '' } = useParams();
  const { data, isPending, error, refetch } = useOrgMeetingDetail(orgId, id);

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  const { meeting, todos, people, prospects, projects, teams } = data;

  return (
    <div>
      <PageHeader
        title={meeting.title}
        desc={`${formatDate(meeting.startedAt)} · ${meeting.participants.length} participantes`}
        actions={
          <Link to={`/org/${orgId}/reuniones`} className="btn btn-ghost btn-sm">
            ← Reuniones
          </Link>
        }
      />

      <div className="chip-row" style={{ marginBottom: 'var(--space-4)' }}>
        {teams.map((t) => (
          <Badge key={t.id} tone="accent">
            {t.name}
          </Badge>
        ))}
        {projects.map((p) => (
          <Badge key={p.id}>{p.name}</Badge>
        ))}
      </div>

      {meeting.summary ? (
        <Section title="Resumen">
          <p className="md-content">{meeting.summary}</p>
        </Section>
      ) : null}

      <Section title={`Tareas (${todos.length})`}>
        <TodoList todos={todos} empty="Sin tareas extraídas de esta reunión." showDue readonly />
      </Section>

      <Section title="Personas">
        {people.length || prospects.length ? (
          <div className="chip-row">
            {people.map((p) => (
              <span key={p.id} className="badge badge-accent">
                {p.displayName}
              </span>
            ))}
            {prospects.map((p) => (
              <span key={p.id} className="badge" title="Detectado en notas, sin email confirmado">
                {p.displayName} ?
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">Sin participantes resueltos.</p>
        )}
      </Section>

      {meeting.actionItems?.length ? (
        <Section title="Action items del documento">
          <ul className="hoy-focus-list">
            {meeting.actionItems.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
