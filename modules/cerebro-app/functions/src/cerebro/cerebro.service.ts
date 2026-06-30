import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  callUserLlmText,
  callUserLlmWithTools,
  userHasLlmKey,
  type LlmContentPart,
} from '../services/llm-service.js';
import { createToolContext } from '../assistant/tool-context.js';
import { routeToolCall } from '../assistant/tool-router.js';
import { planAssistantTurn } from '../assistant/orchestrator.service.js';
import { appendMessages, createConversation, getConversation, updateConversationMetadata } from '../assistant/conversation.service.js';
import { toolsForDomains, ASSISTANT_TOOLS } from '../assistant/tools.js';
import type { AssistantMessage } from '../assistant/types.js';
import type { CerebroClientContextInput, CerebroContextSnapshot, CerebroSseEvent } from '../shared/cerebro-chat.js';
import {
  buildCerebroContextSnapshot,
  buildContextChip,
  buildSituationalPromptLayer,
} from './context-builder.js';
import { evaluateProactiveMoment } from './proactive-rules.js';
import { CEREBRO_PROVIDER_DECLARATIONS } from './providers/index.js';

const MAX_TOOL_ROUNDS = 22;

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadBehaviorKnowledge(): string {
  try {
    return readFileSync(join(__dirname, '../assistant/knowledge/cerebro-behavior.md'), 'utf8');
  } catch {
    return '';
  }
}

function buildSystemInstruction(snapshot: CerebroContextSnapshot): string {
  const behavior = loadBehaviorKnowledge();
  const situational = buildSituationalPromptLayer(snapshot);
  return [behavior, situational].filter(Boolean).join('\n\n');
}

function historyToContents(messages: AssistantMessage[]): LlmContentPart[] {
  const contents: LlmContentPart[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: m.content }] });
    }
  }
  return contents;
}

export type CerebroSseWriter = (event: CerebroSseEvent) => void;

export async function getCerebroContext(
  uid: string,
  client: CerebroClientContextInput,
  opts?: { dismissedMomentKeys?: string[]; userTyping?: boolean; toolRunning?: boolean; planPending?: boolean },
) {
  let dismissed = opts?.dismissedMomentKeys ?? [];
  let planPending = opts?.planPending ?? false;
  if (client.conversation?.id) {
    const conv = await getConversation(uid, client.conversation.id);
    if (conv?.metadata?.dismissedMoments?.length) {
      dismissed = [...new Set([...conv.metadata.dismissedMoments, ...dismissed])];
    }
    if (conv?.metadata?.pendingPlanId) planPending = true;
  }

  const snapshot = await buildCerebroContextSnapshot(uid, client);
  const chip = buildContextChip(snapshot);
  const proactiveMoment = evaluateProactiveMoment({
    snapshot,
    dismissedMomentKeys: dismissed,
    userTyping: opts?.userTyping,
    toolRunning: opts?.toolRunning,
    planPending,
  });
  return { snapshot, chip, proactiveMoment };
}

export async function dismissCerebroMoment(
  uid: string,
  conversationId: string,
  momentKey: string,
): Promise<void> {
  const conv = await getConversation(uid, conversationId);
  const existing = conv?.metadata?.dismissedMoments ?? [];
  if (existing.includes(momentKey)) return;
  await updateConversationMetadata(uid, conversationId, {
    dismissedMoments: [...existing, momentKey].slice(-50),
  });
}

export async function runCerebroChat(opts: {
  uid: string;
  message: string;
  conversationId?: string;
  clientContext: CerebroClientContextInput;
  write: CerebroSseWriter;
}): Promise<{ conversationId: string; reply: string }> {
  const { uid, message, write, clientContext } = opts;

  if (!(await userHasLlmKey(uid))) {
    const err = 'Configurá tu API key de IA en Ajustes → IA antes de usar Cerebro.';
    write({ type: 'error', message: err });
    throw new Error(err);
  }

  const snapshot = await buildCerebroContextSnapshot(uid, clientContext);
  const systemInstruction = buildSystemInstruction(snapshot);

  let conversationId = opts.conversationId;
  let priorMessages: AssistantMessage[] = [];
  if (conversationId) {
    const existing = await getConversation(uid, conversationId);
    priorMessages = existing?.messages ?? [];
  } else {
    const conv = await createConversation(uid, message.slice(0, 60));
    conversationId = conv.id;
  }

  write({ type: 'status', message: 'Planificando…' });
  const conversationContext = priorMessages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content.slice(0, 400)}`)
    .join('\n');
  const situationalHint = [
    'El snapshot automático es parcial (calendario ≈ hoy); para agenda u otros datos usá tools antes de negar.',
    snapshot.calendar.nextEvent
      ? `Próxima reunión hoy en snapshot: «${snapshot.calendar.nextEvent.title}» en ${snapshot.calendar.nextEvent.minutesUntil} min`
      : '',
    snapshot.navigation.route === 'mantenimiento'
      ? 'Usuario en pantalla Mantenimiento — dominio maintenance; usá get_maintenance_view para listar ítems'
      : '',
  ]
    .filter(Boolean)
    .join('. ');
  const plan = await planAssistantTurn(uid, message, { conversationContext, situationalHint });
  write({ type: 'plan', plan });
  await updateConversationMetadata(uid, conversationId, { focusTopic: plan.summary });

  const CEREBRO_ALWAYS = new Set([
    'list_ui_targets',
    'guide_user',
    'get_calendar_today',
    'get_next_imminent_event',
    'get_meeting_prep',
    'search_meetings',
    'list_meetings',
    'search_catalog',
    'get_meeting',
    'get_meeting_content',
    'semantic_search',
    'list_todos',
    'move_todo',
    'highlight_entity',
    'get_store_summary',
    'propose_action_plan',
    'confirm_plan',
  ]);
  if (snapshot.navigation.route === 'mantenimiento') {
    CEREBRO_ALWAYS.add('get_maintenance_view');
  }
  const toolMap = new Map(toolsForDomains(plan.domains).map((t) => [t.name, t]));
  for (const t of [...ASSISTANT_TOOLS, ...CEREBRO_PROVIDER_DECLARATIONS]) {
    if (CEREBRO_ALWAYS.has(t.name)) toolMap.set(t.name, t);
  }
  const uniqueTools = [...toolMap.values()];

  const ctx = createToolContext(uid, {
    route: snapshot.navigation.route,
    conversationId,
    emitUiCue: (cue) => write({ type: 'ui_cue', cue }),
    emitBlock: (block) => write({ type: 'block', block }),
    emitEntityEffect: (effect) => write({ type: 'entity_effect', effect }),
  });
  const contents: LlmContentPart[] = [...historyToContents(priorMessages.slice(-20)), { role: 'user', parts: [{ text: message }] }];
  let finalText = '';
  let rounds = 0;
  const collectedToolCalls: AssistantMessage['toolCalls'] = [];

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    write({ type: 'status', message: rounds === 1 ? 'Pensando…' : `Iteración ${rounds}…` });

    const result = await callUserLlmWithTools(uid, {
      systemInstruction,
      contents,
      tools: uniqueTools,
      temperature: 0.35,
    });

    if (result.functionCalls?.length) {
      const modelParts: LlmContentPart['parts'] = result.functionCalls.map((fc) => ({
        functionCall: { name: fc.name, args: fc.args },
      }));
      contents.push({ role: 'model', parts: modelParts });

      const responseParts: LlmContentPart['parts'] = [];
      for (const fc of result.functionCalls) {
        write({ type: 'tool_call', name: fc.name, args: fc.args });
        try {
          const toolResult = await routeToolCall(ctx, fc.name, fc.args);
          write({ type: 'tool_result', name: fc.name, result: toolResult });
          collectedToolCalls?.push({ name: fc.name, args: fc.args, result: toolResult });
          responseParts.push({
            functionResponse: { name: fc.name, response: { result: toolResult } },
          });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          write({ type: 'tool_result', name: fc.name, result: { error: errMsg } });
          collectedToolCalls?.push({ name: fc.name, args: fc.args, result: { error: errMsg } });
          responseParts.push({
            functionResponse: { name: fc.name, response: { error: errMsg } },
          });
        }
      }
      contents.push({ role: 'user', parts: responseParts });
      continue;
    }

    if (result.text) {
      finalText = result.text;
      break;
    }
    break;
  }

  if (!finalText) {
    write({ type: 'status', message: 'Generando respuesta final…' });
    finalText = await callUserLlmText(
      uid,
      `Resumí para el usuario en español:\n\nContexto: ${JSON.stringify(plan)}\n\nPregunta: ${message}`,
      { systemInstruction, temperature: 0.4 },
    );
  }

  for (const chunk of chunkText(finalText, 80)) {
    write({ type: 'text', delta: chunk });
  }

  const userMsg: AssistantMessage = { role: 'user', content: message, createdAt: new Date().toISOString() };
  const assistantMsg: AssistantMessage = {
    role: 'assistant',
    content: finalText,
    createdAt: new Date().toISOString(),
    toolCalls: collectedToolCalls?.length ? collectedToolCalls : undefined,
  };
  await appendMessages(uid, conversationId, [userMsg, assistantMsg], message.slice(0, 60));

  write({ type: 'done', conversationId, message: finalText });
  return { conversationId, reply: finalText };
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks.length ? chunks : [''];
}
