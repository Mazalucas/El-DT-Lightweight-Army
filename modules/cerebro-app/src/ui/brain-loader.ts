import { icon } from './icons.js';

export function brainLoader(label = 'Cargando…'): HTMLElement {
  const el = document.createElement('div');
  el.className = 'brain-loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="brain-loader-mark">${icon('brain')}</div>
    <p class="brain-loader-label">${label}</p>
  `;
  return el;
}

export function contentLoadingOverlay(label?: string): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'content-loading-overlay';
  overlay.appendChild(brainLoader(label));
  return overlay;
}

export function showContentLoading(host: HTMLElement, label?: string): void {
  if (host.querySelector('.content-loading-overlay')) return;
  host.classList.add('is-content-loading');
  host.appendChild(contentLoadingOverlay(label));
}

export function hideContentLoading(host: HTMLElement): void {
  host.classList.remove('is-content-loading');
  host.querySelector('.content-loading-overlay')?.remove();
}
