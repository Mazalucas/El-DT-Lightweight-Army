import {
  ASSISTANT_PROMPTS,
  CATEGORY_LABELS,
  type PromptCategory,
} from '../lib/assistant-catalog.js';
import { buildAssistantPageContext } from '../lib/assistant-context.js';
import { createAssistantChatSession } from '../lib/assistant-chat-session.js';
import { consumeAssistantPrefill, parseAssistantQuery } from '../lib/assistant-nav.js';
import { auth } from '../lib/firebase.js';
import { getTopPrompts } from '../lib/assistant-memory.js';
import { icon } from '../ui/icons.js';
import { refreshAssistantBubbleBadge } from '../ui/assistant-bubble.js';
import { button, pageHeader } from '../ui/primitives.js';

export async function renderAssistant(container: HTMLElement): Promise<void> {
  let sessionRef: ReturnType<typeof createAssistantChatSession> | null = null;

  const header = pageHeader(
    'Asistente',
    'Preguntá y actuá sobre tu cerebro con datos reales — reuniones, contactos, inbox y sync.',
    button('Nueva conversación', {
      variant: 'secondary',
      size: 'sm',
      onClick: () => sessionRef?.startNewConversation(),
    }),
  );
  container.replaceChildren(header);

  const layout = document.createElement('div');
  layout.className = 'assistant-layout';
  layout.innerHTML = `
    <aside class="assistant-sidebar" aria-label="Historial de conversaciones">
      <div class="assistant-sidebar-head">
        <h2>Conversaciones</h2>
      </div>
      <div class="assistant-conv-list" id="assistant-conv-list" role="list"></div>
    </aside>
    <main class="assistant-main">
      <div class="assistant-status-bar" id="assistant-status-bar" role="status" aria-live="polite"></div>
      <div class="assistant-activity" id="assistant-activity" hidden></div>
      <div class="assistant-thread" id="assistant-thread" role="log" aria-live="polite" aria-relevant="additions"></div>
      <form class="assistant-composer" id="assistant-form">
        <label class="visually-hidden" for="assistant-input">Mensaje al asistente</label>
        <textarea id="assistant-input" class="assistant-input" rows="2" placeholder="Escribí tu pregunta…" autocomplete="off"></textarea>
        <button type="submit" class="btn btn-primary assistant-send" id="assistant-send">Enviar</button>
      </form>
    </main>
    <aside class="assistant-guide" aria-label="Guía y sugerencias">
      <div class="assistant-guide-block">
        <h2>Qué podés hacer</h2>
        <p class="muted">El asistente consulta tu cerebro en tiempo real y puede iniciar sync o reparación.</p>
        <ul class="assistant-cap-list">
          <li>${icon('users')} Contactos y prospects</li>
          <li>${icon('calendar')} Reuniones y notas</li>
          <li>${icon('inbox')} Inbox y tareas</li>
          <li>${icon('share')} Grafo de relaciones</li>
        </ul>
      </div>
      <div class="assistant-guide-block" id="assistant-prompts-host"></div>
    </aside>
  `;
  container.appendChild(layout);

  const statusBar = layout.querySelector('#assistant-status-bar') as HTMLElement;
  const activityEl = layout.querySelector('#assistant-activity') as HTMLElement;
  const threadEl = layout.querySelector('#assistant-thread') as HTMLElement;
  const convListEl = layout.querySelector('#assistant-conv-list') as HTMLElement;
  const promptsHost = layout.querySelector('#assistant-prompts-host') as HTMLElement;
  const form = layout.querySelector('#assistant-form') as HTMLFormElement;
  const input = layout.querySelector('#assistant-input') as HTMLTextAreaElement;
  const sendBtn = layout.querySelector('#assistant-send') as HTMLButtonElement;

  const session = createAssistantChatSession({
    elements: { statusBar, activityEl, threadEl, input, sendBtn, form, convListEl },
    getPageContext: () => buildAssistantPageContext({ user: auth.currentUser }),
    showConversationList: true,
    getPersistUid: () => auth.currentUser?.uid,
    onThreadChange: () => refreshAssistantBubbleBadge(),
  });
  sessionRef = session;

  function paintPrompts(): void {
    promptsHost.replaceChildren();
    const h2 = document.createElement('h2');
    h2.textContent = 'Empezá con…';
    promptsHost.appendChild(h2);

    const recent = getTopPrompts(auth.currentUser?.uid, 3);
    if (recent.length) {
      const recentGroup = document.createElement('div');
      recentGroup.className = 'assistant-prompt-group';
      const recentLabel = document.createElement('p');
      recentLabel.className = 'assistant-prompt-cat';
      recentLabel.textContent = 'Usaste recientemente';
      recentGroup.appendChild(recentLabel);
      const recentList = document.createElement('div');
      recentList.className = 'assistant-prompt-list';
      recent.forEach((entry) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'assistant-prompt-chip assistant-prompt-chip--recent';
        chip.textContent = entry.text.length > 40 ? `${entry.text.slice(0, 37)}…` : entry.text;
        chip.title = entry.text;
        chip.addEventListener('click', () => {
          input.value = entry.text;
          input.focus();
        });
        recentList.appendChild(chip);
      });
      recentGroup.appendChild(recentList);
      promptsHost.appendChild(recentGroup);
    }

    const groups = new Map<PromptCategory, typeof ASSISTANT_PROMPTS>();
    for (const p of ASSISTANT_PROMPTS) {
      const list = groups.get(p.category) ?? [];
      list.push(p);
      groups.set(p.category, list);
    }

    for (const [cat, items] of groups) {
      const group = document.createElement('div');
      group.className = 'assistant-prompt-group';
      const label = document.createElement('p');
      label.className = 'assistant-prompt-cat';
      label.textContent = CATEGORY_LABELS[cat];
      group.appendChild(label);
      const list = document.createElement('div');
      list.className = 'assistant-prompt-list';
      items.forEach((item) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'assistant-prompt-chip';
        chip.textContent = item.label;
        chip.title = item.prompt;
        chip.addEventListener('click', () => {
          input.value = item.prompt;
          input.focus();
        });
        list.appendChild(chip);
      });
      group.appendChild(list);
      promptsHost.appendChild(group);
    }
  }

  paintPrompts();
  await session.init();

  const fromQuery = parseAssistantQuery().prompt ?? consumeAssistantPrefill();
  if (fromQuery) {
    input.value = fromQuery;
    if (session.isLlmConfigured()) {
      void session.sendMessage(fromQuery);
    }
  } else {
    input.focus();
  }
}
