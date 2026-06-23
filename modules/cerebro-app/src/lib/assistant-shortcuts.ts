import { ASSISTANT_PROMPTS, labelForTool } from './assistant-catalog.js';
import type { AssistantPageContext } from './assistant-context.js';
import { getTopPrompts, getTopTools } from './assistant-memory.js';

export type AssistantShortcut = {
  id: string;
  label: string;
  prompt: string;
  source: 'recent' | 'tool' | 'context' | 'catalog';
};

const CONTEXT_PROMPTS: Partial<Record<string, AssistantShortcut[]>> = {
  dashboard: [
    { id: 'ctx-dash-kpis', label: 'Resumen del tablero', prompt: 'Dame un resumen de KPIs: reuniones, contactos, sugerencias y tareas para hoy.', source: 'context' },
    { id: 'ctx-dash-today', label: 'Tareas para hoy', prompt: '¿Qué tareas tengo para hoy o vencidas?', source: 'context' },
  ],
  tablero: [
    { id: 'ctx-tablero', label: 'Sugerencias pendientes', prompt: '¿Qué sugerencias tengo pendientes en el tablero?', source: 'context' },
    { id: 'ctx-tablero-todos', label: 'Tareas sugeridas', prompt: 'Listame las tareas sugeridas de reuniones recientes.', source: 'context' },
  ],
  inbox: [
    { id: 'ctx-inbox', label: 'Sugerencias pendientes', prompt: '¿Qué sugerencias tengo pendientes en el tablero?', source: 'context' },
    { id: 'ctx-inbox-todos', label: 'Tareas sugeridas', prompt: 'Listame las tareas sugeridas de reuniones recientes.', source: 'context' },
  ],
  contactos: [
    { id: 'ctx-contacts', label: 'Resumen contactos', prompt: '¿Cuántos contactos y prospects tengo?', source: 'context' },
    { id: 'ctx-search-person', label: 'Buscar persona', prompt: 'Buscá en mi catálogo a [nombre o email].', source: 'context' },
  ],
  reuniones: [
    { id: 'ctx-meetings', label: 'Últimas reuniones', prompt: 'Listame las 10 reuniones más recientes.', source: 'context' },
    { id: 'ctx-search-meeting', label: 'Buscar reunión', prompt: 'Buscá reuniones sobre [tema o persona].', source: 'context' },
  ],
  tareas: [
    { id: 'ctx-todos', label: 'Tareas abiertas', prompt: '¿Qué tareas abiertas tengo en el tablero?', source: 'context' },
  ],
  red: [
    { id: 'ctx-graph', label: 'Resumen red', prompt: 'Mostrame un resumen del grafo de relaciones.', source: 'context' },
  ],
};

const TOOL_SHORTCUT_PROMPTS: Record<string, string> = {
  get_store_health: '¿Cuál es la salud de mi cerebro profesional?',
  list_meetings: 'Listame mis reuniones más recientes.',
  search_meetings: 'Buscá reuniones que mencionen [tema].',
  list_suggestions: '¿Qué sugerencias tengo en el inbox?',
  list_todos: 'Mostrame mis tareas pendientes.',
  start_sync: 'Sincronizá notas Meet desde Drive.',
  run_repair: 'Repará el store si hace falta.',
  get_graph: 'Resumí mi red de relaciones.',
};

function dedupeShortcuts(items: AssistantShortcut[]): AssistantShortcut[] {
  const seen = new Set<string>();
  const out: AssistantShortcut[] = [];
  for (const item of items) {
    const key = item.prompt.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function buildAssistantShortcuts(ctx: AssistantPageContext, uid?: string, limit = 8): AssistantShortcut[] {
  const items: AssistantShortcut[] = [];

  for (const entry of getTopPrompts(uid, 3)) {
    const label = entry.text.length > 36 ? `${entry.text.slice(0, 33)}…` : entry.text;
    items.push({
      id: `recent-${entry.text.slice(0, 20)}`,
      label,
      prompt: entry.text,
      source: 'recent',
    });
  }

  for (const tool of getTopTools(uid, 2)) {
    const prompt = TOOL_SHORTCUT_PROMPTS[tool.name];
    if (!prompt) continue;
    items.push({
      id: `tool-${tool.name}`,
      label: labelForTool(tool.name),
      prompt,
      source: 'tool',
    });
  }

  if (ctx.profTab && CONTEXT_PROMPTS[ctx.profTab]) {
    items.push(...CONTEXT_PROMPTS[ctx.profTab]!);
  } else if (ctx.route === 'home') {
    items.push({
      id: 'ctx-home-health',
      label: 'Salud del cerebro',
      prompt: '¿Cuál es la salud de mi cerebro profesional?',
      source: 'context',
    });
  } else if (ctx.route === 'profesional-meeting') {
    items.push({
      id: 'ctx-meeting-detail',
      label: 'Resumir reunión',
      prompt: 'Resumí esta reunión y sus action items.',
      source: 'context',
    });
  }

  for (const p of ASSISTANT_PROMPTS.slice(0, 4)) {
    items.push({
      id: p.id,
      label: p.label,
      prompt: p.prompt,
      source: 'catalog',
    });
  }

  return dedupeShortcuts(items).slice(0, limit);
}

export function paintAssistantShortcuts(
  host: HTMLElement,
  shortcuts: AssistantShortcut[],
  onPick: (prompt: string) => void,
): void {
  host.replaceChildren();
  if (!shortcuts.length) {
    host.hidden = true;
    return;
  }
  host.hidden = false;

  const label = document.createElement('p');
  label.className = 'assistant-shortcuts-label muted';
  label.textContent = 'Accesos rápidos';
  host.appendChild(label);

  const list = document.createElement('div');
  list.className = 'assistant-shortcuts-list';
  list.setAttribute('role', 'list');

  shortcuts.forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `assistant-shortcut-chip assistant-shortcut-chip--${s.source}`;
    btn.setAttribute('role', 'listitem');
    btn.title = s.prompt;
    btn.textContent = s.label;
    btn.addEventListener('click', () => onPick(s.prompt));
    list.appendChild(btn);
  });

  host.appendChild(list);
}
