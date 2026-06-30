import { api } from './api.js';
import { labelForTool } from './assistant-catalog.js';
import type { AssistantPageContext } from './assistant-context.js';
import { assistantWelcomeMessage } from './assistant-context.js';
import {
  clearSavedConversationId,
  getSavedConversationId,
  markSavedThread,
  recordAssistantReply,
  recordPromptUsage,
  recordToolUsage,
  saveConversationId,
  saveConversationMeta,
} from './assistant-memory.js';
import { buildAssistantShortcuts, paintAssistantShortcuts } from './assistant-shortcuts.js';
import {
  createToolRunCard,
  type ToolRun,
  updateToolRunCard,
} from './assistant-tool-ui.js';
import { escapeHtml, formatDate } from './ui.js';
import { setMarkdownContent } from './render-markdown.js';
import { icon } from '../ui/icons.js';
import { button, emptyState } from '../ui/primitives.js';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools?: string[];
  toolRuns?: ToolRun[];
};

type ConversationListItem = { id: string; title: string; updatedAt: string };

export type AssistantChatSessionElements = {
  statusBar: HTMLElement;
  activityEl: HTMLElement;
  threadEl: HTMLElement;
  input: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  form: HTMLFormElement;
  convListEl?: HTMLElement;
  shortcutsEl?: HTMLElement;
};

export type AssistantChatSessionOptions = {
  elements: AssistantChatSessionElements;
  getPageContext: () => AssistantPageContext;
  showWelcome?: boolean;
  showConversationList?: boolean;
  showShortcuts?: boolean;
  getPersistUid?: () => string | undefined;
  onThreadChange?: () => void;
  onOpenSettings?: () => void;
};

export type AssistantChatSession = {
  init: () => Promise<void>;
  startNewConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  refreshSidebar: () => Promise<void>;
  repaintThread: () => void;
  repaintShortcuts: () => void;
  restoreSavedConversation: () => Promise<void>;
  isLlmConfigured: () => boolean;
};

function toolRunFromApi(
  name: string,
  args?: Record<string, unknown>,
  result?: unknown,
): ToolRun {
  const hasError = result && typeof result === 'object' && 'error' in (result as Record<string, unknown>);
  return {
    name,
    args,
    result,
    status: hasError ? 'error' : 'done',
  };
}

export function createAssistantChatSession(opts: AssistantChatSessionOptions): AssistantChatSession {
  const {
    elements,
    getPageContext,
    showWelcome = false,
    showConversationList = false,
    showShortcuts = false,
    getPersistUid,
    onThreadChange,
    onOpenSettings,
  } = opts;
  const { statusBar, activityEl, threadEl, input, sendBtn, form, convListEl, shortcutsEl } = elements;

  let llmConfigured = false;
  let conversations: ConversationListItem[] = [];
  let activeConversationId: string | undefined;
  const messages: ChatMessage[] = [];
  let streaming = false;

  function uid(): string | undefined {
    return getPersistUid?.();
  }

  function persistConversation(updatedAt?: string): void {
    const id = uid();
    if (!id) return;
    saveConversationId(id, activeConversationId);
    if (updatedAt) saveConversationMeta(id, { updatedAt });
  }

  function paintShortcuts(): void {
    if (!shortcutsEl || !showShortcuts) return;
    const shortcuts = buildAssistantShortcuts(getPageContext(), uid());
    paintAssistantShortcuts(shortcutsEl, shortcuts, (prompt) => {
      input.value = prompt;
      if (llmConfigured) void sendMessage(prompt);
      else input.focus();
    });
  }

  function appendToolRunsToBubble(bubble: HTMLElement, toolRuns: ToolRun[]): void {
    if (!toolRuns.length) return;
    let toolsHost = bubble.querySelector('.assistant-bubble-tools-panel') as HTMLElement | null;
    if (!toolsHost) {
      toolsHost = document.createElement('div');
      toolsHost.className = 'assistant-bubble-tools-panel';
      const body = bubble.querySelector('.assistant-bubble-body');
      if (body) bubble.insertBefore(toolsHost, body);
      else bubble.appendChild(toolsHost);
    }
    toolsHost.replaceChildren();
    toolRuns.forEach((run) => toolsHost!.appendChild(createToolRunCard(run)));
  }

  function setStatus(text: string, tone: 'default' | 'warn' | 'ok' = 'default'): void {
    statusBar.className = `assistant-status-bar assistant-status-bar--${tone}`;
    statusBar.textContent = text;
  }

  function paintThread(): void {
    threadEl.replaceChildren();
    if (!messages.length) {
      if (showWelcome) {
        const ctx = getPageContext();
        const welcome = document.createElement('article');
        welcome.className = 'assistant-bubble assistant-bubble--assistant assistant-bubble--welcome';
        welcome.innerHTML = `
          <div class="assistant-bubble-meta">Asistente</div>
          <div class="assistant-bubble-body">${escapeHtml(assistantWelcomeMessage(ctx))}</div>
        `;
        threadEl.appendChild(welcome);
        paintShortcuts();
        return;
      }
      threadEl.appendChild(
        emptyState(
          llmConfigured ? 'Hablá con tus datos' : 'Configurá tu IA primero',
          llmConfigured
            ? 'Escribí en lenguaje natural o elegí una sugerencia.'
            : 'Necesitás una API key en Ajustes → IA.',
          llmConfigured
            ? undefined
            : button('Ir a Ajustes IA', {
                variant: 'secondary',
                onClick: () => {
                  if (onOpenSettings) onOpenSettings();
                  else {
                    location.hash = '#/settings?section=ia';
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  }
                },
              }),
        ),
      );
      paintShortcuts();
      return;
    }

    messages.forEach((msg) => {
      const row = document.createElement('article');
      row.className = `assistant-bubble assistant-bubble--${msg.role}`;
      const meta = document.createElement('div');
      meta.className = 'assistant-bubble-meta';
      meta.textContent = msg.role === 'user' ? 'Vos' : msg.role === 'assistant' ? 'Asistente' : 'Sistema';
      row.appendChild(meta);

      if (msg.toolRuns?.length) {
        appendToolRunsToBubble(row, msg.toolRuns);
      } else if (msg.tools?.length) {
        const tools = document.createElement('div');
        tools.className = 'assistant-bubble-tools';
        msg.tools.forEach((t) => {
          const chip = document.createElement('span');
          chip.className = 'assistant-tool-chip';
          chip.textContent = labelForTool(t);
          tools.appendChild(chip);
        });
        row.appendChild(tools);
      }

      const body = document.createElement('div');
      body.className = 'assistant-bubble-body md-content';
      setMarkdownContent(body, msg.content);
      row.appendChild(body);
      threadEl.appendChild(row);
    });
    threadEl.scrollTop = threadEl.scrollHeight;
    paintShortcuts();
  }

  function paintConversations(): void {
    if (!convListEl || !showConversationList) return;
    convListEl.replaceChildren();
    if (!conversations.length) {
      const empty = document.createElement('p');
      empty.className = 'muted assistant-conv-empty';
      empty.textContent = 'Sin conversaciones aún.';
      convListEl.appendChild(empty);
      return;
    }
    conversations.forEach((c) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `assistant-conv-item${c.id === activeConversationId ? ' active' : ''}`;
      item.setAttribute('role', 'listitem');
      item.innerHTML = `
        <span class="assistant-conv-title">${escapeHtml(c.title)}</span>
        <span class="assistant-conv-date muted">${escapeHtml(formatDate(c.updatedAt))}</span>
      `;
      item.addEventListener('click', () => void loadConversation(c.id));
      convListEl.appendChild(item);
    });
  }

  function showActivity(toolName: string): void {
    activityEl.hidden = false;
    const chip = document.createElement('span');
    chip.className = 'assistant-activity-chip';
    chip.innerHTML = `${icon('brain')} ${escapeHtml(labelForTool(toolName))}`;
    activityEl.appendChild(chip);
  }

  function clearActivity(): void {
    activityEl.replaceChildren();
    activityEl.hidden = true;
  }

  function notifyThreadChange(): void {
    markSavedThread(uid(), messages.length > 0);
    onThreadChange?.();
  }

  function startNewConversation(): void {
    activeConversationId = undefined;
    if (uid()) clearSavedConversationId(uid());
    messages.length = 0;
    clearActivity();
    paintThread();
    paintConversations();
    input.focus();
    setStatus('Nueva conversación');
    notifyThreadChange();
  }

  async function loadConversation(id: string): Promise<void> {
    try {
      const conv = await api.getAssistantConversation(id);
      activeConversationId = conv.id;
      persistConversation(conv.updatedAt);
      messages.length = 0;
      for (const m of conv.messages ?? []) {
        if (m.role === 'user' || m.role === 'assistant' || m.role === 'system') {
          const toolRuns = m.toolCalls?.map((t) =>
            toolRunFromApi(t.name, t.args, t.result ?? undefined),
          );
          messages.push({
            role: m.role,
            content: m.content,
            tools: m.toolCalls?.map((t) => t.name),
            toolRuns: toolRuns?.length ? toolRuns : undefined,
          });
        }
      }
      paintThread();
      paintConversations();
      setStatus(conv.title);
      notifyThreadChange();

      const assistantMsgs = (conv.messages ?? []).filter((m) => m.role === 'assistant');
      const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
      if (lastAssistant?.createdAt) {
        recordAssistantReply(uid(), lastAssistant.createdAt);
        onThreadChange?.();
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e), 'warn');
    }
  }

  async function refreshSidebar(): Promise<void> {
    if (!showConversationList) return;
    try {
      ({ conversations } = await api.assistantConversations());
      paintConversations();
    } catch {
      /* optional */
    }
  }

  async function sendMessage(text: string): Promise<void> {
    if (!text.trim() || streaming) return;
    if (!llmConfigured) {
      setStatus('Configurá API key en Ajustes → IA', 'warn');
      return;
    }

    const trimmed = text.trim();
    recordPromptUsage(uid(), trimmed);

    messages.push({ role: 'user', content: trimmed });
    paintThread();
    input.value = '';
    streaming = true;
    sendBtn.disabled = true;
    setStatus('Pensando…');
    clearActivity();

    const toolRuns: ToolRun[] = [];
    const toolCardByName = new Map<string, HTMLElement>();
    let fullReply = '';
    const pageContext = getPageContext();

    const streamBubble = document.createElement('article');
    streamBubble.className = 'assistant-bubble assistant-bubble--assistant assistant-bubble--streaming';
    streamBubble.innerHTML = `
      <div class="assistant-bubble-meta">Asistente</div>
      <div class="assistant-bubble-tools-panel" data-stream-tools></div>
      <div class="assistant-bubble-body md-content" data-stream-body></div>
    `;
    threadEl.appendChild(streamBubble);
    const streamBody = streamBubble.querySelector('[data-stream-body]') as HTMLElement;
    const streamTools = streamBubble.querySelector('[data-stream-tools]') as HTMLElement;

    try {
      await api.assistantChat(trimmed, activeConversationId, pageContext, (event) => {
        if (event.type === 'status' && event.message) {
          setStatus(event.message);
        } else if (event.type === 'tool_call' && event.name) {
          recordToolUsage(uid(), event.name);
          showActivity(event.name);
          setStatus(labelForTool(event.name));
          const run: ToolRun = { name: event.name, args: event.args, status: 'running' };
          toolRuns.push(run);
          const card = createToolRunCard(run, { compact: true });
          (card as HTMLDetailsElement).open = true;
          streamTools.appendChild(card);
          toolCardByName.set(`${event.name}-${toolRuns.length - 1}`, card);
        } else if (event.type === 'tool_result' && event.name) {
          let targetIdx = -1;
          for (let i = toolRuns.length - 1; i >= 0; i--) {
            if (toolRuns[i]!.name === event.name && toolRuns[i]!.status === 'running') {
              targetIdx = i;
              break;
            }
          }
          if (targetIdx < 0) targetIdx = toolRuns.length - 1;
          if (targetIdx >= 0 && toolRuns[targetIdx]) {
            const updated: ToolRun = {
              ...toolRuns[targetIdx]!,
              result: event.result,
              status:
                event.result && typeof event.result === 'object' && 'error' in (event.result as object)
                  ? 'error'
                  : 'done',
            };
            toolRuns[targetIdx] = updated;
            const cardKey = `${event.name}-${targetIdx}`;
            const card = toolCardByName.get(cardKey);
            if (card) updateToolRunCard(card, updated);
          }
        } else if (event.type === 'text' && event.delta) {
          fullReply += event.delta;
          setMarkdownContent(streamBody, fullReply);
          threadEl.scrollTop = threadEl.scrollHeight;
        } else if (event.type === 'done') {
          activeConversationId = event.conversationId;
          persistConversation(new Date().toISOString());
          setStatus('Listo', 'ok');
          if (!fullReply && event.message) {
            fullReply = event.message;
            setMarkdownContent(streamBody, fullReply);
          }
        } else if (event.type === 'error') {
          setStatus(event.message ?? 'Error', 'warn');
          messages.push({ role: 'system', content: event.message ?? 'Error' });
        }
      });

      streamBubble.remove();
      if (fullReply || toolRuns.length) {
        messages.push({
          role: 'assistant',
          content: fullReply,
          tools: toolRuns.map((t) => t.name),
          toolRuns: toolRuns.length ? toolRuns : undefined,
        });
      }
      paintThread();
      await refreshSidebar();
      if (fullReply || toolRuns.length) {
        recordAssistantReply(uid());
      }
      onThreadChange?.();
    } catch (err) {
      streamBubble.remove();
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(msg, 'warn');
      messages.push({ role: 'system', content: msg });
      paintThread();
    } finally {
      streaming = false;
      sendBtn.disabled = false;
      clearActivity();
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void sendMessage(input.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input.value);
    }
  });

  async function restoreSavedConversation(): Promise<void> {
    if (messages.length) return;
    const savedId = getSavedConversationId(uid());
    if (!savedId) return;
    try {
      await loadConversation(savedId);
    } catch {
      clearSavedConversationId(uid());
      paintThread();
    }
  }

  async function init(): Promise<void> {
    try {
      const status = await api.assistantStatus();
      llmConfigured = status.llmConfigured;
      if (!llmConfigured) {
        setStatus('Sin API key — configurá IA en Ajustes', 'warn');
        statusBar.innerHTML = `Sin API key. <a href="#/settings?section=ia">Ajustes → IA</a>`;
      } else {
        setStatus('Conectado a tu proveedor IA', 'ok');
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e), 'warn');
    }

    await refreshSidebar();
    await restoreSavedConversation();
    if (!messages.length) paintThread();
    else notifyThreadChange();
  }

  return {
    init,
    startNewConversation,
    sendMessage,
    loadConversation,
    refreshSidebar,
    repaintThread: paintThread,
    repaintShortcuts: paintShortcuts,
    restoreSavedConversation,
    isLlmConfigured: () => llmConfigured,
  };
}
