import type { Reminder, ReminderQuery } from '../../core/models/reminder';
import type { ReminderRepository } from '../../ports/index';
import { db, filterInMemory } from './dexie-db';

export class DexieReminderRepository implements ReminderRepository {
  async save(reminder: Reminder): Promise<void> {
    await db.reminders.put(reminder);
  }

  async get(id: string): Promise<Reminder | undefined> {
    return db.reminders.get(id);
  }

  async list(query?: ReminderQuery): Promise<Reminder[]> {
    const all = await db.reminders.toArray();
    return filterInMemory(all, query);
  }

  async delete(id: string): Promise<void> {
    await db.reminders.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const n = await db.reminders.where('id').equals(id).count();
    return n > 0;
  }
}

export class DexieCategoryStore {
  async listCustom(): Promise<import('../../core/models/category').Category[]> {
    return db.categories.filter((c) => c.kind === 'custom').toArray();
  }

  async saveCustom(category: import('../../core/models/category').Category): Promise<void> {
    await db.categories.put(category);
  }

  async saveLastCategoryId(id: string): Promise<void> {
    await db.settings.put({ id: 'settings', lastCategoryId: id });
  }

  async getLastCategoryId(): Promise<string | undefined> {
    const s = await db.settings.get('settings');
    return s?.lastCategoryId;
  }
}
