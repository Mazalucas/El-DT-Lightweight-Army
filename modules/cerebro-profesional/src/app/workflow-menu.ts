import {
  APPS_SCRIPT_GUIDE,
  CURSOR_ANALYZE_CMD,
  OAUTH_GUIDE,
  SETUP_SOURCES_GUIDE,
  WORKFLOW_STEPS,
  stepActionLabel,
  stepTag,
  type WorkflowStepId,
} from './workflow-steps';

export interface WorkflowMenuContext {
  root: HTMLElement;
  isBusy: () => boolean;
  getStatusLine: () => Promise<string>;
  onStep: (id: WorkflowStepId) => Promise<void>;
  toast: (msg: string) => void;
}

export function mountWorkflowMenu(ctx: WorkflowMenuContext): void {
  const host = ctx.root.querySelector('#workflow-menu-host') as HTMLElement | null;
  if (!host) return;

  const renderSteps = () => {
    host.innerHTML = `
      <div class="workflow-panel" id="workflow-panel" hidden>
        <p class="workflow-intro">Ritual recomendado: ejecutá en orden. Los pasos en <span class="tag-cursor">Cursor</span> no corren en el navegador.</p>
        <ul class="workflow-list">
          ${WORKFLOW_STEPS.map((s) => stepRow(s)).join('')}
        </ul>
        <div class="workflow-footer">
          <button type="button" class="btn-primary btn-sm" id="wf-run-pipeline">Pipeline completo (1→5)</button>
          <button type="button" class="btn-ghost btn-sm" id="wf-run-inapp">Sync + importar (1→4)</button>
        </div>
        <pre id="workflow-guide" class="workflow-guide" hidden></pre>
      </div>
    `;

    host.querySelectorAll('[data-wf-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.wfAction as WorkflowStepId;
        void handleAction(id, ctx);
      });
    });

    host.querySelector('#wf-run-pipeline')?.addEventListener('click', () => {
      void runSequence(['index', 'sync', 'import', 'process-all'], ctx, 'Pipeline 1→5 completado');
    });

    host.querySelector('#wf-run-inapp')?.addEventListener('click', () => {
      void runSequence(['index', 'sync', 'import'], ctx, 'Pasos 1–4 completados');
    });
  };

  renderSteps();

  const toggleBtn = ctx.root.querySelector('#btn-actions-menu') as HTMLButtonElement | null;
  const panel = () => host.querySelector('#workflow-panel') as HTMLElement;
  const guideEl = () => host.querySelector('#workflow-guide') as HTMLElement;

  toggleBtn?.addEventListener('click', async () => {
    const p = panel();
    const open = p.hidden;
    p.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      guideEl().hidden = true;
      const line = await ctx.getStatusLine();
      const intro = host.querySelector('.workflow-intro');
      if (intro) intro.textContent = line;
    }
  });

  document.addEventListener('click', (e) => {
    if (!openPanelIsVisible()) return;
    const t = e.target as Node;
    if (toggleBtn?.contains(t) || host.contains(t)) return;
    panel().hidden = true;
    toggleBtn?.setAttribute('aria-expanded', 'false');
  });

  function openPanelIsVisible(): boolean {
    const p = panel();
    return p && !p.hidden;
  }
}

function stepRow(s: (typeof WORKFLOW_STEPS)[number]): string {
  const where = stepTag(s);
  const tag =
    where === 'app'
      ? '<span class="tag-app">App</span>'
      : where === 'cursor'
        ? '<span class="tag-cursor">Cursor</span>'
        : '<span class="tag-guide">Guía</span>';
  const label = stepActionLabel(s);
  const btn = label
    ? `<button type="button" class="btn-ghost btn-sm" data-wf-action="${s.id}">${label}</button>`
    : '';
  return `
    <li class="workflow-item">
      <span class="workflow-num">${s.num}</span>
      <div class="workflow-body">
        <div class="workflow-head">${tag} <strong>${s.title}</strong></div>
        <p class="meta">${s.summary}</p>
      </div>
      ${btn}
    </li>`;
}

async function runSequence(
  ids: WorkflowStepId[],
  ctx: WorkflowMenuContext,
  successMsg: string,
): Promise<void> {
  try {
    for (const id of ids) {
      await ctx.onStep(id);
    }
    ctx.toast(successMsg);
  } catch {
    ctx.toast('Flujo interrumpido — revisá el paso que falló');
  }
}

async function handleAction(id: WorkflowStepId, ctx: WorkflowMenuContext): Promise<void> {
  if (ctx.isBusy() && id !== 'oauth' && id !== 'analyze' && id !== 'setup-sources') {
    ctx.toast('Esperá a que termine la acción en curso');
    return;
  }

  const guide = ctx.root.querySelector('#workflow-guide') as HTMLElement;

  if (id === 'oauth') {
    guide.hidden = false;
    guide.textContent = OAUTH_GUIDE;
    guide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  if (id === 'setup-sources') {
    guide.hidden = false;
    guide.textContent = `${SETUP_SOURCES_GUIDE}\n\n---\n\n${APPS_SCRIPT_GUIDE}`;
    guide.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  if (id === 'analyze') {
    guide.hidden = false;
    guide.textContent =
      `En Cursor (chat), pegá:\n\n${CURSOR_ANALYZE_CMD}\n\nLuego ejecutá el paso 7 aquí (Aplicar análisis Cursor).`;
    try {
      await navigator.clipboard.writeText(CURSOR_ANALYZE_CMD);
      ctx.toast('Comando copiado al portapapeles');
    } catch {
      ctx.toast('Copiá el comando manualmente desde el panel');
    }
    return;
  }

  guide.hidden = true;
  await ctx.onStep(id);
}
