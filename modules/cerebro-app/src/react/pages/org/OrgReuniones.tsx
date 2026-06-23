import { useParams } from 'react-router-dom';
import { PageHeader } from '../../ds.js';
import { useOrgMeetingsView } from '../../hooks.js';
import { MeetingsExplorer, type MeetingsQueryParams } from '../../components/MeetingsExplorer.js';

export default function OrgReuniones() {
  const { orgId = '' } = useParams();
  return (
    <div>
      <PageHeader
        title="Reuniones"
        desc="Reuniones aportadas por los miembros de la organización."
      />
      <MeetingsExplorer
        useMeetings={(params: MeetingsQueryParams) => useOrgMeetingsView(orgId, params)}
        linkBase={`/org/${orgId}/reuniones`}
        emptyDesc="Los miembros tienen que aportar sus datos desde el resumen de la organización."
      />
    </div>
  );
}
