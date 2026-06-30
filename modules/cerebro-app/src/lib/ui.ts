export interface ToastUndoAction {
  label?: string;
  run: () => void | Promise<void>;
}

export type ToastOptions = {
  type?: 'info' | 'error';
  undo?: ToastUndoAction;
};

const TOAST_MS = 6000;
const TOAST_MS_PLAIN = 4000;
const TOAST_STACK_ID = 'toast-stack';

function getToastStack(): HTMLElement {
  let stack = document.getElementById(TOAST_STACK_ID);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = TOAST_STACK_ID;
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

function repositionToastStack(stack: HTMLElement): void {
  const toasts = [...stack.querySelectorAll('.toast')];
  toasts.forEach((el, i) => {
    (el as HTMLElement).style.setProperty('--toast-stack-index', String(i));
  });
}

/** Toast con stack, undo opcional y compatibilidad con firma legacy `toast(msg, 'error')`. */
export function toast(message: string, typeOrOpts: 'info' | 'error' | ToastOptions = 'info'): void {
  const opts: ToastOptions = typeof typeOrOpts === 'string' ? { type: typeOrOpts } : typeOrOpts;
  const type = opts.type ?? 'info';

  const stack = getToastStack();
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  el.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;

  const body = document.createElement('div');
  body.className = 'toast-body';
  el.appendChild(body);

  if (opts.undo) {
    const icon = document.createElement('span');
    icon.className = 'toast-undo-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '↩';
    body.appendChild(icon);
  }

  body.appendChild(text);

  let timer: ReturnType<typeof globalThis.setTimeout> | null = null;

  const remove = () => {
    if (timer) globalThis.clearTimeout(timer);
    el.remove();
    if (stack.childElementCount === 0) stack.remove();
    else repositionToastStack(stack);
  };

  if (opts.undo) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-undo';
    btn.textContent = opts.undo.label ?? 'Deshacer';
    btn.addEventListener('click', () => {
      void Promise.resolve(opts.undo!.run()).finally(remove);
    });
    el.appendChild(btn);
  }

  stack.appendChild(el);
  repositionToastStack(stack);
  timer = globalThis.setTimeout(remove, opts.undo ? TOAST_MS : TOAST_MS_PLAIN);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return `Hoy ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('es-ES', { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
