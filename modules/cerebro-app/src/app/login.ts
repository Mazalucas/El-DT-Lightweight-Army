import { loginDev, isDevEmulatorMode } from '../lib/firebase.js';
import { checkEmulatorsReady } from '../lib/emulator-status.js';
import { toast } from '../lib/ui.js';
import { icon } from '../ui/icons.js';
import { badge, button } from '../ui/primitives.js';

export async function renderLogin(root: HTMLElement, onSuccess: () => void): Promise<void> {
  const devMode = isDevEmulatorMode();
  root.replaceChildren();

  const page = document.createElement('div');
  page.className = 'login-page';

  const panel = document.createElement('div');
  panel.className = 'login-panel';

  const brand = document.createElement('div');
  brand.className = 'app-brand';
  brand.innerHTML = `
    <div class="app-brand-mark">${icon('brain')}</div>
    <span class="app-brand-text">Cerebro</span>
  `;

  const h1 = document.createElement('h1');
  h1.textContent = 'Tu segundo cerebro profesional';

  const desc = document.createElement('p');
  desc.className = 'login-panel-desc';
  desc.textContent = 'Reuniones, contactos y más — en la nube.';

  panel.append(brand, h1, desc);

  let statusEl: HTMLElement | null = null;
  if (devMode) {
    statusEl = document.createElement('p');
    statusEl.className = 'login-status muted';
    statusEl.textContent = 'Comprobando emuladores…';
    panel.appendChild(statusEl);
  }

  const actions = document.createElement('div');
  actions.className = 'btn-row';
  actions.style.flexDirection = 'column';

  let devBtn: HTMLButtonElement | null = null;
  if (devMode) {
    devBtn = button('Entrar (dev local)', { variant: 'primary', block: true, id: 'btn-login-dev' });
    actions.appendChild(devBtn);
  } else {
    actions.appendChild(button('Entrar con Google', { variant: 'primary', block: true, id: 'btn-login' }));
  }
  panel.appendChild(actions);

  if (devMode) {
    const foot = document.createElement('p');
    foot.className = 'login-footnote';
    foot.innerHTML =
      'Dev local usa emuladores — <strong>no</strong> hace falta proyecto Firebase en la nube. Arrancá <code>./scripts/dev-cerebro-local.sh</code>.';
    panel.appendChild(foot);
  }

  page.appendChild(panel);
  root.appendChild(page);

  if (devMode && statusEl && devBtn) {
    const check = await checkEmulatorsReady();
    if (check.ok) {
      statusEl.replaceChildren(badge('Emuladores OK', 'success'), document.createTextNode(' Listo para entrar'));
    } else {
      statusEl.replaceChildren(
        badge('Emuladores OFF', 'warn'),
        document.createTextNode(` ${check.message ?? ''}`),
      );
      devBtn.disabled = true;
    }
  }

  root.querySelector('#btn-login-dev')?.addEventListener('click', async () => {
    const check = await checkEmulatorsReady();
    if (!check.ok) {
      toast(check.message ?? 'Arrancá ./scripts/dev-cerebro-local.sh', 'error');
      return;
    }
    try {
      await loginDev();
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('network-request-failed')) {
        toast('Auth emulator no responde. Ejecutá: ./scripts/dev-cerebro-local.sh', 'error');
      } else {
        toast(msg, 'error');
      }
    }
  });

  root.querySelector('#btn-login')?.addEventListener('click', async () => {
    try {
      const { loginWithGoogle } = await import('../lib/firebase.js');
      await loginWithGoogle();
      onSuccess();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al iniciar sesión', 'error');
    }
  });
}
