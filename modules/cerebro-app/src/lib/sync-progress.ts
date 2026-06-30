import type { SyncProgress, SyncProgressResponse } from '@shared/types.js';

const PHASE_LABELS: Record<SyncProgress['phase'], string> = {
  idle: 'Listo',
  pipeline: 'Pipeline',
  scan: 'Indexando carpetas',
  sync: 'Sincronizando reuniones',
  import: 'Importando',
  reindex: 'Contactos y reuniones',
  todos: 'Tareas sugeridas',
  analyze: 'Analizando con IA',
  repair: 'Reparando store',
};

export { PHASE_LABELS };

export type SyncStepState = 'done' | 'active' | 'pending';

export interface SyncStep {
  id: string;
  label: string;
  state: SyncStepState;
  detail?: string;
}

export function getSyncProgressPercent(p: SyncProgress): number {
  const current = p.current ?? 0;
  const total = p.total ?? 0;
  if (total > 0) return Math.round((current / total) * 100);
  if (p.done) return 100;
  if (p.phase === 'scan') return 12;
  if (p.phase !== 'idle') return 6;
  return 0;
}

function pipelineStepState(step: number, current: number, done: boolean): SyncStepState {
  if (done) return 'done';
  if (current > step) return 'done';
  if (current === step) return 'active';
  return 'pending';
}

/** Pasos legibles para la UI del panel global de sync. */
export function buildSyncSteps(p: SyncProgress): SyncStep[] {
  const current = p.current ?? 0;
  const total = p.total ?? 0;
  const title = progressTitle(p.currentTitle);
  const meetingDetail = total > 0 && (p.phase === 'sync' || p.phase === 'scan') ? `${current}/${total}` : title;

  const pipelineSteps = (activeStep: number, detail?: string): SyncStep[] => [
    {
      id: '1',
      label: 'Sincronizar desde Drive',
      state: pipelineStepState(1, activeStep, p.done),
      detail: activeStep === 1 ? detail : undefined,
    },
    {
      id: '2',
      label: 'Contactos y reuniones',
      state: pipelineStepState(2, activeStep, p.done),
      detail: activeStep === 2 ? detail : undefined,
    },
    {
      id: '3',
      label: 'Espacios de equipo',
      state: pipelineStepState(3, activeStep, p.done),
      detail: activeStep === 3 ? detail : undefined,
    },
    {
      id: '4',
      label: 'Análisis IA',
      state: pipelineStepState(4, activeStep, p.done),
      detail: activeStep === 4 ? detail : undefined,
    },
  ];

  if (p.phase === 'pipeline') return pipelineSteps(current, title);
  if (p.phase === 'sync' || p.phase === 'scan') return pipelineSteps(1, meetingDetail ?? title);
  if (p.phase === 'reindex' || p.phase === 'import') return pipelineSteps(2, title);
  if (p.phase === 'todos') return pipelineSteps(3, title);
  if (p.phase === 'analyze') return pipelineSteps(4, title);
  if (p.phase === 'repair') {
    return [{ id: 'repair', label: PHASE_LABELS.repair, state: p.done ? 'done' : 'active', detail: title }];
  }
  if (p.done && !p.error) return pipelineSteps(5, title);

  return pipelineSteps(1, title);
}

export interface SyncProgressUi {
  wrap: HTMLElement;
  fill: HTMLElement;
  label: HTMLElement;
}

/** Firestore puede devolver currentTitle no-string (legado: title numérico en manifest). */
function progressTitle(value: unknown, maxLen?: number): string | undefined {
  if (value == null || value === '') return undefined;
  const text = typeof value === 'string' ? value : String(value);
  return maxLen != null ? text.slice(0, maxLen) : text;
}

const SYNC_HINT_PREFIXES = [
  'Sin reuniones nuevas',
  'Import omitido',
  'Import catch-up',
  'IA omitida',
  'IA pendiente',
  'Análisis IA catch-up',
  'Análisis IA iniciado',
  'fuera de ventana',
  'Ventana de procesamiento',
  'Importadas',
  'sin mirror',
  'marcadas para re-descarga',
  'duplicado',
  'store al día',
];

/** Mensajes del pipeline útiles para el usuario (omitir ruido técnico). */
export function pickSyncResultHints(messages: string[] | undefined, max = 3): string[] {
  if (!messages?.length) return [];
  const picked: string[] = [];
  for (const msg of messages) {
    const relevant =
      SYNC_HINT_PREFIXES.some((prefix) => msg.includes(prefix)) ||
      (msg.length <= 120 && !msg.startsWith('Índice:'));
    if (relevant) picked.push(msg);
    if (picked.length >= max) break;
  }
  return picked;
}

/** Resumen legible post-sync (panel y barra de estado). */
export function formatSyncResultSummary(p: SyncProgress): string {
  if (p.error) return `Error: ${typeof p.error === 'string' ? p.error : String(p.error)}`;
  const r = p.result;
  if (!r) return p.done ? 'Completado' : 'Sincronizando…';
  const parts: string[] = [`${r.synced} sincronizada${r.synced === 1 ? '' : 's'}`];
  if (r.imported != null) parts.push(`${r.imported} en el store`);
  if (r.skipped > 0) parts.push(`${r.skipped} omitida${r.skipped === 1 ? '' : 's'}`);
  if (r.errors > 0) parts.push(`${r.errors} error${r.errors === 1 ? '' : 'es'}`);
  if (r.analysisJobId) parts.push('IA en curso');
  return `Listo: ${parts.join(' · ')}`;
}

/** Toast al cerrar sync manual o pipeline. */
export function formatSyncCompletionToast(p: SyncProgress): { message: string; type: 'info' | 'error' } {
  if (p.error) {
    return {
      message: `Sync con errores: ${typeof p.error === 'string' ? p.error : String(p.error)}`,
      type: 'error',
    };
  }
  const r = p.result;
  if (!r) return { message: 'Sincronización completada', type: 'info' };

  let message: string;
  if (r.synced === 0 && r.errors === 0) {
    const catchUp = r.messages?.some(
      (m) => m.includes('catch-up') || m.includes('sin mirror') || m.includes('Import catch-up'),
    );
    message = catchUp
      ? 'Sync completada — catch-up de reuniones pendientes'
      : 'Sync completada — sin reuniones nuevas';
  } else {
    message = `Sync completada: ${r.synced} sincronizada${r.synced === 1 ? '' : 's'}`;
    if (r.errors > 0) message += ` (${r.errors} error${r.errors === 1 ? '' : 'es'})`;
  }

  const hints = pickSyncResultHints(r.messages, 1);
  if (hints[0]) message += `. ${hints[0]}`;

  return { message, type: r.errors > 0 ? 'error' : 'info' };
}

export function formatSyncProgressStatus(p: SyncProgress): string {
  if (p.error) return `Error: ${typeof p.error === 'string' ? p.error : String(p.error)}`;
  if (p.done) return formatSyncResultSummary(p);

  const phaseLabel = PHASE_LABELS[p.phase] ?? p.phase;
  const title = progressTitle(p.currentTitle);
  if (p.phase === 'pipeline' && p.total > 0) {
    return `${phaseLabel} (${p.current}/${p.total})${title ? `: ${title}` : ''}`;
  }
  if ((p.phase === 'sync' || p.phase === 'import' || p.phase === 'reindex' || p.phase === 'todos' || p.phase === 'analyze' || p.phase === 'repair') && p.total > 0) {
    const short = progressTitle(p.currentTitle, 60);
    return `${phaseLabel} ${p.current}/${p.total}${short ? ` — ${short}` : ''}`;
  }
  if (p.phase === 'scan' || (p.total === 0 && !p.done)) {
    return title ?? `${phaseLabel}…`;
  }
  return title ?? phaseLabel;
}

export function updateSyncProgressUi(p: SyncProgress, ui?: SyncProgressUi): void {
  if (ui) {
    const current = p.current ?? 0;
    const total = p.total ?? 0;
    const pct = total > 0 ? Math.round((current / total) * 100) : p.done ? 100 : 0;
    ui.wrap.hidden = false;
    ui.fill.style.width = `${pct}%`;
    ui.fill.parentElement?.setAttribute('aria-valuenow', String(pct));
    ui.label.textContent = formatSyncProgressStatus(p);
  }
}

export function hideSyncProgressUi(ui?: SyncProgressUi): void {
  if (ui) ui.wrap.hidden = true;
}

export async function waitForSyncProgress(
  poll: () => Promise<SyncProgressResponse>,
  onUpdate: (p: SyncProgressResponse) => void,
  options?: { intervalMs?: number; runStartedAt?: string },
): Promise<SyncProgressResponse> {
  const runStartedMs = options?.runStartedAt ? new Date(options.runStartedAt).getTime() : 0;

  const belongsToRun = (p: SyncProgressResponse): boolean => {
    if (!runStartedMs || !p.startedAt) return true;
    return new Date(p.startedAt).getTime() >= runStartedMs - 3000;
  };

  const tick = async (): Promise<SyncProgressResponse | null> => {
    const p = await poll();
    if (!belongsToRun(p)) return null;
    onUpdate(p);
    if (p.done && !p.running) {
      if (p.error) throw new Error(typeof p.error === 'string' ? p.error : String(p.error));
      return p;
    }
    return null;
  };

  try {
    const immediate = await tick();
    if (immediate) return immediate;
  } catch (e) {
    throw e;
  }

  const intervalMs = options?.intervalMs ?? 800;
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const done = await tick();
        if (done) {
          clearInterval(timer);
          resolve(done);
        }
      } catch (e) {
        clearInterval(timer);
        reject(e);
      }
    }, intervalMs);
  });
}

export async function startBackgroundSync(
  start: () => Promise<{ started?: boolean; alreadyRunning?: boolean; startedAt?: string }>,
): Promise<string | undefined> {
  const res = await start();
  return res.startedAt;
}
