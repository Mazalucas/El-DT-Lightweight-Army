import { buildBoardSnapshotFromStore } from '../domain/board.service.js';
import { isNormalizedStore, persistTodoCreate, persistTodosBatch, touchStoreMetaTodos, } from './store-repository.js';
export function todoMutationMeta(store) {
    return { counts: buildBoardSnapshotFromStore(store).counts };
}
export async function mutateTodosInStore(adapter, fn, affectedIds) {
    const store = await adapter.load();
    await fn(store);
    store.savedAt = new Date().toISOString();
    const uid = adapter.uid;
    const ids = [...new Set(affectedIds(store))];
    if (uid && (await isNormalizedStore(uid))) {
        const todos = ids
            .map((id) => store.todos.find((t) => t.id === id))
            .filter((t) => Boolean(t));
        if (todos.length === 1 && ids.length === 1) {
            await persistTodoCreate(uid, todos[0]);
        }
        else if (todos.length) {
            await persistTodosBatch(uid, todos);
        }
        await touchStoreMetaTodos(uid, store);
    }
    else {
        await adapter.save(store);
    }
    return store;
}
export function scopedUserAdapter(uid) {
    return {
        uid,
        load: async () => {
            const { loadStore } = await import('./store.js');
            return loadStore(uid);
        },
        save: async (store) => {
            const { saveStore } = await import('./store.js');
            await saveStore(uid, store);
        },
    };
}
