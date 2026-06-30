import type { EntityEffect } from '../shared/cerebro-elements.js';
import type { MeetingTodo } from '../shared/types.js';

const STATUS_LABELS: Record<string, string> = {
  suggested: 'Sugerida',
  open: 'Por hacer',
  done: 'Hecha',
  dismissed: 'Descartada',
};

export interface ToolContext {
  uid: string;
  cerebro?: {
    emitUiCue?: (cue: import('../shared/cerebro-chat.js').UiCue) => void;
    emitBlock?: (block: import('../shared/cerebro-chat.js').CerebroContentBlock) => void;
    emitEntityEffect?: (effect: EntityEffect) => void;
    route?: string;
    conversationId?: string;
  };
}

export function createToolContext(
  uid: string,
  cerebro?: ToolContext['cerebro'],
): ToolContext {
  return { uid, cerebro };
}

export function emitTodoEffect(
  ctx: ToolContext,
  op: EntityEffect['op'],
  todo: MeetingTodo,
  toolName: string,
  extra?: Partial<EntityEffect>,
): void {
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

export function emitTodosEffect(
  ctx: ToolContext,
  op: EntityEffect['op'],
  todos: MeetingTodo[],
  toolName: string,
): void {
  for (const todo of todos) {
    emitTodoEffect(ctx, op, todo, toolName);
  }
}

export function emitTodoEntityCard(ctx: ToolContext, todo: MeetingTodo, toolName: string): void {
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
