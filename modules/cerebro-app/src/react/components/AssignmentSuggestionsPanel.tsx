import { useMemo, useState } from 'react';
import type { MaintenanceItem, SuggestionAcceptUndoSnapshot } from '@shared/types.js';
import { api } from '../../lib/api.js';
import { Badge } from '../ds.js';
import { useBoardView } from '../hooks.js';
import { AsyncActionButton, QueueStatusPill } from './AsyncActionButton.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';

type AssignmentGroup = {
  key: string;
  kind: 'assign_project' | 'assign_team';
  label: string;
  projectName?: string;
  teamId?: string;
  items: MaintenanceItem[];
  highCount: number;
};

type BatchAcceptResult = {
  accepted: number;
  skipped: number;
  undoSnapshots: SuggestionAcceptUndoSnapshot[];
};

function projectNameFromItem(item: MaintenanceItem): string {
  return String(item.payload.projectName ?? item.title.replace(/^Proyecto:\s*/i, '')).trim();
}

function teamLabelFromItem(item: MaintenanceItem): string {
  return String(item.payload.teamName ?? item.title.replace(/^Equipo:\s*/i, '')).trim();
}

function groupAssignmentItems(items: MaintenanceItem[]): AssignmentGroup[] {
  const map = new Map<string, AssignmentGroup>();

  for (const item of items) {
    if (item.kind === 'assign_project') {
      const projectName = projectNameFromItem(item);
      const key = `project:${projectName.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
        if (item.confidence === 'high') existing.highCount++;
      } else {
        map.set(key, {
          key,
          kind: 'assign_project',
          label: projectName,
          projectName,
          items: [item],
          highCount: item.confidence === 'high' ? 1 : 0,
        });
      }
    } else if (item.kind === 'assign_team') {
      const teamId = String(item.payload.teamId ?? teamLabelFromItem(item));
      const label = teamLabelFromItem(item);
      const key = `team:${teamId}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
        if (item.confidence === 'high') existing.highCount++;
      } else {
        map.set(key, {
          key,
          kind: 'assign_team',
          label,
          teamId: String(item.payload.teamId ?? ''),
          items: [item],
          highCount: item.confidence === 'high' ? 1 : 0,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.items.length - a.items.length);
}

function confidenceTone(confidence?: MaintenanceItem['confidence']) {
  if (confidence === 'high') return 'success' as const;
  if (confidence === 'low') return 'warn' as const;
  return 'default' as const;
}

function GroupCard({ group }: { group: AssignmentGroup }) {
  const queue = useActionQueue();
  const board = useBoardView();
  const [expanded, setExpanded] = useState(false);
  const ids = useMemo(() => group.items.map((i) => i.id), [group.items]);
  const cardPending = queue.isPending(`accept:${group.key}`) || queue.isPending(`dismiss:${group.key}`) || queue.isPending(`link:${group.key}`);

  const enqueueAccept = () => {
    queue.enqueue<BatchAcceptResult>({
      key: `accept:${group.key}`,
      itemIds: ids,
      execute: () =>
        group.kind === 'assign_project'
          ? api.batchAcceptProjectSuggestions(ids, { projectName: group.projectName })
          : api.batchAcceptTeamSuggestions(ids),
      undo: async (result) => {
        await api.revertSuggestionAccept(result.undoSnapshots);
      },
      successMessage: (data) =>
        `${data.accepted} reuniones asignadas${data.skipped ? ` (${data.skipped} omitidas)` : ''}`,
    });
  };

  const enqueueDismiss = () => {
    queue.enqueue<{ dismissed: number }>({
      key: `dismiss:${group.key}`,
      itemIds: ids,
      execute: () => api.batchDismissSuggestions(ids),
      undo: async () => {
        await api.restorePendingSuggestions(ids);
      },
      successMessage: (data) => `${data.dismissed} sugerencias descartadas`,
    });
  };

  const enqueueLinkExisting = (existingProjectId: string) => {
    queue.enqueue<BatchAcceptResult>({
      key: `link:${group.key}:${existingProjectId}`,
      itemIds: ids,
      execute: () =>
        api.batchAcceptProjectSuggestions(ids, { existingProjectId, projectName: group.projectName }),
      undo: async (result) => {
        await api.revertSuggestionAccept(result.undoSnapshots);
      },
      successMessage: (data) => `${data.accepted} reuniones vinculadas al proyecto existente`,
    });
  };

  const dominantConfidence =
    group.highCount === group.items.length
      ? 'high'
      : group.highCount > 0
        ? 'medium'
        : group.items.some((i) => i.confidence === 'low')
          ? 'low'
          : 'medium';

  const sampleMeetings = group.items.slice(0, expanded ? 20 : 3);

  return (
    <article className={`smart-suggestion assignment-group${cardPending ? ' maintenance-item--pending' : ''}`}>
      <div className="smart-suggestion-title">
        {group.kind === 'assign_project' ? 'Proyecto' : 'Equipo'}: {group.label}{' '}
        <Badge tone={confidenceTone(dominantConfidence)}>{group.items.length} reuniones</Badge>
      </div>
      <p className="smart-suggestion-reason">
        {group.kind === 'assign_project'
          ? 'Coincidencia de nombre en títulos de reuniones'
          : 'Reunión detectada para este equipo'}
        {group.highCount > 0 ? ` · ${group.highCount} con confianza alta` : ''}
      </p>
      <div className="smart-suggestion-actions">
        <AsyncActionButton
          pending={queue.isPending(`accept:${group.key}`)}
          onClick={enqueueAccept}
        >
          Confirmar las {group.items.length}
        </AsyncActionButton>
        <AsyncActionButton
          variant="ghost"
          pending={queue.isPending(`dismiss:${group.key}`)}
          onClick={enqueueDismiss}
        >
          Descartar las {group.items.length}
        </AsyncActionButton>
        {group.items.length > 3 ? (
          <AsyncActionButton variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Ocultar reuniones' : `Ver reuniones (${group.items.length})`}
          </AsyncActionButton>
        ) : null}
      </div>
      {group.kind === 'assign_project' && board.data?.projects.length ? (
        <div className="smart-suggestion-actions" style={{ marginTop: 'var(--space-2)' }}>
          <select
            className="field-input field-input--sm"
            defaultValue=""
            disabled={queue.isPending(`link:${group.key}`)}
            onChange={(e) => {
              const id = e.target.value;
              if (id) enqueueLinkExisting(id);
              e.target.value = '';
            }}
            aria-label="Vincular a proyecto existente"
          >
            <option value="">Vincular a proyecto existente…</option>
            {board.data.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      {expanded || group.items.length <= 3 ? (
        <ul className="list-stack assignment-group-meetings" style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
          {sampleMeetings.map((item) => (
            <li key={item.id} className="muted">
              {item.detail ?? item.title}{' '}
              {item.confidence ? (
                <Badge tone={confidenceTone(item.confidence)}>
                  {item.confidence === 'high' ? 'alta' : item.confidence === 'low' ? 'baja' : 'media'}
                </Badge>
              ) : null}
            </li>
          ))}
          {expanded && group.items.length > 20 ? (
            <li className="muted">… y {group.items.length - 20} reuniones más</li>
          ) : null}
        </ul>
      ) : null}
    </article>
  );
}

export function AssignmentSuggestionsPanel({ items }: { items: MaintenanceItem[] }) {
  const queue = useActionQueue();
  const groups = useMemo(() => groupAssignmentItems(items), [items]);
  const allIds = useMemo(() => items.map((i) => i.id), [items]);
  const highIds = useMemo(() => items.filter((i) => i.confidence === 'high').map((i) => i.id), [items]);

  const enqueueDismissAll = () => {
    if (!confirm(`¿Descartar las ${items.length} asignaciones sugeridas?`)) return;
    queue.enqueue<{ dismissed: number }>({
      key: 'dismiss:all',
      itemIds: allIds,
      execute: () => api.batchDismissSuggestions(allIds),
      undo: async () => {
        await api.restorePendingSuggestions(allIds);
      },
      successMessage: (data) => `${data.dismissed} sugerencias descartadas`,
    });
  };

  const enqueueAcceptHigh = () => {
    queue.enqueue<{ accepted: number; undoSnapshots: SuggestionAcceptUndoSnapshot[] }>({
      key: 'accept:high',
      itemIds: highIds,
      execute: async () => {
        const projectIds = items.filter((i) => i.kind === 'assign_project' && i.confidence === 'high').map((i) => i.id);
        const teamIds = items.filter((i) => i.kind === 'assign_team' && i.confidence === 'high').map((i) => i.id);
        let accepted = 0;
        const undoSnapshots: SuggestionAcceptUndoSnapshot[] = [];
        if (projectIds.length) {
          const byProject = new Map<string, string[]>();
          for (const item of items.filter((i) => i.kind === 'assign_project' && i.confidence === 'high')) {
            const name = projectNameFromItem(item);
            const list = byProject.get(name) ?? [];
            list.push(item.id);
            byProject.set(name, list);
          }
          for (const [projectName, ids] of byProject) {
            const r = await api.batchAcceptProjectSuggestions(ids, { projectName });
            accepted += r.accepted;
            undoSnapshots.push(...r.undoSnapshots);
          }
        }
        if (teamIds.length) {
          const r = await api.batchAcceptTeamSuggestions(teamIds);
          accepted += r.accepted;
          undoSnapshots.push(...r.undoSnapshots);
        }
        return { accepted, undoSnapshots };
      },
      undo: async (result) => {
        if (result.undoSnapshots.length) {
          await api.revertSuggestionAccept(result.undoSnapshots);
        }
      },
      successMessage: (result) =>
        result.accepted
          ? `${result.accepted} reuniones confirmadas (confianza alta)`
          : 'Nada que confirmar con confianza alta',
    });
  };

  if (!items.length) return null;

  return (
    <div>
      <div className="toolbar-row" style={{ marginBottom: 'var(--space-3)' }}>
        <span className="muted">
          {items.length} sugerencias en {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
        </span>
        <QueueStatusPill count={queue.pendingCount} />
        {highIds.length ? (
          <AsyncActionButton pending={queue.isPending('accept:high')} onClick={enqueueAcceptHigh}>
            Confirmar alta confianza ({highIds.length})
          </AsyncActionButton>
        ) : null}
        <AsyncActionButton
          variant="ghost"
          pending={queue.isPending('dismiss:all')}
          onClick={enqueueDismissAll}
        >
          Descartar todas
        </AsyncActionButton>
      </div>
      <div className="smart-suggestion-list">
        {groups.map((group) => (
          <GroupCard key={group.key} group={group} />
        ))}
      </div>
    </div>
  );
}
