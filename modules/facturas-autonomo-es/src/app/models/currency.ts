import type { ClientKind } from './client';

/** ISO 4217 — monedas habituales en facturación autónomo / internacional */
export type InvoiceCurrency =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'MXN'
  | 'JPY';

export const DEFAULT_CURRENCY: InvoiceCurrency = 'EUR';

const SUPPORTED = new Set<string>([
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'MXN',
  'JPY',
]);

export const CURRENCY_OPTIONS: ReadonlyArray<{ code: InvoiceCurrency; label: string }> = [
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'Dólar US (USD)' },
  { code: 'GBP', label: 'Libra (GBP)' },
  { code: 'CHF', label: 'Franco suizo (CHF)' },
  { code: 'CAD', label: 'Dólar canadiense (CAD)' },
  { code: 'AUD', label: 'Dólar australiano (AUD)' },
  { code: 'MXN', label: 'Peso mexicano (MXN)' },
  { code: 'JPY', label: 'Yen (JPY)' },
];

const KIND_DEFAULT: Record<ClientKind, InvoiceCurrency> = {
  national: 'EUR',
  international: 'USD',
};

export function defaultCurrencyForKind(kind: ClientKind): InvoiceCurrency {
  return KIND_DEFAULT[kind];
}

export function normalizeCurrency(value: unknown): InvoiceCurrency {
  if (typeof value === 'string' && SUPPORTED.has(value)) {
    return value as InvoiceCurrency;
  }
  return DEFAULT_CURRENCY;
}

/** Moneda guardada en el cliente, o default según tipo si falta (datos antiguos). */
export function resolveClientCurrency(client: {
  kind: ClientKind;
  currency?: InvoiceCurrency;
}): InvoiceCurrency {
  if (typeof client.currency === 'string' && SUPPORTED.has(client.currency)) {
    return client.currency;
  }
  return defaultCurrencyForKind(client.kind);
}

/** Al cambiar tipo de factura, solo cambia moneda si aún era la del tipo anterior. */
export function currencyAfterKindChange(
  previousKind: ClientKind,
  nextKind: ClientKind,
  current: InvoiceCurrency,
): InvoiceCurrency {
  if (current === KIND_DEFAULT[previousKind]) {
    return KIND_DEFAULT[nextKind];
  }
  return current;
}

export function formatMoney(amount: number, currency: InvoiceCurrency): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function currencyAmountLabel(currency: InvoiceCurrency): string {
  return `Importe (${currency})`;
}
