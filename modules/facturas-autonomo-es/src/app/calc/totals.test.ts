import { describe, expect, it } from 'vitest';
import { computeTotals } from './totals';

describe('computeTotals', () => {
  const lines = [{ description: 'Servicios', amount: 4500 }];
  const rates = { ivaRate: 0.21, irpfRate: 0.07 };

  it('calculates national invoice totals', () => {
    const totals = computeTotals(lines, 'national', rates);
    expect(totals.gross).toBe(4500);
    expect(totals.base).toBe(4500);
    expect(totals.iva).toBe(945);
    expect(totals.irpf).toBe(315);
    expect(totals.total).toBe(5130);
  });

  it('calculates international invoice totals', () => {
    const totals = computeTotals(lines, 'international', rates);
    expect(totals.gross).toBe(4500);
    expect(totals.iva).toBe(0);
    expect(totals.irpf).toBe(0);
    expect(totals.total).toBe(4500);
  });
});
