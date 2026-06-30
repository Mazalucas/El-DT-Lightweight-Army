/** Ambient UI target registry — closed catalog for guide_user / spotlight. */
export const CEREBRO_UI_REGISTRY = [
    {
        id: 'sync.run_button',
        label: 'Sincronizar ahora',
        description: 'Botón principal del panel de sync en el header',
        routes: '*',
        keywords: ['sync', 'sincronizar', 'drive', 'meet', 'notas'],
    },
    {
        id: 'sync.panel_expand',
        label: 'Panel de sincronización',
        description: 'Desplegar detalle del progreso de sync',
        routes: '*',
        keywords: ['progreso', 'sync', 'estado'],
    },
    {
        id: 'nav.hoy',
        label: 'Inicio / Hoy',
        description: 'Entrada del menú al panel principal del día',
        routes: '*',
        navigate: { hash: '#/' },
        keywords: ['hoy', 'inicio', 'home', 'dashboard'],
    },
    {
        id: 'nav.reuniones',
        label: 'Reuniones',
        description: 'Lista de reuniones importadas',
        routes: '*',
        navigate: { hash: '#/reuniones' },
        keywords: ['reuniones', 'meet', 'calendario'],
    },
    {
        id: 'nav.tareas',
        label: 'Tareas',
        description: 'Tablero Kanban de tareas',
        routes: '*',
        navigate: { hash: '#/tareas' },
        keywords: ['tareas', 'kanban', 'tablero', 'todo'],
    },
    {
        id: 'nav.personas',
        label: 'Personas',
        description: 'Directorio de contactos y prospects',
        routes: '*',
        navigate: { hash: '#/personas' },
        keywords: ['personas', 'contactos', 'prospects'],
    },
    {
        id: 'nav.proyectos',
        label: 'Proyectos',
        description: 'Proyectos y equipos',
        routes: '*',
        navigate: { hash: '#/proyectos' },
        keywords: ['proyectos', 'equipos'],
    },
    {
        id: 'nav.mantenimiento',
        label: 'Mantenimiento',
        description: 'Limpieza de datos: duplicados, asignaciones, prospects',
        routes: '*',
        navigate: { hash: '#/mantenimiento' },
        keywords: ['mantenimiento', 'limpieza', 'duplicados', 'asignaciones', 'inbox'],
    },
    {
        id: 'maintenance.page',
        label: 'Panel de mantenimiento',
        description: 'Lista de tareas de limpieza detectadas automáticamente',
        routes: ['mantenimiento'],
        keywords: ['mantenimiento', 'limpieza', 'duplicados', 'prospects'],
    },
    {
        id: 'nav.red',
        label: 'Red',
        description: 'Grafo de relaciones',
        routes: '*',
        navigate: { hash: '#/red' },
        keywords: ['red', 'grafo', 'relaciones'],
    },
    {
        id: 'nav.cerebro',
        label: 'Cerebro',
        description: 'Chat expandido con historial',
        routes: '*',
        navigate: { hash: '#/cerebro' },
        keywords: ['cerebro', 'chat', 'asistente', 'ia'],
    },
    {
        id: 'nav.ajustes',
        label: 'Ajustes',
        description: 'Entrada del menú lateral a configuración',
        routes: '*',
        navigate: { hash: '#/ajustes' },
        keywords: ['ajustes', 'configuración', 'settings'],
    },
    {
        id: 'nav.buscar',
        label: 'Buscar',
        description: 'Búsqueda global en el cerebro',
        routes: '*',
        navigate: { hash: '#/buscar' },
        keywords: ['buscar', 'search', 'encontrar'],
    },
    {
        id: 'nav.empresa',
        label: 'Empresa',
        description: 'Organizaciones y workspaces',
        routes: '*',
        navigate: { hash: '#/empresa' },
        keywords: ['empresa', 'org', 'organización'],
    },
    {
        id: 'settings.google_connect',
        label: 'Conectar Google',
        description: 'OAuth Drive/Meet en Ajustes → Profesional',
        routes: ['ajustes'],
        navigate: { hash: '#/ajustes', settingsSection: 'profesional' },
        keywords: ['google', 'oauth', 'drive', 'conectar'],
    },
    {
        id: 'settings.ai_provider',
        label: 'API key de IA',
        description: 'BYOK en Ajustes → IA',
        routes: ['ajustes'],
        navigate: { hash: '#/ajustes', settingsSection: 'ia' },
        keywords: ['api key', 'gemini', 'openai', 'ia'],
    },
    {
        id: 'settings.cerebro_prefs',
        label: 'Preferencias de Cerebro',
        description: 'Proactividad y umbrales de avisos',
        routes: ['ajustes'],
        navigate: { hash: '#/ajustes', settingsSection: 'cerebro' },
        keywords: ['cerebro', 'proactivo', 'avisos', 'recordatorios'],
    },
];
export const CEREBRO_ENTITY_REGISTRY = [
    { id: 'todo.card', kind: 'todo', label: 'Tarjeta de tarea', routes: ['tareas', 'org-tareas', 'home'], domAttribute: 'data-cerebro-entity' },
    { id: 'todo.row', kind: 'todo', label: 'Fila compacta de tarea (Hoy)', routes: ['home'], domAttribute: 'data-cerebro-entity' },
    { id: 'smart_suggestion.card', kind: 'smart_suggestion', label: 'Sugerencia inteligente', routes: ['home', 'tareas'], domAttribute: 'data-cerebro-entity' },
    { id: 'person.row', kind: 'person', label: 'Fila de persona', routes: ['personas', 'org-personas'], domAttribute: 'data-cerebro-entity' },
    { id: 'meeting.header', kind: 'meeting', label: 'Detalle de reunión', routes: ['reunion-detalle'], domAttribute: 'data-cerebro-entity' },
];
export function getEntityTemplate(id) {
    return CEREBRO_ENTITY_REGISTRY.find((t) => t.id === id);
}
export function getUiTarget(id) {
    return CEREBRO_UI_REGISTRY.find((t) => t.id === id);
}
export function listUiTargetsForRoute(route) {
    return CEREBRO_UI_REGISTRY.filter((t) => t.routes === '*' || t.routes.includes(route));
}
export function searchUiTargets(query, route) {
    const q = query.toLowerCase().trim();
    const pool = route ? listUiTargetsForRoute(route) : CEREBRO_UI_REGISTRY;
    if (!q)
        return pool;
    return pool.filter((t) => t.id.includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q) || q.includes(k)));
}
