export type CategoryKind = 'builtin' | 'project' | 'custom';

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
  kind: CategoryKind;
  sortOrder: number;
}

export interface CategorySeedConfig {
  version: number;
  categories: Category[];
}

export interface ProjectCategoryDefaults {
  color: string;
  icon: string;
  sortOrderBase: number;
}
