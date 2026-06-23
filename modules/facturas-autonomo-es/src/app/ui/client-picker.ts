import type { Client } from '../models/client';
import { createClient, hydrateClient } from '../models/client';
import type { InvoiceCurrency } from '../models/currency';
import { storage } from '../storage/local-dexie';

export async function loadClients(): Promise<Client[]> {
  const list = await storage.listClients();
  return list.map(hydrateClient);
}

export async function searchClients(query: string): Promise<Client[]> {
  const list = await storage.searchClients(query);
  return list.map(hydrateClient);
}

export async function upsertClientFromForm(fields: {
  id?: string;
  name: string;
  taxId: string;
  address: string;
  kind: Client['kind'];
  currency: InvoiceCurrency;
}): Promise<Client> {
  const client = createClient({
    id: fields.id,
    name: fields.name.trim(),
    taxId: fields.taxId.trim(),
    address: fields.address.trim(),
    kind: fields.kind,
    currency: fields.currency,
  });
  if (fields.id) {
    const existing = (await storage.listClients()).find((c) => c.id === fields.id);
    if (existing) {
      client.createdAt = existing.createdAt;
    }
  }
  await storage.saveClient(client);
  return hydrateClient(client);
}

export async function deleteClientById(id: string): Promise<void> {
  await storage.deleteClient(id);
}
