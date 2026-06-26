import { api } from '../lib/api.js';
import type { LlmProviderId, ThemePreference, UserAppSettings } from '@shared/types.js';
import { saveThemePreference, syncThemeFromSettings, loadThemePreference } from '../lib/theme.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { navigateToAssistant } from '../lib/assistant-nav.js';
import { badge, button, btnRow, pageHeader, skeletonBlock } from '../ui/primitives.js';
import { icon } from '../ui/icons.js';
import {
  scrollToSettingsSection,
  settingsCard,
  settingsSummary,
  type SettingsSummaryItem,
} from '../ui/settings-layout.js';
import { themeSegmentedControl } from '../ui/theme-control.js';
import { renderSetupWizard } from './setup-wizard.js';
import { isProfesionalSetupComplete } from './profesional-setup.js';
import { renderEmpresaSettings } from './settings-empresa.js';

function buildSummaryItems(
  config: UserAppSettings,
  googleConnected: boolean,
  providers: Awaited<ReturnType<typeof api.listProviders>>['providers'],
): SettingsSummaryItem[] {
  const folderCount = config.meetSources.length;
  const iaReady = providers.some((p) => Boolean(p.keyHint));
  const syncOn = config.syncSchedule?.enabled === true;

  return [
    {
      label: 'Google',
      value: googleConnected ? 'Conectado' : 'Pendiente',
      tone: googleConnected ? 'success' : 'warn',
    },
    {
      label: 'Carpetas',
      value: folderCount ? `${folderCount} fuente${folderCount === 1 ? '' : 's'}` : 'Sin configurar',
      tone: folderCount ? 'success' : 'warn',
    },
    {
      label: 'IA (BYOK)',
      value: iaReady ? 'Configurada' : 'Sin API key',
      tone: iaReady ? 'success' : 'default',
    },
    {
      label: 'Sync automático',
      value: syncOn ? 'Activo' : 'Manual',
      tone: syncOn ? 'accent' : 'default',
    },
  ];
}

export async function renderSettings(container: HTMLElement): Promise<void> {
  container.replaceChildren(pageHeader('Ajustes', 'Configuración de Cerebro Profesional, IA y módulos.'));
  container.appendChild(skeletonBlock(5));

  let config: UserAppSettings;
  let googleConnected = false;
  let providers: Awaited<ReturnType<typeof api.listProviders>>['providers'] = [];

  try {
    [config, { connected: googleConnected }, { providers }] = await Promise.all([
      api.getConfig(),
      api.googleStatus(),
      api.listProviders(),
    ]);
  } catch (e) {
    container.replaceChildren(pageHeader('Ajustes'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
    container.appendChild(err);
    return;
  }

  syncThemeFromSettings(config.appearance?.theme);
  if (!config.appearance) config.appearance = { theme: loadThemePreference() };

  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  if (params.get('google') === 'connected') toast('Google conectado correctamente');

  const sectionParam = params.get('section') ?? 'profesional';
  const openStep =
    params.get('tab') === 'profesional-setup' || sectionParam === 'profesional'
      ? params.get('step') ?? (googleConnected ? 'folders' : 'google')
      : null;
  let activeWizardStep: string | null = openStep;

  const page = document.createElement('div');
  page.className = 'settings-page';

  const summaryHost = document.createElement('div');
  summaryHost.className = 'settings-summary-host';

  const stack = document.createElement('div');
  stack.className = 'settings-stack';

  function paintSummary(): void {
    summaryHost.replaceChildren(settingsSummary(buildSummaryItems(config, googleConnected, providers)));
  }

  paintSummary();

  // —— Profesional ——
  const profesionalCard = settingsCard({
    id: 'profesional',
    title: 'Cerebro Profesional',
    desc: 'Google Drive, carpetas de Notas de Gemini, prueba de fuentes y sincronización automática.',
    iconName: 'briefcase',
  });

  const setupStatus = document.createElement('p');
  setupStatus.className = 'settings-inline-status';
  profesionalCard.body.appendChild(setupStatus);

  const wizardHost = document.createElement('div');
  wizardHost.id = 'setup-wizard-host';
  profesionalCard.body.appendChild(wizardHost);

  function paintSetupStatus(): void {
    const complete = isProfesionalSetupComplete(config, googleConnected);
    setupStatus.replaceChildren(
      document.createTextNode('Estado del setup: '),
      badge(complete ? 'Listo para sincronizar' : 'Completá los pasos pendientes', complete ? 'success' : 'warn'),
    );
  }

  function handleWizardConfigChange(c: UserAppSettings, options?: { repaint?: boolean }): void {
    config = c;
    paintSummary();
    paintSetupStatus();
    if (options?.repaint === false) return;
    paintWizard();
  }

  function paintWizard(): void {
    wizardHost.replaceChildren(
      renderSetupWizard(
        {
          config,
          getConfig: () => config,
          googleConnected,
          openStep: activeWizardStep,
          onStepOpenChange: (stepId) => {
            activeWizardStep = stepId;
          },
          onConfigChange: handleWizardConfigChange,
        },
        { embedded: true },
      ),
    );
    paintSetupStatus();
  }

  paintWizard();
  stack.appendChild(profesionalCard.el);

  stack.appendChild(renderEmpresaSettings(document.createElement('div')));

  // —— IA ——
  const iaCard = settingsCard({
    id: 'ia',
    title: 'Inteligencia artificial',
    desc: 'Tus API keys se cifran en el servidor. Tras guardar, nunca se muestran completas.',
    iconName: 'brain',
  });

  const defaultProviderRow = document.createElement('div');
  defaultProviderRow.className = 'settings-field-row';
  defaultProviderRow.innerHTML = `
    <div class="field">
      <label for="ai-default-provider">Proveedor por defecto</label>
      <select id="ai-default-provider">
        <option value="google_gemini">Google Gemini</option>
        <option value="openai">OpenAI</option>
      </select>
    </div>
  `;
  iaCard.body.appendChild(defaultProviderRow);

  const providersList = document.createElement('div');
  providersList.id = 'providers-list';
  providersList.className = 'providers-grid';
  iaCard.body.appendChild(providersList);
  stack.appendChild(iaCard.el);

  (iaCard.el.querySelector('#ai-default-provider') as HTMLSelectElement).value = config.ai.defaultProviderId;

  function renderProviders(): void {
    providersList.replaceChildren();
    providers.forEach((p) => {
      const block = document.createElement('article');
      block.className = 'provider-block';

      const head = document.createElement('div');
      head.className = 'provider-block-head';
      const h3 = document.createElement('h3');
      h3.textContent = p.label;
      head.appendChild(h3);
      head.appendChild(p.keyHint ? badge('Configurada', 'success') : badge('Sin key', 'warn'));
      block.appendChild(head);

      if (p.keyHint) {
        const hint = document.createElement('p');
        hint.className = 'muted provider-key-hint';
        hint.textContent = `Key: ${p.keyHint}`;
        block.appendChild(hint);
      }

      const fields = document.createElement('div');
      fields.className = 'provider-fields';
      fields.innerHTML = `
        <div class="field">
          <label>API Key</label>
          <input type="password" data-key="${p.providerId}" placeholder="${p.keyHint ? 'Pegar para reemplazar' : 'Pegar API key'}" autocomplete="off" />
        </div>
        <div class="field">
          <label>Modelo</label>
          <input data-model="${p.providerId}" value="${escapeHtml(p.modelDefault)}" />
        </div>
      `;
      block.appendChild(fields);

      const actions = btnRow();
      actions.appendChild(
        button('Guardar', {
          size: 'sm',
          onClick: async () => {
            const id = p.providerId as LlmProviderId;
            const key = (block.querySelector(`[data-key="${id}"]`) as HTMLInputElement).value.trim();
            const model = (block.querySelector(`[data-model="${id}"]`) as HTMLInputElement).value.trim();
            if (!key) {
              toast('Introduce una API key', 'error');
              return;
            }
            try {
              await api.setProviderKey(id, key, model);
              ({ providers } = await api.listProviders());
              renderProviders();
              paintSummary();
              toast('API key guardada');
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error', 'error');
            }
          },
        }),
      );
      if (p.keyHint) {
        actions.appendChild(
          button('Probar', {
            variant: 'secondary',
            size: 'sm',
            onClick: async () => {
              try {
                await api.testProvider(p.providerId as LlmProviderId);
                toast('Conexión OK');
              } catch (e) {
                toast(e instanceof Error ? e.message : 'Error', 'error');
              }
            },
          }),
        );
        actions.appendChild(
          button('Eliminar', {
            variant: 'danger',
            size: 'sm',
            onClick: async () => {
              await api.deleteProvider(p.providerId as LlmProviderId);
              ({ providers } = await api.listProviders());
              renderProviders();
              paintSummary();
              toast('Key eliminada');
            },
          }),
        );
      }
      block.appendChild(actions);
      providersList.appendChild(block);
    });
  }

  renderProviders();

  const iaBridge = document.createElement('div');
  iaBridge.className = 'settings-ia-bridge';
  const iaReady = providers.some((p) => Boolean(p.keyHint));
  iaBridge.innerHTML = `
    <div class="settings-ia-bridge-icon" aria-hidden="true">${icon('brain')}</div>
    <div class="settings-ia-bridge-copy">
      <strong>Esta API key alimenta el Asistente</strong>
      <p class="muted">Preguntá sobre reuniones, contactos e inbox. Tus claves se cifran en el servidor (BYOK).</p>
    </div>
  `;
  iaBridge.appendChild(
    button(iaReady ? 'Abrir asistente' : 'Guardar key primero', {
      variant: iaReady ? 'primary' : 'secondary',
      size: 'sm',
      disabled: !iaReady,
      onClick: () => navigateToAssistant(),
    }),
  );
  iaCard.body.appendChild(iaBridge);

  iaCard.el.querySelector('#ai-default-provider')?.addEventListener('change', async (e) => {
    const defaultProviderId = (e.target as HTMLSelectElement).value;
    config.ai.defaultProviderId = defaultProviderId;
    await api.saveConfig({ ai: { ...config.ai, defaultProviderId } });
    toast('Proveedor IA actualizado');
  });

  // —— Apariencia ——
  const appearanceCard = settingsCard({
    id: 'apariencia',
    title: 'Apariencia',
    desc: 'Tema de la interfaz en este dispositivo.',
    iconName: 'sun',
  });
  appearanceCard.body.appendChild(
    themeSegmentedControl(config.appearance.theme, async (v: ThemePreference) => {
      saveThemePreference(v);
      config.appearance.theme = v;
      try {
        await api.saveConfig({ appearance: { theme: v } });
      } catch {
        toast('Tema aplicado localmente; no se pudo sincronizar', 'error');
      }
    }),
  );
  stack.appendChild(appearanceCard.el);

  page.append(summaryHost, stack);

  container.replaceChildren(pageHeader('Ajustes', 'Configuración de Cerebro Profesional e IA.'), page);

  scrollToSettingsSection(sectionParam);
}
