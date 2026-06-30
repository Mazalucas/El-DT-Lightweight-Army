import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState, PageHeader, Skeleton } from '../../ds.js';
import { useOrgGraph, useOrgMembers } from '../../hooks.js';
import { GraphPanel } from '../../components/GraphPanel.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';

export default function OrgRed() {
  const { orgId = '' } = useParams();
  const [center, setCenter] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(120);
  const [memberUid, setMemberUid] = useState<string | undefined>(undefined);
  const focusedEntity = useEntityLifecycleStore((s) => s.focusedEntity);
  const members = useOrgMembers(orgId);
  const graph = useOrgGraph(orgId, {
    center,
    depth: center ? 2 : undefined,
    limit,
    memberUid,
  });

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
          <GraphPanel
            graph={graph.data.graph}
            onExploreNode={(id) => setCenter(id)}
            orgId={orgId}
            limit={limit}
            onLimitChange={setLimit}
            memberUid={memberUid}
            onMemberChange={setMemberUid}
            members={members.data?.members}
            focusEntityRef={focusedEntity}
          />
        </>
      )}
    </div>
  );
}
