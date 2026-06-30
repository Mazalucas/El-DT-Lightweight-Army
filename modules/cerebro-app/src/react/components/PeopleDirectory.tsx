import { useMemo, useState } from 'react';
import type { PeopleView, PersonListItem, ProspectDismissUndoSnapshot, ProspectResolveEnrichment } from '@shared/types.js';
import { Badge, Button, DataTable, EmptyState, formatDate } from '../ds.js';
import { PersonEntityModal, ProspectResolvePanel } from './PersonEntityPanel.js';
import type { MaintenanceItem } from '@shared/types.js';
import { AsyncActionButton } from './AsyncActionButton.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';
import { buildProspectDismissEnqueue } from '../lib/prospect-dismiss-queue.js';

export interface PeopleActions {
  updatePerson: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  promoteProspect: (
    id: string,
    email: string,
    displayName?: string,
    enrichment?: ProspectResolveEnrichment,
  ) => Promise<unknown>;
  linkProspect: (
    prospectId: string,
    personId: string,
    enrichment?: ProspectResolveEnrichment,
  ) => Promise<unknown>;
  dismissProspect: (prospectId: string) => Promise<unknown>;
  restoreProspectDismiss?: (snapshot: ProspectDismissUndoSnapshot) => Promise<unknown>;
  getProspectCandidates: (prospectId: string) => Promise<{
    candidates: Array<{ personId: string; displayName: string; emails: string[]; score: number; sharedMeetings: number }>;
  }>;
  mergePeople?: (canonicalId: string, mergeIds: string[]) => Promise<unknown>;
  createTeam?: (name: string) => Promise<{ id: string; name: string; color?: string }>;
  createProject?: (name: string) => Promise<{ id: string; name: string; tags?: string[] }>;
  assignEmailToTeam?: (teamId: string, email: string) => Promise<unknown>;
  updateTeam?: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function PeopleDirectory({
  view,
  actions,
  maintenanceItems,
  initialQuery,
  initialFilter,
}: {
  view: PeopleView;
  actions: PeopleActions;
  maintenanceItems?: MaintenanceItem[];
  initialQuery?: string;
  initialFilter?: 'all' | 'confirmed' | 'inferred';
}) {
  const [q, setQ] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'inferred'>(initialFilter ?? 'all');
  const [editing, setEditing] = useState<PersonListItem | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvingSnapshot, setResolvingSnapshot] = useState<PersonListItem | null>(null);
  const queue = useActionQueue();

  const dismissProspect = (prospect: PersonListItem) => {
    if (queue.isProspectPending(prospect.id)) return;
    if (!actions.restoreProspectDismiss) return;
    queue.enqueue(
      buildProspectDismissEnqueue({
        prospectId: prospect.id,
        displayName: prospect.displayName,
        dismiss: () => actions.dismissProspect(prospect.id) as Promise<import('../lib/prospect-dismiss-queue.js').ProspectDismissApiResult>,
        restore: actions.restoreProspectDismiss,
      }),
    );
  };

  const teamsById = useMemo(() => new Map(view.teams.map((t) => [t.id, t.name])), [view.teams]);

  const filtered = view.people.filter((p) => {
    if (filter === 'confirmed' && p.kind !== 'person') return false;
    if (filter === 'inferred' && p.kind !== 'prospect') return false;
    if (q) {
      const hay = [p.displayName, ...p.emails].join(' ').toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const inferredCount = view.people.filter((p) => p.kind === 'prospect').length;

  const resolvingLive = useMemo(() => {
    if (!resolvingId) return null;
    return view.people.find((p) => p.kind === 'prospect' && p.id === resolvingId) ?? null;
  }, [resolvingId, view.people]);

  const resolving = resolvingLive ?? resolvingSnapshot;

  const openResolve = (prospect: PersonListItem) => {
    setResolvingId(prospect.id);
    setResolvingSnapshot(prospect);
  };

  const closeResolve = () => {
    setResolvingId(null);
    setResolvingSnapshot(null);
  };

  return (
    <div>
      <div className="toolbar-row">
        <input
          className="field-input"
          type="search"
          placeholder="Buscar por nombre o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar personas"
        />
        <select
          className="field-input field-input--sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          aria-label="Filtrar por confianza"
        >
          <option value="all">Todas ({view.people.length})</option>
          <option value="confirmed">Confirmadas ({view.people.length - inferredCount})</option>
          <option value="inferred">Por confirmar ({inferredCount})</option>
        </select>
      </div>

      {resolvingId && resolving ? (
        <ProspectResolvePanel
          prospect={resolving}
          view={view}
          actions={actions}
          onBack={closeResolve}
        />
      ) : !filtered.length ? (
        <EmptyState
          title="Sin personas"
          desc={q ? 'Probá con otra búsqueda.' : 'Sincronizá reuniones para detectar contactos automáticamente.'}
        />
      ) : (
        <DataTable headers={['Persona', 'Email', 'Equipos', 'Reuniones', 'Última reunión', '']}>
          {filtered.map((p) => {
            const prospectPending = p.kind === 'prospect' && queue.isProspectPending(p.id);
            return (
              <tr
                key={`${p.kind}-${p.id}`}
                className={prospectPending ? 'people-row--pending' : undefined}
              >
                <td>
                  <span className="row-title-link">{p.displayName}</span>{' '}
                  {p.kind === 'prospect' ? (
                    prospectPending ? (
                      <Badge tone="default">Procesando…</Badge>
                    ) : (
                      <Badge tone="warn">Por confirmar</Badge>
                    )
                  ) : null}
                </td>
                <td className="row-meta">{p.emails[0] ?? '—'}</td>
                <td className="row-meta">
                  {p.teamIds.map((id) => teamsById.get(id)).filter(Boolean).join(', ') || '—'}
                </td>
                <td className="row-meta">{p.meetingCount}</td>
                <td className="row-meta">
                  {p.lastMeetingAt ? (
                    <span title={p.lastMeetingTitle}>{formatDate(p.lastMeetingAt)}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {p.kind === 'prospect' ? (
                    <div className="btn-row btn-row--inline">
                      <AsyncActionButton
                        variant="secondary"
                        pending={prospectPending}
                        disabled={prospectPending}
                        onClick={() => openResolve(p)}
                      >
                        Confirmar
                      </AsyncActionButton>
                      <AsyncActionButton
                        variant="ghost"
                        pending={queue.isPending(`prospect:dismiss:${p.id}`) || prospectPending}
                        disabled={prospectPending}
                        onClick={() => dismissProspect(p)}
                      >
                        Descartar
                      </AsyncActionButton>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                      Editar
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {editing ? (
        <PersonEntityModal
          person={editing}
          view={view}
          actions={actions}
          maintenanceItems={maintenanceItems}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
