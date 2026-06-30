import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { MaintenanceItem } from '@shared/types.js';
import { api } from '../../lib/api.js';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Section,
  Skeleton,
  toast,
} from '../ds.js';
import { useMaintenanceView, usePeopleView, useBoardView } from '../hooks.js';
import { scheduleMaintenanceViewsRefetch } from '../lib/action-queue/maintenance-cache.js';
import { useQueryClient } from '@tanstack/react-query';
import { AssignmentSuggestionsPanel } from '../components/AssignmentSuggestionsPanel.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';
import { AsyncActionButton, QueueStatusPill } from '../components/AsyncActionButton.js';
import { buildProspectDismissEnqueue } from '../lib/prospect-dismiss-queue.js';

const MAINTENANCE_PAGE_SIZE = 25;

const GROUPS: Array<{ kinds: string[]; title: string; desc: string }> = [
  {
    kinds: ['merge_contacts'],
    title: 'Posibles duplicados',
    desc: 'Contactos que comparten email o nombre. Revisá y unificá los que sean la misma persona.',
  },
  {
    kinds: ['promote_prospect', 'link_prospect'],
    title: 'Nombres sin email',
    desc: 'Personas detectadas en notas o participantes, sin email confirmado. Revisá solo si reconocés el nombre.',
  },
  {
    kinds: ['reassign_team_email'],
    title: 'Emails de equipo en personas',
    desc: 'Contactos que parecen ser emails de equipo — movélos al equipo correcto.',
  },
  {
    kinds: ['assign_project', 'assign_team'],
    title: 'Asignaciones sugeridas',
    desc: 'Detectadas por coincidencia de nombres en títulos de reuniones — confirmá solo las correctas.',
  },
  {
    kinds: ['review_meeting'],
    title: 'Análisis por revisar',
    desc: 'El análisis IA marcó estas reuniones con baja confianza.',
  },
];

function MergeModal({ item, onClose }: { item: MaintenanceItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const personIds = (item.payload.personIds as string[]) ?? [];
  const people = usePeopleView();
  const [canonical, setCanonical] = useState(personIds[0] ?? '');

  const candidates = (people.data?.people ?? []).filter((p) => personIds.includes(p.id));

  const merge = useMutation({
    mutationFn: () =>
      api.mergePeople(
        canonical,
        personIds.filter((id) => id !== canonical),
      ),
    onSuccess: () => {
      scheduleMaintenanceViewsRefetch(queryClient);
      toast('Contactos unificados');
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <Modal
      title="Unificar contactos"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={merge.isPending} disabled={!canonical} onClick={() => merge.mutate()}>
            Unificar
          </Button>
        </div>
      }
    >
      <p className="muted" style={{ marginTop: 0 }}>
        {item.detail ?? item.title} — elegí cuál queda como contacto principal:
      </p>
      <div className="list-stack">
        {candidates.map((p) => (
          <label key={p.id} className="maintenance-checkbox-row">
            <input
              type="radio"
              name="canonical"
              checked={canonical === p.id}
              onChange={() => setCanonical(p.id)}
            />
            <div className="maintenance-checkbox-body">
              <div className="maintenance-checkbox-title">{p.displayName}</div>
              <p className="maintenance-checkbox-detail">
                {p.emails.join(', ') || 'sin email'} · {p.meetingCount} reuniones
              </p>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function ReassignTeamEmailCard({ item }: { item: MaintenanceItem }) {
  const queue = useActionQueue();
  const board = useBoardView();
  const email = String(item.payload.email ?? '');
  const suggestedTeamId = item.payload.suggestedTeamId as string | undefined;
  const [teamId, setTeamId] = useState(suggestedTeamId ?? '');
  const [newTeamName, setNewTeamName] = useState('');
  const itemKey = `reassign:${item.id}`;
  const cardPending = queue.isPending(itemKey) || queue.isPending(`${itemKey}:create`) || queue.isPending(`${itemKey}:dismiss`);

  const teams = board.data?.teams ?? [];
  const personId = String(item.payload.personId ?? '');

  return (
    <article className={`maintenance-item${cardPending ? ' maintenance-item--pending' : ''}`}>
      <h4 className="maintenance-item-title">{item.title}</h4>
      {item.detail ? <p className="maintenance-item-detail">{item.detail}</p> : null}
      <div className="maintenance-item-actions">
        <select className="field-input field-input--sm" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">Equipo…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <AsyncActionButton
          disabled={!teamId || !email}
          pending={queue.isPending(itemKey)}
          onClick={() =>
            queue.enqueue({
              key: itemKey,
              itemIds: [item.id],
              execute: () => api.assignEmailToTeam(teamId, email),
              successMessage: 'Email movido al equipo',
            })
          }
        >
          Mover a equipo
        </AsyncActionButton>
      </div>
      <div className="maintenance-item-actions">
        <input
          className="field-input field-input--sm"
          placeholder="Nuevo equipo…"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTeamName.trim()) {
              queue.enqueue({
                key: `${itemKey}:create`,
                itemIds: [item.id],
                execute: async () => {
                  const created = await api.createTeam(newTeamName.trim());
                  if (email) await api.assignEmailToTeam(created.team.id, email);
                  return created;
                },
                successMessage: (data) =>
                  email ? `Equipo «${data.team.name}» creado y email asignado` : `Equipo «${data.team.name}» creado`,
              });
            }
          }}
        />
        <AsyncActionButton
          variant="ghost"
          disabled={!newTeamName.trim()}
          pending={queue.isPending(`${itemKey}:create`)}
          onClick={() =>
            queue.enqueue({
              key: `${itemKey}:create`,
              itemIds: [item.id],
              execute: async () => {
                const created = await api.createTeam(newTeamName.trim());
                if (email) await api.assignEmailToTeam(created.team.id, email);
                setTeamId(created.team.id);
                setNewTeamName('');
                return created;
              },
              successMessage: (data) =>
                email ? `Equipo «${data.team.name}» creado y email asignado` : `Equipo «${data.team.name}» creado`,
            })
          }
        >
          Crear equipo
        </AsyncActionButton>
        <AsyncActionButton
          variant="ghost"
          disabled={!email}
          pending={queue.isPending(`${itemKey}:dismiss`)}
          onClick={() =>
            queue.enqueue({
              key: `${itemKey}:dismiss`,
              itemIds: [item.id],
              execute: () => api.dismissTeamEmailReassign(personId, email),
              successMessage: 'Sugerencia descartada',
            })
          }
        >
          Descartar
        </AsyncActionButton>
      </div>
    </article>
  );
}

function MaintenanceCard({ item }: { item: MaintenanceItem }) {
  if (item.kind === 'reassign_team_email') {
    return <ReassignTeamEmailCard item={item} />;
  }

  if (item.kind === 'assign_project' || item.kind === 'assign_team') {
    return null;
  }

  const queue = useActionQueue();
  const [merging, setMerging] = useState(false);
  const prospectId = item.payload.prospectId as string | undefined;
  const meetingId = item.payload.meetingId as string | undefined;
  const dismissKey = prospectId ? `prospect:dismiss:${prospectId}` : `merge:dismiss:${item.id}`;
  const cardPending =
    prospectId ? queue.isProspectPending(prospectId) : queue.isPending(dismissKey);

  return (
    <article className={`maintenance-item${cardPending ? ' maintenance-item--pending' : ''}`}>
      <h4 className="maintenance-item-title">{item.title}</h4>
      {item.detail ? <p className="maintenance-item-detail">{item.detail}</p> : null}
      <div className="maintenance-item-actions">
        {item.kind === 'merge_contacts' ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => setMerging(true)}>
              Revisar y unificar
            </Button>
            <AsyncActionButton
              variant="ghost"
              pending={cardPending}
              onClick={() =>
                queue.enqueue({
                  key: dismissKey,
                  itemIds: [item.id],
                  execute: () => api.dismissMergeContact(item.id),
                  successMessage: 'Sugerencia descartada',
                })
              }
            >
              Descartar
            </AsyncActionButton>
          </>
        ) : null}
        {item.kind === 'promote_prospect' || item.kind === 'link_prospect' ? (
          <>
            <Link
              to={`/personas?q=${encodeURIComponent(item.title)}&filtro=inferred`}
              className="btn btn-secondary btn-sm"
            >
              Confirmar en Personas
            </Link>
            {prospectId ? (
              <AsyncActionButton
                variant="ghost"
                pending={cardPending}
                onClick={() =>
                  queue.enqueue(
                    buildProspectDismissEnqueue({
                      prospectId,
                      displayName: item.title,
                      itemIds: [item.id],
                      dismiss: () => api.dismissProspect(prospectId),
                      restore: (snapshot) => api.restoreProspectDismiss(snapshot),
                    }),
                  )
                }
              >
                Descartar
              </AsyncActionButton>
            ) : null}
          </>
        ) : null}
        {item.kind === 'review_meeting' && meetingId ? (
          <Link to={`/reuniones/${meetingId}`} className="btn btn-secondary btn-sm">
            Revisar reunión
          </Link>
        ) : null}
        {item.confidence ? (
          <Badge tone={item.confidence === 'high' ? 'success' : item.confidence === 'low' ? 'warn' : 'default'}>
            Confianza {item.confidence === 'high' ? 'alta' : item.confidence === 'low' ? 'baja' : 'media'}
          </Badge>
        ) : null}
      </div>
      {merging ? <MergeModal item={item} onClose={() => setMerging(false)} /> : null}
    </article>
  );
}

function PaginatedMaintenanceList({ items }: { items: MaintenanceItem[] }) {
  const [visibleCount, setVisibleCount] = useState(MAINTENANCE_PAGE_SIZE);
  const visible = Math.min(visibleCount, items.length);
  const remaining = items.length - visible;

  useEffect(() => {
    setVisibleCount((prev) => Math.min(prev, Math.max(MAINTENANCE_PAGE_SIZE, items.length)));
  }, [items.length]);

  return (
    <div className="maintenance-list">
      {items.slice(0, visible).map((item) => (
        <MaintenanceCard key={item.id} item={item} />
      ))}
      {remaining > 0 ? (
        <div className="maintenance-more-row">
          <p className="muted">
            Mostrando {visible} de {items.length}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount((n) => n + MAINTENANCE_PAGE_SIZE)}
          >
            Ver más ({remaining})
          </Button>
        </div>
      ) : items.length > MAINTENANCE_PAGE_SIZE ? (
        <p className="muted">Mostrando los {items.length} ítems.</p>
      ) : null}
    </div>
  );
}

export default function Mantenimiento() {
  const queue = useActionQueue();
  const { data, isPending, error, refetch } = useMaintenanceView();

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  return (
    <div data-cerebro-target="maintenance.page">
      <PageHeader
        title="Mantenimiento de datos"
        desc="Limpieza detectada automáticamente con reglas (no IA): duplicados, asignaciones y confirmaciones pendientes."
        actions={<QueueStatusPill count={queue.pendingCount} />}
      />
      {!data.items.length ? (
        <EmptyState title="Datos al día" desc="No hay tareas de mantenimiento pendientes." />
      ) : (
        GROUPS.map((group) => {
          const items = data.items.filter((i) => group.kinds.includes(i.kind));
          if (!items.length) return null;
          const isAssignments = group.kinds.includes('assign_project');
          return (
            <Section key={group.title} title={`${group.title} (${items.length})`} desc={group.desc}>
              {isAssignments ? (
                <AssignmentSuggestionsPanel items={items} />
              ) : (
                <PaginatedMaintenanceList items={items} />
              )}
            </Section>
          );
        })
      )}
    </div>
  );
}
