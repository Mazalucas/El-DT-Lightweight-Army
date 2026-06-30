import { parseTodoGroupBy, type TodoGroupBy } from '@shared/todo-groups.js';

export type KanbanViewMode = 'board' | 'list';

const GROUP_BY_KEY = 'kanban-group-by';
const VIEW_MODE_KEY = 'kanban-view-mode';
const COLLAPSED_KEY = 'kanban-collapsed-groups';

function scopedKey(base: string, scope?: string): string {
  return scope ? `${base}:${scope}` : base;
}

export function loadKanbanGroupBy(scope?: string): TodoGroupBy {
  try {
    const raw = localStorage.getItem(scopedKey(GROUP_BY_KEY, scope));
    return parseTodoGroupBy(raw);
  } catch {
    return 'none';
  }
}

export function saveKanbanGroupBy(value: TodoGroupBy, scope?: string): void {
  try {
    localStorage.setItem(scopedKey(GROUP_BY_KEY, scope), value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadKanbanViewMode(scope?: string): KanbanViewMode {
  try {
    const raw = localStorage.getItem(scopedKey(VIEW_MODE_KEY, scope));
    return raw === 'list' ? 'list' : 'board';
  } catch {
    return 'board';
  }
}

export function saveKanbanViewMode(value: KanbanViewMode, scope?: string): void {
  try {
    localStorage.setItem(scopedKey(VIEW_MODE_KEY, scope), value);
  } catch {
    /* ignore */
  }
}

export function loadCollapsedGroupIds(groupBy: TodoGroupBy, scope?: string): Set<string> {
  if (groupBy === 'none') return new Set();
  try {
    const raw = localStorage.getItem(scopedKey(`${COLLAPSED_KEY}:${groupBy}`, scope));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function saveCollapsedGroupIds(
  groupBy: TodoGroupBy,
  ids: Set<string>,
  scope?: string,
): void {
  if (groupBy === 'none') return;
  try {
    localStorage.setItem(
      scopedKey(`${COLLAPSED_KEY}:${groupBy}`, scope),
      JSON.stringify([...ids]),
    );
  } catch {
    /* ignore */
  }
}

/** URL query wins over localStorage. */
export function resolveKanbanGroupBy(urlParam: string | null, scope?: string): TodoGroupBy {
  if (urlParam !== null && urlParam !== '') {
    return parseTodoGroupBy(urlParam);
  }
  return loadKanbanGroupBy(scope);
}
