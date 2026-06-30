import type { CalendarTodayView, DashboardView } from '@shared/types.js';
import { api } from '../../../lib/api.js';
import { Button, toast } from '../../ds.js';
import { useAuth } from '../../auth.js';
import { buildFallbackBriefing, userFirstName } from './hoy-briefing-fallback.js';
import { HoyMeetingPrepCards } from './HoyMeetingPrepCards.js';
import { useEntityMutation } from '../../lib/entity-action/use-entity-mutation.js';

export function HoyBriefing({
  dashboard,
  calendar,
}: {
  dashboard: DashboardView;
  calendar?: CalendarTodayView | null;
}) {
  const { user } = useAuth();
  const { useEntityMutate } = useEntityMutation();
  const firstName = userFirstName(user?.displayName, user?.email);

  const regenerate = useEntityMutate(
    'hoy-regenerate-briefing',
    () => api.runIntelligence(),
    {
      success: (r) =>
        r.suggestions ? `${r.suggestions} sugerencias · briefing actualizado` : 'Briefing actualizado',
    },
  );

  const digestStale = dashboard.digest && dashboard.digest.date !== dashboard.date;
  const meetingPrepInsights = dashboard.meetingPrepInsights?.length ? dashboard.meetingPrepInsights : [];
  const briefing = dashboard.digest && !digestStale
    ? {
        headline: dashboard.digest.headline,
        summary: dashboard.digest.summary,
        focus: dashboard.digest.focus,
        fromAi: true,
      }
    : { ...buildFallbackBriefing(dashboard, firstName, calendar), fromAi: false };

  return (
    <section className="hoy-briefing">
      <div className="hoy-briefing-head">
        <h3 className="hoy-briefing-headline">{briefing.headline}</h3>
        {dashboard.hasLlmKey ? (
          <Button
            variant="ghost"
            size="sm"
            loading={regenerate.isPending}
            onClick={() => regenerate.run()}
          >
            {digestStale ? 'Actualizar briefing' : 'Regenerar'}
          </Button>
        ) : null}
      </div>
      <p className="hoy-briefing-summary">{briefing.summary}</p>
      {briefing.focus.length ? (
        <ul className="hoy-focus-list">
          {briefing.focus.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      ) : null}
      {meetingPrepInsights.length ? <HoyMeetingPrepCards insights={meetingPrepInsights} /> : null}
      {!briefing.fromAi && dashboard.hasLlmKey ? (
        <p className="muted hoy-briefing-note">Briefing automático — regenerá con IA para un resumen más fino.</p>
      ) : null}
    </section>
  );
}
