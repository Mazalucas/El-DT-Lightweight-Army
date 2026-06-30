import type { CreateTodoInput, MeetingTodo, Suggestion, UpdateTodoInput } from '../shared/types.js';
import { loadStoreFromRepository } from '../services/store-repository.js';
import { getSuggestions } from '../services/suggestions-graph.js';
import {
  acceptProjectSuggestionOnAdapter,
  acceptTeamSuggestionOnAdapter,
  dismissSuggestionOnAdapter,
} from '../services/pending-suggestions.js';
import { acceptTodosBatch, dismissTodosBatch, userStoreAdapter } from '../services/catalog-mutate.js';
import {
  completeTodosBatch,
  createTodo,
  moveTodo,
  updateTodo,
} from './todos.service.js';

export async function listSuggestions(uid: string): Promise<Suggestion[]> {
  return getSuggestions(uid);
}

export async function listTodos(
  uid: string,
  status?: MeetingTodo['status'],
  limit = 50,
): Promise<MeetingTodo[]> {
  const store = await loadStoreFromRepository(uid);
  let todos = store.todos;
  if (status) todos = todos.filter((t) => t.status === status);
  return todos.slice(0, limit);
}

export async function dismissSuggestion(uid: string, suggestionId: string) {
  return dismissSuggestionOnAdapter(userStoreAdapter(uid), suggestionId);
}

export async function acceptProjectSuggestion(
  uid: string,
  suggestionId: string,
  opts?: { existingProjectId?: string; projectName?: string },
) {
  return acceptProjectSuggestionOnAdapter(userStoreAdapter(uid), suggestionId, opts);
}

export async function acceptTeamSuggestion(uid: string, suggestionId: string) {
  return acceptTeamSuggestionOnAdapter(userStoreAdapter(uid), suggestionId);
}

export async function acceptTodos(uid: string, todoIds: string[]) {
  return acceptTodosBatch(uid, todoIds);
}

export async function dismissTodos(uid: string, todoIds: string[]) {
  return dismissTodosBatch(uid, todoIds);
}

export async function createTodoForUser(uid: string, input: CreateTodoInput) {
  return createTodo(uid, input);
}

export async function updateTodoForUser(uid: string, todoId: string, patch: UpdateTodoInput) {
  return updateTodo(uid, todoId, patch);
}

export async function moveTodoForUser(
  uid: string,
  todoId: string,
  input: { status: MeetingTodo['status']; boardPosition?: number },
) {
  return moveTodo(uid, todoId, input);
}

export async function completeTodos(uid: string, todoIds: string[]) {
  return completeTodosBatch(uid, todoIds);
}
