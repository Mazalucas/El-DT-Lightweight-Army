import fs from 'node:fs';
import path from 'node:path';
import { meetingIdFromDocId } from './hash.js';
import type { ManifestEntry } from './types.js';

export interface ManifestDedupeResult {
  manifest: Map<string, ManifestEntry>;
  merged: number;
  mirrorFilesRemoved: number;
}

/** Unifica entradas del manifest que apuntan al mismo Google Doc (docId). */
export function consolidateManifestByDocId(
  manifest: Map<string, ManifestEntry>,
  mirrorPath?: string,
): ManifestDedupeResult {
  const byDocId = new Map<string, ManifestEntry[]>();
  const noDoc: ManifestEntry[] = [];

  for (const entry of manifest.values()) {
    if (entry.docId) {
      const list = byDocId.get(entry.docId) ?? [];
      list.push(entry);
      byDocId.set(entry.docId, list);
    } else {
      noDoc.push(entry);
    }
  }

  let merged = 0;
  const next = new Map<string, ManifestEntry>();
  const removedMeetingIds = new Set<string>();

  for (const entry of noDoc) {
    next.set(entry.meetingId, entry);
  }

  for (const [docId, group] of byDocId) {
    if (group.length === 1) {
      const canonical = normalizeDocEntry(group[0], docId);
      next.set(canonical.meetingId, canonical);
      if (canonical.meetingId !== group[0].meetingId) {
        removedMeetingIds.add(group[0].meetingId);
        merged++;
      }
      continue;
    }

    const canonicalId = meetingIdFromDocId(docId);
    const sorted = [...group].sort((a, b) => scoreEntry(b) - scoreEntry(a));
    const primary = sorted[0];
    const alternatePaths = [
      ...new Set(group.map((e) => e.sourcePath).filter((p) => p !== primary.sourcePath)),
    ];

    const mergedEntry: ManifestEntry = {
      ...primary,
      meetingId: canonicalId,
      docId,
      sourcePath: primary.sourcePath,
      sourceFile: primary.sourceFile,
      title: primary.title || sorted.find((e) => e.title)?.title || canonicalId,
      startedAt: primary.startedAt ?? sorted.find((e) => e.startedAt)?.startedAt,
      timezone: primary.timezone ?? sorted.find((e) => e.timezone)?.timezone,
      teamId: primary.teamId ?? sorted.find((e) => e.teamId)?.teamId,
      mirrorPath:
        primary.mirrorPath ??
        sorted.find((e) => e.mirrorPath)?.mirrorPath ??
        (mirrorPath ? path.join(mirrorPath, `${canonicalId}.md`) : undefined),
      mtimeMs: Math.max(...group.map((e) => e.mtimeMs)),
      contentHash: primary.contentHash ?? sorted.find((e) => e.contentHash)?.contentHash,
      syncStatus: pickBestStatus(group),
      analysisStatus: primary.analysisStatus ?? 'pending',
      lastSyncedAt: primary.lastSyncedAt ?? sorted.find((e) => e.lastSyncedAt)?.lastSyncedAt,
    };

    if (alternatePaths.length) {
      (mergedEntry as ManifestEntry & { alternateSourcePaths?: string[] }).alternateSourcePaths =
        alternatePaths;
    }

    for (const e of group) {
      if (e.meetingId !== canonicalId) removedMeetingIds.add(e.meetingId);
    }
    merged += group.length - 1;
    next.set(canonicalId, mergedEntry);
  }

  let mirrorFilesRemoved = 0;
  if (mirrorPath && removedMeetingIds.size) {
    for (const id of removedMeetingIds) {
      const orphan = path.join(mirrorPath, `${id}.md`);
      if (fs.existsSync(orphan)) {
        fs.unlinkSync(orphan);
        mirrorFilesRemoved++;
      }
    }
  }

  return { manifest: next, merged, mirrorFilesRemoved };
}

function normalizeDocEntry(entry: ManifestEntry, docId: string): ManifestEntry {
  const canonicalId = meetingIdFromDocId(docId);
  if (entry.meetingId === canonicalId) return { ...entry, docId };
  return {
    ...entry,
    meetingId: canonicalId,
    docId,
    mirrorPath: entry.mirrorPath?.replace(`${entry.meetingId}.md`, `${canonicalId}.md`),
  };
}

function scoreEntry(e: ManifestEntry): number {
  let score = 0;
  if (e.syncStatus === 'synced') score += 4;
  if (e.mirrorPath) score += 2;
  if (e.contentHash) score += 1;
  if (e.docId && e.sourcePath.endsWith('.gdoc')) score += 2;
  return score;
}

function pickBestStatus(group: ManifestEntry[]): ManifestEntry['syncStatus'] {
  if (group.some((e) => e.syncStatus === 'synced')) return 'synced';
  if (group.some((e) => e.syncStatus === 'skipped')) return 'skipped';
  return group[0]?.syncStatus ?? 'discovered';
}
