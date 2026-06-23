import type { Category, CategoryKind } from '../models/category';

export class CategoryRegistry {
  private seed: Category[] = [];
  private project: Category[] = [];
  private custom: Category[] = [];

  setSeed(categories: Category[]): void {
    this.seed = categories;
  }

  setProject(categories: Category[]): void {
    this.project = categories;
  }

  setCustom(categories: Category[]): void {
    this.custom = categories;
  }

  merge(): Category[] {
    const map = new Map<string, Category>();

    for (const c of this.seed) {
      map.set(c.id, { ...c });
    }
    for (const c of this.project) {
      if (!map.has(c.id)) {
        map.set(c.id, { ...c });
      }
    }
    for (const c of this.custom) {
      map.set(c.id, { ...c, kind: c.kind ?? 'custom' });
    }

    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getById(id: string): Category | undefined {
    return this.merge().find((c) => c.id === id);
  }

  resolveCategoryId(id: string, fallback = 'personal'): string {
    if (this.getById(id)) return id;
    return this.getById(fallback) ? fallback : 'personal';
  }

  static projectId(moduleId: string): string {
    return `proyecto:${moduleId}`;
  }

  static buildProjectCategory(
    moduleId: string,
    label: string,
    defaults: { color: string; icon: string; sortOrder: number },
  ): Category {
    return {
      id: CategoryRegistry.projectId(moduleId),
      label,
      color: defaults.color,
      icon: defaults.icon,
      kind: 'project' as CategoryKind,
      sortOrder: defaults.sortOrder,
    };
  }
}
