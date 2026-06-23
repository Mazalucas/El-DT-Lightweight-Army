import { PageHeader } from '../ds.js';
import { useDashboard, useMeetingsView } from '../hooks.js';
import { SyncButton } from '../components/SyncControls.js';
import { MeetingsExplorer, type MeetingsQueryParams } from '../components/MeetingsExplorer.js';

export default function Reuniones() {
  const dashboard = useDashboard();
  return (
    <div>
      <PageHeader
        title="Reuniones"
        desc="Todo lo que entra desde Meet, ordenado por fecha."
        actions={<SyncButton running={dashboard.data?.syncRunning} />}
      />
      <MeetingsExplorer
        useMeetings={(params: MeetingsQueryParams) => useMeetingsView(params)}
        linkBase="/reuniones"
      />
    </div>
  );
}
