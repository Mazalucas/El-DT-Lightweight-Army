import { api } from '../lib/api.js';
import { navigate } from '../lib/router.js';
import { toast, escapeHtml } from '../lib/ui.js';
import { button, pageHeader, section, skeletonBlock } from '../ui/primitives.js';
import { orgPrivacyNotice } from './org-privacy.js';
import type { UserMembership } from '@shared/types.js';

function isOrgAdmin(role: UserMembership['role']): boolean {
  return role === 'org_owner' || role === 'org_admin';
}

/** Panel reutilizable (Ajustes → Empresa apunta al módulo). */
export function mountEmpresaHub(host: HTMLElement): void {
  host.replaceChildren();
  renderEmpresaContent(host);
}

export async function renderEmpresa(container: HTMLElement): Promise<void> {
  container.replaceChildren(pageHeader('Empresa', 'Espacios compartidos, invitaciones y catálogo org.'));
  container.appendChild(skeletonBlock(3));
  const panel = document.createElement('div');
  panel.className = 'empresa-page';
  container.replaceChildren(pageHeader('Empresa', 'Espacios compartidos, invitaciones y catálogo org.'), panel);
  renderEmpresaContent(panel);
}

function renderEmpresaContent(host: HTMLElement): void {
  host.replaceChildren();
  host.appendChild(orgPrivacyNotice('compact'));

  const mineSec = section('Mis empresas');
  const mineHost = document.createElement('div');
  mineSec.body.appendChild(mineHost);
  host.appendChild(mineSec.el);

  const domainSec = section('Unirme por dominio');
  domainSec.body.innerHTML =
    '<p class="muted">Si tu email corporativo coincide con un dominio autorizado, podés solicitar acceso.</p>';
  const domainHost = document.createElement('div');
  domainSec.body.appendChild(domainHost);
  host.appendChild(domainSec.el);

  const createSec = section('Crear empresa');
  createSec.body.innerHTML =
    '<p class="muted">Quedás como administrador. Podés invitar por enlace o habilitar acceso por dominio.</p>';
  const form = document.createElement('div');
  form.className = 'field-stack';
  form.innerHTML = `
    <div class="field"><label>Nombre comercial</label><input id="org-name" placeholder="Acme Corp" /></div>
    <div class="field"><label>Identificador (slug)</label><input id="org-slug" placeholder="acme" /></div>
    <div class="field"><label>Dominio corporativo (opcional)</label><input id="org-domain" placeholder="acme.com" /></div>
  `;
  createSec.body.append(form);
  createSec.body.appendChild(
    button('Crear empresa', {
      variant: 'primary',
      onClick: async () => {
        const name = (form.querySelector('#org-name') as HTMLInputElement).value.trim();
        const slug = (form.querySelector('#org-slug') as HTMLInputElement).value.trim();
        const domain = (form.querySelector('#org-domain') as HTMLInputElement).value.trim();
        if (!name) return;
        try {
          const { org } = await api.createOrg({
            name,
            slug: slug || undefined,
            domains: domain ? [domain] : undefined,
          });
          toast(`Empresa «${org.name}» creada`);
          navigate('org-admin', undefined, { orgId: org.id });
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Error', 'error');
        }
      },
    }),
  );
  host.appendChild(createSec.el);

  void paintMemberships(mineHost);
  void paintDomainOrgs(domainHost);
}

async function paintMemberships(host: HTMLElement): Promise<void> {
  host.innerHTML = '<p class="muted">Cargando…</p>';
  try {
    const { memberships } = await api.listOrgs();
    host.replaceChildren();
    if (!memberships.length) {
      host.innerHTML = '<p class="muted">No pertenecés a ninguna empresa. Creá una abajo o unite por dominio.</p>';
      return;
    }
    const list = document.createElement('div');
    list.className = 'empresa-card-list';
    memberships.forEach((m) => {
      const card = document.createElement('article');
      card.className = 'empresa-card';
      card.innerHTML = `
        <div class="empresa-card-body">
          <h3 class="empresa-card-title">${escapeHtml(m.orgName)}</h3>
          <p class="muted empresa-card-role">${escapeHtml(m.role)}</p>
        </div>
      `;
      const actions = document.createElement('div');
      actions.className = 'btn-row empresa-card-actions';
      actions.append(
        button('Abrir espacio', {
          variant: 'primary',
          size: 'sm',
          onClick: () => navigate('org', undefined, { orgId: m.orgId, profTab: 'tablero' }),
        }),
      );
      if (isOrgAdmin(m.role)) {
        actions.appendChild(
          button('Admin', {
            variant: 'secondary',
            size: 'sm',
            onClick: () => navigate('org-admin', undefined, { orgId: m.orgId }),
          }),
        );
      }
      card.appendChild(actions);
      list.appendChild(card);
    });
    host.appendChild(list);
  } catch (e) {
    host.innerHTML = `<p class="muted">${e instanceof Error ? e.message : 'Error al cargar'}</p>`;
  }
}

async function paintDomainOrgs(host: HTMLElement): Promise<void> {
  host.innerHTML = '<p class="muted">Cargando…</p>';
  try {
    const { orgs } = await api.listOrgsByDomain();
    host.replaceChildren();
    if (!orgs.length) {
      host.innerHTML = '<p class="muted">Ninguna empresa acepta tu dominio por ahora.</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'todo-list';
    orgs.forEach((o) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      const policyLabel = o.joinPolicy === 'domain_auto' ? 'acceso automático' : 'requiere aprobación admin';
      li.innerHTML = `<span><strong>${escapeHtml(o.name)}</strong> <span class="muted">${policyLabel}</span></span>`;
      li.appendChild(
        button('Solicitar unirme', {
          variant: 'secondary',
          size: 'sm',
          onClick: async () => {
            try {
              const res = await api.requestOrgJoin(o.id);
              toast(res.status === 'joined' ? '¡Te uniste a la empresa!' : 'Solicitud enviada');
              if (res.status === 'joined') {
                navigate('org', undefined, { orgId: o.id, profTab: 'tablero' });
              }
            } catch (e) {
              toast(e instanceof Error ? e.message : 'Error', 'error');
            }
          },
        }),
      );
      ul.appendChild(li);
    });
    host.appendChild(ul);
  } catch {
    host.innerHTML = '<p class="muted">No se pudieron cargar empresas por dominio.</p>';
  }
}

/** Ajustes: enlace al módulo Empresa. */
export function renderEmpresaSettings(container: HTMLElement): HTMLElement {
  const card = section('Empresa');
  card.el.id = 'empresa';
  card.body.innerHTML = `
    <p class="muted">Gestioná empresas, invitaciones y espacios compartidos desde el módulo <strong>Empresa</strong> en la barra lateral.</p>
  `;
  card.body.appendChild(
    button('Ir a Empresa', {
      variant: 'primary',
      onClick: () => navigate('empresa'),
    }),
  );
  return card.el;
}
