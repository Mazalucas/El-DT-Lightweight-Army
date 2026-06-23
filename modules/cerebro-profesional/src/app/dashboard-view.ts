import type { Meeting, MeetingTodo, Person, Project, Team } from '../core/models';
import { escapeHtml, formatDateShort, formatRelative, greetingForHour } from './format';
import { bindTodoUi, renderTodoCompact, type TodoUiHandlers } from './todo-ui';

export interface DashboardMeta {
  mirrorCount: number;
  lastMirrorSync: string | null;
  storeSavedAt: string | null;
  syncRunning: boolean;
  syncPhase?: string;
}

export interface DashboardContext extends TodoUiHandlers {
  meta: DashboardMeta;
  meetings: Meeting[];
  people: Person[];
  teams: Team[];
  projects: Project[];
  todos: MeetingTodo[];
  contactCount: number;
  onNavigate: (view: string, opts?: { todosStatus?: string }) => void;
}

function renderMeetingRow(m: Meeting, teams: Team[], projects: Project[]): string {
  const teamNames = m.teamIds.map((id) => teams.find((t) => t.id === id)).filter(Boolean) as Team[];
  const projectNames = m.projectIds
    .map((id) => projects.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);
  const status =
    m.analysisStatus === 'analyzed' ? '✓' : m.analysisStatus === 'needs_review' ? '?' : '○';

  return `
    <li class="dash-meeting" data-meeting-id="${escapeHtml(m.id)}">
      <div class="dash-meeting-head">
        <span class="dash-meeting-status" title="${escapeHtml(m.analysisStatus)}">${status}</span>
        <strong>${escapeHtml(m.title)}</strong>
      </div>
      <span class="meta">${formatDateShort(m.startedAt)}${teamNames.length ? ' · ' + teamNames.map((t) => t.name).join(', ') : ''}${projectNames.length ? ' · ' + projectNames.join(', ') : ''}</span>
      ${m.summary ? `<p class="dash-meeting-summary">${escapeHtml(m.summary.slice(0, 140))}${m.summary.length > 140 ? '…' : ''}</p>` : ''}
    </li>`;
}

export function renderDashboard(ctx: DashboardContext): string {
  const suggestedTodos = ctx.todos.filter((t) => t.status === 'suggested');
  const openTodos = ctx.todos.filter((t) => t.status === 'open');
  const doneTodos = ctx.todos.filter((t) => t.status === 'done').slice(0, 5);
  const recentMeetings = [...ctx.meetings]
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .slice(0, 8);
  const latestMeeting = recentMeetings[0];
  const needsReview = ctx.meetings.filter((m) => m.analysisStatus === 'needs_review').length;
  const analyzed = ctx.meetings.filter((m) => m.analysisStatus === 'analyzed').length;

  const suggestionsHtml = suggestedTodos.length
    ? suggestedTodos
        .slice(0, 8)
        .map((t) => renderTodoCompact(t, ctx.people, ctx.teams, ctx.projects))
        .filter(Boolean)
        .join('')
    : '<li class="dash-empty">Sin sugerencias pendientes — al sincronizar reuniones aparecerán aquí para revisar.</li>';

  const todoHtml = openTodos.length
    ? openTodos
        .slice(0, 8)
        .map((t) => renderTodoCompact(t, ctx.people, ctx.teams, ctx.projects))
        .filter(Boolean)
        .join('')
    : '<li class="dash-empty">No hay tareas abiertas — aceptá sugerencias o creá una manualmente.</li>';

  const doneHtml = doneTodos.length
    ? `<ul class="todo-list todo-list--done">${doneTodos.map((t) => renderTodoCompact(t, ctx.people, ctx.teams, ctx.projects)).join('')}</ul>`
    : '';

  return `
    <div class="dashboard">
      <header class="dash-hero">
        <div>
          <p class="dash-greeting">${greetingForHour()}</p>
          <h2 class="dash-title">Centro de comando</h2>
          <p class="dash-subtitle">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div class="dash-sync-card">
          <span class="dash-sync-label">Última sync Meet</span>
          <strong>${ctx.meta.lastMirrorSync ? formatRelative(ctx.meta.lastMirrorSync) : 'Sin datos'}</strong>
          <span class="meta">${ctx.meta.lastMirrorSync ? formatDateShort(ctx.meta.lastMirrorSync) : ''}</span>
          ${ctx.meta.syncRunning ? '<span class="dash-sync-live">Sync en curso…</span>' : ''}
        </div>
      </header>

      <div class="kpi-grid">
        <article class="kpi-card kpi-card--accent">
          <span class="kpi-value">${suggestedTodos.length}</span>
          <span class="kpi-label">Sugerencias</span>
          <button type="button" class="kpi-link" data-nav="todos" data-todos-status="suggested">Revisar →</button>
        </article>
        <article class="kpi-card">
          <span class="kpi-value">${openTodos.length}</span>
          <span class="kpi-label">Tareas abiertas</span>
          <button type="button" class="kpi-link" data-nav="todos" data-todos-status="open">Ver tareas →</button>
        </article>
        <article class="kpi-card">
          <span class="kpi-value">${ctx.contactCount}</span>
          <span class="kpi-label">Contactos</span>
          <button type="button" class="kpi-link" data-nav="people">Ver todos →</button>
        </article>
        <article class="kpi-card">
          <span class="kpi-value">${analyzed}<span class="kpi-muted">/${ctx.meetings.length}</span></span>
          <span class="kpi-label">Analizadas</span>
          ${needsReview ? `<button type="button" class="kpi-link" data-nav="inbox">${needsReview} revisar →</button>` : ''}
        </article>
      </div>

      <div class="dash-grid">
        <section class="dash-panel dash-panel--suggestions">
          <div class="dash-panel-head">
            <h3>Sugerencias por revisar</h3>
            <button type="button" class="btn-ghost btn-sm" data-nav="todos" data-todos-status="suggested">${suggestedTodos.length} pendientes →</button>
          </div>
          <ul class="todo-list">${suggestionsHtml}</ul>
        </section>

        <section class="dash-panel dash-panel--todos">
          <div class="dash-panel-head">
            <h3>Tareas confirmadas</h3>
            <button type="button" class="btn-ghost btn-sm" data-nav="todos" data-todos-status="open">${openTodos.length} abiertas →</button>
          </div>
          <ul class="todo-list">${todoHtml}</ul>
          ${doneHtml}
        </section>

        <section class="dash-panel dash-panel--meetings">
          <div class="dash-panel-head">
            <h3>Reuniones recientes</h3>
            <button type="button" class="btn-ghost btn-sm" data-nav="agenda">Ver agenda</button>
          </div>
          <ul class="dash-meeting-list">${recentMeetings.map((m) => renderMeetingRow(m, ctx.teams, ctx.projects)).join('')}</ul>
        </section>
      </div>

      <footer class="dash-footer">
        <div class="dash-footer-item">
          <span class="meta">Reunión más reciente</span>
          <strong>${latestMeeting ? escapeHtml(latestMeeting.title) : '—'}</strong>
          <span class="meta">${latestMeeting ? formatDateShort(latestMeeting.startedAt) : ''}</span>
        </div>
        <div class="dash-footer-item">
          <span class="meta">Snapshot en disco</span>
          <strong>${ctx.meta.storeSavedAt ? formatRelative(ctx.meta.storeSavedAt) : '—'}</strong>
          <span class="meta">${ctx.meta.mirrorCount} notas mirror</span>
        </div>
      </footer>
    </div>`;
}

export function bindDashboard(root: HTMLElement, ctx: DashboardContext): void {
  bindTodoUi(root, ctx);

  root.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => {
      const view = (el as HTMLElement).dataset.nav;
      const todosStatus = (el as HTMLElement).dataset.todosStatus;
      if (view) ctx.onNavigate(view, todosStatus ? { todosStatus } : undefined);
    });
  });
}
