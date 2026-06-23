import { describe, expect, it } from 'vitest';
import { invoiceFileBaseName, monthFolderName, yearMonthFromIsoDate } from './month-folders';

describe('month-folders', () => {
  it('builds month folder name', () => {
    expect(monthFolderName(2026, 6)).toBe('2026 06 - JUNIO');
  });

  it('builds invoice file base name', () => {
    expect(invoiceFileBaseName(2026, 6, 1)).toBe('2026 06 - Factura 01');
  });

  it('parses iso date', () => {
    expect(yearMonthFromIsoDate('2026-06-15')).toEqual({ year: 2026, month: 6 });
  });
});
