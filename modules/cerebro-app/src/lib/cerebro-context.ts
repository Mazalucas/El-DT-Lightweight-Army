import type { User } from 'firebase/auth';
import type { Organization, OrgRole, UserAppSettings } from '@shared/types.js';
import type { CerebroClientContextInput, CerebroViewport, MomentCardBlock } from '@shared/cerebro-chat.js';
import { resolveMomentKey } from '@shared/cerebro-chat.js';
import { resolveClientTimezone } from '@shared/timezone.js';
import { listUiTargetsForRoute } from '@shared/cerebro-ui-registry.js';
import { parseEntityDomId, type EntityRef } from '@shared/cerebro-elements.js';
import { orgDisplayName } from './org-branding.js';

function firstName(name: string | undefined): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  return trimmed.split(/\s+/)[0];
}

function pageMetaFromPath(pathname: string, search: string): {
  route: string;
  pageTitle: string;
  pageDescription?: string;
  meetingId?: string;
  orgId?: string;
  settingsSection?: string;
} {
  const parts = pathname.split('/').filter(Boolean);
  const head = parts[0] ?? 'home';
  const params = new URLSearchParams(search);

  if (head === 'home' || pathname === '/' || !head) {
    return { route: 'home', pageTitle: 'Hoy', pageDescription: 'Panel del día y accesos rápidos.' };
  }
  if (head === 'buscar') return { route: 'buscar', pageTitle: 'Buscar', pageDescription: 'Búsqueda global.' };
  if (head === 'reuniones') {
    if (parts[1]) {
      return {
        route: 'reunion-detalle',
        pageTitle: 'Detalle de reunión',
        pageDescription: `Reunión ${parts[1]}`,
        meetingId: parts[1],
      };
    }
    return { route: 'reuniones', pageTitle: 'Reuniones', pageDescription: 'Lista de reuniones.' };
  }
  if (head === 'tareas') return { route: 'tareas', pageTitle: 'Tareas', pageDescription: 'Tablero Kanban.' };
  if (head === 'personas') return { route: 'personas', pageTitle: 'Personas', pageDescription: 'Contactos y prospects.' };
  if (head === 'proyectos') return { route: 'proyectos', pageTitle: 'Proyectos', pageDescription: 'Proyectos y equipos.' };
  if (head === 'red') return { route: 'red', pageTitle: 'Red', pageDescription: 'Grafo de relaciones.' };
  if (head === 'cerebro' || head === 'asistente') {
    return { route: 'cerebro', pageTitle: 'Cerebro', pageDescription: 'Chat con historial.' };
  }
  if (head === 'ajustes') {
    const section = params.get('section') ?? undefined;
    const sectionLabel =
      section === 'ia'
        ? 'IA'
        : section === 'cerebro'
          ? 'Cerebro'
          : section === 'empresa'
            ? 'Empresa'
            : section === 'apariencia'
              ? 'Apariencia'
              : section === 'regional'
                ? 'Regional'
                : 'Profesional';
    return {
      route: 'ajustes',
      pageTitle: `Ajustes · ${sectionLabel}`,
      pageDescription: 'Preferencias de cuenta.',
      settingsSection: section,
    };
  }
  if (head === 'empresa') return { route: 'empresa', pageTitle: 'Empresa', pageDescription: 'Organizaciones.' };
  if (head === 'mantenimiento') {
    return { route: 'mantenimiento', pageTitle: 'Mantenimiento', pageDescription: 'Sugerencias de limpieza.' };
  }
  if (head === 'org' && parts[1]) {
    const orgId = parts[1];
    const sub = parts[2];
    if (sub === 'admin') {
      return { route: 'org-admin', pageTitle: 'Administración', orgId, pageDescription: 'Config org.' };
    }
    const tabTitles: Record<string, string> = {
      reuniones: 'Reuniones',
      tareas: 'Tareas',
      personas: 'Personas',
      proyectos: 'Proyectos',
      red: 'Red',
    };
    const tab = sub ?? 'resumen';
    return {
      route: 'org',
      pageTitle: tabTitles[tab] ?? 'Resumen',
      orgId,
      pageDescription: 'Workspace compartido.',
    };
  }
  return { route: head, pageTitle: head.charAt(0).toUpperCase() + head.slice(1) };
}

export function collectVisibleCerebroTargets(): string[] {
  const fromDom = [...document.querySelectorAll('[data-cerebro-target]')]
    .map((el) => el.getAttribute('data-cerebro-target'))
    .filter((id): id is string => Boolean(id));
  return [...new Set(fromDom)];
}

export function collectVisibleEntities(limit = 40): EntityRef[] {
  const refs: EntityRef[] = [];
  for (const el of document.querySelectorAll('[data-cerebro-entity]')) {
    const raw = el.getAttribute('data-cerebro-entity');
    if (!raw) continue;
    const ref = parseEntityDomId(raw);
    if (ref) refs.push(ref);
    if (refs.length >= limit) break;
  }
  return refs;
}

export function inferVisibleTargets(route: string): string[] {
  const dom = collectVisibleCerebroTargets();
  if (dom.length) return dom;
  return listUiTargetsForRoute(route).map((t) => t.id);
}

export function buildCerebroClientContext(opts: {
  pathname: string;
  search: string;
  hash: string;
  user?: User | null;
  org?: Organization | null;
  membershipRole?: OrgRole;
  viewport?: CerebroViewport;
  conversationId?: string;
  focusTopic?: string;
  preferences?: import('@shared/cerebro-chat.js').CerebroPreferences;
  settings?: UserAppSettings | null;
  focusedEntity?: EntityRef | null;
  visibleEntities?: EntityRef[];
  meetingPrepFocus?: CerebroClientContextInput['navigation']['meetingPrepFocus'];
}): CerebroClientContextInput {
  const meta = pageMetaFromPath(opts.pathname, opts.search);
  const user = opts.user ?? null;
  const org = opts.org ?? null;
  const displayName = user?.displayName?.trim();
  const fn = firstName(displayName) ?? (user?.email ? user.email.split('@')[0] : 'Usuario');

  return {
    navigation: {
      route: meta.route,
      hash: opts.hash || `#${opts.pathname}`,
      pageTitle: meta.pageTitle,
      pageDescription: meta.pageDescription,
      meetingId: meta.meetingId,
      orgId: meta.orgId,
      settingsSection: meta.settingsSection,
      viewport: opts.viewport ?? (window.innerWidth < 768 ? 'mobile' : 'desktop'),
      focusedEntity: opts.focusedEntity ?? undefined,
      visibleEntities: opts.visibleEntities?.length ? opts.visibleEntities : collectVisibleEntities(),
      meetingPrepFocus: opts.meetingPrepFocus,
    },
    user: {
      firstName: fn,
      displayName: displayName ?? undefined,
      email: user?.email ?? undefined,
      orgName: org ? orgDisplayName(org) : undefined,
      orgRole: opts.membershipRole,
      timezone: resolveClientTimezone(opts.settings ?? undefined),
    },
    ambient: {
      visibleTargets: inferVisibleTargets(meta.route),
    },
    conversation: opts.conversationId
      ? { id: opts.conversationId, focusTopic: opts.focusTopic }
      : undefined,
    preferences: opts.preferences,
  };
}

export function cerebroWelcomeMessage(pageTitle: string, firstName?: string): string {
  const name = firstName?.trim();
  const greeting = name ? `Hola, ${name}.` : 'Hola.';
  return `${greeting} Estás en ${pageTitle}. ¿En qué te ayudo?`;
}

const DISMISSED_KEY = 'cerebro-dismissed-moments';
const DELIVERED_KEY = 'cerebro-delivered-moments';

export { resolveMomentKey, cerebroMomentKey } from '@shared/cerebro-chat.js';

export function loadDismissedMoments(): string[] {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function dismissMoment(key: string): void {
  const list = loadDismissedMoments();
  if (!list.includes(key)) list.push(key);
  sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(list.slice(-50)));
}

/** @deprecated Use cerebroMomentKey from @shared/cerebro-chat */
export function momentDismissKey(kind: string, eventId?: string): string {
  return eventId ? `${kind}:${eventId}` : kind;
}

function loadDeliveredMoments(): string[] {
  try {
    const raw = sessionStorage.getItem(DELIVERED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markMomentDelivered(key: string): void {
  const list = loadDeliveredMoments();
  if (!list.includes(key)) list.push(key);
  sessionStorage.setItem(DELIVERED_KEY, JSON.stringify(list.slice(-50)));
}

export function shouldSurfaceProactiveMoment(block: MomentCardBlock): boolean {
  const key = resolveMomentKey(block);
  if (loadDismissedMoments().includes(key)) return false;
  if (loadDeliveredMoments().includes(key)) return false;
  return true;
}
