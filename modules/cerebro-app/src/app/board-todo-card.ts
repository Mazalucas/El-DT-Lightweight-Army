import type { BoardSnapshot, MeetingTodo } from '@shared/types.js';
import { escapeHtml, formatDate } from '../lib/ui.js';
import { button } from '../ui/primitives.js';
import { formatDueHint } from '../lib/todo-daily.js';

export type TodoCardHandlers = {
  onAccept?: (todo: MeetingTodo) => void;
  onDismiss?: (todo: MeetingTodo) => void;
  onComplete?: (todo: MeetingTodo) => void;
  onReopen?: (todo: MeetingTodo) => void;
  onEdit?: (todo: MeetingTodo) => void;
};

function sourceLabel(source?: MeetingTodo['source']): string {
  const map: Record<string, string> = {
    extracted: 'Reunión',
    ai: 'IA',
    manual: 'Manual',
    'cursor-chat': 'Chat',
  };
  return source ? (map[source] ?? source) : 'Reunión';
}

function lookupName(ids: string[], catalog: { id: string; name?: string; displayName?: string }[]): string {
  return ids
    .map((id) => catalog.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => x!.name ?? x!.displayName ?? x!.id)
    .join(', ');
}

export function renderBoardTodoCard(
  todo: MeetingTodo,
  board: BoardSnapshot,
  handlers: TodoCardHandlers,
): HTMLDivElement {
  const card = document.createElement('div');
  card.className = `kanban-card kanban-card--todo kanban-card--${todo.status}`;
  card.draggable = true;
  card.dataset.todoId = todo.id;
  card.dataset.status = todo.status;

  const head = document.createElement('div');
  head.className = 'kanban-card-head';
  const title = document.createElement('p');
  title.className = 'kanban-card-title';
  title.textContent = todo.text;
  head.appendChild(title);
  card.appendChild(head);

  const meta = document.createElement('div');
  meta.className = 'kanban-card-meta';

  const chips: string[] = [];
  if (todo.projectIds.length) {
    chips.push(`<span class="kanban-chip">${escapeHtml(lookupName(todo.projectIds, board.projects))}</span>`);
  }
  if (todo.teamIds.length) {
    chips.push(`<span class="kanban-chip">${escapeHtml(lookupName(todo.teamIds, board.teams))}</span>`);
  }
  const assigneeIds = todo.assigneePersonIds ?? todo.personIds;
  if (assigneeIds.length) {
    chips.push(`<span class="kanban-chip">${escapeHtml(lookupName(assigneeIds, board.people))}</span>`);
  } else if (todo.assigneeLabel) {
    chips.push(`<span class="kanban-chip">${escapeHtml(todo.assigneeLabel)}</span>`);
  }
  if (todo.dueAt) {
    const hint = formatDueHint(todo.dueAt);
    chips.push(`<span class="kanban-chip kanban-chip--due">${escapeHtml(hint)}</span>`);
  }
  chips.push(`<span class="kanban-chip kanban-chip--muted">${escapeHtml(sourceLabel(todo.source))}</span>`);
  if (todo.meetingTitle && todo.meetingId !== 'manual') {
    chips.push(`<span class="kanban-chip kanban-chip--muted">${escapeHtml(todo.meetingTitle)}</span>`);
  }
  if (chips.length) meta.innerHTML = chips.join('');
  card.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'kanban-card-actions';

  if (todo.status === 'suggested') {
    if (handlers.onAccept) {
      actions.appendChild(
        button('Aceptar', {
          variant: 'secondary',
          size: 'sm',
          onClick: () => handlers.onAccept!(todo),
        }),
      );
    }
    if (handlers.onDismiss) {
      actions.appendChild(
        button('Descartar', {
          variant: 'ghost',
          size: 'sm',
          onClick: () => handlers.onDismiss!(todo),
        }),
      );
    }
  }

  if (todo.status === 'open' && handlers.onComplete) {
    actions.appendChild(
      button('Hecha', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => handlers.onComplete!(todo),
      }),
    );
  }

  if (todo.status === 'done' && handlers.onReopen) {
    actions.appendChild(
      button('Reabrir', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => handlers.onReopen!(todo),
      }),
    );
  }

  if (handlers.onEdit && todo.status !== 'done') {
    actions.appendChild(
      button('Editar', {
        variant: 'ghost',
        size: 'sm',
        onClick: () => handlers.onEdit!(todo),
      }),
    );
  }

  if (todo.completedAt && todo.status === 'done') {
    const doneHint = document.createElement('span');
    doneHint.className = 'muted kanban-done-hint';
    doneHint.textContent = `Completada ${formatDate(todo.completedAt)}`;
    actions.appendChild(doneHint);
  }

  if (actions.childElementCount) card.appendChild(actions);
  return card;
}
