import type { LlmToolDeclaration } from '../services/llm-service.js';
import * as health from '../domain/health.service.js';
import * as meetings from '../domain/meetings.service.js';
import * as contacts from '../domain/contacts.service.js';
import * as inbox from '../domain/inbox.service.js';
import * as sync from '../domain/sync.service.js';
import * as graph from '../domain/graph.service.js';
import * as search from '../domain/search.service.js';
import { semanticSearchMeetings } from '../services/embeddings.js';
import { getSmartSuggestion, listSmartSuggestions, setSmartSuggestionStatus } from '../services/smart-suggestions.js';
import { mergePersonsIntoCanonical } from '../services/catalog-mutate.js';
import type { ToolContext } from './tool-context.js';
import { compactToolResult } from './compact-tool-result.js';

export const ASSISTANT_TOOLS: LlmToolDeclaration[] = [
  {
    name: 'get_store_health',
    description: 'Métricas de salud del cerebro profesional: contactos, reuniones, huérfanos, sugerencias.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_store_summary',
    description: 'Resumen compacto del store: conteos y meta sin cargar todo el catálogo.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_meetings',
    description: 'Lista reuniones del store con paginación.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Máximo a devolver (default 20)' },
        offset: { type: 'number', description: 'Desplazamiento' },
      },
    },
  },
  {
    name: 'search_meetings',
    description: 'Busca reuniones por título, participantes o resumen.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_meeting',
    description: 'Detalle de una reunión por id.',
    parameters: {
      type: 'object',
      properties: { meetingId: { type: 'string' } },
      required: ['meetingId'],
    },
  },
  {
    name: 'get_meeting_content',
    description: 'Contenido markdown del mirror de una reunión (puede ser largo).',
    parameters: {
      type: 'object',
      properties: { meetingId: { type: 'string' } },
      required: ['meetingId'],
    },
  },
  {
    name: 'list_people',
    description: 'Lista contactos (personas) del catálogo.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'list_prospects',
    description: 'Lista prospectos sin vincular a contacto.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'list_projects',
    description: 'Lista proyectos del catálogo.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_teams',
    description: 'Lista equipos del catálogo.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_suggestions',
    description: 'Sugerencias pendientes del inbox (equipos/proyectos).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_todos',
    description: 'Tareas extraídas de reuniones.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['suggested', 'open', 'done', 'dismissed'] },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'get_sync_progress',
    description: 'Progreso del sync/repair/pipeline en curso.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'start_sync',
    description: 'Inicia sincronización de mirrors desde Drive (background).',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
  {
    name: 'start_pipeline',
    description: 'Inicia pipeline completo: sync + análisis (background).',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        skipAnalysis: { type: 'boolean' },
      },
    },
  },
  {
    name: 'run_repair',
    description: 'Repara el store: re-extrae contactos y enlaces desde mirrors (background).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'search_catalog',
    description: 'Busca en reuniones, contactos y proyectos por texto (metadata).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_graph',
    description: 'Snapshot del grafo de relaciones (nodos y aristas).',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        center: { type: 'string' },
        depth: { type: 'number' },
      },
    },
  },
  {
    name: 'dismiss_suggestion',
    description: 'Descarta una sugerencia del inbox por id.',
    parameters: {
      type: 'object',
      properties: { suggestionId: { type: 'string' } },
      required: ['suggestionId'],
    },
  },
  {
    name: 'accept_todos',
    description: 'Acepta tareas por ids.',
    parameters: {
      type: 'object',
      properties: { todoIds: { type: 'array', items: { type: 'string' } } },
      required: ['todoIds'],
    },
  },
  {
    name: 'create_todo',
    description: 'Crea una tarea manual en el tablero.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        dueAt: { type: 'string', description: 'ISO 8601' },
        projectIds: { type: 'array', items: { type: 'string' } },
        teamIds: { type: 'array', items: { type: 'string' } },
        assigneePersonIds: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'update_todo',
    description: 'Actualiza una tarea existente.',
    parameters: {
      type: 'object',
      properties: {
        todoId: { type: 'string' },
        text: { type: 'string' },
        dueAt: { type: 'string' },
        projectIds: { type: 'array', items: { type: 'string' } },
        teamIds: { type: 'array', items: { type: 'string' } },
        assigneePersonIds: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
      required: ['todoId'],
    },
  },
  {
    name: 'complete_todos',
    description: 'Marca tareas abiertas como hechas.',
    parameters: {
      type: 'object',
      properties: { todoIds: { type: 'array', items: { type: 'string' } } },
      required: ['todoIds'],
    },
  },
  {
    name: 'dismiss_todos',
    description: 'Descarta tareas sugeridas.',
    parameters: {
      type: 'object',
      properties: { todoIds: { type: 'array', items: { type: 'string' } } },
      required: ['todoIds'],
    },
  },
  {
    name: 'semantic_search',
    description:
      'Búsqueda semántica en el CONTENIDO de las notas de reunión (no solo metadata). Ideal para "¿dónde hablamos de X?".',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_smart_suggestions',
    description: 'Sugerencias inteligentes pendientes (follow-ups, compromisos, relaciones) generadas por el motor IA.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'accept_smart_suggestion',
    description: 'Acepta una sugerencia inteligente por id; si propone crear tarea, la crea.',
    parameters: {
      type: 'object',
      properties: { suggestionId: { type: 'string' } },
      required: ['suggestionId'],
    },
  },
  {
    name: 'dismiss_smart_suggestion',
    description: 'Descarta una sugerencia inteligente por id.',
    parameters: {
      type: 'object',
      properties: { suggestionId: { type: 'string' } },
      required: ['suggestionId'],
    },
  },
  {
    name: 'merge_people',
    description: 'Unifica contactos duplicados: fusiona mergeIds dentro del contacto canónico.',
    parameters: {
      type: 'object',
      properties: {
        canonicalId: { type: 'string', description: 'Contacto que queda' },
        mergeIds: { type: 'array', items: { type: 'string' }, description: 'Contactos a fusionar' },
      },
      required: ['canonicalId', 'mergeIds'],
    },
  },
  {
    name: 'analyze_meeting',
    description: 'Dispara el análisis IA de una reunión (resumen, action items, personas).',
    parameters: {
      type: 'object',
      properties: { meetingId: { type: 'string' } },
      required: ['meetingId'],
    },
  },
  {
    name: 'regenerate_intelligence',
    description: 'Regenera las sugerencias inteligentes y el digest diario con los datos actuales.',
    parameters: { type: 'object', properties: {} },
  },
];

export async function executeTool(
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const uid = ctx.uid;
  let result: unknown;

  switch (name) {
    case 'get_store_health':
      result = await health.getHealth(uid);
      break;
    case 'get_store_summary':
      result = await health.getStoreSummary(uid);
      break;
    case 'list_meetings':
      result = await meetings.listMeetingsPage(uid, {
        limit: Number(args.limit) || 20,
        offset: Number(args.offset) || 0,
      });
      break;
    case 'search_meetings':
      result = await meetings.searchMeetingsMetadata(uid, String(args.query ?? ''), Number(args.limit) || 20);
      break;
    case 'get_meeting':
      result = await meetings.getMeeting(uid, String(args.meetingId));
      break;
    case 'get_meeting_content': {
      const content = await meetings.getMeetingMirrorContent(uid, String(args.meetingId));
      result = content
        ? { meetingId: args.meetingId, contentLength: content.length, preview: content.slice(0, 4000) }
        : null;
      break;
    }
    case 'list_people':
      result = await contacts.listPeople(uid, Number(args.limit) || 50);
      break;
    case 'list_prospects':
      result = await contacts.listProspects(uid, Number(args.limit) || 50);
      break;
    case 'list_projects':
      result = await contacts.listProjects(uid);
      break;
    case 'list_teams':
      result = await contacts.listTeams(uid);
      break;
    case 'list_suggestions':
      result = await inbox.listSuggestions(uid);
      break;
    case 'list_todos':
      result = await inbox.listTodos(
        uid,
        args.status as 'suggested' | 'open' | 'done' | 'dismissed' | undefined,
        Number(args.limit) || 50,
      );
      break;
    case 'get_sync_progress':
      result = await sync.getSyncProgress(uid);
      break;
    case 'start_sync':
      result = await sync.startSync(uid, args.limit as number | undefined);
      break;
    case 'start_pipeline':
      result = await sync.startPipeline(uid, {
        limit: args.limit as number | undefined,
        skipAnalysis: args.skipAnalysis as boolean | undefined,
      });
      break;
    case 'run_repair':
      result = await health.startRepair(uid);
      break;
    case 'search_catalog':
      result = await search.searchCatalog(uid, String(args.query ?? ''), { limit: Number(args.limit) || 15 });
      break;
    case 'get_graph':
      result = await graph.getGraphSnapshot(uid, {
        limit: args.limit as number | undefined,
        center: args.center as string | undefined,
        depth: args.depth as number | undefined,
      });
      break;
    case 'dismiss_suggestion':
      result = await inbox.dismissSuggestion(uid, String(args.suggestionId));
      break;
    case 'accept_todos':
      result = await inbox.acceptTodos(uid, (args.todoIds as string[]) ?? []);
      break;
    case 'create_todo':
      result = await inbox.createTodoForUser(uid, {
        text: String(args.text ?? ''),
        dueAt: args.dueAt as string | undefined,
        projectIds: args.projectIds as string[] | undefined,
        teamIds: args.teamIds as string[] | undefined,
        assigneePersonIds: args.assigneePersonIds as string[] | undefined,
        notes: args.notes as string | undefined,
      });
      break;
    case 'update_todo':
      result = await inbox.updateTodoForUser(uid, String(args.todoId), {
        text: args.text as string | undefined,
        dueAt: args.dueAt as string | undefined,
        projectIds: args.projectIds as string[] | undefined,
        teamIds: args.teamIds as string[] | undefined,
        assigneePersonIds: args.assigneePersonIds as string[] | undefined,
        notes: args.notes as string | undefined,
      });
      break;
    case 'complete_todos':
      result = await inbox.completeTodos(uid, (args.todoIds as string[]) ?? []);
      break;
    case 'dismiss_todos':
      result = await inbox.dismissTodos(uid, (args.todoIds as string[]) ?? []);
      break;
    case 'semantic_search': {
      const hits = await semanticSearchMeetings(uid, String(args.query ?? ''), Number(args.limit) || 8);
      result = hits ?? { error: 'Sin índice semántico todavía — corré una sincronización con API key configurada.' };
      break;
    }
    case 'list_smart_suggestions':
      result = await listSmartSuggestions(uid, { status: 'pending' });
      break;
    case 'accept_smart_suggestion': {
      const id = String(args.suggestionId);
      const suggestion = await getSmartSuggestion(uid, id);
      if (!suggestion) {
        result = { error: 'Sugerencia no encontrada' };
        break;
      }
      let createdTodoId: string | undefined;
      if (suggestion.action.kind === 'create_todo' && suggestion.action.payload?.text) {
        const payload = suggestion.action.payload as { text: string; dueAt?: string };
        const created = await inbox.createTodoForUser(uid, { text: payload.text, dueAt: payload.dueAt });
        createdTodoId = created.todo.id;
      }
      result = { suggestion: await setSmartSuggestionStatus(uid, id, 'accepted'), createdTodoId };
      break;
    }
    case 'dismiss_smart_suggestion':
      result = { suggestion: await setSmartSuggestionStatus(uid, String(args.suggestionId), 'dismissed') };
      break;
    case 'merge_people': {
      const merged = await mergePersonsIntoCanonical(
        uid,
        String(args.canonicalId),
        (args.mergeIds as string[]) ?? [],
      );
      result = { merged: merged.merged, meetingsUpdated: merged.meetingsUpdated };
      break;
    }
    case 'analyze_meeting': {
      const { analyzeMeeting, applyAnalysisToStore } = await import('../services/store.js');
      const analysis = await analyzeMeeting(uid, String(args.meetingId));
      await applyAnalysisToStore(uid, analysis);
      result = { meetingId: args.meetingId, summary: analysis.summary, actionItems: analysis.actionItems };
      break;
    }
    case 'regenerate_intelligence': {
      const { runIntelligence } = await import('../services/suggestion-engine.js');
      result = await runIntelligence(uid);
      break;
    }
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }

  return compactToolResult(result);
}

export function toolsForDomains(domains: string[]): LlmToolDeclaration[] {
  const domainToolMap: Record<string, string[]> = {
    health: ['get_store_health', 'get_store_summary', 'run_repair'],
    meetings: [
      'list_meetings',
      'search_meetings',
      'search_catalog',
      'semantic_search',
      'get_meeting',
      'get_meeting_content',
      'analyze_meeting',
    ],
    contacts: ['list_people', 'list_prospects', 'list_projects', 'list_teams', 'search_catalog', 'merge_people'],
    inbox: [
      'list_suggestions',
      'list_smart_suggestions',
      'list_todos',
      'dismiss_suggestion',
      'accept_smart_suggestion',
      'dismiss_smart_suggestion',
      'accept_todos',
      'create_todo',
      'update_todo',
      'complete_todos',
      'dismiss_todos',
    ],
    sync: ['get_sync_progress', 'start_sync', 'start_pipeline'],
    graph: ['get_graph'],
    actions: [
      'dismiss_suggestion',
      'accept_smart_suggestion',
      'dismiss_smart_suggestion',
      'accept_todos',
      'create_todo',
      'update_todo',
      'complete_todos',
      'dismiss_todos',
      'merge_people',
      'analyze_meeting',
      'regenerate_intelligence',
      'run_repair',
      'start_sync',
      'start_pipeline',
    ],
  };
  const names = new Set<string>();
  for (const d of domains) {
    for (const t of domainToolMap[d] ?? []) names.add(t);
  }
  if (!names.size) return ASSISTANT_TOOLS;
  return ASSISTANT_TOOLS.filter((t) => names.has(t.name));
}
