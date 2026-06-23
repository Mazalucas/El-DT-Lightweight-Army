import type { BoardSnapshot, CerebroStore, MeetingTodo, Suggestion, SuggestionKind } from '../shared/types.js';
import { buildSuggestionsFromStore } from '../services/suggestions-graph.js';
import { loadStore } from '../services/store.js';
import type { StoreAdapter } from '../services/catalog-mutate.js';

/** Solo sugerencias accionables como tareas — metadata va a Mantenimiento. */
const BOARD_SUGGESTION_KINDS = new Set<SuggestionKind>(['accept_todo', 'review_meeting']);

export function filterBoardSuggestions(suggestions: Suggestion[], todos: MeetingTodo[]): Suggestion[] {
  const suggestedIds = new Set(todos.filter((t) => t.status === 'suggested').map((t) => t.id));
  return suggestions.filter((s) => {
    if (!BOARD_SUGGESTION_KINDS.has(s.kind)) return false;
    if (s.kind !== 'accept_todo') return true;
    const todoId = s.payload.todoId;
    if (typeof todoId !== 'string') return true;
    return !suggestedIds.has(todoId);
  });
}

export function buildBoardSnapshotFromStore(store: CerebroStore): BoardSnapshot {
  const boardTodos = store.todos.filter((t) => t.status !== 'dismissed');
  const suggestions = filterBoardSuggestions(buildSuggestionsFromStore(store), store.todos);
  const suggested = boardTodos.filter((t) => t.status === 'suggested').length;
  const open = boardTodos.filter((t) => t.status === 'open').length;
  const done = boardTodos.filter((t) => t.status === 'done').length;

  return {
    todos: boardTodos,
    suggestions,
    projects: store.projects,
    teams: store.teams,
    people: store.people,
    counts: {
      suggested,
      open,
      done,
      suggestions: suggestions.length + suggested,
    },
  };
}

export async function getBoardSnapshot(uid: string): Promise<BoardSnapshot> {
  const store = await loadStore(uid);
  return buildBoardSnapshotFromStore(store);
}

export async function getBoardSnapshotOnAdapter(adapter: StoreAdapter): Promise<BoardSnapshot> {
  const store = await adapter.load();
  return buildBoardSnapshotFromStore(store);
}
