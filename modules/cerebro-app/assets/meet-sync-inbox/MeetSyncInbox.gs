/**
 * Cerebro Meet Inbox — copia notas Gemini compartidas a una carpeta propia.
 * Configurá INBOX_FOLDER_ID con el ID de tu carpeta destino (p. ej. Cerebro/Meet Inbox).
 */
const INBOX_FOLDER_ID = 'PEGAR_FOLDER_ID_AQUI';
const GEMINI_SUFFIX = / - Notas de Gemini$/i;

function copySharedGeminiNotesToInbox() {
  const inbox = DriveApp.getFolderById(INBOX_FOLDER_ID);
  const existingSourceIds = listExistingSourceDocIds(inbox);
  const shared = DriveApp.searchFiles(
    "sharedWithMe and mimeType='application/vnd.google-apps.document' and trashed=false"
  );
  let copied = 0;
  let skipped = 0;

  while (shared.hasNext()) {
    const file = shared.next();
    const name = file.getName();
    if (!GEMINI_SUFFIX.test(name)) {
      skipped++;
      continue;
    }
    const sourceId = file.getId();
    if (existingSourceIds.has(sourceId)) {
      skipped++;
      continue;
    }
    const copy = file.makeCopy(name, inbox);
    copy.setDescription('cerebro-source-doc:' + sourceId);
    existingSourceIds.add(sourceId);
    copied++;
  }

  Logger.log('Cerebro Meet Inbox: copied=' + copied + ' skipped=' + skipped);
}

function listExistingSourceDocIds(folder) {
  const ids = new Set();
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    const desc = f.getDescription() || '';
    const m = desc.match(/cerebro-source-doc:([a-zA-Z0-9_-]+)/);
    if (m) ids.add(m[1]);
  }
  return ids;
}
