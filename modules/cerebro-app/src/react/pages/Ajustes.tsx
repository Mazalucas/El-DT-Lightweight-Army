import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LlmProviderId, LlmProviderMeta, ThemePreference, UserAppSettings } from '@shared/types.js';
import { api } from '../../lib/api.js';
import { loadThemePreference, saveThemePreference, syncThemeFromSettings } from '../../lib/theme.js';
import { renderSetupWizard } from '../../app/setup-wizard.js';
import { isProfesionalSetupComplete } from '../../app/profesional-setup.js';
import {
  Badge,
  Button,
  ErrorState,
  Field,
  Icon,
  PageHeader,
  Section,
  Segmented,
  Skeleton,
  toast,
} from '../ds.js';
import { qk, useSettings } from '../hooks.js';
import { CerebroSettingsSection } from '../components/cerebro/CerebroSettingsSection.js';
import { RegionalSettingsSection } from '../components/RegionalSettingsSection.js';

/**
 * Puente legacy: monta el wizard de setup (vanilla TS) dentro de React.
 * El wizard maneja Google OAuth, picker de carpetas y schedule — se migrará
 * de forma nativa más adelante; por ahora se reutiliza tal cual.
 */
function SetupWizardBridge({
  config,
  googleConnected,
  onConfigChange,
}: {
  config: UserAppSettings;
  googleConnected: boolean;
  onConfigChange: (c: UserAppSettings) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const stepRef = useRef<string | null>(googleConnected ? 'folders' : 'google');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    function paint() {
      if (!host) return;
      host.replaceChildren(
        renderSetupWizard(
          {
            config: configRef.current,
            getConfig: () => configRef.current,
            googleConnected,
            openStep: stepRef.current,
            onStepOpenChange: (stepId) => {
              stepRef.current = stepId;
            },
            onConfigChange: (c, options) => {
              configRef.current = c;
              onConfigChange(c);
              if (options?.repaint !== false) paint();
            },
          },
          { embedded: true },
        ),
      );
    }
    paint();
    return () => host.replaceChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConnected]);

  return <div ref={hostRef} />;
}

function ProviderBlock({ provider, onChanged }: { provider: LlmProviderMeta; onChanged: () => void }) {
  const [key, setKey] = useState('');
  const [model, setModel] = useState(provider.modelDefault);

  const save = useMutation({
    mutationFn: () => api.setProviderKey(provider.providerId as LlmProviderId, key.trim(), model.trim()),
    onSuccess: () => {
      setKey('');
      onChanged();
      toast('API key guardada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const test = useMutation({
    mutationFn: () => api.testProvider(provider.providerId as LlmProviderId),
    onSuccess: () => toast('Conexión OK'),
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteProvider(provider.providerId as LlmProviderId),
    onSuccess: () => {
      onChanged();
      toast('Key eliminada');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <article className="provider-block">
      <div className="provider-block-head">
        <h3>{provider.label}</h3>
        {provider.keyHint ? <Badge tone="success">Configurada</Badge> : <Badge tone="warn">Sin key</Badge>}
      </div>
      {provider.keyHint ? <p className="muted provider-key-hint">Key: {provider.keyHint}</p> : null}
      <div className="provider-fields">
        <Field label="API Key de IA" data-cerebro-target="settings.ai_provider">
          <input
            className="field-input"
            type="password"
            autoComplete="off"
            placeholder={provider.keyHint ? 'Pegar para reemplazar' : 'Pegar API key'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </Field>
        <Field label="Modelo">
          <input className="field-input" value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
      </div>
      <div className="btn-row">
        <Button size="sm" loading={save.isPending} disabled={!key.trim()} onClick={() => save.mutate()}>
          Guardar
        </Button>
        {provider.keyHint ? (
          <>
            <Button size="sm" variant="secondary" loading={test.isPending} onClick={() => test.mutate()}>
              Probar
            </Button>
            <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
              Eliminar
            </Button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default function Ajustes() {
  const client = useQueryClient();
  const settings = useSettings();
  const google = useQuery({ queryKey: ['google', 'status'], queryFn: api.googleStatus });
  const providers = useQuery({ queryKey: qk.providers, queryFn: api.listProviders });
  const [params] = useSearchParams();
  const [theme, setTheme] = useState<ThemePreference>(() => loadThemePreference());
  const googleToastShown = useRef(false);

  useEffect(() => {
    if (params.get('google') === 'connected' && !googleToastShown.current) {
      googleToastShown.current = true;
      toast('Google conectado correctamente');
      void client.invalidateQueries({ queryKey: ['google', 'status'] });
    }
  }, [params, client]);

  useEffect(() => {
    const section = params.get('section');
    if (!section) return;
    const el = document.getElementById(`settings-section-${section}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [params]);

  useEffect(() => {
    syncThemeFromSettings(settings.data?.appearance?.theme);
  }, [settings.data?.appearance?.theme]);

  const saveDefaultProvider = useMutation({
    mutationFn: (defaultProviderId: string) =>
      api.saveConfig({ ai: { ...settings.data!.ai, defaultProviderId } }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.settings });
      toast('Proveedor IA actualizado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  if (settings.isPending || google.isPending || providers.isPending) return <Skeleton lines={10} />;
  if (settings.error) return <ErrorState error={settings.error} retry={() => void settings.refetch()} />;

  const config = settings.data;
  const googleConnected = google.data?.connected ?? false;
  const providerList = providers.data?.providers ?? [];
  const iaReady = providerList.some((p) => Boolean(p.keyHint));
  const setupComplete = isProfesionalSetupComplete(config, googleConnected);
  const folderCount = config.meetSources.length;
  const syncOn = config.syncSchedule?.enabled === true;

  return (
    <div>
      <PageHeader title="Ajustes" desc="Configuración de Cerebro Profesional e IA." />

      <div className="chip-row" style={{ marginBottom: 'var(--space-4)' }}>
        <Badge tone={googleConnected ? 'success' : 'warn'}>
          Google: {googleConnected ? 'Conectado' : 'Pendiente'}
        </Badge>
        {googleConnected ? (
          <Badge tone={google.data?.hasCalendarScope ? 'success' : 'default'}>
            Calendar: {google.data?.hasCalendarScope ? 'Activo' : 'Pendiente'}
          </Badge>
        ) : null}
        <Badge tone={folderCount ? 'success' : 'warn'}>
          Carpetas: {folderCount ? `${folderCount} fuente${folderCount === 1 ? '' : 's'}` : 'Sin configurar'}
        </Badge>
        <Badge tone={iaReady ? 'success' : 'default'}>IA (BYOK): {iaReady ? 'Configurada' : 'Sin API key'}</Badge>
        <Badge tone={syncOn ? 'accent' : 'default'}>Sync automático: {syncOn ? 'Activo' : 'Manual'}</Badge>
      </div>

      <div id="settings-section-profesional">
      <Section
        title="Cerebro Profesional"
        desc="Google Drive, carpetas de Notas de Gemini, prueba de fuentes y sincronización automática."
      >
        <p className="settings-inline-status">
          Estado del setup:{' '}
          <Badge tone={setupComplete ? 'success' : 'warn'}>
            {setupComplete ? 'Listo para sincronizar' : 'Completá los pasos pendientes'}
          </Badge>
        </p>
        <SetupWizardBridge
          config={config}
          googleConnected={googleConnected}
          onConfigChange={() => void client.invalidateQueries({ queryKey: qk.settings })}
        />
      </Section>
      </div>

      <div id="settings-section-empresa">
      <Section title="Empresa" desc="Gestioná empresas, invitaciones y espacios compartidos.">
        <Link to="/empresa" className="btn btn-primary btn-sm">
          Ir a Empresa
        </Link>
      </Section>
      </div>

      <div id="settings-section-ia">
      <Section
        title="Inteligencia artificial"
        desc="Tus API keys se cifran en el servidor. Tras guardar, nunca se muestran completas."
      >
        <Field label="Proveedor por defecto">
          <select
            className="field-input"
            value={config.ai.defaultProviderId}
            onChange={(e) => saveDefaultProvider.mutate(e.target.value)}
          >
            <option value="google_gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </Field>
        <div className="providers-grid">
          {providerList.map((p) => (
            <ProviderBlock
              key={p.providerId}
              provider={p}
              onChanged={() => void client.invalidateQueries({ queryKey: qk.providers })}
            />
          ))}
        </div>
        <div className="settings-ia-bridge">
          <div className="settings-ia-bridge-icon" aria-hidden="true">
            <Icon name="brain" />
          </div>
          <div className="settings-ia-bridge-copy">
            <strong>Esta API key alimenta Cerebro y las sugerencias</strong>
            <p className="muted">
              Sugerencias inteligentes, digest diario y chat usan tu key (BYOK). Sin key, la app funciona en modo
              básico.
            </p>
          </div>
          {iaReady ? (
            <Link to="/cerebro" className="btn btn-primary btn-sm" data-cerebro-target="nav.cerebro">
              Abrir Cerebro
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              Guardar key primero
            </Button>
          )}
        </div>
      </Section>
      </div>

      <div id="settings-section-cerebro">
      <Section
        title="Cerebro"
        desc="Copiloto in-app: proactividad, avisos de reunión y chip de calendario."
      >
        <CerebroSettingsSection />
      </Section>
      </div>

      <div id="settings-section-regional">
      <Section
        title="Regional"
        desc="Zona horaria para calendario, Cerebro y sincronización automática."
      >
        <RegionalSettingsSection />
      </Section>
      </div>

      <div id="settings-section-apariencia">
      <Section title="Apariencia" desc="Tema de la interfaz en este dispositivo.">
        <Segmented
          ariaLabel="Tema"
          options={[
            { id: 'system', label: 'Sistema' },
            { id: 'light', label: 'Claro' },
            { id: 'dark', label: 'Oscuro' },
          ]}
          value={theme}
          onChange={(v) => {
            setTheme(v);
            saveThemePreference(v);
            api.saveConfig({ appearance: { theme: v } }).catch(() => {
              toast('Tema aplicado localmente; no se pudo sincronizar', 'error');
            });
          }}
        />
      </Section>
      </div>
    </div>
  );
}
