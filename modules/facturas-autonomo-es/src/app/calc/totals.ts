import type { ClientKind } from '../models/client';
import type { InvoiceLine, InvoiceTotals } from '../models/invoice';

export interface TaxRates {
  ivaRate: number;
  irpfRate: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumLines(lines: InvoiceLine[]): number {
  return round2(lines.reduce((acc, line) => acc + (line.amount || 0), 0));
}

export function computeTotals(
  lines: InvoiceLine[],
  kind: ClientKind,
  rates: TaxRates,
): InvoiceTotals {
  const gross = sumLines(lines);
  const base = gross;

  if (kind === 'international') {
    return {
      gross,
      base,
      ivaRate: 0,
      iva: 0,
      irpfRate: 0,
      irpf: 0,
      total: base,
    };
  }

  const iva = round2(base * rates.ivaRate);
  const irpf = round2(base * rates.irpfRate);
  const total = round2(base + iva - irpf);

  return {
    gross,
    base,
    ivaRate: rates.ivaRate,
    iva,
    irpfRate: rates.irpfRate,
    irpf,
    total,
  };
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
