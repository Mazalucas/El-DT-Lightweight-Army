import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CalendarEventItem, CalendarTodayView, MeetingPrepInsight } from '@shared/types.js';
import { api } from '../../../lib/api.js';
import { Button, Skeleton, toast } from '../../ds.js';
import { useSync } from '../../sync-context.js';
import { HoyEventInsight } from './HoyEventInsight.js';

function formatEventTime(event: CalendarEventItem): string {
  if (event.allDay) return 'Todo el día';
  return new Date(event.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(event: CalendarEventItem): string {
  if (event.allDay) return '';
  const mins = Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / 60000);
  if (mins < 1) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function minutesUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
}

function CalendarEventRow({
  event,
  insight,
}: {
  event: CalendarEventItem;
  insight?: MeetingPrepInsight;
}) {
  const duration = formatDuration(event);
  return (
    <li
      id={`cal-${event.id}`}
      className={`hoy-calendar-event hoy-calendar-event--${event.status ?? 'upcoming'}${event.linkedMeetingId ? ' hoy-calendar-event--linked' : ''}`}
    >
      <div className="hoy-calendar-event-time">{formatEventTime(event)}</div>
      <div className="hoy-calendar-event-body">
        <div className="hoy-calendar-event-head">
          <strong>{event.title}</strong>
          {event.status === 'ongoing' ? <span className="hoy-calendar-now-badge">Ahora</span> : null}
        </div>
        {duration ? <span className="muted hoy-calendar-event-meta">{duration}</span> : null}
        <div className="hoy-calendar-event-actions">
          {event.meetLink ? (
            <a href={event.meetLink} target="_blank" rel="noreferrer" className="hoy-inline-link">
              Unirse
            </a>
          ) : null}
          {event.linkedMeetingId ? (
            <Link to={`/reuniones/${event.linkedMeetingId}`} className="hoy-inline-link">
              Notas
            </Link>
          ) : null}
        </div>
        {insight ? <HoyEventInsight insight={insight} compact /> : null}
      </div>
    </li>
  );
}

export function HoyCalendarPanel({
  data,
  isPending,
  error,
  onRetry,
  meetingPrepInsights,
}: {
  data?: CalendarTodayView;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  meetingPrepInsights?: MeetingPrepInsight[];
}) {
  const { hasGoogleIntegration } = useSync();

  const activateCalendar = useMutation({
    mutationFn: async () => {
      const { url } = await api.googleCalendarStart();
      window.location.href = url;
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  if (isPending) {
    return (
      <section className="dash-panel hoy-calendar-panel" id="hoy-calendar">
        <Skeleton lines={4} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="dash-panel hoy-calendar-panel" id="hoy-calendar">
        <p className="dash-empty muted">No se pudo cargar la agenda.</p>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </section>
    );
  }

  const upcoming = data?.events.filter((e) => e.status !== 'past') ?? [];
  const nextIn = data?.nextEvent ? minutesUntil(data.nextEvent.startAt) : null;
  const insightsByEventId = new Map(
    (meetingPrepInsights ?? []).map((i) => [i.calendarEventId, i]),
  );

  return (
    <section className="dash-panel hoy-calendar-panel hoy-calendar-panel--featured" id="hoy-calendar">
      <div className="dash-panel-head">
        <div>
          <h3>Agenda de hoy</h3>
          <p className="hoy-panel-desc">Tu calendario de Google — qué viene y cuándo empezar a prepararte.</p>
        </div>
        {data?.ongoingEvent ? (
          <span className="hoy-calendar-now-badge">En curso</span>
        ) : nextIn !== null && data?.nextEvent ? (
          <span className="muted hoy-calendar-next-hint">
            Próximo en {nextIn === 0 ? 'minutos' : `${nextIn} min`}
          </span>
        ) : null}
      </div>

      {!hasGoogleIntegration ? (
        <p className="dash-empty muted">
          Conectá Google en{' '}
          <Link to="/ajustes?section=profesional">Ajustes</Link> para ver tu agenda.
        </p>
      ) : !data?.hasCalendarAccess ? (
        <div className="hoy-calendar-empty">
          <p className="muted">Activá el permiso de Google Calendar para ver eventos del día.</p>
          <Button
            variant="secondary"
            size="sm"
            loading={activateCalendar.isPending}
            onClick={() => activateCalendar.mutate()}
          >
            Activar agenda
          </Button>
        </div>
      ) : !upcoming.length ? (
        <p className="dash-empty muted">Día libre de eventos en tu calendario.</p>
      ) : (
        <ul className="hoy-calendar-list">
          {upcoming.map((e) => (
            <CalendarEventRow key={e.id} event={e} insight={insightsByEventId.get(e.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}
