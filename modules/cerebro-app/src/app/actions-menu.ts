import { api } from '../lib/api.js';
import type { SyncProgress, SyncProgressResponse } from '@shared/types.js';
import {
  formatSyncProgressStatus,
  hideSyncProgressUi,
  startBackgroundSync,
  type SyncProgressUi,
  updateSyncProgressUi,
  waitForSyncProgress,
} from '../lib/sync-progress.js';
import { navigateToAssistant } from '../lib/assistant-nav.js';
import { toast } from '../lib/ui.js';
import { button } from '../ui/primitives.js';

export type PipelineAction = 'scan' | 'sync' | 'import' | 'analyze' | 'pipeline';

export interface ActionsMenuContext {
  root: HTMLElement;
  getPendingAnalysis: () => number;
  onRefresh: () => void;
  setStatus: (msg: string) => void;
  progressUi?: SyncProgressUi;
}

export function mountActionsMenu(ctx: ActionsMenuContext): void {
  const host = document.createElement('div');
  host.id = 'actions-menu-host';
  host.innerHTML = `
    <div class="actions-panel" id="actions-panel" hidden>
      <p class="muted actions-intro">Pasos avanzados del pipeline. Para uso diario preferí «Sincronizar ahora».</p>
      <ul class="actions-list">
        <li><span>1. Indexar</span><button type="button" class="btn btn-secondary btn-sm" data-action="scan">Ejecutar</button></li>
        <li><span>2. Sincronizar</span><button type="button" class="btn btn-secondary btn-sm" data-action="sync">Ejecutar</button></li>
        <li><span>3. Importar (contactos + todos)</span><button type="button" class="btn btn-secondary btn-sm" data-action="import">Ejecutar</button></li>
        <li><span>4. Analizar IA</span><button type="button" class="btn btn-secondary btn-sm" data-action="analyze">Ejecutar</button></li>
      </ul>
    </div>
  `;
  ctx.root.appendChild(host);

  host.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = (btn as HTMLElement).dataset.action as PipelineAction;
      (btn as HTMLButtonElement).disabled = true;
      try {
        await runAction(action, ctx);
        ctx.onRefresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Error', 'error');
      } finally {
        (btn as HTMLButtonElement).disabled = false;
      }
    });
  });
}

export function createProfesionalToolbar(
  ctx: ActionsMenuContext,
  onSyncNow: () => Promise<void>,
): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'profesional-toolbar btn-row';

  const syncNowBtn = button('Sincronizar ahora', {
    id: 'btn-sync-now',
    onClick: async () => {
      syncNowBtn.disabled = true;
      try {
        await onSyncNow();
      } finally {
        syncNowBtn.disabled = false;
      }
    },
  });

  const actionsBtn = button('Acciones', {
    variant: 'secondary',
    id: 'btn-actions',
    onClick: () => {
      const panel = ctx.root.querySelector('#actions-panel') as HTMLElement | null;
      if (!panel) return;
      const open = panel.hidden;
      panel.hidden = !open;
      actionsBtn.setAttribute('aria-expanded', String(open));
    },
  });

  const assistantBtn = button('Asistente', {
    variant: 'secondary',
    onClick: () => navigateToAssistant(),
  });

  bar.append(syncNowBtn, assistantBtn, actionsBtn);
  return bar;
}

function onProgressTick(ctx: ActionsMenuContext, p: SyncProgress): void {
  ctx.setStatus(formatSyncProgressStatus(p));
  updateSyncProgressUi(p, ctx.progressUi);
}

async function runAction(action: PipelineAction, ctx: ActionsMenuContext): Promise<void> {
  switch (action) {
    case 'scan': {
      ctx.setStatus('Indexando…');
      const r = await api.syncScan();
      ctx.setStatus(`Indexadas: ${r.scanned}`);
      toast('Índice actualizado');
      break;
    }
    case 'sync': {
      await runSyncWithProgress(ctx);
      toast('Sincronización completada');
      break;
    }
    case 'import': {
      ctx.setStatus('Importando…');
      const store = await api.importMeetings();
      ctx.setStatus(`Importadas ${store.meetings.length} reuniones`);
      toast('Importación completada');
      break;
    }
    case 'analyze': {
      const pending = ctx.getPendingAnalysis();
      if (pending === 0) {
        toast('No hay reuniones pendientes');
        return;
      }
      const { jobId } = await api.analyzeBatch();
      ctx.setStatus(`Job IA ${jobId}…`);
      toast('Análisis en lote iniciado');
      const poll = setInterval(async () => {
        const job = (await api.getJob(jobId)) as { status?: string; progress?: number; total?: number };
        ctx.setStatus(`IA: ${job.progress ?? 0}/${job.total ?? '?'} — ${job.status}`);
        if (job.status === 'done' || job.status === 'error') {
          clearInterval(poll);
          ctx.onRefresh();
        }
      }, 3000);
      break;
    }
    case 'pipeline':
      break;
  }
}

async function runSyncWithProgress(ctx: ActionsMenuContext): Promise<SyncProgressResponse> {
  onProgressTick(ctx, { phase: 'scan', current: 0, total: 0, done: false, currentTitle: 'Iniciando sync…' });
  const startedAt = await startBackgroundSync(() => api.syncRun());
  const result = await waitForSyncProgress(
    api.syncProgress,
    (p) => onProgressTick(ctx, p),
    { runStartedAt: startedAt },
  );
  hideSyncProgressUi(ctx.progressUi);
  return result;
}

export async function runPipelineNow(ctx: ActionsMenuContext): Promise<void> {
  onProgressTick(ctx, { phase: 'pipeline', current: 0, total: 4, done: false, currentTitle: 'Iniciando…' });
  try {
    const startedAt = await startBackgroundSync(() => api.syncPipeline());
    const result = await waitForSyncProgress(
      api.syncProgress,
      (p) => onProgressTick(ctx, p),
      { runStartedAt: startedAt },
    );
    hideSyncProgressUi(ctx.progressUi);
    ctx.setStatus(formatSyncProgressStatus(result));
    toast('Pipeline completado');
    if (result.result?.analysisJobId) {
      const jobId = result.result.analysisJobId;
      const poll = setInterval(async () => {
        const job = (await api.getJob(jobId)) as { status?: string };
        if (job.status === 'done' || job.status === 'error') {
          clearInterval(poll);
          ctx.onRefresh();
        }
      }, 3000);
    }
    ctx.onRefresh();
  } catch (e) {
    hideSyncProgressUi(ctx.progressUi);
    ctx.setStatus('');
    throw e;
  }
}

export function createSyncProgressUi(parent: HTMLElement): SyncProgressUi {
  const wrap = document.createElement('div');
  wrap.id = 'sync-progress-wrap';
  wrap.className = 'sync-progress-wrap';
  wrap.hidden = true;
  wrap.innerHTML = `
    <div class="sync-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div id="sync-progress-fill" class="sync-progress-fill"></div>
    </div>
    <span id="sync-progress-label" class="sync-progress-label"></span>
  `;
  parent.appendChild(wrap);
  return {
    wrap,
    fill: wrap.querySelector('#sync-progress-fill') as HTMLElement,
    label: wrap.querySelector('#sync-progress-label') as HTMLElement,
  };
}
