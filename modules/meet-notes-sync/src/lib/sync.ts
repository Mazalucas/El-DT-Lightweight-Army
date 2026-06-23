import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './hash.js';
import { hasGoogleAuth, fetchGoogleDoc, fetchDrivePermissions } from './google-auth.js';
import { readManifest, writeManifest } from './manifest.js';
import { writeFromParsedDoc, writeStubMarkdown, writeMeetingMarkdown, CURRENT_SYNC_VERSION } from './markdown-writer.js';
import { parseMeetFilename } from './parse-filename.js';
import { readGdocPointer } from './parse-gdoc.js';
import { ensureDirs, loadConfig, repoRootFrom } from './paths.js';
import { mergeScanIntoManifest, scanSource, finalizeManifest } from './scanner.js';
import { formatProgressLine, writeSyncProgress } from './progress.js';
import type { ManifestEntry, MeetConfig, SyncResult, MeetingFrontmatter } from './types.js';

export interface SyncOptions {
  repoRoot: string;
  moduleRoot: string;
  scanOnly?: boolean;
  limit?: number;
  /** Re-descargar notas aunque el manifest diga synced (p. ej. tras configurar OAuth). */
  force?: boolean;
}

export function runScan(opts: SyncOptions): SyncResult {
  const config = loadConfig(opts.repoRoot);
  ensureDirs(config);
  const manifest = readManifest(config.manifestPath);
  const scanned = scanSource(config);
  const merged = mergeScanIntoManifest(manifest, scanned);
  const { manifest: deduped, duplicatesMerged, mirrorFilesRemoved } = finalizeManifest(
    merged,
    config.mirrorPath,
  );
  writeManifest(config.manifestPath, deduped);
  const messages = [
    `Índice actualizado: ${scanned.length} archivos, ${deduped.size} en manifest.`,
  ];
  if (duplicatesMerged > 0) {
    messages.push(`${duplicatesMerged} duplicado(s) unificado(s) por docId.`);
  }
  if (mirrorFilesRemoved > 0) {
    messages.push(`${mirrorFilesRemoved} archivo(s) mirror huérfano(s) eliminado(s).`);
  }
  return {
    scanned: scanned.length,
    synced: 0,
    skipped: 0,
    errors: 0,
    messages,
  };
}

export async function runSync(opts: SyncOptions): Promise<SyncResult> {
  const config = loadConfig(opts.repoRoot);
  ensureDirs(config);
  const startedAt = new Date().toISOString();

  writeSyncProgress(opts.repoRoot, {
    phase: 'scan',
    current: 0,
    total: 0,
    done: false,
    startedAt,
    currentTitle: 'Escaneando carpeta Drive…',
    result: undefined,
    error: undefined,
  });

  const scanResult = runScan(opts);
  if (opts.scanOnly) {
    writeSyncProgress(opts.repoRoot, {
      phase: 'idle',
      done: true,
      finishedAt: new Date().toISOString(),
      result: { ...scanResult, messages: scanResult.messages },
    });
    return scanResult;
  }

  const manifest = readManifest(config.manifestPath);
  const canGoogle = hasGoogleAuth(opts.moduleRoot);
  let synced = 0;
  let skipped = 0;
  let errors = 0;
  const messages = [...scanResult.messages];

  const pending = [...manifest.values()].filter((e) => {
    if (opts.force && isStubMirror(e, config)) return true;
    return e.syncStatus !== 'synced' || needsResync(e, config);
  });
  const toProcess = opts.limit ? pending.slice(0, opts.limit) : pending;
  const total = toProcess.length;

  writeSyncProgress(opts.repoRoot, {
    phase: 'sync',
    current: 0,
    total,
    done: false,
    currentTitle: total ? toProcess[0]?.title : 'Nada pendiente',
  });

  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    const current = i + 1;
    writeSyncProgress(opts.repoRoot, {
      phase: 'sync',
      current,
      total,
      currentTitle: entry.title,
    });
    console.error(formatProgressLine(current, total, entry.title));

    try {
      const result = await syncOneEntry(entry, config, opts.moduleRoot, canGoogle);
      manifest.set(entry.meetingId, result);
      if (result.syncStatus === 'synced') synced++;
      else if (result.syncStatus === 'skipped') skipped++;
      else errors++;
    } catch (e) {
      errors++;
      entry.syncStatus = 'sync_error';
      entry.syncError = e instanceof Error ? e.message : String(e);
      manifest.set(entry.meetingId, entry);
    }
  }

  writeManifest(config.manifestPath, manifest);
  messages.push(`Sync: ${synced} actualizados, ${skipped} sin cambios, ${errors} errores.`);
  if (!canGoogle) {
    messages.push(
      'OAuth no configurado: se generaron stubs. Ejecutá `npm run auth` en meet-notes-sync.',
    );
  }

  const finalResult = { scanned: scanResult.scanned, synced, skipped, errors, messages };
  writeSyncProgress(opts.repoRoot, {
    phase: 'idle',
    current: total,
    total,
    done: true,
    finishedAt: new Date().toISOString(),
    currentTitle: undefined,
    result: finalResult,
  });

  return finalResult;
}

function isStubMirror(entry: ManifestEntry, config: MeetConfig): boolean {
  const p = entry.mirrorPath ?? path.join(config.mirrorPath, `${entry.meetingId}.md`);
  if (!fs.existsSync(p)) return false;
  return fs.readFileSync(p, 'utf8').includes('## Pendiente de contenido');
}

function needsResync(entry: ManifestEntry, config: MeetConfig): boolean {
  if (!entry.mirrorPath || !fs.existsSync(entry.mirrorPath)) return true;
  try {
    const content = fs.readFileSync(entry.mirrorPath, 'utf8');
    if (!content.includes(`syncVersion: ${CURRENT_SYNC_VERSION}`)) return true;
    const stat = fs.statSync(entry.sourcePath);
    return stat.mtimeMs > entry.mtimeMs;
  } catch {
    return true;
  }
}

function inviteesFromDrive(invitees: { name?: string; email: string }[]): MeetingFrontmatter['sharedWith'] {
  return invitees.map((i) => ({
    email: i.email.toLowerCase(),
    name: i.name,
    role: 'invitee',
    type: 'user',
  }));
}

async function syncOneEntry(
  entry: ManifestEntry,
  config: MeetConfig,
  moduleRoot: string,
  canGoogle: boolean,
): Promise<ManifestEntry> {
  const parsed = parseMeetFilename(entry.sourceFile);
  const participants = parsed.participantsFromTitle;
  const now = new Date().toISOString();

  if (entry.sourcePath.endsWith('.gdoc') && entry.docId && canGoogle) {
    const { revisionId, parsed: docParsed } = await fetchGoogleDoc(moduleRoot, entry.docId);
    const sharedWith = await fetchDrivePermissions(moduleRoot, entry.docId);
    const gdocPtr = readGdocPointer(entry.sourcePath);
    const contentHash = sha256(revisionId ?? docParsed.plainText);
    if (entry.contentHash === contentHash && entry.syncStatus === 'synced' && entry.mirrorPath) {
      const existing = fs.readFileSync(entry.mirrorPath, 'utf8');
      if (existing.includes(`syncVersion: ${CURRENT_SYNC_VERSION}`)) {
        return { ...entry, syncStatus: 'skipped' };
      }
    }
    const fm: MeetingFrontmatter = {
      meetingId: entry.meetingId,
      docId: entry.docId,
      sourceFile: entry.sourceFile,
      title: entry.title,
      startedAt: entry.startedAt,
      timezone: entry.timezone,
      participants,
      teamId: entry.teamId,
      ownerEmail: gdocPtr?.email?.toLowerCase(),
      sharedWith: sharedWith.length ? sharedWith : inviteesFromDrive(docParsed.invitees),
      syncedAt: now,
      contentHash,
      syncVersion: CURRENT_SYNC_VERSION,
    };
    const mirrorPath = writeFromParsedDoc(config.mirrorPath, fm, docParsed);
    return {
      ...entry,
      mirrorPath,
      contentHash,
      syncStatus: 'synced',
      lastSyncedAt: now,
      syncError: undefined,
      mtimeMs: fs.statSync(entry.sourcePath).mtimeMs,
    };
  }

  if (/\.(txt|md)$/i.test(entry.sourcePath)) {
    const text = fs.readFileSync(entry.sourcePath, 'utf8');
    const contentHash = sha256(text);
    const fm: MeetingFrontmatter = {
      meetingId: entry.meetingId,
      sourceFile: entry.sourceFile,
      title: entry.title,
      startedAt: entry.startedAt,
      timezone: entry.timezone,
      participants,
      teamId: entry.teamId,
      syncedAt: now,
      contentHash,
      syncVersion: CURRENT_SYNC_VERSION,
    };
    const mirrorPath = writeMeetingMarkdown(
      config.mirrorPath,
      entry.meetingId,
      fm,
      `## Notas\n\n${text.trim()}`,
    );
    return {
      ...entry,
      mirrorPath,
      contentHash,
      syncStatus: 'synced',
      lastSyncedAt: now,
      mtimeMs: fs.statSync(entry.sourcePath).mtimeMs,
    };
  }

  const fm: MeetingFrontmatter = {
    meetingId: entry.meetingId,
    docId: entry.docId,
    sourceFile: entry.sourceFile,
    title: entry.title,
    startedAt: entry.startedAt,
    timezone: entry.timezone,
    participants,
    teamId: entry.teamId,
    syncedAt: now,
    contentHash: sha256(entry.sourceFile + entry.mtimeMs),
    syncVersion: CURRENT_SYNC_VERSION,
  };
  const note = canGoogle
    ? 'No se pudo obtener contenido.'
    : 'Configurá OAuth (`npm run auth` en meet-notes-sync) o exportá el Doc a Meet Recordings/_export/.';
  const mirrorPath = writeStubMarkdown(config.mirrorPath, fm, note);
  return {
    ...entry,
    mirrorPath,
    syncStatus: 'synced',
    lastSyncedAt: now,
    mtimeMs: entry.mtimeMs,
  };
}

export { loadConfig, ensureDirs };

export function defaultModuleRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

export function defaultRepoRoot(): string {
  return repoRootFrom(defaultModuleRoot());
}
