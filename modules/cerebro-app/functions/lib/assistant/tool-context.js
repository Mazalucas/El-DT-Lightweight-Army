const STATUS_LABELS = {
    suggested: 'Sugerida',
    open: 'Por hacer',
    done: 'Hecha',
    dismissed: 'Descartada',
};
export function createToolContext(uid, cerebro) {
    return { uid, cerebro };
}
export function emitTodoEffect(ctx, op, todo, toolName, extra) {
    ctx.cerebro?.emitEntityEffect?.({
        ref: { kind: 'todo', id: todo.id },
        op,
        patch: { status: todo.status, text: todo.text, dueAt: todo.dueAt },
        animation: op === 'move' ? 'fly_to_column' : op === 'create' ? 'slide_in' : op === 'delete' ? 'fade_out' : 'pulse',
        source: 'cerebro',
        toolName,
        ...extra,
    });
}
export function emitTodosEffect(ctx, op, todos, toolName) {
    for (const todo of todos) {
        emitTodoEffect(ctx, op, todo, toolName);
    }
}
export function emitTodoEntityCard(ctx, todo, toolName) {
    ctx.cerebro?.emitBlock?.({
        type: 'entity_card',
        ref: { kind: 'todo', id: todo.id },
        title: todo.text,
        subtitle: todo.dueAt ? `Vence ${todo.dueAt.slice(0, 10)}` : undefined,
        statusLabel: STATUS_LABELS[todo.status] ?? todo.status,
    });
    ctx.cerebro?.emitUiCue?.({
        id: `entity:todo:${todo.id}`,
        targetId: 'nav.tareas',
        action: 'pulse',
        entityRef: { kind: 'todo', id: todo.id },
        message: `Tarea actualizada (${toolName})`,
    });
}
