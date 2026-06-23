export type SyncStatus = 'discovered' | 'synced' | 'sync_error' | 'skipped' | 'content_pending';
export type AnalysisStatus = 'pending' | 'analyzed' | 'needs_review';

export interface MeetSource {
  path: string;
  teamId?: string;
  exportSubfolder?: string;
}

export interface MeetConfig {
  /** Primera carpeta (compatibilidad) */
  sourcePath: string;
  /** Una o más carpetas Meet Recordings */
  sources: MeetSource[];
  mirrorPath: string;
  manifestPath: string;
  exportSubfolder?: string;
}

export interface ManifestEntry {
  meetingId: string;
  sourcePath: string;
  sourceFile: string;
  docId?: string;
  title: string;
  startedAt?: string;
  timezone?: string;
  /** Equipo inferido desde config.sources (ej. innovacion) */
  teamId?: string;
  mirrorPath?: string;
  mtimeMs: number;
  contentHash?: string;
  syncStatus: SyncStatus;
  analysisStatus: AnalysisStatus;
  lastSyncedAt?: string;
  syncError?: string;
}

export interface MeetingFrontmatter {
  meetingId: string;
  docId?: string;
  sourceFile: string;
  title: string;
  startedAt?: string;
  timezone?: string;
  participants: string[];
  summary?: string;
  teamId?: string;
  ownerEmail?: string;
  invitees?: { name?: string; email: string }[];
  mentionedEmails?: string[];
  sharedWith?: { email: string; name?: string; role?: string; type?: string }[];
  tabTitles?: string[];
  syncedAt: string;
  contentHash: string;
  syncVersion: number;
}

export interface SyncResult {
  scanned: number;
  synced: number;
  skipped: number;
  errors: number;
  messages: string[];
}
