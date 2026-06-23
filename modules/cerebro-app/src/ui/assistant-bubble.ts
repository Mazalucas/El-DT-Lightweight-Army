import type { User } from 'firebase/auth';
import type { Organization, OrgRole } from '@shared/types.js';
import { buildAssistantPageContext } from '../lib/assistant-context.js';
import { createAssistantChatSession } from '../lib/assistant-chat-session.js';
import {
  getAssistantBadgeState,
  markBubbleOpened,
  type AssistantBadgeState,
} from '../lib/assistant-memory.js';
import { parseRoute } from '../lib/router.js';
import { navigateToAssistant } from '../lib/assistant-nav.js';
import { icon } from './icons.js';

type BubbleState = {
  user: User | null;
  org: Organization | null;
  membershipRole?: OrgRole;
};

let rootEl: HTMLElement | null = null;
let panelOpen = false;
let session: ReturnType<typeof createAssistantChatSession> | null = null;
let state: BubbleState = { user: null, org: null };
let boundRouteHandler: (() => void) | null = null;

function shouldShowBubble(): boolean {
  const { route } = parseRoute();
  return route !== 'login' && route !== 'assistant';
}

function getPageContext() {
  return buildAssistantPageContext({
    user: state.user,
    org: state.org,
    membershipRole: state.membershipRole,
  });
}

function syncBadge(): void {
  if (!rootEl) return;
  const badge = rootEl.querySelector('[data-bubble-badge]') as HTMLElement | null;
  const trigger = rootEl.querySelector('.assistant-bubble-trigger') as HTMLButtonElement | null;
  if (!badge || !trigger) return;

  const badgeState: AssistantBadgeState = panelOpen ? 'none' : getAssistantBadgeState(state.user?.uid);
  badge.hidden = badgeState === 'none';
  badge.classList.remove('assistant-bubble-badge--new', 'assistant-bubble-badge--continued');
  badge.textContent = badgeState === 'new' ? '1' : '';

  if (badgeState === 'new') {
    badge.classList.add('assistant-bubble-badge--new');
    trigger.setAttribute('aria-label', 'Abrir asistente IA — mensaje nuevo');
  } else if (badgeState === 'continued') {
    badge.classList.add('assistant-bubble-badge--continued');
    trigger.setAttribute('aria-label', 'Abrir asistente IA — continuar conversación');
  } else {
    trigger.setAttribute('aria-label', 'Abrir asistente IA');
  }
}

function refreshWelcomeIfEmpty(): void {
  if (!session || !panelOpen) return;
  session.repaintThread();
}

function syncVisibility(): void {
  if (!rootEl) return;
  const visible = shouldShowBubble() && Boolean(state.user);
  rootEl.hidden = !visible;
  if (!visible && panelOpen) {
    setPanelOpen(false);
  }
  syncBadge();
}

function setPanelOpen(open: boolean): void {
  panelOpen = open;
  if (!rootEl) return;

  const panel = rootEl.querySelector('.assistant-bubble-panel') as HTMLElement | null;
  const trigger = rootEl.querySelector('.assistant-bubble-trigger') as HTMLButtonElement | null;
  if (!panel || !trigger) return;

  panel.hidden = !open;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  trigger.classList.toggle('assistant-bubble-trigger--active', open);

  if (open) {
    markBubbleOpened(state.user?.uid);
    syncBadge();
    const input = panel.querySelector('.assistant-input') as HTMLTextAreaElement | null;
    input?.focus();
    refreshWelcomeIfEmpty();
    session?.repaintShortcuts();
  } else {
    syncBadge();
  }
}

function buildPanel(): HTMLElement {
  const panel = document.createElement('section');
  panel.className = 'assistant-bubble-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat con el asistente');
  panel.innerHTML = `
    <header class="assistant-bubble-header">
      <div class="assistant-bubble-header-text">
        <h2 class="assistant-bubble-title">Asistente</h2>
        <p class="assistant-bubble-context muted" data-bubble-context></p>
      </div>
      <div class="assistant-bubble-header-actions">
        <button type="button" class="btn btn-ghost btn-sm assistant-bubble-new" title="Nueva conversación" aria-label="Nueva conversación">
          ${icon('plus')}
        </button>
        <button type="button" class="btn btn-ghost btn-sm assistant-bubble-expand" title="Abrir vista completa" aria-label="Abrir vista completa">
          ${icon('external')}
        </button>
        <button type="button" class="btn btn-ghost btn-sm assistant-bubble-close" aria-label="Cerrar chat">
          ${icon('close')}
        </button>
      </div>
    </header>
    <div class="assistant-status-bar" data-bubble-status role="status" aria-live="polite"></div>
    <div class="assistant-shortcuts" data-bubble-shortcuts hidden></div>
    <div class="assistant-activity" data-bubble-activity hidden></div>
    <div class="assistant-thread assistant-bubble-thread" data-bubble-thread role="log" aria-live="polite"></div>
    <form class="assistant-composer assistant-bubble-composer" data-bubble-form>
      <label class="visually-hidden" for="assistant-bubble-input">Mensaje al asistente</label>
      <textarea id="assistant-bubble-input" class="assistant-input" rows="2" placeholder="Preguntá sobre esta página…" autocomplete="off"></textarea>
      <button type="submit" class="btn btn-primary assistant-send" data-bubble-send aria-label="Enviar">${icon('send')}</button>
    </form>
  `;

  const statusBar = panel.querySelector('[data-bubble-status]') as HTMLElement;
  const shortcutsEl = panel.querySelector('[data-bubble-shortcuts]') as HTMLElement;
  const activityEl = panel.querySelector('[data-bubble-activity]') as HTMLElement;
  const threadEl = panel.querySelector('[data-bubble-thread]') as HTMLElement;
  const form = panel.querySelector('[data-bubble-form]') as HTMLFormElement;
  const input = panel.querySelector('#assistant-bubble-input') as HTMLTextAreaElement;
  const sendBtn = panel.querySelector('[data-bubble-send]') as HTMLButtonElement;

  session = createAssistantChatSession({
    elements: { statusBar, activityEl, threadEl, input, sendBtn, form, shortcutsEl },
    getPageContext,
    showWelcome: true,
    showShortcuts: true,
    getPersistUid: () => state.user?.uid,
    onThreadChange: () => syncBadge(),
  });

  panel.querySelector('.assistant-bubble-new')?.addEventListener('click', () => {
    session?.startNewConversation();
    input.focus();
  });
  panel.querySelector('.assistant-bubble-close')?.addEventListener('click', () => setPanelOpen(false));
  panel.querySelector('.assistant-bubble-expand')?.addEventListener('click', () => {
    setPanelOpen(false);
    navigateToAssistant();
  });

  void session.init().then(() => syncBadge());

  return panel;
}

function updateContextLabel(): void {
  const ctxEl = rootEl?.querySelector('[data-bubble-context]') as HTMLElement | null;
  if (!ctxEl) return;
  const ctx = getPageContext();
  ctxEl.textContent = ctx.pageTitle;
  ctxEl.title = ctx.pageDescription ?? ctx.pageTitle;
}

function ensureRoot(): HTMLElement {
  if (rootEl) return rootEl;

  rootEl = document.createElement('div');
  rootEl.className = 'assistant-bubble-root';
  rootEl.hidden = true;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'assistant-bubble-trigger';
  trigger.setAttribute('aria-label', 'Abrir asistente IA');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    ${icon('brain')}
    <span class="assistant-bubble-trigger-label">IA</span>
    <span class="assistant-bubble-badge" data-bubble-badge hidden aria-hidden="true"></span>
  `;
  trigger.addEventListener('click', () => setPanelOpen(!panelOpen));

  const panel = buildPanel();
  rootEl.append(trigger, panel);
  document.body.appendChild(rootEl);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panelOpen) setPanelOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!panelOpen || !rootEl) return;
    const target = e.target as Node;
    if (!rootEl.contains(target)) setPanelOpen(false);
  });

  boundRouteHandler = () => {
    syncVisibility();
    updateContextLabel();
    if (panelOpen) {
      refreshWelcomeIfEmpty();
      session?.repaintShortcuts();
    }
  };
  window.addEventListener('hashchange', boundRouteHandler);

  return rootEl;
}

export function mountAssistantBubble(): void {
  ensureRoot();
  syncVisibility();
  updateContextLabel();
  syncBadge();
}

export function updateAssistantBubbleContext(opts: {
  user: User | null;
  org?: Organization | null;
  membershipRole?: OrgRole;
}): void {
  state = {
    user: opts.user,
    org: opts.org ?? null,
    membershipRole: opts.membershipRole,
  };
  ensureRoot();
  syncVisibility();
  updateContextLabel();
  if (session && state.user?.uid) {
    void session.restoreSavedConversation().then(() => syncBadge());
    session.repaintShortcuts();
  } else {
    syncBadge();
  }
}

export function teardownAssistantBubble(): void {
  if (boundRouteHandler) {
    window.removeEventListener('hashchange', boundRouteHandler);
    boundRouteHandler = null;
  }
  rootEl?.remove();
  rootEl = null;
  session = null;
  panelOpen = false;
  state = { user: null, org: null };
}

export function isAssistantBubbleOpen(): boolean {
  return panelOpen;
}

/** Actualiza el badge del bubble (p. ej. tras chatear en la vista completa). */
export function refreshAssistantBubbleBadge(): void {
  syncBadge();
}
