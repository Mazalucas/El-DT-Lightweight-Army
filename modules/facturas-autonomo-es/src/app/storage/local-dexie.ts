import Dexie, { type EntityTable } from 'dexie';
import { nextInvoiceNumberFromLast, resolveLastInvoiceNumber } from '../lib/invoice-number';
import type { Client } from '../models/client';
import { hydrateClient } from '../models/client';
import {
  createDefaultEmitter,
  createEmitterProfile,
  emitterFromProfile,
  isEmitterComplete,
  profileFromEmitterData,
  type Emitter,
  type EmitterProfile,
} from '../models/emitter';
import type { Invoice } from '../models/invoice';
import type { AppSettings, BackupData, StorageProvider } from './provider';

const LEGACY_EMITTER_ID = 'emitter';
const SETTINGS_ID = 'settings';

class InvoiceDatabase extends Dexie {
  emitter!: EntityTable<EmitterProfile, 'id'>;
  clients!: EntityTable<Client, 'id'>;
  invoices!: EntityTable<Invoice, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('facturas-autonomo-es');
    this.version(1).stores({
      emitter: 'id',
      clients: 'id, name, taxId, kind, lastUsedAt',
      invoices: 'id, year, number, status, clientId, createdAt',
      settings: 'id',
    });
    this.version(2)
      .stores({
        emitter: 'id, label, updatedAt',
        clients: 'id, name, taxId, kind, lastUsedAt',
        invoices: 'id, year, number, status, clientId, createdAt',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        const table = tx.table('emitter');
        const legacy = (await table.get(LEGACY_EMITTER_ID)) as
          | (Emitter & { id: string; label?: string })
          | undefined;
        if (!legacy) return;

        const id = crypto.randomUUID();
        const { id: _legacyId, label: _legacyLabel, ...rest } = legacy as Emitter & {
          id: string;
          label?: string;
        };
        const profile: EmitterProfile = {
          id,
          label: legacy.name?.trim() || 'Principal',
          updatedAt: new Date().toISOString(),
          ...createDefaultEmitter(),
          ...rest,
        };
        await table.delete(LEGACY_EMITTER_ID);
        await table.put(profile);

        const settings = (await tx.table('settings').get(SETTINGS_ID)) as AppSettings | undefined;
        const next: AppSettings = {
          ...(settings ?? defaultSettings()),
          id: SETTINGS_ID,
          activeEmitterProfileId: id,
          emitterConfigured: isEmitterComplete(profile),
        };
        await tx.table('settings').put(next);
      });
  }
}

const db = new InvoiceDatabase();

function defaultSettings(): AppSettings {
  return {
    id: SETTINGS_ID,
    lastNumberByYear: {},
    emitterConfigured: false,
  };
}

export class LocalDexieProvider implements StorageProvider {
  async listEmitterProfiles(): Promise<EmitterProfile[]> {
    const rows = await db.emitter.orderBy('updatedAt').reverse().toArray();
    return rows;
  }

  async getEmitterProfile(id: string): Promise<EmitterProfile | undefined> {
    return db.emitter.get(id);
  }

  async getActiveEmitterProfile(): Promise<EmitterProfile | null> {
    const profiles = await this.listEmitterProfiles();
    if (!profiles.length) return null;
    const settings = await this.getSettings();
    if (settings.activeEmitterProfileId) {
      const found = profiles.find((p) => p.id === settings.activeEmitterProfileId);
      if (found) return found;
    }
    return profiles[0] ?? null;
  }

  async setActiveEmitterProfileId(id: string): Promise<void> {
    const profile = await db.emitter.get(id);
    if (!profile) return;
    const settings = await this.getSettings();
    settings.activeEmitterProfileId = id;
    await this.saveSettings(settings);
  }

  async saveEmitterProfile(profile: EmitterProfile): Promise<void> {
    profile.updatedAt = new Date().toISOString();
    await db.emitter.put(profile);
    const settings = await this.getSettings();
    settings.activeEmitterProfileId = profile.id;
    const profiles = await this.listEmitterProfiles();
    settings.emitterConfigured = profiles.some((p) => isEmitterComplete(p));
    await this.saveSettings(settings);
  }

  async deleteEmitterProfile(id: string): Promise<void> {
    await db.emitter.delete(id);
    const settings = await this.getSettings();
    if (settings.activeEmitterProfileId === id) {
      const remaining = await this.listEmitterProfiles();
      settings.activeEmitterProfileId = remaining[0]?.id;
      await this.saveSettings(settings);
    }
    const profiles = await this.listEmitterProfiles();
    const anyComplete = profiles.some((p) => isEmitterComplete(p));
    settings.emitterConfigured = anyComplete;
    await this.saveSettings(settings);
  }

  async getEmitter(): Promise<Emitter | null> {
    const profile = await this.getActiveEmitterProfile();
    if (!profile) return null;
    await this.syncEmitterConfiguredFlag(profile);
    return emitterFromProfile(profile);
  }

  async saveEmitter(emitter: Emitter): Promise<void> {
    let profile = await this.getActiveEmitterProfile();
    if (!profile) {
      profile = createEmitterProfile(emitter.name.trim() || 'Principal', emitter);
      await this.saveEmitterProfile(profile);
      return;
    }
    const updated = profileFromEmitterData(
      profile.id,
      profile.label,
      emitter,
    );
    await this.saveEmitterProfile(updated);
  }

  async syncEmitterConfiguredFlag(emitter: Emitter): Promise<void> {
    const settings = await this.getSettings();
    const profiles = await this.listEmitterProfiles();
    const anyComplete =
      profiles.some((p) => isEmitterComplete(p)) || isEmitterComplete(emitter);
    if (anyComplete && !settings.emitterConfigured) {
      settings.emitterConfigured = true;
      await this.saveSettings(settings);
    }
  }

  async listClients(): Promise<Client[]> {
    const rows = await db.clients.orderBy('lastUsedAt').reverse().toArray();
    return rows.map(hydrateClient);
  }

  async searchClients(query: string): Promise<Client[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.listClients();
    const all = await this.listClients();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.taxId.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }

  async saveClient(client: Client): Promise<void> {
    await db.clients.put(client);
  }

  async deleteClient(id: string): Promise<void> {
    await db.clients.delete(id);
  }

  async touchClient(id: string): Promise<void> {
    const client = await db.clients.get(id);
    if (client) {
      client.lastUsedAt = new Date().toISOString();
      await db.clients.put(client);
    }
  }

  async listInvoices(): Promise<Invoice[]> {
    return db.invoices.orderBy('createdAt').reverse().toArray();
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return db.invoices.get(id);
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    await db.invoices.put(invoice);
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.invoices.delete(id);
  }

  async getSettings(): Promise<AppSettings> {
    const row = await db.settings.get(SETTINGS_ID);
    return row ?? defaultSettings();
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put(settings);
  }

  async getMaxIssuedNumberForYear(year: number): Promise<number> {
    const issued = await db.invoices
      .filter((inv) => inv.year === year && inv.status === 'issued')
      .toArray();
    if (!issued.length) return 0;
    return Math.max(...issued.map((inv) => inv.number));
  }

  async getLastInvoiceNumberForYear(year: number): Promise<number> {
    const settings = await this.getSettings();
    const fromSettings = settings.lastNumberByYear[String(year)] ?? 0;
    const fromHistory = await this.getMaxIssuedNumberForYear(year);
    return resolveLastInvoiceNumber(fromSettings, fromHistory);
  }

  async setLastInvoiceNumberForYear(year: number, lastNumber: number): Promise<void> {
    const settings = await this.getSettings();
    settings.lastNumberByYear[String(year)] = Math.max(0, Math.floor(lastNumber));
    await this.saveSettings(settings);
  }

  async getNextInvoiceNumber(year: number): Promise<number> {
    const last = await this.getLastInvoiceNumberForYear(year);
    return nextInvoiceNumberFromLast(last);
  }

  async reserveInvoiceNumber(year: number, number: number): Promise<void> {
    const last = await this.getLastInvoiceNumberForYear(year);
    if (number > last) {
      await this.setLastInvoiceNumberForYear(year, number);
    }
  }

  async exportBackup(): Promise<BackupData> {
    const [emitterProfiles, emitter, clients, invoices, settings] = await Promise.all([
      this.listEmitterProfiles(),
      this.getEmitter(),
      this.listClients(),
      this.listInvoices(),
      this.getSettings(),
    ]);
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      emitter,
      emitterProfiles,
      activeEmitterProfileId: settings.activeEmitterProfileId ?? null,
      clients,
      invoices,
      settings,
    };
  }

  async importBackup(data: BackupData): Promise<void> {
    await db.transaction('rw', db.emitter, db.clients, db.invoices, db.settings, async () => {
      await db.clients.clear();
      await db.invoices.clear();
      await db.emitter.clear();

      const settings = { ...(data.settings ?? defaultSettings()), id: SETTINGS_ID };

      if (data.version === 2 && data.emitterProfiles?.length) {
        await db.emitter.bulkPut(data.emitterProfiles);
        if (data.activeEmitterProfileId) {
          settings.activeEmitterProfileId = data.activeEmitterProfileId;
        } else {
          settings.activeEmitterProfileId = data.emitterProfiles[0]?.id;
        }
      } else if (data.emitter) {
        const id = crypto.randomUUID();
        const profile = profileFromEmitterData(
          id,
          data.emitter.name?.trim() || 'Principal',
          data.emitter,
        );
        await db.emitter.put(profile);
        settings.activeEmitterProfileId = id;
      }

      if (data.clients.length) await db.clients.bulkPut(data.clients);
      if (data.invoices.length) await db.invoices.bulkPut(data.invoices);

      const profiles = await db.emitter.toArray();
      settings.emitterConfigured = profiles.some((p) => isEmitterComplete(p));
      await db.settings.put({ ...settings, id: SETTINGS_ID });
    });
  }
}

export const storage = new LocalDexieProvider();

export async function ensureSettings(): Promise<AppSettings> {
  const settings = await storage.getSettings();
  if (!(await db.settings.get(SETTINGS_ID))) {
    await storage.saveSettings(settings);
  }
  return settings;
}

export { createDefaultEmitter };
