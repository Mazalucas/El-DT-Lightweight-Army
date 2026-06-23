/** Pasos del flujo CerebroWork — accesibles desde el menú Acciones. */
export type WorkflowStepId =
  | 'setup-sources'
  | 'index'
  | 'oauth'
  | 'sync'
  | 'import'
  | 'process-all'
  | 'analyze'
  | 'apply-analysis';

export type WorkflowStep = {
  id: WorkflowStepId;
  num: number;
  title: string;
  summary: string;
  /** Ejecutable desde la app (API dev). */
  appRunnable: boolean;
  /** Requiere servidor Vite con APIs (no solo estático). */
  needsDevServer: boolean;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'setup-sources',
    num: 0,
    title: 'Configurar fuentes Meet',
    summary:
      'Editá `.local/config.yaml`: Meet Recordings, carpetas de equipo y inbox de compartidos (Apps Script). Guía: docs/02_guides/cerebro-meet-apps-script.md',
    appRunnable: false,
    needsDevServer: false,
  },
  {
    id: 'index',
    num: 1,
    title: 'Indexar carpetas Meet',
    summary:
      'Escanea todas las rutas en `.local/config.yaml` (p. ej. Meet Recordings + Innovación) y actualiza `manifest.jsonl`.',
    appRunnable: true,
    needsDevServer: true,
  },
  {
    id: 'oauth',
    num: 2,
    title: 'Autorizar Google (OAuth)',
    summary:
      'Primera vez o token caducado: en terminal, `cd modules/meet-notes-sync && npm run auth`. Luego sincronizar.',
    appRunnable: false,
    needsDevServer: false,
  },
  {
    id: 'sync',
    num: 3,
    title: 'Sincronizar notas',
    summary:
      'Descarga el texto de cada `.gdoc` vía Drive API y escribe `.local/mirror/*.md` (con `teamId` si aplica).',
    appRunnable: true,
    needsDevServer: true,
  },
  {
    id: 'import',
    num: 4,
    title: 'Importar al cerebro',
    summary:
      'Lee el mirror local → IndexedDB: reuniones, participantes y proyectos detectados en el texto.',
    appRunnable: true,
    needsDevServer: false,
  },
  {
    id: 'process-all',
    num: 5,
    title: 'Procesar todo (automático)',
    summary:
      'Enriquece reuniones (resumen, proyectos, estado) desde el mirror. No asigna miembros a equipos — eso es manual en Contactos/Equipos.',
    appRunnable: true,
    needsDevServer: true,
  },
  {
    id: 'analyze',
    num: 6,
    title: 'Refinar con IA (Cursor)',
    summary:
      'Opcional: en Cursor, `/cerebro-work` o pedir al DT analizar reuniones → JSON en `vitals/work/inbox/`.',
    appRunnable: false,
    needsDevServer: false,
  },
  {
    id: 'apply-analysis',
    num: 7,
    title: 'Aplicar análisis Cursor',
    summary:
      'Fusiona el último JSON de inbox (contactos/proyectos extra) con lo que ya hay en la app.',
    appRunnable: true,
    needsDevServer: false,
  },
];

export function getWorkflowStep(id: WorkflowStepId): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find((s) => s.id === id);
}

export const OAUTH_GUIDE = `Google OAuth (una vez por máquina; re-auth si cambian scopes)

1. Google Cloud Console → habilitar Google Docs API + Google Drive API.
2. Credenciales OAuth (Desktop) → descargá client_secret*.json como modules/meet-notes-sync/.local/google-credentials.json
3. Tipo Desktop (Escritorio) — correcto. No crear cliente Web para local.
4. Terminal:
   cd modules/meet-notes-sync
   npm install
   npm run auth
5. Volvé a la app → Acciones → Sincronizar (paso 3). Con mirrors viejos: Pipeline completo (1→5).

Scopes: lectura Docs + metadatos Drive (emails compartidos).`;

export const CURSOR_ANALYZE_CMD =
  '/procesar-reuniones — analizá las notas en modules/cerebro-profesional/.local/mirror/ y escribí el resultado en analysis-inbox.jsonl';

export const APPS_SCRIPT_GUIDE = `Inbox de notas compartidas (Apps Script)

1. Creá carpeta Drive «Cerebro/Meet Inbox» y copiá su ruta en config.yaml (sources[]).
2. Instalá el script: modules/cerebro-app/assets/meet-sync-inbox/MeetSyncInbox.gs
3. Guía completa: docs/02_guides/cerebro-meet-apps-script.md (DOC-GUIDE-012)

En la nube (cerebro-app): mismo script; en local usás la ruta Desktop de esa carpeta.`;

export const SETUP_SOURCES_GUIDE = `Fuentes en modules/cerebro-profesional/.local/config.yaml

sources:
  - path: "~/Library/CloudStorage/.../Meet Recordings"          # primary
  - path: ".../.shortcut-targets-by-id/.../Meet Recordings"       # team (teamId: innovacion)
  - path: "~/.../Cerebro/Meet Inbox"                              # shared_inbox (Apps Script)

Paridad cloud: cada path ≈ meetSource.driveFolderId en cerebro-app Ajustes → Setup.`;

export function stepTag(s: WorkflowStep): 'app' | 'cursor' | 'guide' {
  if (s.id === 'oauth' || s.id === 'setup-sources') return 'guide';
  if (s.id === 'analyze') return 'cursor';
  return 'app';
}

export function stepActionLabel(s: WorkflowStep): string | null {
  if (s.id === 'oauth') return 'Ver guía OAuth';
  if (s.id === 'setup-sources') return 'Ver guía fuentes';
  if (s.id === 'analyze') return 'Copiar comando';
  if (s.appRunnable) return 'Ejecutar';
  return null;
}
