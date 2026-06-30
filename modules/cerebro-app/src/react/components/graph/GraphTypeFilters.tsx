import type { GraphNodeType } from '@shared/types.js';
import { GRAPH_COLORS, GRAPH_TYPE_LABELS } from './graph-utils.js';

const BASE_TYPES: GraphNodeType[] = ['person', 'prospect', 'meeting', 'project', 'team'];
const ORG_EXTRA_TYPES: GraphNodeType[] = ['todo', 'member'];

export function GraphTypeFilters({
  enabledTypes,
  onToggle,
  showOrgTypes,
}: {
  enabledTypes: Set<GraphNodeType>;
  onToggle: (type: GraphNodeType) => void;
  showOrgTypes?: boolean;
}) {
  const visibleTypes = showOrgTypes ? [...BASE_TYPES, ...ORG_EXTRA_TYPES] : BASE_TYPES;

  return (
    <div className="graph-type-filters" role="group" aria-label="Filtrar tipos de nodo">
      {visibleTypes.map((type) => {
        const active = enabledTypes.has(type);
        return (
          <button
            key={type}
            type="button"
            className={`graph-type-chip${active ? ' graph-type-chip--active' : ''}`}
            aria-pressed={active}
            onClick={() => onToggle(type)}
          >
            <i style={{ background: GRAPH_COLORS[type] ?? '#64748b' }} />
            {GRAPH_TYPE_LABELS[type] ?? type}
          </button>
        );
      })}
    </div>
  );
}
