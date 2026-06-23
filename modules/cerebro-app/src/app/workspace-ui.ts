import type { ProfTab } from '../lib/router.js';
import { navigate } from '../lib/router.js';
import { escapeHtml } from '../lib/ui.js';
import { icon } from '../ui/icons.js';
import { button } from '../ui/primitives.js';

export type WorkspaceScope = 'personal' | 'org';

export interface OrgOption {
  id: string;
  name: string;
}

export interface WorkspaceContextBarOpts {
  scope: WorkspaceScope;
  orgId?: string;
  orgName?: string;
  orgs?: OrgOption[];
  profTab?: ProfTab;
}

function renderOrgSelector(orgs: OrgOption[], activeOrgId: string | undefined, profTab: ProfTab, orgActive: boolean): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'workspace-org-picker';

  const select = document.createElement('select');
  select.className = 'workspace-org-select field-input';
  select.setAttribute('aria-label', 'Elegir empresa');

  for (const org of orgs) {
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = org.name;
    if (org.id === activeOrgId) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => {
    const nextId = select.value;
    if (!nextId || nextId === activeOrgId) return;
    navigate('org', undefined, { orgId: nextId, profTab });
  });

  if (orgActive) {
    wrap.appendChild(select);
    return wrap;
  }

  wrap.append(
    select,
    button('Abrir', {
      variant: 'secondary',
      size: 'sm',
      onClick: () => {
        const id = select.value || orgs[0]?.id;
        if (id) navigate('org', undefined, { orgId: id, profTab });
      },
    }),
  );
  return wrap;
}

export interface SidebarProfileSwitcherOpts {
  scope: WorkspaceScope;
  orgId?: string;
  orgName?: string;
  orgs?: OrgOption[];
  profTab?: ProfTab;
  compact?: boolean;
}

function activeOrgFromOpts(opts: SidebarProfileSwitcherOpts): OrgOption | undefined {
  const orgs = opts.orgs ?? [];
  if (!orgs.length) return undefined;
  return orgs.find((o) => o.id === opts.orgId) ?? orgs[0];
}

function profileNavigatePersonal(profTab: ProfTab): void {
  navigate('profesional', undefined, { profTab });
}

function profileNavigateOrg(orgId: string, profTab: ProfTab): void {
  navigate('org', undefined, { orgId, profTab });
}

type ProfileKind = 'personal' | 'org';

interface ProfileEntry {
  kind: ProfileKind;
  id: string;
  title: string;
  subtitle: string;
}

function profileEntries(opts: SidebarProfileSwitcherOpts): ProfileEntry[] {
  const entries: ProfileEntry[] = [
    { kind: 'personal', id: 'personal', title: 'Personal', subtitle: 'Solo vos' },
  ];
  for (const org of opts.orgs ?? []) {
    entries.push({ kind: 'org', id: org.id, title: org.name, subtitle: 'Compartido' });
  }
  return entries;
}

function activeProfileEntry(opts: SidebarProfileSwitcherOpts, entries: ProfileEntry[]): ProfileEntry {
  if (opts.scope === 'personal') return entries[0]!;
  const activeOrg = activeOrgFromOpts(opts);
  if (activeOrg) {
    return entries.find((e) => e.id === activeOrg.id) ?? entries[0]!;
  }
  return {
    kind: 'org',
    id: 'empresa',
    title: opts.orgName ?? 'Empresa',
    subtitle: 'Compartido',
  };
}

function isProfileEntryActive(entry: ProfileEntry, active: ProfileEntry): boolean {
  return entry.id === active.id && entry.kind === active.kind;
}

function navigateProfileEntry(entry: ProfileEntry, profTab: ProfTab): void {
  if (entry.kind === 'personal') {
    profileNavigatePersonal(profTab);
    return;
  }
  if (entry.id === 'empresa') {
    navigate('empresa');
    return;
  }
  profileNavigateOrg(entry.id, profTab);
}

function renderProfileOption(entry: ProfileEntry, active: boolean, onSelect: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `sidebar-profile${active ? ' sidebar-profile--active' : ''}${entry.kind === 'org' && active ? ' sidebar-profile--org' : ''}`;
  btn.setAttribute('role', 'menuitem');
  btn.innerHTML = `
    <span class="sidebar-profile-avatar sidebar-profile-avatar--${entry.kind === 'org' ? 'org' : 'personal'}">${icon(entry.kind === 'org' ? 'building' : 'user')}</span>
    <span class="sidebar-profile-text"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.subtitle)}</small></span>
    ${active ? `<span class="sidebar-profile-indicator" aria-hidden="true">${icon('check')}</span>` : ''}
  `;
  if (active) btn.setAttribute('aria-current', 'true');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelect();
  });
  return btn;
}

function mountProfileDropdown(
  host: HTMLElement,
  opts: SidebarProfileSwitcherOpts,
  entries: ProfileEntry[],
  active: ProfileEntry,
): void {
  const profTab = opts.profTab ?? 'dashboard';
  const orgs = opts.orgs ?? [];
  let open = false;
  let onDocClick: ((e: Event) => void) | null = null;

  const dropdown = document.createElement('div');
  dropdown.className = `sidebar-profile-dropdown${opts.compact ? ' sidebar-profile-dropdown--compact' : ''}`;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = opts.compact
    ? `sidebar-profile-compact sidebar-profile-compact--trigger${active.kind === 'org' ? ' sidebar-profile-compact--org' : ''} sidebar-profile-compact--active`
    : `sidebar-profile sidebar-profile--trigger sidebar-profile--active${active.kind === 'org' ? ' sidebar-profile--org' : ''}`;
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', `Perfil activo: ${active.title}. Elegir otro perfil`);

  if (opts.compact) {
    trigger.innerHTML = `
      ${icon(active.kind === 'org' ? 'building' : 'user')}
      <span class="sidebar-profile-compact-chevron" aria-hidden="true">${icon('chevron')}</span>
    `;
  } else {
    trigger.innerHTML = `
      <span class="sidebar-profile-avatar sidebar-profile-avatar--${active.kind === 'org' ? 'org' : 'personal'}">${icon(active.kind === 'org' ? 'building' : 'user')}</span>
      <span class="sidebar-profile-text"><strong>${escapeHtml(active.title)}</strong><small>${escapeHtml(active.subtitle)}</small></span>
      <span class="sidebar-profile-chevron" aria-hidden="true">${icon('chevron')}</span>
    `;
  }

  const menu = document.createElement('div');
  menu.className = `sidebar-profile-menu${opts.compact ? ' sidebar-profile-menu--compact' : ''}`;
  menu.hidden = true;
  menu.setAttribute('role', 'menu');

  const closeMenu = (): void => {
    if (!open) return;
    open = false;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('sidebar-profile--open', 'sidebar-profile-compact--open');
    if (onDocClick) {
      document.removeEventListener('click', onDocClick);
      onDocClick = null;
    }
  };

  const setOpen = (next: boolean): void => {
    if (next === open) return;
    if (!next) {
      closeMenu();
      return;
    }
    open = true;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add(opts.compact ? 'sidebar-profile-compact--open' : 'sidebar-profile--open');
    onDocClick = (e: Event) => {
      if (!dropdown.contains(e.target as Node)) closeMenu();
    };
    setTimeout(() => {
      if (onDocClick) document.addEventListener('click', onDocClick);
    }, 0);
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  });

  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      trigger.focus();
    }
  });

  for (const entry of entries) {
    const isActive = isProfileEntryActive(entry, active);
    menu.appendChild(
      renderProfileOption(entry, isActive, () => {
        closeMenu();
        if (!isActive) navigateProfileEntry(entry, profTab);
      }),
    );
  }

  if (!orgs.length) {
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'sidebar-profile-cta';
    hint.setAttribute('role', 'menuitem');
    hint.textContent = 'Crear o unirte a una empresa';
    hint.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      navigate('empresa');
    });
    menu.appendChild(hint);
  }

  dropdown.append(trigger, menu);
  host.appendChild(dropdown);
}

/** Selector de perfil en sidenav — solo el activo; al tocar se despliegan el resto. */
export function renderSidebarProfileSwitcher(opts: SidebarProfileSwitcherOpts): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `sidebar-profiles${opts.compact ? ' sidebar-profiles--compact' : ''}`;

  const entries = profileEntries(opts);
  const active = activeProfileEntry(opts, entries);

  if (!opts.compact) {
    const label = document.createElement('p');
    label.className = 'sidebar-profiles-label';
    label.textContent = 'Perfil activo';
    wrap.appendChild(label);
  }

  mountProfileDropdown(wrap, opts, entries, active);
  return wrap;
}

/** @deprecated Usar renderSidebarProfileSwitcher en la sidenav. */
export function renderWorkspaceContextBar(opts: WorkspaceContextBarOpts): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'workspace-context-bar';

  const tab = opts.profTab ?? 'dashboard';
  const personalActive = opts.scope === 'personal';
  const orgActive = opts.scope === 'org';
  const orgs = opts.orgs ?? (opts.orgId ? [{ id: opts.orgId, name: opts.orgName ?? 'Empresa' }] : []);
  const hasMultipleOrgs = orgs.length > 1;

  const personalChip = document.createElement('button');
  personalChip.type = 'button';
  personalChip.className = `workspace-chip${personalActive ? ' workspace-chip--active' : ''}`;
  personalChip.innerHTML = `<span class="workspace-chip-icon">👤</span><span><strong>Personal</strong><small>Solo vos</small></span>`;
  if (!personalActive) {
    personalChip.addEventListener('click', () => navigate('profesional', undefined, { profTab: tab }));
  } else {
    personalChip.setAttribute('aria-current', 'true');
  }

  const orgChip = document.createElement('div');
  orgChip.className = `workspace-chip workspace-chip--org${orgActive ? ' workspace-chip--active' : ''}`;
  if (orgActive) orgChip.setAttribute('role', 'group');

  const orgHead = document.createElement('div');
  orgHead.className = 'workspace-chip-main';
  orgHead.innerHTML = `<span class="workspace-chip-icon">🏢</span><span class="workspace-chip-text"><strong>Empresa</strong><small>Compartido</small></span>`;

  if (!orgs.length) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'workspace-chip-link';
    btn.textContent = 'Crear o unirte';
    btn.addEventListener('click', () => navigate('empresa'));
    orgChip.append(orgHead, btn);
  } else if (hasMultipleOrgs) {
    orgChip.append(orgHead, renderOrgSelector(orgs, opts.orgId, tab, orgActive));
    if (orgActive) orgChip.setAttribute('aria-current', 'true');
  } else {
    const single = orgs[0]!;
    orgHead.querySelector('.workspace-chip-text')!.innerHTML = `<strong>${escapeHtml(single.name)}</strong><small>Compartido</small>`;
    if (orgActive) {
      orgChip.appendChild(orgHead);
      orgChip.setAttribute('aria-current', 'true');
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'workspace-chip-link workspace-chip-link--full';
      btn.appendChild(orgHead);
      btn.addEventListener('click', () => navigate('org', undefined, { orgId: single.id, profTab: tab }));
      orgChip.appendChild(btn);
    }
  }

  bar.append(personalChip, orgChip);
  return bar;
}

export function renderWorkspaceScopeHint(scope: WorkspaceScope, orgName?: string): HTMLElement {
  const hint = document.createElement('p');
  hint.className = 'workspace-scope-hint';
  if (scope === 'personal') {
    hint.innerHTML =
      '<strong>Espacio personal.</strong> Tus reuniones, contactos y sugerencias son privados hasta que sincronicés a una empresa.';
  } else {
    hint.innerHTML = `<strong>Espacio empresa${orgName ? ` · ${escapeHtml(orgName)}` : ''}.</strong> Datos agregados de los miembros. Revisá el inbox antes de usar proyectos en catálogo.`;
  }
  return hint;
}

export function renderInboxIntro(scope: WorkspaceScope): HTMLElement {
  const el = document.createElement('div');
  el.className = 'inbox-intro';
  el.innerHTML =
    scope === 'personal'
      ? `<p>Revisá y confirmá lo que el pipeline detectó: <strong>contactos sin email</strong>, <strong>proyectos inferidos</strong>, <strong>equipos</strong> y <strong>tareas</strong>. Usá los filtros por reunión si hay muchas sugerencias.</p>`
      : `<p>Inbox compartido de la empresa. Filtrá por reunión reciente o miembro en la Red para enfocarte en lo urgente.</p>`;
  return el;
}

export function renderWorkspaceMetrics(items: { label: string; value: string; tone?: 'ok' | 'warn' | 'accent' | 'default' }[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'workspace-metrics';
  for (const item of items) {
    const card = document.createElement('article');
    card.className = `workspace-metric workspace-metric--${item.tone ?? 'default'}`;
    card.innerHTML = `<span class="workspace-metric-value">${escapeHtml(item.value)}</span><span class="workspace-metric-label">${escapeHtml(item.label)}</span>`;
    row.appendChild(card);
  }
  return row;
}

export function renderSectionLead(title: string, description: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'section-lead';
  wrap.innerHTML = `<h2 class="section-lead-title">${escapeHtml(title)}</h2><p class="muted section-lead-desc">${escapeHtml(description)}</p>`;
  return wrap;
}
