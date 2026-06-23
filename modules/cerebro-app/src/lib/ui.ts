let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function toast(message: string, type: 'info' | 'error' = 'info'): void {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 3200);
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
    return new Date(iso).toLocaleDateString('es-ES', { dateStyle: 'medium' });
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
