import type { Meeting, Person, Team } from '../core/models';
import { suggestRelatedContacts } from '../core/suggest-related-contacts';
import { bindMemberSection, renderMemberSection } from './catalog-member-section';
import { escapeHtml } from './contacts-view';

export function renderTeamsListPage(opts: {
  teams: Team[];
  people: Person[];
  meetings: Meeting[];
}): string {
  const { teams, people, meetings } = opts;

  const cards =
    teams.length === 0
      ? '<p class="meta catalog-empty">Creá tu primer equipo abajo.</p>'
      : `<ul class="catalog-card-list">${teams
          .map((t) => {
            const memberCount = people.filter((p) => p.teamIds.includes(t.id)).length;
            const meetingCount = meetings.filter((m) => m.teamIds.includes(t.id)).length;
            return `
        <li class="catalog-card">
          <button type="button" class="catalog-card-main" data-open-team="${t.id}">
            <span class="catalog-dot" style="background:${t.color}"></span>
            <span class="catalog-card-text">
              <strong>${escapeHtml(t.name)}</strong>
              <span class="meta">${memberCount} miembros · ${meetingCount} reuniones</span>
            </span>
          </button>
          <button type="button" class="btn-ghost btn-sm" data-open-team="${t.id}">Gestionar</button>
        </li>`;
          })
          .join('')}</ul>`;

  return `
    <div class="catalog-page">
      <header class="catalog-page-header">
        <h2 class="contacts-title">Equipos</h2>
        <p class="contacts-subtitle">Creá equipos y gestioná miembros desde cada uno.</p>
      </header>
      ${cards}
      <div class="catalog-add-row">
        <input type="text" id="new-team-name" class="field-input" placeholder="Nombre del nuevo equipo…" />
        <button type="button" class="btn-primary" data-action="add-team">Crear equipo</button>
      </div>
    </div>`;
}

export function renderTeamDetailPage(opts: {
  team: Team;
  people: Person[];
  meetings: Meeting[];
  memberPickerQ?: string;
}): string {
  const { team, people, meetings, memberPickerQ } = opts;
  const members = people.filter((p) => p.teamIds.includes(team.id));
  const candidates = people.filter((p) => !p.teamIds.includes(team.id));
  const meetingCount = meetings.filter((m) => m.teamIds.includes(team.id)).length;

  const candidateIds = new Set(candidates.map((p) => p.id));
  const suggestions = suggestRelatedContacts(
    members.map((m) => m.id),
    people,
    meetings,
  ).filter((s) => candidateIds.has(s.person.id));

  const suggestionsHint =
    members.length >= 2
      ? `Coinciden en reuniones con ${members.length === 2 ? 'ambos miembros' : 'todos los miembros actuales'}.`
      : members.length === 1
        ? 'Suelen coincidir en reuniones con este miembro.'
        : undefined;

  const memberSection = renderMemberSection({
    title: 'Miembros',
    members,
    candidates,
    pickAttr: 'data-add-team-member',
    removeAttr: 'data-remove-team-member',
    pickerSearchQ: memberPickerQ,
    suggestions,
    suggestionsHint,
  });

  return `
    <div class="catalog-detail">
      <button type="button" class="profile-back" data-action="back-teams">
        <span aria-hidden="true">←</span> Equipos
      </button>
      <header class="catalog-detail-header">
        <span class="catalog-dot catalog-dot-lg" style="background:${team.color}"></span>
        <div class="catalog-detail-fields">
          <label class="field-label" for="team-detail-name">Nombre</label>
          <input type="text" id="team-detail-name" class="field-input" value="${escapeHtml(team.name)}" />
          <label class="field-label" for="team-detail-color">Color</label>
          <input type="color" id="team-detail-color" class="team-color-input" value="${team.color}" />
        </div>
      </header>
      <div class="catalog-detail-actions">
        <button type="button" class="btn-primary btn-sm" data-action="save-team-detail">Guardar cambios</button>
        <button type="button" class="btn-ghost btn-sm btn-danger" data-action="delete-team-detail">Eliminar equipo</button>
      </div>
      <p class="meta catalog-detail-meta">${meetingCount} reuniones vinculadas</p>
      ${memberSection}
    </div>`;
}

export function bindTeamsListPage(
  container: HTMLElement,
  handlers: {
    onAddTeam: (name: string) => void | Promise<void>;
    onOpenTeam: (id: string) => void;
  },
): void {
  container.querySelector('[data-action="add-team"]')?.addEventListener('click', async () => {
    const input = container.querySelector('#new-team-name') as HTMLInputElement | null;
    const name = input?.value.trim() ?? '';
    if (!name) return;
    await handlers.onAddTeam(name);
    if (input) input.value = '';
  });
  container.querySelector('#new-team-name')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      container.querySelector<HTMLButtonElement>('[data-action="add-team"]')?.click();
    }
  });
  container.querySelectorAll('[data-open-team]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.openTeam;
      if (id) handlers.onOpenTeam(id);
    });
  });
}

export function bindTeamDetailPage(
  container: HTMLElement,
  teamId: string,
  handlers: {
    onBack: () => void;
    onSave: (name: string, color: string) => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onAddMember: (personId: string) => void | Promise<void>;
    onRemoveMember: (personId: string) => void | Promise<void>;
    onRemoveMembers?: (personIds: string[]) => void | Promise<void>;
    onCreateMember: (name: string) => void | Promise<void>;
    onOpenPerson: (personId: string) => void;
    onMemberPickerSearch?: (q: string) => void;
  },
): void {
  container.querySelector('[data-action="back-teams"]')?.addEventListener('click', () => handlers.onBack());

  container.querySelector('[data-action="save-team-detail"]')?.addEventListener('click', async () => {
    const name = (container.querySelector('#team-detail-name') as HTMLInputElement)?.value.trim();
    const color = (container.querySelector('#team-detail-color') as HTMLInputElement)?.value;
    if (!name) return;
    await handlers.onSave(name, color);
  });

  container.querySelector('[data-action="delete-team-detail"]')?.addEventListener('click', async () => {
    const name =
      (container.querySelector('#team-detail-name') as HTMLInputElement)?.value.trim() ?? teamId;
    if (!confirm(`¿Eliminar el equipo «${name}»? Se quitará de contactos y reuniones.`)) return;
    await handlers.onDelete();
  });

  bindMemberSection(container, {
    pickAttr: 'data-add-team-member',
    removeAttr: 'data-remove-team-member',
    onPick: handlers.onAddMember,
    onRemove: handlers.onRemoveMember,
    onRemoveMany: handlers.onRemoveMembers,
    onCreateAndAdd: handlers.onCreateMember,
    onOpenPerson: handlers.onOpenPerson,
    onPickerSearch: handlers.onMemberPickerSearch,
  });
}
