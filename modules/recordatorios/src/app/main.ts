import type { AppContext } from './composition-root';
import { downloadJsonBackup, importJsonBackupFile } from '../adapters/backup/json-backup';
import { collectTags } from '../core/lib/filters';
import type { ReminderQuery } from '../core/models/reminder';
import { renderReminderRow } from '../ui/helpers';
import { mountQuickAdd, mountSidebar, updateSidebarTags } from '../ui/quick-add';

type ViewState = {
  view: string;
  categoryId?: string;
  tag?: string;
  search: string;
};

export async function bootstrapApp(root: HTMLElement, ctx: AppContext): Promise<void> {
  const state: ViewState = { view: 'all', search: '' };
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  root.innerHTML = `
    <div class="layout">
      <div class="deprecation-banner" role="status" style="background:#fef3c7;color:#92400e;padding:0.75rem 1rem;border-bottom:1px solid #fcd34d;font-size:0.9rem;">
        <strong>Migrado a Cerebro profesional.</strong> Usá <code>/cerebro-profesional</code> → vista <strong>Recordatorios</strong>.
        Para migrar datos: <code>node modules/cerebro-profesional/scripts/migrate-recordatorios-backup.mjs</code>
      </div>
      <header class="header">
        <h1>Recordatorios</h1>
        <div class="header-actions">
          <span id="inbox-badge" class="inbox-badge" aria-live="polite"></span>
          <button type="button" id="btn-export" class="btn-ghost">Exportar</button>
          <label class="btn-ghost" style="cursor:pointer">
            Importar
            <input type="file" id="btn-import" accept="application/json" hidden />
          </label>
        </div>
      </header>
      <aside class="sidebar-panel" id="sidebar"></aside>
      <main class="main-panel">
        <div id="quick-add"></div>
        <div class="search-row">
          <input type="search" id="search-input" placeholder="Buscar… ( / )" aria-label="Buscar recordatorios" />
        </div>
        <div id="reminder-list" class="reminder-list" aria-live="polite"></div>
      </main>
    </div>
  `;

  const listEl = root.querySelector('#reminder-list') as HTMLElement;
  const sidebarEl = root.querySelector('#sidebar') as HTMLElement;
  const quickAddEl = root.querySelector('#quick-add') as HTMLElement;
  const badgeEl = root.querySelector('#inbox-badge') as HTMLElement;
  const searchInput = root.querySelector('#search-input') as HTMLInputElement;

  const quickAdd = mountQuickAdd(
    quickAddEl,
    ctx.categories,
    ctx.defaultCategoryId,
    async (raw, categoryId) => {
      const withCat = raw.includes('@') ? raw : `${raw} @${categoryId}`;
      await ctx.reminderService.createFromCapture({ raw: withCat, source: 'web' });
      await ctx.categoryStore.saveLastCategoryId(categoryId);
      quickAdd.setCategoryId(categoryId);
      showToast('Recordatorio añadido');
      await refresh();
    },
  );

  const lastCat = await ctx.categoryStore.getLastCategoryId();
  if (lastCat) quickAdd.setCategoryId(lastCat);

  mountSidebar(sidebarEl, (view) => {
    state.view = view;
    state.tag = undefined;
    void refresh();
  });

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value;
    void refresh();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'n' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      quickAddEl.querySelector('input')?.focus();
    }
  });

  root.querySelector('#btn-export')?.addEventListener('click', async () => {
    const data = await ctx.backupStore.export();
    downloadJsonBackup(data);
    showToast('Backup descargado');
  });

  root.querySelector('#btn-import')?.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      await importJsonBackupFile(file, ctx.backupStore);
      ctx.categories.splice(0, ctx.categories.length, ...ctx.categoryRegistry.merge());
      showToast('Backup importado');
      await refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al importar');
    }
  });

  async function buildQuery(): Promise<ReminderQuery> {
    const q: ReminderQuery = { search: state.search || undefined };
    if (state.view === 'done') {
      q.status = 'done';
    } else if (state.view === 'all') {
      q.status = 'open';
    } else if (state.view === 'today') {
      q.status = 'open';
      q.view = 'today';
    } else if (state.view === 'overdue') {
      q.status = 'open';
      q.view = 'overdue';
    } else if (state.view === 'no-date') {
      q.status = 'open';
      q.view = 'no-date';
    }
    if (state.tag) q.tag = state.tag;
    if (state.categoryId) q.categoryId = state.categoryId;
    return q;
  }

  async function refresh(): Promise<void> {
    const reminders = await ctx.reminderService.list(await buildQuery());
    const catMap = new Map(ctx.categoryRegistry.merge().map((c) => [c.id, c]));

    if (reminders.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No hay recordatorios en esta vista.</p>';
    } else {
      listEl.innerHTML = reminders
        .map((r) => renderReminderRow(r, catMap.get(r.categoryId)))
        .join('');
    }

    listEl.querySelectorAll('.reminder-row').forEach((row) => {
      const id = (row as HTMLElement).dataset.id!;
      const checkbox = row.querySelector('input[type=checkbox]') as HTMLInputElement;
      checkbox?.addEventListener('change', async () => {
        if (checkbox.checked) {
          await ctx.reminderService.complete(id);
        } else {
          await ctx.reminderService.update(id, { status: 'open' });
        }
        await refresh();
      });
      row.querySelectorAll('.tag-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          state.tag = (pill as HTMLElement).dataset.tag;
          state.view = 'all';
          void refresh();
        });
      });
    });

    const allOpen = await ctx.reminderService.list({ status: 'open' });
    updateSidebarTags(sidebarEl, collectTags(allOpen), (tag) => {
      state.tag = tag;
      state.view = 'all';
      void refresh();
    });
  }

  async function drainInbox(): Promise<void> {
    const before = await fetch('/api/inbox/pending').then((r) => r.json()).catch(() => ({ items: [] }));
    const pendingCount = (before as { items: unknown[] }).items?.length ?? 0;

    if (pendingCount > 0) {
      badgeEl.textContent = `${pendingCount} del chat`;
      badgeEl.classList.add('is-visible');
    } else {
      badgeEl.classList.remove('is-visible');
    }

    const result = await ctx.inboxProcessor.importPending();
    if (result.imported > 0) {
      showToast(`${result.imported} recordatorio(s) del chat importados`);
      await refresh();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void drainInbox();
  });

  await drainInbox();
  await refresh();

  pollTimer = setInterval(() => void drainInbox(), ctx.inboxPollIntervalMs);

  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
  });
}

function showToast(message: string): void {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

const root = document.getElementById('app');
if (root) {
  void (async () => {
    const { createAppContext } = await import('./composition-root');
    try {
      const ctx = await createAppContext();
      await bootstrapApp(root, ctx);
    } catch (err) {
      root.innerHTML = `<p class="empty-state">Error al iniciar: ${err instanceof Error ? err.message : 'desconocido'}. ¿Está corriendo <code>npm run dev</code>?</p>`;
    }
  })();
}
