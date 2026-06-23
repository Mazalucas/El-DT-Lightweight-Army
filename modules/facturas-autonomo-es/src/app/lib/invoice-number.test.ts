import { describe, expect, it } from 'vitest';
import { nextInvoiceNumberFromLast, resolveLastInvoiceNumber } from './invoice-number';

describe('resolveLastInvoiceNumber', () => {
  it('uses the higher of settings and history', () => {
    expect(resolveLastInvoiceNumber(5, 12)).toBe(12);
    expect(resolveLastInvoiceNumber(15, 3)).toBe(15);
  });

  it('never returns negative values', () => {
    expect(resolveLastInvoiceNumber(-1, -2)).toBe(0);
  });
});

describe('nextInvoiceNumberFromLast', () => {
  it('returns last + 1', () => {
    expect(nextInvoiceNumberFromLast(0)).toBe(1);
    expect(nextInvoiceNumberFromLast(15)).toBe(16);
  });
});
