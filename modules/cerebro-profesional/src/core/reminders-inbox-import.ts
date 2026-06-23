import { createManualTodo } from './meeting-todos';
import { db } from './db';

export interface PendingReminderRow {
  inboxVersion: number;
  id: string;
  title: string;
  categoryId?: string;
  tags?: string[];
  dueAt?: string;
  notes?: string;
  source: 'cursor-chat';
  createdAt: string;
  operatorId?: string;
}

export async function importReminderInboxRows(rows: PendingReminderRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    if (row.inboxVersion !== 1 || !row.title?.trim()) continue;
    const stableId = `inbox-${row.id}`;
    if (await db.todos.get(stableId)) continue;

    await createManualTodo({
      id: stableId,
      text: row.title.trim(),
      dueAt: row.dueAt,
      tags: row.tags,
      notes: row.notes,
      categoryId: row.categoryId ?? 'personal',
      source: 'cursor-chat',
      status: 'open',
    });
    count++;
  }
  return count;
}
