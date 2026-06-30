import type { MeetingPrepInsight } from '@shared/types.js';
import { HoyEventInsight } from './HoyEventInsight.js';

const MAX_CARDS = 3;

export function HoyMeetingPrepCards({ insights }: { insights: MeetingPrepInsight[] }) {
  const cards = insights.slice(0, MAX_CARDS);
  if (!cards.length) return null;

  return (
    <div className="hoy-meeting-prep">
      <h4 className="hoy-meeting-prep-title">Antes de tus reuniones</h4>
      <ul className="hoy-meeting-prep-list">
        {cards.map((insight) => {
          const time = new Date(insight.eventStart).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <li key={insight.calendarEventId} className="hoy-meeting-prep-card">
              <span className="hoy-meeting-prep-time">{time}</span>
              <a href={`#cal-${insight.calendarEventId}`} className="hoy-meeting-prep-event">
                {insight.eventTitle}
              </a>
              <HoyEventInsight insight={insight} />
            </li>
          );
        })}
      </ul>
      {insights.length > MAX_CARDS ? (
        <a href="#hoy-calendar" className="hoy-strip-more">
          Ver {insights.length - MAX_CARDS} más en agenda
        </a>
      ) : null}
    </div>
  );
}
