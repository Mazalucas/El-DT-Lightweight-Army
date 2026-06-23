import { describe, expect, it } from 'vitest';
import {
  currencyAfterKindChange,
  defaultCurrencyForKind,
  formatMoney,
  normalizeCurrency,
  resolveClientCurrency,
} from './currency';

describe('currency', () => {
  it('defaults by client kind', () => {
    expect(defaultCurrencyForKind('national')).toBe('EUR');
    expect(defaultCurrencyForKind('international')).toBe('USD');
  });

  it('normalizes legacy invoices without currency', () => {
    expect(normalizeCurrency(undefined)).toBe('EUR');
    expect(normalizeCurrency('XXX')).toBe('EUR');
    expect(normalizeCurrency('GBP')).toBe('GBP');
  });

  it('resolves client currency from kind when missing', () => {
    expect(resolveClientCurrency({ kind: 'international' })).toBe('USD');
    expect(resolveClientCurrency({ kind: 'national', currency: 'GBP' })).toBe('GBP');
  });

  it('formats with currency symbol', () => {
    expect(formatMoney(4500, 'EUR')).toContain('4500');
    expect(formatMoney(4500, 'EUR')).toMatch(/€/);
    expect(formatMoney(4500, 'USD')).toMatch(/\$|USD/);
  });

  it('updates currency on kind change only when still at kind default', () => {
    expect(currencyAfterKindChange('national', 'international', 'EUR')).toBe('USD');
    expect(currencyAfterKindChange('international', 'national', 'USD')).toBe('EUR');
    expect(currencyAfterKindChange('national', 'international', 'GBP')).toBe('GBP');
  });
});
