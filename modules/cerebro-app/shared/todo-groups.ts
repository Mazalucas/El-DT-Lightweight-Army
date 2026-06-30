import type { MeetingTodo, Project, Team } from './types.js';
import { sortTodosByRecency } from './recency-sort.js';

export const NONE_GROUP_ID = '__none__';

export type TodoGroupBy = 'none' | 'team' | 'project';

export type TodoGroupCounts = {
  suggested: number;
  open: number;
  done: number;
};

export type TodoGroup = {
  id: string;
  label: string;
  color?: string;
  todos: MeetingTodo[];
  counts: TodoGroupCounts;
};

export function parseTodoGroupBy(raw?: string | null): TodoGroupBy {
  if (raw === 'team' || raw === 'project') return raw;
  return 'none';
}

export function resolveTodoGroupId(
  todo: MeetingTodo,
  groupBy: Exclude<TodoGroupBy, 'none'>,
): string {
  const ids = groupBy === 'team' ? todo.teamIds : todo.projectIds;
  return ids[0] ?? NONE_GROUP_ID;
}

function countByStatus(todos: MeetingTodo[]): TodoGroupCounts {
  let suggested = 0;
  let open = 0;
  let done = 0;
  for (const t of todos) {
    if (t.status === 'suggested') suggested++;
    else if (t.status === 'open') open++;
    else if (t.status === 'done') done++;
  }
  return { suggested, open, done };
}

function compareGroups(a: TodoGroup, b: TodoGroup): number {
  if (a.id === NONE_GROUP_ID && b.id !== NONE_GROUP_ID) return 1;
  if (b.id === NONE_GROUP_ID && a.id !== NONE_GROUP_ID) return -1;

  const aActive = a.counts.suggested + a.counts.open;
  const bActive = b.counts.suggested + b.counts.open;
  if (aActive !== bActive) return bActive - aActive;

  return a.label.localeCompare(b.label, 'es');
}

export function buildTodoGroups(
  todos: MeetingTodo[],
  groupBy: Exclude<TodoGroupBy, 'none'>,
  catalog: { teams: Team[]; projects: Project[] },
): TodoGroup[] {
  const visible = todos.filter((t) => t.status !== 'dismissed');
  const map = new Map<string, MeetingTodo[]>();

  for (const todo of visible) {
    const gid = resolveTodoGroupId(todo, groupBy);
    const list = map.get(gid) ?? [];
    list.push(todo);
    map.set(gid, list);
  }

  const catalogItems = groupBy === 'team' ? catalog.teams : catalog.projects;
  const groups: TodoGroup[] = [];

  for (const [id, groupTodos] of map) {
    const sorted = sortTodosByRecency(groupTodos);
    const counts = countByStatus(sorted);
    let label: string;
    let color: string | undefined;

    if (id === NONE_GROUP_ID) {
      label = groupBy === 'team' ? 'Sin equipo' : 'Sin proyecto';
    } else {
      const item = catalogItems.find((x) => x.id === id);
      label = item?.name ?? id;
      if (groupBy === 'team') {
        color = (item as Team | undefined)?.color;
      }
    }

    groups.push({ id, label, color, todos: sorted, counts });
  }

  return groups.sort(compareGroups);
}

export function groupColumnDroppableId(groupId: string, status: MeetingTodo['status']): string {
  return `${groupId}:${status}`;
}

export function parseGroupColumnDroppableId(
  id: string,
): { groupId: string; status: MeetingTodo['status'] } | null {
  const lastColon = id.lastIndexOf(':');
  if (lastColon <= 0) return null;
  const status = id.slice(lastColon + 1);
  if (status !== 'suggested' && status !== 'open' && status !== 'done') return null;
  return { groupId: id.slice(0, lastColon), status };
}
