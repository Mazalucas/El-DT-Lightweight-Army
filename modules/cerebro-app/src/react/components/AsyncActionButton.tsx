import type { ReactNode } from 'react';
import { Button } from '../ds.js';

export function AsyncActionButton({
  children,
  pending = false,
  loading,
  disabled,
  onClick,
  variant = 'secondary',
  size = 'sm',
  type = 'button',
}: {
  children: ReactNode;
  pending?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
}) {
  const isLoading = loading ?? pending;
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      loading={isLoading}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function QueueStatusPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="queue-status-pill" role="status" aria-live="polite">
      Procesando {count}…
    </span>
  );
}
