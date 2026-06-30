import type { GraphEdge, GraphNode, GraphNodeType, GraphSnapshot } from '@shared/types.js';

export const GRAPH_COLORS: Record<string, string> = {
  person: '#3b82f6',
  prospect: '#94a3b8',
  meeting: '#8b5cf6',
  project: '#10b981',
  team: '#f59e0b',
  todo: '#ec4899',
  member: '#06b6d4',
};

export const GRAPH_TYPE_LABELS: Record<string, string> = {
  person: 'Persona',
  prospect: 'Prospect',
  meeting: 'Reunión',
  project: 'Proyecto',
  team: 'Equipo',
  todo: 'Tarea',
  member: 'Miembro',
};

export const GRAPH_EDGE_KIND_LABELS: Record<string, string> = {
  attended: 'Asistió',
  co_attended: 'Co-asistencia',
  prospect_attended: 'Prospect en reunión',
  works_on: 'Trabaja en',
  about: 'Reunión sobre',
  member_of: 'Miembros de',
  tagged: 'Etiquetado',
  contributed: 'Contribuyó',
  from_meeting: 'De reunión',
  assigned: 'Asignado',
  org_member: 'Org',
};

export const FILTERABLE_TYPES: GraphNodeType[] = [
  'person',
  'prospect',
  'meeting',
  'project',
  'team',
  'todo',
  'member',
];

export const FILTER_STORAGE_KEY = 'red-graph-type-filters';
export const LAYOUT_STORAGE_KEY = 'red-graph-layout-mode';
export const SHOW_LABELS_STORAGE_KEY = 'red-graph-show-labels';

export type LayoutMode = 'circular' | 'radial' | 'force';

export const DEFAULT_LAYOUT_MODE: LayoutMode = 'circular';

export const DEFAULT_ENABLED_TYPES: Set<GraphNodeType> = new Set(['person', 'prospect', 'project']);

export type TimeRange = '30d' | '90d' | '1y' | 'all';

const TIME_RANGE_MS: Record<Exclude<TimeRange, 'all'>, number> = {
  '30d': 30 * 86400000,
  '90d': 90 * 86400000,
  '1y': 365 * 86400000,
};

export function loadEnabledTypes(): Set<GraphNodeType> {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return new Set(DEFAULT_ENABLED_TYPES);
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set(DEFAULT_ENABLED_TYPES);
    const valid = parsed.filter((t): t is GraphNodeType =>
      FILTERABLE_TYPES.includes(t as GraphNodeType),
    );
    return valid.length ? new Set(valid) : new Set(DEFAULT_ENABLED_TYPES);
  } catch {
    return new Set(DEFAULT_ENABLED_TYPES);
  }
}

export function saveEnabledTypes(types: Set<GraphNodeType>): void {
  localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...types]));
}

export function loadLayoutMode(): LayoutMode {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw === 'circular' || raw === 'radial' || raw === 'force') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LAYOUT_MODE;
}

export function saveLayoutMode(mode: LayoutMode): void {
  localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
}

export function loadShowLabels(): boolean {
  try {
    const raw = localStorage.getItem(SHOW_LABELS_STORAGE_KEY);
    if (raw === '0' || raw === 'false') return false;
  } catch {
    /* ignore */
  }
  return true;
}

export function saveShowLabels(show: boolean): void {
  localStorage.setItem(SHOW_LABELS_STORAGE_KEY, show ? '1' : '0');
}

export function filterGraphByTypes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  enabledTypes: Set<GraphNodeType>,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const visibleNodes = nodes.filter((n) => enabledTypes.has(n.type));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  return { nodes: visibleNodes, edges: visibleEdges };
}

export function filterMeetingsByTimeRange(
  nodes: GraphNode[],
  edges: GraphEdge[],
  range: TimeRange,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (range === 'all') return { nodes, edges };
  const cutoff = Date.now() - TIME_RANGE_MS[range];
  const hiddenMeetingIds = new Set(
    nodes
      .filter((n) => {
        if (n.type !== 'meeting') return false;
        const startedAt = n.meta?.startedAt;
        if (typeof startedAt !== 'string') return false;
        return new Date(startedAt).getTime() < cutoff;
      })
      .map((n) => n.id),
  );
  if (!hiddenMeetingIds.size) return { nodes, edges };
  const visibleNodes = nodes.filter((n) => !hiddenMeetingIds.has(n.id));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  return { nodes: visibleNodes, edges: visibleEdges };
}

export function filterEdgesByKind(edges: GraphEdge[], kinds: Set<string>): GraphEdge[] {
  return edges.filter((e) => kinds.has(e.kind));
}

export function computeDegree(edges: GraphEdge[]): Map<string, number> {
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  return degree;
}

export function getNeighborIds(nodeId: string, edges: GraphEdge[]): Set<string> {
  const neighbors = new Set<string>();
  for (const e of edges) {
    if (e.source === nodeId) neighbors.add(e.target);
    if (e.target === nodeId) neighbors.add(e.source);
  }
  return neighbors;
}

export function getConnectedEdges(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges.filter((e) => e.source === nodeId || e.target === nodeId);
}

export function findShortestPath(
  fromId: string,
  toId: string,
  edges: GraphEdge[],
): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  }
  const queue: string[] = [fromId];
  const visited = new Set<string>([fromId]);
  const prev = new Map<string, string>();
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === toId) {
      const path: string[] = [toId];
      let p = toId;
      while (prev.has(p)) {
        p = prev.get(p)!;
        path.unshift(p);
      }
      return path;
    }
    for (const next of adj.get(cur) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      prev.set(next, cur);
      queue.push(next);
    }
  }
  return null;
}

/** Incluye nodos/aristas del camino aunque estén ocultos por filtros de tipo. */
export function mergePathOverlay(
  graph: GraphSnapshot,
  filtered: { nodes: GraphNode[]; edges: GraphEdge[] },
  nodeIds: string[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!nodeIds.length) return { nodes: filtered.nodes, edges: filtered.edges };
  const nodeById = new Map(filtered.nodes.map((n) => [n.id, n]));
  for (const id of nodeIds) {
    if (!nodeById.has(id)) {
      const n = graph.nodes.find((x) => x.id === id);
      if (n) nodeById.set(id, n);
    }
  }
  const edgeById = new Map(filtered.edges.map((e) => [e.id, e]));
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const a = nodeIds[i]!;
    const b = nodeIds[i + 1]!;
    const found = graph.edges.find(
      (e) => (e.source === a && e.target === b) || (e.source === b && e.target === a),
    );
    if (found && !edgeById.has(found.id)) edgeById.set(found.id, found);
  }
  return { nodes: [...nodeById.values()], edges: [...edgeById.values()] };
}

export function nodeMatchesSearch(node: GraphNode, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (node.label.toLowerCase().includes(q)) return true;
  const emails = node.meta?.emails;
  if (Array.isArray(emails) && emails.some((e) => String(e).toLowerCase().includes(q))) return true;
  const email = node.meta?.email;
  if (typeof email === 'string' && email.toLowerCase().includes(q)) return true;
  return false;
}

export function computeFitTransform(
  positions: Map<string, { x: number; y: number }>,
  nodeIds: string[],
  width: number,
  height: number,
  padding = 72,
): { x: number; y: number; scale: number } {
  const points = nodeIds
    .map((id) => positions.get(id))
    .filter((p): p is { x: number; y: number } => p != null);
  if (!points.length) return { x: 0, y: 0, scale: 1 };
  if (points.length === 1) {
    const p = points[0]!;
    return { x: width / 2 - p.x, y: height / 2 - p.y, scale: 1 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const boxW = Math.max(maxX - minX, 40);
  const boxH = Math.max(maxY - minY, 40);
  const scale = Math.min(
    3,
    Math.max(0.3, Math.min((width - padding * 2) / boxW, (height - padding * 2) / boxH)),
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale };
}

export function nodeCollisionRadius(type: string, degree: number): number {
  const base = type === 'meeting' ? 28 : type === 'prospect' ? 24 : 20;
  return base + Math.min(degree, 5) * 2;
}

export function nodeDisplayRadius(degree: number): number {
  return Math.min(18, Math.max(8, 8 + Math.sqrt(degree) * 2.5));
}

export function edgeStrokeWidth(weight: number | undefined): number {
  return 1 + Math.min(weight ?? 1, 5) * 0.4;
}

export function parseNodeRawId(nodeId: string): string {
  const idx = nodeId.indexOf(':');
  return idx >= 0 ? nodeId.slice(idx + 1) : nodeId;
}

/** Fallback cliente si el API aún no devuelve selfNodeId. */
export function resolveSelfNodeIdFromSnapshot(
  graph: GraphSnapshot,
  userEmail?: string,
): string | undefined {
  if (graph.selfNodeId) return graph.selfNodeId;
  if (!userEmail) return undefined;
  const email = userEmail.toLowerCase().trim();
  for (const n of graph.nodes) {
    if (n.type === 'member' && typeof n.meta?.email === 'string') {
      if (n.meta.email.toLowerCase().trim() === email) return n.id;
    }
    if (n.type !== 'person') continue;
    const emails = n.meta?.emails;
    if (
      Array.isArray(emails) &&
      emails.some((e) => String(e).toLowerCase().trim() === email)
    ) {
      return n.id;
    }
  }
  return undefined;
}

export function nodeNavigationPath(
  node: GraphNode,
  orgId?: string,
): { to: string; label: string } | null {
  const rawId = parseNodeRawId(node.id);
  const prefix = orgId ? `/org/${orgId}` : '';
  switch (node.type) {
    case 'meeting':
      return { to: `${prefix}/reuniones/${rawId}`, label: 'Ver reunión' };
    case 'person':
      return {
        to: `${prefix}/personas?q=${encodeURIComponent(node.label)}`,
        label: 'Ver persona',
      };
    case 'prospect':
      return {
        to: `${prefix}/personas?q=${encodeURIComponent(node.label)}`,
        label: 'Ver prospect',
      };
    case 'project':
      return { to: `${prefix}/proyectos`, label: 'Ver proyectos' };
    case 'todo':
      return { to: `${prefix}/tareas`, label: 'Ver tareas' };
    default:
      return null;
  }
}

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  type: string;
  degree: number;
  radius: number;
  collision: number;
}

export function runForceLayout(
  nodes: SimNode[],
  edges: Array<{ source: string; target: string }>,
  width: number,
  height: number,
  pinned?: Map<string, { x: number; y: number }>,
  centerNodeId?: string,
): void {
  const iterations = nodes.length < 30 ? 200 : 120;
  const cx = width / 2;
  const cy = height / 2;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const isPinned = (id: string) =>
    pinned?.has(id) || (centerNodeId !== undefined && id === centerNodeId);

  for (const n of nodes) {
    const pin = pinned?.get(n.id);
    if (pin) {
      n.x = pin.x;
      n.y = pin.y;
    } else if (centerNodeId && n.id === centerNodeId) {
      n.x = cx;
      n.y = cy;
    } else {
      n.x = cx + (Math.random() - 0.5) * width * 0.4;
      n.y = cy + (Math.random() - 0.5) * height * 0.4;
    }
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
        const minDist = a.collision + b.collision;
        const force = (minDist * minDist * 2) / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        if (!isPinned(a.id)) {
          a.vx -= dx;
          a.vy -= dy;
        }
        if (!isPinned(b.id)) {
          b.vx += dx;
          b.vy += dy;
        }
      }
    }

    for (const e of edges) {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const ideal = a.collision + b.collision;
      const force = (dist - ideal) * 0.04;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      if (!isPinned(a.id)) {
        a.vx += dx;
        a.vy += dy;
      }
      if (!isPinned(b.id)) {
        b.vx -= dx;
        b.vy -= dy;
      }
    }

    for (const n of nodes) {
      if (isPinned(n.id)) continue;
      n.vx += (cx - n.x) * 0.002;
      n.vy += (cy - n.y) * 0.002;
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      const pad = n.collision;
      n.x = Math.max(pad, Math.min(width - pad, n.x));
      n.y = Math.max(pad, Math.min(height - pad, n.y));
    }
  }
}

const LAYOUT_TYPE_ORDER: Record<string, number> = {
  person: 0,
  project: 1,
  team: 2,
  meeting: 3,
  prospect: 4,
  todo: 5,
  member: 6,
};

function sortNodesForLayout(nodes: SimNode[]): SimNode[] {
  return [...nodes].sort((a, b) => {
    const ta = LAYOUT_TYPE_ORDER[a.type] ?? 99;
    const tb = LAYOUT_TYPE_ORDER[b.type] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.label.localeCompare(b.label, 'es');
  });
}

export function runCircularLayout(
  nodes: SimNode[],
  width: number,
  height: number,
  centerNodeId?: string,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const centerNode = centerNodeId ? nodes.find((n) => n.id === centerNodeId) : undefined;
  const ringNodes = centerNode ? nodes.filter((n) => n.id !== centerNodeId) : nodes;
  const sorted = sortNodesForLayout(ringNodes);
  const n = sorted.length;
  if (!n && !centerNode) return;
  const pad = 48;
  const labelPad = centerNode ? 56 : 28;
  const baseR = Math.min(width, height) / 2 - pad - labelPad;
  const radius = n > 30 ? baseR * Math.min(1.45, 1 + (n - 30) * 0.015) : baseR;
  if (centerNode) {
    centerNode.x = cx;
    centerNode.y = cy;
  }
  for (let i = 0; i < n; i++) {
    const node = sorted[i]!;
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    node.x = cx + radius * Math.cos(angle);
    node.y = cy + radius * Math.sin(angle);
  }
}

export function runRadialByTypeLayout(
  nodes: SimNode[],
  width: number,
  height: number,
  centerNodeId?: string,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const centerNode = centerNodeId ? nodes.find((n) => n.id === centerNodeId) : undefined;
  const layoutNodes = centerNode ? nodes.filter((n) => n.id !== centerNodeId) : nodes;
  const byType = new Map<string, SimNode[]>();
  for (const n of layoutNodes) {
    const list = byType.get(n.type) ?? [];
    list.push(n);
    byType.set(n.type, list);
  }
  const typeOrder = ['person', 'project', 'team', 'meeting', 'prospect', 'todo', 'member'];
  const rings = typeOrder.filter((t) => byType.has(t));
  if (!rings.length && !centerNode) return;
  const maxR = Math.min(width, height) / 2 - 52;
  const ringStep = maxR / (rings.length || 1);
  rings.forEach((type, ringIdx) => {
    const ringNodes = [...byType.get(type)!].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    const r = ringStep * (ringIdx + 0.65);
    const count = ringNodes.length;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      ringNodes[i]!.x = cx + r * Math.cos(angle);
      ringNodes[i]!.y = cy + r * Math.sin(angle);
    }
  });
  if (centerNode) {
    centerNode.x = cx;
    centerNode.y = cy;
  }
}

export function applyGraphLayout(
  mode: LayoutMode,
  nodes: SimNode[],
  edges: Array<{ source: string; target: string }>,
  width: number,
  height: number,
  pinned?: Map<string, { x: number; y: number }>,
  centerNodeId?: string,
): void {
  if (mode === 'force') {
    runForceLayout(nodes, edges, width, height, pinned, centerNodeId);
    return;
  }
  if (mode === 'radial') {
    runRadialByTypeLayout(nodes, width, height, centerNodeId);
    return;
  }
  runCircularLayout(nodes, width, height, centerNodeId);
}

export function buildFilteredGraph(
  graph: GraphSnapshot,
  enabledTypes: Set<GraphNodeType>,
  timeRange: TimeRange,
  personsOnly: boolean,
): { nodes: GraphNode[]; edges: GraphEdge[]; hiddenCount: number } {
  let { nodes, edges } = filterGraphByTypes(graph.nodes, graph.edges, enabledTypes);
  ({ nodes, edges } = filterMeetingsByTimeRange(nodes, edges, timeRange));
  if (personsOnly) {
    nodes = nodes.filter((n) => n.type === 'person');
    const ids = new Set(nodes.map((n) => n.id));
    edges = filterEdgesByKind(edges, new Set(['co_attended'])).filter(
      (e) => ids.has(e.source) && ids.has(e.target),
    );
  }
  const hiddenCount = graph.nodes.length - nodes.length;
  return { nodes, edges, hiddenCount };
}
