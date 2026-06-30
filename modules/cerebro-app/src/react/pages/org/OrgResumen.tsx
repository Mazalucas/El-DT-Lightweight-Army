import { Link, useParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { orgDisplayName } from '../../../lib/org-branding.js';
import { Button, ErrorState, formatDate, PageHeader, Section, Skeleton } from '../../ds.js';
import { useOrg, useOrgBoardView, useOrgHealth, useOrgMeetingsView, useOrgMembers } from '../../hooks.js';
import { useEntityMutation } from '../../lib/entity-action/use-entity-mutation.js';

export default function OrgResumen() {
  const { orgId = '' } = useParams();
  const org = useOrg(orgId);
  const health = useOrgHealth(orgId);
  const board = useOrgBoardView(orgId);
  const members = useOrgMembers(orgId);
  const meetings = useOrgMeetingsView(orgId, { limit: 5 });
  const { useEntityMutate } = useEntityMutation();

  const ingest = useEntityMutate(
    `org-ingest:${orgId}`,
    () => api.ingestOrg(orgId),
    {
      success: (r) => `Datos aportados: ${r.merged} reuniones fusionadas`,
      error: 'Error al aportar datos',
    },
    { orgId },
  );

  if (org.isPending) return <Skeleton lines={8} />;
  if (org.error) return <ErrorState error={org.error} retry={() => void org.refetch()} />;

  const h = health.data?.health;
  const openTodos = board.data?.todos.filter((t) => t.status === 'open').length ?? 0;
  const suggested = board.data?.todos.filter((t) => t.status === 'suggested').length ?? 0;

  return (
    <div>
      <PageHeader
        title={orgDisplayName(org.data.org)}
        desc="Espacio compartido — datos agregados de todos los miembros."
        actions={
          <Button variant="secondary" size="sm" loading={ingest.isPending} onClick={() => ingest.run()}>
            Aportar mis datos
          </Button>
        }
      />

      <div className="stat-strip">
        <Link to={`/org/${orgId}/reuniones`} className="stat-strip-item">
          <span className="stat-strip-value">{h?.meetingsTotal ?? '—'}</span>
          <span className="stat-strip-label">Reuniones</span>
        </Link>
        <Link to={`/org/${orgId}/personas`} className="stat-strip-item">
          <span className="stat-strip-value">{h?.contactsCount ?? '—'}</span>
          <span className="stat-strip-label">Contactos</span>
        </Link>
        <Link to={`/org/${orgId}/tareas`} className="stat-strip-item">
          <span className="stat-strip-value">{openTodos}</span>
          <span className="stat-strip-label">Tareas abiertas</span>
        </Link>
        <Link to={`/org/${orgId}/tareas`} className="stat-strip-item">
          <span className="stat-strip-value">{suggested}</span>
          <span className="stat-strip-label">Sugeridas</span>
        </Link>
      </div>

      <div className="dash-grid">
        <Section
          title="Últimas reuniones"
          actions={
            <Link to={`/org/${orgId}/reuniones`} className="btn btn-ghost btn-sm">
              Ver todas
            </Link>
          }
        >
          {meetings.isPending ? (
            <Skeleton lines={4} />
          ) : meetings.data?.meetings.length ? (
            <ul className="hoy-focus-list">
              {meetings.data.meetings.map((m) => (
                <li key={m.id}>
                  <Link to={`/org/${orgId}/reuniones/${m.id}`} className="row-title-link">
                    {m.title}
                  </Link>{' '}
                  <span className="muted">· {formatDate(m.startedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sin reuniones todavía — aportá tus datos con el botón de arriba.</p>
          )}
        </Section>

        <Section title={`Miembros (${members.data?.members.length ?? '…'})`}>
          {members.isPending ? (
            <Skeleton lines={4} />
          ) : (
            <ul className="hoy-focus-list">
              {(members.data?.members ?? []).slice(0, 8).map((m) => (
                <li key={m.uid}>
                  {m.displayName || m.email}
                  {m.lastSyncAt ? (
                    <span className="muted"> · aportó {formatDate(m.lastSyncAt)}</span>
                  ) : (
                    <span className="muted"> · sin aportes</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
