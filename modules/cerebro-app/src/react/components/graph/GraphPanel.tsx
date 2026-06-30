import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { GraphEdge, GraphNodeType, GraphSnapshot, MaintenanceItem, PeopleView } from '@shared/types.js';
import type { EntityRef } from '@shared/cerebro-elements.js';
import { Icon } from '../../ds.js';
import { entityRefToGraphNodeId } from '../../lib/entity-action/entity-ref-graph.js';
import { GraphSidepanel, type NodeBadge } from './GraphSidepanel.js';
import { GraphTypeFilters } from './GraphTypeFilters.js';
import type { PeopleActions } from '../PeopleDirectory.js';
import {
  applyGraphLayout,
  buildFilteredGraph,
  computeDegree,
  computeFitTransform,
  edgeStrokeWidth,
  findShortestPath,
  getNeighborIds,
  mergePathOverlay,
  nodeMatchesSearch,
  GRAPH_COLORS,
  GRAPH_EDGE_KIND_LABELS,
  GRAPH_TYPE_LABELS,
  loadEnabledTypes,
  loadLayoutMode,
  loadShowLabels,
  resolveSelfNodeIdFromSnapshot,
  saveEnabledTypes,
  saveLayoutMode,
  saveShowLabels,
  type LayoutMode,
  type SimNode,
  type TimeRange,
} from './graph-utils.js';
import { useAuth } from '../../auth.js';

const DEFAULT_W = 800;
const DEFAULT_H = 480;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

export interface GraphPanelProps {
  graph: GraphSnapshot;
  onExploreNode?: (nodeId: string) => void;
  orgId?: string;
  nodeBadges?: Map<string, NodeBadge>;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  memberUid?: string;
  onMemberChange?: (uid: string | undefined) => void;
  members?: Array<{ uid: string; displayName?: string; email: string; status: string }>;
  peopleView?: PeopleView;
  peopleActions?: PeopleActions;
  maintenanceItems?: MaintenanceItem[];
  /** Controlado: abrir/cerrar pantalla completa desde el padre (ej. cabecera de Red). */
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** Foco desde Cerebro Elements (spotlight / entity_card). */
  focusEntityRef?: EntityRef | null;
}

export function GraphPanel({
  graph,
  onExploreNode,
  orgId,
  nodeBadges,
  limit = 120,
  onLimitChange,
  memberUid,
  onMemberChange,
  members,
  peopleView,
  peopleActions,
  maintenanceItems,
  fullscreen: fullscreenProp,
  onFullscreenChange,
  focusEntityRef,
}: GraphPanelProps) {
  const { user } = useAuth();
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = fullscreenProp ?? internalFullscreen;
  const panelRef = useRef<HTMLDivElement>(null);
  const [enabledTypes, setEnabledTypes] = useState<Set<GraphNodeType>>(() => loadEnabledTypes());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => loadLayoutMode());
  const [showLabels, setShowLabels] = useState(() => loadShowLabels());
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [personsOnly, setPersonsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const setFullscreen = useCallback(
    (next: boolean) => {
      onFullscreenChange?.(next);
      if (fullscreenProp === undefined) setInternalFullscreen(next);
    },
    [fullscreenProp, onFullscreenChange],
  );

  const enterFullscreen = useCallback(async () => {
    setFullscreen(true);
    const el = panelRef.current;
    if (!el?.requestFullscreen) return;
    try {
      await el.requestFullscreen();
    } catch {
      /* CSS overlay fallback */
    }
  }, [setFullscreen]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement === panelRef.current) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
    setFullscreen(false);
  }, [setFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) void exitFullscreen();
    else void enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  const [dimensions, setDimensions] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [pinnedPositions, setPinnedPositions] = useState<Map<string, { x: number; y: number }>>(
    () => new Map(),
  );
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');
  const [pathNodes, setPathNodes] = useState<string[] | null>(null);
  const [pathFeedback, setPathFeedback] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocusIds, setSearchFocusIds] = useState<string[]>([]);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number } | null>(null);

  const filtered = useMemo(
    () => buildFilteredGraph(graph, enabledTypes, timeRange, personsOnly),
    [graph, enabledTypes, timeRange, personsOnly],
  );

  const viz = useMemo(() => {
    const extraIds = [...(pathNodes ?? []), ...searchFocusIds];
    if (!extraIds.length) return filtered;
    return mergePathOverlay(graph, filtered, extraIds);
  }, [graph, filtered, pathNodes, searchFocusIds]);

  const selfNodeId = useMemo(
    () => resolveSelfNodeIdFromSnapshot(graph, user?.email ?? undefined),
    [graph, user?.email],
  );

  const degree = useMemo(() => computeDegree(viz.edges), [viz.edges]);

  const layout = useMemo(() => {
    const simNodes: SimNode[] = viz.nodes.map((n) => {
      const d = degree.get(n.id) ?? 0;
      return {
        id: n.id,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        label: n.label,
        type: n.type,
        degree: d,
        radius: Math.min(18, Math.max(8, 8 + Math.sqrt(d) * 2.5)),
        collision: (n.type === 'meeting' ? 28 : n.type === 'prospect' ? 24 : 20) + Math.min(d, 5) * 2,
      };
    });
    applyGraphLayout(
      layoutMode,
      simNodes,
      viz.edges.map((e) => ({ source: e.source, target: e.target })),
      dimensions.w,
      dimensions.h,
      layoutMode === 'force' && pinnedPositions.size ? pinnedPositions : undefined,
      selfNodeId && viz.nodes.some((n) => n.id === selfNodeId) ? selfNodeId : undefined,
    );
    return simNodes;
  }, [viz.nodes, viz.edges, dimensions, degree, pinnedPositions, layoutMode, selfNodeId]);

  const pos = useMemo(() => new Map(layout.map((n) => [n.id, n])), [layout]);

  const neighborIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    return getNeighborIds(selectedId, viz.edges);
  }, [selectedId, viz.edges]);

  const pathActive = Boolean(pathNodes?.length);
  const hasSelection = Boolean(selectedId) && !pathActive;
  const allowNodeDrag = layoutMode === 'force';

  const updateDimensions = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(280, Math.floor(rect.height));
    setDimensions({ w, h });
  }, []);

  useLayoutEffect(() => {
    updateDimensions();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateDimensions());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateDimensions, isFullscreen]);

  useEffect(() => {
    if (fullscreenProp === undefined) return;
    if (fullscreenProp) void enterFullscreen();
    else void exitFullscreen();
  }, [fullscreenProp, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    document.body.classList.toggle('graph-fullscreen-open', isFullscreen);
    return () => document.body.classList.remove('graph-fullscreen-open');
  }, [isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      const active = document.fullscreenElement === panelRef.current;
      if (!active && isFullscreen) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen, setFullscreen]);

  useEffect(() => {
    setPinnedPositions(new Map());
    setSelectedId(null);
    setPathNodes(null);
    setPathFeedback('');
    setSearchFocusIds([]);
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [graph.generatedAt, graph.centerId, layoutMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedId) {
          setSelectedId(null);
          setPathNodes(null);
        } else if (isFullscreen) {
          void exitFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, isFullscreen, exitFullscreen]);

  const toggleType = (type: GraphNodeType) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      saveEnabledTypes(next);
      return next;
    });
    setPersonsOnly(false);
  };

  const applyPersonsOnly = () => {
    setPersonsOnly(true);
    setEnabledTypes(new Set(['person']));
    saveEnabledTypes(new Set(['person']));
  };

  const handleSvgPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.target !== svgRef.current) return;
    panRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleSvgPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current && svgRef.current) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const gx = (svgPt.x - transform.x) / transform.scale;
      const gy = (svgPt.y - transform.y) / transform.scale;
      setPinnedPositions((prev) => {
        const next = new Map(prev);
        next.set(dragRef.current!.nodeId, { x: gx, y: gy });
        return next;
      });
      return;
    }
    if (!panRef.current?.active) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    setTransform((t) => ({
      ...t,
      x: panRef.current!.origX + dx,
      y: panRef.current!.origY + dy,
    }));
  };

  const handleSvgPointerUp = () => {
    panRef.current = null;
    dragRef.current = null;
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !graph.nodes.length) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform((t) => ({
        ...t,
        scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * delta)),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [graph.nodes.length, graph.generatedAt]);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const zoomIn = () =>
    setTransform((t) => ({ ...t, scale: Math.min(MAX_SCALE, t.scale * 1.2) }));
  const zoomOut = () =>
    setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, t.scale / 1.2) }));

  const focusNode = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      setPathNodes(null);
      setPathFeedback('');
      if (!filtered.nodes.some((n) => n.id === nodeId)) {
        setSearchFocusIds([nodeId]);
      } else {
        setSearchFocusIds([]);
      }
      setPendingFocusId(nodeId);
    },
    [filtered.nodes],
  );

  useEffect(() => {
    if (!pendingFocusId || !pos.has(pendingFocusId)) return;
    setTransform(computeFitTransform(pos, [pendingFocusId], dimensions.w, dimensions.h, 48));
    setPendingFocusId(null);
  }, [pendingFocusId, pos, dimensions.w, dimensions.h]);

  useEffect(() => {
    if (!focusEntityRef) return;
    const nodeId = entityRefToGraphNodeId(focusEntityRef);
    if (nodeId) focusNode(nodeId);
  }, [focusEntityRef, focusNode]);

  useEffect(() => {
    if (!pathNodes?.length) return;
    const t = requestAnimationFrame(() => {
      setTransform(computeFitTransform(pos, pathNodes, dimensions.w, dimensions.h));
    });
    return () => cancelAnimationFrame(t);
  }, [pathNodes, layout, dimensions.w, dimensions.h, pos]);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return graph.nodes.filter((n) => nodeMatchesSearch(n, q)).slice(0, 8);
  }, [searchQuery, graph.nodes]);

  const pathNodeOptions = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const ids = new Set<string>();
    for (const n of filtered.nodes) ids.add(n.id);
    if (pathFrom) ids.add(pathFrom);
    if (pathTo) ids.add(pathTo);
    return [...ids]
      .map((id) => byId.get(id))
      .filter((n): n is NonNullable<typeof n> => n != null)
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [graph.nodes, filtered.nodes, pathFrom, pathTo]);

  const findPath = () => {
    setPathFeedback('');
    if (!pathFrom || !pathTo) {
      setPathFeedback('Elige nodo de origen y destino.');
      return;
    }
    if (pathFrom === pathTo) {
      setPathNodes([pathFrom]);
      setPathFeedback('Origen y destino son el mismo nodo.');
      setSelectedId(pathFrom);
      return;
    }
    const path = findShortestPath(pathFrom, pathTo, graph.edges);
    if (path) {
      setPathNodes(path);
      setSearchFocusIds([]);
      setSelectedId(null);
      const hidden = path.filter((id) => !filtered.nodes.some((n) => n.id === id));
      if (hidden.length) {
        const types = [
          ...new Set(
            hidden
              .map((id) => graph.nodes.find((n) => n.id === id)?.type)
              .filter((t): t is GraphNodeType => t != null),
          ),
        ];
        setPathFeedback(
          `Camino de ${path.length - 1} paso(s). Incluye tipos ocultos: ${types.map((t) => GRAPH_TYPE_LABELS[t] ?? t).join(', ')}.`,
        );
      } else {
        setPathFeedback(`Camino de ${path.length - 1} paso(s) entre los nodos elegidos.`);
      }
    } else {
      setPathNodes(null);
      setPathFeedback('Sin camino en el grafo — prueba activar más tipos en los filtros.');
    }
  };

  const pathNodeSet = useMemo(
    () => (pathNodes ? new Set(pathNodes) : null),
    [pathNodes],
  );

  const pathEdgeKeys = useMemo(() => {
    if (!pathNodes || pathNodes.length < 2) return null;
    const keys = new Set<string>();
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const a = pathNodes[i]!;
      const b = pathNodes[i + 1]!;
      keys.add(`${a}|${b}`);
      keys.add(`${b}|${a}`);
    }
    return keys;
  }, [pathNodes]);

  const selectedNode = selectedId ? graph.nodes.find((n) => n.id === selectedId) : null;

  if (!graph.nodes.length) {
    return <p className="muted">Sin nodos — sincronizá reuniones primero.</p>;
  }

  const panelClass = `graph-panel${isFullscreen ? ' graph-panel--fullscreen' : ''}`;
  const typesPresent = [...new Set(filtered.nodes.map((n) => n.type))];

  const panel = (
    <div className={panelClass} ref={panelRef}>
      {isFullscreen ? <div className="graph-fullscreen-backdrop" aria-hidden="true" /> : null}
      <div className="graph-panel-inner">
        <div className="graph-toolbar">
          <div className="graph-toolbar-row">
            <GraphTypeFilters
              enabledTypes={enabledTypes}
              onToggle={toggleType}
              showOrgTypes={Boolean(orgId)}
            />
            <div className="graph-toolbar-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={applyPersonsOnly}
                title="Solo personas y co-asistencia"
              >
                Solo personas
              </button>
              <select
                className="field-input field-input--sm graph-layout-select"
                value={layoutMode}
                onChange={(e) => {
                  const mode = e.target.value as LayoutMode;
                  setLayoutMode(mode);
                  saveLayoutMode(mode);
                  setPinnedPositions(new Map());
                }}
                aria-label="Disposición del grafo"
              >
                <option value="circular">Circular</option>
                <option value="radial">Por tipo</option>
                <option value="force">Libre</option>
              </select>
              <button
                type="button"
                className={`btn btn-ghost btn-sm${showLabels ? '' : ' graph-label-toggle--off'}`}
                aria-pressed={showLabels}
                onClick={() => {
                  const next = !showLabels;
                  setShowLabels(next);
                  saveShowLabels(next);
                }}
              >
                Etiquetas
              </button>
              {onLimitChange ? (
                <select
                  className="field-input field-input--sm graph-limit-select"
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  aria-label="Densidad del grafo"
                >
                  <option value={60}>60 nodos</option>
                  <option value={120}>120 nodos</option>
                  <option value={200}>200 nodos</option>
                </select>
              ) : null}
              {onMemberChange && members ? (
                <select
                  className="field-input field-input--sm graph-member-select"
                  value={memberUid ?? ''}
                  onChange={(e) => onMemberChange(e.target.value || undefined)}
                  aria-label="Filtrar por miembro"
                >
                  <option value="">Todos los miembros</option>
                  {members
                    .filter((m) => m.status === 'active')
                    .map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.displayName?.trim() || m.email}
                      </option>
                    ))}
                </select>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void toggleFullscreen()}
                aria-pressed={isFullscreen}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                <Icon name={isFullscreen ? 'minimize' : 'maximize'} />
                <span className="graph-fs-btn-label">
                  {isFullscreen ? 'Salir' : 'Pantalla completa'}
                </span>
              </button>
            </div>
          </div>
          <div className="graph-toolbar-row graph-toolbar-row--secondary">
            <div className="graph-time-filters" role="group" aria-label="Filtro temporal reuniones">
              {(['30d', '90d', '1y', 'all'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`graph-time-chip${timeRange === r ? ' graph-time-chip--active' : ''}`}
                  aria-pressed={timeRange === r}
                  onClick={() => setTimeRange(r)}
                >
                  {r === 'all' ? 'Todo' : r}
                </button>
              ))}
            </div>
            <div className="graph-path-finder">
              <div className="graph-search-wrap">
                <input
                  type="search"
                  className="field-input field-input--sm graph-search-input"
                  placeholder="Buscar nodo…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchMatches[0]) {
                      focusNode(searchMatches[0].id);
                      setSearchQuery(searchMatches[0].label);
                    }
                  }}
                  aria-label="Buscar nodo"
                  aria-expanded={searchMatches.length > 0}
                  aria-controls="graph-search-results"
                />
                {searchMatches.length ? (
                  <ul className="graph-search-results" id="graph-search-results">
                    {searchMatches.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className="kpi-link"
                          onClick={() => {
                            focusNode(n.id);
                            setSearchQuery(n.label);
                          }}
                        >
                          {n.label}
                          <span className="muted"> · {GRAPH_TYPE_LABELS[n.type] ?? n.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <select
                className="field-input field-input--sm"
                value={pathFrom}
                onChange={(e) => {
                  setPathFrom(e.target.value);
                  setPathFeedback('');
                }}
                aria-label="Camino desde"
              >
                <option value="">Desde…</option>
                {pathNodeOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label.slice(0, 40)}
                  </option>
                ))}
              </select>
              <select
                className="field-input field-input--sm"
                value={pathTo}
                onChange={(e) => {
                  setPathTo(e.target.value);
                  setPathFeedback('');
                }}
                aria-label="Camino hasta"
              >
                <option value="">Hasta…</option>
                {pathNodeOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label.slice(0, 40)}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" onClick={findPath}>
                Mostrar camino
              </button>
              {pathActive ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setPathNodes(null);
                    setPathFeedback('');
                  }}
                >
                  Limpiar camino
                </button>
              ) : null}
            </div>
            <div className="graph-view-controls">
              <button type="button" className="btn btn-ghost btn-sm" onClick={zoomOut} aria-label="Alejar">
                −
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetView}>
                Reset
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={zoomIn} aria-label="Acercar">
                +
              </button>
            </div>
          </div>
          <p className={`muted graph-meta${pathFeedback && pathFeedback.startsWith('Sin') ? ' graph-meta--warn' : ''}`}>
            {viz.nodes.length} nodos visibles
            {filtered.hiddenCount > 0 ? ` · ${filtered.hiddenCount} ocultos por filtros` : ''}
            · {viz.edges.length} vínculos · click para resaltar · Explorar en panel lateral
            {pathFeedback ? ` · ${pathFeedback}` : ''}
          </p>
          <div className="graph-legend">
            {typesPresent.map((t) => (
              <span key={t} className="graph-legend-item">
                <i style={{ background: GRAPH_COLORS[t] ?? '#64748b' }} />
                {GRAPH_TYPE_LABELS[t] ?? t}
              </span>
            ))}
          </div>
          <div className="graph-edge-legend">
            {['attended', 'co_attended', 'works_on', 'about'].map((kind) => (
              <span key={kind} className="graph-edge-legend-item">
                <svg width="24" height="8" aria-hidden="true">
                  <line
                    x1="0"
                    y1="4"
                    x2="24"
                    y2="4"
                    className={`graph-edge-legend-line${kind === 'co_attended' ? ' graph-edge--dashed' : ''}`}
                    strokeWidth={kind === 'co_attended' ? 2 : 1}
                  />
                </svg>
                {GRAPH_EDGE_KIND_LABELS[kind] ?? kind}
              </span>
            ))}
          </div>
        </div>

        <div className="graph-canvas-wrap" ref={containerRef}>
          <button
            type="button"
            className="graph-canvas-fullscreen-btn"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Abrir pantalla completa'}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            <Icon name={isFullscreen ? 'minimize' : 'maximize'} />
          </button>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${dimensions.w} ${dimensions.h}`}
            className="graph-svg"
            role="img"
            aria-label="Grafo de relaciones"
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerLeave={handleSvgPointerUp}
            onClick={(e) => {
              if (e.target === svgRef.current) {
                setSelectedId(null);
                setPathNodes(null);
                setPathFeedback('');
                setSearchFocusIds([]);
              }
            }}
          >
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
              {viz.edges.map((e) => {
                const a = pos.get(e.source);
                const b = pos.get(e.target);
                if (!a || !b) return null;
                const dashed = e.kind === 'prospect_attended' || e.kind === 'co_attended';
                const isPath =
                  pathEdgeKeys?.has(`${e.source}|${e.target}`) ||
                  pathEdgeKeys?.has(`${e.target}|${e.source}`);
                const isHighlight =
                  isPath ||
                  (hasSelection && (e.source === selectedId || e.target === selectedId));
                const isDim = pathActive ? !isPath : hasSelection && !isHighlight;
                return (
                  <line
                    key={e.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={`graph-edge${dashed ? ' graph-edge--dashed' : ''}${isPath ? ' graph-edge--path' : ''}${isHighlight ? ' graph-edge--highlight' : ''}${isDim ? ' graph-edge--dim' : ''}`}
                    strokeWidth={isPath ? edgeStrokeWidth(e.weight) + 1.5 : edgeStrokeWidth(e.weight)}
                  />
                );
              })}
              {layout.map((n) => {
                const isSelected = n.id === selectedId;
                const isNeighbor = neighborIds.has(n.id);
                const isPathNode = pathNodeSet?.has(n.id);
                const isSelf = selfNodeId === n.id;
                const isDim = pathActive
                  ? !isPathNode
                  : hasSelection && !isSelected && !isNeighbor;
                const showLabel = showLabels;
                const badge = nodeBadges?.get(n.id);

                return (
                  <g
                    key={n.id}
                    className={`graph-node${isSelected ? ' graph-node--selected' : ''}${isNeighbor ? ' graph-node--neighbor' : ''}${isPathNode ? ' graph-node--path' : ''}${isDim ? ' graph-node--dim' : ''}${isSelf ? ' graph-node--self' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onPointerDown={(e) => {
                      if (!allowNodeDrag) return;
                      e.stopPropagation();
                      dragRef.current = { nodeId: n.id, startX: e.clientX, startY: e.clientY };
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(n.id);
                      setPathNodes(null);
                      setPathFeedback('');
                      setSearchFocusIds([]);
                    }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isSelected ? n.radius + 3 : n.radius}
                      fill={GRAPH_COLORS[n.type] ?? '#64748b'}
                      className="graph-node-circle"
                      opacity={isDim ? 0.2 : 0.92}
                    />
                    {badge?.kind === 'hub' ? (
                      <circle cx={n.x + n.radius} cy={n.y - n.radius} r={4} className="graph-badge-dot graph-badge-dot--hub" />
                    ) : null}
                    {badge?.kind === 'cooling' ? (
                      <circle cx={n.x + n.radius} cy={n.y - n.radius} r={4} className="graph-badge-dot graph-badge-dot--cooling" />
                    ) : null}
                    {isSelf ? (
                      <text x={n.x} y={n.y - n.radius - 6} textAnchor="middle" className="graph-self-tag">
                        Tú
                      </text>
                    ) : null}
                    {showLabel ? (
                      <>
                        <title>{n.label}</title>
                        <text x={n.x} y={n.y + n.radius + 14} textAnchor="middle" className="graph-label">
                          {n.label.slice(0, 28)}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {selectedNode ? (
          <GraphSidepanel
            node={selectedNode}
            edges={viz.edges}
            allNodes={viz.nodes}
            onExplore={() => onExploreNode?.(selectedNode.id)}
            onSelectNeighbor={setSelectedId}
            orgId={orgId}
            badge={nodeBadges?.get(selectedNode.id)}
            peopleView={peopleView}
            peopleActions={peopleActions}
            maintenanceItems={maintenanceItems}
          />
        ) : null}
      </div>
    </div>
  );

  return isFullscreen ? createPortal(panel, document.body) : panel;
}
