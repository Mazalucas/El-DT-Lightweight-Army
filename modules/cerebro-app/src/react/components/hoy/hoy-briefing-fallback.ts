import type { CalendarTodayView, DashboardView } from '@shared/types.js';

export function buildFallbackBriefing(
  d: DashboardView,
  firstName: string,
  calendar?: CalendarTodayView | null,
): { headline: string; summary: string; focus: string[] } {
  const { attention, dailyTodos } = d;
  const parts: string[] = [];
  if (attention.overdueCount) parts.push(`${attention.overdueCount} vencida${attention.overdueCount === 1 ? '' : 's'}`);
  if (attention.todayCount) parts.push(`${attention.todayCount} para hoy`);
  if (attention.suggestedCount) parts.push(`${attention.suggestedCount} sugerida${attention.suggestedCount === 1 ? '' : 's'} de reuniones`);
  if (calendar?.nextEvent) {
    const t = calendar.nextEvent.allDay
      ? 'hoy'
      : new Date(calendar.nextEvent.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    parts.push(`próximo: ${calendar.nextEvent.title} (${t})`);
  }

  const headline =
    parts.length > 0
      ? `Buen día, ${firstName}: ${parts.join(' · ')}.`
      : `Buen día, ${firstName}: sin urgencias marcadas — buen momento para revisar reuniones recientes.`;

  const summaryParts: string[] = [];
  if (calendar?.eventCount) summaryParts.push(`${calendar.eventCount} evento${calendar.eventCount === 1 ? '' : 's'} en tu agenda.`);
  if (attention.weekMeetingCount) summaryParts.push(`${attention.weekMeetingCount} reuniones esta semana indexadas.`);
  if (attention.maintenanceCount) summaryParts.push(`${attention.maintenanceCount} item${attention.maintenanceCount === 1 ? '' : 's'} en mantenimiento.`);

  const focus: string[] = [];
  if (attention.overdueCount) focus.push(`Completar o reprogramar ${attention.overdueCount} tarea${attention.overdueCount === 1 ? '' : 's'} vencida${attention.overdueCount === 1 ? '' : 's'}.`);
  if (attention.todayCount) focus.push(`Cerrar las ${attention.todayCount} tarea${attention.todayCount === 1 ? '' : 's'} con vencimiento hoy.`);
  if (attention.suggestedCount) focus.push('Aceptar o descartar tareas sugeridas de reuniones recientes.');
  if (calendar?.nextEvent && calendar.nextEvent.status === 'upcoming') {
    focus.push(`Preparar "${calendar.nextEvent.title}" antes de que empiece.`);
  }
  if (dailyTodos.noDate.length) focus.push(`Revisar ${dailyTodos.noDate.length} tarea${dailyTodos.noDate.length === 1 ? '' : 's'} abiertas sin fecha.`);
  if (!focus.length) focus.push('Revisar reuniones recientes y actualizar tareas del tablero.');

  return {
    headline,
    summary: summaryParts.join(' ') || 'Tu tablero está al día.',
    focus: focus.slice(0, 5),
  };
}

export function userFirstName(displayName?: string | null, email?: string | null): string {
  const fromDisplay = displayName?.trim().split(/\s+/)[0];
  if (fromDisplay) return fromDisplay;
  const local = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim().split(/\s+/)[0];
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return 'ahí';
}
