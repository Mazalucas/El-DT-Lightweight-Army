import type { ReminderSource } from './reminder';

export const INBOX_VERSION = 1;

export interface PendingReminder {
  inboxVersion: typeof INBOX_VERSION;
  id: string;
  title: string;
  categoryId?: string;
  tags?: string[];
  dueAt?: string;
  notes?: string;
  source: 'cursor-chat';
  createdAt: string;
  operatorId?: string;
}

export interface CaptureInput {
  raw: string;
  defaultCategoryId?: string;
  source?: ReminderSource;
  notes?: string;
}

export interface ParsedCapture {
  title: string;
  categoryId: string;
  tags: string[];
  dueAt?: string;
  notes?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  ackIds: string[];
}
