import fs from 'node:fs';
import type { ManifestEntry } from './types.js';

export function readManifest(manifestPath: string): Map<string, ManifestEntry> {
  const map = new Map<string, ManifestEntry>();
  if (!fs.existsSync(manifestPath)) return map;
  const lines = fs.readFileSync(manifestPath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as ManifestEntry;
      if (entry.meetingId) map.set(entry.meetingId, entry);
    } catch {
      /* skip invalid */
    }
  }
  return map;
}

export function writeManifest(manifestPath: string, entries: Map<string, ManifestEntry>): void {
  const lines = [...entries.values()]
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
    .map((e) => JSON.stringify(e));
  fs.writeFileSync(manifestPath, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
}
