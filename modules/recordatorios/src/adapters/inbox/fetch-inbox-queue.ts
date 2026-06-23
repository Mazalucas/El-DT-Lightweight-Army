import type { PendingReminder } from '../../core/models/pending-reminder';
import type { InboxQueue } from '../../ports/index';

export class FetchInboxQueue implements InboxQueue {
  async listPending(): Promise<PendingReminder[]> {
    try {
      const res = await fetch('/api/inbox/pending');
      if (!res.ok) return [];
      const data = (await res.json()) as { items: PendingReminder[] };
      return data.items ?? [];
    } catch {
      return [];
    }
  }

  async ack(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await fetch('/api/inbox/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }
}

export class FetchCategoryConfig {
  async loadCategories(): Promise<import('../../core/models/category').Category[]> {
    const res = await fetch('/api/config/categories');
    if (!res.ok) throw new Error('No se pudo cargar categorías');
    const data = (await res.json()) as { categories: import('../../core/models/category').Category[] };
    return data.categories;
  }

  async loadDefaults(): Promise<{ defaultCategoryId: string; inboxPollIntervalMs: number }> {
    const res = await fetch('/api/config/defaults');
    if (!res.ok) {
      return { defaultCategoryId: 'personal', inboxPollIntervalMs: 30000 };
    }
    return res.json();
  }
}
