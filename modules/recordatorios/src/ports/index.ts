import type { Category } from '../core/models/category';
import type { Reminder, ReminderQuery } from '../core/models/reminder';
import type { PendingReminder } from '../core/models/pending-reminder';

export interface ReminderRepository {
  save(reminder: Reminder): Promise<void>;
  get(id: string): Promise<Reminder | undefined>;
  list(query?: ReminderQuery): Promise<Reminder[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export interface InboxQueue {
  listPending(): Promise<PendingReminder[]>;
  ack(ids: string[]): Promise<void>;
}

export interface CatalogReader {
  listProjectCategories(): Promise<Category[]>;
}

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;
  reminders: Reminder[];
  categories: Category[];
}

export interface BackupStore {
  export(): Promise<BackupData>;
  import(data: BackupData): Promise<void>;
}

export interface CategoryStore {
  listCustom(): Promise<Category[]>;
  saveCustom(category: Category): Promise<void>;
}

export type { ParsedCapture, CaptureInput } from '../core/models/pending-reminder';
