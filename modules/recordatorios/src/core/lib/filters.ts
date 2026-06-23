import type { Reminder, ReminderQuery } from '../models/reminder';

function isToday(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function startOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterReminders(reminders: Reminder[], query: ReminderQuery, now = new Date()): Reminder[] {
  let result = [...reminders];

  if (query.status) {
    const statuses = Array.isArray(query.status) ? query.status : [query.status];
    result = result.filter((r) => statuses.includes(r.status));
  }

  if (query.categoryId) {
    result = result.filter((r) => r.categoryId === query.categoryId);
  }

  if (query.tag) {
    const tag = query.tag.toLowerCase();
    result = result.filter((r) => r.tags.some((t) => t.toLowerCase() === tag));
  }

  if (query.dueBefore) {
    const before = new Date(query.dueBefore).getTime();
    result = result.filter((r) => r.dueAt && new Date(r.dueAt).getTime() <= before);
  }

  if (query.dueAfter) {
    const after = new Date(query.dueAfter).getTime();
    result = result.filter((r) => r.dueAt && new Date(r.dueAt).getTime() >= after);
  }

  if (query.view === 'today') {
    result = result.filter((r) => r.dueAt && isToday(r.dueAt, now));
  } else if (query.view === 'overdue') {
    const start = startOfToday(now).getTime();
    result = result.filter(
      (r) => r.status === 'open' && r.dueAt && new Date(r.dueAt).getTime() < start,
    );
  } else if (query.view === 'no-date') {
    result = result.filter((r) => !r.dueAt);
  }

  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  return sortReminders(result);
}

export function sortReminders(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    }
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function collectTags(reminders: Reminder[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of reminders) {
    for (const t of r.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
