import * as health from '../domain/health.service.js';
import * as meetings from '../domain/meetings.service.js';
import * as contacts from '../domain/contacts.service.js';
import * as inbox from '../domain/inbox.service.js';
import * as sync from '../domain/sync.service.js';
import * as graph from '../domain/graph.service.js';
import * as maintenance from '../domain/maintenance.service.js';
import * as search from '../domain/search.service.js';
import { semanticSearchMeetings } from '../services/embeddings.js';
import { getSmartSuggestion, listSmartSuggestions, setSmartSuggestionStatus } from '../services/smart-suggestions.js';
import { mergePersonsIntoCanonical } from '../services/catalog-mutate.js';
import { executeCerebroProviderTool, CEREBRO_PROVIDER_TOOL_NAMES } from '../cerebro/providers/index.js';
import { emitTodoEffect, emitTodoEntityCard, emitTodosEffect } from './tool-context.js';
import { compactToolResult } from './compact-tool-result.js';
export const ASSISTANT_TOOLS = [
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
        name: 'get_maintenance_view',
        description: 'Lista ítems de mantenimiento de datos: duplicados, prospects, asignaciones proyecto/equipo, emails de equipo mal ubicados, reuniones con análisis a revisar.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'accept_project_suggestions',
        description: 'Confirma asignaciones de reuniones a un proyecto (una o varias sugerencias por id).',
        parameters: {
            type: 'object',
            properties: {
                suggestionIds: { type: 'array', items: { type: 'string' } },
                projectName: { type: 'string', description: 'Nombre del proyecto si se crea uno nuevo' },
                existingProjectId: { type: 'string', description: 'Id de proyecto existente para vincular' },
            },
            required: ['suggestionIds'],
        },
    },
    {
        name: 'accept_team_suggestions',
        description: 'Confirma asignaciones de reuniones a un equipo (una o varias sugerencias por id).',
        parameters: {
            type: 'object',
            properties: {
                suggestionIds: { type: 'array', items: { type: 'string' } },
            },
            required: ['suggestionIds'],
        },
    },
    {
        name: 'batch_dismiss_suggestions',
        description: 'Descarta varias sugerencias de mantenimiento/inbox por ids.',
        parameters: {
            type: 'object',
            properties: {
                suggestionIds: { type: 'array', items: { type: 'string' } },
            },
            required: ['suggestionIds'],
        },
    },
    {
        name: 'dismiss_prospect',
        description: 'Descarta un prospect (persona inferida sin email confirmado) por id.',
        parameters: {
            type: 'object',
            properties: { prospectId: { type: 'string' } },
            required: ['prospectId'],
        },
    },
    {
        name: 'promote_prospect',
        description: 'Promueve un prospect a contacto confirmado con email.',
        parameters: {
            type: 'object',
            properties: {
                prospectId: { type: 'string' },
                email: { type: 'string' },
                displayName: { type: 'string' },
            },
            required: ['prospectId', 'email'],
        },
    },
    {
        name: 'link_prospect_to_contact',
        description: 'Vincula un prospect a un contacto existente.',
        parameters: {
            type: 'object',
            properties: {
                prospectId: { type: 'string' },
                personId: { type: 'string' },
            },
            required: ['prospectId', 'personId'],
        },
    },
    {
        name: 'get_prospect_link_candidates',
        description: 'Lista contactos candidatos para vincular un prospect (scores de coincidencia).',
        parameters: {
            type: 'object',
            properties: { prospectId: { type: 'string' } },
            required: ['prospectId'],
        },
    },
    {
        name: 'assign_email_to_team',
        description: 'Mueve un email de contacto al equipo indicado (mantenimiento reassign_team_email).',
        parameters: {
            type: 'object',
            properties: {
                teamId: { type: 'string' },
                email: { type: 'string' },
            },
            required: ['teamId', 'email'],
        },
    },
    {
        name: 'dismiss_team_email_reassign',
        description: 'Descarta la sugerencia de mover un email de equipo mal ubicado en un contacto.',
        parameters: {
            type: 'object',
            properties: {
                personId: { type: 'string' },
                email: { type: 'string' },
            },
            required: ['personId', 'email'],
        },
    },
    {
        name: 'create_team',
        description: 'Crea un equipo nuevo (útil al resolver emails de equipo en mantenimiento).',
        parameters: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
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
        name: 'move_todo',
        description: 'Mueve una tarea a otra columna del tablero (suggested, open, done).',
        parameters: {
            type: 'object',
            properties: {
                todoId: { type: 'string' },
                status: { type: 'string', enum: ['suggested', 'open', 'done', 'dismissed'] },
                boardPosition: { type: 'number' },
            },
            required: ['todoId', 'status'],
        },
    },
    {
        name: 'highlight_entity',
        description: 'Resalta una entidad visible en la UI (tarea, persona, etc.) con pulse/spotlight.',
        parameters: {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    enum: ['todo', 'person', 'prospect', 'project', 'team', 'meeting'],
                },
                id: { type: 'string' },
                message: { type: 'string' },
            },
            required: ['kind', 'id'],
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
        description: 'Búsqueda semántica en el CONTENIDO de las notas de reunión (no solo metadata). Ideal para "¿dónde hablamos de X?".',
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
    {
        name: 'list_ui_targets',
        description: 'Lista targets de UI disponibles para guide_user (catálogo cerrado).',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Búsqueda opcional por keyword' },
            },
        },
    },
    {
        name: 'guide_user',
        description: 'Resalta un elemento de la UI (spotlight/pulse) o navega. Solo targetId del catálogo.',
        parameters: {
            type: 'object',
            properties: {
                targetId: { type: 'string' },
                action: {
                    type: 'string',
                    enum: ['spotlight', 'pulse', 'navigate', 'navigate_and_spotlight', 'clear'],
                },
                message: { type: 'string', description: 'Tooltip corto para el usuario' },
            },
            required: ['targetId'],
        },
    },
    {
        name: 'get_calendar_today',
        description: 'Eventos de Google Calendar para una fecha. Default: hoy. Usá date="mañana" o "tomorrow" para el día siguiente, o YYYY-MM-DD.',
        parameters: {
            type: 'object',
            properties: {
                timezone: { type: 'string' },
                date: {
                    type: 'string',
                    description: 'Fecha: omitir o "hoy"/"today" (default), "mañana"/"tomorrow", o YYYY-MM-DD',
                },
            },
        },
    },
    {
        name: 'propose_action_plan',
        description: 'Propone un plan de acción multi-paso para confirmación del usuario.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                steps: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            label: { type: 'string' },
                            tool: { type: 'string' },
                            args: { type: 'object' },
                            entityRef: {
                                type: 'object',
                                properties: {
                                    kind: { type: 'string' },
                                    id: { type: 'string' },
                                    orgId: { type: 'string' },
                                },
                                required: ['kind', 'id'],
                            },
                        },
                        required: ['id', 'label', 'tool'],
                    },
                },
            },
            required: ['title', 'summary', 'steps'],
        },
    },
    {
        name: 'confirm_plan',
        description: 'Ejecuta un plan previamente propuesto (planId de propose_action_plan).',
        parameters: {
            type: 'object',
            properties: { planId: { type: 'string' } },
            required: ['planId'],
        },
    },
];
export async function executeTool(ctx, name, args) {
    if (CEREBRO_PROVIDER_TOOL_NAMES.has(name)) {
        const providerResult = await executeCerebroProviderTool(ctx, name, args);
        if (providerResult !== undefined)
            return compactToolResult(providerResult);
    }
    const uid = ctx.uid;
    let result;
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
            result = await inbox.listTodos(uid, args.status, Number(args.limit) || 50);
            break;
        case 'get_sync_progress':
            result = await sync.getSyncProgress(uid);
            break;
        case 'start_sync':
            result = await sync.startSync(uid, args.limit);
            break;
        case 'start_pipeline':
            result = await sync.startPipeline(uid, {
                limit: args.limit,
                skipAnalysis: args.skipAnalysis,
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
                limit: args.limit,
                center: args.center,
                depth: args.depth,
            });
            break;
        case 'dismiss_suggestion':
            result = await inbox.dismissSuggestion(uid, String(args.suggestionId));
            break;
        case 'get_maintenance_view':
            result = await maintenance.listMaintenance(uid);
            break;
        case 'accept_project_suggestions':
            result = await maintenance.acceptProjectSuggestions(uid, args.suggestionIds ?? [], {
                existingProjectId: args.existingProjectId,
                projectName: args.projectName,
            });
            break;
        case 'accept_team_suggestions':
            result = await maintenance.acceptTeamSuggestions(uid, args.suggestionIds ?? []);
            break;
        case 'batch_dismiss_suggestions':
            result = await maintenance.batchDismissSuggestions(uid, args.suggestionIds ?? []);
            break;
        case 'dismiss_prospect':
            result = await maintenance.dismissProspectForUser(uid, String(args.prospectId));
            break;
        case 'promote_prospect':
            result = await maintenance.promoteProspectForUser(uid, String(args.prospectId), String(args.email ?? ''), args.displayName);
            break;
        case 'link_prospect_to_contact':
            result = await maintenance.linkProspectForUser(uid, String(args.prospectId), String(args.personId));
            break;
        case 'get_prospect_link_candidates':
            result = await maintenance.getProspectLinkCandidates(uid, String(args.prospectId));
            break;
        case 'assign_email_to_team':
            result = await maintenance.assignEmailToTeamForUser(uid, String(args.teamId), String(args.email ?? ''));
            break;
        case 'dismiss_team_email_reassign':
            result = await maintenance.dismissTeamEmailReassignForUser(uid, String(args.personId), String(args.email ?? ''));
            break;
        case 'create_team':
            result = await maintenance.createTeamForUser(uid, String(args.name ?? ''));
            break;
        case 'accept_todos': {
            const batch = await inbox.acceptTodos(uid, args.todoIds ?? []);
            emitTodosEffect(ctx, 'move', batch.todos ?? [], 'accept_todos');
            result = batch;
            break;
        }
        case 'create_todo': {
            const created = await inbox.createTodoForUser(uid, {
                text: String(args.text ?? ''),
                dueAt: args.dueAt,
                projectIds: args.projectIds,
                teamIds: args.teamIds,
                assigneePersonIds: args.assigneePersonIds,
                notes: args.notes,
            });
            if (created.todo) {
                emitTodoEffect(ctx, 'create', created.todo, 'create_todo');
                emitTodoEntityCard(ctx, created.todo, 'create_todo');
            }
            result = created;
            break;
        }
        case 'update_todo': {
            const updated = await inbox.updateTodoForUser(uid, String(args.todoId), {
                text: args.text,
                dueAt: args.dueAt,
                projectIds: args.projectIds,
                teamIds: args.teamIds,
                assigneePersonIds: args.assigneePersonIds,
                notes: args.notes,
            });
            if (updated.todo) {
                emitTodoEffect(ctx, 'update', updated.todo, 'update_todo');
                emitTodoEntityCard(ctx, updated.todo, 'update_todo');
            }
            result = updated;
            break;
        }
        case 'move_todo': {
            const moved = await inbox.moveTodoForUser(uid, String(args.todoId), {
                status: String(args.status),
                boardPosition: args.boardPosition,
            });
            if (moved.todo) {
                emitTodoEffect(ctx, 'move', moved.todo, 'move_todo');
                emitTodoEntityCard(ctx, moved.todo, 'move_todo');
            }
            result = moved;
            break;
        }
        case 'complete_todos': {
            const done = await inbox.completeTodos(uid, args.todoIds ?? []);
            emitTodosEffect(ctx, 'move', done.todos ?? [], 'complete_todos');
            result = done;
            break;
        }
        case 'dismiss_todos': {
            const dismissed = await inbox.dismissTodos(uid, args.todoIds ?? []);
            emitTodosEffect(ctx, 'delete', dismissed.todos ?? [], 'dismiss_todos');
            result = dismissed;
            break;
        }
        case 'highlight_entity': {
            const kind = String(args.kind);
            const id = String(args.id);
            ctx.cerebro?.emitEntityEffect?.({
                ref: { kind, id },
                op: 'highlight',
                animation: 'pulse',
                source: 'cerebro',
                toolName: 'highlight_entity',
            });
            ctx.cerebro?.emitUiCue?.({
                id: `entity:${kind}:${id}`,
                targetId: `entity.${kind}`,
                action: 'pulse',
                message: args.message,
                entityRef: { kind, id },
            });
            result = { highlighted: { kind, id } };
            break;
        }
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
            let createdTodoId;
            if (suggestion.action.kind === 'create_todo' && suggestion.action.payload?.text) {
                const payload = suggestion.action.payload;
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
            const merged = await mergePersonsIntoCanonical(uid, String(args.canonicalId), args.mergeIds ?? []);
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
export function toolsForDomains(domains) {
    const domainToolMap = {
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
            'batch_dismiss_suggestions',
            'accept_smart_suggestion',
            'dismiss_smart_suggestion',
            'accept_todos',
            'create_todo',
            'update_todo',
            'move_todo',
            'highlight_entity',
            'complete_todos',
            'dismiss_todos',
        ],
        maintenance: [
            'get_maintenance_view',
            'get_store_health',
            'list_suggestions',
            'merge_people',
            'accept_project_suggestions',
            'accept_team_suggestions',
            'batch_dismiss_suggestions',
            'dismiss_suggestion',
            'dismiss_prospect',
            'promote_prospect',
            'link_prospect_to_contact',
            'get_prospect_link_candidates',
            'assign_email_to_team',
            'dismiss_team_email_reassign',
            'create_team',
            'analyze_meeting',
            'list_people',
            'list_prospects',
            'list_projects',
            'list_teams',
            'search_catalog',
        ],
        sync: ['get_sync_progress', 'start_sync', 'start_pipeline'],
        graph: ['get_graph'],
        actions: [
            'dismiss_suggestion',
            'batch_dismiss_suggestions',
            'accept_project_suggestions',
            'accept_team_suggestions',
            'accept_smart_suggestion',
            'dismiss_smart_suggestion',
            'accept_todos',
            'create_todo',
            'update_todo',
            'move_todo',
            'highlight_entity',
            'complete_todos',
            'dismiss_todos',
            'merge_people',
            'dismiss_prospect',
            'promote_prospect',
            'link_prospect_to_contact',
            'assign_email_to_team',
            'dismiss_team_email_reassign',
            'create_team',
            'analyze_meeting',
            'regenerate_intelligence',
            'run_repair',
            'start_sync',
            'start_pipeline',
        ],
    };
    const names = new Set();
    for (const d of domains) {
        for (const t of domainToolMap[d] ?? [])
            names.add(t);
    }
    if (!names.size)
        return ASSISTANT_TOOLS;
    return ASSISTANT_TOOLS.filter((t) => names.has(t.name));
}
