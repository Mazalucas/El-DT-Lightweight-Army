import type { ToolRun } from '../../../lib/assistant-tool-ui.js';
import { labelForTool } from '../../../lib/assistant-catalog.js';
import { Icon } from '../../ds.js';
import type { ProcessingStep } from './processing-stream.js';

function StepIcon({ step }: { step: ProcessingStep }) {
  if (step.kind === 'plan') return <Icon name="brain" className="cerebro-trace-icon" />;
  if (step.kind === 'tool') return <Icon name="search" className="cerebro-trace-icon" />;
  return <Icon name="brain" className="cerebro-trace-icon cerebro-trace-icon--pulse" />;
}

function StepStatus({ step }: { step: ProcessingStep }) {
  if (step.kind === 'tool') {
    if (step.toolStatus === 'running') {
      return <span className="cerebro-trace-status cerebro-trace-status--running" aria-hidden="true" />;
    }
    if (step.toolStatus === 'error') {
      return <span className="cerebro-trace-status cerebro-trace-status--error">!</span>;
    }
    return <span className="cerebro-trace-status cerebro-trace-status--done">✓</span>;
  }
  if (step.phase === 'active') {
    return <span className="cerebro-trace-dots" aria-hidden="true"><i /><i /><i /></span>;
  }
  return <span className="cerebro-trace-status cerebro-trace-status--done">✓</span>;
}

function TraceStep({ step, index }: { step: ProcessingStep; index: number }) {
  return (
    <li
      className={`cerebro-trace-step cerebro-trace-step--${step.kind} cerebro-trace-step--${step.phase}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="cerebro-trace-rail" aria-hidden="true">
        <span className="cerebro-trace-dot" />
      </span>
      <div className="cerebro-trace-body">
        <div className="cerebro-trace-head">
          <StepIcon step={step} />
          <span className="cerebro-trace-label">{step.label}</span>
          <StepStatus step={step} />
        </div>
        {step.sublabel ? <p className="cerebro-trace-sublabel muted">{step.sublabel}</p> : null}
      </div>
    </li>
  );
}

function ToolRunChip({ run }: { run: ToolRun }) {
  return (
    <details
      className={`assistant-tool-card assistant-tool-card--${run.status} assistant-tool-card--compact cerebro-tool-chip`}
      open={run.status === 'running'}
    >
      <summary className="assistant-tool-card-head">
        <span className="assistant-tool-card-icon">
          <Icon name="brain" />
        </span>
        <span className="assistant-tool-card-title">{labelForTool(run.name)}</span>
        <span className={`assistant-tool-card-status assistant-tool-card-status--${run.status}`}>
          {run.status === 'running' ? '…' : run.status === 'error' ? '!' : '✓'}
        </span>
      </summary>
      {run.status !== 'running' ? (
        <div className="assistant-tool-card-body">
          {run.status === 'error' ? (
            <p className="assistant-tool-error">
              {run.result && typeof run.result === 'object' && 'error' in (run.result as object)
                ? String((run.result as { error: unknown }).error)
                : 'Error en herramienta'}
            </p>
          ) : (
            <p className="muted">Listo</p>
          )}
        </div>
      ) : (
        <div className="assistant-tool-card-body">
          <p className="assistant-tool-loading muted">Ejecutando…</p>
        </div>
      )}
    </details>
  );
}

export function CerebroProcessingTrace({
  steps,
  toolRuns,
  streaming,
  hasContent,
}: {
  steps: ProcessingStep[];
  toolRuns: ToolRun[];
  streaming?: boolean;
  hasContent?: boolean;
}) {
  const showThinking = streaming && !hasContent && steps.every((s) => s.phase === 'done' || s.kind === 'tool');
  const visible = steps.length > 0 || showThinking;

  if (!visible) return null;

  return (
    <div className="cerebro-trace" role="status" aria-live="polite" aria-label="Procesamiento del asistente">
      {steps.length ? (
        <ol className="cerebro-trace-list">
          {steps.map((step, i) => (
            <TraceStep key={step.id} step={step} index={i} />
          ))}
        </ol>
      ) : null}
      {showThinking ? (
        <div className="cerebro-trace-thinking">
          <span className="cerebro-trace-dots cerebro-trace-dots--lg" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="muted">Procesando…</span>
        </div>
      ) : null}
      {toolRuns.length && streaming ? (
        <div className="cerebro-trace-tools">
          {toolRuns.map((run, i) => (
            <ToolRunChip key={`${run.name}-${i}`} run={run} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
