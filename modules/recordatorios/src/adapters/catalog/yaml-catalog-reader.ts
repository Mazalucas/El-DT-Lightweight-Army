import type { Category, ProjectCategoryDefaults } from '../../core/models/category';
import { CategoryRegistry } from '../../core/services/category-registry';

type ModuleEntry = {
  id: string;
  kind?: string;
  label: string;
  status?: string;
};

export function parseProjectCategoriesFromModules(
  modules: ModuleEntry[],
  defaults: ProjectCategoryDefaults,
): Category[] {
  const eligible = modules.filter(
    (m) =>
      (m.kind === 'tool' || m.kind === 'project') &&
      m.status !== 'draft' &&
      m.status !== 'archived' &&
      m.id !== 'recordatorios',
  );

  return eligible.map((m, i) =>
    CategoryRegistry.buildProjectCategory(m.id, m.label, {
      color: defaults.color,
      icon: defaults.icon,
      sortOrder: defaults.sortOrderBase + i,
    }),
  );
}

export function parseSeedCategories(raw: { categories?: Category[] }): Category[] {
  return (raw.categories ?? []).map((c) => ({ ...c, kind: c.kind ?? 'builtin' }));
}
