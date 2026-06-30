import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, ErrorState, Skeleton } from '../ds.js';
import { useDashboard, useCalendarToday } from '../hooks.js';
import { HoyHero } from '../components/hoy/HoyHero.js';
import { HoyBriefing } from '../components/hoy/HoyBriefing.js';
import { HoyAttentionBar } from '../components/hoy/HoyAttentionBar.js';
import { HoyCalendarPanel } from '../components/hoy/HoyCalendarPanel.js';
import { HoyUrgentStrip } from '../components/hoy/HoyUrgentStrip.js';
import { HoyPendingStrip } from '../components/hoy/HoyPendingStrip.js';
import { HoySmartStrip } from '../components/hoy/HoySmartStrip.js';
import { HoyRecentMeetings } from '../components/hoy/HoyRecentMeetings.js';

export default function Hoy() {
  const { data, isPending, error, refetch } = useDashboard();
  const calendar = useCalendarToday(Boolean(data?.hasGoogleIntegration));
  const navigate = useNavigate();

  if (isPending) {
    return (
      <div className="prof-dashboard">
        <Skeleton lines={6} />
      </div>
    );
  }
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  const d = data;
  const hasUrgent = d.attention.overdueCount + d.attention.todayCount > 0;
  const hasPending = d.dailyTodos.suggested.length > 0;
  const hasSmart = d.suggestions.length > 0;
  const hasSecondary = hasUrgent || hasPending || hasSmart;

  return (
    <div className="prof-dashboard hoy-dashboard">
      <HoyHero lastSyncAt={d.lastSyncAt} />

      {!d.setupComplete ? (
        <EmptyState
          title="Configurá la ingesta automática"
          desc="Conectá Google y elegí tus carpetas de Meet para que las reuniones entren solas."
          action={<Button onClick={() => navigate('/ajustes?section=profesional')}>Ir a Ajustes</Button>}
        />
      ) : null}

      <HoyBriefing dashboard={d} calendar={calendar.data} />
      <HoyAttentionBar attention={d.attention} />

      <HoyCalendarPanel
        data={calendar.data}
        isPending={calendar.isPending}
        error={calendar.error}
        onRetry={() => void calendar.refetch()}
        meetingPrepInsights={d.meetingPrepInsights}
      />

      {hasSecondary ? (
        <div
          className={`hoy-secondary-grid${hasUrgent && hasPending && hasSmart ? ' hoy-secondary-grid--3' : hasUrgent && (hasPending || hasSmart) ? ' hoy-secondary-grid--2' : ''}`}
        >
          {hasUrgent ? <HoyUrgentStrip dailyTodos={d.dailyTodos} attention={d.attention} /> : null}
          {hasPending ? <HoyPendingStrip dailyTodos={d.dailyTodos} attention={d.attention} /> : null}
          {hasSmart ? <HoySmartStrip suggestions={d.suggestions} /> : null}
        </div>
      ) : null}

      <HoyRecentMeetings meetings={d.recentMeetings} limit={4} />
    </div>
  );
}
