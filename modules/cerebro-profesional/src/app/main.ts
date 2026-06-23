import { db } from '../core/db';
import type { Meeting, Person, Project, Team } from '../core/models';
import { importAnalysisRows } from '../core/analysis-import';
import {
  loadSnapshotFromServer,
  mergeMeetingAnalysisFromSnapshot,
  persistSnapshotToServer,
  reconcileWithDiskSnapshot,
  setupAutoPersist,
} from '../core/persist-store';
import { reindexFromMirror, type ReindexResult } from '../core/reindex';
import { meetingsForPerson } from '../core/meeting-participation';
import {
  buildMeetingContactDisplays,
  meetingProspectsForDisplay,
  repairMeetingPersonLinks,
} from '../core/meeting-contacts';
import { parseMirrorMarkdown } from '../core/parse-mirror-md';
import { searchMeetings } from '../core/search';
import {
  createPerson,
  createProject,
  createTeam,
  deleteProject,
  deleteTeam,
  linkProspectToContact,
  mergePersonsIntoCanonical,
  migrateContactsWithoutEmailToProspects,
  promoteProspectToContact,
  removePersonsFromProject,
  removePersonsFromTeam,
  setPersonProjects,
  setPersonTeams,
  updatePerson,
  updateProject,
  updateTeam,
} from '../core/catalog-mutate';
import {
  bindContactProfile,
  bindContactsPage,
  buildPersonStatsList,
  filterAndSortPeople,
  renderContactProfile,
  renderContactsPage,
  type MergeCandidate,
  type PeopleSort,
} from './contacts-view';
import {
  bindProjectsListPage,
  bindProjectDetailPage,
  renderProjectDetailPage,
  renderProjectsListPage,
} from './projects-settings-view';
import {
  bindTeamDetailPage,
  bindTeamsListPage,
  renderTeamDetailPage,
  renderTeamsListPage,
} from './teams-settings-view';
import {
  bindProspectsPage,
  buildProspectRows,
  renderProspectsPage,
} from './prospects-view';
import { bindDashboard, renderDashboard, type DashboardMeta } from './dashboard-view';
import {
  bindMeetingContactsSection,
  renderMeetingContactsSection,
  toProspectDisplays,
} from './meeting-contacts-view';
import { formatDate } from './format';
import {
  acceptSuggestion,
  acceptSuggestionsBulk,
  createManualTodo,
  deleteManualTodo,
  dismissAllSuggestions,
  restoreTodoSnapshot,
  restoreTodoSnapshotsBulk,
  setTodoStatus,
  setTodosStatusBulk,
  syncExtractedTodos,
  updateManualTodo,
  type AcceptSuggestionInput,
} from '../core/meeting-todos';
import { parseCapture } from '../core/lib/capture-parser';
import { importReminderInboxRows } from '../core/reminders-inbox-import';
import { migrateExtractedOpenToSuggested } from '../core/todo-migrate';
import { bindTodosPage, filterTodos, PAGE_SIZE, patchTodosSelectionUi, renderTodosPage, type TodoFormInput } from './todos-view';
import { bindRemindersPage, renderRemindersPage } from './reminders-view';
import type { ReminderView } from '../core/lib/todo-filters';
import { animateTodoCardExit, patchTodoCardStatus, type TodoSort, type TodoStatusFilter } from './todo-ui';
import { toast } from './toast';
import { mountWorkflowMenu } from './workflow-menu';
import type { WorkflowStepId } from './workflow-steps';
type View =
  | 'dashboard'
  | 'todos'
  | 'reminders'
  | 'search'
  | 'agenda'
  | 'inbox'
  | 'people'
  | 'teams'
  | 'team'
  | 'projects'
  | 'project'
  | 'person'
  | 'meeting';

function parseTagsInput(raw?: string): string[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw
    .split(/\s+/)
    .map((t) => t.replace(/^#/, '').toLowerCase())
    .filter(Boolean);
}

function parseDueAtInput(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
}

function todoFormToAcceptInput(input: TodoFormInput): AcceptSuggestionInput {
  return {
    text: input.text,
    dueAt: parseDueAtInput(input.dueAt),
    tags: parseTagsInput(input.tags),
    notes: input.notes || undefined,
    categoryId: input.categoryId || undefined,
    teamIds: input.teamId ? [input.teamId] : undefined,
    projectIds: input.projectId ? [input.projectId] : undefined,
    personIds: input.personId ? [input.personId] : undefined,
  };
}

function todoFormToCreateInput(input: TodoFormInput) {
  return {
    text: input.text,
    meetingId: input.meetingId || undefined,
    teamIds: input.teamId ? [input.teamId] : undefined,
    projectIds: input.projectId ? [input.projectId] : undefined,
    personIds: input.personId ? [input.personId] : undefined,
    dueAt: parseDueAtInput(input.dueAt),
    tags: parseTagsInput(input.tags),
    notes: input.notes || undefined,
    categoryId: input.categoryId || undefined,
  };
}

const DEFAULT_TEAMS: Team[] = [
  { id: 'innovacion', name: 'Innovación', color: '#3b82f6' },
  { id: 'milo', name: 'Milø', color: '#8b5cf6' },
];

function contactsWithEmail(people: Person[]): Person[] {
  return people.filter((p) => (p.emails?.length ?? 0) > 0);
}

export function bootstrapApp(root: HTMLElement): void {
  const state = {
    view: 'dashboard' as View,
    q: '',
    teamId: '',
    projectId: '',
    personId: '',
    selectedPersonId: '',
    selectedTeamId: '',
    selectedProjectId: '',
    selectedMeetingId: '',
    syncing: false,
    peopleSort: 'name' as PeopleSort,
    peopleQ: '',
    peopleShowAll: false,
    mergeSearchQ: '',
    memberPickerQ: '',
    contactsTab: 'contacts' as 'contacts' | 'prospects',
    todosStatus: 'open' as TodoStatusFilter,
    todosQ: '',
    todosTeamId: '',
    todosProjectId: '',
    todosSort: 'date-desc' as TodoSort,
    todosPage: 1,
    todosSelectMode: false,
    todosSelectedIds: [] as string[],
    todosCreateOpen: false,
    todosEditingId: null as string | null,
    todosAcceptingId: null as string | null,
    remindersView: 'today' as ReminderView,
    remindersQ: '',
    remindersTag: '',
    remindersQuickAdd: '',
  };

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <span class="sidebar-logo">◆</span>
          <div>
            <strong>Cerebro</strong>
            <span class="sidebar-tag">profesional</span>
          </div>
        </div>
        <nav class="sidebar-nav" id="nav">
          <button type="button" data-view="dashboard" class="nav-btn active">
            <span class="nav-icon">⌂</span> Inicio
          </button>
          <button type="button" data-view="todos" class="nav-btn">
            <span class="nav-icon">☑</span> Tareas
            <span id="suggestions-badge" class="nav-badge" hidden></span>
          </button>
          <button type="button" data-view="reminders" class="nav-btn">
            <span class="nav-icon">⏰</span> Recordatorios
          </button>
          <button type="button" data-view="search" class="nav-btn">
            <span class="nav-icon">⌕</span> Búsqueda
          </button>
          <button type="button" data-view="agenda" class="nav-btn">
            <span class="nav-icon">▦</span> Agenda
          </button>
          <button type="button" data-view="inbox" class="nav-btn">
            <span class="nav-icon">◎</span> Bandeja
          </button>
          <button type="button" data-view="people" class="nav-btn">
            <span class="nav-icon">◉</span> Contactos
          </button>
          <button type="button" data-view="teams" class="nav-btn">
            <span class="nav-icon">⬡</span> Equipos
          </button>
          <button type="button" data-view="projects" class="nav-btn">
            <span class="nav-icon">◈</span> Proyectos
          </button>
        </nav>
        <div class="sidebar-foot">
          <span id="status-badge" class="badge"></span>
        </div>
      </aside>
      <div class="app-main">
        <header class="header">
          <div class="header-actions">
            <button type="button" id="btn-actions-menu" class="btn-primary" aria-expanded="false" aria-haspopup="true">
              Acciones ▾
            </button>
          </div>
          <div id="workflow-menu-host" class="workflow-menu-host"></div>
          <div id="sync-progress-wrap" class="sync-progress-wrap" hidden>
            <div class="sync-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100">
              <div id="sync-progress-fill" class="sync-progress-fill"></div>
            </div>
            <span id="sync-progress-label" class="sync-progress-label"></span>
          </div>
        </header>
        <div class="filters" id="filters">
          <input type="search" id="search-input" placeholder="Buscar reuniones, personas, proyectos…" />
          <select id="filter-team"><option value="">Todos los equipos</option></select>
          <select id="filter-project"><option value="">Todos los proyectos</option></select>
          <select id="filter-person"><option value="">Todas las personas</option></select>
        </div>
        <main id="main" class="main"></main>
      </div>
    </div>
  `;

  const main = root.querySelector('#main') as HTMLElement;
  const statusBadge = root.querySelector('#status-badge') as HTMLElement;
  const syncProgressWrap = root.querySelector('#sync-progress-wrap') as HTMLElement;
  const syncProgressFill = root.querySelector('#sync-progress-fill') as HTMLElement;
  const syncProgressLabel = root.querySelector('#sync-progress-label') as HTMLElement;
  let progressPollTimer: ReturnType<typeof setInterval> | undefined;
  const searchInput = root.querySelector('#search-input') as HTMLInputElement;
  const filterTeam = root.querySelector('#filter-team') as HTMLSelectElement;
  const filterProject = root.querySelector('#filter-project') as HTMLSelectElement;
  const filterPerson = root.querySelector('#filter-person') as HTMLSelectElement;
  const filtersBar = root.querySelector('#filters') as HTMLElement;

  searchInput.addEventListener('input', () => {
    state.q = searchInput.value;
    void render();
  });
  filterTeam.addEventListener('change', () => {
    state.teamId = filterTeam.value;
    void render();
  });
  filterProject.addEventListener('change', () => {
    state.projectId = filterProject.value;
    void render();
  });
  filterPerson.addEventListener('change', () => {
    state.personId = filterPerson.value;
    void render();
  });

  root.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateTo((btn as HTMLElement).dataset.view as View);
    });
  });

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const inField =
      active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    if (e.key === '/' && !inField) {
      e.preventDefault();
      searchInput.focus();
    }
  });

const DEFAULT_TEAMS_SEEDED_KEY = 'cerebro-profesional-default-teams-seeded';

  async function ensureTeams(): Promise<Team[]> {
    const existing = await db.teams.toArray();
    if (existing.length > 0) return existing;

    const seeded = localStorage.getItem(DEFAULT_TEAMS_SEEDED_KEY);
    if (seeded) return existing;

    for (const team of DEFAULT_TEAMS) {
      await db.teams.put(team);
    }
    localStorage.setItem(DEFAULT_TEAMS_SEEDED_KEY, '1');
    await persistSnapshotToServer();
    return db.teams.toArray();
  }

  async function refreshFilters(): Promise<void> {
    const teams = await db.teams.toArray();
    const projects = await db.projects.toArray();
    const people = await db.people.orderBy('displayName').toArray();

    fillSelect(filterTeam, teams, state.teamId, 'Todos los equipos');
    fillSelect(filterProject, projects, state.projectId, 'Todos los proyectos');
    fillSelect(filterPerson, people, state.personId, 'Todas las personas');
  }

  function fillSelect(
    el: HTMLSelectElement,
    items: { id: string; name?: string; displayName?: string }[],
    selected: string,
    allLabel: string,
  ): void {
    const label = (i: (typeof items)[number]) => i.displayName ?? i.name ?? i.id;
    el.innerHTML = `<option value="">${allLabel}</option>` +
      items.map((i) => `<option value="${i.id}" ${i.id === selected ? 'selected' : ''}>${escapeHtml(label(i))}</option>`).join('');
  }

  async function fetchJson<T>(
    url: string,
    init?: RequestInit,
    acceptStatuses: number[] = [],
  ): Promise<T> {
    const res = await fetch(url, init);
    const text = await res.text();
    const allowed = res.ok || acceptStatuses.includes(res.status);
    if (!allowed) {
      if (text.startsWith('<')) {
        throw new Error(`${res.status} — API devolvió HTML; reiniciá ./scripts/dev-cerebro-profesional.sh`);
      }
      throw new Error(`${res.status}: ${text.slice(0, 200)}`);
    }
    if (!text.trim()) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('Respuesta no JSON — reiniciá ./scripts/dev-cerebro-profesional.sh');
    }
  }

  async function loadMirrorFiles(): Promise<{ id: string; content: string }[]> {
    const data = await fetchJson<{ files: string[] }>('/api/mirror/list');
    const files: { id: string; content: string }[] = [];
    for (const id of data.files) {
      try {
        const j = await fetchJson<{ content: string }>(`/api/mirror/${encodeURIComponent(id)}`);
        files.push({ id, content: j.content });
      } catch {
        continue;
      }
    }
    return files;
  }

  async function runScan(): Promise<void> {
    state.syncing = true;
    statusBadge.textContent = 'Indexando…';
    try {
      const data = await fetchJson<{ scanned?: number; messages?: string[] }>('/api/scan', {
        method: 'POST',
      });
      statusBadge.textContent = `Índice: ${data.scanned ?? '?'} archivos`;
      toast(data.messages?.[0] ?? 'Scan listo');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error scan');
    } finally {
      state.syncing = false;
    }
  }

  function updateSyncProgressUI(p: {
    phase?: string;
    current?: number;
    total?: number;
    currentTitle?: string;
    done?: boolean;
  }): void {
    const current = p.current ?? 0;
    const total = p.total ?? 0;
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    syncProgressWrap.hidden = false;
    syncProgressFill.style.width = `${p.done ? 100 : pct}%`;
    syncProgressFill.parentElement?.setAttribute('aria-valuenow', String(p.done ? 100 : pct));
    if (p.phase === 'scan' || (total === 0 && !p.done)) {
      syncProgressLabel.textContent = p.currentTitle ?? 'Escaneando…';
    } else if (p.done) {
      syncProgressLabel.textContent = total ? `Completado ${total}/${total}` : 'Completado';
    } else {
      const title = p.currentTitle ? ` — ${p.currentTitle.slice(0, 50)}` : '';
      syncProgressLabel.textContent = `Sincronizando ${current}/${total}${title}`;
    }
    statusBadge.textContent =
      total > 0 && !p.done ? `${current}/${total}` : p.done ? 'Listo' : 'Sincronizando…';
  }

  function stopProgressPoll(): void {
    if (progressPollTimer) {
      clearInterval(progressPollTimer);
      progressPollTimer = undefined;
    }
  }

  async function pollSyncProgress(): Promise<boolean> {
    const p = await fetchJson<{
      phase?: string;
      current?: number;
      total?: number;
      currentTitle?: string;
      done?: boolean;
      running?: boolean;
      result?: { messages?: string[] };
      error?: string;
    }>('/api/sync/progress');
    updateSyncProgressUI(p);
    if (p.done && !p.running) {
      stopProgressPoll();
      syncProgressWrap.hidden = true;
      if (p.result?.messages?.length) toast(p.result.messages[p.result.messages.length - 1] ?? 'Sync listo');
      return true;
    }
    return false;
  }

  async function runSync(): Promise<void> {
    state.syncing = true;
    updateSyncProgressUI({ phase: 'scan', current: 0, total: 0, currentTitle: 'Iniciando sync…' });
    try {
      try {
        await fetchJson<{ started?: boolean }>(
          '/api/sync/run',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          },
          [202, 409],
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.startsWith('409') || msg.includes('sync_already_running')) {
          toast('Ya hay una sincronización en curso');
          await pollSyncProgress();
        } else {
          throw e;
        }
      }

      await waitForSyncComplete();
      toast('Sync terminado — ejecutá el paso 4 (Importar) si no usaste el flujo automático');
      await refreshStatus();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error sync');
      syncProgressWrap.hidden = true;
    } finally {
      state.syncing = false;
      stopProgressPoll();
    }
  }

  async function waitForSyncComplete(): Promise<void> {
    await new Promise<void>((resolve) => {
      progressPollTimer = setInterval(async () => {
        try {
          if (await pollSyncProgress()) resolve();
        } catch {
          /* retry */
        }
      }, 400);
    });
  }

  async function reindexFromMirrorFiles(): Promise<ReindexResult> {
    const teams = await ensureTeams();
    const mirrorFiles = await loadMirrorFiles();
    return reindexFromMirror(mirrorFiles, teams);
  }

  async function runImport(): Promise<void> {
    state.syncing = true;
    statusBadge.textContent = 'Importando…';
    try {
      const idx = await reindexFromMirrorFiles();
      statusBadge.textContent = `${idx.meetings} reuniones · ${idx.people} contactos`;
      await persistSnapshotToServer();
      toast(
        `Importadas ${idx.meetings} reuniones · ${idx.people} contactos · ${idx.prospects} posibles` +
          (idx.mirrorDuplicates ? ` · ${idx.mirrorDuplicates} duplicados omitidos` : '') +
          (idx.pruned ? ` · ${idx.pruned} duplicados eliminados` : '') +
          (idx.linksRepaired ? ` · ${idx.linksRepaired} vínculos reparados` : ''),
      );
      todosSynced = false;
      await resyncExtractedTodos();
      await refreshFilters();
      await render();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al importar');
    } finally {
      state.syncing = false;
    }
  }

  async function runProcessAll(): Promise<void> {
    state.syncing = true;
    statusBadge.textContent = 'Procesando todas…';
    try {
      const stats = await fetchJson<{
        processed?: number;
        skipped?: number;
        errors?: number;
      }>('/api/process-all', { method: 'POST' });
      const snapshot = await loadSnapshotFromServer();
      statusBadge.textContent = 'Reindexando contactos…';
      const idx = await reindexFromMirrorFiles();
      if (snapshot?.meetings?.length) {
        await mergeMeetingAnalysisFromSnapshot(snapshot);
      }
      await persistSnapshotToServer();
      const parts = [`${stats.processed ?? 0} procesadas`, `${idx.meetings} reuniones`];
      if (stats.skipped) parts.push(`${stats.skipped} omitidas`);
      if (stats.errors) parts.push(`${stats.errors} errores`);
      statusBadge.textContent = parts.join(' · ');
      toast(`${parts.join(' · ')} — datos recargados`);
      todosSynced = false;
      await resyncExtractedTodos();
      await refreshFilters();
      await render();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al procesar reuniones');
    } finally {
      state.syncing = false;
      await refreshStatus();
    }
  }

  async function runApplyAnalysis(): Promise<void> {
    state.syncing = true;
    try {
      const inbox = await fetchJson<{ items: import('../core/analysis-import').AnalysisInboxRow[] }>(
        '/api/analysis-inbox/pending',
      );
      if (!inbox.items?.length) {
        toast('No hay análisis pendientes — ejecutá /procesar-reuniones en Cursor (paso 6)');
        return;
      }
      const n = await importAnalysisRows(inbox.items);
      await fetchJson('/api/analysis-inbox/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: inbox.items.map((i) => i.id) }),
      });
      await persistSnapshotToServer();
      toast(`Aplicados ${n} análisis — guardado en disco`);
      await refreshFilters();
      await render();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al aplicar análisis');
    } finally {
      state.syncing = false;
      await refreshStatus();
    }
  }

  async function restoreOrBootstrapData(): Promise<void> {
    const meetingCount = await db.meetings.count();
    const snapshot = await loadSnapshotFromServer();
    const stats = await fetchJson<{ total: number }>('/api/mirror/stats').catch(() => ({
      total: 0,
    }));

    if (meetingCount === 0 && !snapshot?.meetings?.length && stats.total > 0) {
      toast('Importando desde mirror…');
      await runImport();
      await persistSnapshotToServer();
      return;
    }

    const reconciled = await reconcileWithDiskSnapshot();
    if (reconciled === 'restored') {
      const n = await db.meetings.count();
      const p = await db.people.count();
      toast(`Datos restaurados desde disco: ${n} reuniones, ${p} contactos`);
    }

    const linksRepaired = await repairMeetingPersonLinks();
    if (linksRepaired > 0) {
      await persistSnapshotToServer();
    }

    todosSynced = false;
    await resyncExtractedTodos();

    const migrated = await migrateExtractedOpenToSuggested();
    if (migrated > 0) {
      await persistSnapshotToServer();
      toast(`${migrated} to-do(s) de reuniones movidos a Sugerencias para revisar`);
    }
  }

  async function runDismissAllSuggestions(opts?: { silent?: boolean }): Promise<number> {
    const pending = await db.todos.where('status').equals('suggested').count();
    if (pending === 0) return 0;

    if (!opts?.silent) {
      const ok = window.confirm(
        `¿Descartar las ${pending} sugerencias pendientes?\n\nNo se modifican tareas abiertas, hechas ni ya descartadas.`,
      );
      if (!ok) return 0;
    }

    const { dismissed, before } = await dismissAllSuggestions();
    if (dismissed === 0) return 0;

    await persistSnapshotToServer();
    void updateSuggestionsBadge();

    if (!opts?.silent) {
      toast(`${dismissed} sugerencia(s) descartadas`, {
        run: async () => {
          await restoreTodoSnapshotsBulk(before);
          await persistSnapshotToServer();
          void updateSuggestionsBadge();
          toast('Descarte deshecho');
          if (state.view === 'todos') void render();
        },
      });
    }

    if (state.view === 'todos') {
      state.todosSelectedIds = [];
      void render();
    }
    return dismissed;
  }

  async function maybeDismissAllSuggestionsFromUrl(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dismissAllSuggestions') !== '1') return;
    const clean = `${window.location.pathname}${window.location.hash}`;
    history.replaceState({}, '', clean);
    const n = await runDismissAllSuggestions({ silent: true });
    if (n > 0) {
      toast(`${n} sugerencia(s) descartadas y guardadas`);
    }
  }

  async function applyPendingRemindersOnStartup(): Promise<void> {
    try {
      const inbox = await fetchJson<{ items: import('../core/reminders-inbox-import').PendingReminderRow[] }>(
        '/api/reminders-inbox/pending',
      );
      if (!inbox.items?.length) return;
      const n = await importReminderInboxRows(inbox.items);
      if (n === 0) return;
      await fetchJson('/api/reminders-inbox/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: inbox.items.map((i) => i.id) }),
      });
      await persistSnapshotToServer();
      toast(`Importados ${n} recordatorio(s) del chat`);
    } catch {
      /* sin servidor dev o inbox vacío */
    }
  }

  async function applyPendingAnalysisOnStartup(): Promise<void> {
    try {
      const inbox = await fetchJson<{ items: import('../core/analysis-import').AnalysisInboxRow[] }>(
        '/api/analysis-inbox/pending',
      );
      if (!inbox.items?.length) return;
      const n = await importAnalysisRows(inbox.items);
      if (n === 0) return;
      await fetchJson('/api/analysis-inbox/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: inbox.items.map((i) => i.id) }),
      });
      await persistSnapshotToServer();
      toast(`Importados ${n} análisis pendientes`);
    } catch {
      /* sin servidor dev o inbox vacío */
    }
  }

  async function handleWorkflowStep(id: WorkflowStepId): Promise<void> {
    switch (id) {
      case 'index':
        await runScan();
        break;
      case 'sync':
        await runSync();
        break;
      case 'import':
        await runImport();
        break;
      case 'process-all':
        await runProcessAll();
        break;
      case 'apply-analysis':
        await runApplyAnalysis();
        break;
      default:
        break;
    }
  }

  async function getWorkflowStatusLine(): Promise<string> {
    try {
      const s = await fetchJson<{
        mirrorCount: number;
        manifestCount: number;
        hasOAuth: boolean;
      }>('/api/status');
      const stats = await fetchJson<{ total: number; stubs: number; withContent: number }>(
        '/api/mirror/stats',
      );
      const oauth = s.hasOAuth ? 'OAuth ✓' : 'OAuth pendiente (paso 2)';
      const content =
        stats.stubs > 0
          ? `${stats.withContent}/${stats.total} con texto · ${stats.stubs} stubs`
          : `${stats.total} notas en mirror`;
      const indexed =
        s.manifestCount > 0 ? `${s.manifestCount} indexadas (multi-carpeta)` : 'Sin índice — paso 1';
      return `${indexed} · ${content} · ${oauth}`;
    } catch {
      return 'Servidor dev no detectado — ejecutá ./scripts/dev-cerebro-profesional.sh y abrí Acciones.';
    }
  }

  mountWorkflowMenu({
    root,
    isBusy: () => state.syncing,
    getStatusLine: getWorkflowStatusLine,
    onStep: handleWorkflowStep,
    toast,
  });

  async function updateSuggestionsBadge(): Promise<void> {
    const badge = root.querySelector('#suggestions-badge') as HTMLElement | null;
    if (!badge) return;
    const n = await db.todos.where('status').equals('suggested').count();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function updateFiltersBar(): void {
    const hideFilters =
      state.view === 'dashboard' ||
      state.view === 'todos' ||
      state.view === 'reminders' ||
      state.view === 'people' ||
      state.view === 'person' ||
      state.view === 'teams' ||
      state.view === 'team' ||
      state.view === 'projects' ||
      state.view === 'project';
    filtersBar.hidden = hideFilters;
    filtersBar.setAttribute('aria-hidden', hideFilters ? 'true' : 'false');
  }

  let todosSynced = false;

  async function resyncExtractedTodos(): Promise<void> {
    try {
      const res = await fetchJson<{ items: { meetingId: string; text: string; meetingTitle?: string; startedAt?: string }[] }>(
        '/api/dashboard/todos',
      );
      if (res.items?.length) {
        await syncExtractedTodos(res.items);
        await persistSnapshotToServer();
      }
      todosSynced = true;
    } catch {
      /* sin API dev */
    }
  }

  async function ensureDashboardTodos(): Promise<void> {
    if (todosSynced) return;
    await resyncExtractedTodos();
  }

  async function openMeetingDetail(id: string): Promise<void> {
    const m = await db.meetings.get(id);
    if (!m) return;
    let raw = '';
    try {
      const r = await fetchJson<{ content: string }>(`/api/mirror/${encodeURIComponent(id)}`);
      raw = r.content;
    } catch {
      raw = m.bodyPreview ?? '';
    }
    const parsed = parseMirrorMarkdown(raw);
    const [people, prospects] = await Promise.all([
      db.people.toArray(),
      db.prospects.toArray(),
    ]);
    const contactsHtml = renderMeetingContactsSection({
      contacts: buildMeetingContactDisplays(m, people, parsed),
      prospects: toProspectDisplays(meetingProspectsForDisplay(m, prospects)),
    });
    const { metaHtml, tabsHtml, panelsHtml } = buildMeetingDetailView(raw, parsed);
    const participantSummary =
      m.personIds.length > 0
        ? `${m.personIds.length} contacto${m.personIds.length === 1 ? '' : 's'}`
        : m.participants.filter(Boolean).join(', ') || '—';
    main.innerHTML = `
      <button type="button" class="btn-ghost back-btn">← Volver</button>
      <h2>${escapeHtml(m.title)}</h2>
      <p class="meta">${formatDate(m.startedAt)} · ${escapeHtml(participantSummary)}</p>
      ${m.summary ? `<p class="summary">${escapeHtml(m.summary)}</p>` : ''}
      ${contactsHtml}
      ${metaHtml}
      ${tabsHtml}
      ${panelsHtml}
    `;
    main.querySelector('.back-btn')?.addEventListener('click', () => void render());
    bindMeetingContactsSection(main, openPersonProfile);
    main.querySelectorAll('[data-meeting-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.meetingTab ?? '';
        main.querySelectorAll('[data-meeting-tab]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        main.querySelectorAll('[data-meeting-panel]').forEach((panel) => {
          (panel as HTMLElement).hidden =
            (panel as HTMLElement).dataset.meetingPanel !== tab;
        });
      });
    });
  }

  function openPersonProfile(personId: string): void {
    state.selectedPersonId = personId;
    state.view = 'person';
    state.mergeSearchQ = '';
    root.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    root.querySelector('.nav-btn[data-view="people"]')?.classList.add('active');
    void render();
  }

  function setNavActive(view: View): void {
    const navView =
      view === 'person'
        ? 'people'
        : view === 'team'
          ? 'teams'
          : view === 'project'
            ? 'projects'
            : view === 'reminders'
              ? 'reminders'
              : view;
    root.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    root.querySelector(`.nav-btn[data-view="${navView}"]`)?.classList.add('active');
  }

  function navigateTo(view: View, opts?: { todosStatus?: TodoStatusFilter }): void {
    if (opts?.todosStatus) state.todosStatus = opts.todosStatus;
    if (view === 'people' && state.view !== 'person') {
      state.selectedPersonId = '';
      state.mergeSearchQ = '';
    }
    if (view === 'teams') {
      state.selectedTeamId = '';
    }
    if (view === 'projects') {
      state.selectedProjectId = '';
    }
    state.view = view;
    if (view !== 'person') state.mergeSearchQ = '';
    if (view !== 'team' && view !== 'project') state.memberPickerQ = '';
    if (view !== 'teams') state.selectedTeamId = '';
    if (view !== 'projects') state.selectedProjectId = '';
    setNavActive(view);
    void render();
  }

  async function render(): Promise<void> {
    await refreshStatus();
    updateFiltersBar();
    main.classList.toggle(
      'main--todos-wide',
      state.view === 'todos' && (state.todosStatus === 'open' || state.todosStatus === 'suggested'),
    );
    const teams = await ensureTeams();
    const meetings = await db.meetings.toArray();
    const people = await db.people.orderBy('displayName').toArray();
    const prospects = await db.prospects.orderBy('displayName').toArray();
    const contacts = contactsWithEmail(people);
    const projects = await db.projects.toArray();

    let remountTodosView: () => Promise<void> = async () => {};

    const applyTodoUiAfterChange = (id: string, newStatus: import('../core/models').MeetingTodo['status']) => {
      if (state.view === 'todos') {
        const hides = state.todosStatus !== 'all' && state.todosStatus !== newStatus;
        if (hides) {
          animateTodoCardExit(main, id, () => void remountTodosView());
        } else if (state.todosStatus === 'all' && newStatus !== 'done') {
          void remountTodosView();
        } else {
          patchTodoCardStatus(main, id, newStatus);
        }
        return;
      }
      void render();
    };

    const handleAcceptSuggestion = async (id: string) => {
      const before = await db.todos.get(id);
      if (!before) return;
      await acceptSuggestion(id);
      void persistSnapshotToServer();
      void updateSuggestionsBadge();
      toast('Sugerencia aceptada', {
        run: async () => {
          if (before) await restoreTodoSnapshot(before);
          void persistSnapshotToServer();
          void updateSuggestionsBadge();
          toast('Acción deshecha');
          applyTodoUiAfterChange(id, before.status);
        },
      });
      applyTodoUiAfterChange(id, 'open');
    };

    const todoHandlers = {
      onTodoStatus: async (id: string, status: import('../core/models').MeetingTodo['status']) => {
        const before = await db.todos.get(id);
        if (!before) return;
        await setTodoStatus(id, status);
        void persistSnapshotToServer();
        void updateSuggestionsBadge();
        const labels: Record<string, string> = {
          done: 'Marcado como hecho',
          open: 'Reabierto',
          dismissed: 'Descartado',
          suggested: 'Movido a sugerencias',
        };
        toast(labels[status] ?? 'Actualizado', {
          run: async () => {
            await restoreTodoSnapshot(before);
            void persistSnapshotToServer();
            void updateSuggestionsBadge();
            toast('Acción deshecha');
            applyTodoUiAfterChange(id, before.status);
          },
        });
        applyTodoUiAfterChange(id, status);
      },
      onAcceptSuggestion: (id: string) => void handleAcceptSuggestion(id),
      onAcceptSuggestionEdit: (id: string) => {
        if (state.view === 'todos') {
          state.todosAcceptingId = id;
          state.todosEditingId = null;
          void remountTodosView();
        } else {
          state.view = 'todos';
          state.todosStatus = 'suggested';
          state.todosAcceptingId = id;
          setNavActive('todos');
          void render();
        }
      },
      onOpenMeeting: (id: string) => void openMeetingDetail(id),
      onOpenPerson: openPersonProfile,
      onOpenTeam: (id: string) => {
        state.selectedTeamId = id;
        state.view = 'team';
        setNavActive('team');
        void render();
      },
      onOpenProject: (id: string) => {
        state.selectedProjectId = id;
        state.view = 'project';
        setNavActive('project');
        void render();
      },
    };

    if (state.view === 'dashboard') {
      setNavActive('dashboard');
      await ensureDashboardTodos();
      const todos = await db.todos.toArray();
      let meta: DashboardMeta = {
        mirrorCount: 0,
        lastMirrorSync: null,
        storeSavedAt: null,
        syncRunning: false,
      };
      try {
        meta = await fetchJson<DashboardMeta>('/api/dashboard/meta');
      } catch {
        /* offline */
      }
      const dashCtx = {
        meta,
        meetings,
        people,
        teams,
        projects,
        todos,
        contactCount: contacts.length,
        ...todoHandlers,
        onNavigate: (view: string, opts?: { todosStatus?: string }) =>
          navigateTo(view as View, opts?.todosStatus ? { todosStatus: opts.todosStatus as TodoStatusFilter } : undefined),
      };
      main.innerHTML = renderDashboard(dashCtx);
      bindDashboard(main, dashCtx);
      return;
    }

    if (state.view === 'todos') {
      remountTodosView = async () => {
        const scrollY = window.scrollY;
        const searchEl = main.querySelector('#todos-search') as HTMLInputElement | null;
        const hadFocus = document.activeElement === searchEl;
        const selStart = searchEl?.selectionStart ?? null;

        setNavActive('todos');
        await ensureDashboardTodos();
        const todos = await db.todos.toArray();
        const pageOpts = {
          todos,
          meetings,
          people,
          teams,
          projects,
          status: state.todosStatus,
          q: state.todosQ,
          teamId: state.todosTeamId,
          projectId: state.todosProjectId,
          sort: state.todosSort,
          page: state.todosPage,
          selectMode: state.todosSelectMode,
          selectedIds: state.todosSelectedIds,
          createOpen: state.todosCreateOpen,
          editingId: state.todosEditingId,
          acceptingId: state.todosAcceptingId,
        };
        const filtered = filterTodos(todos, {
          status: state.todosStatus,
          q: state.todosQ,
          teamId: state.todosTeamId,
          projectId: state.todosProjectId,
          sort: state.todosSort,
        });
        const visibleIds = filtered.slice(0, state.todosPage * PAGE_SIZE).map((t) => t.id);
        main.innerHTML = renderTodosPage(pageOpts);
        bindTodosPage(
          main,
          {
            page: state.todosPage,
            selectMode: state.todosSelectMode,
            selectedIds: state.todosSelectedIds,
          },
          visibleIds,
          {
            ...todoHandlers,
            onFilterChange: (patch, options) => {
              if (patch.status !== undefined) state.todosStatus = patch.status;
              if (patch.q !== undefined) state.todosQ = patch.q;
              if (patch.teamId !== undefined) state.todosTeamId = patch.teamId;
              if (patch.projectId !== undefined) state.todosProjectId = patch.projectId;
              if (patch.sort !== undefined) state.todosSort = patch.sort;
              if (patch.page !== undefined) state.todosPage = patch.page;
              if (patch.selectMode !== undefined) state.todosSelectMode = patch.selectMode;
              if (patch.selectedIds !== undefined) state.todosSelectedIds = patch.selectedIds;
              if (patch.createOpen !== undefined) state.todosCreateOpen = patch.createOpen;
              if (patch.editingId !== undefined) state.todosEditingId = patch.editingId;
              if (patch.acceptingId !== undefined) state.todosAcceptingId = patch.acceptingId;

              if (options?.patchOnly && patch.selectedIds !== undefined) {
                patchTodosSelectionUi(main, state.todosSelectedIds, state.todosStatus);
                return;
              }
              void remountTodosView();
            },
            onBulkStatus: async (ids, status) => {
              const before = (await Promise.all(ids.map((id) => db.todos.get(id)))).filter(
                (t): t is import('../core/models').MeetingTodo => Boolean(t),
              );
              await setTodosStatusBulk(ids, status);
              void persistSnapshotToServer();
              state.todosSelectedIds = [];
              toast(`${ids.length} to-do(s) actualizados`, {
                run: async () => {
                  for (const snap of before) await restoreTodoSnapshot(snap);
                  void persistSnapshotToServer();
                  toast('Acción deshecha');
                  void remountTodosView();
                },
              });
              void remountTodosView();
            },
            onAcceptSuggestionsBulk: async (ids) => {
              const before = (await Promise.all(ids.map((id) => db.todos.get(id)))).filter(Boolean);
              const n = await acceptSuggestionsBulk(ids);
              void persistSnapshotToServer();
              void updateSuggestionsBadge();
              state.todosSelectedIds = [];
              toast(`${n} sugerencia(s) aceptadas`);
              void remountTodosView();
            },
            onDismissAllSuggestions: () => void runDismissAllSuggestions(),
            onAcceptTodo: async (id, input) => {
              try {
                const before = await db.todos.get(id);
                await acceptSuggestion(id, todoFormToAcceptInput(input));
                await persistSnapshotToServer();
                state.todosAcceptingId = null;
                void updateSuggestionsBadge();
                toast('Sugerencia aceptada', {
                  run: async () => {
                    if (before) await restoreTodoSnapshot(before);
                    void persistSnapshotToServer();
                    void updateSuggestionsBadge();
                    void remountTodosView();
                  },
                });
                void remountTodosView();
              } catch (e) {
                toast(e instanceof Error ? e.message : 'No se pudo aceptar');
              }
            },
            onCreateTodo: async (input) => {
              try {
                const created = await createManualTodo(todoFormToCreateInput(input));
                await persistSnapshotToServer();
                state.todosCreateOpen = false;
                state.todosStatus = 'open';
                toast('To-do creado', {
                  run: async () => {
                    await deleteManualTodo(created.id);
                    void persistSnapshotToServer();
                    toast('Creación deshecha');
                    void remountTodosView();
                  },
                });
                void remountTodosView();
              } catch (e) {
                toast(e instanceof Error ? e.message : 'No se pudo crear');
              }
            },
            onUpdateTodo: async (id, input) => {
              try {
                const before = await db.todos.get(id);
                if (!before) throw new Error('To-do no encontrado');
                await updateManualTodo(id, todoFormToCreateInput(input));
                await persistSnapshotToServer();
                state.todosEditingId = null;
                toast('To-do actualizado', {
                  run: async () => {
                    await restoreTodoSnapshot(before);
                    void persistSnapshotToServer();
                    toast('Edición deshecha');
                    void remountTodosView();
                  },
                });
                void remountTodosView();
              } catch (e) {
                toast(e instanceof Error ? e.message : 'No se pudo guardar');
              }
            },
          },
        );

        window.scrollTo(0, scrollY);
        const qEl = main.querySelector('#todos-search') as HTMLInputElement | null;
        if (qEl && hadFocus) {
          qEl.focus();
          if (selStart != null) qEl.setSelectionRange(selStart, selStart);
        }
      };

      await remountTodosView();
      return;
    }

    if (state.view === 'reminders') {
      setNavActive('reminders');
      const todos = await db.todos.toArray();
      const pageOpts = {
        todos,
        people,
        teams,
        projects,
        view: state.remindersView,
        q: state.remindersQ,
        tag: state.remindersTag,
        quickAdd: state.remindersQuickAdd,
      };
      main.innerHTML = renderRemindersPage(pageOpts);
      bindRemindersPage(main, {
        ...todoHandlers,
        onViewChange: (view) => {
          state.remindersView = view;
          void render();
        },
        onSearchChange: (q) => {
          state.remindersQ = q;
          void render();
        },
        onTagFilter: (tag) => {
          state.remindersTag = tag;
          void render();
        },
        onQuickAdd: async (raw) => {
          try {
            const parsed = parseCapture(raw);
            if (!parsed.title || parsed.title.length < 3) {
              toast('Escribí al menos 3 caracteres');
              return;
            }
            await createManualTodo({
              text: parsed.title,
              dueAt: parsed.dueAt,
              tags: parsed.tags,
              categoryId: parsed.categoryId,
              status: 'open',
            });
            await persistSnapshotToServer();
            state.remindersQuickAdd = '';
            toast('Recordatorio creado');
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'No se pudo crear');
          }
        },
      });
      return;
    }

    if (state.view === 'agenda') {
      const sorted = [...meetings].sort((a, b) =>
        (b.startedAt ?? '').localeCompare(a.startedAt ?? ''),
      );
      const byMonth = new Map<string, Meeting[]>();
      const sinFecha: Meeting[] = [];
      for (const m of sorted) {
        if (!m.startedAt) {
          sinFecha.push(m);
          continue;
        }
        const key = m.startedAt.slice(0, 7);
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key)!.push(m);
      }
      const monthBlocks = [...byMonth.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([ym, list]) => {
          const label = formatMonth(ym);
          return `<section class="agenda-month"><h3>${escapeHtml(label)}</h3><ul class="meeting-list">${list.map((m) => meetingCard(m, people, teams, projects)).join('')}</ul></section>`;
        })
        .join('');
      const noDateBlock =
        sinFecha.length > 0
          ? `<section class="agenda-month"><h3>Sin fecha</h3><ul class="meeting-list">${sinFecha.map((m) => meetingCard(m, people, teams, projects)).join('')}</ul></section>`
          : '';
      main.innerHTML = `
        <p class="meta">${meetings.length} reuniones · vista cronológica</p>
        ${monthBlocks}${noDateBlock}
      `;
      bindMeetingClicks(main, people);
      return;
    }

    if (state.view === 'search' || state.view === 'inbox') {
      const hits = searchMeetings(meetings, people, teams, projects, {
        q: state.q,
        teamId: state.teamId || undefined,
        projectId: state.projectId || undefined,
        personId: state.personId || undefined,
      });
      let list = hits.map((h) => h.meeting);
      if (state.view === 'inbox') {
        list = list.filter((m) => m.analysisStatus === 'pending' || m.analysisStatus === 'needs_review' || !m.summary);
      }
      main.innerHTML = `
        <p class="meta">${list.length} reuniones</p>
        <ul class="meeting-list">${list.map((m) => meetingCard(m, people, teams, projects)).join('')}</ul>
      `;
      bindMeetingClicks(main, people);
      return;
    }

    if (state.view === 'people') {
      const statsList = buildPersonStatsList(contacts, meetings, teams, projects);
      const activeCount = statsList.filter((s) => s.meetingCount > 0).length;
      const baseList = state.peopleShowAll
        ? statsList
        : statsList.filter((s) => s.meetingCount > 0);
      const filtered = filterAndSortPeople(
        baseList,
        '',
        state.teamId,
        state.peopleSort,
      );
      const prospectRows = buildProspectRows(prospects);
      const prospectsPanelHtml = renderProspectsPage({ rows: prospectRows, contacts });
      main.innerHTML = renderContactsPage({
        items: filtered,
        totalPeople: contacts.length,
        activeCount,
        sort: state.peopleSort,
        teamId: state.teamId,
        teams,
        q: state.peopleQ,
        showAll: state.peopleShowAll,
        contactsTab: state.contactsTab,
        prospectCount: prospectRows.length,
        prospectsPanelHtml,
      });
      bindContactsPage(main, {
        onSelect: (id) => {
          if (state.selectedPersonId !== id) state.mergeSearchQ = '';
          state.view = 'person';
          state.selectedPersonId = id;
          void render();
        },
        onSort: (sort) => {
          state.peopleSort = sort;
          void render();
        },
        onTeamChip: (teamId) => {
          state.teamId = teamId;
          filterTeam.value = teamId;
          void render();
        },
        onSearch: (q) => {
          state.peopleQ = q;
        },
        onShowMode: (showAll) => {
          state.peopleShowAll = showAll;
          void render();
        },
        onManageTeams: () => {
          state.view = 'teams';
          root.querySelectorAll('.nav-btn').forEach((b) => {
            b.classList.toggle('active', (b as HTMLElement).dataset.view === 'teams');
          });
          void render();
        },
        onNewPerson: async () => {
          const name = prompt('Nombre del contacto');
          if (!name?.trim()) return;
          const email = prompt('Email (obligatorio)');
          if (!email?.trim()) return;
          try {
            const p = await createPerson(name.trim(), email.trim());
            toast(`Contacto «${p.displayName}» creado`);
            state.view = 'person';
            state.selectedPersonId = p.id;
            state.contactsTab = 'contacts';
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al crear contacto');
          }
        },
        onContactsTab: (tab) => {
          state.contactsTab = tab;
          void render();
        },
      });
      if (state.contactsTab === 'prospects') {
        bindProspectsPage(main, {
          onPromote: async (prospectId, email) => {
            try {
              const person = await promoteProspectToContact(prospectId, email);
              toast(`Contacto «${person.displayName}» creado`);
              state.view = 'person';
              state.selectedPersonId = person.id;
              state.contactsTab = 'contacts';
              await refreshFilters();
              void render();
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error al crear contacto');
            }
          },
          onLink: async (prospectId, personId) => {
            try {
              await linkProspectToContact(prospectId, personId);
              toast('Vinculado al contacto existente');
              await refreshFilters();
              void render();
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error al vincular');
            }
          },
          onMigrateNoEmail: async () => {
            if (
              !confirm(
                '¿Mover todos los contactos sin email a «Posibles contactos»?\n\nTus equipos, proyectos y notas en contactos con email no se tocan.',
              )
            ) {
              return;
            }
            try {
              const { moved } = await migrateContactsWithoutEmailToProspects();
              toast(`${moved} perfiles movidos a posibles contactos`);
              state.contactsTab = 'prospects';
              await refreshFilters();
              void render();
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error al limpiar contactos');
            }
          },
        });
      }
      return;
    }

    if (state.view === 'person' && state.selectedPersonId) {
      const statsList = buildPersonStatsList(people, meetings, teams, projects);
      const stats = statsList.find((s) => s.person.id === state.selectedPersonId);
      if (!stats) {
        state.view = 'people';
        void render();
        return;
      }
      const timeline = meetingsForPerson(stats.person, meetings).sort((a, b) =>
        (b.startedAt ?? '').localeCompare(a.startedAt ?? ''),
      );
      const mergeCandidates = buildMergeCandidates(
        contacts,
        meetings,
        state.selectedPersonId,
        stats.person.displayName,
      );
      main.innerHTML = renderContactProfile({
        stats,
        meetings: timeline,
        allTeams: teams,
        mergeCandidates,
        mergeSearchQ: state.mergeSearchQ,
      });
      bindContactProfile(main, {
        onBack: () => {
          state.view = 'people';
          void render();
        },
        onFilterMeetings: () => {
          state.view = 'search';
          state.personId = state.selectedPersonId;
          state.q = '';
          filterPerson.value = state.selectedPersonId;
          root.querySelectorAll('.nav-btn').forEach((b) => {
            b.classList.toggle('active', (b as HTMLElement).dataset.view === 'search');
          });
          void render();
        },
        onManageTeams: () => {
          state.view = 'teams';
          root.querySelectorAll('.nav-btn').forEach((b) => {
            b.classList.toggle('active', (b as HTMLElement).dataset.view === 'teams');
          });
          void render();
        },
        onSavePersonName: async (name) => {
          try {
            const save = await updatePerson(state.selectedPersonId, { displayName: name });
            toast('Nombre guardado');
            toastAfterSave(save);
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al guardar');
          }
        },
        onTeamAssign: async (teamId, checked) => {
          const person = await db.people.get(state.selectedPersonId);
          if (!person) return;
          const next = checked
            ? [...new Set([...person.teamIds, teamId])]
            : person.teamIds.filter((t) => t !== teamId);
          try {
            const save = await setPersonTeams(state.selectedPersonId, next);
            toast(checked ? 'Asignado al equipo' : 'Quitado del equipo');
            toastAfterSave(save);
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al asignar');
          }
        },
        onMergeSearch: (q) => {
          state.mergeSearchQ = q;
        },
        onMergeContacts: async (mergeIds) => {
          const names = (
            await Promise.all(mergeIds.map((id) => db.people.get(id)))
          )
            .map((p) => p?.displayName)
            .filter(Boolean)
            .join(', ');
          const msg = `¿Unificar en «${stats.person.displayName}»?\n\nSe agrupan: ${names}\n\nSus reuniones se suman acá; esos perfiles se eliminan.`;
          if (!confirm(msg)) return;
          try {
            const result = await mergePersonsIntoCanonical(state.selectedPersonId, mergeIds);
            toast(
              `Unificados ${result.merged} contactos · ${result.meetingsUpdated} reuniones actualizadas`,
            );
            toastAfterSave(result.save);
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al unificar');
          }
        },
      });
      bindMeetingClicks(main, people);
      return;
    }

    if (state.view === 'teams') {
      setNavActive('teams');
      main.innerHTML = renderTeamsListPage({ teams, people: contacts, meetings });
      bindTeamsListPage(main, {
        onAddTeam: async (name) => {
          try {
            const { team, save } = await createTeam(name);
            toast(`Equipo «${name}» creado`);
            toastAfterSave(save);
            await refreshFilters();
            state.selectedTeamId = team.id;
            state.view = 'team';
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al crear equipo');
          }
        },
        onOpenTeam: (id) => {
          state.selectedTeamId = id;
          state.view = 'team';
          void render();
        },
      });
      return;
    }

    if (state.view === 'team') {
      const team = teams.find((t) => t.id === state.selectedTeamId);
      if (!team) {
        state.view = 'teams';
        state.selectedTeamId = '';
        void render();
        return;
      }
      setNavActive('team');
      main.innerHTML = renderTeamDetailPage({
        team,
        people: contacts,
        meetings,
        memberPickerQ: state.memberPickerQ,
      });
      bindTeamDetailPage(main, team.id, {
        onBack: () => {
          state.view = 'teams';
          state.selectedTeamId = '';
          state.memberPickerQ = '';
          void render();
        },
        onSave: async (name, color) => {
          try {
            await updateTeam(team.id, { name, color });
            toast('Equipo actualizado');
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al guardar');
          }
        },
        onDelete: async () => {
          try {
            const save = await deleteTeam(team.id);
            toast('Equipo eliminado');
            toastAfterSave(save);
            if (state.teamId === team.id) state.teamId = '';
            state.view = 'teams';
            state.selectedTeamId = '';
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al eliminar');
          }
        },
        onAddMember: async (personId) => {
          const person = await db.people.get(personId);
          if (!person) return;
          try {
            const save = await setPersonTeams(personId, [...person.teamIds, team.id]);
            toast('Miembro añadido');
            toastAfterSave(save);
            await render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al añadir');
          }
        },
        onRemoveMember: async (personId) => {
          const person = await db.people.get(personId);
          if (!person) return;
          try {
            const save = await setPersonTeams(
              personId,
              person.teamIds.filter((t) => t !== team.id),
            );
            toast('Miembro quitado');
            toastAfterSave(save);
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al quitar');
          }
        },
        onRemoveMembers: async (personIds) => {
          try {
            const { save, updated } = await removePersonsFromTeam(team.id, personIds);
            if (updated === 0) {
              toast('No se pudo quitar — recargá la página e intentá de nuevo');
              return;
            }
            toast(`${updated} miembro${updated === 1 ? '' : 's'} quitado${updated === 1 ? '' : 's'}`);
            toastAfterSave(save);
            await render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al quitar miembros');
          }
        },
        onCreateMember: async (name) => {
          const email = prompt('Email del contacto (obligatorio)');
          if (!email?.trim()) return;
          try {
            await createPerson(name, email.trim(), [team.id]);
            toast(`Contacto «${name}» creado y añadido`);
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al crear contacto');
          }
        },
        onOpenPerson: openPersonProfile,
        onMemberPickerSearch: (q) => {
          state.memberPickerQ = q;
        },
      });
      return;
    }

    if (state.view === 'projects') {
      setNavActive('projects');
      main.innerHTML = renderProjectsListPage({ projects, people: contacts, meetings });
      bindProjectsListPage(main, {
        onAddProject: async (name) => {
          try {
            const project = await createProject(name);
            toast(`Proyecto «${name}» creado`);
            await refreshFilters();
            state.selectedProjectId = project.id;
            state.view = 'project';
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al crear proyecto');
          }
        },
        onOpenProject: (id) => {
          state.selectedProjectId = id;
          state.view = 'project';
          void render();
        },
      });
      return;
    }

    if (state.view === 'project') {
      const project = projects.find((p) => p.id === state.selectedProjectId);
      if (!project) {
        state.view = 'projects';
        state.selectedProjectId = '';
        void render();
        return;
      }
      setNavActive('project');
      main.innerHTML = renderProjectDetailPage({
        project,
        people: contacts,
        meetings,
        memberPickerQ: state.memberPickerQ,
      });
      bindProjectDetailPage(main, project.id, {
        onBack: () => {
          state.view = 'projects';
          state.selectedProjectId = '';
          state.memberPickerQ = '';
          void render();
        },
        onSave: async (name) => {
          try {
            await updateProject(project.id, { name });
            toast('Proyecto actualizado');
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al guardar');
          }
        },
        onDelete: async () => {
          try {
            await deleteProject(project.id);
            toast('Proyecto eliminado');
            if (state.projectId === project.id) state.projectId = '';
            state.view = 'projects';
            state.selectedProjectId = '';
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al eliminar');
          }
        },
        onAddMember: async (personId) => {
          const person = await db.people.get(personId);
          if (!person) return;
          try {
            const save = await setPersonProjects(personId, [...person.projectIds, project.id]);
            toast('Miembro añadido');
            toastAfterSave(save);
            await render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al añadir');
          }
        },
        onRemoveMember: async (personId) => {
          const person = await db.people.get(personId);
          if (!person) return;
          try {
            const save = await setPersonProjects(
              personId,
              person.projectIds.filter((x) => x !== project.id),
            );
            toast('Miembro quitado');
            toastAfterSave(save);
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al quitar');
          }
        },
        onRemoveMembers: async (personIds) => {
          try {
            const { save, updated } = await removePersonsFromProject(project.id, personIds);
            if (updated === 0) {
              toast('No se pudo quitar — recargá la página e intentá de nuevo');
              return;
            }
            toast(`${updated} miembro${updated === 1 ? '' : 's'} quitado${updated === 1 ? '' : 's'}`);
            toastAfterSave(save);
            await render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al quitar miembros');
          }
        },
        onCreateMember: async (name) => {
          const email = prompt('Email del contacto (obligatorio)');
          if (!email?.trim()) return;
          try {
            await createPerson(name, email.trim(), [], [project.id]);
            toast(`Contacto «${name}» creado y añadido`);
            await refreshFilters();
            void render();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error al crear contacto');
          }
        },
        onOpenPerson: openPersonProfile,
        onMemberPickerSearch: (q) => {
          state.memberPickerQ = q;
        },
      });
      return;
    }
  }

  function bindMeetingClicks(container: HTMLElement, _people: Person[]): void {
    container.querySelectorAll('[data-meeting-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.meetingId;
        if (id) void openMeetingDetail(id);
      });
    });
  }

  async function refreshStatus(): Promise<void> {
    if (state.syncing) return;
    try {
      const s = await fetchJson<{ mirrorCount: number; hasOAuth: boolean }>('/api/status');
      const stats = await fetchJson<{ stubs: number; withContent: number }>('/api/mirror/stats');
      const oauth = s.hasOAuth ? 'OAuth ✓' : 'OAuth —';
      statusBadge.textContent = `${stats.withContent}/${s.mirrorCount} texto · ${oauth}`;
      if (stats.stubs > 0 && !s.hasOAuth) {
        statusBadge.title = `${stats.stubs} notas sin contenido — completá el paso 2 (OAuth)`;
      }
    } catch {
      statusBadge.textContent = 'sin conexión API';
    }
  }

  async function syncLocalEditsToDisk(): Promise<void> {
    const [meetingCount, teamCount, projectCount] = await Promise.all([
      db.meetings.count(),
      db.teams.count(),
      db.projects.count(),
    ]);
    if (meetingCount === 0 && teamCount === 0 && projectCount === 0) return;
    await persistSnapshotToServer();
  }

  async function migratePeopleFields(): Promise<void> {
  const people = await db.people.toArray();
  for (const p of people) {
    if (p.projectIds && p.emails) continue;
    await db.people.put({
      ...p,
      projectIds: p.projectIds ?? [],
      emails: p.emails ?? [],
      emailMeta: p.emailMeta ?? {},
    });
  }
  const meetings = await db.meetings.toArray();
  for (const m of meetings) {
    if (m.prospectIds) continue;
    await db.meetings.put({ ...m, prospectIds: [] });
  }
}

  setupAutoPersist();

  void (async () => {
    await restoreOrBootstrapData();
    await ensureTeams();
    await applyPendingAnalysisOnStartup();
    await applyPendingRemindersOnStartup();
    await ensureDashboardTodos();
    await maybeDismissAllSuggestionsFromUrl();
    await migratePeopleFields();
    await syncLocalEditsToDisk();
    await updateSuggestionsBadge();
    await refreshFilters();
    await render();
  })();
}

function meetingCard(m: Meeting, people: Person[], teams: Team[], projects: Project[]): string {
  const date = formatDate(m.startedAt);
  const teamNames = m.teamIds.map((id) => teams.find((t) => t.id === id)?.name).filter(Boolean);
  const projectNames = m.projectIds
    .map((id) => projects.find((p) => p.id === id)?.name)
    .filter(Boolean);
  const status =
    m.analysisStatus === 'analyzed'
      ? '✓'
      : m.analysisStatus === 'needs_review'
        ? '?'
        : '';
  return `
    <li class="meeting-card" data-meeting-id="${m.id}">
      <strong>${escapeHtml(m.title)}</strong>
      <span class="meta">${status ? status + ' ' : ''}${date}${teamNames.length ? ' · ' + teamNames.join(', ') : ''}${projectNames.length ? ' · ' + projectNames.join(', ') : ''}</span>
      ${m.summary ? `<p>${escapeHtml(m.summary.slice(0, 160))}${m.summary.length > 160 ? '…' : ''}</p>` : ''}
    </li>`;
}

function formatMonth(ym: string): string {
  const [y, mo] = ym.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
}

function buildMergeCandidates(
  people: Person[],
  meetings: Meeting[],
  canonicalId: string,
  canonicalName: string,
): MergeCandidate[] {
  const countByPerson = (id: string) =>
    meetings.filter((m) => m.personIds.includes(id)).length;

  return people
    .filter((p) => p.id !== canonicalId)
    .map((person) => ({
      person,
      meetingCount: countByPerson(person.id),
      score: mergeNameSimilarity(canonicalName, person.displayName),
    }))
    .sort((a, b) => b.score - a.score || a.person.displayName.localeCompare(b.person.displayName, 'es'))
    .map(({ person, meetingCount, score }) => ({
      person,
      meetingCount,
      suggested: score >= 60,
    }));
}

function mergeNameSimilarity(canonical: string, other: string): number {
  const na = canonical
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const nb = other
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (na === nb) return 100;
  if (na.includes(nb) || nb.includes(na)) return 85;
  const minLen = Math.min(na.length, nb.length, 4);
  if (minLen >= 3 && na.slice(0, minLen) === nb.slice(0, minLen)) return 60;
  if (minLen >= 2 && na.slice(0, 2) === nb.slice(0, 2)) return 35;
  return 0;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitMdSections(body: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!body.trim()) return map;
  const parts = body.split(/\n(?=##\s)/);
  for (const part of parts) {
    const m = part.match(/^##\s+(.+?)\n([\s\S]*)$/);
    if (m) map.set(m[1].trim(), m[2].trim());
    else if (part.trim() && !part.startsWith('##')) {
      map.set('Contenido', part.trim());
    }
  }
  return map;
}

function buildMeetingDetailView(
  raw: string,
  parsed: ReturnType<typeof parseMirrorMarkdown>,
): { metaHtml: string; tabsHtml: string; panelsHtml: string } {
  const sections = splitMdSections(parsed.body);
  const preferred = ['Resumen', 'Transcripción', 'Detalles', 'Participantes', 'Próximos pasos'];
  const keys = [
    ...preferred.filter((k) => sections.has(k)),
    ...[...sections.keys()].filter((k) => !preferred.includes(k)),
  ];

  let metaHtml = '';
  const contactEmails = new Set(
    parsed.invitees.map((i) => i.email.toLowerCase()),
  );
  const extraShared = parsed.sharedWith.filter((s) => !contactEmails.has(s.email.toLowerCase()));
  const extraMentioned = parsed.mentionedEmails.filter((e) => !contactEmails.has(e));
  if (extraShared.length || extraMentioned.length) {
    const shared = extraShared.map((s) => s.email).join(', ');
    const mentioned = extraMentioned.join(', ');
    metaHtml = `<section class="meeting-meta">
      <h3 class="profile-section-title">Metadatos adicionales</h3>
      ${extraShared.length ? `<p class="meta"><strong>Compartido (Drive):</strong> ${escapeHtml(shared)}</p>` : ''}
      ${extraMentioned.length ? `<p class="meta"><strong>Mencionados:</strong> ${escapeHtml(mentioned)}</p>` : ''}
    </section>`;
  }

  if (keys.length === 0) {
    return {
      metaHtml,
      tabsHtml: '',
      panelsHtml: `<pre class="md-preview">${escapeHtml(parsed.body)}</pre>`,
    };
  }

  if (keys.length === 1) {
    return {
      metaHtml,
      tabsHtml: '',
      panelsHtml: `<pre class="md-preview">${escapeHtml(sections.get(keys[0]!) ?? parsed.body)}</pre>`,
    };
  }

  const tabsHtml = `<div class="meeting-detail-tabs">${keys
    .map(
      (k, i) =>
        `<button type="button" class="nav-btn${i === 0 ? ' active' : ''}" data-meeting-tab="${escapeHtml(k)}">${escapeHtml(k)}</button>`,
    )
    .join('')}</div>`;

  const panelsHtml = keys
    .map(
      (k, i) =>
        `<pre class="md-preview meeting-detail-panel" data-meeting-panel="${escapeHtml(k)}"${i > 0 ? ' hidden' : ''}>${escapeHtml(sections.get(k) ?? '')}</pre>`,
    )
    .join('');

  return { metaHtml, tabsHtml, panelsHtml };
}

function toastAfterSave(result: { via: string; ok?: boolean }): void {
  if (!result.ok) {
    toast('No se pudo guardar — reintentá');
    return;
  }
  if (result.via === 'server') {
    toast('Guardado en disco');
    return;
  }
  if (result.via === 'local') {
    toast('Guardado en este navegador');
  }
}
