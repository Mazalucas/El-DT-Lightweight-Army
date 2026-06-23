import type { Meeting, Person, Project } from '../core/models';
import { bindMemberSection, renderMemberSection } from './catalog-member-section';
import { escapeHtml } from './contacts-view';

export function renderProjectsListPage(opts: {
  projects: Project[];
  people: Person[];
  meetings: Meeting[];
}): string {
  const { projects, people, meetings } = opts;

  const cards =
    projects.length === 0
      ? '<p class="meta catalog-empty">Creá tu primer proyecto abajo o importá reuniones.</p>'
      : `<ul class="catalog-card-list">${projects
          .map((p) => {
            const memberCount = people.filter((person) => person.projectIds.includes(p.id)).length;
            const meetingCount = meetings.filter((m) => m.projectIds.includes(p.id)).length;
            return `
        <li class="catalog-card">
          <button type="button" class="catalog-card-main" data-open-project="${p.id}">
            <span class="catalog-dot catalog-dot-project"></span>
            <span class="catalog-card-text">
              <strong>${escapeHtml(p.name)}</strong>
              <span class="meta">${memberCount} miembros · ${meetingCount} reuniones</span>
            </span>
          </button>
          <button type="button" class="btn-ghost btn-sm" data-open-project="${p.id}">Gestionar</button>
        </li>`;
          })
          .join('')}</ul>`;

  return `
    <div class="catalog-page">
      <header class="catalog-page-header">
        <h2 class="contacts-title">Proyectos</h2>
        <p class="contacts-subtitle">Organizá proyectos y asigná miembros manualmente.</p>
      </header>
      ${cards}
      <div class="catalog-add-row">
        <input type="text" id="new-project-name" class="field-input" placeholder="Nombre del nuevo proyecto…" />
        <button type="button" class="btn-primary" data-action="add-project">Crear proyecto</button>
      </div>
    </div>`;
}

export function renderProjectDetailPage(opts: {
  project: Project;
  people: Person[];
  meetings: Meeting[];
  memberPickerQ?: string;
}): string {
  const { project, people, meetings, memberPickerQ } = opts;
  const members = people.filter((p) => p.projectIds.includes(project.id));
  const candidates = people.filter((p) => !p.projectIds.includes(project.id));
  const meetingCount = meetings.filter((m) => m.projectIds.includes(project.id)).length;

  const memberSection = renderMemberSection({
    title: 'Miembros',
    members,
    candidates,
    pickAttr: 'data-add-project-member',
    removeAttr: 'data-remove-project-member',
    pickerSearchQ: memberPickerQ,
  });

  return `
    <div class="catalog-detail">
      <button type="button" class="profile-back" data-action="back-projects">
        <span aria-hidden="true">←</span> Proyectos
      </button>
      <header class="catalog-detail-header">
        <span class="catalog-dot catalog-dot-lg catalog-dot-project"></span>
        <div class="catalog-detail-fields">
          <label class="field-label" for="project-detail-name">Nombre</label>
          <input type="text" id="project-detail-name" class="field-input" value="${escapeHtml(project.name)}" />
        </div>
      </header>
      <div class="catalog-detail-actions">
        <button type="button" class="btn-primary btn-sm" data-action="save-project-detail">Guardar cambios</button>
        <button type="button" class="btn-ghost btn-sm btn-danger" data-action="delete-project-detail">Eliminar proyecto</button>
      </div>
      <p class="meta catalog-detail-meta">${meetingCount} reuniones vinculadas</p>
      ${memberSection}
    </div>`;
}

export function bindProjectsListPage(
  container: HTMLElement,
  handlers: {
    onAddProject: (name: string) => void | Promise<void>;
    onOpenProject: (id: string) => void;
  },
): void {
  container.querySelector('[data-action="add-project"]')?.addEventListener('click', async () => {
    const input = container.querySelector('#new-project-name') as HTMLInputElement | null;
    const name = input?.value.trim() ?? '';
    if (!name) return;
    await handlers.onAddProject(name);
    if (input) input.value = '';
  });
  container.querySelector('#new-project-name')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      container.querySelector<HTMLButtonElement>('[data-action="add-project"]')?.click();
    }
  });
  container.querySelectorAll('[data-open-project]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.openProject;
      if (id) handlers.onOpenProject(id);
    });
  });
}

export function bindProjectDetailPage(
  container: HTMLElement,
  projectId: string,
  handlers: {
    onBack: () => void;
    onSave: (name: string) => void | Promise<void>;
    onDelete: () => void | Promise<void>;
    onAddMember: (personId: string) => void | Promise<void>;
    onRemoveMember: (personId: string) => void | Promise<void>;
    onRemoveMembers?: (personIds: string[]) => void | Promise<void>;
    onCreateMember: (name: string) => void | Promise<void>;
    onOpenPerson: (personId: string) => void;
    onMemberPickerSearch?: (q: string) => void;
  },
): void {
  container.querySelector('[data-action="back-projects"]')?.addEventListener('click', () => handlers.onBack());

  container.querySelector('[data-action="save-project-detail"]')?.addEventListener('click', async () => {
    const name = (container.querySelector('#project-detail-name') as HTMLInputElement)?.value.trim();
    if (!name) return;
    await handlers.onSave(name);
  });

  container.querySelector('[data-action="delete-project-detail"]')?.addEventListener('click', async () => {
    const name =
      (container.querySelector('#project-detail-name') as HTMLInputElement)?.value.trim() ?? projectId;
    if (!confirm(`¿Eliminar el proyecto «${name}»? Se quitará de contactos y reuniones.`)) return;
    await handlers.onDelete();
  });

  bindMemberSection(container, {
    pickAttr: 'data-add-project-member',
    removeAttr: 'data-remove-project-member',
    onPick: handlers.onAddMember,
    onRemove: handlers.onRemoveMember,
    onRemoveMany: handlers.onRemoveMembers,
    onCreateAndAdd: handlers.onCreateMember,
    onOpenPerson: handlers.onOpenPerson,
    onPickerSearch: handlers.onMemberPickerSearch,
  });
}
