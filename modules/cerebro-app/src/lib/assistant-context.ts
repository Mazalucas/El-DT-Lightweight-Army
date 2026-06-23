import type { User } from 'firebase/auth';
import type { Organization, OrgRole } from '@shared/types.js';
import { orgDisplayName } from './org-branding.js';
import { parseRoute, type ProfTab, type Route } from './router.js';

export type AssistantPageContext = {
  route: Route;
  pageTitle: string;
  pageDescription?: string;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  orgRole?: OrgRole;
  profTab?: ProfTab;
  meetingId?: string;
  settingsSection?: string;
  orgId?: string;
};

const PROF_TAB_LABELS: Record<ProfTab, string> = {
  dashboard: 'Tablero',
  tablero: 'Tablero',
  inbox: 'Tablero',
  reuniones: 'Reuniones',
  contactos: 'Contactos',
  proyectos: 'Proyectos',
  equipos: 'Equipos',
  tareas: 'Tablero',
  red: 'Red',
};

const SETTINGS_SECTION_LABELS: Record<string, string> = {
  profesional: 'Profesional',
  empresa: 'Empresa',
  ia: 'IA',
  modulos: 'Módulos',
  apariencia: 'Apariencia',
};

const ORG_ROLE_LABELS: Partial<Record<OrgRole, string>> = {
  org_owner: 'Propietario',
  org_admin: 'Administrador',
  org_member: 'Miembro',
};

function firstName(name: string | undefined): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  return trimmed.split(/\s+/)[0];
}

export function buildAssistantPageContext(opts?: {
  user?: User | null;
  org?: Organization | null;
  membershipRole?: OrgRole;
}): AssistantPageContext {
  const parsed = parseRoute();
  const { route } = parsed;
  const user = opts?.user ?? null;
  const org = opts?.org ?? null;

  const userName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : undefined);
  const userEmail = user?.email ?? undefined;
  const orgName = org ? orgDisplayName(org) : undefined;

  let pageTitle = 'Cerebro';
  let pageDescription: string | undefined;

  switch (route) {
    case 'home':
      pageTitle = 'Inicio';
      pageDescription = 'Panel principal con accesos rápidos y estado del cerebro.';
      break;
    case 'profesional':
      pageTitle = `Profesional · ${PROF_TAB_LABELS[parsed.profTab ?? 'dashboard']}`;
      pageDescription = `Sección profesional personal — pestaña ${PROF_TAB_LABELS[parsed.profTab ?? 'dashboard'].toLowerCase()}.`;
      break;
    case 'profesional-meeting':
      pageTitle = 'Detalle de reunión';
      pageDescription = parsed.param
        ? `Viendo la reunión ${parsed.param}. Podés preguntar sobre participantes, notas o acciones.`
        : 'Detalle de una reunión.';
      break;
    case 'assistant':
      pageTitle = 'Asistente';
      pageDescription = 'Chat completo con historial y sugerencias.';
      break;
    case 'facturas':
      pageTitle = 'Facturas';
      pageDescription = 'Módulo de facturación autónomo.';
      break;
    case 'empresa':
      pageTitle = orgName ? `Empresa · ${orgName}` : 'Empresa';
      pageDescription = 'Espacios de organización y membresías.';
      break;
    case 'org':
      pageTitle = orgName
        ? `${orgName} · ${PROF_TAB_LABELS[parsed.profTab ?? 'dashboard']}`
        : `Organización · ${PROF_TAB_LABELS[parsed.profTab ?? 'dashboard']}`;
      pageDescription = `Workspace compartido — pestaña ${PROF_TAB_LABELS[parsed.profTab ?? 'dashboard'].toLowerCase()}.`;
      break;
    case 'org-admin':
      pageTitle = orgName ? `${orgName} · Administración` : 'Administración';
      pageDescription = 'Configuración y miembros de la organización.';
      break;
    case 'settings':
      pageTitle = `Ajustes · ${SETTINGS_SECTION_LABELS[parsed.settingsSection ?? 'profesional'] ?? 'General'}`;
      pageDescription = 'Preferencias de cuenta, IA, módulos y apariencia.';
      break;
    case 'join':
      pageTitle = 'Unirse a organización';
      break;
    default:
      break;
  }

  return {
    route,
    pageTitle,
    pageDescription,
    userName,
    userEmail,
    orgName,
    orgRole: opts?.membershipRole,
    profTab: parsed.profTab,
    meetingId: parsed.param,
    settingsSection: parsed.settingsSection,
    orgId: parsed.orgId,
  };
}

export function assistantWelcomeMessage(ctx: AssistantPageContext): string {
  const name = firstName(ctx.userName);
  const greeting = name ? `Hola, ${name}.` : 'Hola.';

  if (ctx.route === 'profesional-meeting') {
    return `${greeting} Estás viendo una reunión. ¿Querés un resumen, participantes o tareas pendientes?`;
  }

  if (ctx.profTab === 'contactos') {
    return `${greeting} Estás en Contactos. ¿Buscamos alguien, revisamos prospects o armamos un resumen?`;
  }
  if (ctx.profTab === 'reuniones') {
    return `${greeting} Estás en Reuniones. ¿Listamos las últimas o buscamos por tema?`;
  }
  if (ctx.profTab === 'tablero' || ctx.profTab === 'inbox' || ctx.profTab === 'tareas') {
    return `${greeting} Estás en el Tablero Kanban. ¿Revisamos sugerencias, movemos tareas o creamos una nueva?`;
  }
  if (ctx.route === 'home') {
    return `${greeting} ¿Qué querés hacer hoy en tu cerebro?`;
  }
  if (ctx.route === 'settings' && ctx.settingsSection === 'ia') {
    return `${greeting} Estás en Ajustes de IA. ¿Te ayudo a configurar el proveedor o a probar el asistente?`;
  }

  return `${greeting} Estás en ${ctx.pageTitle}. ¿En qué te ayudo?`;
}

export function formatPageContextForApi(ctx: AssistantPageContext): AssistantPageContext {
  return { ...ctx };
}
