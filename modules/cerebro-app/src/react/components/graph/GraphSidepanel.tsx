import { Link } from 'react-router-dom';
import type { GraphEdge, GraphNode, MaintenanceItem, PeopleView } from '@shared/types.js';
import { PersonEntityInlinePanel } from '../PersonEntityPanel.js';
import { TeamEntityInlinePanel } from '../TeamEntityPanel.js';
import type { PeopleActions } from '../PeopleDirectory.js';
import {
  GRAPH_EDGE_KIND_LABELS,
  GRAPH_TYPE_LABELS,
  getConnectedEdges,
  nodeNavigationPath,
  parseNodeRawId,
} from './graph-utils.js';

export type NodeBadge = { kind: 'hub' | 'cooling' };

export function GraphSidepanel({
  node,
  edges,
  allNodes,
  onExplore,
  onSelectNeighbor,
  orgId,
  badge,
  peopleView,
  peopleActions,
  maintenanceItems,
}: {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onExplore: () => void;
  onSelectNeighbor: (id: string) => void;
  orgId?: string;
  badge?: NodeBadge;
  peopleView?: PeopleView;
  peopleActions?: PeopleActions;
  maintenanceItems?: MaintenanceItem[];
}) {
  const connected = getConnectedEdges(node.id, edges);
  const nodeById = new Map(allNodes.map((n) => [n.id, n]));
  const nav = nodeNavigationPath(node, orgId);
  const rawId = parseNodeRawId(node.id);

  const neighbors = [...new Set(
    connected.flatMap((e) => (e.source === node.id ? e.target : e.source)),
  )]
    .map((id) => nodeById.get(id))
    .filter((n): n is GraphNode => Boolean(n))
    .sort((a, b) => a.label.localeCompare(b.label));

  const personItem =
    peopleView && node.type === 'person'
      ? peopleView.people.find((p) => p.kind === 'person' && p.id === rawId)
      : undefined;
  const prospectItem =
    peopleView && node.type === 'prospect'
      ? peopleView.people.find((p) => p.kind === 'prospect' && p.id === rawId)
      : undefined;
  const team =
    peopleView && node.type === 'team'
      ? peopleView.teams.find((t) => t.id === rawId)
      : undefined;

  const memberNames = neighbors.filter((n) => n.type === 'person').map((n) => n.label);

  return (
    <aside className="graph-sidepanel">
      <div className="graph-sidepanel-header">
        <h4>{node.label}</h4>
        {badge?.kind === 'hub' ? <span className="graph-badge graph-badge--hub">Hub</span> : null}
        {badge?.kind === 'cooling' ? (
          <span className="graph-badge graph-badge--cooling">Enfriándose</span>
        ) : null}
      </div>
      <p className="muted graph-sidepanel-meta">
        {GRAPH_TYPE_LABELS[node.type] ?? node.type} · {connected.length} conexiones
      </p>
      {node.meta?.startedAt ? (
        <p className="muted graph-sidepanel-meta">Fecha: {String(node.meta.startedAt)}</p>
      ) : null}

      <div className="graph-sidepanel-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={onExplore}>
          Explorar
        </button>
        {nav ? (
          <Link to={nav.to} className="btn btn-secondary btn-sm">
            {nav.label}
          </Link>
        ) : null}
      </div>

      {peopleView && peopleActions && personItem ? (
        <PersonEntityInlinePanel
          person={personItem}
          view={peopleView}
          actions={peopleActions}
          maintenanceItems={maintenanceItems}
        />
      ) : null}

      {peopleView && peopleActions && prospectItem ? (
        <PersonEntityInlinePanel
          person={prospectItem}
          view={peopleView}
          actions={peopleActions}
          maintenanceItems={maintenanceItems}
        />
      ) : null}

      {peopleView && peopleActions && team && peopleActions.updateTeam ? (
        <TeamEntityInlinePanel
          team={team}
          view={peopleView}
          actions={peopleActions}
          memberNames={memberNames}
        />
      ) : null}

      {neighbors.length ? (
        <div className="graph-neighbors">
          <p className="graph-neighbors-title">Conexiones directas</p>
          <ul className="graph-neighbors-list">
            {neighbors.map((n) => (
              <li key={n.id}>
                <button type="button" className="kpi-link" onClick={() => onSelectNeighbor(n.id)}>
                  {n.label}
                </button>
                <span className="muted"> · {GRAPH_TYPE_LABELS[n.type] ?? n.type}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {connected.length ? (
        <details className="graph-edge-details">
          <summary className="muted">Tipos de vínculo</summary>
          <ul className="graph-edge-kind-list">
            {[...new Set(connected.map((e) => e.kind))].map((kind) => (
              <li key={kind}>{GRAPH_EDGE_KIND_LABELS[kind] ?? kind}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </aside>
  );
}
