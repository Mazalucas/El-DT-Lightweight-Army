import { pickLatestIso } from '@shared/recency-sort.js';
import { greetingForHour } from '../../../lib/todo-daily.js';
import { formatDate } from '../../ds.js';
import { useAuth } from '../../auth.js';
import { useSync } from '../../sync-context.js';
import { userFirstName } from './hoy-briefing-fallback.js';

export function HoyHero({ lastSyncAt }: { lastSyncAt?: string }) {
  const { user } = useAuth();
  const { running: syncRunning, lastSyncAt: syncLastAt, hasGoogleIntegration } = useSync();
  const name = userFirstName(user?.displayName, user?.email);
  const effectiveSync = pickLatestIso(syncLastAt, lastSyncAt);
  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="dash-hero hoy-hero">
      <div>
        <p className="dash-greeting">
          {greetingForHour()}, {name}
        </p>
        <h2 className="dash-title">Hoy</h2>
        <p className="dash-subtitle">{dateLabel}</p>
      </div>
      <div className="dash-sync-card">
        <span className="dash-sync-label">Última sincronización</span>
        <strong>
          {syncRunning
            ? 'En curso…'
            : effectiveSync
              ? formatDate(effectiveSync)
              : hasGoogleIntegration
                ? 'Listo para sync'
                : 'Sin Google'}
        </strong>
      </div>
    </header>
  );
}
