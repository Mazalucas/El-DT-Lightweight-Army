import type { GraphSnapshot } from '@shared/types.js';
import { escapeHtml } from '../lib/ui.js';

const COLORS: Record<string, string> = {
  person: '#3b82f6',
  prospect: '#94a3b8',
  meeting: '#8b5cf6',
  project: '#10b981',
  team: '#f59e0b',
  todo: '#ec4899',
  member: '#06b6d4',
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
  edges: { source: string; target: string }[],
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

export function renderGraphPanel(
  graph: GraphSnapshot,
  onNodeClick?: (nodeId: string) => void,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'graph-panel';

  if (graph.nodes.length === 0) {
    wrap.innerHTML = '<p class="muted">Sin nodos — sincronizá reuniones primero.</p>';
    return wrap;
  }

  const w = 800;
  const h = 480;
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

  const pos = new Map(simNodes.map((n) => [n.id, n]));
  let svg = `<svg viewBox="0 0 ${w} ${h}" class="graph-svg" role="img" aria-label="Grafo de relaciones">`;
  for (const e of graph.edges) {
    const a = pos.get(e.source);
    const b = pos.get(e.target);
    if (!a || !b) continue;
    const dashed = e.kind === 'prospect_attended' || e.kind === 'co_attended';
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="graph-edge${dashed ? ' graph-edge--dashed' : ''}" />`;
  }
  for (const n of simNodes) {
    const fill = COLORS[n.type] ?? '#64748b';
    svg += `<g class="graph-node" data-node-id="${escapeHtml(n.id)}" style="cursor:pointer">
      <circle cx="${n.x}" cy="${n.y}" r="12" fill="${fill}" opacity="0.92" />
      <text x="${n.x}" y="${n.y + 24}" text-anchor="middle" class="graph-label">${escapeHtml(n.label.slice(0, 20))}</text>
    </g>`;
  }
  svg += '</svg>';

  const legend = Object.entries(COLORS)
    .map(([t, c]) => `<span class="graph-legend-item"><i style="background:${c}"></i>${t}</span>`)
    .join('');

  wrap.innerHTML = `
    <div class="graph-toolbar">
      <p class="muted graph-meta">${graph.nodes.length} nodos · ${graph.edges.length} vínculos${graph.centerId ? ` · centro ${escapeHtml(graph.centerId)}` : ''} · click en nodo para explorar</p>
      <div class="graph-legend">${legend}</div>
    </div>
    ${svg}
    <aside class="graph-sidepanel" id="graph-sidepanel" hidden></aside>
  `;

  const side = wrap.querySelector('#graph-sidepanel') as HTMLElement;
  if (onNodeClick) {
    wrap.querySelectorAll('.graph-node').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as SVGGElement).dataset.nodeId;
        if (!id) return;
        const node = graph.nodes.find((n) => n.id === id);
        if (node) {
          side.hidden = false;
          side.innerHTML = `<h4>${escapeHtml(node.label)}</h4><p class="muted">${escapeHtml(node.type)} · ${escapeHtml(id)}</p>`;
        }
        onNodeClick(id);
      });
    });
  }

  return wrap;
}
