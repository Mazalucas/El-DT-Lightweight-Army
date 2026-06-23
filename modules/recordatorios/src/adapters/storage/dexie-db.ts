import Dexie, { type EntityTable } from 'dexie';
import type { Category } from '../../core/models/category';
import type { Reminder, ReminderQuery } from '../../core/models/reminder';

export class RecordatoriosDatabase extends Dexie {
  reminders!: EntityTable<Reminder, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  settings!: EntityTable<{ id: string; lastCategoryId?: string }, 'id'>;

  constructor(dbName = 'recordatorios-v1') {
    super(dbName);
    this.version(1).stores({
      reminders: 'id, status, categoryId, dueAt, createdAt, *tags',
      categories: 'id, kind, sortOrder',
      settings: 'id',
    });
  }
}

export const db = new RecordatoriosDatabase();

export function filterInMemory(reminders: Reminder[], query?: ReminderQuery): Reminder[] {
  if (!query?.status) return reminders;
  const statuses = Array.isArray(query.status) ? query.status : [query.status];
  return reminders.filter((r) => statuses.includes(r.status));
}
