/** Aviso de visibilidad org — admins ven datos sincronizados por miembros. */
export function orgPrivacyNotice(variant: 'compact' | 'full' = 'compact'): HTMLElement {
  const el = document.createElement('aside');
  el.className = `org-privacy-notice org-privacy-notice--${variant}`;
  el.setAttribute('role', 'note');
  if (variant === 'full') {
    el.innerHTML = `
      <p><strong>Privacidad en espacio empresa</strong></p>
      <p class="muted">Los administradores pueden ver reuniones, contactos y tareas que los miembros sincronicen al espacio compartido (ingest manual o automático tras sync). Tu espacio <em>personal</em> sigue siendo privado hasta que lo compartas.</p>
      <p class="muted">No subas secretos ni datos sensibles no autorizados por tu empresa.</p>
    `;
  } else {
    el.innerHTML = `<p class="muted"><strong>Nota:</strong> los admins ven lo que sincronicés a esta empresa.</p>`;
  }
  return el;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
