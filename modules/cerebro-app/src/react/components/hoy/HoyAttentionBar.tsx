import { Link } from 'react-router-dom';
import type { DashboardAttention } from '@shared/types.js';

export function HoyAttentionBar({ attention }: { attention: DashboardAttention }) {
  const items: string[] = [];
  if (attention.overdueCount) items.push(`${attention.overdueCount} vencida${attention.overdueCount === 1 ? '' : 's'}`);
  if (attention.maintenanceCount) {
    const preview = attention.maintenancePreview.map((m) => m.title).slice(0, 2).join(', ');
    items.push(
      preview
        ? `${attention.maintenanceCount} mantenimiento (${preview}${attention.maintenanceCount > 2 ? '…' : ''})`
        : `${attention.maintenanceCount} mantenimiento`,
    );
  }
  if (attention.meetingsNeedsReview) {
    items.push(`${attention.meetingsNeedsReview} reunión${attention.meetingsNeedsReview === 1 ? '' : 'es'} por revisar`);
  }
  if (attention.syncStale) items.push('Sync desactualizado');

  if (!items.length) return null;

  return (
    <div className="hoy-attention-bar" role="status">
      <span className="hoy-attention-icon" aria-hidden="true">
        ⚠
      </span>
      <span className="hoy-attention-text">{items.join(' · ')}</span>
      {attention.maintenanceCount ? (
        <Link to="/mantenimiento" className="hoy-attention-link">
          Mantenimiento →
        </Link>
      ) : attention.meetingsNeedsReview ? (
        <Link to="/reuniones" className="hoy-attention-link">
          Reuniones →
        </Link>
      ) : null}
    </div>
  );
}
