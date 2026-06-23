import { button } from './primitives.js';

export interface ModalOptions {
  title: string;
  body: HTMLElement;
  footer?: HTMLElement;
}

export function openModal(opts: ModalOptions): () => void {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'modal-title';
  titleEl.id = `modal-title-${Date.now()}`;
  titleEl.textContent = opts.title;
  dialog.setAttribute('aria-labelledby', titleEl.id);

  const closeBtn = button('×', {
    variant: 'ghost',
    size: 'sm',
    onClick: () => close(),
  });
  closeBtn.className = 'modal-close btn btn-ghost btn-sm';
  closeBtn.setAttribute('aria-label', 'Cerrar');

  header.append(titleEl, closeBtn);

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'modal-body';
  bodyWrap.appendChild(opts.body);

  dialog.append(header, bodyWrap);
  if (opts.footer) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.appendChild(opts.footer);
    dialog.appendChild(footer);
  }

  backdrop.appendChild(dialog);

  function close(): void {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown);
    document.body.classList.remove('modal-open');
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') close();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', onKeyDown);
  document.body.classList.add('modal-open');
  document.body.appendChild(backdrop);

  closeBtn.focus();
  return close;
}
