import {
  defaultCurrencyForKind,
  resolveClientCurrency,
  type InvoiceCurrency,
} from './currency';

export type ClientKind = 'national' | 'international';

export interface Client {
  id: string;
  name: string;
  taxId: string;
  address: string;
  kind: ClientKind;
  currency: InvoiceCurrency;
  lastUsedAt: string;
  createdAt: string;
}

export function createClient(
  partial: Pick<Client, 'name' | 'taxId' | 'address' | 'kind'> & {
    id?: string;
    currency?: InvoiceCurrency;
  },
): Client {
  const now = new Date().toISOString();
  const kind = partial.kind;
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    taxId: partial.taxId,
    address: partial.address,
    kind,
    currency: partial.currency ?? defaultCurrencyForKind(kind),
    lastUsedAt: now,
    createdAt: now,
  };
}

export function hydrateClient(raw: Client): Client {
  return {
    ...raw,
    currency: resolveClientCurrency(raw),
  };
}
