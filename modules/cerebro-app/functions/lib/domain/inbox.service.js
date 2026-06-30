import { loadStoreFromRepository } from '../services/store-repository.js';
import { getSuggestions } from '../services/suggestions-graph.js';
import { acceptProjectSuggestionOnAdapter, acceptTeamSuggestionOnAdapter, dismissSuggestionOnAdapter, } from '../services/pending-suggestions.js';
import { acceptTodosBatch, dismissTodosBatch, userStoreAdapter } from '../services/catalog-mutate.js';
import { completeTodosBatch, createTodo, moveTodo, updateTodo, } from './todos.service.js';
export async function listSuggestions(uid) {
    return getSuggestions(uid);
}
export async function listTodos(uid, status, limit = 50) {
    const store = await loadStoreFromRepository(uid);
    let todos = store.todos;
    if (status)
        todos = todos.filter((t) => t.status === status);
    return todos.slice(0, limit);
}
export async function dismissSuggestion(uid, suggestionId) {
    return dismissSuggestionOnAdapter(userStoreAdapter(uid), suggestionId);
}
export async function acceptProjectSuggestion(uid, suggestionId, opts) {
    return acceptProjectSuggestionOnAdapter(userStoreAdapter(uid), suggestionId, opts);
}
export async function acceptTeamSuggestion(uid, suggestionId) {
    return acceptTeamSuggestionOnAdapter(userStoreAdapter(uid), suggestionId);
}
export async function acceptTodos(uid, todoIds) {
    return acceptTodosBatch(uid, todoIds);
}
export async function dismissTodos(uid, todoIds) {
    return dismissTodosBatch(uid, todoIds);
}
export async function createTodoForUser(uid, input) {
    return createTodo(uid, input);
}
export async function updateTodoForUser(uid, todoId, patch) {
    return updateTodo(uid, todoId, patch);
}
export async function moveTodoForUser(uid, todoId, input) {
    return moveTodo(uid, todoId, input);
}
export async function completeTodos(uid, todoIds) {
    return completeTodosBatch(uid, todoIds);
}
