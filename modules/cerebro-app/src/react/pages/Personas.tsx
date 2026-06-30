import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../ds.js';
import { useMaintenanceView, usePeopleView } from '../hooks.js';
import { PeopleDirectory, type PeopleActions } from '../components/PeopleDirectory.js';
import { QueueStatusPill } from '../components/AsyncActionButton.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';

const personalActions: PeopleActions = {
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

export default function Personas() {
  const queue = useActionQueue();
  const { data, isPending, error, refetch } = usePeopleView();
  const maintenance = useMaintenanceView();
  const [params] = useSearchParams();
  const initialQuery = params.get('q') ?? undefined;
  const filtroParam = params.get('filtro');
  const initialFilter =
    filtroParam === 'inferred' || filtroParam === 'confirmed' ? filtroParam : undefined;

  return (
    <div>
      <PageHeader
        title="Personas"
        desc="Contactos confirmados y personas detectadas en tus reuniones, con su nivel de confianza."
        actions={<QueueStatusPill count={queue.pendingCount} />}
      />
      {isPending && !data ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <PeopleDirectory
          view={data}
          actions={personalActions}
          maintenanceItems={maintenance.data?.items}
          initialQuery={initialQuery}
          initialFilter={initialFilter}
        />
      )}
    </div>
  );
}
