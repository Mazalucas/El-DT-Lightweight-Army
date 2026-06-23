import Fuse, { type IFuseOptions } from 'fuse.js';
import type { CatalogEntry, CatalogSection } from './types';

const fuseOptions: IFuseOptions<CatalogEntry> = {
  keys: [
    { name: 'label', weight: 0.35 },
    { name: 'summary', weight: 0.2 },
    { name: 'id', weight: 0.15 },
    { name: 'aliases', weight: 0.15 },
    { name: 'tags', weight: 0.1 },
    { name: 'description', weight: 0.05 },
    { name: 'searchText', weight: 0.05 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};

export function createSearchIndex(entries: CatalogEntry[]): Fuse<CatalogEntry> {
  return new Fuse(entries, fuseOptions);
}

export function filterEntries(
  fuse: Fuse<CatalogEntry>,
  query: string,
  sectionFilter: CatalogSection | null,
  allEntries: CatalogEntry[],
): CatalogEntry[] {
  const trimmed = query.trim();

  let results: CatalogEntry[];
  if (!trimmed) {
    results = [...allEntries];
  } else {
    results = fuse.search(trimmed).map((r) => r.item);
  }

  if (sectionFilter) {
    results = results.filter((e) => e.section === sectionFilter);
  }

  return results;
}

export function groupBySection(entries: CatalogEntry[]): Record<CatalogSection, CatalogEntry[]> {
  return {
    tool: entries.filter((e) => e.section === 'tool'),
    command: entries.filter((e) => e.section === 'command'),
    system: entries.filter((e) => e.section === 'system'),
  };
}

export function groupCommandsByCategory(entries: CatalogEntry[]): Map<string, CatalogEntry[]> {
  const map = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const key = entry.category || 'Otros';
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return map;
}

const COMMAND_GROUP_ORDER = [
  'Rutina del día a día',
  'Trabajo con el framework',
  'Framework DT',
  'Módulos del segundo cerebro',
  'Otros',
];

export function sortedCommandGroups(map: Map<string, CatalogEntry[]>): Array<[string, CatalogEntry[]]> {
  const entries = [...map.entries()];
  entries.sort(([a], [b]) => {
    const ia = COMMAND_GROUP_ORDER.indexOf(a);
    const ib = COMMAND_GROUP_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'es');
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return entries;
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const re = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
  return escapeHtml(text).replace(re, '<mark>$1</mark>');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
