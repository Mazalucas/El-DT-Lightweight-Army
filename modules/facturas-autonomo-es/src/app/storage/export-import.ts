import type { BackupData } from './provider';
import { storage } from './local-dexie';

export async function downloadBackupJson(): Promise<void> {
  const data = await storage.exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facturas-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackupFromFile(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupData;
  if (data.version !== 1 && data.version !== 2) {
    throw new Error('Versión de backup no soportada');
  }
  await storage.importBackup(data);
}
