/** Fantasma de arrastre compartido (Kanban, listas ordenables). */
export function EntityGhost({ label, className }: { label: string; className?: string }) {
  return (
    <div className={className ?? 'kanban-card kanban-card--ghost'} aria-hidden="true">
      {label}
    </div>
  );
}
