import { DEFAULT_APP_TIMEZONE } from '../shared/timezone.js';
/** Resuelve referencias de fecha del usuario/asistente al día en la zona horaria dada. */
export function parseCalendarDateInput(input, timezone, now = new Date()) {
    const normalized = input?.trim().toLowerCase();
    if (!normalized || normalized === 'today' || normalized === 'hoy') {
        return now;
    }
    if (normalized === 'tomorrow' || normalized === 'mañana' || normalized === 'manana') {
        const fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const todayKey = fmt.format(now);
        const [y, m, d] = todayKey.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        const [y, m, d] = normalized.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }
    return now;
}
export { DEFAULT_APP_TIMEZONE as CALENDAR_DEFAULT_TIMEZONE };
