import { callUserLlmJson } from '../services/llm-service.js';
import type { AssistantDomain, OrchestratorPlan } from './types.js';
import { ASSISTANT_TOOLS } from './tools.js';

const VALID_DOMAINS: AssistantDomain[] = [
  'health',
  'meetings',
  'contacts',
  'inbox',
  'maintenance',
  'sync',
  'graph',
  'actions',
];

const ORCHESTRATOR_SYSTEM = `Eres el orquestador del asistente de Cerebro Profesional.
Clasificá el mensaje del usuario en dominios y herramientas sugeridas.
Dominios válidos: health, meetings, contacts, inbox, maintenance, sync, graph, actions.
Usá dominio maintenance para limpieza de datos: duplicados, prospects, asignaciones proyecto/equipo, emails de equipo, reuniones a revisar.
Agenda/calendario (hoy, mañana, próxima semana): dominio meetings + suggestedTools debe incluir get_calendar_today (con date si no es hoy).
Preguntas sobre contenido de reuniones o temas: meetings + semantic_search o get_meeting_prep.
Nunca sugieras responder sin tools cuando la pregunta es factual — priorizá investigar.
Respondé SOLO JSON con: domains (array), intent (string corto), summary (string), suggestedTools (array de nombres de herramienta).
Herramientas disponibles: ${ASSISTANT_TOOLS.map((t) => t.name).join(', ')}.`;

export async function planAssistantTurn(
  uid: string,
  userMessage: string,
  opts?: { conversationContext?: string; situationalHint?: string },
): Promise<OrchestratorPlan> {
  const contextBlock = [
    opts?.situationalHint ? `Contexto situacional: ${opts.situationalHint}` : '',
    opts?.conversationContext ? `Historial reciente:\n${opts.conversationContext}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const prompt = [
    contextBlock,
    `Mensaje del usuario:\n"""${userMessage}"""`,
    '',
    'Clasificá dominios e intent. Si el mensaje es confirmación breve ("sí", "dale", "ok"), inferí el intent del historial.',
  ]
    .filter(Boolean)
    .join('\n\n');
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
