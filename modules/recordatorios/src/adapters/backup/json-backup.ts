import type { Category } from '../../core/models/category';
import { CategoryRegistry } from '../../core/services/category-registry';
import type { Reminder } from '../../core/models/reminder';
import { SCHEMA_VERSION } from '../../core/models/reminder';
import type { BackupData, BackupStore, CategoryStore } from '../../ports/index';
import type { DexieCategoryStore } from '../storage/dexie-reminder-repo';
import { db } from '../storage/dexie-db';

export class JsonBackupStore implements BackupStore {
  constructor(
    private readonly categoryStore: DexieCategoryStore,
    private readonly registry: CategoryRegistry,
  ) {}

  async export(): Promise<BackupData> {
    const reminders = await db.reminders.toArray();
    const custom = await this.categoryStore.listCustom();
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      reminders,
      categories: custom,
    };
  }

  async import(data: BackupData): Promise<void> {
    if (data.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(`Versión de backup no soportada: ${data.schemaVersion}`);
    }
    await db.transaction('rw', db.reminders, db.categories, async () => {
      for (const r of data.reminders) {
        await db.reminders.put(r);
      }
      for (const c of data.categories) {
        await db.categories.put({ ...c, kind: 'custom' });
      }
    });
    this.registry.setCustom(data.categories);
  }
}

export function downloadJsonBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recordatorios-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJsonBackupFile(
  file: File,
  store: BackupStore,
): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupData;
  await store.import(data);
}
