import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { MeetConfig } from './types.js';

const DEFAULT_SOURCE =
  'Library/CloudStorage/GoogleDrive-lmazalan@mazalancomunicaciones.com/My Drive/Meet Recordings';

const SHARED_MEET_RECORDINGS =
  'Library/CloudStorage/GoogleDrive-lmazalan@mazalancomunicaciones.com/My Drive/Meet Recordings/Shared Meet Recordings';
const INNOVACION_SHORTCUT =
  '/Users/lucas/Library/CloudStorage/GoogleDrive-lmazalan@mazalancomunicaciones.com/.shortcut-targets-by-id/1JtCD1duFRCcFW8CzrlzIW4UFBmVZMGkw/Meet Recordings';

export function repoRootFrom(moduleDir: string): string {
  return path.resolve(moduleDir, '../..');
}

export function cerebroLocalDir(repoRoot: string): string {
  return path.join(repoRoot, 'modules/cerebro-profesional/.local');
}

export function defaultConfig(repoRoot: string): MeetConfig {
  const home = process.env.HOME || '';
  const sourcePath = path.join(home, ...DEFAULT_SOURCE.split('/'));
  const sharedPath = path.join(home, ...SHARED_MEET_RECORDINGS.split('/'));
  const sources: MeetConfig['sources'] = [{ path: sourcePath, exportSubfolder: '_export' }];
  if (fs.existsSync(INNOVACION_SHORTCUT)) {
    sources.push({ path: INNOVACION_SHORTCUT, teamId: 'innovacion', exportSubfolder: '_export' });
  }
  if (fs.existsSync(sharedPath)) {
    sources.push({ path: sharedPath, exportSubfolder: '_export' });
  }
  return {
    sourcePath,
    sources,
    mirrorPath: path.join(cerebroLocalDir(repoRoot), 'mirror'),
    manifestPath: path.join(cerebroLocalDir(repoRoot), 'manifest.jsonl'),
    exportSubfolder: '_export',
  };
}

function expandPath(p: string, repoRoot: string): string {
  const home = process.env.HOME || '';
  let s = p.trim().replace(/^~/, home);
  if (!path.isAbsolute(s)) s = path.join(repoRoot, s);
  return path.normalize(s);
}

function parseSources(
  raw: Record<string, unknown>,
  base: MeetConfig,
  repoRoot: string,
): MeetConfig['sources'] {
  const list = raw.sources;
  if (Array.isArray(list) && list.length > 0) {
    return list.map((item) => {
      const row = item as { path?: string; teamId?: string; exportSubfolder?: string };
      if (!row.path) throw new Error('Cada entrada en sources necesita path');
      return {
        path: expandPath(String(row.path), repoRoot),
        teamId: row.teamId ? String(row.teamId).trim() : undefined,
        exportSubfolder: row.exportSubfolder?.trim() || base.exportSubfolder,
      };
    });
  }
  return [{ path: base.sourcePath, exportSubfolder: base.exportSubfolder }];
}

export function loadConfig(repoRoot: string): MeetConfig {
  const configPath = path.join(cerebroLocalDir(repoRoot), 'config.yaml');
  const base = defaultConfig(repoRoot);
  if (!fs.existsSync(configPath)) {
    return { ...base, sources: [{ path: base.sourcePath, exportSubfolder: base.exportSubfolder }] };
  }
  try {
    const raw = parseYaml(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const sourcePath = raw.sourcePath
      ? expandPath(String(raw.sourcePath), repoRoot)
      : base.sourcePath;
    const partial: MeetConfig = {
      sourcePath,
      mirrorPath: raw.mirrorPath ? expandPath(String(raw.mirrorPath), repoRoot) : base.mirrorPath,
      manifestPath: raw.manifestPath
        ? expandPath(String(raw.manifestPath), repoRoot)
        : base.manifestPath,
      exportSubfolder: raw.exportSubfolder ? String(raw.exportSubfolder).trim() : base.exportSubfolder,
      sources: [],
    };
    if (Array.isArray(raw.sources) && raw.sources.length > 0) {
      partial.sources = parseSources(raw, partial, repoRoot);
      partial.sourcePath = partial.sources[0]?.path ?? sourcePath;
    } else {
      partial.sources = [{ path: sourcePath, exportSubfolder: partial.exportSubfolder }];
    }
    return partial;
  } catch {
    return { ...base, sources: [{ path: base.sourcePath, exportSubfolder: base.exportSubfolder }] };
  }
}

export function ensureDirs(config: MeetConfig): void {
  fs.mkdirSync(config.mirrorPath, { recursive: true });
  fs.mkdirSync(path.dirname(config.manifestPath), { recursive: true });
}
