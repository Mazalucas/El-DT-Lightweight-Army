import { callUserLlmJson } from '../services/llm-service.js';
import type { AssistantDomain, OrchestratorPlan } from './types.js';
import { ASSISTANT_TOOLS } from './tools.js';

const VALID_DOMAINS: AssistantDomain[] = [
  'health',
  'meetings',
  'contacts',
  'inbox',
  'sync',
  'graph',
  'actions',
];

const ORCHESTRATOR_SYSTEM = `Eres el orquestador del asistente de Cerebro Profesional.
Clasificá el mensaje del usuario en dominios y herramientas sugeridas.
Dominios válidos: health, meetings, contacts, inbox, sync, graph, actions.
Respondé SOLO JSON con: domains (array), intent (string corto), summary (string), suggestedTools (array de nombres de herramienta).
Herramientas disponibles: ${ASSISTANT_TOOLS.map((t) => t.name).join(', ')}.`;

export async function planAssistantTurn(uid: string, userMessage: string): Promise<OrchestratorPlan> {
  const prompt = `Mensaje del usuario:\n"""${userMessage}"""\n\nClasificá dominios e intent.`;
  const raw = await callUserLlmJson(uid, prompt, { systemInstruction: ORCHESTRATOR_SYSTEM, temperature: 0.1 });
  let parsed: Partial<OrchestratorPlan> = {};
  try {
    parsed = JSON.parse(raw) as Partial<OrchestratorPlan>;
  } catch {
    parsed = {
      domains: ['health', 'meetings'],
      intent: 'general_query',
      summary: userMessage.slice(0, 120),
      suggestedTools: ['get_store_summary'],
    };
  }

  const domains = (parsed.domains ?? ['health']).filter((d): d is AssistantDomain =>
    VALID_DOMAINS.includes(d as AssistantDomain),
  );
  if (!domains.length) domains.push('health');

  return {
    domains,
    intent: parsed.intent ?? 'general',
    summary: parsed.summary ?? userMessage.slice(0, 200),
    suggestedTools: parsed.suggestedTools ?? [],
  };
}
