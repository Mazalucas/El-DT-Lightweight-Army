export type Route =
  | 'login'
  | 'home'
  | 'settings'
  | 'profesional'
  | 'profesional-meeting'
  | 'facturas'
  | 'empresa'
  | 'assistant'
  | 'join'
  | 'org'
  | 'org-admin';

export type ProfTab =
  | 'dashboard'
  | 'tablero'
  | 'inbox'
  | 'reuniones'
  | 'contactos'
  | 'proyectos'
  | 'equipos'
  | 'tareas'
  | 'red';

function normalizeProfTab(tab: ProfTab | undefined): ProfTab {
  const t = tab ?? 'dashboard';
  if (t === 'inbox' || t === 'tareas') return 'tablero';
  return t;
}

export type OrgAdminTab = 'admin' | 'invitar' | 'apariencia';

export function parseRoute(): {
  route: Route;
  param?: string;
  profTab?: ProfTab;
  orgId?: string;
  orgAdminTab?: OrgAdminTab;
  settingsTab?: string;
  settingsSection?: string;
} {
  const raw = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0]!;
  const parts = raw.split('/').filter(Boolean);
  const head = parts[0] || 'home';

  const qs = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const settingsTab = qs.get('tab') ?? undefined;
  const settingsSection = qs.get('section') ?? undefined;

  if (head === 'meeting' && parts[1]) return { route: 'profesional-meeting', param: parts[1] };
  if (head === 'join' && parts[1]) return { route: 'join', param: parts[1] };
  if (head === 'org' && parts[1] && parts[2] === 'admin') {
    const sub = parts[3] as OrgAdminTab | undefined;
    const orgAdminTab: OrgAdminTab =
      sub === 'invitar' || sub === 'apariencia' ? sub : 'admin';
    return { route: 'org-admin', orgId: parts[1], orgAdminTab };
  }
  if (head === 'org' && parts[1]) {
    const orgTab = normalizeProfTab(parts[2] as ProfTab | undefined);
    return { route: 'org', orgId: parts[1], profTab: orgTab };
  }

  if (head === 'profesional') {
    const tab = normalizeProfTab(parts[1] as ProfTab | undefined);
    return { route: 'profesional', profTab: tab };
  }
  if (head === 'facturas') return { route: 'facturas' };
  if (head === 'assistant') return { route: 'assistant' };
  if (head === 'empresa') return { route: 'empresa' };
  if (head === 'settings') return { route: 'settings', settingsTab, settingsSection };
  if (head === 'login') return { route: 'login' };
  return { route: 'home' };
}

export function navigate(
  route: Route,
  param?: string,
  extra?: { profTab?: ProfTab; orgId?: string; orgAdminTab?: OrgAdminTab },
): void {
  if (route === 'profesional-meeting' && param) {
    location.hash = `#/meeting/${param}`;
    return;
  }
  if (route === 'join' && param) {
    location.hash = `#/join/${param}`;
    return;
  }
  if (route === 'org-admin' && extra?.orgId) {
    const tab = extra.orgAdminTab ?? 'admin';
    location.hash =
      tab === 'admin' ? `#/org/${extra.orgId}/admin` : `#/org/${extra.orgId}/admin/${tab}`;
    return;
  }
  if (route === 'org' && extra?.orgId) {
    const tab = normalizeProfTab(extra?.profTab);
    location.hash = tab === 'dashboard' ? `#/org/${extra.orgId}` : `#/org/${extra.orgId}/${tab}`;
    return;
  }
  if (route === 'profesional') {
    const tab = normalizeProfTab(extra?.profTab);
    location.hash = tab === 'dashboard' ? '#/profesional' : `#/profesional/${tab}`;
    return;
  }
  if (route === 'home') {
    location.hash = '#/';
    return;
  }
  location.hash = `#/${route}`;
}

export function onRouteChange(cb: () => void): void {
  window.addEventListener('hashchange', cb);
}
