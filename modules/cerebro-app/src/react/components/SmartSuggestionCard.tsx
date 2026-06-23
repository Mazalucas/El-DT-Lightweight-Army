import type { SmartSuggestion } from '@shared/types.js';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Badge, Button, formatDate, toast } from '../ds.js';
import { useInvalidateViews } from '../hooks.js';

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

export function SmartSuggestionCard({ suggestion }: { suggestion: SmartSuggestion }) {
  const invalidate = useInvalidateViews();

  const mutate = useMutation({
    mutationFn: async (action: 'accept' | 'dismiss') => {
      if (action === 'accept') return api.acceptSmartSuggestion(suggestion.id);
      return api.dismissSmartSuggestion(suggestion.id);
    },
    onSuccess: (_data, action) => {
      invalidate();
      if (action === 'accept' && suggestion.action.kind === 'create_todo') {
        toast('Tarea creada desde la sugerencia');
      }
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const ev = suggestion.evidence;

  return (
    <article className="smart-suggestion">
      <div className="smart-suggestion-title">
        <Badge tone="accent">{KIND_LABELS[suggestion.kind]}</Badge> {suggestion.title}
      </div>
      <p className="smart-suggestion-reason">{suggestion.reason}</p>
      {ev?.quote || ev?.meetingTitle ? (
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
        <Button size="sm" variant="secondary" disabled={mutate.isPending} onClick={() => mutate.mutate('accept')}>
          {acceptLabel(suggestion)}
        </Button>
        <Button size="sm" variant="ghost" disabled={mutate.isPending} onClick={() => mutate.mutate('dismiss')}>
          Descartar
        </Button>
      </div>
    </article>
  );
}
