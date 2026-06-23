export type ReminderStatus = 'open' | 'done' | 'archived';
export type ReminderPriority = 'low' | 'medium' | 'high';
export type ReminderSource = 'web' | 'cursor-chat';

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  categoryId: string;
  tags: string[];
  dueAt?: string;
  priority?: ReminderPriority;
  status: ReminderStatus;
  source: ReminderSource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ReminderPatch {
  title?: string;
  notes?: string;
  categoryId?: string;
  tags?: string[];
  dueAt?: string | null;
  priority?: ReminderPriority | null;
  status?: ReminderStatus;
}

export interface ReminderQuery {
  status?: ReminderStatus | ReminderStatus[];
  categoryId?: string;
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  view?: 'all' | 'today' | 'overdue' | 'no-date';
}

export const SCHEMA_VERSION = 1;
