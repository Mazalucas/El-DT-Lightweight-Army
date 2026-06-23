import { useState } from 'react';
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
import { useInvalidateViews, useMaintenanceView, usePeopleView } from '../hooks.js';

const GROUPS: Array<{ kinds: string[]; title: string; desc: string }> = [
  {
    kinds: ['merge_contacts'],
    title: 'Posibles duplicados',
    desc: 'Contactos que comparten email o nombre. Revisá y unificá los que sean la misma persona.',
  },
  {
    kinds: ['promote_prospect', 'link_prospect'],
    title: 'Personas por confirmar',
    desc: 'Nombres detectados en notas sin email confirmado.',
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
  const invalidate = useInvalidateViews();
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
      invalidate();
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
          <label key={p.id} className="smart-suggestion" style={{ cursor: 'pointer' }}>
            <div className="smart-suggestion-title">
              <input
                type="radio"
                name="canonical"
                checked={canonical === p.id}
                onChange={() => setCanonical(p.id)}
              />{' '}
              {p.displayName}
            </div>
            <p className="smart-suggestion-reason">
              {p.emails.join(', ') || 'sin email'} · {p.meetingCount} reuniones
            </p>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function MaintenanceCard({ item }: { item: MaintenanceItem }) {
  const invalidate = useInvalidateViews();
  const [merging, setMerging] = useState(false);

  const act = useMutation({
    mutationFn: async (action: 'accept' | 'dismiss') => {
      if (action === 'dismiss') return api.dismissSuggestion(item.id);
      if (item.kind === 'assign_project') return api.acceptProjectSuggestion(item.id);
      if (item.kind === 'assign_team') return api.acceptTeamSuggestion(item.id);
      return null;
    },
    onSuccess: () => {
      invalidate();
      toast('Listo');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const meetingId = item.payload.meetingId as string | undefined;
  const prospectId = item.payload.prospectId as string | undefined;

  return (
    <article className="smart-suggestion">
      <div className="smart-suggestion-title">{item.title}</div>
      {item.detail ? <p className="smart-suggestion-reason">{item.detail}</p> : null}
      <div className="smart-suggestion-actions">
        {item.kind === 'merge_contacts' ? (
          <Button size="sm" variant="secondary" onClick={() => setMerging(true)}>
            Revisar y unificar
          </Button>
        ) : null}
        {item.kind === 'promote_prospect' || item.kind === 'link_prospect' ? (
          <Link
            to={`/personas?q=${encodeURIComponent(item.title)}&filtro=inferred`}
            className="btn btn-secondary btn-sm"
          >
            Confirmar en Personas
          </Link>
        ) : null}
        {item.kind === 'assign_project' || item.kind === 'assign_team' ? (
          <>
            <Button size="sm" variant="secondary" loading={act.isPending} onClick={() => act.mutate('accept')}>
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" disabled={act.isPending} onClick={() => act.mutate('dismiss')}>
              Descartar
            </Button>
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
        {prospectId ? null : null}
      </div>
      {merging ? <MergeModal item={item} onClose={() => setMerging(false)} /> : null}
    </article>
  );
}

export default function Mantenimiento() {
  const { data, isPending, error, refetch } = useMaintenanceView();

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Mantenimiento de datos"
        desc="Limpieza detectada automáticamente con reglas (no IA): duplicados, asignaciones y confirmaciones pendientes."
      />
      {!data.items.length ? (
        <EmptyState title="Datos al día" desc="No hay tareas de mantenimiento pendientes." />
      ) : (
        GROUPS.map((group) => {
          const items = data.items.filter((i) => group.kinds.includes(i.kind));
          if (!items.length) return null;
          return (
            <Section key={group.title} title={`${group.title} (${items.length})`} desc={group.desc}>
              <div className="smart-suggestion-list">
                {items.slice(0, 30).map((item) => (
                  <MaintenanceCard key={item.id} item={item} />
                ))}
                {items.length > 30 ? (
                  <p className="muted">Y {items.length - 30} más — resolvé estos primero.</p>
                ) : null}
              </div>
            </Section>
          );
        })
      )}
    </div>
  );
}
