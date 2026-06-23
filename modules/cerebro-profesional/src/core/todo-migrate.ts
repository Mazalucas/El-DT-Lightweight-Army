import { db } from './db';

const MIGRATION_KEY = 'cerebro-todos-suggested-migration-v1';

export async function migrateExtractedOpenToSuggested(): Promise<number> {
  if (localStorage.getItem(MIGRATION_KEY)) return 0;

  const todos = await db.todos.toArray();
  let n = 0;
  const now = new Date().toISOString();

  for (const t of todos) {
    if (
      t.status === 'open' &&
      t.source !== 'manual' &&
      t.source !== 'cursor-chat' &&
      !t.id.startsWith('manual-') &&
      !t.id.startsWith('inbox-')
    ) {
      await db.todos.put({ ...t, status: 'suggested', updatedAt: now });
      n++;
    }
  }

  localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
  return n;
}
