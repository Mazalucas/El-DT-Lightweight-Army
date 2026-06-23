import { parseCapture } from '../lib/capture-parser';
import { filterReminders } from '../lib/filters';
import type { CaptureInput, ImportResult, PendingReminder } from '../models/pending-reminder';
import type { Reminder, ReminderPatch, ReminderQuery } from '../models/reminder';
import type { ReminderRepository } from '../../ports/index';
import { CategoryRegistry } from './category-registry';

export class ReminderService {
  constructor(
    private readonly repo: ReminderRepository,
    private readonly registry: CategoryRegistry,
    private readonly defaultCategoryId = 'personal',
  ) {}

  async createFromCapture(input: CaptureInput): Promise<Reminder> {
    const parsed = parseCapture(input.raw, input.defaultCategoryId ?? this.defaultCategoryId);
    if (!parsed.title) {
      throw new Error('El título no puede estar vacío');
    }

    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      title: parsed.title,
      notes: input.notes ?? parsed.notes,
      categoryId: this.registry.resolveCategoryId(parsed.categoryId, this.defaultCategoryId),
      tags: parsed.tags,
      dueAt: parsed.dueAt,
      status: 'open',
      source: input.source ?? 'web',
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.save(reminder);
    return reminder;
  }

  async createFromPending(pending: PendingReminder): Promise<Reminder | null> {
    if (await this.repo.exists(pending.id)) {
      return null;
    }

    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: pending.id,
      title: pending.title,
      notes: pending.notes,
      categoryId: this.registry.resolveCategoryId(
        pending.categoryId ?? this.defaultCategoryId,
        this.defaultCategoryId,
      ),
      tags: pending.tags ?? [],
      dueAt: pending.dueAt,
      status: 'open',
      source: 'cursor-chat',
      createdAt: pending.createdAt,
      updatedAt: now,
    };

    await this.repo.save(reminder);
    return reminder;
  }

  async update(id: string, patch: ReminderPatch): Promise<Reminder> {
    const existing = await this.repo.get(id);
    if (!existing) throw new Error(`Recordatorio no encontrado: ${id}`);

    const now = new Date().toISOString();
    const updated: Reminder = {
      ...existing,
      ...patch,
      dueAt: patch.dueAt === null ? undefined : (patch.dueAt ?? existing.dueAt),
      priority: patch.priority === null ? undefined : (patch.priority ?? existing.priority),
      updatedAt: now,
      completedAt:
        patch.status === 'done'
          ? now
          : patch.status === 'open'
            ? undefined
            : existing.completedAt,
    };

    if (patch.categoryId) {
      updated.categoryId = this.registry.resolveCategoryId(patch.categoryId, this.defaultCategoryId);
    }

    await this.repo.save(updated);
    return updated;
  }

  async complete(id: string): Promise<Reminder> {
    return this.update(id, { status: 'done' });
  }

  async archive(id: string): Promise<Reminder> {
    return this.update(id, { status: 'archived' });
  }

  async list(query: ReminderQuery = {}): Promise<Reminder[]> {
    const all = await this.repo.list({ status: query.status ?? ['open', 'done'] });
    return filterReminders(all, query);
  }

  async get(id: string): Promise<Reminder | undefined> {
    return this.repo.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}

export class InboxProcessor {
  constructor(
    private readonly inbox: import('../../ports/index').InboxQueue,
    private readonly service: ReminderService,
  ) {}

  async importPending(): Promise<ImportResult> {
    const pending = await this.inbox.listPending();
    const ackIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const item of pending) {
      const result = await this.service.createFromPending(item);
      if (result) {
        imported++;
      } else {
        skipped++;
      }
      ackIds.push(item.id);
    }

    if (ackIds.length > 0) {
      await this.inbox.ack(ackIds);
    }

    return { imported, skipped, ackIds };
  }
}
