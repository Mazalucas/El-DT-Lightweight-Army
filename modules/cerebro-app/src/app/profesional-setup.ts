import type { MeetSourceType, UserAppSettings } from '@shared/types.js';

export type SetupStepId = 'google' | 'folders' | 'test' | 'schedule';

export interface SetupStep {
  id: SetupStepId;
  num: number;
  title: string;
  summary: string;
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'google',
    num: 1,
    title: 'Conectar Google',
    summary: 'Autorizá lectura de Drive y Docs para sincronizar documentos «Notas de Gemini».',
  },
  {
    id: 'folders',
    num: 2,
    title: 'Carpetas de transcripciones',
    summary: 'Elegí una o más carpetas en Drive (Meet Recordings, inbox, equipo u otras).',
  },
  {
    id: 'test',
    num: 3,
    title: 'Probar fuentes',
    summary: 'Verificá que cada carpeta contiene documentos «Notas de Gemini» de reuniones.',
  },
  {
    id: 'schedule',
    num: 4,
    title: 'Automatización',
    summary: 'Programá la sincronización diaria o usá «Sincronizar ahora» en Profesional.',
  },
];

export function evaluateSetupStep(
  stepId: SetupStepId,
  settings: UserAppSettings,
  googleConnected: boolean,
): 'done' | 'pending' | 'optional' {
  switch (stepId) {
    case 'google':
      return googleConnected ? 'done' : 'pending';
    case 'folders':
      return settings.meetSources.length > 0 ? 'done' : 'pending';
    case 'test':
      return settings.meetSources.length > 0 ? 'optional' : 'pending';
    case 'schedule':
      return settings.syncSchedule?.enabled ? 'done' : 'optional';
    default:
      return 'pending';
  }
}

export function isProfesionalSetupComplete(
  settings: UserAppSettings,
  googleConnected: boolean,
): boolean {
  return (
    evaluateSetupStep('google', settings, googleConnected) === 'done' &&
    evaluateSetupStep('folders', settings, googleConnected) === 'done'
  );
}

export const SOURCE_TYPE_LABELS: Record<MeetSourceType, string> = {
  primary: 'Meet Recordings (propia)',
  team: 'Carpeta de equipo',
  shared_inbox: 'Inbox Notas de Gemini compartidas',
};

export const APPS_SCRIPT_GUIDE_URL = '/docs/02_guides/cerebro-meet-apps-script.md';

export const APPS_SCRIPT_SOURCE = `/**
 * Cerebro Meet Inbox — copia Notas de Gemini compartidas a una carpeta propia.
 * Reemplazá INBOX_FOLDER_ID con el ID de tu carpeta destino.
 */
const INBOX_FOLDER_ID = 'PEGAR_FOLDER_ID_AQUI';

function copySharedGeminiNotesToInbox() {
  const inbox = DriveApp.getFolderById(INBOX_FOLDER_ID);
  const existing = listExistingSourceDocIds(inbox);
  const shared = DriveApp.searchFiles(
    "sharedWithMe and mimeType='application/vnd.google-apps.document' and trashed=false"
  );
  while (shared.hasNext()) {
    const file = shared.next();
    if (!/ - Notas de Gemini$/i.test(file.getName())) continue;
    const sourceId = file.getId();
    if (existing.has(sourceId)) continue;
    const copy = file.makeCopy(file.getName(), inbox);
    copy.setDescription('cerebro-source-doc:' + sourceId);
    existing.add(sourceId);
  }
}

function listExistingSourceDocIds(folder) {
  const ids = new Set();
  const files = folder.getFiles();
  while (files.hasNext()) {
    const m = (files.next().getDescription() || '').match(/cerebro-source-doc:([a-zA-Z0-9_-]+)/);
    if (m) ids.add(m[1]);
  }
  return ids;
}`;

export const FOLDER_LOCATE_GUIDE = `Dónde están tus Notas de Gemini:

1. Google Meet guarda automáticamente un documento «Notas de Gemini» por reunión.
2. Suele estar en la carpeta Meet Recordings de tu Drive (o en una carpeta de equipo).
3. Cada documento incluye resumen, detalles y la sección Transcripción.
4. En Cerebro, usá «Abrir Google Drive» para elegir una o más carpetas fuente.`;
