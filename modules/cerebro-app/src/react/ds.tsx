/**
 * Design system React sobre los tokens y clases CSS existentes
 * (tokens.css / base.css / components.css). Un solo patrón de
 * botón, badge, sección, tabla, empty/loading y modal para toda la app.
 */
import { useEffect, useId, type ReactNode } from 'react';
import { icon } from '../ui/icons.js';

export { toast, formatDate, initials } from '../lib/ui.js';

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={className ? `ds-icon ${className}` : 'ds-icon'}
      aria-hidden="true"
      // SVG estático del catálogo propio (ui/icons.ts) — contenido confiable
      dangerouslySetInnerHTML={{ __html: icon(name) }}
    />
  );
}

export function Button({
  children,
  variant = 'primary',
  size,
  block,
  loading,
  type = 'button',
  ...rest
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  block?: boolean;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}${block ? ' btn-block' : ''}${loading ? ' btn-loading' : ''}`;
  return (
    <button type={type} className={cls} disabled={rest.disabled || loading} {...rest}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warn' | 'danger' | 'accent';
}) {
  return <span className={tone === 'default' ? 'badge' : `badge badge-${tone}`}>{children}</span>;
}

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div>
          <h1>{title}</h1>
          {desc ? <p className="page-header-desc">{desc}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Section({
  title,
  desc,
  actions,
  children,
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="page-section">
      {title ? (
        <div className="page-section-head">
          <h2>{title}</h2>
          {desc ? <p className="page-section-desc">{desc}</p> : null}
          {actions ? <div className="page-section-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="page-section-body">{children}</div>
    </section>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton skeleton-line" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      {desc ? <p className="empty-state-desc">{desc}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <EmptyState
      title="Algo salió mal"
      desc={message}
      action={
        retry ? (
          <Button variant="secondary" size="sm" onClick={retry}>
            Reintentar
          </Button>
        ) : undefined
      }
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          className={`segmented-option${value === opt.id ? ' active' : ''}`}
          onClick={() => value !== opt.id && onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
      {hint ? <p className="field-hint muted">{hint}</p> : null}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 className="modal-title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="modal-close btn btn-ghost btn-sm" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
