import type { Client } from '../models/client';
import type { Emitter, EmitterProfile } from '../models/emitter';
import type { Invoice } from '../models/invoice';

export interface AppSettings {
  id: 'settings';
  lastNumberByYear: Record<string, number>;
  emitterConfigured: boolean;
  activeEmitterProfileId?: string;
}

export interface BackupData {
  version: 1 | 2;
  exportedAt: string;
  /** v1: emisor único activo */
  emitter: Emitter | null;
  /** v2: todos los perfiles */
  emitterProfiles?: EmitterProfile[];
  activeEmitterProfileId?: string | null;
  clients: Client[];
  invoices: Invoice[];
  settings: AppSettings;
}

export interface StorageProvider {
  getEmitter(): Promise<Emitter | null>;
  saveEmitter(emitter: Emitter): Promise<void>;

  listEmitterProfiles(): Promise<EmitterProfile[]>;
  getEmitterProfile(id: string): Promise<EmitterProfile | undefined>;
  getActiveEmitterProfile(): Promise<EmitterProfile | null>;
  setActiveEmitterProfileId(id: string): Promise<void>;
  saveEmitterProfile(profile: EmitterProfile): Promise<void>;
  deleteEmitterProfile(id: string): Promise<void>;

  listClients(): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  saveClient(client: Client): Promise<void>;
  deleteClient(id: string): Promise<void>;
  touchClient(id: string): Promise<void>;

  listInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  saveInvoice(invoice: Invoice): Promise<void>;
  deleteInvoice(id: string): Promise<void>;

  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  getMaxIssuedNumberForYear(year: number): Promise<number>;
  getLastInvoiceNumberForYear(year: number): Promise<number>;
  setLastInvoiceNumberForYear(year: number, lastNumber: number): Promise<void>;
  getNextInvoiceNumber(year: number): Promise<number>;
  reserveInvoiceNumber(year: number, number: number): Promise<void>;

  exportBackup(): Promise<BackupData>;
  importBackup(data: BackupData): Promise<void>;
}
