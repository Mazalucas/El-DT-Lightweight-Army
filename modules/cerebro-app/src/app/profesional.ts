import { api } from '../lib/api.js';
import type { ApiStatus, CerebroStore, MeetingTodo, Suggestion } from '@shared/types.js';
import { toast, escapeHtml, formatDate, initials } from '../lib/ui.js';
import { navigate, parseRoute, type ProfTab } from '../lib/router.js';
import { badge, button, emptyState, pageHeader, section, skeletonBlock } from '../ui/primitives.js';
import { createProfesionalToolbar, createSyncProgressUi, mountActionsMenu, runPipelineNow } from './actions-menu.js';
import { renderGraphPanel } from './graph-view.js';
import { renderKanbanBoard, type KanbanHandlers } from './kanban-board.js';
import { renderProfesionalDashboard } from './profesional-dashboard.js';

function syncBadge(status: string): 'default' | 'success' | 'warn' | 'danger' {
  if (status === 'synced') return 'success';
  if (status === 'sync_error') return 'danger';
  if (status === 'pending' || status === 'discovered') return 'warn';
  return 'default';
}

function analysisBadge(status: string): 'default' | 'success' | 'warn' | 'accent' {
  if (status === 'analyzed') return 'success';
  if (status === 'pending') return 'warn';
  if (status === 'needs_review') return 'accent';
  return 'default';
}

function formatScheduleHint(status: ApiStatus): string {
  const s = status.syncSchedule;
  if (!s?.enabled) return 'Sync manual';
  const hh = String(s.hour).padStart(2, '0');
  const mm = String(s.minute).padStart(2, '0');
  return `Auto ${hh}:${mm} (${s.timezone})`;
}

function countByStatus(todos: MeetingTodo[], status: MeetingTodo['status']): number {
  return todos.filter((t) => t.status === status).length;
}

export async function renderProfesional(container: HTMLElement): Promise<void> {
  container.replaceChildren(pageHeader('Cerebro profesional', 'Reuniones, contactos y recordatorios.'));
  container.appendChild(skeletonBlock(6));

  let status: ApiStatus;
  let store: CerebroStore;
  let activeTab: ProfTab = parseRoute().profTab ?? 'dashboard';

  try {
    status = await api.syncStatus();
    store = await api.getStore();
  } catch (e) {
    container.replaceChildren(pageHeader('Cerebro profesional'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
    container.appendChild(err);
    return;
  }

  const suggestedCount = countByStatus(store.todos, 'suggested');
  const openCount = countByStatus(store.todos, 'open');
  const analyzedCount = store.meetings.filter((m) => m.analysisStatus === 'analyzed').length;

  const header = pageHeader('Cerebro profesional', 'Centro de comando en la nube.');
  const metrics = document.createElement('div');
  metrics.className = 'inline-metrics';
  metrics.append(
    badge(`${store.meetings.length} reuniones`, 'default'),
    badge(`${store.people.length} contactos`, store.people.length ? 'success' : 'warn'),
    badge(`${suggestedCount} sugerencias`, suggestedCount ? 'accent' : 'default'),
    badge(formatScheduleHint(status), status.syncSchedule?.enabled ? 'accent' : 'default'),
  );
  header.querySelector('.page-header-row')!.appendChild(metrics);
  container.replaceChildren(header);

  if (!status.setupComplete) {
    const banner = document.createElement('div');
    banner.className = 'setup-banner';
    banner.innerHTML = `<p><strong>Configuración incompleta.</strong> Conectá Google, añadí carpetas Meet y API key IA en Ajustes.</p>`;
    banner.appendChild(
      button('Completar configuración', {
        variant: 'secondary',
        onClick: () => {
          location.hash = '#/settings?tab=profesional-setup';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
      }),
    );
    container.appendChild(banner);
  }

  const opsSec = section('Sincronización automática');
  const statusLine = document.createElement('p');
  statusLine.id = 'ops-status';
  statusLine.className = 'muted';
  statusLine.style.minHeight = '1.25rem';
  if (status.syncSchedule?.lastRunAt) {
    statusLine.textContent = `Última sync: ${formatDate(status.syncSchedule.lastRunAt)} — ${status.syncSchedule.lastRunSummary ?? status.syncSchedule.lastRunStatus ?? ''}`;
  } else if (status.hasGoogleIntegration) {
    statusLine.textContent = 'Listo — «Sincronizar ahora» ejecuta sync + contactos + todos + IA.';
  } else {
    statusLine.textContent = 'Conectá Google en Ajustes → Setup.';
  }
  opsSec.body.appendChild(statusLine);

  const progressUi = createSyncProgressUi(opsSec.body);

  const actionsCtx = {
    root: opsSec.body,
    getPendingAnalysis: () => store.meetings.filter((m) => m.analysisStatus === 'pending').length,
    onRefresh: () => void renderProfesional(container),
    setStatus: (msg: string) => {
      statusLine.textContent = msg;
    },
    progressUi,
  };

  mountActionsMenu(actionsCtx);
  opsSec.body.appendChild(
    createProfesionalToolbar(actionsCtx, async () => {
      await runPipelineNow(actionsCtx);
    }),
  );
  container.appendChild(opsSec.el);

  const contentHost = document.createElement('div');
  contentHost.id = 'prof-content';
  container.appendChild(contentHost);

  async function persistStore(): Promise<void> {
    await api.saveStore(store);
  }

  function buildKanbanHandlers(): KanbanHandlers {
    return {
      loadBoard: async () => (await api.getBoard()).board,
      onStore: (s) => {
        store = s;
      },
      moveTodo: async (todoId, status) => (await api.moveTodo(todoId, { status })).store,
      createTodo: (input) => api.createTodo(input),
      updateTodo: (todoId, patch) => api.updateTodo(todoId, patch).then((r) => r.store),
      acceptTodo: async (todoId) => (await api.acceptTodosBatch([todoId])).store,
      dismissTodo: async (todoId) => (await api.dismissTodosBatch([todoId])).store,
      completeTodo: async (todoId) => (await api.completeTodosBatch([todoId])).store,
      reopenTodo: async (todoId) => (await api.reopenTodosBatch([todoId])).store,
      inbox: {
        scope: 'personal',
        dismissSuggestion: async (id) => (await api.dismissSuggestion(id)).store,
        acceptProject: async (id, opts) => (await api.acceptProjectSuggestion(id, opts)).store,
        acceptTeam: async (id) => (await api.acceptTeamSuggestion(id)).store,
        acceptTodo: async (todoId) => (await api.acceptTodosBatch([todoId])).store,
        dismissTodo: async (todoId) => (await api.dismissTodosBatch([todoId])).store,
        mergePeople: async (canonicalId, mergeIds) => (await api.mergePeople(canonicalId, mergeIds)).store,
        promoteProspect: async (prospectId, email, displayName) =>
          (await api.promoteProspect(prospectId, email, displayName)).store,
        linkProspect: async (prospectId, personId) => (await api.linkProspect(prospectId, personId)).store,
        getProspectCandidates: async (prospectId) => (await api.getProspectCandidates(prospectId)).candidates,
        navigateMeeting: (meetingId) => navigate('profesional-meeting', meetingId),
        listProjects: () => store.projects.map((p) => ({ id: p.id, name: p.name })),
        meetings: store.meetings.map((m) => ({ id: m.id, title: m.title, startedAt: m.startedAt })),
        resolveSuggestionMeetings: (s: Suggestion) => {
          if (s.payload.meetingId) return [String(s.payload.meetingId)];
          if (s.payload.prospectId) {
            const prospect = store.prospects.find((p) => p.id === s.payload.prospectId);
            return prospect?.meetingIds ?? [];
          }
          if (s.payload.todoId) {
            const todo = store.todos.find((t) => t.id === s.payload.todoId);
            return todo?.meetingId ? [todo.meetingId] : [];
          }
          return [];
        },
      },
    };
  }

  async function paintTablero(): Promise<void> {
    await renderKanbanBoard(contentHost, buildKanbanHandlers());
  }

  function paintDashboard(): void {
    contentHost.replaceChildren();
    renderProfesionalDashboard(contentHost, {
      store,
      status,
      handlers: {
        onNavigate: (tab) => navigate('profesional', undefined, { profTab: tab }),
        onMeeting: (id) => navigate('profesional-meeting', id),
        onTodoDone: async (t) => {
          t.status = 'done';
          t.updatedAt = new Date().toISOString();
          await persistStore();
          paintDashboard();
        },
        onTodoAccept: async (t) => {
          t.status = 'open';
          t.updatedAt = new Date().toISOString();
          await persistStore();
          paintDashboard();
          toast('Tarea aceptada');
        },
        onTodoDismiss: async (t) => {
          t.status = 'dismissed';
          t.updatedAt = new Date().toISOString();
          await persistStore();
          paintDashboard();
        },
      },
    });
  }

  function paintMeetings(): void {
    const meetSec = section('Reuniones');
    const tbodyId = 'meetings-tbody';
    meetSec.body.innerHTML = `<p class="muted meetings-list-meta" id="meetings-meta"></p><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Título</th><th>Fecha ↓</th><th>Sync</th><th>Análisis</th><th></th></tr></thead><tbody id="${tbodyId}"></tbody></table></div><div class="btn-row" id="meetings-more-row" style="margin-top:var(--space-3)"></div>`;
    const tbody = meetSec.body.querySelector(`#${tbodyId}`)!;
    const meta = meetSec.body.querySelector('#meetings-meta')!;
    const moreRow = meetSec.body.querySelector('#meetings-more-row')!;
    const sorted = [...store.meetings].sort((a, b) => {
      const ta = a.startedAt ? Date.parse(a.startedAt) : a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const tb = b.startedAt ? Date.parse(b.startedAt) : b.updatedAt ? Date.parse(b.updatedAt) : 0;
      if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
      if (Number.isFinite(ta) !== Number.isFinite(tb)) return Number.isFinite(tb) ? 1 : -1;
      return (b.startedAt ?? '').localeCompare(a.startedAt ?? '');
    });
    let visibleLimit = 50;

    function renderMeetingRows(): void {
      const meetings = sorted.slice(0, visibleLimit);
      meta.textContent = `${sorted.length} reuniones · orden: más reciente primero${meetings.length < sorted.length ? ` · mostrando ${meetings.length}` : ''}`;
      moreRow.replaceChildren();
      if (meetings.length < sorted.length) {
        moreRow.appendChild(
          button('Cargar reuniones más antiguas', {
            variant: 'secondary',
            size: 'sm',
            onClick: () => {
              visibleLimit += 50;
              renderMeetingRows();
            },
          }),
        );
      }

      if (meetings.length === 0) {
        meetSec.body.replaceChildren(
          emptyState(
            'Sin reuniones',
            status.setupComplete ? 'Pulsá «Sincronizar ahora».' : 'Completá el setup en Ajustes.',
            button('Sincronizar ahora', {
              variant: 'secondary',
              disabled: !status.setupComplete,
              onClick: () => container.querySelector('#btn-sync-now')?.dispatchEvent(new Event('click')),
            }),
          ),
        );
        return;
      }

      tbody.innerHTML = meetings.map(() => '<tr><td></td><td></td><td></td><td></td><td><div class="btn-row" style="margin:0"></div></td></tr>').join('');
      tbody.querySelectorAll('tr').forEach((row, idx) => {
        const m = meetings[idx]!;
        const cells = row.querySelectorAll('td');
        cells[0].textContent = m.title;
        cells[1].textContent = formatDate(m.startedAt);
        cells[2].appendChild(badge(m.syncStatus, syncBadge(m.syncStatus)));
        cells[3].appendChild(badge(m.analysisStatus, analysisBadge(m.analysisStatus)));
        const actions = cells[4].querySelector('.btn-row')!;
        const viewBtn = button('Ver', { variant: 'secondary', size: 'sm' });
        viewBtn.addEventListener('click', () => navigate('profesional-meeting', m.id));
        const aiBtn = button('IA', { variant: 'ghost', size: 'sm' });
        aiBtn.addEventListener('click', async () => {
          aiBtn.disabled = true;
          try {
            store = (await api.analyzeMeeting(m.id)).store;
            toast('Análisis aplicado');
            void renderProfesional(container);
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Error IA', 'error');
          } finally {
            aiBtn.disabled = false;
          }
        });
        actions.append(viewBtn, aiBtn);
      });
    }

    renderMeetingRows();
    contentHost.replaceChildren(meetSec.el);
  }

  function paintProjects(): void {
    const sec = section(`Proyectos (${store.projects.length})`);
    const addRow = document.createElement('div');
    addRow.className = 'btn-row';
    addRow.style.marginBottom = 'var(--space-3)';
    const input = document.createElement('input');
    input.placeholder = 'Nuevo proyecto…';
    input.className = 'field-input';
    addRow.append(input, button('Añadir', {
      variant: 'secondary',
      size: 'sm',
      onClick: async () => {
        const name = input.value.trim();
        if (!name) return;
        store = (await api.createProject(name)).store;
        input.value = '';
        paintProjects();
      },
    }));
    sec.body.appendChild(addRow);
    const ul = document.createElement('ul');
    ul.className = 'todo-list';
    store.projects.forEach((p) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.innerHTML = `<span>${escapeHtml(p.name)}</span>`;
      li.appendChild(
        button('Eliminar', {
          variant: 'ghost',
          size: 'sm',
          onClick: async () => {
            store = (await api.deleteProject(p.id)).store;
            paintProjects();
          },
        }),
      );
      ul.appendChild(li);
    });
    if (!store.projects.length) ul.innerHTML = '<li class="todo-item muted">Sin proyectos.</li>';
    sec.body.appendChild(ul);
    contentHost.replaceChildren(sec.el);
  }

  function paintTeams(): void {
    const sec = section(`Equipos (${store.teams.length})`);
    const addRow = document.createElement('div');
    addRow.className = 'btn-row';
    addRow.style.marginBottom = 'var(--space-3)';
    const input = document.createElement('input');
    input.placeholder = 'Nuevo equipo…';
    addRow.append(input, button('Añadir', {
      variant: 'secondary',
      size: 'sm',
      onClick: async () => {
        const name = input.value.trim();
        if (!name) return;
        store = (await api.createTeam(name)).store;
        input.value = '';
        paintTeams();
      },
    }));
    sec.body.appendChild(addRow);
    const ul = document.createElement('ul');
    ul.className = 'todo-list';
    store.teams.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.innerHTML = `<span><span class="team-dot" style="background:${escapeHtml(t.color)}"></span> ${escapeHtml(t.name)}</span>`;
      li.appendChild(
        button('Eliminar', {
          variant: 'ghost',
          size: 'sm',
          onClick: async () => {
            store = (await api.deleteTeam(t.id)).store;
            paintTeams();
          },
        }),
      );
      ul.appendChild(li);
    });
    if (!store.teams.length) ul.innerHTML = '<li class="todo-item muted">Sin equipos.</li>';
    sec.body.appendChild(ul);
    contentHost.replaceChildren(sec.el);
  }

  async function paintGraph(centerId?: string): Promise<void> {
    const sec = section('Red de relaciones');
    sec.body.innerHTML = '<p class="muted">Generando grafo…</p>';
    contentHost.replaceChildren(sec.el);

    const loadGraph = async (center?: string): Promise<void> => {
      const { graph } = await api.getGraph({ limit: 120, center, depth: 2 });
      sec.body.replaceChildren(
        renderGraphPanel(graph, (nodeId) => {
          if (nodeId.startsWith('meeting:')) {
            navigate('profesional-meeting', nodeId.slice(8));
            return;
          }
          void loadGraph(nodeId);
        }),
      );
    };

    try {
      await loadGraph(centerId);
    } catch (e) {
      sec.body.innerHTML = `<p class="muted">${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`;
    }
  }

  function paintContacts(): void {
    const sec = section(`Contactos (${store.people.length})`);
    const chips = document.createElement('div');
    chips.className = 'contact-chips';
    if (store.people.length === 0) {
      sec.body.appendChild(emptyState('Sin contactos', 'El pipeline extrae participantes con email al sincronizar.'));
    } else {
      store.people
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
        .forEach((p) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'contact-chip contact-chip--btn';
          const email = p.emails[0] ? ` · ${p.emails[0]}` : '';
          chip.innerHTML = `<span class="contact-avatar">${escapeHtml(initials(p.displayName))}</span>${escapeHtml(p.displayName)}<span class="muted">${escapeHtml(email)}</span>`;
          chip.addEventListener('click', async () => {
            const name = prompt('Nombre', p.displayName);
            if (!name?.trim()) return;
            store = (await api.updatePerson(p.id, { displayName: name.trim() })).store;
            paintContacts();
          });
          chips.appendChild(chip);
        });
      sec.body.appendChild(chips);
      if (store.prospects.length > 0) {
        const sub = document.createElement('p');
        sub.className = 'muted';
        sub.style.marginTop = 'var(--space-4)';
        sub.textContent = `${store.prospects.length} prospectos sin email (solo nombre en notas).`;
        sec.body.appendChild(sub);
      }
    }
    contentHost.replaceChildren(sec.el);
  }

  function paintContent(): void {
    activeTab = parseRoute().profTab ?? 'dashboard';
    switch (activeTab) {
      case 'dashboard':
        paintDashboard();
        break;
      case 'tablero':
      case 'inbox':
      case 'tareas':
        void paintTablero();
        break;
      case 'reuniones':
        paintMeetings();
        break;
      case 'contactos':
        paintContacts();
        break;
      case 'proyectos':
        paintProjects();
        break;
      case 'equipos':
        paintTeams();
        break;
      case 'red':
        void paintGraph();
        break;
    }
  }

  paintContent();
}

export async function renderMeetingDetail(container: HTMLElement, meetingId: string): Promise<void> {
  container.replaceChildren(pageHeader('Reunión', 'Cargando…'));
  container.appendChild(skeletonBlock(4));
  try {
    const [{ content }, store] = await Promise.all([api.meetingContent(meetingId), api.getStore()]);
    const meeting = store.meetings.find((m) => m.id === meetingId);

    container.replaceChildren();
    const back = button('Volver', {
      variant: 'ghost',
      onClick: () => navigate('profesional', undefined, { profTab: 'reuniones' }),
    });
    back.style.marginBottom = 'var(--space-4)';
    container.appendChild(back);

    const participants =
      meeting?.participants?.length ? meeting.participants.join(', ') : `${meeting?.personIds.length ?? 0} contactos vinculados`;

    container.appendChild(
      pageHeader(meeting?.title ?? meetingId, meeting?.summary ?? participants),
    );

    if (meeting?.actionItems?.length) {
      const sec = section('Action items (IA)');
      const ul = document.createElement('ul');
      ul.className = 'todo-list';
      meeting.actionItems.forEach((line) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.textContent = line;
        ul.appendChild(li);
      });
      sec.body.appendChild(ul);
      container.appendChild(sec.el);
    }

    const preview = document.createElement('div');
    preview.className = 'markdown-preview';
    preview.textContent = content.replace(/^---[\s\S]*?---\n/, '').slice(0, 50000);
    container.appendChild(preview);
  } catch (e) {
    container.replaceChildren(pageHeader('Reunión'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = e instanceof Error ? e.message : String(e);
    container.appendChild(err);
  }
}
