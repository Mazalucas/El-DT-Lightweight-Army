import type { Organization, OrgRole, UserMembership } from '@shared/types.js';
import type { OrgAdminTab, ProfTab, Route } from './router.js';

export type NavContext = {
  route: Route;
  profTab?: ProfTab;
  orgId?: string;
  orgAdminTab?: OrgAdminTab;
  settingsSection?: string;
  org?: Organization | null;
  membershipRole?: OrgRole;
};

export type NavItemDef = {
  id: string;
  label: string;
  iconName: string;
  href?: string | ((ctx: NavContext) => string);
  routeMatch?: Route | Route[];
  profTabMatch?: ProfTab | ProfTab[];
  orgAdminTabMatch?: OrgAdminTab | OrgAdminTab[];
  settingsSectionMatch?: string;
  children?: NavItemDef[];
  visible?: (ctx: NavContext) => boolean;
  badgeKey?: 'profBoard' | 'orgBoard' | 'profSuggestions' | 'orgSuggestions';
};

function orgHref(orgId: string, tab: ProfTab): string {
  return `#/org/${orgId}/${tab}`;
}

const PROFESIONAL_CHILDREN: NavItemDef[] = [
  { id: 'prof-dashboard', label: 'Tablero', iconName: 'home', href: '#/profesional', profTabMatch: 'dashboard' },
  { id: 'prof-asistente', label: 'Asistente', iconName: 'brain', href: '#/assistant', routeMatch: 'assistant' },
  { id: 'prof-tablero', label: 'Tablero', iconName: 'check', href: '#/profesional/tablero', profTabMatch: 'tablero', badgeKey: 'profBoard' },
  { id: 'prof-reuniones', label: 'Reuniones', iconName: 'calendar', href: '#/profesional/reuniones', profTabMatch: 'reuniones', routeMatch: 'profesional-meeting' },
  { id: 'prof-contactos', label: 'Contactos', iconName: 'users', href: '#/profesional/contactos', profTabMatch: 'contactos' },
  { id: 'prof-proyectos', label: 'Proyectos', iconName: 'folder', href: '#/profesional/proyectos', profTabMatch: 'proyectos' },
  { id: 'prof-equipos', label: 'Equipos', iconName: 'users', href: '#/profesional/equipos', profTabMatch: 'equipos' },
  { id: 'prof-red', label: 'Red', iconName: 'share', href: '#/profesional/red', profTabMatch: 'red' },
];

function orgWorkspaceChildren(ctx: NavContext): NavItemDef[] {
  const id = ctx.orgId!;
  return [
    { id: 'org-dashboard', label: 'Tablero', iconName: 'home', href: `#/org/${id}`, profTabMatch: 'dashboard' },
    { id: 'org-tablero', label: 'Tablero', iconName: 'check', href: orgHref(id, 'tablero'), profTabMatch: 'tablero', badgeKey: 'orgBoard' },
    { id: 'org-reuniones', label: 'Reuniones', iconName: 'calendar', href: orgHref(id, 'reuniones'), profTabMatch: 'reuniones' },
    { id: 'org-contactos', label: 'Contactos', iconName: 'users', href: orgHref(id, 'contactos'), profTabMatch: 'contactos' },
    { id: 'org-proyectos', label: 'Proyectos', iconName: 'folder', href: orgHref(id, 'proyectos'), profTabMatch: 'proyectos' },
    { id: 'org-equipos', label: 'Equipos', iconName: 'users', href: orgHref(id, 'equipos'), profTabMatch: 'equipos' },
    { id: 'org-red', label: 'Red', iconName: 'share', href: orgHref(id, 'red'), profTabMatch: 'red' },
    { id: 'org-admin', label: 'Administración', iconName: 'settings', href: `#/org/${id}/admin`, routeMatch: 'org-admin', orgAdminTabMatch: 'admin' },
    {
      id: 'org-invitar',
      label: 'Invitar miembros',
      iconName: 'mail',
      href: `#/org/${id}/admin/invitar`,
      routeMatch: 'org-admin',
      orgAdminTabMatch: 'invitar',
      visible: (c) => isOrgAdminRole(c.membershipRole),
    },
    {
      id: 'org-apariencia',
      label: 'Apariencia',
      iconName: 'sun',
      href: `#/org/${id}/admin/apariencia`,
      routeMatch: 'org-admin',
      orgAdminTabMatch: 'apariencia',
      visible: (c) => isOrgAdminRole(c.membershipRole),
    },
  ];
}

const SETTINGS_CHILDREN: NavItemDef[] = [
  { id: 'set-profesional', label: 'Profesional', iconName: 'briefcase', href: '#/settings?section=profesional', settingsSectionMatch: 'profesional' },
  { id: 'set-empresa', label: 'Empresa', iconName: 'building', href: '#/settings?section=empresa', settingsSectionMatch: 'empresa' },
  { id: 'set-ia', label: 'IA', iconName: 'brain', href: '#/settings?section=ia', settingsSectionMatch: 'ia' },
  { id: 'set-modulos', label: 'Módulos', iconName: 'receipt', href: '#/settings?section=modulos', settingsSectionMatch: 'modulos' },
  { id: 'set-apariencia', label: 'Apariencia', iconName: 'sun', href: '#/settings?section=apariencia', settingsSectionMatch: 'apariencia' },
];

export function isOrgAdminRole(role?: OrgRole): boolean {
  return role === 'org_owner' || role === 'org_admin';
}

export function buildNavTree(ctx: NavContext): NavItemDef[] {
  const inOrgContext = Boolean(ctx.orgId && (ctx.route === 'org' || ctx.route === 'org-admin'));

  const empresaItem: NavItemDef = inOrgContext
    ? {
        id: 'empresa',
        label: ctx.org?.branding?.displayName ?? ctx.org?.name ?? 'Empresa',
        iconName: 'building',
        href: '#/empresa',
        routeMatch: ['org', 'org-admin'],
        children: orgWorkspaceChildren(ctx),
      }
    : {
        id: 'empresa',
        label: 'Empresa',
        iconName: 'building',
        href: '#/empresa',
        routeMatch: 'empresa',
      };

  return [
    { id: 'home', label: 'Inicio', iconName: 'home', href: '#/', routeMatch: 'home' },
    {
      id: 'profesional',
      label: 'Profesional',
      iconName: 'briefcase',
      href: '#/profesional',
      routeMatch: ['profesional', 'profesional-meeting'],
      children: PROFESIONAL_CHILDREN,
    },
    empresaItem,
    { id: 'facturas', label: 'Facturas', iconName: 'receipt', href: '#/facturas', routeMatch: 'facturas' },
    {
      id: 'settings',
      label: 'Ajustes',
      iconName: 'settings',
      href: '#/settings',
      routeMatch: 'settings',
      children: SETTINGS_CHILDREN,
    },
  ];
}

export function isNavItemActive(item: NavItemDef, ctx: NavContext): boolean {
  if (item.profTabMatch) {
    if (ctx.route === 'profesional' && ctx.profTab === item.profTabMatch) return true;
    if (ctx.route === 'org' && ctx.profTab === item.profTabMatch) return true;
    if (item.profTabMatch === 'reuniones' && ctx.route === 'profesional-meeting') return true;
  }
  if (item.orgAdminTabMatch && ctx.route === 'org-admin') {
    const tab = ctx.orgAdminTab ?? 'admin';
    return tab === item.orgAdminTabMatch;
  }
  if (item.settingsSectionMatch && ctx.route === 'settings') {
    const sec = ctx.settingsSection ?? 'profesional';
    return sec === item.settingsSectionMatch;
  }
  if (item.routeMatch) {
    const routes = Array.isArray(item.routeMatch) ? item.routeMatch : [item.routeMatch];
    if (routes.includes(ctx.route)) {
      if (item.id === 'org-admin' && ctx.route === 'org-admin' && (ctx.orgAdminTab ?? 'admin') !== 'admin') return false;
      if (item.children?.length && !item.profTabMatch && !item.orgAdminTabMatch && !item.settingsSectionMatch) {
        return routes.includes(ctx.route);
      }
      return true;
    }
  }
  return false;
}

export function isNavGroupActive(item: NavItemDef, ctx: NavContext): boolean {
  if (isNavItemActive(item, ctx)) return true;
  if (item.children) {
    return item.children.some((c) => isNavItemActive(c, ctx) || (c.visible?.(ctx) !== false && isNavGroupActive(c, ctx)));
  }
  return false;
}

export function resolveNavHref(item: NavItemDef, ctx: NavContext): string {
  if (typeof item.href === 'function') return item.href(ctx);
  return item.href ?? '#';
}

export function membershipRoleForOrg(memberships: UserMembership[], orgId: string): OrgRole | undefined {
  return memberships.find((m) => m.orgId === orgId)?.role;
}
