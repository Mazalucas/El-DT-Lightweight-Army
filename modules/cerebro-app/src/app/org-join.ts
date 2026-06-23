import { api } from '../lib/api.js';
import { navigate } from '../lib/router.js';
import { toast } from '../lib/ui.js';
import { button, pageHeader, section } from '../ui/primitives.js';
import { watchAuth } from '../lib/firebase.js';
import { orgPrivacyNotice } from './org-privacy.js';

export async function renderJoin(container: HTMLElement, token: string): Promise<void> {
  container.replaceChildren(pageHeader('Unirte a una empresa', 'Aceptá la invitación para acceder al espacio compartido.'));

  const sec = section('Invitación');
  sec.body.appendChild(orgPrivacyNotice('full'));
  const acceptBtn = button('Aceptar invitación', {
    variant: 'primary',
    onClick: async () => {
      acceptBtn.disabled = true;
      try {
        const result = await api.joinOrg(token);
        toast('¡Te uniste a la empresa!');
        navigate('org', undefined, { orgId: result.orgId, profTab: 'tablero' });
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Error al unirse', 'error');
        acceptBtn.disabled = false;
      }
    },
  });
  sec.body.appendChild(acceptBtn);
  container.appendChild(sec.el);

  watchAuth((user) => {
    if (!user) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.style.marginTop = 'var(--space-4)';
      p.textContent = 'Iniciá sesión con Google para aceptar la invitación.';
      sec.body.appendChild(p);
    }
  });
}
