import { describe, expect, it } from 'vitest';
import type { MeetingTodo } from '@shared/types.js';
import {
  NONE_GROUP_ID,
  buildTodoGroups,
  parseTodoGroupBy,
  resolveTodoGroupId,
} from '@shared/todo-groups.js';

function todo(
  id: string,
  status: MeetingTodo['status'],
  teamIds: string[] = [],
  projectIds: string[] = [],
): MeetingTodo {
  const now = new Date().toISOString();
  return {
    id,
    text: id,
    meetingId: 'manual',
    status,
    personIds: [],
    teamIds,
    projectIds,
    createdAt: now,
    updatedAt: now,
  };
}

describe('parseTodoGroupBy', () => {
  it('parses team and project', () => {
    expect(parseTodoGroupBy('team')).toBe('team');
    expect(parseTodoGroupBy('project')).toBe('project');
  });

  it('defaults to none', () => {
    expect(parseTodoGroupBy(null)).toBe('none');
    expect(parseTodoGroupBy('invalid')).toBe('none');
  });
});

describe('resolveTodoGroupId', () => {
  it('uses first team or project id', () => {
    expect(resolveTodoGroupId(todo('a', 'open', ['t1', 't2'], ['p1']), 'team')).toBe('t1');
    expect(resolveTodoGroupId(todo('a', 'open', ['t1'], ['p1', 'p2']), 'project')).toBe('p1');
  });

  it('returns none bucket when empty', () => {
    expect(resolveTodoGroupId(todo('a', 'open'), 'team')).toBe(NONE_GROUP_ID);
  });
});

describe('buildTodoGroups', () => {
  const catalog = {
    teams: [
      { id: 't1', name: 'Alpha', color: '#f00', tags: [] },
      { id: 't2', name: 'Beta', color: '#0f0', tags: [] },
    ],
    projects: [
      { id: 'p1', name: 'Proj A', tags: [] },
      { id: 'p2', name: 'Proj B', tags: [] },
    ],
  };

  it('groups by primary id without duplicating multi-assigned todos', () => {
    const todos = [
      todo('a', 'open', ['t1', 't2']),
      todo('b', 'suggested', ['t2']),
      todo('c', 'done', []),
    ];
    const groups = buildTodoGroups(todos, 'team', catalog);
    expect(groups).toHaveLength(3);
    expect(groups.find((g) => g.id === 't1')?.todos.map((t) => t.id)).toEqual(['a']);
    expect(groups.find((g) => g.id === 't2')?.todos.map((t) => t.id)).toEqual(['b']);
    expect(groups.find((g) => g.id === NONE_GROUP_ID)?.todos.map((t) => t.id)).toEqual(['c']);
  });

  it('counts statuses correctly', () => {
    const groups = buildTodoGroups(
      [todo('a', 'suggested', ['t1']), todo('b', 'open', ['t1']), todo('c', 'done', ['t1'])],
      'team',
      catalog,
    );
    const g = groups.find((x) => x.id === 't1');
    expect(g?.counts).toEqual({ suggested: 1, open: 1, done: 1 });
  });

  it('orders active groups first and none last', () => {
    const groups = buildTodoGroups(
      [
        todo('none', 'done', []),
        todo('beta', 'open', ['t2']),
        todo('alpha', 'suggested', ['t1']),
      ],
      'team',
      catalog,
    );
    expect(groups.map((g) => g.id)).toEqual(['t1', 't2', NONE_GROUP_ID]);
  });

  it('ignores dismissed todos', () => {
    const groups = buildTodoGroups([todo('x', 'dismissed', ['t1'])], 'team', catalog);
    expect(groups).toHaveLength(0);
  });

  it('returns empty when filter removes all todos', () => {
    expect(buildTodoGroups([], 'project', catalog)).toEqual([]);
  });
});
