import { useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { ErrorState, Icon, PageHeader, Section, Skeleton, formatDate } from '../ds.js';
import { useGraph, useMaintenanceView, usePeopleView } from '../hooks.js';
import { GraphPanel } from '../components/GraphPanel.js';
import { useEntityLifecycleStore } from '../lib/entity-action/entity-lifecycle-store.js';
import type { PeopleActions } from '../components/PeopleDirectory.js';
import type { NodeBadge } from '../components/graph/GraphSidepanel.js';

const DAYS_30 = 30 * 86400000;

const graphPeopleActions: PeopleActions = {
  updatePerson: (id, patch) => api.updatePerson(id, patch),
  promoteProspect: (id, email, displayName, enrichment) =>
    api.promoteProspect(id, email, displayName, enrichment),
  linkProspect: (prospectId, personId, enrichment) =>
    api.linkProspect(prospectId, personId, enrichment),
  dismissProspect: (prospectId) => api.dismissProspect(prospectId),
  restoreProspectDismiss: (snapshot) => api.restoreProspectDismiss(snapshot),
  getProspectCandidates: (prospectId) => api.getProspectCandidates(prospectId),
  mergePeople: (canonicalId, mergeIds) => api.mergePeople(canonicalId, mergeIds),
  createTeam: (name) => api.createTeam(name).then((r) => r.team),
  createProject: (name) => api.createProject(name).then((r) => r.project),
  assignEmailToTeam: (teamId, email) => api.assignEmailToTeam(teamId, email),
  updateTeam: (id, patch) => api.updateTeam(id, patch),
};

export default function Red() {
  const [center, setCenter] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(120);
  const [graphFullscreen, setGraphFullscreen] = useState(false);
  const focusedEntity = useEntityLifecycleStore((s) => s.focusedEntity);
  const graph = useGraph(center ? { center, depth: 2, limit } : { limit });
  const people = usePeopleView();
  const maintenance = useMaintenanceView();

  const insights = useMemo(() => {
    if (!graph.data || !people.data) return null;
    const g = graph.data.graph;

    const degree = new Map<string, number>();
    for (const e of g.edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    const topConnected = g.nodes
      .filter((n) => n.type === 'person')
      .map((n) => ({ ...n, degree: degree.get(n.id) ?? 0 }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    const now = Date.now();
    const cooling = people.data.people
      .filter(
        (p) =>
          p.kind === 'person' &&
          p.meetingCount >= 3 &&
          p.lastMeetingAt &&
          now - new Date(p.lastMeetingAt).getTime() > DAYS_30,
      )
      .sort((a, b) => (a.lastMeetingAt ?? '').localeCompare(b.lastMeetingAt ?? ''))
      .slice(0, 5);

    return { topConnected, cooling };
  }, [graph.data, people.data]);

  const nodeBadges = useMemo(() => {
    const badges = new Map<string, NodeBadge>();
    if (!insights) return badges;
    for (const p of insights.topConnected) {
      badges.set(p.id, { kind: 'hub' });
    }
    for (const p of insights.cooling) {
      badges.set(`person:${p.id}`, { kind: 'cooling' });
    }
    return badges;
  }, [insights]);

  return (
    <div>
      <PageHeader
        title="Red"
        desc="Quién se conecta con quién a través de tus reuniones — con insights accionables."
        actions={
          graph.data && !graph.isPending ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setGraphFullscreen(true)}
              aria-label="Abrir red en pantalla completa"
            >
              <Icon name="maximize" />
              <span style={{ marginLeft: 'var(--space-1)' }}>Pantalla completa</span>
            </button>
          ) : null
        }
      />

      {graph.isPending ? (
        <Skeleton lines={8} />
      ) : graph.error ? (
        <ErrorState error={graph.error} retry={() => void graph.refetch()} />
      ) : (
        <>
          {center ? (
            <div className="toolbar-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCenter(undefined)}>
                ← Volver al grafo completo
              </button>
            </div>
          ) : null}
          <GraphPanel
            graph={graph.data.graph}
            onExploreNode={(id) => setCenter(id)}
            nodeBadges={nodeBadges}
            limit={limit}
            onLimitChange={setLimit}
            peopleView={people.data}
            peopleActions={graphPeopleActions}
            maintenanceItems={maintenance.data?.items}
            fullscreen={graphFullscreen}
            onFullscreenChange={setGraphFullscreen}
            focusEntityRef={focusedEntity}
          />
        </>
      )}

      {insights ? (
        <div className="dash-grid" style={{ marginTop: 'var(--space-5)' }}>
          <Section title="Personas más conectadas" desc="Concentran las relaciones de tu red.">
            {insights.topConnected.length ? (
              <ul className="hoy-focus-list">
                {insights.topConnected.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="kpi-link" onClick={() => setCenter(p.id)}>
                      {p.label}
                    </button>{' '}
                    · {p.degree} vínculos
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Sin datos suficientes.</p>
            )}
          </Section>
          <Section
            title="Relaciones que se enfrían"
            desc="Personas frecuentes sin reuniones en los últimos 30 días."
          >
            {insights.cooling.length ? (
              <ul className="hoy-focus-list">
                {insights.cooling.map((p) => (
                  <li key={p.id}>
                    {p.displayName} · última reunión {formatDate(p.lastMeetingAt)} ({p.meetingCount} en total)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Ninguna relación frecuente se está enfriando.</p>
            )}
          </Section>
        </div>
      ) : null}
    </div>
  );
}
