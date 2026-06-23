import type { Meeting, Person, Project, Team } from '../core/models';
import { meetingsForPerson } from '../core/meeting-participation';

export type PeopleSort = 'name' | 'meetings' | 'recent';

export interface PersonStats {
  person: Person;
  meetingCount: number;
  lastMeetingAt?: string;
  projectNames: string[];
  teams: { id: string; name: string; color: string }[];
}

export function buildPersonStatsList(
  people: Person[],
  meetings: Meeting[],
  teams: Team[],
  projects: Project[],
): PersonStats[] {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  return people.map((person) => {
    const related = meetingsForPerson(person, meetings);
    const projectIds = new Set<string>(person.projectIds ?? []);
    for (const m of related) {
      for (const pid of m.projectIds) projectIds.add(pid);
    }
    const lastMeetingAt = related
      .map((m) => m.startedAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] as string | undefined;

    return {
      person,
      meetingCount: related.length,
      lastMeetingAt,
      projectNames: [...projectIds]
        .map((id) => projectsById.get(id)?.name)
        .filter((n): n is string => Boolean(n))
        .slice(0, 3),
      teams: person.teamIds
        .map((id) => teamsById.get(id))
        .filter((t): t is Team => Boolean(t))
        .map((t) => ({ id: t.id, name: t.name, color: t.color })),
    };
  });
}

export function filterAndSortPeople(
  items: PersonStats[],
  q: string,
  teamId: string,
  sort: PeopleSort,
): PersonStats[] {
  const needle = q.trim().toLowerCase();
  let list = items.filter((s) => {
    if (teamId && !s.person.teamIds.includes(teamId)) return false;
    if (!needle) return true;
    const hay = [
      s.person.displayName,
      ...s.person.aliases,
      ...(s.person.emails ?? []),
      ...s.projectNames,
      ...s.teams.map((t) => t.name),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  });

  list = [...list].sort((a, b) => {
    if (sort === 'meetings') return b.meetingCount - a.meetingCount;
    if (sort === 'recent') {
      return (b.lastMeetingAt ?? '').localeCompare(a.lastMeetingAt ?? '');
    }
    return a.person.displayName.localeCompare(b.person.displayName, 'es');
  });

  return list;
}

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export function renderContactsPage(opts: {
  items: PersonStats[];
  totalPeople: number;
  activeCount: number;
  sort: PeopleSort;
  teamId: string;
  teams: Team[];
  q: string;
  showAll: boolean;
  contactsTab: 'contacts' | 'prospects';
  prospectCount: number;
  prospectsPanelHtml?: string;
}): string {
  const {
    items,
    totalPeople,
    activeCount,
    sort,
    teamId,
    teams,
    q,
    showAll,
    contactsTab,
    prospectCount,
    prospectsPanelHtml = '',
  } = opts;
  const withMeetings = items.filter((i) => i.meetingCount > 0).length;

  const teamChips = teams
    .map(
      (t) => `
    <button type="button" class="chip ${teamId === t.id ? 'chip-active' : ''}" data-team-chip="${t.id}" style="--chip-color:${t.color}">
      ${escapeHtml(t.name)}
    </button>`,
    )
    .join('');

  const cards =
    items.length === 0
      ? `<div class="contacts-empty">
          <p class="contacts-empty-title">Sin resultados</p>
          <p class="meta">Probá otro nombre o quitá el filtro de equipo.</p>
        </div>`
      : `<div class="contacts-grid" id="contacts-grid">${items.map((s) => contactCardHtml(s)).join('')}</div>`;

  return `
    <div class="contacts-page">
      <div class="contacts-hero">
        <div>
          <h2 class="contacts-title">Personas</h2>
          <p class="contacts-subtitle">${activeCount} contactos con reuniones · ${prospectCount} posibles sin email</p>
        </div>
      </div>
      <div class="contacts-tabs" role="tablist">
        <button type="button" class="contacts-tab ${contactsTab === 'contacts' ? 'contacts-tab-active' : ''}" data-contacts-tab="contacts">Contactos (con email)</button>
        <button type="button" class="contacts-tab ${contactsTab === 'prospects' ? 'contacts-tab-active' : ''}" data-contacts-tab="prospects">Posibles (${prospectCount})</button>
      </div>
      ${
        contactsTab === 'prospects'
          ? prospectsPanelHtml
          : `
      <div class="contacts-toolbar">
        <input type="search" class="contacts-search" id="contacts-search" placeholder="Buscar por nombre, email, proyecto…" value="${escapeHtml(q)}" autocomplete="off" spellcheck="false" />
        <select class="contacts-sort" id="contacts-sort" aria-label="Ordenar contactos">
          <option value="name" ${sort === 'name' ? 'selected' : ''}>Nombre A–Z</option>
          <option value="meetings" ${sort === 'meetings' ? 'selected' : ''}>Más reuniones</option>
          <option value="recent" ${sort === 'recent' ? 'selected' : ''}>Actividad reciente</option>
        </select>
        <button type="button" class="btn-ghost btn-sm" data-action="manage-teams">Equipos</button>
        <button type="button" class="btn-primary btn-sm" data-action="new-person">+ Contacto</button>
      </div>
      <p class="contacts-filter-count meta" id="contacts-filter-count" aria-live="polite"></p>
      <div class="contacts-chips" role="group" aria-label="Filtros">
        <button type="button" class="chip ${!showAll ? 'chip-active' : ''}" data-show-mode="active">Con reuniones</button>
        <button type="button" class="chip ${showAll ? 'chip-active' : ''}" data-show-mode="all">Todos (${totalPeople})</button>
        <span class="contacts-chips-sep" aria-hidden="true"></span>
        <button type="button" class="chip ${!teamId ? 'chip-active' : ''}" data-team-chip="">Equipos</button>
        ${teamChips}
      </div>
      ${cards}`
      }
    </div>`;
}

function contactSearchBlob(s: PersonStats): string {
  return normalizeSearchText(
    [
      s.person.displayName,
      ...s.person.aliases,
      ...s.projectNames,
      ...s.teams.map((t) => t.name),
    ].join(' '),
  );
}

function contactCardHtml(s: PersonStats): string {
  const { person, meetingCount, lastMeetingAt, projectNames, teams } = s;
  const searchText = contactSearchBlob(s);
  const hue = avatarHue(person.id);
  const lastLabel = lastMeetingAt ? formatShortDate(lastMeetingAt) : 'Sin reuniones';
  const teamPills = teams
    .map((t) => `<span class="pill" style="--pill-color:${t.color}">${escapeHtml(t.name)}</span>`)
    .join('');
  const projectLine =
    projectNames.length > 0
      ? `<span class="contact-card-projects">${escapeHtml(projectNames.join(' · '))}</span>`
      : '';

  return `
    <article class="contact-card" data-person-id="${person.id}" data-search-text="${searchText.replace(/"/g, '')}" tabindex="0" role="button" aria-label="${escapeHtml(person.displayName)}, ${meetingCount} reuniones">
      <div class="contact-card-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(person.displayName))}</div>
      <div class="contact-card-body">
        <h3 class="contact-card-name">${escapeHtml(person.displayName)}</h3>
        <p class="contact-card-meta">
          <span class="contact-card-stat"><strong>${meetingCount}</strong> reuniones</span>
          <span class="contact-card-dot">·</span>
          <span>${escapeHtml(lastLabel)}</span>
        </p>
        ${teamPills ? `<div class="contact-card-pills">${teamPills}</div>` : ''}
        ${projectLine}
      </div>
      <span class="contact-card-chevron" aria-hidden="true">›</span>
    </article>`;
}

export interface MergeCandidate {
  person: Person;
  meetingCount: number;
  suggested?: boolean;
}

export function renderContactProfile(opts: {
  stats: PersonStats;
  meetings: Meeting[];
  allTeams: Team[];
  mergeCandidates: MergeCandidate[];
  mergeSearchQ?: string;
}): string {
  const { stats, meetings, allTeams, mergeCandidates, mergeSearchQ = '' } = opts;
  const { person, meetingCount, lastMeetingAt, projectNames, teams: personTeams } = stats;
  const hue = avatarHue(person.id);
  const accent = personTeams[0]?.color ?? `hsl(${hue} 55% 45%)`;

  const teamPills = personTeams
    .map((t) => `<span class="pill pill-lg" style="--pill-color:${t.color}">${escapeHtml(t.name)}</span>`)
    .join('');

  const aliasLine =
    person.aliases.length > 0
      ? `<p class="profile-aliases">También: ${person.aliases.map(escapeHtml).join(', ')}</p>`
      : '';

  const projectPills = projectNames
    .map((n) => `<span class="pill pill-outline">${escapeHtml(n)}</span>`)
    .join('');

  const byMonth = groupMeetingsByMonth(meetings);
  const timelineHtml =
    byMonth.length > 0
      ? byMonth
          .map(
            ([label, cards]) => `
        <section class="profile-timeline-group">
          <h4 class="profile-timeline-month">${escapeHtml(label)}</h4>
          <ul class="meeting-list">${cards}</ul>
        </section>`,
          )
          .join('')
      : `<p class="meta profile-empty-timeline">No hay reuniones vinculadas a este contacto.</p>`;

  const teamChecks =
    allTeams.length === 0
      ? `<p class="meta">Creá equipos en <button type="button" class="link-inline" data-action="manage-teams">Equipos</button>.</p>`
      : `<div class="team-checkboxes">${allTeams
          .map((t) => {
            const checked = person.teamIds.includes(t.id);
            return `
          <label class="team-check">
            <input type="checkbox" data-team-assign="${t.id}" ${checked ? 'checked' : ''} />
            <span class="team-check-dot" style="background:${t.color}"></span>
            <span>${escapeHtml(t.name)}</span>
          </label>`;
          })
          .join('')}</div>`;

  const emailRows =
    (person.emails ?? []).length === 0
      ? '<p class="meta">Sin emails — aparecerán al sincronizar invitados o transcripciones.</p>'
      : `<ul class="person-email-list">${(person.emails ?? [])
          .map((email) => {
            const sources = person.emailMeta?.[email]?.sources?.join(', ') ?? 'manual';
            return `<li class="person-email-row"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><span class="meta person-email-src">${escapeHtml(sources)}</span></li>`;
          })
          .join('')}</ul>`;

  return `
    <div class="contact-profile">
      <button type="button" class="profile-back" data-action="back-contacts">
        <span aria-hidden="true">←</span> Contactos
      </button>
      <header class="profile-hero" style="--profile-accent:${accent}">
        <div class="profile-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(person.displayName))}</div>
        <div class="profile-hero-text">
          <h2 class="profile-name">${escapeHtml(person.displayName)}</h2>
          ${aliasLine}
          <div class="profile-pills">${teamPills}${projectPills}</div>
        </div>
      </header>
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat-value">${meetingCount}</span>
          <span class="profile-stat-label">Reuniones</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${lastMeetingAt ? formatShortDate(lastMeetingAt) : '—'}</span>
          <span class="profile-stat-label">Última</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value">${projectNames.length}</span>
          <span class="profile-stat-label">Proyectos</span>
        </div>
      </div>
      ${
        meetingCount > 0
          ? `<button type="button" class="btn-ghost profile-filter-btn" data-action="filter-meetings">Ver en búsqueda (${meetingCount})</button>`
          : ''
      }
      <section class="profile-edit" data-profile-edit>
        <h3 class="profile-section-title">Editar contacto</h3>
        <label class="field-label" for="edit-person-name">Nombre visible</label>
        <input type="text" id="edit-person-name" class="field-input" value="${escapeHtml(person.displayName)}" autocomplete="name" />
        <button type="button" class="btn-primary btn-sm" data-action="save-person-name">Guardar nombre</button>
        <label class="field-label">Emails</label>
        ${emailRows}
        <label class="field-label">Equipos</label>
        ${teamChecks}
      </section>
      <section class="profile-merge" data-profile-edit>
        <h3 class="profile-section-title">Agrupar contacto</h3>
        <p class="meta profile-merge-hint">
          Unificá variantes del mismo nombre (ej. Agus, Agustín, amazalan). Las reuniones pasan a este contacto; los otros perfiles se eliminan y quedan como alias.
        </p>
        ${
          mergeCandidates.length === 0
            ? '<p class="meta">No hay otros contactos para unificar.</p>'
            : `
        <input type="search" id="merge-contact-search" class="field-input merge-search-input" placeholder="Escribí para filtrar (ej. agus, mazalan)…" autocomplete="off" spellcheck="false" value="${escapeHtml(mergeSearchQ)}" />
        <p class="merge-match-count meta" id="merge-match-count" aria-live="polite"></p>
        <div class="merge-candidate-list" id="merge-candidate-list">
          ${mergeCandidates
            .map(({ person: p, meetingCount: mc, suggested }) => {
              const searchText = mergeSearchBlob(p);
              return `
            <label class="merge-check${suggested ? ' merge-check-suggested' : ''}" data-search-text="${searchText.replace(/"/g, '')}">
              <input type="checkbox" data-merge-id="${p.id}" />
              <span class="merge-check-name">${escapeHtml(p.displayName)}</span>
              ${suggested ? '<span class="merge-suggested-tag">Similar</span>' : ''}
              <span class="meta">${mc} reuniones</span>
            </label>`;
            })
            .join('')}
        </div>
        <p class="merge-no-results meta" id="merge-no-results" hidden>Sin coincidencias — probá otro fragmento del nombre.</p>
        <button type="button" class="btn-primary btn-sm" data-action="merge-contacts" disabled>Unificar seleccionados</button>`
        }
      </section>
      <section class="profile-timeline">
        <h3 class="profile-section-title">Historial</h3>
        ${timelineHtml}
      </section>
    </div>`;
}

function groupMeetingsByMonth(meetings: Meeting[]): [string, string][] {
  const sorted = [...meetings].sort((a, b) =>
    (b.startedAt ?? '').localeCompare(a.startedAt ?? ''),
  );
  const map = new Map<string, string[]>();
  const sinFecha: string[] = [];

  for (const m of sorted) {
    const card = `<li class="meeting-card meeting-card-compact" data-meeting-id="${m.id}">
      <strong>${escapeHtml(m.title)}</strong>
      <span class="meta">${m.startedAt ? formatShortDate(m.startedAt) : 'Sin fecha'}</span>
    </li>`;
    if (!m.startedAt) {
      sinFecha.push(card);
      continue;
    }
    const d = new Date(m.startedAt);
    const key = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(card);
  }

  const out: [string, string][] = [...map.entries()].map(([k, v]) => [k, v.join('')]);
  if (sinFecha.length) out.push(['Sin fecha', sinFecha.join('')]);
  return out;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function mergeSearchBlob(person: Person): string {
  return normalizeSearchText(
    [person.displayName, ...person.aliases, ...(person.emails ?? [])].join(' '),
  );
}

export function filterMergeCandidates(
  list: Element | null,
  query: string,
  countEl?: Element | null,
  emptyEl?: Element | null,
): number {
  const needle = normalizeSearchText(query.trim());
  const rows = list?.querySelectorAll<HTMLElement>('.merge-check') ?? [];
  let visible = 0;
  rows.forEach((row) => {
    const label = row.dataset.searchText ?? '';
    const show = !needle || label.includes(needle);
    row.classList.toggle('merge-check--hidden', !show);
    if (show) visible += 1;
  });
  const total = rows.length;
  if (countEl) {
    countEl.textContent = needle
      ? `${visible} coincidencia${visible === 1 ? '' : 's'}`
      : `${total} contactos — escribí para filtrar`;
  }
  if (emptyEl) (emptyEl as HTMLElement).hidden = !needle || visible > 0;
  return visible;
}

/** Filtra tarjetas en vivo sin re-render (mantiene foco en el input). */
export function filterContactsGrid(container: HTMLElement, query: string): number {
  const needle = normalizeSearchText(query.trim());
  const cards = container.querySelectorAll<HTMLElement>('.contact-card');
  let visible = 0;
  cards.forEach((card) => {
    const label = card.dataset.searchText ?? '';
    const show = !needle || label.includes(needle);
    card.classList.toggle('contact-card--hidden', !show);
    if (show) visible += 1;
  });
  const countEl = container.querySelector('#contacts-filter-count');
  if (countEl) {
    countEl.textContent = needle
      ? `${visible} coincidencia${visible === 1 ? '' : 's'}`
      : '';
  }
  const emptyEl = container.querySelector('#contacts-search-empty');
  if (emptyEl) (emptyEl as HTMLElement).hidden = !needle || visible > 0;
  return visible;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function bindContactsPage(
  container: HTMLElement,
  handlers: {
    onSelect: (id: string) => void;
    onSort: (sort: PeopleSort) => void;
    onTeamChip: (teamId: string) => void;
    onSearch: (q: string) => void;
    onShowMode: (showAll: boolean) => void;
    onManageTeams: () => void;
    onNewPerson: () => void;
    onContactsTab?: (tab: 'contacts' | 'prospects') => void;
  },
): void {
  container.querySelectorAll('[data-contacts-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      const tab = (el as HTMLElement).dataset.contactsTab as 'contacts' | 'prospects';
      handlers.onContactsTab?.(tab);
    });
  });

  container.querySelector('[data-action="manage-teams"]')?.addEventListener('click', handlers.onManageTeams);
  container.querySelector('[data-action="new-person"]')?.addEventListener('click', handlers.onNewPerson);

  const searchInput = container.querySelector('#contacts-search') as HTMLInputElement | null;
  const applyContactsFilter = () => {
    const q = searchInput?.value ?? '';
    handlers.onSearch(q);
    filterContactsGrid(container, q);
  };
  searchInput?.addEventListener('input', applyContactsFilter);
  searchInput?.addEventListener('keyup', applyContactsFilter);
  searchInput?.addEventListener('compositionend', applyContactsFilter);
  searchInput?.addEventListener('keydown', (e) => {
    (e as KeyboardEvent).stopPropagation();
  });
  applyContactsFilter();

  container.querySelector('#contacts-sort')?.addEventListener('change', (e) => {
    handlers.onSort((e.target as HTMLSelectElement).value as PeopleSort);
  });
  container.querySelectorAll('[data-team-chip]').forEach((el) => {
    el.addEventListener('click', () => {
      handlers.onTeamChip((el as HTMLElement).dataset.teamChip ?? '');
    });
  });
  container.querySelectorAll('[data-show-mode]').forEach((el) => {
    el.addEventListener('click', () => {
      handlers.onShowMode((el as HTMLElement).dataset.showMode === 'all');
    });
  });
  const open = (id: string) => handlers.onSelect(id);
  container.querySelectorAll('.contact-card').forEach((el) => {
    const id = (el as HTMLElement).dataset.personId;
    if (!id) return;
    el.addEventListener('click', () => open(id));
    el.addEventListener('keydown', (e) => {
      const ev = e as KeyboardEvent;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        open(id);
      }
    });
  });
}

export function bindContactProfile(
  container: HTMLElement,
  handlers: {
    onBack: () => void;
    onFilterMeetings: () => void;
    onManageTeams: () => void;
    onSavePersonName: (name: string) => void | Promise<void>;
    onTeamAssign: (teamId: string, checked: boolean) => void | Promise<void>;
    onMergeSearch: (q: string) => void;
    onMergeContacts: (mergeIds: string[]) => void | Promise<void>;
  },
): void {
  container.querySelector('[data-action="back-contacts"]')?.addEventListener('click', handlers.onBack);
  container.querySelector('[data-action="filter-meetings"]')?.addEventListener('click', handlers.onFilterMeetings);
  container.querySelectorAll('[data-action="manage-teams"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      handlers.onManageTeams();
    });
  });
  container.querySelector('[data-action="save-person-name"]')?.addEventListener('click', async () => {
    const input = container.querySelector('#edit-person-name') as HTMLInputElement | null;
    const name = input?.value.trim() ?? '';
    if (!name) return;
    await handlers.onSavePersonName(name);
  });
  container.querySelector('#edit-person-name')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      container.querySelector<HTMLButtonElement>('[data-action="save-person-name"]')?.click();
    }
  });
  container.querySelectorAll('[data-team-assign]').forEach((el) => {
    el.addEventListener('change', async () => {
      const teamId = (el as HTMLInputElement).dataset.teamAssign ?? '';
      await handlers.onTeamAssign(teamId, (el as HTMLInputElement).checked);
    });
  });
  const mergeBtn = container.querySelector<HTMLButtonElement>('[data-action="merge-contacts"]');
  const mergeSearch = container.querySelector<HTMLInputElement>('#merge-contact-search');
  const mergeList = container.querySelector('#merge-candidate-list');
  const mergeCount = container.querySelector('#merge-match-count');
  const mergeEmpty = container.querySelector('#merge-no-results');

  const applyMergeFilter = () => {
    if (!mergeSearch) return;
    handlers.onMergeSearch(mergeSearch.value);
    filterMergeCandidates(mergeList, mergeSearch.value, mergeCount, mergeEmpty);
  };

  const updateMergeBtn = () => {
    if (!mergeBtn) return;
    const n = container.querySelectorAll('[data-merge-id]:checked').length;
    mergeBtn.disabled = n === 0;
    mergeBtn.textContent = n > 0 ? `Unificar ${n} contacto${n > 1 ? 's' : ''}` : 'Unificar seleccionados';
  };

  container.querySelectorAll('[data-merge-id]').forEach((el) => {
    el.addEventListener('change', updateMergeBtn);
  });
  updateMergeBtn();
  applyMergeFilter();

  mergeSearch?.addEventListener('input', applyMergeFilter);
  mergeSearch?.addEventListener('keyup', applyMergeFilter);
  mergeSearch?.addEventListener('compositionend', applyMergeFilter);
  mergeSearch?.addEventListener('keydown', (e) => {
    (e as KeyboardEvent).stopPropagation();
  });
  mergeSearch?.addEventListener('click', (e) => e.stopPropagation());

  mergeBtn?.addEventListener('click', async () => {
    const ids = [...container.querySelectorAll<HTMLInputElement>('[data-merge-id]:checked')].map(
      (el) => el.dataset.mergeId ?? '',
    ).filter(Boolean);
    if (ids.length === 0) return;
    await handlers.onMergeContacts(ids);
  });
}
