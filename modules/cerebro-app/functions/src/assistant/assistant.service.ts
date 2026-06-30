import {
  callUserLlmText,
  callUserLlmWithTools,
  userHasLlmKey,
  type LlmContentPart,
} from '../services/llm-service.js';
import { createToolContext } from './tool-context.js';
import { routeToolCall } from './tool-router.js';
import { planAssistantTurn } from './orchestrator.service.js';
import { appendMessages, createConversation } from './conversation.service.js';
import { toolsForDomains } from './tools.js';
import type { AssistantMessage, AssistantPageContext, AssistantSseEvent } from './types.js';

const MAX_TOOL_ROUNDS = 8;

const AGENT_SYSTEM = `Eres el asistente de Cerebro Profesional (reuniones Meet, contactos, proyectos, inbox, mantenimiento de datos).
Usá las herramientas para obtener datos reales antes de responder.
Para preguntas sobre temas tratados en reuniones ("¿dónde hablamos de X?"), preferí semantic_search, que busca dentro del contenido de las notas.
Podés actuar: aceptar/descartar sugerencias inteligentes, unificar contactos (merge_people), resolver mantenimiento (get_maintenance_view, accept_project_suggestions, accept_team_suggestions, dismiss_prospect, promote_prospect, link_prospect_to_contact, assign_email_to_team), analizar reuniones y regenerar sugerencias+digest.
Respondé en español, conciso y accionable.
Si una acción es destructiva o en background (sync, repair), explicá qué se inició y cómo ver progreso.
Antes de merge_people, confirmar asignaciones masivas o descartar datos, confirmá con el usuario salvo que el pedido sea explícito.
No inventes datos: si falta información, usá herramientas o pedí aclaración.`;

function buildContextInstruction(pageContext?: AssistantPageContext): string {
  if (!pageContext?.pageTitle && !pageContext?.userName) return AGENT_SYSTEM;

  const lines = [AGENT_SYSTEM, '', 'Contexto del usuario en la app:'];
  if (pageContext.userName) lines.push(`- Nombre: ${pageContext.userName}`);
  if (pageContext.userEmail) lines.push(`- Email: ${pageContext.userEmail}`);
  if (pageContext.orgName) lines.push(`- Organización activa: ${pageContext.orgName}`);
  if (pageContext.orgRole) lines.push(`- Rol en la org: ${pageContext.orgRole}`);
  if (pageContext.pageTitle) lines.push(`- Página actual: ${pageContext.pageTitle}`);
  if (pageContext.pageDescription) lines.push(`- Detalle: ${pageContext.pageDescription}`);
  if (pageContext.meetingId) lines.push(`- ID reunión visible: ${pageContext.meetingId}`);
  if (pageContext.profTab) lines.push(`- Pestaña profesional: ${pageContext.profTab}`);
  lines.push(
    'Saludá al usuario por su nombre cuando sea natural. Adaptá ejemplos y sugerencias a la página donde está.',
  );
  return lines.join('\n');
}

export type SseWriter = (event: AssistantSseEvent) => void;

export async function runAssistantChat(opts: {
  uid: string;
  message: string;
  conversationId?: string;
  pageContext?: AssistantPageContext;
  write: SseWriter;
}): Promise<{ conversationId: string; reply: string }> {
  const { uid, message, write, pageContext } = opts;
  const systemInstruction = buildContextInstruction(pageContext);

  if (!(await userHasLlmKey(uid))) {
    const err =
      'Configurá tu API key de IA en Ajustes → IA antes de usar el asistente.';
    write({ type: 'error', message: err });
    throw new Error(err);
  }

  let conversationId = opts.conversationId;
  if (!conversationId) {
    const conv = await createConversation(uid, message.slice(0, 60));
    conversationId = conv.id;
  }

  write({ type: 'status', message: 'Planificando…' });
  const plan = await planAssistantTurn(uid, message);
  write({ type: 'plan', plan });

  const tools = toolsForDomains(plan.domains);
  const ctx = createToolContext(uid);
  const contents: LlmContentPart[] = [{ role: 'user', parts: [{ text: message }] }];
  let finalText = '';
  let rounds = 0;
  const collectedToolCalls: Array<{ name: string; args: Record<string, unknown>; result?: unknown }> = [];

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    write({ type: 'status', message: rounds === 1 ? 'Pensando…' : `Iteración ${rounds}…` });

    const result = await callUserLlmWithTools(uid, {
      systemInstruction,
      contents,
      tools,
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
          collectedToolCalls.push({ name: fc.name, args: fc.args, result: toolResult });
          responseParts.push({
            functionResponse: { name: fc.name, response: { result: toolResult } },
          });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          write({ type: 'tool_result', name: fc.name, result: { error: errMsg } });
          collectedToolCalls.push({ name: fc.name, args: fc.args, result: { error: errMsg } });
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
    finalText = await callUserLlmText(uid, `Resumí para el usuario en español:\n\nContexto: ${JSON.stringify(plan)}\n\nPregunta: ${message}`, {
      systemInstruction,
      temperature: 0.4,
    });
  }

  for (const chunk of chunkText(finalText, 80)) {
    write({ type: 'text', delta: chunk });
  }

  const userMsg: AssistantMessage = { role: 'user', content: message, createdAt: new Date().toISOString() };
  const assistantMsg: AssistantMessage = {
    role: 'assistant',
    content: finalText,
    createdAt: new Date().toISOString(),
    toolCalls: collectedToolCalls.length ? collectedToolCalls : undefined,
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
