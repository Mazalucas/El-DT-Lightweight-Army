import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { LocaleSettings, TimezoneSource } from '@shared/types.js';
import { browserTimezone, resolveClientTimezone } from '@shared/timezone.js';
import { api } from '../../lib/api.js';
import { Button, Field, Segmented, toast } from '../ds.js';
import { useSettings } from '../hooks.js';

const COMMON_TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Mexico_City',
  'America/Bogota',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'UTC',
];

function listIanaTimezones(): string[] {
  try {
    const supported = Intl.supportedValuesOf('timeZone');
    return supported.length ? supported : COMMON_TIMEZONES;
  } catch {
    return COMMON_TIMEZONES;
  }
}

function defaultLocale(): LocaleSettings {
  return {
    timezoneSource: 'device',
    timezone: browserTimezone(),
  };
}

export function RegionalSettingsSection() {
  const settings = useSettings();
  const google = useQuery({ queryKey: ['google', 'status'], queryFn: api.googleStatus });
  const locale: LocaleSettings = settings.data?.locale ?? defaultLocale();
  const effectiveTz = useMemo(
    () => resolveClientTimezone(settings.data),
    [settings.data],
  );
  const timezoneOptions = useMemo(() => listIanaTimezones(), []);

  const save = useMutation({
    mutationFn: (patch: Partial<LocaleSettings> & { timezoneSource?: TimezoneSource }) =>
      api.saveConfig({
        locale: {
          ...locale,
          ...patch,
        },
      }),
    onSuccess: () => {
      void settings.refetch();
      toast('Zona horaria guardada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const refreshGoogle = useMutation({
    mutationFn: () => api.refreshGoogleTimezone(),
    onSuccess: () => {
      void settings.refetch();
      toast('Zona horaria actualizada desde Google Calendar');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const googleConnected = google.data?.connected ?? false;
  const hasCalendar = google.data?.hasCalendarScope ?? false;
  const deviceTz = browserTimezone();

  return (
    <div data-cerebro-target="settings.regional">
      <Field label="Fuente de zona horaria">
        <Segmented
          ariaLabel="Fuente de zona horaria"
          options={[
            { id: 'device', label: 'Dispositivo' },
            { id: 'google_calendar', label: 'Google Calendar' },
            { id: 'manual', label: 'Manual' },
          ]}
          value={locale.timezoneSource}
          onChange={(v: string) => {
            const source = v as TimezoneSource;
            if (source === 'device') {
              save.mutate({ timezoneSource: source, timezone: deviceTz });
            } else if (source === 'google_calendar') {
              const tz = locale.googleCalendarTimezone ?? locale.timezone;
              save.mutate({ timezoneSource: source, timezone: tz });
            } else {
              save.mutate({ timezoneSource: source, timezone: locale.timezone });
            }
          }}
        />
      </Field>

      <p className="muted settings-subblock-desc">
        Zona efectiva: <strong>{effectiveTz}</strong>
      </p>

      {locale.timezoneSource === 'device' ? (
        <p className="muted settings-subblock-desc">
          Detectada en este dispositivo: {deviceTz}. Se actualiza al abrir la app o al volver a esta pestaña.
        </p>
      ) : null}

      {locale.timezoneSource === 'google_calendar' ? (
        <div className="settings-subblock">
          <p className="muted settings-subblock-desc">
            {locale.googleCalendarTimezone
              ? `Calendario primario: ${locale.googleCalendarTimezone}`
              : hasCalendar
                ? 'Sin cache — actualizá desde Google.'
                : 'Conectá Google Calendar en Cerebro Profesional para usar esta opción.'}
          </p>
          <Button
            size="sm"
            variant="secondary"
            loading={refreshGoogle.isPending}
            disabled={!googleConnected || !hasCalendar}
            onClick={() => refreshGoogle.mutate()}
          >
            Actualizar desde Google
          </Button>
        </div>
      ) : null}

      {locale.timezoneSource === 'manual' ? (
        <Field label="Zona horaria (IANA)">
          <select
            className="field-input"
            value={locale.timezone}
            onChange={(e) => save.mutate({ timezone: e.target.value, timezoneSource: 'manual' })}
          >
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
    </div>
  );
}
