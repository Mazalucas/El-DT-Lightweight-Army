import { api } from '../lib/api.js';
import type { OrgBranding, Organization, OrgJoinPolicy } from '@shared/types.js';
import { ACCENT_PRESETS, orgDisplayName } from '../lib/org-branding.js';
import type { OrgAdminTab } from '../lib/router.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { button, pageHeader, section } from '../ui/primitives.js';
import { navigate } from '../lib/router.js';
import { copyTextToClipboard, orgPrivacyNotice } from './org-privacy.js';

async function loadOrgAdmin(orgId: string): Promise<{ org: Organization; members: Awaited<ReturnType<typeof api.listOrgMembers>>['members'] } | null> {
  try {
    const [orgRes, memRes] = await Promise.all([api.getOrg(orgId), api.listOrgMembers(orgId)]);
    return { org: orgRes.org, members: memRes.members };
  } catch (e) {
    return null;
  }
}

function adminBackBar(orgId: string): HTMLButtonElement {
  return button('← Espacio org', {
    variant: 'ghost',
    onClick: () => navigate('org', undefined, { orgId, profTab: 'tablero' }),
  });
}

export async function renderOrgAdmin(
  container: HTMLElement,
  orgId: string,
  tab: OrgAdminTab = 'admin',
): Promise<void> {
  container.replaceChildren(pageHeader('Admin empresa', orgId));

  const data = await loadOrgAdmin(orgId);
  if (!data) {
    container.replaceChildren(pageHeader('Admin empresa'));
    const err = document.createElement('p');
    err.className = 'muted';
    err.textContent = 'No se pudo cargar la empresa.';
    container.appendChild(err);
    return;
  }

  let { org, members } = data;
  container.replaceChildren(pageHeader('Admin', orgDisplayName(org)));

  const back = adminBackBar(orgId);
  back.style.marginBottom = 'var(--space-4)';
  container.prepend(back);

  if (tab === 'invitar') {
    renderInviteTab(container, orgId, org);
    return;
  }
  if (tab === 'apariencia') {
    await renderBrandingTab(container, orgId, org);
    return;
  }

  container.appendChild(orgPrivacyNotice('full'));

  const settingsSec = section('Política y dominios');
  settingsSec.body.innerHTML = `
    <p class="muted">Dominios autorizados para solicitud de acceso (ej. <code>miempresa.com</code>). Verificación DNS no requerida en MVP — el admin declara dominios de confianza.</p>
    <div class="field"><label>Dominios (coma-separados)</label><input id="org-domains" value="${escapeHtml(org.domains.join(', '))}" placeholder="empresa.com, empresa.es" /></div>
    <div class="field"><label>Política de acceso</label>
      <select id="org-join-policy">
        <option value="invite_only">Solo invitación por email</option>
        <option value="domain_request">Dominio + aprobación admin</option>
        <option value="domain_auto">Dominio + acceso automático</option>
      </select>
    </div>
  `;
  (settingsSec.body.querySelector('#org-join-policy') as HTMLSelectElement).value = org.joinPolicy;
  settingsSec.body.appendChild(
    button('Guardar política', {
      variant: 'secondary',
      onClick: async () => {
        const domainsRaw = (settingsSec.body.querySelector('#org-domains') as HTMLInputElement).value;
        const domains = domainsRaw.split(/[,;\s]+/).map((d) => d.trim()).filter(Boolean);
        const joinPolicy = (settingsSec.body.querySelector('#org-join-policy') as HTMLSelectElement)
          .value as OrgJoinPolicy;
        try {
          const res = await api.updateOrg(orgId, { domains, joinPolicy });
          org = res.org;
          toast('Política actualizada');
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
  container.appendChild(settingsSec.el);

  const joinReqSec = section('Solicitudes de acceso');
  container.appendChild(joinReqSec.el);

  async function paintJoinRequests(): Promise<void> {
    try {
      const { requests } = await api.listOrgJoinRequests(orgId);
      joinReqSec.body.replaceChildren();
      if (!requests.length) {
        joinReqSec.body.innerHTML = '<p class="muted">Sin solicitudes pendientes.</p>';
        return;
      }
      const ul = document.createElement('ul');
      ul.className = 'todo-list';
      requests.forEach((r) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `<span><strong>${escapeHtml(r.email)}</strong> <span class="muted">${escapeHtml(r.createdAt.slice(0, 10))}</span></span>`;
        const actions = document.createElement('div');
        actions.className = 'todo-actions';
        actions.append(
          button('Aprobar', {
            variant: 'secondary',
            size: 'sm',
            onClick: async () => {
              await api.approveOrgJoinRequest(orgId, r.id);
              toast('Miembro aprobado');
              void paintJoinRequests();
              void paintMembers();
            },
          }),
          button('Rechazar', {
            variant: 'ghost',
            size: 'sm',
            onClick: async () => {
              await api.rejectOrgJoinRequest(orgId, r.id);
              toast('Solicitud rechazada');
              void paintJoinRequests();
            },
          }),
        );
        li.appendChild(actions);
        ul.appendChild(li);
      });
      joinReqSec.body.appendChild(ul);
    } catch {
      joinReqSec.body.innerHTML = '<p class="muted">No se pudieron cargar solicitudes.</p>';
    }
  }

  const memSec = section(`Miembros (${members.length})`);
  container.appendChild(memSec.el);

  function paintMembers(): void {
    void api.listOrgMembers(orgId).then(({ members: fresh }) => {
      members = fresh;
      memSec.el.querySelector('h2')!.textContent = `Miembros (${members.length})`;
      const ul = document.createElement('ul');
      ul.className = 'todo-list';
      members.forEach((m) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `<span><strong>${escapeHtml(m.email || m.uid)}</strong> <span class="muted">${escapeHtml(m.role)}</span></span>`;
        ul.appendChild(li);
      });
      memSec.body.replaceChildren(ul);
    });
  }

  paintMembers();

  container.appendChild(
    button('Sincronizar mi catálogo → empresa', {
      variant: 'secondary',
      onClick: async () => {
        try {
          const r = await api.ingestOrg(orgId);
          toast(`Ingest listo (${r.merged} reuniones unificadas)`);
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );

  void paintJoinRequests();
}

function renderInviteTab(container: HTMLElement, orgId: string, _org: Organization): void {
  container.appendChild(orgPrivacyNotice('compact'));

  const inviteSec = section('Invitar miembros');
  inviteSec.body.innerHTML = `
    <p class="muted">El invitado no necesita cuenta previa. Si no hay <code>MAIL_API_KEY</code> configurado, copiá el enlace manualmente.</p>
    <div class="field"><label>Email</label><input id="invite-email" type="email" placeholder="persona@empresa.com" /></div>
    <div class="field"><label>Rol</label>
      <select id="invite-role"><option value="org_member">Miembro</option><option value="org_admin">Admin</option></select>
    </div>
  `;
  const inviteLinkHost = document.createElement('div');
  inviteLinkHost.className = 'invite-link-host';
  inviteSec.body.appendChild(inviteLinkHost);

  inviteSec.body.appendChild(
    button('Enviar invitación', {
      variant: 'primary',
      onClick: async () => {
        const email = (inviteSec.body.querySelector('#invite-email') as HTMLInputElement).value.trim();
        const role = (inviteSec.body.querySelector('#invite-role') as HTMLSelectElement).value as 'org_member' | 'org_admin';
        if (!email) return;
        try {
          const res = await api.createOrgInvite(orgId, email, role);
          toast('Invitación creada');
          inviteLinkHost.replaceChildren();
          const box = document.createElement('div');
          box.className = 'inline-panel';
          box.innerHTML = `<p class="muted">Enlace para ${escapeHtml(email)}:</p><code class="invite-url">${escapeHtml(res.joinUrl)}</code>`;
          box.appendChild(
            button('Copiar enlace', {
              variant: 'secondary',
              size: 'sm',
              onClick: async () => {
                const ok = await copyTextToClipboard(res.joinUrl);
                toast(ok ? 'Enlace copiado' : 'No se pudo copiar', ok ? undefined : 'error');
              },
            }),
          );
          inviteLinkHost.appendChild(box);
          void paintInvites();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
  container.appendChild(inviteSec.el);

  const pendingInvitesSec = section('Invitaciones pendientes');
  container.appendChild(pendingInvitesSec.el);

  async function paintInvites(): Promise<void> {
    try {
      const { invites } = await api.listOrgInvites(orgId);
      pendingInvitesSec.body.replaceChildren();
      if (!invites.length) {
        pendingInvitesSec.body.innerHTML = '<p class="muted">Sin invitaciones pendientes.</p>';
        return;
      }
      const ul = document.createElement('ul');
      ul.className = 'todo-list';
      invites.forEach((inv) => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `<span>${escapeHtml(inv.email)} <span class="muted">${escapeHtml(inv.role)} · expira ${escapeHtml(inv.expiresAt.slice(0, 10))}</span></span>`;
        ul.appendChild(li);
      });
      pendingInvitesSec.body.appendChild(ul);
    } catch {
      pendingInvitesSec.body.innerHTML = '<p class="muted">No se pudieron cargar invitaciones.</p>';
    }
  }

  void paintInvites();
}

async function renderBrandingTab(container: HTMLElement, orgId: string, org: Organization): Promise<void> {
  let branding: OrgBranding = { ...(org.branding ?? {}) };

  const sec = section('Apariencia de la empresa');
  sec.body.innerHTML = `
    <p class="muted">Personalizá el logo y color de acento en la barra lateral mientras navegás el espacio org.</p>
    <div class="field"><label>Nombre visible (opcional)</label><input id="brand-display-name" value="${escapeHtml(branding.displayName ?? '')}" placeholder="${escapeHtml(org.name)}" /></div>
    <div class="field"><label>Color de acento</label>
      <div class="brand-accent-row" id="accent-presets"></div>
      <input id="brand-accent" type="color" value="${escapeHtml(branding.accentColor ?? '#0ea5e9')}" />
      <input id="brand-accent-hex" class="field-input brand-accent-hex" value="${escapeHtml(branding.accentColor ?? '#0ea5e9')}" placeholder="#0ea5e9" />
    </div>
    <div class="field"><label>Logo</label>
      <input id="brand-logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
      <div id="brand-logo-preview" class="brand-logo-preview"></div>
    </div>
  `;

  const presetsHost = sec.body.querySelector('#accent-presets')!;
  ACCENT_PRESETS.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'brand-accent-swatch';
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      (sec.body.querySelector('#brand-accent') as HTMLInputElement).value = color;
      (sec.body.querySelector('#brand-accent-hex') as HTMLInputElement).value = color;
    });
    presetsHost.appendChild(swatch);
  });

  const previewHost = sec.body.querySelector('#brand-logo-preview')!;
  function paintLogoPreview(): void {
    previewHost.replaceChildren();
    if (branding.logoUrl) {
      const img = document.createElement('img');
      img.src = branding.logoUrl;
      img.alt = 'Logo';
      img.className = 'brand-logo-preview-img';
      previewHost.appendChild(img);
    }
  }
  paintLogoPreview();

  const colorInput = sec.body.querySelector('#brand-accent') as HTMLInputElement;
  const hexInput = sec.body.querySelector('#brand-accent-hex') as HTMLInputElement;
  colorInput.addEventListener('input', () => {
    hexInput.value = colorInput.value;
  });
  hexInput.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value.trim())) colorInput.value = hexInput.value.trim();
  });

  const actions = document.createElement('div');
  actions.className = 'btn-row';
  actions.append(
    button('Guardar apariencia', {
      variant: 'primary',
      onClick: async () => {
        const displayName = (sec.body.querySelector('#brand-display-name') as HTMLInputElement).value.trim();
        const accentColor = hexInput.value.trim() || colorInput.value;
        try {
          const res = await api.updateOrg(orgId, {
            branding: {
              displayName: displayName || undefined,
              accentColor,
              logoUrl: branding.logoUrl,
            },
          });
          org = res.org;
          branding = { ...(org.branding ?? {}) };
          toast('Apariencia guardada');
          location.reload();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
    button('Restaurar Cerebro', {
      variant: 'ghost',
      onClick: async () => {
        try {
          await api.updateOrg(orgId, { branding: {} });
          toast('Apariencia restaurada');
          location.reload();
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
  sec.body.appendChild(actions);

  const fileInput = sec.body.querySelector('#brand-logo-file') as HTMLInputElement;
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast('Logo demasiado grande (máx. 512 KB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      if (!base64) return;
      try {
        const res = await api.uploadOrgLogo(orgId, { dataBase64: base64, mimeType: file.type, fileName: file.name });
        branding.logoUrl = res.logoUrl;
        paintLogoPreview();
        toast('Logo subido — guardá apariencia para aplicar');
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Error al subir logo', 'error');
      }
    };
    reader.readAsDataURL(file);
  });

  container.appendChild(sec.el);
}
