import type { BoardCounts, MeetingTodo } from '@shared/types.js';

export function recountBoardCounts(todos: MeetingTodo[]): BoardCounts {
  const visible = todos.filter((t) => t.status !== 'dismissed');
  const suggested = visible.filter((t) => t.status === 'suggested').length;
  const open = visible.filter((t) => t.status === 'open').length;
  const done = visible.filter((t) => t.status === 'done').length;
  return { suggested, open, done, suggestions: suggested };
}
