import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { ErrorState, PageHeader, Skeleton } from '../ds.js';
import { usePeopleView } from '../hooks.js';
import { PeopleDirectory, type PeopleActions } from '../components/PeopleDirectory.js';

const personalActions: PeopleActions = {
  updatePerson: (id, patch) => api.updatePerson(id, patch),
  promoteProspect: (id, email, displayName) => api.promoteProspect(id, email, displayName),
  linkProspect: (prospectId, personId) => api.linkProspect(prospectId, personId),
  getProspectCandidates: (prospectId) => api.getProspectCandidates(prospectId),
};

export default function Personas() {
  const { data, isPending, error, refetch } = usePeopleView();
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
      />
      {isPending ? (
        <Skeleton lines={8} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : (
        <PeopleDirectory
          view={data}
          actions={personalActions}
          initialQuery={initialQuery}
          initialFilter={initialFilter}
        />
      )}
    </div>
  );
}
