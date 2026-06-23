import { describe, expect, it } from 'vitest';
import { parseCapture, parseRelativeDate } from './capture-parser';

describe('parseCapture', () => {
  it('parses category, tags and strips them from title', () => {
    const r = parseCapture('comprar leche @personal #casa #urgente');
    expect(r.title).toBe('comprar leche');
    expect(r.categoryId).toBe('personal');
    expect(r.tags).toEqual(['casa', 'urgente']);
  });

  it('uses project category', () => {
    const r = parseCapture('revisar PR @proyecto:facturas-autonomo-es');
    expect(r.categoryId).toBe('proyecto:facturas-autonomo-es');
    expect(r.title).toBe('revisar PR');
  });

  it('parses mañana as due date', () => {
    const r = parseCapture('llamar cliente mañana @trabajo');
    expect(r.title).toBe('llamar cliente');
    expect(r.categoryId).toBe('trabajo');
    expect(r.dueAt).toBeDefined();
  });
});

describe('parseRelativeDate', () => {
  it('returns tomorrow at 9am', () => {
    const now = new Date('2026-06-03T15:00:00.000Z');
    const iso = parseRelativeDate('recordar mañana', now);
    expect(iso).toBeDefined();
    const d = new Date(iso!);
    expect(d.getDate()).toBe(4);
  });
});
