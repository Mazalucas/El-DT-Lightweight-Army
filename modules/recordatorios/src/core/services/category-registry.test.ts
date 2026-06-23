import { describe, expect, it } from 'vitest';
import { CategoryRegistry } from '../services/category-registry';
import type { Category } from '../models/category';

const seed: Category[] = [
  { id: 'personal', label: 'Personal', color: '#0f0', icon: '🏠', kind: 'builtin', sortOrder: 10 },
  { id: 'trabajo', label: 'Trabajo', color: '#00f', icon: '💼', kind: 'builtin', sortOrder: 20 },
];

describe('CategoryRegistry', () => {
  it('merges seed, project and custom without duplicate ids', () => {
    const reg = new CategoryRegistry();
    reg.setSeed(seed);
    reg.setProject([
      CategoryRegistry.buildProjectCategory('facturas-autonomo-es', 'Facturas', {
        color: '#f90',
        icon: '📁',
        sortOrder: 100,
      }),
    ]);
    reg.setCustom([
      {
        id: 'personal',
        label: 'Personal custom',
        color: '#111',
        icon: '⭐',
        kind: 'custom',
        sortOrder: 5,
      },
    ]);

    const merged = reg.merge();
    expect(merged.find((c) => c.id === 'personal')?.label).toBe('Personal custom');
    expect(merged.find((c) => c.id === 'proyecto:facturas-autonomo-es')).toBeDefined();
    expect(merged.length).toBe(3);
  });
});
