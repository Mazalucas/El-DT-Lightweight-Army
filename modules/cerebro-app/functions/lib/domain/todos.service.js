import { todoStableId } from '../core/profesional/extract-action-items.js';
import { MANUAL_TODO_MEETING_ID } from '../core/profesional/meeting-todos-store.js';
import { userStoreAdapter } from '../services/catalog-mutate.js';
import { mutateTodosInStore, todoMutationMeta } from '../services/todo-persist.js';
const VALID_TRANSITIONS = {
    suggested: ['open', 'dismissed'],
    open: ['done', 'dismissed', 'suggested'],
    done: ['open'],
    dismissed: ['suggested', 'open'],
};
function assertTransition(from, to) {
    if (!VALID_TRANSITIONS[from]?.includes(to)) {
        throw new Error(`Transición inválida: ${from} → ${to}`);
    }
}
function findTodo(store, todoId) {
    const todo = store.todos.find((t) => t.id === todoId);
    if (!todo)
        throw new Error(`Tarea no encontrada: ${todoId}`);
    return todo;
}
function applyStatusChange(todo, status, now) {
    assertTransition(todo.status, status);
    todo.status = status;
    todo.updatedAt = now;
    if (status === 'done') {
        todo.completedAt = now;
    }
    else if (status === 'open' || status === 'suggested') {
        todo.completedAt = undefined;
    }
}
function wrapTodo(store, todo) {
    return { todo, meta: todoMutationMeta(store) };
}
function wrapTodos(store, todos) {
    return { todos, meta: todoMutationMeta(store) };
}
export async function createTodoOnAdapter(adapter, input) {
    const text = input.text.trim();
    if (!text)
        throw new Error('El texto de la tarea no puede estar vacío');
    let created;
    let createdId = '';
    const store = await mutateTodosInStore(adapter, (s) => {
        const now = new Date().toISOString();
        const id = todoStableId(MANUAL_TODO_MEETING_ID, text);
        if (s.todos.some((t) => t.id === id && t.status !== 'dismissed')) {
            throw new Error('Ya existe una tarea similar');
        }
        const assigneeIds = input.assigneePersonIds ?? [];
        created = {
            id,
            text,
            meetingId: MANUAL_TODO_MEETING_ID,
            status: 'open',
            source: 'manual',
            personIds: assigneeIds,
            assigneePersonIds: assigneeIds.length ? assigneeIds : undefined,
            teamIds: input.teamIds ?? [],
            projectIds: input.projectIds ?? [],
            dueAt: input.dueAt,
            notes: input.notes,
            priority: input.priority ?? 'normal',
            boardPosition: Date.now(),
            createdAt: now,
            updatedAt: now,
        };
        createdId = id;
        s.todos.push(created);
    }, () => [createdId]);
    return { ...wrapTodo(store, created), todo: created };
}
export async function updateTodoOnAdapter(adapter, todoId, patch) {
    const store = await mutateTodosInStore(adapter, (s) => {
        const todo = findTodo(s, todoId);
        const now = new Date().toISOString();
        if (patch.text !== undefined) {
            const trimmed = patch.text.trim();
            if (!trimmed)
                throw new Error('El texto de la tarea no puede estar vacío');
            todo.text = trimmed;
        }
        if (patch.projectIds !== undefined)
            todo.projectIds = patch.projectIds;
        if (patch.teamIds !== undefined)
            todo.teamIds = patch.teamIds;
        if (patch.assigneePersonIds !== undefined) {
            todo.assigneePersonIds = patch.assigneePersonIds;
            todo.personIds = patch.assigneePersonIds;
        }
        if (patch.dueAt !== undefined)
            todo.dueAt = patch.dueAt ?? undefined;
        if (patch.notes !== undefined)
            todo.notes = patch.notes;
        if (patch.priority !== undefined)
            todo.priority = patch.priority;
        if (patch.boardPosition !== undefined)
            todo.boardPosition = patch.boardPosition;
        todo.updatedAt = now;
    }, () => [todoId]);
    return wrapTodo(store, findTodo(store, todoId));
}
export async function moveTodoOnAdapter(adapter, todoId, input) {
    const store = await mutateTodosInStore(adapter, (s) => {
        const todo = findTodo(s, todoId);
        const now = new Date().toISOString();
        applyStatusChange(todo, input.status, now);
        if (input.boardPosition !== undefined)
            todo.boardPosition = input.boardPosition;
    }, () => [todoId]);
    return wrapTodo(store, findTodo(store, todoId));
}
export async function completeTodosBatchOnAdapter(adapter, todoIds) {
    const updated = [];
    const store = await mutateTodosInStore(adapter, (s) => {
        const set = new Set(todoIds);
        const now = new Date().toISOString();
        for (const t of s.todos) {
            if (set.has(t.id) && t.status === 'open') {
                t.status = 'done';
                t.completedAt = now;
                t.updatedAt = now;
                updated.push({ ...t });
            }
        }
    }, () => todoIds);
    return wrapTodos(store, updated);
}
export async function reopenTodosBatchOnAdapter(adapter, todoIds) {
    const updated = [];
    const store = await mutateTodosInStore(adapter, (s) => {
        const set = new Set(todoIds);
        const now = new Date().toISOString();
        for (const t of s.todos) {
            if (set.has(t.id) && t.status === 'done') {
                t.status = 'open';
                t.completedAt = undefined;
                t.updatedAt = now;
                updated.push({ ...t });
            }
        }
    }, () => todoIds);
    return wrapTodos(store, updated);
}
export async function createTodo(uid, input) {
    return createTodoOnAdapter(userStoreAdapter(uid), input);
}
export async function updateTodo(uid, todoId, patch) {
    return updateTodoOnAdapter(userStoreAdapter(uid), todoId, patch);
}
export async function moveTodo(uid, todoId, input) {
    return moveTodoOnAdapter(userStoreAdapter(uid), todoId, input);
}
export async function completeTodosBatch(uid, todoIds) {
    return completeTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}
export async function reopenTodosBatch(uid, todoIds) {
    return reopenTodosBatchOnAdapter(userStoreAdapter(uid), todoIds);
}
/** @deprecated Use TodoMutationResult — compat for legacy callers expecting store */
export async function moveTodoLegacyStore(uid, todoId, input) {
    const result = await moveTodo(uid, todoId, input);
    const { loadStore } = await import('../services/store.js');
    return { ...result, store: await loadStore(uid) };
}
