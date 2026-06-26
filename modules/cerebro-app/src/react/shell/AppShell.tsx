import { NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { APP_VERSION } from '@shared/app-version.js';
import { logout } from '../../lib/firebase.js';
import { orgDisplayName, orgInitials } from '../../lib/org-branding.js';
import { Icon } from '../ds.js';
import { GlobalSyncPanel } from '../components/SyncControls.js';
import { CerebroAmbientLayer } from '../components/cerebro/CerebroAmbientLayer.js';
import { CerebroShell } from '../components/cerebro/CerebroShell.js';
import { qk, useDashboard, useDeviceTimezoneSync, useOrg, useOrgs } from '../hooks.js';
import { api } from '../../lib/api.js';

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  badge?: number;
  mobile?: boolean;
}

function personalNav(badges: { tareas?: number; mantenimiento?: number }): NavEntry[] {
  return [
    { to: '/', label: 'Hoy', icon: 'home', end: true, mobile: true },
    { to: '/buscar', label: 'Buscar', icon: 'search' },
    { to: '/reuniones', label: 'Reuniones', icon: 'calendar', mobile: true },
    { to: '/tareas', label: 'Tareas', icon: 'check', badge: badges.tareas, mobile: true },
    { to: '/personas', label: 'Personas', icon: 'users', mobile: true },
    { to: '/proyectos', label: 'Proyectos', icon: 'folder' },
    { to: '/red', label: 'Red', icon: 'share' },
    { to: '/cerebro', label: 'Cerebro', icon: 'brain' },
    { to: '/empresa', label: 'Empresa', icon: 'building' },
    { to: '/mantenimiento', label: 'Mantenimiento', icon: 'inbox', badge: badges.mantenimiento },
    { to: '/ajustes', label: 'Ajustes', icon: 'settings', mobile: true },
  ];
}

function orgNav(orgId: string, isAdmin: boolean): NavEntry[] {
  const base = `/org/${orgId}`;
  const items: NavEntry[] = [
    { to: base, label: 'Resumen', icon: 'home', end: true, mobile: true },
    { to: `${base}/reuniones`, label: 'Reuniones', icon: 'calendar', mobile: true },
    { to: `${base}/tareas`, label: 'Tareas', icon: 'check', mobile: true },
    { to: `${base}/personas`, label: 'Personas', icon: 'users', mobile: true },
    { to: `${base}/proyectos`, label: 'Proyectos', icon: 'folder' },
    { to: `${base}/red`, label: 'Red', icon: 'share' },
  ];
  if (isAdmin) {
    items.push(
      { to: `${base}/admin`, label: 'Administración', icon: 'settings', end: true, mobile: true },
      { to: `${base}/admin/invitar`, label: 'Invitar', icon: 'mail' },
      { to: `${base}/admin/apariencia`, label: 'Apariencia', icon: 'sun' },
    );
  } else {
    items.push({ to: `${base}/admin`, label: 'Administración', icon: 'settings', end: true, mobile: true });
  }
  return items;
}

const NAV_CEREBRO_TARGETS: Record<string, string> = {
  '/': 'nav.hoy',
  '/buscar': 'nav.buscar',
  '/reuniones': 'nav.reuniones',
  '/tareas': 'nav.tareas',
  '/personas': 'nav.personas',
  '/proyectos': 'nav.proyectos',
  '/mantenimiento': 'nav.mantenimiento',
  '/red': 'nav.red',
  '/cerebro': 'nav.cerebro',
  '/empresa': 'nav.empresa',
  '/ajustes': 'nav.ajustes',
};

function NavEntryLink({ entry }: { entry: NavEntry }) {
  const cerebroTarget = NAV_CEREBRO_TARGETS[entry.to];
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
      data-cerebro-target={cerebroTarget}
    >
      <span className="nav-icon">
        <Icon name={entry.icon} />
      </span>
      <span className="nav-label">{entry.label}</span>
      {entry.badge ? <span className="nav-badge">{entry.badge}</span> : null}
    </NavLink>
  );
}

function WorkspaceSwitcher({ currentOrgId }: { currentOrgId?: string }) {
  const navigate = useNavigate();
  const { data } = useOrgs();
  const memberships = data?.memberships ?? [];
  if (!memberships.length) return null;

  return (
    <div className="app-sidebar-profiles">
      <select
        className="field-input field-input--sm workspace-switcher"
        aria-label="Espacio de trabajo"
        value={currentOrgId ?? 'personal'}
        onChange={(e) => {
          const v = e.target.value;
          navigate(v === 'personal' ? '/' : `/org/${v}`);
        }}
      >
        <option value="personal">Personal</option>
        {memberships.map((m) => (
          <option key={m.orgId} value={m.orgId}>
            {m.orgName}
          </option>
        ))}
      </select>
    </div>
  );
}

function Brand({ orgId, compact }: { orgId?: string; compact?: boolean }) {
  const { data } = useOrg(orgId);
  const org = orgId ? data?.org : undefined;
  const cls = `app-brand${compact ? ' app-brand--compact' : ''}${org ? ' app-brand--org' : ''}`;

  if (org) {
    const name = orgDisplayName(org);
    return (
      <div className={cls}>
        <div className="app-brand-mark app-brand-mark--org">
          {org.branding?.logoUrl ? (
            <img src={org.branding.logoUrl} alt={name} className="app-brand-logo" />
          ) : (
            orgInitials(name)
          )}
        </div>
        <span className="app-brand-text">{name}</span>
      </div>
    );
  }
  return (
    <div className={cls}>
      <div className="app-brand-mark">
        <Icon name="brain" />
      </div>
      <span className="app-brand-text">Cerebro</span>
    </div>
  );
}

async function doLogout() {
  await logout();
  location.hash = '#/login';
  location.reload();
}

export default function AppShell() {
  useDeviceTimezoneSync();
  const orgMatch = useMatch('/org/:orgId/*');
  const orgId = orgMatch?.params.orgId;

  const dashboard = useDashboard();
  const orgQuery = useQuery({
    queryKey: qk.orgs,
    queryFn: api.listOrgs,
    staleTime: 5 * 60_000,
    enabled: Boolean(orgId),
  });
  const role = orgId
    ? orgQuery.data?.memberships.find((m) => m.orgId === orgId)?.role
    : undefined;
  const isAdmin = role === 'org_owner' || role === 'org_admin';

  const nav = orgId
    ? orgNav(orgId, isAdmin)
    : personalNav({
        tareas: dashboard.data?.openTodoCount || undefined,
        mantenimiento: dashboard.data?.maintenanceCount || undefined,
      });

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <Brand orgId={orgId} compact />
        <div className="app-topbar-actions">
          <GlobalSyncPanel compact />
          <button
            type="button"
            className="btn btn-ghost app-logout-btn app-topbar-logout"
            aria-label="Salir"
            onClick={() => void doLogout()}
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <aside className="app-sidebar" aria-label="Navegación lateral">
        <Brand orgId={orgId} />
        <WorkspaceSwitcher currentOrgId={orgId} />
        <div className="app-nav-scroll">
          <nav className="app-nav" aria-label="Principal">
            {orgId ? (
              <NavLink to="/" className="app-nav-link app-nav-link--back" end>
                <span className="nav-icon">
                  <Icon name="chevron" />
                </span>
                <span className="nav-label">Volver a personal</span>
              </NavLink>
            ) : null}
            {nav.map((entry) => (
              <NavEntryLink key={entry.to} entry={entry} />
            ))}
          </nav>
        </div>
        <GlobalSyncPanel />
        <div className="app-sidebar-footer">
          <span className="app-version" title="Versión desplegada">
            v{APP_VERSION}
          </span>
          <button
            type="button"
            className="btn btn-ghost app-logout-btn app-sidebar-logout"
            onClick={() => void doLogout()}
          >
            <Icon name="logout" />
            <span className="app-logout-label">Salir</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-content-view">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="app-bottom-nav" aria-label="Navegación principal">
        {nav
          .filter((e) => e.mobile)
          .map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              className={({ isActive }) => `app-bottom-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon name={entry.icon} />
              <span className="nav-label">{entry.label}</span>
            </NavLink>
          ))}
      </nav>
      <CerebroAmbientLayer />
      <CerebroShell />
    </div>
  );
}
