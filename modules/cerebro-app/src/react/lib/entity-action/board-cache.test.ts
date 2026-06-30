import { describe, expect, it } from 'vitest';
import type { MeetingTodo } from '@shared/types.js';
import { recountBoardCounts } from './board-counts.js';

function todo(id: string, status: MeetingTodo['status']): MeetingTodo {
  const now = new Date().toISOString();
  return {
    id,
    text: id,
    meetingId: 'manual',
    status,
    personIds: [],
    teamIds: [],
    projectIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('recountBoardCounts', () => {
  it('ignores dismissed todos in visible counts', () => {
    const counts = recountBoardCounts([
      todo('a', 'open'),
      todo('b', 'done'),
      todo('c', 'suggested'),
      todo('d', 'dismissed'),
    ]);
    expect(counts).toEqual({ suggested: 1, open: 1, done: 1, suggestions: 1 });
  });

  it('returns zeros for empty board', () => {
    expect(recountBoardCounts([])).toEqual({ suggested: 0, open: 0, done: 0, suggestions: 0 });
  });
});
