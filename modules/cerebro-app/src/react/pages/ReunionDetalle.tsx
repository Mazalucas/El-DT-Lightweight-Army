import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Badge, Button, ErrorState, formatDate, PageHeader, Section, Skeleton } from '../ds.js';
import { useMeetingContent, useMeetingDetail } from '../hooks.js';
import { TodoList } from '../components/TodoItem.js';
import { MarkdownContent } from '../components/MarkdownContent.js';
import { useEntityMutation } from '../lib/entity-action/use-entity-mutation.js';

export default function ReunionDetalle() {
  const { id = '' } = useParams();
  const { data, isPending, error, refetch } = useMeetingDetail(id);
  const [showContent, setShowContent] = useState(false);
  const content = useMeetingContent(id, showContent);
  const { useEntityMutate } = useEntityMutation();

  const analyze = useEntityMutate(
    `analyze-meeting:${id}`,
    () => api.analyzeMeeting(id),
    { success: 'Análisis IA completado', error: 'Error al analizar' },
  );

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  const { meeting, todos, people, prospects, projects, teams } = data;

  return (
    <div data-cerebro-entity={`meeting:${meeting.id}`}>
      <PageHeader
        title={meeting.title}
        desc={`${formatDate(meeting.startedAt)} · ${meeting.participants.length} participantes`}
        actions={
          <>
            <Link to="/reuniones" className="btn btn-ghost btn-sm">
              ← Reuniones
            </Link>
            <Button
              variant="secondary"
              size="sm"
              loading={analyze.isPending}
              onClick={() => analyze.run()}
            >
              {meeting.analysisStatus === 'analyzed' ? 'Re-analizar con IA' : 'Analizar con IA'}
            </Button>
          </>
        }
      />

      <div className="chip-row" style={{ marginBottom: 'var(--space-4)' }}>
        {meeting.analysisStatus === 'analyzed' ? (
          <Badge tone="success">Analizada</Badge>
        ) : meeting.analysisStatus === 'needs_review' ? (
          <Badge tone="warn">Revisar análisis</Badge>
        ) : (
          <Badge>Sin analizar</Badge>
        )}
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
          <MarkdownContent content={meeting.summary} />
        </Section>
      ) : null}

      <Section title={`Tareas (${todos.length})`}>
        <TodoList todos={todos} empty="Sin tareas extraídas de esta reunión." showDue />
      </Section>

      <Section title="Personas">
        {people.length || prospects.length ? (
          <div className="chip-row">
            {people.map((p) => (
              <Link
                key={p.id}
                to={`/personas?q=${encodeURIComponent(p.displayName)}`}
                className="badge badge-accent"
                data-cerebro-entity={`person:${p.id}`}
              >
                {p.displayName}
              </Link>
            ))}
            {prospects.map((p) => (
              <span key={p.id} className="badge" title="Detectado en notas, sin email confirmado" data-cerebro-entity={`prospect:${p.id}`}>
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

      <Section title="Notas completas">
        {!showContent ? (
          <Button variant="secondary" size="sm" onClick={() => setShowContent(true)}>
            Cargar notas de la reunión
          </Button>
        ) : content.isPending ? (
          <Skeleton lines={6} />
        ) : content.error ? (
          <p className="muted">No se pudo cargar el contenido ({String(content.error)}).</p>
        ) : (
          <MarkdownContent content={content.data.content.replace(/^---[\s\S]*?---\n/, '')} />
        )}
      </Section>
    </div>
  );
}
