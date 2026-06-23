import { useMemo, useState } from 'react';
import type { PeopleView, PersonListItem } from '@shared/types.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge, Button, DataTable, EmptyState, Field, Modal, formatDate, toast } from '../ds.js';
import { useInvalidateViews } from '../hooks.js';

export interface PeopleActions {
  updatePerson: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  promoteProspect: (id: string, email: string, displayName?: string) => Promise<unknown>;
  linkProspect: (prospectId: string, personId: string) => Promise<unknown>;
  getProspectCandidates: (prospectId: string) => Promise<{
    candidates: Array<{ personId: string; displayName: string; emails: string[]; score: number; sharedMeetings: number }>;
  }>;
}

function EditPersonModal({
  person,
  actions,
  onClose,
}: {
  person: PersonListItem;
  actions: PeopleActions;
  onClose: () => void;
}) {
  const invalidate = useInvalidateViews();
  const [name, setName] = useState(person.displayName);
  const [emails, setEmails] = useState(person.emails.join(', '));

  const save = useMutation({
    mutationFn: () =>
      actions.updatePerson(person.id, {
        displayName: name.trim(),
        emails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      invalidate();
      toast('Contacto actualizado');
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <Modal
      title="Editar contacto"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            Guardar
          </Button>
        </div>
      }
    >
      <Field label="Nombre">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Emails" hint="Separados por coma">
        <input className="field-input" value={emails} onChange={(e) => setEmails(e.target.value)} />
      </Field>
    </Modal>
  );
}

function ProspectModal({
  prospect,
  actions,
  onClose,
}: {
  prospect: PersonListItem;
  actions: PeopleActions;
  onClose: () => void;
}) {
  const invalidate = useInvalidateViews();
  const [email, setEmail] = useState('');
  const [name, setName] = useState(prospect.displayName);

  const candidates = useQuery({
    queryKey: ['prospect-candidates', prospect.id],
    queryFn: () => actions.getProspectCandidates(prospect.id),
  });

  const promote = useMutation({
    mutationFn: () => actions.promoteProspect(prospect.id, email.trim(), name.trim() || undefined),
    onSuccess: () => {
      invalidate();
      toast('Prospect promovido a contacto');
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const link = useMutation({
    mutationFn: (personId: string) => actions.linkProspect(prospect.id, personId),
    onSuccess: () => {
      invalidate();
      toast('Prospect vinculado al contacto');
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <Modal title={`Confirmar identidad: ${prospect.displayName}`} onClose={onClose}>
      <p className="muted" style={{ marginTop: 0 }}>
        Detectado en {prospect.meetingCount} reuniones sin email confirmado. Vinculalo a un contacto
        existente o convertilo en contacto nuevo.
      </p>

      {candidates.data?.candidates.length ? (
        <div className="list-stack" style={{ marginBottom: 'var(--space-4)' }}>
          <strong>¿Es alguno de estos contactos?</strong>
          {candidates.data.candidates.slice(0, 5).map((c) => (
            <div key={c.personId} className="smart-suggestion">
              <div className="smart-suggestion-title">{c.displayName}</div>
              <p className="smart-suggestion-reason">
                {c.emails[0] ?? 'sin email'} · {c.sharedMeetings} reuniones compartidas
              </p>
              <div className="smart-suggestion-actions">
                <Button size="sm" variant="secondary" disabled={link.isPending} onClick={() => link.mutate(c.personId)}>
                  Es la misma persona
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <strong>Crear contacto nuevo</strong>
      <Field label="Nombre">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Email">
        <input
          className="field-input"
          type="email"
          value={email}
          placeholder="nombre@empresa.com"
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <div className="btn-row">
        <Button
          loading={promote.isPending}
          disabled={!email.trim()}
          onClick={() => promote.mutate()}
        >
          Crear contacto
        </Button>
      </div>
    </Modal>
  );
}

export function PeopleDirectory({
  view,
  actions,
  initialQuery,
  initialFilter,
}: {
  view: PeopleView;
  actions: PeopleActions;
  initialQuery?: string;
  initialFilter?: 'all' | 'confirmed' | 'inferred';
}) {
  const [q, setQ] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'inferred'>(initialFilter ?? 'all');
  const [editing, setEditing] = useState<PersonListItem | null>(null);
  const [resolving, setResolving] = useState<PersonListItem | null>(null);

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

      {!filtered.length ? (
        <EmptyState
          title="Sin personas"
          desc={q ? 'Probá con otra búsqueda.' : 'Sincronizá reuniones para detectar contactos automáticamente.'}
        />
      ) : (
        <DataTable headers={['Persona', 'Email', 'Equipos', 'Reuniones', 'Última reunión', '']}>
          {filtered.map((p) => (
            <tr key={`${p.kind}-${p.id}`}>
              <td>
                <span className="row-title-link">{p.displayName}</span>{' '}
                {p.kind === 'prospect' ? (
                  <Badge tone="warn">Por confirmar</Badge>
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
                  <Button size="sm" variant="secondary" onClick={() => setResolving(p)}>
                    Confirmar
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                    Editar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {editing ? <EditPersonModal person={editing} actions={actions} onClose={() => setEditing(null)} /> : null}
      {resolving ? <ProspectModal prospect={resolving} actions={actions} onClose={() => setResolving(null)} /> : null}
    </div>
  );
}
