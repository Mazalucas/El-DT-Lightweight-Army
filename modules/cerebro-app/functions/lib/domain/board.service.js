import { buildSuggestionsFromStore } from '../services/suggestions-graph.js';
import { loadStore } from '../services/store.js';
/** Solo sugerencias accionables como tareas — metadata va a Mantenimiento. */
const BOARD_SUGGESTION_KINDS = new Set(['accept_todo', 'review_meeting']);
export function filterBoardSuggestions(suggestions, todos) {
    const suggestedIds = new Set(todos.filter((t) => t.status === 'suggested').map((t) => t.id));
    return suggestions.filter((s) => {
        if (!BOARD_SUGGESTION_KINDS.has(s.kind))
            return false;
        if (s.kind !== 'accept_todo')
            return true;
        const todoId = s.payload.todoId;
        if (typeof todoId !== 'string')
            return true;
        return !suggestedIds.has(todoId);
    });
}
export function buildBoardSnapshotFromStore(store) {
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
export async function getBoardSnapshot(uid) {
    const store = await loadStore(uid);
    return buildBoardSnapshotFromStore(store);
}
export async function getBoardSnapshotOnAdapter(adapter) {
    const store = await adapter.load();
    return buildBoardSnapshotFromStore(store);
}
