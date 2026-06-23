import type { Person } from '../core/models';
import { avatarHue, escapeHtml, personInitials } from './contacts-view';

export interface MemberSuggestion {
  person: Person;
  meetingCount: number;
}

export function renderMemberSection(opts: {
  title: string;
  members: Person[];
  candidates: Person[];
  pickAttr: string;
  removeAttr: string;
  pickerSearchQ?: string;
  suggestions?: MemberSuggestion[];
  suggestionsHint?: string;
}): string {
  const {
    title,
    members,
    candidates,
    pickAttr,
    removeAttr,
    pickerSearchQ = '',
    suggestions = [],
    suggestionsHint,
  } = opts;
  const sortedMembers = [...members].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'es'),
  );
  const sortedCandidates = [...candidates].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'es'),
  );

  const bulkToolbar =
    sortedMembers.length === 0
      ? ''
      : `
      <div class="member-list-toolbar">
        <label class="member-select-all">
          <input type="checkbox" data-action="select-all-members" aria-label="Seleccionar todos los miembros" />
          <span>Seleccionar todos</span>
        </label>
        <div class="member-bulk-bar" data-member-bulk-bar hidden>
          <span class="member-bulk-count" data-member-bulk-count>0 seleccionados</span>
          <div class="member-bulk-actions" data-member-bulk-actions>
            <button type="button" class="btn-ghost btn-sm btn-danger" data-action="remove-selected-members">
              Quitar seleccionados
            </button>
          </div>
          <div class="member-bulk-confirm" data-member-bulk-confirm hidden>
            <span class="member-bulk-confirm-text" data-member-bulk-confirm-text></span>
            <button type="button" class="btn-primary btn-sm btn-danger" data-action="confirm-remove-selected">
              Sí, quitar
            </button>
            <button type="button" class="btn-ghost btn-sm" data-action="cancel-remove-selected">
              Cancelar
            </button>
          </div>
        </div>
      </div>`;

  const memberRows =
    sortedMembers.length === 0
      ? '<p class="meta catalog-members-empty">Sin miembros todavía — añadí contactos abajo.</p>'
      : `<ul class="member-list">${sortedMembers
          .map((p) => {
            const hue = avatarHue(p.id);
            return `
        <li class="member-row">
          <label class="member-select" title="Seleccionar ${escapeHtml(p.displayName)}">
            <input type="checkbox" class="member-select-input" data-member-select="${p.id}" aria-label="Seleccionar ${escapeHtml(p.displayName)}" />
          </label>
          <span class="mini-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(p.displayName))}</span>
          <button type="button" class="member-name-btn" data-open-person="${p.id}">${escapeHtml(p.displayName)}</button>
          <button type="button" class="btn-ghost btn-sm btn-danger" ${removeAttr}="${p.id}">Quitar</button>
        </li>`;
          })
          .join('')}</ul>`;

  const pickRows =
    sortedCandidates.length === 0
      ? '<p class="meta">Todos los contactos ya son miembros.</p>'
      : `<ul class="member-pick-list">${sortedCandidates
          .map(
            (p) => `
        <li class="member-pick-row">
          <button type="button" class="member-pick-btn" ${pickAttr}="${p.id}">+ ${escapeHtml(p.displayName)}</button>
        </li>`,
          )
          .join('')}</ul>`;

  const suggestionRows =
    suggestions.length === 0
      ? ''
      : `<div class="member-suggestions">
          <p class="field-label member-suggestions-label">Sugeridos</p>
          ${suggestionsHint ? `<p class="meta member-suggestions-hint">${escapeHtml(suggestionsHint)}</p>` : ''}
          <ul class="member-suggest-list">${suggestions
            .map(({ person, meetingCount }) => {
              const hue = avatarHue(person.id);
              const nLabel =
                meetingCount === 1 ? '1 reunión juntos' : `${meetingCount} reuniones juntos`;
              return `
            <li class="member-suggest-row">
              <button type="button" class="member-suggest-btn" ${pickAttr}="${escapeHtml(person.id)}" title="${escapeHtml(nLabel)}">
                <span class="mini-avatar member-suggest-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(person.displayName))}</span>
                <span class="member-suggest-text">
                  <span class="member-suggest-name">${escapeHtml(person.displayName)}</span>
                  <span class="member-suggest-meta">${escapeHtml(nLabel)}</span>
                </span>
              </button>
            </li>`;
            })
            .join('')}</ul>
        </div>`;

  return `
    <section class="catalog-members">
      <h3 class="profile-section-title">${escapeHtml(title)} (${sortedMembers.length})</h3>
      ${bulkToolbar}
      ${memberRows}
      <div class="member-add">
        <label class="field-label" for="member-picker-search">Añadir miembro</label>
        ${suggestionRows}
        <input type="search" id="member-picker-search" class="field-input" placeholder="Buscar contacto…" autocomplete="off" value="${escapeHtml(pickerSearchQ)}" />
        ${pickRows}
        <div class="member-create-row">
          <input type="text" id="member-create-name" class="field-input" placeholder="O crear contacto nuevo…" />
          <button type="button" class="btn-primary btn-sm" data-action="create-and-add-member">Crear y añadir</button>
        </div>
      </div>
    </section>`;
}

function memberSectionRoot(container: HTMLElement): HTMLElement {
  return container.querySelector('.catalog-members') ?? container;
}

function getSelectedMemberIds(section: HTMLElement): string[] {
  return [...section.querySelectorAll<HTMLInputElement>('.member-select-input:checked')].map(
    (el) => el.dataset.memberSelect!,
  );
}

function resetBulkConfirm(section: HTMLElement): void {
  section.querySelector('[data-member-bulk-actions]')?.removeAttribute('hidden');
  section.querySelector('[data-member-bulk-confirm]')?.setAttribute('hidden', '');
}

function syncMemberSelectionUi(section: HTMLElement): void {
  const checkboxes = [...section.querySelectorAll<HTMLInputElement>('.member-select-input')];
  const selectAll = section.querySelector<HTMLInputElement>('[data-action="select-all-members"]');
  const bulkBar = section.querySelector<HTMLElement>('[data-member-bulk-bar]');
  const bulkCount = section.querySelector<HTMLElement>('[data-member-bulk-count]');
  const selected = checkboxes.filter((c) => c.checked);

  if (bulkBar) bulkBar.hidden = selected.length === 0;
  if (bulkCount) {
    bulkCount.textContent =
      selected.length === 1 ? '1 seleccionado' : `${selected.length} seleccionados`;
  }
  if (selectAll) {
    selectAll.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
    selectAll.indeterminate = selected.length > 0 && selected.length < checkboxes.length;
  }
  if (selected.length === 0) resetBulkConfirm(section);
}

function applyMemberPickerFilter(section: HTMLElement, raw: string): void {
  const q = raw.trim().toLowerCase();
  section.querySelectorAll('.member-pick-row').forEach((row) => {
    const text = row.textContent?.toLowerCase() ?? '';
    const hidden = Boolean(q) && !text.includes(q);
    row.classList.toggle('member-pick--hidden', hidden);
  });
}

export function bindMemberSection(
  container: HTMLElement,
  handlers: {
    pickAttr: string;
    removeAttr: string;
    onPick: (personId: string) => void | Promise<void>;
    onRemove: (personId: string) => void | Promise<void>;
    onRemoveMany?: (personIds: string[]) => void | Promise<void>;
    onCreateAndAdd: (name: string) => void | Promise<void>;
    onOpenPerson?: (personId: string) => void;
    onPickerSearch?: (q: string) => void;
  },
): void {
  const section = memberSectionRoot(container);
  const searchInput = section.querySelector('#member-picker-search') as HTMLInputElement | null;
  if (searchInput) {
    applyMemberPickerFilter(section, searchInput.value);
    searchInput.addEventListener('input', () => {
      handlers.onPickerSearch?.(searchInput.value);
      applyMemberPickerFilter(section, searchInput.value);
    });
  }

  section.querySelectorAll('.member-select-input').forEach((el) => {
    el.addEventListener('change', () => syncMemberSelectionUi(section));
  });

  section.querySelector('[data-action="select-all-members"]')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    section.querySelectorAll<HTMLInputElement>('.member-select-input').forEach((input) => {
      input.checked = checked;
    });
    syncMemberSelectionUi(section);
  });

  section.querySelector('[data-action="remove-selected-members"]')?.addEventListener('click', () => {
    const ids = getSelectedMemberIds(section);
    if (!ids.length) return;
    const confirmText = section.querySelector('[data-member-bulk-confirm-text]');
    if (confirmText) {
      confirmText.textContent =
        ids.length === 1
          ? '¿Quitar 1 miembro?'
          : `¿Quitar ${ids.length} miembros?`;
    }
    section.querySelector('[data-member-bulk-actions]')?.setAttribute('hidden', '');
    section.querySelector('[data-member-bulk-confirm]')?.removeAttribute('hidden');
  });

  section.querySelector('[data-action="cancel-remove-selected"]')?.addEventListener('click', () => {
    resetBulkConfirm(section);
  });

  section.querySelector('[data-action="confirm-remove-selected"]')?.addEventListener('click', async () => {
    const ids = getSelectedMemberIds(section);
    if (!ids.length) {
      resetBulkConfirm(section);
      syncMemberSelectionUi(section);
      return;
    }
    try {
      if (handlers.onRemoveMany) {
        await handlers.onRemoveMany(ids);
      } else {
        for (const id of ids) await handlers.onRemove(id);
      }
    } finally {
      resetBulkConfirm(section);
    }
  });

  syncMemberSelectionUi(section);

  section.querySelectorAll(`[${handlers.pickAttr}]`).forEach((el) => {
    el.addEventListener('click', async () => {
      const id = (el as HTMLElement).getAttribute(handlers.pickAttr);
      if (!id) return;
      await handlers.onPick(id);
    });
  });

  section.querySelectorAll(`[${handlers.removeAttr}]`).forEach((el) => {
    el.addEventListener('click', async () => {
      const id = (el as HTMLElement).getAttribute(handlers.removeAttr);
      if (!id) return;
      await handlers.onRemove(id);
    });
  });

  section.querySelector('[data-action="create-and-add-member"]')?.addEventListener('click', async () => {
    const input = section.querySelector('#member-create-name') as HTMLInputElement | null;
    const name = input?.value.trim() ?? '';
    if (!name) return;
    await handlers.onCreateAndAdd(name);
    if (input) input.value = '';
  });

  section.querySelector('#member-create-name')?.addEventListener('keydown', (e) => {
    const ev = e as KeyboardEvent;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      section.querySelector<HTMLButtonElement>('[data-action="create-and-add-member"]')?.click();
    }
  });

  if (handlers.onOpenPerson) {
    section.querySelectorAll('[data-open-person]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.openPerson;
        if (id) handlers.onOpenPerson!(id);
      });
    });
  }
}
