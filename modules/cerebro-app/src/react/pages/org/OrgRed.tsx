import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState, PageHeader, Skeleton } from '../../ds.js';
import { useOrgGraph } from '../../hooks.js';
import { GraphPanel } from '../../components/GraphPanel.js';

export default function OrgRed() {
  const { orgId = '' } = useParams();
  const [center, setCenter] = useState<string | undefined>(undefined);
  const graph = useOrgGraph(orgId, center ? { center, depth: 2 } : undefined);

  return (
    <div>
      <PageHeader title="Red" desc="Relaciones agregadas de toda la organización." />
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
          <GraphPanel graph={graph.data.graph} onNodeClick={(id) => setCenter(id)} />
        </>
      )}
    </div>
  );
}
