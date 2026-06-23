import type { SyncProgress, SyncProgressResponse } from '@shared/types.js';

const PHASE_LABELS: Record<SyncProgress['phase'], string> = {
  idle: 'Listo',
  pipeline: 'Pipeline',
  scan: 'Indexando',
  sync: 'Sincronizando',
  import: 'Importando',
  reindex: 'Contactos y reuniones',
  todos: 'Tareas sugeridas',
  analyze: 'Analizando IA',
  repair: 'Reparando store',
};

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

export function formatSyncProgressStatus(p: SyncProgress): string {
  if (p.error) return `Error: ${typeof p.error === 'string' ? p.error : String(p.error)}`;
  if (p.done) {
    const r = p.result;
    if (r) {
      const parts = [`${r.synced} sync`];
      if (r.imported != null) parts.push(`${r.imported} import`);
      if (r.analysisJobId) parts.push('IA en curso');
      return `Listo: ${parts.join(' · ')}`;
    }
    return 'Completado';
  }

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
