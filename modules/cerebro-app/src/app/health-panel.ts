import type { StoreHealthMetrics } from '@shared/types.js';
import { navigateToAssistant } from '../lib/assistant-nav.js';
import { escapeHtml } from '../lib/ui.js';
import { icon } from '../ui/icons.js';
import { button } from '../ui/primitives.js';

export interface HealthPanelOptions {
  scope?: 'personal' | 'org';
  onRepair?: (onProgress: (line: string) => void) => Promise<void>;
  repairLabel?: string;
  needsMigration?: boolean;
  onMigrate?: () => Promise<void>;
  showAssistantCta?: boolean;
}

function statusClass(ratio: number): string {
  if (ratio >= 0.95) return 'health-ok';
  if (ratio >= 0.7) return 'health-warn';
  return 'health-bad';
}

export function renderHealthPanel(health: StoreHealthMetrics, options?: HealthPanelOptions): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'health-panel';

  const syncRatio = health.meetingsTotal ? health.meetingsSynced / health.meetingsTotal : 1;
  const rows = [
    { label: 'Reuniones synced', value: `${health.meetingsSynced}/${health.meetingsTotal}`, cls: statusClass(syncRatio) },
    { label: 'Contactos', value: String(health.contactsCount), cls: health.contactsCount > 0 ? 'health-ok' : 'health-bad' },
    { label: 'Prospects pendientes', value: String(health.prospectsPending), cls: health.prospectsPending > 0 ? 'health-warn' : '' },
    { label: 'Sugerencias proyecto', value: String(health.projectSuggestionsPending), cls: '' },
    { label: 'Sugerencias equipo', value: String(health.teamSuggestionsPending), cls: '' },
    { label: 'Tareas sugeridas', value: String(health.todosSuggested), cls: '' },
    { label: 'Tareas abiertas', value: String(health.todosOpen), cls: '' },
    {
      label: 'Participantes sin resolver',
      value: String(health.meetingsWithoutResolvedParticipants),
      cls: health.meetingsWithoutResolvedParticipants === 0 ? 'health-ok' : 'health-warn',
    },
  ];

  if (health.staleParticipantLinks) {
    rows.push({
      label: 'Vínculos huérfanos (IDs)',
      value: String(health.staleParticipantLinks),
      cls: health.staleParticipantLinks === 0 ? 'health-ok' : 'health-warn',
    });
  }

  if (health.uuidProjects !== undefined) {
    rows.push({
      label: 'Proyectos UUID (legado IA)',
      value: String(health.uuidProjects),
      cls: health.uuidProjects === 0 ? 'health-ok' : 'health-bad',
    });
  }

  rows.push({
    label: 'Proyectos a limpiar',
    value: String(health.orphanProjects),
    cls: health.orphanProjects === 0 ? 'health-ok' : 'health-warn',
  });

  if (health.orgIngestLagMs !== undefined) {
    const lagH = Math.round(health.orgIngestLagMs / 3600000);
    rows.push({
      label: 'Lag ingest org',
      value: lagH > 0 ? `${lagH}h` : 'OK',
      cls: lagH > 24 ? 'health-warn' : 'health-ok',
    });
  }

  const scopeLabel = options?.scope === 'org' ? 'empresa' : 'personal';
  const alerts: string[] = [];
  if (options?.needsMigration) {
    alerts.push(`<div class="health-alert health-alert--info" role="alert">
      <strong>Actualización de catálogo.</strong>
      Tu store usa el formato anterior. Migrá a v2 para cargas más rápidas y mejor compatibilidad con el asistente.
    </div>`);
  }
  if (health.needsRepair) {
    alerts.push(`<div class="health-alert health-alert--warn" role="alert">
      <strong>Reparación recomendada.</strong>
      Los mirrors antiguos no guardaban emails de chips Gemini — podés tener 0 contactos con muchas reuniones synced.
      Usá <em>Reparar</em> o pedile al <a href="#/assistant">asistente</a> que lo inicie.
    </div>`);
  }

  wrap.innerHTML = `
    <h3 class="section-subtitle">Salud del cerebro <span class="muted">(${scopeLabel})</span></h3>
    ${alerts.join('')}
    <ul class="health-grid">
      ${rows.map((r) => `<li class="${r.cls}"><span>${escapeHtml(r.label)}</span><strong>${escapeHtml(r.value)}</strong></li>`).join('')}
    </ul>
    <div class="health-actions" id="health-actions"></div>
    <p class="health-repair-status muted" id="health-repair-status" hidden></p>
  `;

  const actions = wrap.querySelector('#health-actions')!;
  const statusEl = wrap.querySelector('#health-repair-status') as HTMLElement;

  if (options?.showAssistantCta !== false && options?.scope !== 'org') {
    const askBtn = button('Preguntar al asistente', {
      variant: 'ghost',
      size: 'sm',
      onClick: () => {
        const prompt =
          health.needsRepair
            ? 'Analizá la salud de mi cerebro y decime si conviene reparar ahora.'
            : 'Resumí la salud de mi cerebro profesional con métricas clave.';
        navigateToAssistant({ prompt });
      },
    });
    askBtn.classList.add('health-ask-btn');
    askBtn.insertAdjacentHTML('afterbegin', icon('brain'));
    actions.appendChild(askBtn);
  }

  if (options?.needsMigration && options.onMigrate) {
    const migrateBtn = button('Actualizar catálogo (v2)', {
      variant: 'secondary',
      size: 'sm',
      onClick: async () => {
        migrateBtn.disabled = true;
        migrateBtn.textContent = 'Migrando…';
        statusEl.hidden = false;
        statusEl.textContent = 'Migrando catálogo a formato normalizado…';
        try {
          await options.onMigrate!();
          statusEl.textContent = 'Migración completada.';
        } catch (e) {
          statusEl.textContent = e instanceof Error ? e.message : String(e);
        } finally {
          migrateBtn.disabled = false;
          migrateBtn.textContent = 'Actualizar catálogo (v2)';
        }
      },
    });
    actions.appendChild(migrateBtn);
  }

  if (options?.onRepair) {
    const repairBtn = button(
      options.repairLabel ?? 'Reparar (re-sync + import)',
      {
        variant: health.needsRepair ? 'primary' : 'secondary',
        size: 'sm',
        onClick: async () => {
          repairBtn.disabled = true;
          repairBtn.textContent = 'Iniciando…';
          statusEl.hidden = false;
          statusEl.textContent = 'Iniciando reparación…';
          try {
            await options.onRepair!((line) => {
              statusEl.textContent = line;
            });
          } finally {
            repairBtn.disabled = false;
            repairBtn.textContent = options.repairLabel ?? 'Reparar (re-sync + import)';
          }
        },
      },
    );
    actions.appendChild(repairBtn);
  }

  return wrap;
}
