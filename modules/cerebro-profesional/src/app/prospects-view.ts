import type { Person, PersonProspect } from '../core/models';
import { avatarHue, escapeHtml, personInitials } from './contacts-view';

export interface ProspectRow {
  prospect: PersonProspect;
  meetingCount: number;
}

export function buildProspectRows(prospects: PersonProspect[]): ProspectRow[] {
  return prospects
    .filter((p) => !p.linkedPersonId)
    .map((prospect) => ({
      prospect,
      meetingCount: prospect.meetingIds.length,
    }))
    .sort((a, b) => b.meetingCount - a.meetingCount);
}

export function renderProspectsPage(opts: {
  rows: ProspectRow[];
  contacts: Person[];
}): string {
  const { rows, contacts } = opts;

  const contactOptions = contacts
    .filter((p) => (p.emails?.length ?? 0) > 0)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es'))
    .map(
      (p) =>
        `<option value="${p.id}">${escapeHtml(p.displayName)} (${escapeHtml(p.emails[0] ?? '')})</option>`,
    )
    .join('');

  const list =
    rows.length === 0
      ? '<p class="meta contacts-empty">No hay posibles contactos sin email.</p>'
      : `<ul class="prospect-list">${rows
          .map(({ prospect, meetingCount }) => {
            const hue = avatarHue(prospect.id);
            return `
        <li class="prospect-row" data-prospect-id="${prospect.id}">
          <span class="mini-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(prospect.displayName))}</span>
          <div class="prospect-main">
            <strong>${escapeHtml(prospect.displayName)}</strong>
            <span class="meta">${meetingCount} reuniones · ${escapeHtml(prospect.sources.join(', '))}</span>
          </div>
          <div class="prospect-actions">
            <input type="email" class="field-input prospect-email-input" placeholder="email@…" data-prospect-email="${prospect.id}" />
            <button type="button" class="btn-primary btn-sm" data-action="promote-prospect" data-prospect-id="${prospect.id}">Crear contacto</button>
            <select class="field-input prospect-link-select" data-prospect-link="${prospect.id}">
              <option value="">Vincular a…</option>
              ${contactOptions}
            </select>
            <button type="button" class="btn-ghost btn-sm" data-action="link-prospect" data-prospect-id="${prospect.id}">Vincular</button>
          </div>
        </li>`;
          })
          .join('')}</ul>`;

  return `
    <div class="prospects-panel">
      <p class="meta">Nombres detectados en reuniones <strong>sin email</strong>. Asigná un mail o vinculá a un contacto existente.</p>
      <button type="button" class="btn-ghost btn-sm" data-action="migrate-no-email">Limpiar: mover contactos sin email aquí</button>
      ${list}
    </div>`;
}

export function bindProspectsPage(
  container: HTMLElement,
  handlers: {
    onPromote: (prospectId: string, email: string) => void | Promise<void>;
    onLink: (prospectId: string, personId: string) => void | Promise<void>;
    onMigrateNoEmail: () => void | Promise<void>;
  },
): void {
  container.querySelector('[data-action="migrate-no-email"]')?.addEventListener('click', () => {
    void handlers.onMigrateNoEmail();
  });

  container.querySelectorAll('[data-action="promote-prospect"]').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = (el as HTMLElement).dataset.prospectId;
      if (!id) return;
      const input = container.querySelector<HTMLInputElement>(
        `[data-prospect-email="${id}"]`,
      );
      const email = input?.value.trim() ?? '';
      if (!email.includes('@')) return;
      await handlers.onPromote(id, email);
    });
  });

  container.querySelectorAll('[data-action="link-prospect"]').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = (el as HTMLElement).dataset.prospectId;
      if (!id) return;
      const select = container.querySelector<HTMLSelectElement>(`[data-prospect-link="${id}"]`);
      const personId = select?.value ?? '';
      if (!personId) return;
      await handlers.onLink(id, personId);
    });
  });
}
