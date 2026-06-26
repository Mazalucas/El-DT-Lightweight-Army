import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/responsive.css';
import { initTheme, loadThemePreference } from './lib/theme.js';
import { watchAuth, auth } from './lib/firebase.js';
import {
  getContentInner,
  getContentView,
  getLayout,
  isRenderCurrent,
  nextRenderGeneration,
  resolveOrgContext,
  setShellNodes,
  teardownShell,
} from './lib/app-runtime.js';
import { parseRoute, onRouteChange, navigate } from './lib/router.js';
import { renderLogin } from './app/login.js';
import { buildNavContextFromRoute, createAppShell, updateAppShell } from './app/shell.js';
import { renderHome } from './app/home.js';
import { renderSettings } from './app/settings.js';
import { renderProfesional, renderMeetingDetail } from './app/profesional.js';
import { renderJoin } from './app/org-join.js';
import { renderOrgAdmin } from './app/org-admin.js';
import { renderOrgProfesional } from './app/org-profesional.js';
import { renderEmpresa } from './app/empresa.js';
import { renderAssistant } from './app/assistant.js';
import { hideContentLoading, showContentLoading } from './ui/brain-loader.js';
import {
  mountAssistantBubble,
  teardownAssistantBubble,
  updateAssistantBubbleContext,
} from './ui/assistant-bubble.js';

initTheme(loadThemePreference());

const root = document.getElementById('app')!;

const LOADING_LABELS: Partial<Record<string, string>> = {
  home: 'Inicio',
  profesional: 'Profesional',
  'profesional-meeting': 'Reunión',
  settings: 'Ajustes',
  assistant: 'Asistente',
  empresa: 'Empresa',
  org: 'Espacio org',
  'org-admin': 'Administración',
  join: 'Unirse',
};

function loadingLabel(route: string): string {
  const name = LOADING_LABELS[route] ?? 'Cargando';
  return `${name}…`;
}

async function renderRouteContent(container: HTMLElement, parsed: ReturnType<typeof parseRoute>): Promise<void> {
  switch (parsed.route) {
    case 'home':
      renderHome(container);
      break;
    case 'settings':
      await renderSettings(container);
      break;
    case 'profesional':
      await renderProfesional(container);
      break;
    case 'profesional-meeting':
      if (parsed.param) await renderMeetingDetail(container, parsed.param);
      break;
    case 'assistant':
      await renderAssistant(container);
      break;
    case 'empresa':
      await renderEmpresa(container);
      break;
    case 'join':
      if (parsed.param) await renderJoin(container, parsed.param);
      break;
    case 'org-admin':
      if (parsed.orgId) await renderOrgAdmin(container, parsed.orgId, parsed.orgAdminTab ?? 'admin');
      break;
    case 'org':
      if (parsed.orgId) await renderOrgProfesional(container, parsed.orgId, parsed.profTab ?? 'dashboard');
      break;
    default:
      renderHome(container);
  }
}

async function render(): Promise<void> {
  const gen = nextRenderGeneration();
  const parsed = parseRoute();

  if (parsed.route === 'login') {
    teardownAssistantBubble();
    teardownShell();
    root.replaceChildren();
    await renderLogin(root, () => {
      navigate('home');
      void render();
    });
    return;
  }

  const orgCtx = await resolveOrgContext(parsed.route, parsed.orgId);
  if (!isRenderCurrent(gen)) return;

  const navCtx = buildNavContextFromRoute(parsed, orgCtx.org, orgCtx.membershipRole);
  let layout = getLayout();
  let contentView = getContentView();
  let contentInner = getContentInner();

  if (!layout || !contentView || !contentInner) {
    contentView = document.createElement('div');
    contentView.className = 'app-content-view';
    contentInner = document.createElement('div');
    contentInner.className = 'app-content-inner';
    contentView.appendChild(contentInner);
    layout = createAppShell(contentView, { ctx: navCtx, org: orgCtx.org });
    setShellNodes(layout, contentView, contentInner);
    root.replaceChildren(layout);
  } else {
    updateAppShell(layout, { ctx: navCtx, org: orgCtx.org });
  }

  updateAssistantBubbleContext({
    user: auth.currentUser,
    org: orgCtx.org,
    membershipRole: orgCtx.membershipRole,
  });
  mountAssistantBubble();

  showContentLoading(contentView!, loadingLabel(parsed.route));

  try {
    await renderRouteContent(contentInner!, parsed);
  } finally {
    if (isRenderCurrent(gen)) hideContentLoading(contentView!);
  }
}

watchAuth((user) => {
  const { route } = parseRoute();
  if (!user && route !== 'login') {
    navigate('login');
  }
  if (user && route === 'login') {
    navigate('home');
  }
  void render();
});

onRouteChange(() => {
  void render();
});

if (!location.hash) {
  navigate('home');
}
