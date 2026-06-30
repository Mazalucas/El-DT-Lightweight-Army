import { resolveClientTimezone } from '@shared/timezone.js';
import { api } from '../lib/api.js';
import type { MeetSourceConfig, UserAppSettings } from '@shared/types.js';
import { PROCESS_LOOKBACK_PRESETS, processLookbackLabel } from '@shared/sync-policy.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { badge, button, btnRow, section } from '../ui/primitives.js';
import { svgEl } from '../ui/icons.js';
import { mountFolderPicker } from './folder-picker.js';
import { openSharedInboxGuideModal } from './shared-inbox-guide-modal.js';
import {
  evaluateSetupStep,
  SETUP_STEPS,
} from './profesional-setup.js';

export interface SetupWizardContext {
  config: UserAppSettings;
  getConfig: () => UserAppSettings;
  googleConnected: boolean;
  onConfigChange: (config: UserAppSettings, options?: { repaint?: boolean }) => void;
  openStep?: string | null;
  onStepOpenChange?: (stepId: string | null) => void;
}

export function renderSetupWizard(ctx: SetupWizardContext, options?: { embedded?: boolean }): HTMLElement {
  const { config, googleConnected, onConfigChange } = ctx;
  const embedded = options?.embedded === true;

  const root = document.createElement('div');
  root.className = 'setup-wizard-root';

  const body = document.createElement('div');
  body.className = embedded ? 'setup-wizard-body' : 'page-section-body';

  if (!embedded) {
    const sec = section('Cerebro Profesional — Setup', 'Fuentes de Notas de Gemini y automatización.');
    sec.body.appendChild(body);
    root.appendChild(sec.el);
  } else {
    root.appendChild(body);
  }

  const stepsList = document.createElement('ol');
  stepsList.className = 'setup-wizard-steps';

  SETUP_STEPS.forEach((step) => {
    const status = evaluateSetupStep(step.id, config, googleConnected);
    const li = document.createElement('li');
    li.className = `setup-step setup-step--${status}`;
    li.dataset.step = step.id;

    const head = document.createElement('div');
    head.className = 'setup-step-head';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'setup-step-title-wrap';
    const titleRow = document.createElement('div');
    titleRow.className = 'setup-step-title-row';
    const titleStrong = document.createElement('strong');
    titleStrong.textContent = step.title;
    titleRow.appendChild(titleStrong);
    if (step.id === 'folders') {
      const helpBtn = document.createElement('button');
      helpBtn.type = 'button';
      helpBtn.className = 'setup-step-help';
      helpBtn.setAttribute('aria-label', 'Ayuda: Notas de Gemini compartidas (Apps Script)');
      helpBtn.title = 'Notas de Gemini compartidas — Apps Script';
      helpBtn.appendChild(svgEl('help'));
      helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSharedInboxGuideModal();
      });
      titleRow.appendChild(helpBtn);
    }
    titleWrap.append(titleRow);
    const summaryP = document.createElement('p');
    summaryP.className = 'muted';
    summaryP.textContent = step.summary;
    titleWrap.appendChild(summaryP);

    head.innerHTML = `<span class="setup-step-num">${step.num}</span>`;
    head.appendChild(titleWrap);
    const statusBadge =
      status === 'done' ? badge('Listo', 'success') : status === 'optional' ? badge('Opcional', 'default') : badge('Pendiente', 'warn');
    head.appendChild(statusBadge);

    const panel = document.createElement('div');
    panel.className = 'setup-step-panel';
    panel.hidden = ctx.openStep !== step.id;
    renderStepPanel(step.id, panel, ctx);

    const toggle = button(panel.hidden ? 'Abrir' : 'Cerrar', {
      variant: 'ghost',
      size: 'sm',
      onClick: () => {
        panel.hidden = !panel.hidden;
        ctx.onStepOpenChange?.(panel.hidden ? null : step.id);
        (toggle as HTMLButtonElement).textContent = panel.hidden ? 'Abrir' : 'Cerrar';
      },
    });
    head.appendChild(toggle);

    li.append(head, panel);
    stepsList.appendChild(li);
  });

  body.appendChild(stepsList);
  if (!embedded) {
    renderSourcesTable(body, ctx.getConfig, ctx.onConfigChange);
  }

  return root;
}

function renderStepPanel(stepId: string, panel: HTMLElement, ctx: SetupWizardContext): void {
  const { config, googleConnected, onConfigChange } = ctx;
  panel.replaceChildren();

  switch (stepId) {
    case 'google': {
      const p = document.createElement('p');
      p.append(document.createTextNode('Estado: '), badge(googleConnected ? 'Conectado' : 'No conectado', googleConnected ? 'success' : 'warn'));
      panel.appendChild(p);
      const info = document.createElement('p');
      info.className = 'muted';
      info.textContent = 'Scopes: lectura de Google Drive y Google Docs. Necesario para descargar Notas de Gemini (resumen y transcripción).';
      panel.appendChild(info);
      panel.appendChild(
        btnRow(
          googleConnected
            ? button('Desconectar', {
                variant: 'secondary',
                onClick: async () => {
                  await api.googleRevoke();
                  toast('Google desconectado');
                  location.reload();
                },
              })
            : button('Conectar Google', {
                onClick: async () => {
                  const { url } = await api.googleStart();
                  location.href = url;
                },
              }),
        ),
      );
      break;
    }
    case 'folders': {
      const pickerHost = document.createElement('div');
      panel.appendChild(pickerHost);
      mountFolderPicker(
        pickerHost,
        () => ctx.getConfig(),
        {
          onAdd: async (folderId, label) => {
            const current = ctx.getConfig();
            const sources = Array.isArray(current.meetSources) ? current.meetSources : [];
            const src: MeetSourceConfig = {
              driveFolderId: folderId,
              label: label || folderId,
              sourceType: 'primary',
            };
            const updated = await api.saveConfig({ meetSources: [...sources, src] });
            if (!updated.meetSources?.some((s) => s.driveFolderId === folderId)) {
              throw new Error('No se pudo guardar la carpeta en el servidor');
            }
            ctx.onConfigChange(updated, { repaint: false });
            toast('Fuente de transcripciones añadida');
            return updated;
          },
          onRemoveConfigured: async (globalIndex) => {
            const current = ctx.getConfig();
            const sources = Array.isArray(current.meetSources) ? current.meetSources : [];
            const next = sources.filter((_, idx) => idx !== globalIndex);
            const updated = await api.saveConfig({ meetSources: next });
            ctx.onConfigChange(updated, { repaint: false });
            toast('Fuente eliminada');
            return updated;
          },
        },
        {
          defaultSourceType: 'primary',
          multiSourceLayout: true,
          showConfiguredSources: true,
          configuredSourceFilter: () => true,
        },
      );
      break;
    }
    case 'test': {
      panel.appendChild(
        button('Probar todas las fuentes', {
          onClick: async () => {
            try {
              const { results } = await api.testAllSources();
              const wrap = document.createElement('div');
              wrap.className = 'setup-test-results';
              wrap.innerHTML = results
                .map(
                  (r) =>
                    `<p><strong>${escapeHtml(r.label)}</strong>: ${r.docCount} Notas de Gemini${r.sample.length ? ` (${escapeHtml(r.sample.slice(0, 2).join(', '))})` : ''}</p>`,
                )
                .join('');
              panel.querySelector('.setup-test-results')?.remove();
              panel.appendChild(wrap);
              toast('Prueba completada');
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error', 'error');
            }
          },
        }),
      );
      break;
    }
    case 'schedule': {
      const effectiveTz = resolveClientTimezone(config);
      const hour = config.syncSchedule?.hour ?? 8;
      const minute = config.syncSchedule?.minute ?? 0;
      const enabled = config.syncSchedule?.enabled ?? false;
      const lookbackDays = config.syncPolicy?.processLookbackDays ?? 30;

      const grid = document.createElement('div');
      grid.className = 'grid-2';
      grid.innerHTML = `
        <div class="field">
          <label><input type="checkbox" id="sw-schedule-enabled" ${enabled ? 'checked' : ''} /> Sincronizar automáticamente cada día</label>
        </div>
        <div class="field"><label for="sw-hour">Hora</label><input type="time" id="sw-hour" value="${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}" /></div>
        <div class="field">
          <label for="sw-lookback">Procesar reuniones de los últimos</label>
          <select id="sw-lookback">
            ${PROCESS_LOOKBACK_PRESETS.map(
              (days) =>
                `<option value="${days}"${lookbackDays === days ? ' selected' : ''}>${escapeHtml(processLookbackLabel(days))}</option>`,
            ).join('')}
          </select>
        </div>
      `;
      panel.appendChild(grid);

      const tzHint = document.createElement('p');
      tzHint.className = 'muted';
      tzHint.innerHTML = `Zona horaria: <strong>${escapeHtml(effectiveTz)}</strong> — <a href="#/settings?section=regional">configurar en Ajustes → Regional</a>`;
      panel.appendChild(tzHint);

      const lookbackHint = document.createElement('p');
      lookbackHint.className = 'muted';
      lookbackHint.textContent =
        'Aplica al sync manual y automático: descarga de notas, contactos, tareas y análisis IA. Las reuniones más antiguas siguen indexadas pero no se procesan.';
      panel.appendChild(lookbackHint);

      if (config.syncSchedule?.lastRunAt) {
        const last = document.createElement('p');
        last.className = 'muted';
        last.textContent = `Última ejecución: ${config.syncSchedule.lastRunAt} (${config.syncSchedule.lastRunStatus ?? '—'})`;
        panel.appendChild(last);
      }

      const autoAnalyze = document.createElement('div');
      autoAnalyze.className = 'field';
      autoAnalyze.innerHTML = `<label><input type="checkbox" id="sw-auto-analyze" ${config.ai.autoAnalyzeAfterSync !== false ? 'checked' : ''} /> Incluir análisis IA en pipeline automático</label>`;
      panel.appendChild(autoAnalyze);

      panel.appendChild(
        button('Guardar automatización', {
          onClick: async () => {
            const timeVal = (panel.querySelector('#sw-hour') as HTMLInputElement).value;
            const [h, m] = timeVal.split(':').map((x) => parseInt(x, 10));
            const updated = await api.saveConfig({
              syncSchedule: {
                enabled: (panel.querySelector('#sw-schedule-enabled') as HTMLInputElement).checked,
                hour: h ?? 8,
                minute: m ?? 0,
                timezone: config.syncSchedule?.timezone ?? effectiveTz,
                lastRunAt: config.syncSchedule?.lastRunAt,
                lastRunStatus: config.syncSchedule?.lastRunStatus,
                lastRunSummary: config.syncSchedule?.lastRunSummary,
              },
              syncPolicy: {
                processLookbackDays: parseInt(
                  (panel.querySelector('#sw-lookback') as HTMLSelectElement).value,
                  10,
                ),
              },
              ai: {
                ...config.ai,
                autoAnalyzeAfterSync: (panel.querySelector('#sw-auto-analyze') as HTMLInputElement).checked,
              },
            });
            onConfigChange(updated);
            toast('Automatización guardada');
          },
        }),
      );
      break;
    }
  }
}

function paintSourcesTableWrap(
  wrap: HTMLElement,
  getConfig: () => UserAppSettings,
  onConfigChange: SetupWizardContext['onConfigChange'],
): void {
  const config = getConfig();
  if (!config.meetSources.length) {
    wrap.replaceChildren();
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Sin carpetas. Completá el paso 2 del wizard (carpetas de transcripciones).';
    wrap.appendChild(p);
    return;
  }
  const table = document.createElement('div');
  table.className = 'data-table-wrap';
  table.innerHTML = `<table class="data-table"><thead><tr><th>Carpeta</th><th>Folder ID</th><th></th></tr></thead><tbody>
    ${config.meetSources
      .map(
        (s, i) => `<tr>
        <td>${escapeHtml(s.label)}</td>
        <td><code>${escapeHtml(s.driveFolderId)}</code></td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-remove="${i}">Quitar</button></td>
      </tr>`,
      )
      .join('')}
  </tbody></table>`;
  wrap.replaceChildren(table);
  table.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const i = Number((btn as HTMLElement).dataset.remove);
      const current = getConfig();
      const next = current.meetSources.filter((_, idx) => idx !== i);
      const updated = await api.saveConfig({ meetSources: next });
      onConfigChange(updated, { repaint: false });
      paintSourcesTableWrap(wrap, getConfig, onConfigChange);
      toast('Fuente eliminada');
    });
  });
}

function renderSourcesTable(
  body: HTMLElement,
  getConfig: () => UserAppSettings,
  onConfigChange: SetupWizardContext['onConfigChange'],
): void {
  const h = document.createElement('h3');
  h.textContent = 'Fuentes configuradas';
  h.style.marginTop = 'var(--space-5)';
  body.appendChild(h);

  const wrap = document.createElement('div');
  wrap.id = 'sources-table-wrap';
  body.appendChild(wrap);

  paintSourcesTableWrap(wrap, getConfig, onConfigChange);
}

export function refreshSourcesTable(
  host: ParentNode,
  getConfig: () => UserAppSettings,
  onConfigChange: SetupWizardContext['onConfigChange'],
): void {
  const wrap = host.querySelector('#sources-table-wrap');
  if (wrap instanceof HTMLElement) {
    paintSourcesTableWrap(wrap, getConfig, onConfigChange);
  }
}
