import type { ClientKind } from './client';
import { defaultCurrencyForKind, type InvoiceCurrency } from './currency';

export type { InvoiceCurrency };

export type InvoiceStatus = 'draft' | 'issued';

export interface InvoiceLine {
  description: string;
  amount: number;
}

export interface InvoiceTotals {
  gross: number;
  base: number;
  ivaRate: number;
  iva: number;
  irpfRate: number;
  irpf: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: number;
  year: number;
  date: string;
  kind: ClientKind;
  currency: InvoiceCurrency;
  clientId: string;
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  lines: InvoiceLine[];
  paymentMethod: string;
  dueDate: string;
  iban: string;
  legalNote?: string;
  totals: InvoiceTotals;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export function formatInvoiceNumber(number: number, year: number): string {
  return `${String(number).padStart(3, '0')} / ${year}`;
}

export function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} / ${month} / ${year}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyInvoice(
  kind: ClientKind,
  year: number,
  number: number,
): Invoice {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    number,
    year,
    date: todayIsoDate(),
    kind,
    currency: defaultCurrencyForKind(kind),
    clientId: '',
    clientName: '',
    clientTaxId: '',
    clientAddress: '',
    lines: [{ description: '', amount: 0 }],
    paymentMethod: 'Transferencia',
    dueDate: 'Al contado',
    iban: '',
    legalNote: kind === 'international' ? undefined : undefined,
    totals: {
      gross: 0,
      base: 0,
      ivaRate: kind === 'national' ? 0.21 : 0,
      iva: 0,
      irpfRate: kind === 'national' ? 0.07 : 0,
      irpf: 0,
      total: 0,
    },
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
