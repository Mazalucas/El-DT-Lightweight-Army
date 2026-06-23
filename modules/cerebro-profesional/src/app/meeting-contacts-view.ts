import type { PersonProspect } from '../core/models';
import type { MeetingContactDisplay, MeetingProspectDisplay } from '../core/meeting-contacts';
import { avatarHue, personInitials } from './contacts-view';
import { escapeHtml } from './format';

export function renderMeetingContactsSection(opts: {
  contacts: MeetingContactDisplay[];
  prospects: MeetingProspectDisplay[];
}): string {
  const { contacts, prospects } = opts;
  if (!contacts.length && !prospects.length) return '';

  const contactCards = contacts
    .map(({ person, meetingEmails, sources }) => {
      const hue = avatarHue(person.id);
      const emailLine = meetingEmails.length
        ? meetingEmails.map((e) => escapeHtml(e)).join(', ')
        : '—';
      const sourceLine = sources.length ? sources.map((s) => escapeHtml(s)).join(' · ') : '';
      return `
        <button type="button" class="meeting-contact-card" data-person-id="${escapeHtml(person.id)}" title="Ver contacto">
          <span class="meeting-contact-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(person.displayName))}</span>
          <span class="meeting-contact-body">
            <strong class="meeting-contact-name">${escapeHtml(person.displayName)}</strong>
            <span class="meeting-contact-email">${emailLine}</span>
            ${sourceLine ? `<span class="meeting-contact-meta">${sourceLine}</span>` : ''}
          </span>
        </button>`;
    })
    .join('');

  const prospectCards = prospects
    .map(({ prospect }) => {
      const hue = avatarHue(prospect.id);
      return `
        <div class="meeting-contact-card meeting-contact-card--prospect">
          <span class="meeting-contact-avatar" style="--avatar-hue:${hue}">${escapeHtml(personInitials(prospect.displayName))}</span>
          <span class="meeting-contact-body">
            <strong class="meeting-contact-name">${escapeHtml(prospect.displayName)}</strong>
            <span class="meeting-contact-meta">Sin email · ${escapeHtml(prospect.sources.join(', '))}</span>
          </span>
        </div>`;
    })
    .join('');

  return `
    <section class="meeting-contacts">
      <h3 class="profile-section-title">Contactos de la reunión</h3>
      ${contacts.length ? `<div class="meeting-contacts-grid">${contactCards}</div>` : ''}
      ${
        prospects.length
          ? `<div class="meeting-contacts-prospects">
              <p class="meta meeting-contacts-prospects-label">Participantes sin email confirmado</p>
              <div class="meeting-contacts-grid">${prospectCards}</div>
            </div>`
          : ''
      }
    </section>`;
}

export function bindMeetingContactsSection(
  root: HTMLElement,
  onOpenPerson: (personId: string) => void,
): void {
  root.querySelectorAll('.meeting-contact-card[data-person-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.personId;
      if (id) onOpenPerson(id);
    });
  });
}

export function toProspectDisplays(prospects: PersonProspect[]): MeetingProspectDisplay[] {
  return prospects.map((prospect) => ({ prospect }));
}
