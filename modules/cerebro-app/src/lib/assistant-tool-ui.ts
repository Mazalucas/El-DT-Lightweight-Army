import type { StoreHealthMetrics } from '@shared/types.js';
import { labelForTool } from './assistant-catalog.js';
import { escapeHtml, formatDate } from './ui.js';
import { icon } from '../ui/icons.js';

export type ToolRunStatus = 'running' | 'done' | 'error';

export type ToolRun = {
  name: string;
  args?: Record<string, unknown>;
  result?: unknown;
  status: ToolRunStatus;
};

export function navigateAppHash(hash: string): void {
  location.hash = hash.startsWith('#') ? hash : `#/${hash.replace(/^#\/?/, '')}`;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function linkButton(label: string, hash: string, iconName?: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'assistant-action-link';
  a.href = hash.startsWith('#') ? hash : `#/${hash}`;
  a.innerHTML = iconName ? `${icon(iconName)}<span>${escapeHtml(label)}</span>` : escapeHtml(label);
  a.addEventListener('click', (e) => {
    e.preventDefault();
    navigateAppHash(a.href);
  });
  return a;
}

function metricChip(label: string, value: string, tone: 'ok' | 'warn' | 'default' = 'default'): HTMLElement {
  const chip = document.createElement('span');
  chip.className = `assistant-metric-chip assistant-metric-chip--${tone}`;
  chip.innerHTML = `<span class="assistant-metric-label">${escapeHtml(label)}</span><span class="assistant-metric-value">${escapeHtml(value)}</span>`;
  return chip;
}

function renderMeetingList(meetings: Array<{ id: string; title: string; startedAt?: string }>, host: HTMLElement): void {
  if (!meetings.length) {
    host.appendChild(Object.assign(document.createElement('p'), { className: 'muted assistant-tool-empty', textContent: 'Sin reuniones.' }));
    return;
  }
  const list = document.createElement('div');
  list.className = 'assistant-tool-list';
  meetings.slice(0, 6).forEach((m) => {
    const row = document.createElement('div');
    row.className = 'assistant-tool-row';
    const meta = m.startedAt ? formatDate(m.startedAt) : '';
    row.innerHTML = `
      <span class="assistant-tool-row-title">${escapeHtml(m.title || 'Sin título')}</span>
      ${meta ? `<span class="muted assistant-tool-row-meta">${escapeHtml(meta)}</span>` : ''}
    `;
    row.appendChild(linkButton('Abrir', `#/meeting/${m.id}`, 'calendar'));
    list.appendChild(row);
  });
  if (meetings.length > 6) {
    const more = document.createElement('p');
    more.className = 'muted assistant-tool-more';
    more.textContent = `+${meetings.length - 6} más en la respuesta del asistente.`;
    list.appendChild(more);
  }
  host.appendChild(list);
}

function renderPeopleList(
  people: Array<{ id: string; displayName: string; emails?: string[] }>,
  host: HTMLElement,
): void {
  if (!people.length) {
    host.appendChild(Object.assign(document.createElement('p'), { className: 'muted assistant-tool-empty', textContent: 'Sin contactos.' }));
    return;
  }
  const list = document.createElement('div');
  list.className = 'assistant-tool-list';
  people.slice(0, 6).forEach((p) => {
    const row = document.createElement('div');
    row.className = 'assistant-tool-row';
    const email = p.emails?.[0] ?? '';
    row.innerHTML = `
      <span class="assistant-tool-row-title">${escapeHtml(p.displayName)}</span>
      ${email ? `<span class="muted assistant-tool-row-meta">${escapeHtml(email)}</span>` : ''}
    `;
    row.appendChild(linkButton('Contactos', '#/profesional/contactos', 'users'));
    list.appendChild(row);
  });
  host.appendChild(list);
}

function renderHealthMetrics(health: StoreHealthMetrics, host: HTMLElement): void {
  const grid = document.createElement('div');
  grid.className = 'assistant-metric-grid';
  grid.append(
    metricChip('Reuniones', `${health.meetingsSynced}/${health.meetingsTotal}`, health.meetingsSynced === health.meetingsTotal ? 'ok' : 'warn'),
    metricChip('Contactos', String(health.contactsCount), health.contactsCount > 0 ? 'ok' : 'warn'),
    metricChip('Prospects', String(health.prospectsPending), health.prospectsPending > 0 ? 'warn' : 'ok'),
    metricChip('Inbox', String(health.projectSuggestionsPending + health.teamSuggestionsPending), 'default'),
    metricChip('Tareas', String(health.todosOpen + health.todosSuggested), 'default'),
  );
  host.appendChild(grid);
  const actions = document.createElement('div');
  actions.className = 'assistant-tool-actions';
  actions.append(
    linkButton('Ver tablero', '#/profesional/tablero', 'check'),
    linkButton('Ver reuniones', '#/profesional/reuniones', 'calendar'),
  );
  if (health.needsRepair) {
    actions.appendChild(linkButton('Salud del cerebro', '#/', 'brain'));
  }
  host.appendChild(actions);
}

function renderActionResult(result: Record<string, unknown>, host: HTMLElement): void {
  const banner = document.createElement('div');
  banner.className = result.started === false ? 'assistant-action-banner assistant-action-banner--warn' : 'assistant-action-banner assistant-action-banner--ok';
  const msg = typeof result.message === 'string' ? result.message : result.started ? 'Acción iniciada' : 'Acción en curso';
  banner.textContent = msg;
  host.appendChild(banner);

  const actions = document.createElement('div');
  actions.className = 'assistant-tool-actions';
  actions.append(linkButton('Ver tablero', '#/profesional/tablero', 'check'));
  host.appendChild(actions);
}

function renderSyncProgress(result: Record<string, unknown>, host: HTMLElement): void {
  const phase = typeof result.phase === 'string' ? result.phase : 'sync';
  const current = typeof result.current === 'number' ? result.current : 0;
  const total = typeof result.total === 'number' ? result.total : 0;
  const title = typeof result.currentTitle === 'string' ? result.currentTitle : phase;

  const bar = document.createElement('div');
  bar.className = 'assistant-progress';
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  bar.innerHTML = `
    <div class="assistant-progress-label">${escapeHtml(title)}</div>
    <div class="assistant-progress-track"><div class="assistant-progress-fill" style="width:${pct}%"></div></div>
    <div class="assistant-progress-meta muted">${total > 0 ? `${current}/${total} (${pct}%)` : 'En curso…'}</div>
  `;
  host.appendChild(bar);
}

function renderSuggestions(items: Array<{ id: string; title: string; kind?: string }>, host: HTMLElement): void {
  if (!items.length) {
    host.appendChild(Object.assign(document.createElement('p'), { className: 'muted assistant-tool-empty', textContent: 'Inbox vacío.' }));
    return;
  }
  const list = document.createElement('div');
  list.className = 'assistant-tool-list';
  items.slice(0, 5).forEach((s) => {
    const row = document.createElement('div');
    row.className = 'assistant-tool-row';
    row.innerHTML = `<span class="assistant-tool-row-title">${escapeHtml(s.title)}</span>`;
    row.appendChild(linkButton('Tablero', '#/profesional/tablero', 'check'));
    list.appendChild(row);
  });
  host.appendChild(list);
}

function renderTodos(items: Array<{ id: string; text: string; meetingTitle?: string }>, host: HTMLElement): void {
  if (!items.length) {
    host.appendChild(Object.assign(document.createElement('p'), { className: 'muted assistant-tool-empty', textContent: 'Sin tareas.' }));
    return;
  }
  const list = document.createElement('div');
  list.className = 'assistant-tool-list';
  items.slice(0, 5).forEach((t) => {
    const row = document.createElement('div');
    row.className = 'assistant-tool-row';
    row.innerHTML = `
      <span class="assistant-tool-row-title">${escapeHtml(t.text)}</span>
      ${t.meetingTitle ? `<span class="muted assistant-tool-row-meta">${escapeHtml(t.meetingTitle)}</span>` : ''}
    `;
    row.appendChild(linkButton('Tablero', '#/profesional/tablero', 'check'));
    list.appendChild(row);
  });
  host.appendChild(list);
}

function renderGraphSummary(result: Record<string, unknown>, host: HTMLElement): void {
  const nodes = Array.isArray(result.nodes) ? result.nodes.length : 0;
  const edges = Array.isArray(result.edges) ? result.edges.length : 0;
  const grid = document.createElement('div');
  grid.className = 'assistant-metric-grid';
  grid.append(metricChip('Nodos', String(nodes), 'default'), metricChip('Enlaces', String(edges), 'default'));
  host.appendChild(grid);
  const actions = document.createElement('div');
  actions.className = 'assistant-tool-actions';
  actions.appendChild(linkButton('Ver red', '#/profesional/red', 'share'));
  host.appendChild(actions);
}

export function renderToolRunBody(run: ToolRun, host: HTMLElement): void {
  host.replaceChildren();
  if (run.status === 'running') {
    const loading = document.createElement('p');
    loading.className = 'assistant-tool-loading muted';
    loading.textContent = 'Ejecutando…';
    host.appendChild(loading);
    return;
  }

  if (run.status === 'error' || (isRecord(run.result) && 'error' in run.result)) {
    const err = isRecord(run.result) && typeof run.result.error === 'string' ? run.result.error : 'Error en herramienta';
    host.appendChild(Object.assign(document.createElement('p'), { className: 'assistant-tool-error', textContent: err }));
    return;
  }

  const result = run.result;
  const name = run.name;

  if (name === 'get_store_health' && isRecord(result)) {
    renderHealthMetrics(result as unknown as StoreHealthMetrics, host);
    return;
  }

  if (name === 'get_store_summary' && isRecord(result) && isRecord(result.health)) {
    renderHealthMetrics(result.health as unknown as StoreHealthMetrics, host);
    return;
  }

  if (name === 'search_meetings' && Array.isArray(result)) {
    renderMeetingList(result as Array<{ id: string; title: string; startedAt?: string }>, host);
    return;
  }

  if ((name === 'list_meetings' || name === 'search_meetings') && isRecord(result)) {
    const meetings = Array.isArray(result.meetings)
      ? (result.meetings as Array<{ id: string; title: string; startedAt?: string }>)
      : (result as unknown as Array<{ id: string; title: string; startedAt?: string }>);
    renderMeetingList(meetings, host);
    return;
  }

  if (name === 'get_meeting' && isRecord(result) && typeof result.id === 'string') {
    renderMeetingList([{ id: result.id, title: String(result.title ?? 'Reunión'), startedAt: result.startedAt as string | undefined }], host);
    return;
  }

  if (name === 'search_catalog' && isRecord(result)) {
    if (Array.isArray(result.meetings) && result.meetings.length) {
      renderMeetingList(result.meetings as Array<{ id: string; title: string; startedAt?: string }>, host);
    }
    if (Array.isArray(result.people) && result.people.length) {
      renderPeopleList(result.people as Array<{ id: string; displayName: string; emails?: string[] }>, host);
    }
    if (Array.isArray(result.projects) && result.projects.length) {
      const list = document.createElement('div');
      list.className = 'assistant-tool-list';
      (result.projects as Array<{ id: string; name: string }>).slice(0, 5).forEach((p) => {
        const row = document.createElement('div');
        row.className = 'assistant-tool-row';
        row.innerHTML = `<span class="assistant-tool-row-title">${escapeHtml(p.name)}</span>`;
        row.appendChild(linkButton('Proyectos', '#/profesional/proyectos', 'folder'));
        list.appendChild(row);
      });
      host.appendChild(list);
    }
    if (!host.childElementCount) {
      host.appendChild(Object.assign(document.createElement('p'), { className: 'muted assistant-tool-empty', textContent: 'Sin resultados.' }));
    }
    return;
  }

  if ((name === 'list_people' || name === 'list_prospects') && Array.isArray(result)) {
    renderPeopleList(
      (result as Array<{ id: string; displayName: string; emails?: string[] }>).map((p) => ({
        id: p.id,
        displayName: p.displayName ?? 'Sin nombre',
        emails: p.emails,
      })),
      host,
    );
    return;
  }

  if (name === 'list_suggestions' && Array.isArray(result)) {
    renderSuggestions(result as Array<{ id: string; title: string; kind?: string }>, host);
    return;
  }

  if (name === 'list_todos' && Array.isArray(result)) {
    renderTodos(result as Array<{ id: string; text: string; meetingTitle?: string }>, host);
    return;
  }

  if (name === 'get_sync_progress' && isRecord(result)) {
    renderSyncProgress(result, host);
    return;
  }

  if ((name === 'start_sync' || name === 'start_pipeline' || name === 'run_repair') && isRecord(result)) {
    renderActionResult(result, host);
    return;
  }

  if ((name === 'dismiss_suggestion' || name === 'accept_todos') && isRecord(result)) {
    const ok = document.createElement('div');
    ok.className = 'assistant-action-banner assistant-action-banner--ok';
    ok.textContent = name === 'accept_todos' ? 'Tareas actualizadas' : 'Sugerencia descartada';
    host.appendChild(ok);
    const actions = document.createElement('div');
    actions.className = 'assistant-tool-actions';
    actions.appendChild(linkButton('Ver tablero', '#/profesional/tablero', 'check'));
    host.appendChild(actions);
    return;
  }

  if (name === 'get_graph' && isRecord(result)) {
    renderGraphSummary(result, host);
    return;
  }

  const fallback = document.createElement('pre');
  fallback.className = 'assistant-tool-json muted';
  fallback.textContent = JSON.stringify(result, null, 2).slice(0, 800);
  host.appendChild(fallback);
}

export function createToolRunCard(run: ToolRun, opts?: { compact?: boolean }): HTMLElement {
  const card = document.createElement('details');
  card.className = `assistant-tool-card assistant-tool-card--${run.status}${opts?.compact ? ' assistant-tool-card--compact' : ''}`;
  card.open = run.status === 'running' || !opts?.compact;

  const summary = document.createElement('summary');
  summary.className = 'assistant-tool-card-head';
  summary.innerHTML = `
    <span class="assistant-tool-card-icon">${icon('brain')}</span>
    <span class="assistant-tool-card-title">${escapeHtml(labelForTool(run.name))}</span>
    <span class="assistant-tool-card-status assistant-tool-card-status--${run.status}">${run.status === 'running' ? '…' : run.status === 'error' ? '!' : '✓'}</span>
  `;

  const body = document.createElement('div');
  body.className = 'assistant-tool-card-body';
  renderToolRunBody(run, body);

  card.append(summary, body);
  return card;
}

export function updateToolRunCard(card: HTMLElement, run: ToolRun): void {
  card.className = `assistant-tool-card assistant-tool-card--${run.status}${card.classList.contains('assistant-tool-card--compact') ? ' assistant-tool-card--compact' : ''}`;
  const statusEl = card.querySelector('.assistant-tool-card-status');
  if (statusEl) {
    statusEl.className = `assistant-tool-card-status assistant-tool-card-status--${run.status}`;
    statusEl.textContent = run.status === 'running' ? '…' : run.status === 'error' ? '!' : '✓';
  }
  const body = card.querySelector('.assistant-tool-card-body');
  if (body) renderToolRunBody(run, body as HTMLElement);
  if (run.status !== 'running') (card as HTMLDetailsElement).open = false;
}
