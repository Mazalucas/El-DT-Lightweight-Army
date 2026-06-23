import fs from 'node:fs';
import path from 'node:path';
import { meetingIdFromDocId, meetingIdFromPath } from './hash.js';
import { consolidateManifestByDocId } from './dedupe.js';
import { parseMeetFilename } from './parse-filename.js';
import { readGdocPointer } from './parse-gdoc.js';
import type { ManifestEntry, MeetConfig, MeetSource } from './types.js';

export interface ScannedFile {
  entry: ManifestEntry;
  docId?: string;
}

function scanDirectory(
  sourcePath: string,
  exportSubfolder: string | undefined,
  teamId: string | undefined,
): ScannedFile[] {
  const results: ScannedFile[] = [];
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });

  for (const dirent of entries) {
    if (!dirent.isFile()) continue;
    const sourceFile = dirent.name;
    const fullPath = path.join(sourcePath, sourceFile);
    const stat = fs.statSync(fullPath);
    const parsed = parseMeetFilename(sourceFile);

    if (sourceFile.endsWith('.gdoc')) {
      const ptr = readGdocPointer(fullPath);
      const meetingId = ptr ? meetingIdFromDocId(ptr.doc_id) : meetingIdFromPath(fullPath);
      results.push({
        docId: ptr?.doc_id,
        entry: {
          meetingId,
          sourcePath: fullPath,
          sourceFile,
          docId: ptr?.doc_id,
          title: parsed.title,
          startedAt: parsed.startedAt,
          timezone: parsed.timezone,
          teamId,
          mtimeMs: stat.mtimeMs,
          syncStatus: 'discovered',
          analysisStatus: 'pending',
        },
      });
      continue;
    }

    if (/\.(txt|md)$/i.test(sourceFile)) {
      results.push({
        entry: {
          meetingId: meetingIdFromPath(fullPath),
          sourcePath: fullPath,
          sourceFile,
          title: parsed.title,
          startedAt: parsed.startedAt,
          timezone: parsed.timezone,
          teamId,
          mtimeMs: stat.mtimeMs,
          syncStatus: 'discovered',
          analysisStatus: 'pending',
        },
      });
    }
  }

  if (exportSubfolder) {
    const exportDir = path.join(sourcePath, exportSubfolder);
    if (fs.existsSync(exportDir)) {
      for (const f of fs.readdirSync(exportDir)) {
        const fullPath = path.join(exportDir, f);
        if (!fs.statSync(fullPath).isFile()) continue;
        if (!/\.(txt|md)$/i.test(f)) continue;
        const parsed = parseMeetFilename(f);
        results.push({
          entry: {
            meetingId: meetingIdFromPath(fullPath),
            sourcePath: fullPath,
            sourceFile: `${exportSubfolder}/${f}`,
            title: parsed.title,
            startedAt: parsed.startedAt,
            timezone: parsed.timezone,
            teamId,
            mtimeMs: fs.statSync(fullPath).mtimeMs,
            syncStatus: 'discovered',
            analysisStatus: 'pending',
          },
        });
      }
    }
  }

  return results;
}

export function scanSource(config: MeetConfig): ScannedFile[] {
  const roots = config.sources?.length ? config.sources : [{ path: config.sourcePath }];
  const results: ScannedFile[] = [];
  const missing: string[] = [];

  for (const src of roots) {
    const root = normalizeSource(src, config);
    if (!fs.existsSync(root.path)) {
      missing.push(root.path);
      continue;
    }
    results.push(...scanDirectory(root.path, root.exportSubfolder, root.teamId));
  }

  if (results.length === 0) {
    const hint = missing.length ? missing.join('\n  ') : 'sin rutas en config';
    throw new Error(`No se encontraron archivos Meet. Carpetas ausentes o vacías:\n  ${hint}`);
  }

  if (missing.length) {
    console.warn(`[scan] ${missing.length} carpeta(s) omitida(s) — no existen en disco`);
  }

  return results;
}

function normalizeSource(src: MeetSource | string, config: MeetConfig): MeetSource {
  if (typeof src === 'string') {
    return { path: src, exportSubfolder: config.exportSubfolder };
  }
  return {
    path: src.path,
    teamId: src.teamId,
    exportSubfolder: src.exportSubfolder ?? config.exportSubfolder,
  };
}

export function mergeScanIntoManifest(
  existing: Map<string, ManifestEntry>,
  scanned: ScannedFile[],
): Map<string, ManifestEntry> {
  const next = new Map(existing);
  const docToMeetingId = new Map<string, string>();
  for (const entry of next.values()) {
    if (entry.docId) docToMeetingId.set(entry.docId, entry.meetingId);
  }

  for (const { entry: raw } of scanned) {
    let entry = { ...raw };
    if (entry.docId) {
      entry.meetingId = meetingIdFromDocId(entry.docId);
      const prevByDoc = docToMeetingId.get(entry.docId);
      if (prevByDoc && prevByDoc !== entry.meetingId) {
        const stale = next.get(prevByDoc);
        if (stale) next.delete(prevByDoc);
      }
      docToMeetingId.set(entry.docId, entry.meetingId);
    }

    const prev = next.get(entry.meetingId);
    if (!prev) {
      next.set(entry.meetingId, entry);
      continue;
    }
    next.set(entry.meetingId, {
      ...prev,
      sourcePath: entry.sourcePath,
      sourceFile: entry.sourceFile,
      title: entry.title,
      startedAt: entry.startedAt ?? prev.startedAt,
      timezone: entry.timezone ?? prev.timezone,
      docId: entry.docId ?? prev.docId,
      teamId: entry.teamId ?? prev.teamId,
      mtimeMs: Math.max(entry.mtimeMs, prev.mtimeMs),
    });
  }
  return next;
}

export function finalizeManifest(
  manifest: Map<string, ManifestEntry>,
  mirrorPath?: string,
): { manifest: Map<string, ManifestEntry>; duplicatesMerged: number; mirrorFilesRemoved: number } {
  const result = consolidateManifestByDocId(manifest, mirrorPath);
  return {
    manifest: result.manifest,
    duplicatesMerged: result.merged,
    mirrorFilesRemoved: result.mirrorFilesRemoved,
  };
}
