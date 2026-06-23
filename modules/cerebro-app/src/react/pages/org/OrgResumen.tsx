import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api.js';
import { orgDisplayName } from '../../../lib/org-branding.js';
import { Button, ErrorState, formatDate, PageHeader, Section, Skeleton, toast } from '../../ds.js';
import {
  useInvalidateViews,
  useOrg,
  useOrgBoardView,
  useOrgHealth,
  useOrgMeetingsView,
  useOrgMembers,
} from '../../hooks.js';

export default function OrgResumen() {
  const { orgId = '' } = useParams();
  const org = useOrg(orgId);
  const health = useOrgHealth(orgId);
  const board = useOrgBoardView(orgId);
  const members = useOrgMembers(orgId);
  const meetings = useOrgMeetingsView(orgId, { limit: 5 });
  const invalidate = useInvalidateViews();

  const ingest = useMutation({
    mutationFn: () => api.ingestOrg(orgId),
    onSuccess: (r) => {
      invalidate();
      toast(`Datos aportados: ${r.merged} reuniones fusionadas`);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

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
          <Button variant="secondary" size="sm" loading={ingest.isPending} onClick={() => ingest.mutate()}>
            Aportar mis datos
          </Button>
        }
      />

      <div className="kpi-grid">
        <Link to={`/org/${orgId}/reuniones`} className="kpi-card">
          <span className="kpi-value">{h?.meetingsTotal ?? '—'}</span>
          <span className="kpi-label">Reuniones</span>
        </Link>
        <Link to={`/org/${orgId}/personas`} className="kpi-card">
          <span className="kpi-value">{h?.contactsCount ?? '—'}</span>
          <span className="kpi-label">Contactos</span>
        </Link>
        <Link to={`/org/${orgId}/tareas`} className="kpi-card">
          <span className="kpi-value">{openTodos}</span>
          <span className="kpi-label">Tareas abiertas</span>
        </Link>
        <Link to={`/org/${orgId}/tareas`} className="kpi-card">
          <span className="kpi-value">{suggested}</span>
          <span className="kpi-label">Sugeridas</span>
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
