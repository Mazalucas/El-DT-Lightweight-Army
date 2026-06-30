import { PageHeader } from '../ds.js';
import { useMeetingsView } from '../hooks.js';
import { MeetingsExplorer, type MeetingsQueryParams } from '../components/MeetingsExplorer.js';

export default function Reuniones() {
  return (
    <div>
      <PageHeader
        title="Reuniones"
        desc="Todo lo que entra desde Meet, ordenado por fecha."
      />
      <MeetingsExplorer
        useMeetings={(params: MeetingsQueryParams) => useMeetingsView(params)}
        linkBase="/reuniones"
      />
    </div>
  );
}
