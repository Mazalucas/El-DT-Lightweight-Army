import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { SmartSuggestion } from '@shared/types.js';
import { api } from '../../lib/api.js';
import { formatDate, toast } from '../ds.js';
import { AsyncActionButton } from './AsyncActionButton.js';
import { useOptionalActionQueue } from '../lib/action-queue/ActionQueueProvider.js';

const KIND_LABELS: Record<SmartSuggestion['kind'], string> = {
  follow_up: 'Seguimiento',
  commitment: 'Compromiso',
  no_next_steps: 'Sin próximos pasos',
  reconnect: 'Reconectar',
  prepare: 'Preparar',
  insight: 'Insight',
};

function acceptLabel(s: SmartSuggestion): string {
  if (s.action.kind === 'create_todo') return 'Crear tarea';
  if (s.action.kind === 'open_meeting') return 'Abrir reunión';
  if (s.action.kind === 'open_person') return 'Ver persona';
  return 'Aceptar';
}

function kindBadgeClass(kind: SmartSuggestion['kind']): string {
  if (kind === 'commitment') return 'badge badge-commitment';
  if (kind === 'insight') return 'badge badge-insight';
  return `badge badge-${kind}`;
}

export function SmartSuggestionCard({
  suggestion,
  compact = false,
  variant = 'surface',
}: {
  suggestion: SmartSuggestion;
  compact?: boolean;
  variant?: 'signal' | 'surface';
}) {
  const queue = useOptionalActionQueue();

  const mutate = useMutation({
    mutationFn: async (action: 'accept' | 'dismiss') => {
      if (action === 'accept') return api.acceptSmartSuggestion(suggestion.id);
      return api.dismissSmartSuggestion(suggestion.id);
    },
    onSuccess: (_data, action) => {
      if (action === 'accept' && suggestion.action.kind === 'create_todo') {
        toast('Tarea creada desde la sugerencia');
      } else if (action === 'dismiss') {
        toast('Sugerencia descartada');
      }
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const runAction = (action: 'accept' | 'dismiss') => {
    if (queue) {
      queue.enqueue({
        key: `smart:${suggestion.id}:${action}`,
        entityMutation: true,
        execute: async () => {
          if (action === 'accept') await api.acceptSmartSuggestion(suggestion.id);
          else await api.dismissSmartSuggestion(suggestion.id);
        },
        successMessage:
          action === 'accept' && suggestion.action.kind === 'create_todo'
            ? 'Tarea creada desde la sugerencia'
            : action === 'accept'
              ? 'Sugerencia aceptada'
              : 'Sugerencia descartada',
      });
      return;
    }
    mutate.mutate(action);
  };

  const acceptPending = queue?.isPending(`smart:${suggestion.id}:accept`) ?? mutate.isPending;
  const dismissPending = queue?.isPending(`smart:${suggestion.id}:dismiss`) ?? mutate.isPending;

  const ev = suggestion.evidence;

  return (
    <article
      className={`smart-suggestion smart-suggestion--${variant}${compact ? ' smart-suggestion--compact' : ''}`}
      data-cerebro-entity={`smart_suggestion:${suggestion.id}`}
    >
      <div className="smart-suggestion-title">
        <span className={kindBadgeClass(suggestion.kind)}>{KIND_LABELS[suggestion.kind]}</span>{' '}
        {compact ? suggestion.title.slice(0, 72) + (suggestion.title.length > 72 ? '…' : '') : suggestion.title}
      </div>
      <p className="smart-suggestion-reason">{compact ? suggestion.reason.slice(0, 120) + (suggestion.reason.length > 120 ? '…' : '') : suggestion.reason}</p>
      {!compact && (ev?.quote || ev?.meetingTitle) ? (
        <p className="smart-suggestion-evidence">
          {ev.quote ? <>«{ev.quote}» — </> : null}
          {ev.meetingId ? (
            <Link to={`/reuniones/${ev.meetingId}`}>{ev.meetingTitle ?? 'reunión'}</Link>
          ) : (
            ev.meetingTitle
          )}
          {ev.meetingDate ? <> · {formatDate(ev.meetingDate)}</> : null}
        </p>
      ) : null}
      <div className="smart-suggestion-actions">
        <AsyncActionButton pending={acceptPending} onClick={() => runAction('accept')}>
          {acceptLabel(suggestion)}
        </AsyncActionButton>
        <AsyncActionButton variant="ghost" pending={dismissPending} onClick={() => runAction('dismiss')}>
          Descartar
        </AsyncActionButton>
      </div>
    </article>
  );
}
