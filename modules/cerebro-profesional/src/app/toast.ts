export interface ToastUndoAction {
  label?: string;
  run: () => void | Promise<void>;
}

const TOAST_MS = 6000;
const TOAST_MS_PLAIN = 4000;

export function toast(message: string, undo?: ToastUndoAction): void {
  document.querySelectorAll('.toast').forEach((el) => el.remove());

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  el.appendChild(text);

  if (undo) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-undo';
    btn.textContent = undo.label ?? 'Deshacer';
    btn.addEventListener('click', () => {
      window.clearTimeout(timer);
      void Promise.resolve(undo.run()).finally(() => el.remove());
    });
    el.appendChild(btn);
  }

  document.body.appendChild(el);

  const timer = window.setTimeout(() => el.remove(), undo ? TOAST_MS : TOAST_MS_PLAIN);
}
