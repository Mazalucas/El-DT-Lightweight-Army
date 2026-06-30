import { useMutation } from '@tanstack/react-query';
import type { CerebroSettingsPrefs } from '@shared/types.js';
import { api } from '../../../lib/api.js';
import { Field, Segmented, toast } from '../../ds.js';
import { useSettings } from '../../hooks.js';

export function CerebroSettingsSection() {
  const settings = useSettings();
  const prefs: CerebroSettingsPrefs = {
    proactiveLevel: settings.data?.cerebro?.proactiveLevel ?? 'subtle',
    meetingReminderMinutes: settings.data?.cerebro?.meetingReminderMinutes ?? 10,
    chipMeetingMinutesMax: settings.data?.cerebro?.chipMeetingMinutesMax ?? 90,
    liveElements: settings.data?.cerebro?.liveElements ?? false,
  };

  const save = useMutation({
    mutationFn: (patch: Partial<CerebroSettingsPrefs>) =>
      api.saveConfig({ cerebro: { ...prefs, ...patch } }),
    onSuccess: () => {
      void settings.refetch();
      toast('Preferencias de Cerebro guardadas');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <div data-cerebro-target="settings.cerebro_prefs">
      <Field label="Proactividad">
        <Segmented
          ariaLabel="Nivel proactivo"
          options={[
            { id: 'off', label: 'Off' },
            { id: 'subtle', label: 'Sutil' },
            { id: 'active', label: 'Activo' },
          ]}
          value={prefs.proactiveLevel}
          onChange={(v: string) => save.mutate({ proactiveLevel: v as CerebroSettingsPrefs['proactiveLevel'] })}
        />
      </Field>
      <p className="muted settings-subblock-desc">
        Sutil: avisos visuales (moment_card) sin interrumpir con IA. Activo: redacción contextual opcional.
      </p>
      <Field label="Aviso reunión (moment_card)">
        <select
          className="field-input"
          value={String(prefs.meetingReminderMinutes)}
          onChange={(e) =>
            save.mutate({
              meetingReminderMinutes: Number(e.target.value) as CerebroSettingsPrefs['meetingReminderMinutes'],
            })
          }
        >
          <option value="10">10 min antes</option>
          <option value="15">15 min antes</option>
          <option value="30">30 min antes</option>
        </select>
      </Field>
      <Field label="Chip de reunión en header">
        <select
          className="field-input"
          value={String(prefs.chipMeetingMinutesMax)}
          onChange={(e) =>
            save.mutate({
              chipMeetingMinutesMax: Number(e.target.value) as CerebroSettingsPrefs['chipMeetingMinutesMax'],
            })
          }
        >
          <option value="60">Hasta 60 min</option>
          <option value="90">Hasta 90 min</option>
          <option value="120">Hasta 120 min</option>
        </select>
      </Field>
      <Field label="Elementos vivos (beta)">
        <label className="field-checkbox">
          <input
            type="checkbox"
            checked={prefs.liveElements === true}
            onChange={(e) => save.mutate({ liveElements: e.target.checked })}
          />
          <span>UI optimista con animaciones y acciones de Cerebro sobre tarjetas</span>
        </label>
      </Field>
      <p className="muted settings-subblock-desc">
        Activa parches locales en tablero/Hoy, drag con @dnd-kit y efectos SSE entity_effect desde Cerebro IA.
      </p>
    </div>
  );
}
