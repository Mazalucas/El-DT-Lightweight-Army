import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../../ds.js';
import { useOrgPeopleView } from '../../hooks.js';
import { PeopleDirectory, type PeopleActions } from '../../components/PeopleDirectory.js';
import { QueueStatusPill } from '../../components/AsyncActionButton.js';
import { useActionQueue } from '../../lib/action-queue/ActionQueueProvider.js';

function orgActions(orgId: string): PeopleActions {
  return {
    updatePerson: (id, patch) => api.orgUpdatePerson(orgId, id, patch),
    promoteProspect: (id, email, displayName, enrichment) =>
      api.orgPromoteProspect(orgId, id, email, displayName, enrichment),
    linkProspect: (prospectId, personId, enrichment) =>
      api.orgLinkProspect(orgId, prospectId, personId, enrichment),
    dismissProspect: (prospectId) => api.orgDismissProspect(orgId, prospectId),
    restoreProspectDismiss: (snapshot) => api.orgRestoreProspectDismiss(orgId, snapshot),
    getProspectCandidates: (prospectId) => api.orgGetProspectCandidates(orgId, prospectId),
    createTeam: (name) => api.orgCreateTeam(orgId, name).then((r) => r.team),
    createProject: (name) => api.orgCreateProject(orgId, name).then((r) => r.project),
  };
}

export default function OrgPersonas() {
  const queue = useActionQueue();
  const { orgId = '' } = useParams();
  const { data, isPending, error, refetch } = useOrgPeopleView(orgId);

  return (
    <div>
      <PageHeader
        title="Personas"
        desc="Directorio compartido de la organización — contactos y personas detectadas."
        actions={<QueueStatusPill count={queue.pendingCount} />}
      />
      {isPending && !data ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <PeopleDirectory view={data} actions={orgActions(orgId)} />
      )}
    </div>
  );
}
