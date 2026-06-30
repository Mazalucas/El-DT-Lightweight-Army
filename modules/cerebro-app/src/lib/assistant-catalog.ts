/** Catálogo UX: qué puede hacer el asistente (alineado con tools del backend). */

export type PromptCategory = 'consultar' | 'buscar' | 'actuar' | 'salud';

export interface AssistantPrompt {
  id: string;
  label: string;
  prompt: string;
  category: PromptCategory;
}

export const ASSISTANT_PROMPTS: AssistantPrompt[] = [
  {
    id: 'health-summary',
    label: 'Resumen de salud',
    prompt: '¿Cuál es la salud de mi cerebro profesional? Dame métricas de contactos, reuniones y problemas.',
    category: 'salud',
  },
  {
    id: 'contacts-count',
    label: '¿Cuántos contactos?',
    prompt: '¿Cuántos contactos tengo y cuántos prospects pendientes?',
    category: 'consultar',
  },
  {
    id: 'recent-meetings',
    label: 'Últimas reuniones',
    prompt: 'Listame las 10 reuniones más recientes con título y fecha.',
    category: 'consultar',
  },
  {
    id: 'search-meeting',
    label: 'Buscar en reuniones',
    prompt: 'Buscá reuniones que mencionen [escribí el tema o persona].',
    category: 'buscar',
  },
  {
    id: 'inbox-suggestions',
    label: 'Sugerencias del inbox',
    prompt: '¿Qué sugerencias de proyectos, equipos o tareas tengo pendientes en el inbox?',
    category: 'consultar',
  },
  {
    id: 'maintenance-pending',
    label: 'Mantenimiento pendiente',
    prompt: '¿Qué tareas de mantenimiento tengo pendientes? Resumí por categoría y sugerí prioridades.',
    category: 'consultar',
  },
  {
    id: 'maintenance-high-confidence',
    label: 'Confirmar asignaciones seguras',
    prompt: 'Confirmá las asignaciones de proyecto o equipo con confianza alta en mantenimiento.',
    category: 'actuar',
  },
  {
    id: 'sync-status',
    label: 'Estado del sync',
    prompt: '¿Hay un sync o reparación en curso? ¿Cuál es el progreso?',
    category: 'consultar',
  },
  {
    id: 'run-repair',
    label: 'Reparar cerebro',
    prompt: 'Iniciá una reparación del store si hace falta y decime cómo seguir el progreso.',
    category: 'actuar',
  },
  {
    id: 'run-sync',
    label: 'Sincronizar Drive',
    prompt: 'Iniciá una sincronización de notas Meet desde Drive en segundo plano.',
    category: 'actuar',
  },
  {
    id: 'graph-overview',
    label: 'Red de relaciones',
    prompt: 'Mostrame un resumen del grafo: personas, proyectos y reuniones más conectadas.',
    category: 'consultar',
  },
];

export const TOOL_LABELS: Record<string, string> = {
  get_store_health: 'Consultando salud',
  get_store_summary: 'Leyendo resumen',
  list_meetings: 'Listando reuniones',
  search_meetings: 'Buscando reuniones',
  search_catalog: 'Buscando en catálogo',
  get_meeting: 'Abriendo reunión',
  get_meeting_content: 'Leyendo nota',
  list_people: 'Listando contactos',
  list_prospects: 'Listando prospects',
  list_projects: 'Listando proyectos',
  list_teams: 'Listando equipos',
  list_suggestions: 'Leyendo inbox',
  list_todos: 'Listando tareas',
  get_sync_progress: 'Consultando progreso',
  start_sync: 'Iniciando sync',
  start_pipeline: 'Iniciando pipeline',
  run_repair: 'Iniciando reparación',
  get_graph: 'Armando grafo',
  dismiss_suggestion: 'Descartando sugerencia',
  accept_todos: 'Aceptando tareas',
  create_todo: 'Creando tarea',
  update_todo: 'Actualizando tarea',
  complete_todos: 'Completando tareas',
  dismiss_todos: 'Descartando tareas',
  semantic_search: 'Buscando en el contenido',
  list_smart_suggestions: 'Leyendo sugerencias IA',
  accept_smart_suggestion: 'Aceptando sugerencia',
  dismiss_smart_suggestion: 'Descartando sugerencia',
  merge_people: 'Unificando contactos',
  get_maintenance_view: 'Leyendo mantenimiento',
  accept_project_suggestions: 'Confirmando proyectos',
  accept_team_suggestions: 'Confirmando equipos',
  batch_dismiss_suggestions: 'Descartando sugerencias',
  dismiss_prospect: 'Descartando prospect',
  promote_prospect: 'Confirmando persona',
  link_prospect_to_contact: 'Vinculando prospect',
  get_prospect_link_candidates: 'Buscando candidatos',
  assign_email_to_team: 'Moviendo email a equipo',
  dismiss_team_email_reassign: 'Descartando sugerencia',
  create_team: 'Creando equipo',
  analyze_meeting: 'Analizando reunión',
  regenerate_intelligence: 'Regenerando inteligencia',
};

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  consultar: 'Consultar datos',
  buscar: 'Buscar',
  actuar: 'Actuar',
  salud: 'Salud',
};

export function labelForTool(name: string): string {
  return TOOL_LABELS[name] ?? name.replaceAll('_', ' ');
}
