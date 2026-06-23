import type { CerebroStore } from '../shared/types.js';
import { coerceStringArray, truncateString } from '../lib/text-coerce.js';

const MAX_BODY_PREVIEW = 400;
const MAX_SUMMARY = 500;
const MAX_ACTION_ITEM = 300;
const MAX_ACTION_ITEMS = 30;
const MAX_PARTICIPANT_NAME = 120;
const MAX_PARTICIPANTS = 50;
const MAX_TODO_TEXT = 500;
const MAX_TODO_NOTES = 800;
const MAX_PERSON_NOTES = 1500;
const MAX_PROSPECT_MEETINGS = 80;

/** Recorta campos pesados antes de persistir (mirrors viven en Storage). */
export function compactStoreForPersist(store: CerebroStore): CerebroStore {
  return {
    ...store,
    graphEdges: undefined,
    meetings: store.meetings.map((m) => ({
      ...m,
      title: truncateString(m.title, 500) ?? m.id,
      bodyPreview: truncateString(m.bodyPreview, MAX_BODY_PREVIEW),
      summary: truncateString(m.summary, MAX_SUMMARY),
      actionItems: m.actionItems?.length
        ? coerceStringArray(m.actionItems as unknown[], MAX_ACTION_ITEM).slice(0, MAX_ACTION_ITEMS)
        : undefined,
      participants: coerceStringArray(m.participants as unknown[], MAX_PARTICIPANT_NAME).slice(
        0,
        MAX_PARTICIPANTS,
      ),
    })),
    people: store.people.map((p) => ({
      ...p,
      notes: truncateString(p.notes, MAX_PERSON_NOTES),
    })),
    prospects: store.prospects.map((p) => ({
      ...p,
      meetingIds: [...new Set(p.meetingIds)].slice(-MAX_PROSPECT_MEETINGS),
    })),
    todos: store.todos.map((t) => ({
      ...t,
      text: truncateString(t.text, MAX_TODO_TEXT) ?? 'Tarea',
      notes: truncateString(t.notes, MAX_TODO_NOTES),
    })),
  };
}

export function estimateFirestoreJsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}
