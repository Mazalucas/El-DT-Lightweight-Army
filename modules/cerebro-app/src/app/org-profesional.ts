import { api } from '../lib/api.js';
import type { ApiStatus, CerebroStore, Suggestion } from '@shared/types.js';
import { escapeHtml, formatDate, initials, toast } from '../lib/ui.js';
import { navigate, parseRoute, type ProfTab } from '../lib/router.js';
import { button, emptyState, pageHeader, section, skeletonBlock } from '../ui/primitives.js';
import { renderGraphPanel } from './graph-view.js';
import { renderKanbanBoard, type KanbanHandlers } from './kanban-board.js';
import { orgPrivacyNotice } from './org-privacy.js';
import { renderProfesionalDashboard } from './profesional-dashboard.js';

export async function renderOrgProfesional(
  container: HTMLElement,
  orgId: string,
  initialTab: ProfTab = 'dashboard',
): Promise<void> {
  container.replaceChildren(pageHeader('Empresa', 'Cargando…'));
  container.appendChild(skeletonBlock(4));

  let orgName = orgId;
  let store: CerebroStore;
  const activeTab = parseRoute().profTab ?? initialTab;

  try {
    const [orgRes, storeData] = await Promise.all([api.getOrg(orgId), api.getOrgStore(orgId)]);
    orgName = orgRes.org.name;
    store = storeData;
  } catch (e) {
    container.replaceChildren(pageHeader('Empresa'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = e instanceof Error ? e.message : String(e);
    container.appendChild(err);
    return;
  }

  const header = pageHeader(orgName, 'Cerebro compartido de la empresa');
  container.replaceChildren(header);

  container.appendChild(orgPrivacyNotice('compact'));

  const toolbar = document.createElement('div');
  toolbar.className = 'btn-row workspace-toolbar';
  toolbar.append(
    button('← Todas las empresas', { variant: 'ghost', size: 'sm', onClick: () => navigate('empresa') }),
    button('Sync → org', {
      variant: 'secondary',
      size: 'sm',
      onClick: async () => {
        try {
          await api.ingestOrg(orgId);
          store = await api.getOrgStore(orgId);
          toast('Catálogo org actualizado');
          paint();
        } catch (err) {
          toast(err instanceof Error ? err.message : 'Error', 'error');
        }
      },
    }),
  );
  container.appendChild(toolbar);

  const contentHost = document.createElement('div');
  container.appendChild(contentHost);

  function buildKanbanHandlers(): KanbanHandlers {
    return {
      loadBoard: async () => (await api.getOrgBoard(orgId)).board,
      onStore: (s) => {
        store = s;
      },
      moveTodo: async (todoId, status) => (await api.orgMoveTodo(orgId, todoId, { status })).store,
      createTodo: (input) => api.orgCreateTodo(orgId, input),
      updateTodo: (todoId, patch) => api.orgUpdateTodo(orgId, todoId, patch).then((r) => r.store),
      acceptTodo: async (todoId) => (await api.orgAcceptTodosBatch(orgId, [todoId])).store,
      dismissTodo: async (todoId) => (await api.orgDismissTodosBatch(orgId, [todoId])).store,
      completeTodo: async (todoId) => (await api.orgCompleteTodosBatch(orgId, [todoId])).store,
      reopenTodo: async (todoId) => (await api.orgReopenTodosBatch(orgId, [todoId])).store,
      inbox: {
        scope: 'org',
        dismissSuggestion: async (id) => (await api.orgDismissSuggestion(orgId, id)).store,
        acceptProject: async (id, opts) => (await api.orgAcceptProjectSuggestion(orgId, id, opts)).store,
        acceptTeam: async (id) => (await api.orgAcceptTeamSuggestion(orgId, id)).store,
        acceptTodo: async (todoId) => (await api.orgAcceptTodosBatch(orgId, [todoId])).store,
        dismissTodo: async (todoId) => (await api.orgDismissTodosBatch(orgId, [todoId])).store,
        mergePeople: async (canonicalId, mergeIds) =>
          (await api.orgMergePeople(orgId, canonicalId, mergeIds)).store,
        promoteProspect: async (prospectId, email, displayName) =>
          (await api.orgPromoteProspect(orgId, prospectId, email, displayName)).store,
        linkProspect: async (prospectId, personId) =>
          (await api.orgLinkProspect(orgId, prospectId, personId)).store,
        getProspectCandidates: async (prospectId) =>
          (await api.orgGetProspectCandidates(orgId, prospectId)).candidates,
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

  function paintContacts(): void {
    const sec = section(`Contactos (${store.people.length})`);
    const chips = document.createElement('div');
    chips.className = 'contact-chips';
    if (store.people.length === 0) {
      sec.body.appendChild(emptyState('Sin contactos', 'Hacé ingest desde miembros.'));
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
            store = (await api.orgUpdatePerson(orgId, p.id, { displayName: name.trim() })).store;
            paintContacts();
          });
          chips.appendChild(chip);
        });
      sec.body.appendChild(chips);
      if (store.prospects.length > 0) {
        const sub = document.createElement('p');
        sub.className = 'muted';
        sub.style.marginTop = 'var(--space-4)';
        sub.textContent = `${store.prospects.length} prospectos sin email — revisá el inbox para promoverlos.`;
        sec.body.appendChild(sub);
      }
    }
    contentHost.replaceChildren(sec.el);
  }

  function paintMeetings(): void {
    const sec = section('Reuniones');
    const ul = document.createElement('ul');
    ul.className = 'todo-list';
    const meetings = [...store.meetings]
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
      .slice(0, 40);
    if (!meetings.length) {
      sec.body.appendChild(emptyState('Sin reuniones', 'Sync → org después de sincronizar personal.'));
    } else {
      meetings.forEach((m) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.textContent = `${m.title} — ${formatDate(m.startedAt)}`;
        ul.appendChild(li);
      });
      sec.body.appendChild(ul);
    }
    contentHost.replaceChildren(sec.el);
  }

  function paintProjects(): void {
    const sec = section(`Proyectos (${store.projects.length})`);
    const addRow = document.createElement('div');
    addRow.className = 'btn-row';
    addRow.style.marginBottom = 'var(--space-3)';
    const input = document.createElement('input');
    input.placeholder = 'Nuevo proyecto…';
    input.className = 'field-input';
    addRow.append(
      input,
      button('Añadir', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          const name = input.value.trim();
          if (!name) return;
          store = (await api.orgCreateProject(orgId, name)).store;
          input.value = '';
          paintProjects();
        },
      }),
    );
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
            store = (await api.orgDeleteProject(orgId, p.id)).store;
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
    addRow.append(
      input,
      button('Añadir', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          const name = input.value.trim();
          if (!name) return;
          store = (await api.orgCreateTeam(orgId, name)).store;
          input.value = '';
          paintTeams();
        },
      }),
    );
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
            store = (await api.orgDeleteTeam(orgId, t.id)).store;
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

  async function paintGraph(centerId?: string, memberUid?: string): Promise<void> {
    const sec = section('Red org');
    contentHost.replaceChildren(sec.el);

    const filterRow = document.createElement('div');
    filterRow.className = 'graph-org-filters';
    filterRow.innerHTML = '<span class="muted">Miembro:</span>';

    const memberSelect = document.createElement('select');
    memberSelect.className = 'field-input field-input--sm graph-member-select';
    memberSelect.innerHTML = '<option value="">Todos los miembros</option>';

    try {
      const { members } = await api.listOrgMembers(orgId);
      for (const m of members.filter((x) => x.status === 'active')) {
        const opt = document.createElement('option');
        opt.value = m.uid;
        opt.textContent = m.displayName?.trim() || m.email;
        if (m.uid === memberUid) opt.selected = true;
        memberSelect.appendChild(opt);
      }
    } catch {
      /* miembros opcional */
    }

    const graphHost = document.createElement('div');
    graphHost.className = 'graph-host';
    graphHost.innerHTML = '<p class="muted">Cargando…</p>';
    sec.body.append(filterRow, graphHost);
    filterRow.appendChild(memberSelect);

    const loadGraph = async (center?: string, member?: string): Promise<void> => {
      graphHost.innerHTML = '<p class="muted">Cargando…</p>';
      try {
        const { graph } = await api.getOrgGraph(orgId, { limit: 120, center, depth: 2, memberUid: member });
        graphHost.replaceChildren(
          renderGraphPanel(graph, (nodeId) => {
            void loadGraph(nodeId, memberSelect.value || undefined);
          }),
        );
      } catch (e) {
        graphHost.innerHTML = `<p class="muted">${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`;
      }
    };

    memberSelect.addEventListener('change', () => {
      void loadGraph(centerId, memberSelect.value || undefined);
    });

    await loadGraph(centerId, memberUid ?? (memberSelect.value || undefined));
  }

  function paintDashboard(): void {
    contentHost.replaceChildren();
    renderProfesionalDashboard(contentHost, {
      store,
      status: {
        hasFirebaseAuth: true,
        hasGoogleIntegration: true,
        meetingCount: store.meetings.length,
        mirrorCount: 0,
        syncRunning: false,
        llmProviders: [],
        meetSourceCount: 0,
        setupComplete: true,
      } satisfies ApiStatus,
      handlers: {
        onNavigate: (tab) => navigate('org', undefined, { orgId, profTab: tab }),
        onMeeting: (id) => navigate('profesional-meeting', id),
        onTodoAccept: async (t) => {
          store = (await api.orgAcceptTodosBatch(orgId, [t.id])).store;
          paintDashboard();
          toast('Tarea aceptada');
        },
        onTodoDismiss: async (t) => {
          store = (await api.orgDismissTodosBatch(orgId, [t.id])).store;
          paintDashboard();
        },
      },
    });
  }

  function paint(): void {
    const tab = parseRoute().profTab ?? initialTab;
    switch (tab) {
      case 'dashboard':
        paintDashboard();
        break;
      case 'tablero':
      case 'inbox':
      case 'tareas':
        void paintTablero();
        break;
      case 'contactos':
        paintContacts();
        break;
      case 'reuniones':
        paintMeetings();
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
      default:
        paintDashboard();
    }
  }

  paint();
}
