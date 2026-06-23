import { useMemo, useState } from 'react';
import type { GraphSnapshot } from '@shared/types.js';

const COLORS: Record<string, string> = {
  person: '#3b82f6',
  prospect: '#94a3b8',
  meeting: '#8b5cf6',
  project: '#10b981',
  team: '#f59e0b',
  todo: '#ec4899',
  member: '#06b6d4',
};

const TYPE_LABELS: Record<string, string> = {
  person: 'Persona',
  prospect: 'Prospect',
  meeting: 'Reunión',
  project: 'Proyecto',
  team: 'Equipo',
  todo: 'Tarea',
  member: 'Miembro',
};

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  type: string;
}

function runForceLayout(
  nodes: SimNode[],
  edges: Array<{ source: string; target: string }>,
  width: number,
  height: number,
  iterations = 120,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    n.x = cx + (Math.random() - 0.5) * width * 0.4;
    n.y = cy + (Math.random() - 0.5) * height * 0.4;
    n.vx = 0;
    n.vy = 0;
  }

  for (let t = 0; t < iterations; t++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const force = 4200 / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx -= dx;
        a.vy -= dy;
        b.vx += dx;
        b.vy += dy;
      }
    }

    for (const e of edges) {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const force = (dist - 90) * 0.04;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      a.vx += dx;
      a.vy += dy;
      b.vx -= dx;
      b.vy -= dy;
    }

    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.002;
      n.vy += (cy - n.y) * 0.002;
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(40, Math.min(width - 40, n.x));
      n.y = Math.max(40, Math.min(height - 40, n.y));
    }
  }
}

export function GraphPanel({
  graph,
  onNodeClick,
}: {
  graph: GraphSnapshot;
  onNodeClick?: (nodeId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const w = 800;
  const h = 480;

  const layout = useMemo(() => {
    const simNodes: SimNode[] = graph.nodes.map((n) => ({
      id: n.id,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      label: n.label,
      type: n.type,
    }));
    runForceLayout(
      simNodes,
      graph.edges.map((e) => ({ source: e.source, target: e.target })),
      w,
      h,
    );
    return simNodes;
  }, [graph]);

  if (!graph.nodes.length) {
    return <p className="muted">Sin nodos — sincronizá reuniones primero.</p>;
  }

  const pos = new Map(layout.map((n) => [n.id, n]));
  const selectedNode = selected ? graph.nodes.find((n) => n.id === selected) : null;
  const typesPresent = [...new Set(graph.nodes.map((n) => n.type))];

  return (
    <div className="graph-panel">
      <div className="graph-toolbar">
        <p className="muted graph-meta">
          {graph.nodes.length} nodos · {graph.edges.length} vínculos · click en nodo para explorar
        </p>
        <div className="graph-legend">
          {typesPresent.map((t) => (
            <span key={t} className="graph-legend-item">
              <i style={{ background: COLORS[t] ?? '#64748b' }} />
              {TYPE_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="graph-svg" role="img" aria-label="Grafo de relaciones">
        {graph.edges.map((e) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          if (!a || !b) return null;
          const dashed = e.kind === 'prospect_attended' || e.kind === 'co_attended';
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={`graph-edge${dashed ? ' graph-edge--dashed' : ''}`}
            />
          );
        })}
        {layout.map((n) => (
          <g
            key={n.id}
            className="graph-node"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelected(n.id);
              onNodeClick?.(n.id);
            }}
          >
            <circle cx={n.x} cy={n.y} r={12} fill={COLORS[n.type] ?? '#64748b'} opacity={0.92} />
            <text x={n.x} y={n.y + 24} textAnchor="middle" className="graph-label">
              {n.label.slice(0, 20)}
            </text>
          </g>
        ))}
      </svg>
      {selectedNode ? (
        <aside className="graph-sidepanel">
          <h4>{selectedNode.label}</h4>
          <p className="muted">
            {TYPE_LABELS[selectedNode.type] ?? selectedNode.type} · {selectedNode.id}
          </p>
        </aside>
      ) : null}
    </div>
  );
}
