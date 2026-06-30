import type { CerebroStore, Suggestion, SuggestionKind } from '@shared/types.js';
import { escapeHtml, toast } from '../lib/ui.js';
import { badge, button, emptyState } from '../ui/primitives.js';
import { openModal } from '../ui/modal.js';
import type { WorkspaceScope } from './workspace-ui.js';

export interface ProspectCandidate {
  personId: string;
  displayName: string;
  emails: string[];
  score: number;
  sharedMeetings: number;
}

export interface InboxHandlers {
  scope?: WorkspaceScope;
  loadSuggestions: () => Promise<Suggestion[]>;
  onStore: (store: CerebroStore) => void;
  dismissSuggestion: (id: string) => Promise<CerebroStore>;
  acceptProject: (id: string, opts?: { existingProjectId?: string; projectName?: string }) => Promise<CerebroStore>;
  acceptTeam: (id: string) => Promise<CerebroStore>;
  acceptTodo: (todoId: string) => Promise<CerebroStore>;
  dismissTodo: (todoId: string) => Promise<CerebroStore>;
  mergePeople: (canonicalId: string, mergeIds: string[]) => Promise<CerebroStore>;
  promoteProspect: (prospectId: string, email: string, displayName?: string) => Promise<CerebroStore>;
  linkProspect: (prospectId: string, personId: string) => Promise<CerebroStore>;
  getProspectCandidates: (prospectId: string) => Promise<ProspectCandidate[]>;
  navigateMeeting?: (meetingId: string) => void;
  listProjects?: () => { id: string; name: string }[];
  meetings?: { id: string; title: string; startedAt?: string }[];
  resolveSuggestionMeetings?: (s: Suggestion) => string[];
  onActionComplete?: () => void;
}

function refreshInbox(host: HTMLElement, handlers: InboxHandlers): void {
  if (handlers.onActionComplete) {
    handlers.onActionComplete();
    return;
  }
  void renderInboxPanel(host, handlers);
}

type InboxFilter = 'all' | SuggestionKind;

const INBOX_PAGE_SIZE = 10;

const KIND_ORDER: SuggestionKind[] = [
  'promote_prospect',
  'link_prospect',
  'reassign_team_email',
  'assign_project',
  'assign_team',
  'accept_todo',
  'merge_contacts',
  'review_meeting',
];

function kindLabel(kind: Suggestion['kind']): string {
  const map: Record<Suggestion['kind'], string> = {
    promote_prospect: 'Contacto',
    link_prospect: 'Contacto',
    assign_project: 'Proyecto',
    assign_team: 'Equipo',
    accept_todo: 'Tarea',
    merge_contacts: 'Unificar',
    reassign_team_email: 'Email equipo',
    review_meeting: 'Revisar',
  };
  return map[kind] ?? kind;
}

function kindBadgeTone(kind: Suggestion['kind']): 'accent' | 'success' | 'warn' | 'default' {
  const map: Record<Suggestion['kind'], 'accent' | 'success' | 'warn' | 'default'> = {
    promote_prospect: 'accent',
    link_prospect: 'accent',
    assign_project: 'success',
    assign_team: 'warn',
    accept_todo: 'default',
    merge_contacts: 'default',
    reassign_team_email: 'warn',
    review_meeting: 'accent',
  };
  return map[kind] ?? 'default';
}

function kindFilterLabel(filter: InboxFilter): string {
  if (filter === 'all') return 'Todas';
  return kindLabel(filter);
}

function isPersistentSuggestionId(id: string): boolean {
  return id.startsWith('ps-');
}

function openLinkProspectModal(
  s: Suggestion,
  prospectId: string,
  handlers: InboxHandlers,
  host: HTMLElement,
): void {
  const body = document.createElement('div');
  body.innerHTML = `<p class="muted">Elegí un contacto existente para <strong>${escapeHtml(s.title)}</strong>.</p>`;
  const list = document.createElement('ul');
  list.className = 'picker-list';
  body.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'btn-row';
  let closeModal: (() => void) | null = null;

  void handlers.getProspectCandidates(prospectId).then((candidates) => {
    if (!candidates.length) {
      list.innerHTML = '<li class="picker-empty muted">Sin candidatos por nombre o reuniones compartidas.</li>';
      return;
    }
    candidates.forEach((c) => {
      const li = document.createElement('li');
      li.className = 'picker-item';
      li.innerHTML = `<span><strong>${escapeHtml(c.displayName)}</strong>${c.emails[0] ? `<span class="muted"> · ${escapeHtml(c.emails[0])}</span>` : ''}</span><span class="muted">${c.sharedMeetings} reuniones</span>`;
      li.appendChild(
        button('Vincular', {
          variant: 'secondary',
          size: 'sm',
          onClick: async () => {
            handlers.onStore(await handlers.linkProspect(prospectId, c.personId));
            toast('Contacto vinculado');
            closeModal?.();
            refreshInbox(host, handlers);
          },
        }),
      );
      list.appendChild(li);
    });
  });

  closeModal = openModal({ title: 'Vincular contacto', body, footer });
}

function openCreateContactModal(
  s: Suggestion,
  prospectId: string,
  handlers: InboxHandlers,
  host: HTMLElement,
): void {
  const body = document.createElement('div');
  body.innerHTML = `<p class="muted">Creá contacto para <strong>${escapeHtml(s.title)}</strong> con email.</p>`;
  const input = document.createElement('input');
  input.type = 'email';
  input.className = 'field-input';
  input.placeholder = 'email@empresa.com';
  input.style.width = '100%';
  body.appendChild(input);

  const footer = document.createElement('div');
  footer.className = 'btn-row';
  const closeModal = openModal({
    title: 'Crear contacto',
    body,
    footer,
  });

  footer.append(
    button('Cancelar', { variant: 'ghost', onClick: () => closeModal() }),
    button('Crear', {
      variant: 'primary',
      onClick: async () => {
        const email = input.value.trim();
        if (!email.includes('@')) {
          toast('Email inválido', 'error');
          return;
        }
        handlers.onStore(await handlers.promoteProspect(prospectId, email));
        toast('Contacto creado');
        closeModal();
        void renderInboxPanel(host, handlers);
      },
    }),
  );
}

function openLinkProjectModal(
  s: Suggestion,
  projects: { id: string; name: string }[],
  handlers: InboxHandlers,
  host: HTMLElement,
): void {
  const body = document.createElement('div');
  body.innerHTML = `<p class="muted">Vincular sugerencia a un proyecto existente.</p>`;
  const list = document.createElement('ul');
  list.className = 'picker-list';
  projects.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'picker-item';
    li.innerHTML = `<span>${escapeHtml(p.name)}</span>`;
    li.appendChild(
      button('Elegir', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.acceptProject(s.id, { existingProjectId: p.id }));
          toast('Proyecto vinculado');
          closeModal();
          refreshInbox(host, handlers);
        },
      }),
    );
    list.appendChild(li);
  });
  body.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'btn-row';
  const closeModal = openModal({ title: `Proyecto: ${s.title}`, body, footer });
  footer.append(button('Cerrar', { variant: 'ghost', onClick: () => closeModal() }));
}

export function renderSuggestionCard(
  s: Suggestion,
  handlers: InboxHandlers,
  host: HTMLElement,
  opts?: { layout?: 'feed' | 'kanban' },
): HTMLLIElement {
  const layout = opts?.layout ?? 'feed';
  const li = document.createElement('li');
  li.className =
    layout === 'kanban'
      ? 'kanban-card kanban-card--suggestion'
      : 'inbox-feed-item todo-item todo-item--suggested inbox-item';
  li.dataset.kind = s.kind;

  if (layout === 'kanban') {
    const head = document.createElement('div');
    head.className = 'kanban-card-head';
    head.appendChild(badge(kindLabel(s.kind), kindBadgeTone(s.kind)));
    li.appendChild(head);

    const title = document.createElement('p');
    title.className = 'kanban-card-title';
    title.textContent = s.title;
    li.appendChild(title);

    if (s.detail) {
      const detail = document.createElement('p');
      detail.className = 'muted kanban-suggestion-detail';
      detail.textContent = s.detail;
      li.appendChild(detail);
    }
  } else {
    const head = document.createElement('div');
    head.className = 'inbox-item-head';
    head.innerHTML = `<span class="inbox-kind inbox-kind--${s.kind}">${escapeHtml(kindLabel(s.kind))}</span><div class="inbox-item-text"><strong>${escapeHtml(s.title)}</strong>${s.detail ? `<span class="muted inbox-detail">${escapeHtml(s.detail)}</span>` : ''}</div>`;
    li.appendChild(head);
  }

  const actions = document.createElement('div');
  actions.className = layout === 'kanban' ? 'kanban-card-actions' : 'todo-actions';

  if (s.kind === 'accept_todo' && s.payload.todoId) {
    const todoId = String(s.payload.todoId);
    actions.append(
      button('Aceptar', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.acceptTodo(todoId));
          toast('Tarea aceptada');
          refreshInbox(host, handlers);
        },
      }),
      button('Descartar', {
        variant: 'ghost',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.dismissTodo(todoId));
          refreshInbox(host, handlers);
        },
      }),
    );
  }

  if (s.kind === 'assign_project' && !String(s.id).startsWith('todo-')) {
    actions.append(
      button('Aceptar', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.acceptProject(s.id, { projectName: String(s.payload.projectName ?? s.title) }));
          toast('Proyecto aceptado');
          refreshInbox(host, handlers);
        },
      }),
    );
    if (handlers.listProjects) {
      const projects = handlers.listProjects();
      if (projects.length) {
        actions.append(
          button('Vincular…', {
            variant: 'ghost',
            size: 'sm',
            onClick: () => openLinkProjectModal(s, projects, handlers, host),
          }),
        );
      }
    }
    if (isPersistentSuggestionId(s.id)) {
      actions.append(
        button('Descartar', {
          variant: 'ghost',
          size: 'sm',
          onClick: async () => {
            handlers.onStore(await handlers.dismissSuggestion(s.id));
            refreshInbox(host, handlers);
          },
        }),
      );
    }
  }

  if (s.kind === 'assign_team') {
    actions.append(
      button('Aceptar', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.acceptTeam(s.id));
          toast('Equipo asignado');
          refreshInbox(host, handlers);
        },
      }),
      button('Descartar', {
        variant: 'ghost',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.dismissSuggestion(s.id));
          refreshInbox(host, handlers);
        },
      }),
    );
  }

  if ((s.kind === 'promote_prospect' || s.kind === 'link_prospect') && s.payload.prospectId) {
    const prospectId = String(s.payload.prospectId);
    actions.append(
      button('Vincular…', {
        variant: 'secondary',
        size: 'sm',
        onClick: () => openLinkProspectModal(s, prospectId, handlers, host),
      }),
      button('Crear…', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => openCreateContactModal(s, prospectId, handlers, host),
      }),
    );
    if (isPersistentSuggestionId(s.id)) {
      actions.append(
        button('Descartar', {
          variant: 'ghost',
          size: 'sm',
          onClick: async () => {
            handlers.onStore(await handlers.dismissSuggestion(s.id));
            refreshInbox(host, handlers);
          },
        }),
      );
    }
  }

  if (s.kind === 'merge_contacts' && Array.isArray(s.payload.personIds)) {
    const ids = s.payload.personIds as string[];
    actions.append(
      button('Unificar', {
        variant: 'secondary',
        size: 'sm',
        onClick: async () => {
          handlers.onStore(await handlers.mergePeople(ids[0]!, ids.slice(1)));
          toast('Contactos unificados');
          refreshInbox(host, handlers);
        },
      }),
    );
  }

  if (s.kind === 'review_meeting' && s.payload.meetingId && handlers.navigateMeeting) {
    actions.append(
      button('Ver reunión', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => handlers.navigateMeeting!(String(s.payload.meetingId)),
      }),
    );
  }

  if (actions.childElementCount) li.appendChild(actions);
  return li;
}

function countByKind(suggestions: Suggestion[]): Map<SuggestionKind, number> {
  const map = new Map<SuggestionKind, number>();
  for (const s of suggestions) {
    map.set(s.kind, (map.get(s.kind) ?? 0) + 1);
  }
  return map;
}

function sortSuggestions(items: Suggestion[]): Suggestion[] {
  const kindRank = new Map(KIND_ORDER.map((k, i) => [k, i]));
  return [...items].sort((a, b) => {
    const ka = kindRank.get(a.kind) ?? 99;
    const kb = kindRank.get(b.kind) ?? 99;
    if (ka !== kb) return ka - kb;
    return a.title.localeCompare(b.title, 'es');
  });
}

function collapseProspectDuplicates(items: Suggestion[]): Suggestion[] {
  const prospectKinds = new Set<SuggestionKind>(['promote_prospect', 'link_prospect']);
  const seen = new Map<string, Suggestion>();
  const rest: Suggestion[] = [];

  for (const s of items) {
    if (!prospectKinds.has(s.kind)) {
      rest.push(s);
      continue;
    }
    const key = s.title.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }

  return sortSuggestions([...seen.values(), ...rest]);
}

export async function renderInboxPanel(host: HTMLElement, handlers: InboxHandlers): Promise<void> {
  const scope = handlers.scope ?? 'personal';
  host.innerHTML = '<p class="muted">Cargando sugerencias…</p>';

  let suggestions: Suggestion[];
  try {
    suggestions = await handlers.loadSuggestions();
  } catch (e) {
    host.innerHTML = `<p class="muted">Error: ${escapeHtml(e instanceof Error ? e.message : String(e))}</p>`;
    return;
  }

  host.replaceChildren();

  if (!suggestions.length) {
    host.appendChild(
      emptyState(
        'Inbox vacío',
        scope === 'personal'
          ? 'Sincronizá tu cerebro personal para generar sugerencias.'
          : 'Pedí a los miembros que sincronicen y luego «Sync → org».',
      ),
    );
    return;
  }

  const collapsed = collapseProspectDuplicates(suggestions);
  let activeFilter: InboxFilter = 'all';
  let visibleLimit = INBOX_PAGE_SIZE;

  const header = document.createElement('div');
  header.className = 'inbox-header';

  const filters = document.createElement('div');
  filters.className = 'inbox-filters inbox-filters--compact';

  const listHost = document.createElement('ul');
  listHost.className = 'inbox-feed';

  const footer = document.createElement('div');
  footer.className = 'inbox-footer';

  function filteredSuggestions(): Suggestion[] {
    if (activeFilter === 'all') return collapsed;
    return collapsed.filter((s) => s.kind === activeFilter);
  }

  function renderHeader(): void {
    const total = filteredSuggestions().length;
    header.innerHTML = `
      <h2 class="inbox-title">${total} ${total === 1 ? 'pendiente' : 'pendientes'}</h2>
      <p class="muted inbox-subtitle">Confirmá contactos, proyectos y tareas detectadas por el pipeline.</p>
    `;
  }

  function renderFilters(): void {
    const counts = countByKind(collapsed);
    const kindsPresent = KIND_ORDER.filter((k) => counts.has(k));

    filters.replaceChildren();
    if (kindsPresent.length <= 1) {
      filters.hidden = true;
      return;
    }
    filters.hidden = false;

    filters.appendChild(
      button('Todas', {
        variant: activeFilter === 'all' ? 'primary' : 'ghost',
        size: 'sm',
        onClick: () => {
          activeFilter = 'all';
          visibleLimit = INBOX_PAGE_SIZE;
          renderFilters();
          renderList();
          renderHeader();
        },
      }),
    );

    for (const kind of kindsPresent) {
      filters.appendChild(
        button(kindFilterLabel(kind), {
          variant: activeFilter === kind ? 'primary' : 'ghost',
          size: 'sm',
          onClick: () => {
            activeFilter = kind;
            visibleLimit = INBOX_PAGE_SIZE;
            renderFilters();
            renderList();
            renderHeader();
          },
        }),
      );
    }
  }

  function renderList(): void {
    const filtered = filteredSuggestions();
    const page = filtered.slice(0, visibleLimit);
    listHost.replaceChildren();

    if (!page.length) {
      const empty = document.createElement('li');
      empty.className = 'inbox-feed-empty muted';
      empty.textContent = 'Nada en esta categoría.';
      listHost.appendChild(empty);
      footer.replaceChildren();
      return;
    }

    page.forEach((s) => listHost.appendChild(renderSuggestionCard(s, handlers, host)));

    footer.replaceChildren();
    const remaining = filtered.length - page.length;
    if (remaining > 0) {
      footer.appendChild(
        button(`Mostrar ${Math.min(remaining, INBOX_PAGE_SIZE)} más (${remaining} restantes)`, {
          variant: 'secondary',
          onClick: () => {
            visibleLimit += INBOX_PAGE_SIZE;
            renderList();
          },
        }),
      );
    }
  }

  renderHeader();
  renderFilters();
  renderList();

  host.append(header, filters, listHost, footer);
}
