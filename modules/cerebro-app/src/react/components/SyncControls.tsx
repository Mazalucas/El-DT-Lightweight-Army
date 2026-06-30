import { useEffect, useId, useRef, useState } from 'react';
import type { SyncProgressResponse } from '@shared/types.js';
import {
  buildSyncSteps,
  formatSyncProgressStatus,
  formatSyncResultSummary,
  getSyncProgressPercent,
  pickSyncResultHints,
  PHASE_LABELS,
} from '../../lib/sync-progress.js';
import { Button, formatDate, Icon } from '../ds.js';
import { useSync } from '../sync-context.js';

function SyncProgressBar({ progress }: { progress: SyncProgressResponse }) {
  const pct = getSyncProgressPercent(progress);

  return (
    <div className="sync-progress-wrap" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="sync-progress-bar">
        <div className="sync-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SyncStepList({ progress }: { progress: SyncProgressResponse }) {
  const steps = buildSyncSteps(progress);

  return (
    <ol className="sync-step-list" aria-label="Etapas de sincronización">
      {steps.map((step) => (
        <li
          key={step.id}
          className={`sync-step sync-step--${step.state}`}
          aria-current={step.state === 'active' ? 'step' : undefined}
        >
          <span className="sync-step-marker" aria-hidden="true">
            {step.state === 'done' ? '✓' : step.state === 'active' ? '●' : '○'}
          </span>
          <span className="sync-step-body">
            <span className="sync-step-label">{step.label}</span>
            {step.detail ? <span className="sync-step-detail">{step.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function SyncProgressDetails({ progress, statusLabel }: { progress: SyncProgressResponse; statusLabel: string }) {
  const current = progress.current ?? 0;
  const total = progress.total ?? 0;
  const pct = getSyncProgressPercent(progress);
  const phaseLabel = PHASE_LABELS[progress.phase] ?? progress.phase;

  return (
    <div className="sync-progress-details">
      <div className="sync-progress-summary">
        <span className="sync-progress-phase">{phaseLabel}</span>
        {total > 0 ? (
          <span className="sync-progress-counter">
            {current}/{total} · {pct}%
          </span>
        ) : (
          <span className="sync-progress-counter">{pct > 0 ? `${pct}%` : '…'}</span>
        )}
      </div>
      <SyncProgressBar progress={progress} />
      <p className="sync-progress-status">{statusLabel}</p>
      <SyncStepList progress={progress} />
    </div>
  );
}

function SyncResultSummary({ result }: { result: SyncProgressResponse }) {
  const hints = pickSyncResultHints(result.result?.messages);
  return (
    <div className="sync-result-summary" role="status" aria-live="polite">
      <p className="sync-result-summary-title">{formatSyncResultSummary(result)}</p>
      {hints.length > 1 ? (
        <ul className="sync-result-summary-hints">
          {hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      ) : hints[0] ? (
        <p className="sync-result-summary-hint">{hints[0]}</p>
      ) : null}
    </div>
  );
}

function SyncPanelBody({ defaultExpanded }: { defaultExpanded?: boolean }) {
  const { running, progress, statusLabel, lastSyncAt, lastSyncResult, hasGoogleIntegration, startSync } = useSync();
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);

  useEffect(() => {
    if (running) setExpanded(true);
  }, [running]);

  useEffect(() => {
    if (lastSyncResult && !running) setExpanded(true);
  }, [lastSyncResult, running]);

  const lastLabel = lastSyncAt
    ? formatDate(lastSyncAt)
    : hasGoogleIntegration
      ? 'Listo para sync'
      : 'Sin Google';

  const showDetails = expanded;
  const toggle = () => setExpanded((v) => !v);

  return (
    <>
      <button
        type="button"
        className="app-sync-panel-toggle"
        aria-expanded={showDetails}
        data-cerebro-target="sync.panel_expand"
        onClick={toggle}
      >
        <span className="app-sync-panel-toggle-text">
          {running ? 'Sincronizando…' : 'Sincronización'}
        </span>
        {running ? <span className="app-sync-panel-badge">En curso</span> : null}
        <Icon name="chevron" className={`app-sync-panel-chevron${showDetails ? ' is-open' : ''}`} />
      </button>

      {!showDetails && !running ? (
        <span
          className="app-sync-panel-last"
          title={lastSyncResult ? formatSyncResultSummary(lastSyncResult) : 'Última sincronización'}
        >
          {lastSyncResult?.result?.synced === 0 && lastSyncResult.result.errors === 0
            ? `${lastLabel} · sin novedades`
            : lastLabel}
        </span>
      ) : null}

      {showDetails ? (
        <div className="app-sync-panel-body">
          {!running ? (
            <p className="sync-sheet-meta">
              <span className="app-sync-panel-label">Última sincronización</span>
              <strong className="sync-sheet-last">{lastLabel}</strong>
            </p>
          ) : null}
          {running && progress ? (
            <SyncProgressDetails progress={progress} statusLabel={statusLabel} />
          ) : null}
          {!running && lastSyncResult ? <SyncResultSummary result={lastSyncResult} /> : null}
          {!running ? (
            <Button variant="secondary" size="sm" block data-cerebro-target="sync.run_button" onClick={() => void startSync()}>
              Sincronizar ahora
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function SyncMobileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  const { running, progress, statusLabel, lastSyncAt, lastSyncResult, hasGoogleIntegration, startSync } = useSync();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const lastLabel = lastSyncAt
    ? formatDate(lastSyncAt)
    : hasGoogleIntegration
      ? 'Listo para sync'
      : 'Sin Google';

  return (
    <div className="sync-mobile-sheet" role="dialog" aria-modal="false" aria-labelledby={titleId}>
      <div className="sync-mobile-sheet-backdrop" aria-hidden="true" />
      <div className="sync-mobile-sheet-panel">
        <div className="sync-mobile-sheet-header">
          <h2 className="sync-mobile-sheet-title" id={titleId}>
            Sincronización
          </h2>
          <button type="button" className="modal-close btn btn-ghost btn-sm" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sync-mobile-sheet-body">
          {!running ? (
            <p className="sync-sheet-meta">
              <span className="app-sync-panel-label">Última sincronización</span>
              <strong className="sync-sheet-last">{lastLabel}</strong>
            </p>
          ) : null}
          {running && progress ? (
            <SyncProgressDetails progress={progress} statusLabel={statusLabel} />
          ) : null}
          {!running && lastSyncResult ? <SyncResultSummary result={lastSyncResult} /> : null}
          {!running ? (
            <Button variant="secondary" size="sm" block data-cerebro-target="sync.run_button" onClick={() => void startSync()}>
              Sincronizar ahora
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function mobileTriggerLabel(
  running: boolean,
  progress: SyncProgressResponse | undefined,
  statusLabel: string,
): string {
  if (!running) return 'Sync';
  if (progress && progress.total > 0) return `${progress.current ?? 0}/${progress.total}`;
  return statusLabel.length > 18 ? `${statusLabel.slice(0, 16)}…` : statusLabel;
}

/** Panel global de sincronización — sidebar (desktop) o topbar + sheet (mobile). */
export function GlobalSyncPanel({ compact }: { compact?: boolean }) {
  const { running, progress, statusLabel, hasGoogleIntegration, setupComplete } = useSync();
  const [sheetOpen, setSheetOpen] = useState(false);
  const wasRunning = useRef(false);

  // Abrir el sheet solo al iniciar sync — no bloquear scroll mientras corre en segundo plano.
  useEffect(() => {
    if (running && !wasRunning.current) setSheetOpen(true);
    wasRunning.current = running;
  }, [running]);

  if (!setupComplete && !hasGoogleIntegration) return null;

  if (compact) {
    const label = mobileTriggerLabel(running, progress, statusLabel);
    return (
      <>
        <button
          type="button"
          className={`app-sync-mobile-trigger${running ? ' app-sync-mobile-trigger--running' : ''}`}
          aria-label={running ? `Sincronización en curso: ${statusLabel}` : 'Abrir sincronización'}
          aria-expanded={sheetOpen}
          data-cerebro-target="sync.panel_expand"
          onClick={() => setSheetOpen(true)}
        >
          {running ? <span className="app-sync-mobile-dot" aria-hidden="true" /> : null}
          <span className="app-sync-mobile-trigger-label">{label}</span>
        </button>
        <SyncMobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    );
  }

  return (
    <div className="app-sync-panel" aria-live="polite">
      <SyncPanelBody />
    </div>
  );
}

/** Botón inline opcional — delega al estado global. */
export function SyncButton() {
  const { running, progress, startSync } = useSync();

  if (running) {
    const p = progress;
    const label = p && p.total > 0 ? `${p.current}/${p.total}` : 'Sincronizando…';
    return (
      <Button variant="secondary" size="sm" loading>
        {label}
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" data-cerebro-target="sync.run_button" onClick={() => void startSync()}>
      Sincronizar ahora
    </Button>
  );
}
