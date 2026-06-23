import type { Catalog, CatalogEntry, CatalogSection } from './lib/types';
import { SECTION_META } from './lib/types';
import {
  createSearchIndex,
  filterEntries,
  groupBySection,
  groupCommandsByCategory,
  highlightMatch,
  sortedCommandGroups,
} from './lib/search';

const appEl = document.getElementById('app');
if (!appEl) throw new Error('#app not found');
const app: HTMLElement = appEl;

type State = {
  catalog: Catalog | null;
  query: string;
  sectionFilter: CatalogSection | null;
  selectedKey: string | null;
  error: string | null;
};

const state: State = {
  catalog: null,
  query: '',
  sectionFilter: null,
  selectedKey: null,
  error: null,
};

function entryKey(entry: CatalogEntry): string {
  return `${entry.section}:${entry.id}`;
}

async function loadCatalog(): Promise<Catalog> {
  const res = await fetch('/catalog.json');
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`);
  return res.json() as Promise<Catalog>;
}

function getVisibleEntries(): CatalogEntry[] {
  if (!state.catalog) return [];
  const fuse = createSearchIndex(state.catalog.entries);
  return filterEntries(fuse, state.query, state.sectionFilter, state.catalog.entries);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderToolCard(entry: CatalogEntry, q: string, selected: boolean): string {
  const cmd = entry.action?.type === 'command' ? entry.action.value : null;
  const canLaunch = Boolean(entry.launch);
  const actions =
    canLaunch || cmd
      ? `<div class="tool-card__actions">
          ${
            canLaunch
              ? `<button type="button" class="btn btn--launch" data-launch="${escapeHtml(entry.id)}">▶ Abrir app</button>`
              : ''
          }
          ${
            cmd
              ? `<button type="button" class="btn btn--ghost" data-action="${escapeHtml(cmd)}">Copiar ${escapeHtml(cmd)}</button>`
              : ''
          }
        </div>`
      : '';

  return `
    <article
      class="tool-card ${selected ? 'tool-card--selected' : ''}"
      data-key="${escapeHtml(entryKey(entry))}"
      tabindex="0"
    >
      <div class="tool-card__icon" aria-hidden="true">${entry.icon}</div>
      <div class="tool-card__body">
        <h3 class="tool-card__title">${highlightMatch(entry.label, q)}</h3>
        <p class="tool-card__summary">${highlightMatch(entry.summary, q)}</p>
        ${cmd ? `<p class="tool-card__cmd muted">En Cursor: <code>${escapeHtml(cmd)}</code></p>` : ''}
      </div>
      ${actions}
    </article>`;
}

function renderCommandRow(entry: CatalogEntry, q: string, selected: boolean): string {
  return `
    <button
      type="button"
      class="cmd-row ${selected ? 'cmd-row--selected' : ''}"
      data-key="${escapeHtml(entryKey(entry))}"
    >
      <span class="cmd-row__icon" aria-hidden="true">${entry.icon}</span>
      <span class="cmd-row__main">
        <span class="cmd-row__label">${highlightMatch(entry.label, q)}</span>
        <span class="cmd-row__desc">${highlightMatch(entry.summary, q)}</span>
      </span>
      <span class="cmd-row__action">Copiar</span>
    </button>`;
}

function renderSystemCard(entry: CatalogEntry, q: string, selected: boolean): string {
  return `
    <article
      class="system-card ${selected ? 'system-card--selected' : ''}"
      data-key="${escapeHtml(entryKey(entry))}"
    >
      <span class="system-card__icon" aria-hidden="true">${entry.icon}</span>
      <div>
        <h3 class="system-card__title">${highlightMatch(entry.label, q)}</h3>
        <p class="system-card__summary">${highlightMatch(entry.summary, q)}</p>
      </div>
    </article>`;
}

function renderSectionBlock(
  section: CatalogSection,
  entries: CatalogEntry[],
  q: string,
): string {
  if (entries.length === 0) return '';

  const meta = SECTION_META[section];
  const isSearching = q.trim().length > 0;

  if (section === 'tool') {
    return `
      <section class="block block--tools" aria-labelledby="sec-${section}">
        <header class="block-header">
          <h2 id="sec-${section}" class="block-title">${meta.title}</h2>
          ${!isSearching ? `<p class="block-subtitle">${meta.subtitle}</p>` : ''}
        </header>
        <div class="tool-grid">
          ${entries
            .map((e) => renderToolCard(e, q, state.selectedKey === entryKey(e)))
            .join('')}
        </div>
      </section>`;
  }

  if (section === 'command') {
    const groups = sortedCommandGroups(groupCommandsByCategory(entries));
    return `
      <section class="block block--commands" aria-labelledby="sec-${section}">
        <header class="block-header">
          <h2 id="sec-${section}" class="block-title">${meta.title}</h2>
          ${!isSearching ? `<p class="block-subtitle">${meta.subtitle}</p>` : ''}
        </header>
        ${groups
          .map(
            ([group, items]) => `
          <div class="cmd-group">
            <h3 class="cmd-group__title">${escapeHtml(group)}</h3>
            <div class="cmd-list">
              ${items.map((e) => renderCommandRow(e, q, state.selectedKey === entryKey(e))).join('')}
            </div>
          </div>`,
          )
          .join('')}
      </section>`;
  }

  return `
    <section class="block block--system" aria-labelledby="sec-${section}">
      <header class="block-header">
        <h2 id="sec-${section}" class="block-title">${meta.title}</h2>
        ${!isSearching ? `<p class="block-subtitle">${meta.subtitle}</p>` : ''}
      </header>
      <div class="system-list">
        ${entries
          .map((e) => renderSystemCard(e, q, state.selectedKey === entryKey(e)))
          .join('')}
      </div>
    </section>`;
}

function renderSearchResults(entries: CatalogEntry[], q: string): string {
  return `
    <section class="block block--search">
      <header class="block-header">
        <h2 class="block-title">${entries.length} resultado${entries.length === 1 ? '' : 's'}</h2>
      </header>
      <div class="search-results">
        ${entries
          .map((entry) => {
            const selected = state.selectedKey === entryKey(entry);
            const badge = SECTION_META[entry.section].title;
            if (entry.section === 'tool') {
              return `<div class="search-result-wrap"><span class="search-badge">${badge}</span>${renderToolCard(entry, q, selected)}</div>`;
            }
            if (entry.section === 'command') {
              return `<div class="search-result-wrap"><span class="search-badge">${badge}</span>${renderCommandRow(entry, q, selected)}</div>`;
            }
            return `<div class="search-result-wrap"><span class="search-badge">${badge}</span>${renderSystemCard(entry, q, selected)}</div>`;
          })
          .join('')}
      </div>
    </section>`;
}

function render(): void {
  const entries = getVisibleEntries();
  const q = state.query;
  const isSearching = q.trim().length > 0;

  if (entries.length > 0 && !state.selectedKey) {
    state.selectedKey = entryKey(entries[0]);
  } else if (state.selectedKey && !entries.some((e) => entryKey(e) === state.selectedKey)) {
    state.selectedKey = entries.length ? entryKey(entries[0]) : null;
  }

  const grouped = groupBySection(entries);
  const toolCount = state.catalog?.entries.filter((e) => e.section === 'tool').length ?? 0;
  const cmdCount = state.catalog?.entries.filter((e) => e.section === 'command').length ?? 0;

  let body = '';
  if (!state.catalog) {
    body = '<p class="loading">Cargando catálogo…</p>';
  } else if (entries.length === 0) {
    body = `
      <div class="empty">
        <p>No hay resultados para «${escapeHtml(q)}»</p>
        <p class="muted">Probá: <code>facturas</code>, <code>/guardar</code>, <code>yo</code></p>
      </div>`;
  } else if (isSearching) {
    body = renderSearchResults(entries, q);
  } else {
    const sections: CatalogSection[] = state.sectionFilter
      ? [state.sectionFilter]
      : ['tool', 'command', 'system'];
    body = sections
      .map((s) => renderSectionBlock(s, grouped[s], q))
      .filter(Boolean)
      .join('');
  }

  app.innerHTML = `
    <div class="hub">
      <header class="hub-header">
        <h1 class="hub-title">Mis herramientas</h1>
        <p class="hub-subtitle">Encontrá y abrí lo que necesitás</p>
      </header>

      <div class="search-bar">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input
          id="search-input"
          type="search"
          class="search-input"
          placeholder="Buscar… facturas, guardar, fiscal"
          value="${escapeHtml(q)}"
          autocomplete="off"
          spellcheck="false"
          aria-label="Buscar"
        />
        <kbd class="search-kbd">/</kbd>
      </div>

      <div class="filters" role="toolbar" aria-label="Filtrar">
        <button class="filter-chip ${state.sectionFilter === null ? 'filter-chip--active' : ''}" data-filter="">
          Todo
        </button>
        <button class="filter-chip ${state.sectionFilter === 'tool' ? 'filter-chip--active' : ''}" data-filter="tool">
          Herramientas <span class="filter-count">${toolCount}</span>
        </button>
        <button class="filter-chip ${state.sectionFilter === 'command' ? 'filter-chip--active' : ''}" data-filter="command">
          Comandos <span class="filter-count">${cmdCount}</span>
        </button>
        <button class="filter-chip ${state.sectionFilter === 'system' ? 'filter-chip--active' : ''}" data-filter="system">
          Sistema
        </button>
      </div>

      ${state.error ? `<div class="error-banner" role="alert">${escapeHtml(state.error)}</div>` : ''}

      <main class="content" aria-live="polite">${body}</main>

      <footer class="hub-footer muted">
        <span><kbd>/</kbd> buscar</span>
        <span>↑↓ elegir</span>
        <span>Enter copiar command</span>
        <span>▶ Abrir app en herramientas</span>
      </footer>
    </div>
  `;

  bindEvents(entries);
}

function findEntryByKey(key: string, entries: CatalogEntry[]): CatalogEntry | undefined {
  return entries.find((e) => entryKey(e) === key);
}

const launchingIds = new Set<string>();

async function launchTool(moduleId: string): Promise<void> {
  if (launchingIds.has(moduleId)) return;
  launchingIds.add(moduleId);
  showToast('Iniciando…');
  try {
    const res = await fetch(`/api/launch/${encodeURIComponent(moduleId)}`, { method: 'POST' });
    const data = (await res.json()) as {
      status: string;
      url?: string;
      error?: string;
      started?: boolean;
    };
    if (data.status === 'ready' && data.url) {
      window.open(data.url, '_blank', 'noopener');
      showToast(
        data.started ? `App iniciada — ${data.url}` : `App abierta — ${data.url}`,
      );
    } else {
      showToast(data.error ?? 'No se pudo iniciar la app');
    }
  } catch {
    showToast('Error de red — ¿Tools Hub en modo dev?');
  } finally {
    launchingIds.delete(moduleId);
  }
}

function bindEvents(entries: CatalogEntry[]): void {
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  if (!state.query) input?.focus();

  input?.addEventListener('input', () => {
    state.query = input.value;
    state.selectedKey = null;
    render();
  });

  document.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = (btn as HTMLElement).dataset.filter ?? '';
      state.sectionFilter = (filter as CatalogSection) || null;
      state.selectedKey = null;
      render();
    });
  });

  const activate = (key: string) => {
    state.selectedKey = key;
    const entry = findEntryByKey(key, entries);
    if (entry) void handleSelect(entry);
  };

  document.querySelectorAll('[data-key]').forEach((el) => {
    const key = (el as HTMLElement).dataset.key!;
    const isCommand = el.classList.contains('cmd-row');

    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action], [data-launch]')) return;
      state.selectedKey = key;
      if (isCommand) {
        const entry = findEntryByKey(key, entries);
        if (entry) void handleSelect(entry);
        return;
      }
      document.querySelectorAll('[data-key]').forEach((node) => {
        node.classList.remove('tool-card--selected', 'cmd-row--selected', 'system-card--selected');
      });
      el.classList.add(
        el.classList.contains('tool-card')
          ? 'tool-card--selected'
          : 'system-card--selected',
      );
    });
    el.addEventListener('dblclick', () => {
      if (isCommand) return;
      activate(key);
    });
  });

  document.querySelectorAll('.cmd-row, .tool-card, .system-card').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        e.preventDefault();
        activate((el as HTMLElement).dataset.key!);
      }
    });
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = (btn as HTMLElement).dataset.action!;
      void copyToClipboard(cmd).then(() => showToast(`Copiado ${cmd} — pegalo en Cursor`));
    });
  });

  document.querySelectorAll('[data-launch]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const moduleId = (btn as HTMLElement).dataset.launch!;
      void launchTool(moduleId);
    });
  });
}

async function handleSelect(entry: CatalogEntry): Promise<void> {
  if (!entry.action) return;
  const { type, value } = entry.action;

  if (type === 'url') {
    window.open(value, '_blank', 'noopener');
    return;
  }

  if (type === 'command') {
    await copyToClipboard(value);
    showToast(`Copiado ${value} — pegalo en Cursor`);
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function showToast(message: string): void {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

document.addEventListener('keydown', (e) => {
  const input = document.getElementById('search-input') as HTMLInputElement | null;
  const entries = getVisibleEntries();

  if (e.key === '/' && document.activeElement !== input) {
    e.preventDefault();
    input?.focus();
    input?.select();
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    input?.focus();
    input?.select();
    return;
  }

  if (e.key === 'Escape') {
    if (state.query) {
      state.query = '';
      state.selectedKey = null;
      render();
    } else {
      input?.blur();
    }
    return;
  }

  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
  if (entries.length === 0) return;

  const currentIdx = entries.findIndex((en) => entryKey(en) === state.selectedKey);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = entries[Math.min(currentIdx + 1, entries.length - 1)];
    state.selectedKey = entryKey(next);
    render();
    scrollSelectedIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = entries[Math.max(currentIdx - 1, 0)];
    state.selectedKey = entryKey(prev);
    render();
    scrollSelectedIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const entry = entries.find((en) => entryKey(en) === state.selectedKey) ?? entries[0];
    void handleSelect(entry);
  }
});

function scrollSelectedIntoView(): void {
  document
    .querySelector('.tool-card--selected, .cmd-row--selected, .system-card--selected')
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

async function init(): Promise<void> {
  render();
  try {
    state.catalog = await loadCatalog();
    state.error = null;
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Error desconocido';
  }
  render();
}

void init();
