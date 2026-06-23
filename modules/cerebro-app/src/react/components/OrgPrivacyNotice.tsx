/** Aviso de visibilidad org — admins ven datos sincronizados por miembros. */
export function OrgPrivacyNotice({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  if (variant === 'full') {
    return (
      <aside className="org-privacy-notice org-privacy-notice--full" role="note">
        <p>
          <strong>Privacidad en espacio empresa</strong>
        </p>
        <p className="muted">
          Los administradores pueden ver reuniones, contactos y tareas que los miembros sincronicen al espacio
          compartido (ingest manual o automático tras sync). Tu espacio <em>personal</em> sigue siendo privado
          hasta que lo compartas.
        </p>
        <p className="muted">No subas secretos ni datos sensibles no autorizados por tu empresa.</p>
      </aside>
    );
  }
  return (
    <aside className="org-privacy-notice org-privacy-notice--compact" role="note">
      <p className="muted">
        <strong>Nota:</strong> los admins ven lo que sincronicés a esta empresa.
      </p>
    </aside>
  );
}
