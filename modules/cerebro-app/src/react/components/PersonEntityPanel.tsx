import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { MaintenanceItem, PeopleView, PersonListItem, ProspectResolveEnrichment } from '@shared/types.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Modal, toast } from '../ds.js';
import { patchAddProjectToPeopleView, patchAddTeamToPeopleView } from '../lib/action-queue/people-cache.js';
import { useEntityMutation } from '../lib/entity-action/use-entity-mutation.js';
import { AsyncActionButton } from './AsyncActionButton.js';
import { useActionQueue } from '../lib/action-queue/ActionQueueProvider.js';
import type { PeopleActions } from './PeopleDirectory.js';
import { buildProspectDismissEnqueue } from '../lib/prospect-dismiss-queue.js';

function TeamProjectPickers({
  teams,
  projects,
  teamIds,
  projectIds,
  onTeamIds,
  onProjectIds,
  disabled,
  onCreateTeam,
  onCreateProject,
}: {
  teams: PeopleView['teams'];
  projects: PeopleView['projects'];
  teamIds: string[];
  projectIds: string[];
  onTeamIds: Dispatch<SetStateAction<string[]>>;
  onProjectIds: Dispatch<SetStateAction<string[]>>;
  disabled?: boolean;
  onCreateTeam?: (name: string) => Promise<{ id: string; name: string; color?: string }>;
  onCreateProject?: (name: string) => Promise<{ id: string; name: string; tags?: string[] }>;
}) {
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [extraTeams, setExtraTeams] = useState<PeopleView['teams']>([]);
  const [extraProjects, setExtraProjects] = useState<PeopleView['projects']>([]);

  const allTeams = useMemo(() => {
    const seen = new Set(teams.map((t) => t.id));
    return [...teams, ...extraTeams.filter((t) => !seen.has(t.id))];
  }, [teams, extraTeams]);

  const allProjects = useMemo(() => {
    const seen = new Set(projects.map((p) => p.id));
    return [...projects, ...extraProjects.filter((p) => !seen.has(p.id))];
  }, [projects, extraProjects]);

  useEffect(() => {
    setExtraTeams((prev) => prev.filter((t) => !teams.some((x) => x.id === t.id)));
    setExtraProjects((prev) => prev.filter((p) => !projects.some((x) => x.id === p.id)));
  }, [teams, projects]);

  const toggle = (list: string[], id: string, set: Dispatch<SetStateAction<string[]>>) => {
    if (disabled) return;
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else set([...list, id]);
  };

  const createTeam = useMutation({
    mutationFn: () => onCreateTeam!(newTeamName.trim()),
    onSuccess: (created) => {
      const team = { id: created.id, name: created.name, color: created.color ?? '#64748b' };
      setExtraTeams((prev) => [...prev, team]);
      onTeamIds((ids) => (ids.includes(created.id) ? ids : [...ids, created.id]));
      patchAddTeamToPeopleView(queryClient, team);
      setNewTeamName('');
      toast('Equipo creado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const createProject = useMutation({
    mutationFn: () => onCreateProject!(newProjectName.trim()),
    onSuccess: (created) => {
      const project = { id: created.id, name: created.name, tags: created.tags ?? [] };
      setExtraProjects((prev) => [...prev, project]);
      onProjectIds((ids) => (ids.includes(created.id) ? ids : [...ids, created.id]));
      patchAddProjectToPeopleView(queryClient, project);
      setNewProjectName('');
      toast('Proyecto creado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <>
      <Field label="Equipos">
        <div className="catalog-chip-grid">
          {allTeams.length ? (
            allTeams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`catalog-chip${teamIds.includes(t.id) ? ' catalog-chip--active' : ''}`}
                aria-pressed={teamIds.includes(t.id)}
                disabled={disabled}
                onClick={() => toggle(teamIds, t.id, onTeamIds)}
              >
                <span className="catalog-chip-dot" style={{ background: t.color }} aria-hidden="true" />
                {t.name}
              </button>
            ))
          ) : (
            <span className="muted catalog-chip-empty">Sin equipos — creá uno abajo.</span>
          )}
        </div>
        {onCreateTeam ? (
          <div className="catalog-chip-create">
            <input
              className="field-input"
              value={newTeamName}
              placeholder="Nuevo equipo…"
              disabled={disabled || createTeam.isPending}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newTeamName.trim()) createTeam.mutate();
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!newTeamName.trim() || disabled}
              loading={createTeam.isPending}
              onClick={() => createTeam.mutate()}
            >
              Crear equipo
            </Button>
          </div>
        ) : null}
      </Field>
      <Field label="Proyectos">
        <div className="catalog-chip-grid">
          {allProjects.length ? (
            allProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`catalog-chip${projectIds.includes(p.id) ? ' catalog-chip--active' : ''}`}
                aria-pressed={projectIds.includes(p.id)}
                disabled={disabled}
                onClick={() => toggle(projectIds, p.id, onProjectIds)}
              >
                {p.name}
              </button>
            ))
          ) : (
            <span className="muted catalog-chip-empty">Sin proyectos — creá uno abajo.</span>
          )}
        </div>
        {onCreateProject ? (
          <div className="catalog-chip-create">
            <input
              className="field-input"
              value={newProjectName}
              placeholder="Nuevo proyecto…"
              disabled={disabled || createProject.isPending}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newProjectName.trim()) createProject.mutate();
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!newProjectName.trim() || disabled}
              loading={createProject.isPending}
              onClick={() => createProject.mutate()}
            >
              Crear proyecto
            </Button>
          </div>
        ) : null}
      </Field>
    </>
  );
}

function PersonEditForm({
  person,
  view,
  actions,
  onSaved,
  inline,
}: {
  person: PersonListItem;
  view: PeopleView;
  actions: PeopleActions;
  onSaved?: () => void;
  inline?: boolean;
}) {
  const { useEntityMutate } = useEntityMutation();
  const [name, setName] = useState(person.displayName);
  const [emails, setEmails] = useState(person.emails.join(', '));
  const [teamIds, setTeamIds] = useState<string[]>(person.teamIds);
  const [projectIds, setProjectIds] = useState<string[]>(person.projectIds);
  const [moveEmail, setMoveEmail] = useState('');
  const [moveTeamId, setMoveTeamId] = useState('');

  const save = useEntityMutate(
    `person-save:${person.id}`,
    async () => {
      await actions.updatePerson(person.id, {
        displayName: name.trim(),
        emails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
        teamIds,
        projectIds,
      });
      onSaved?.();
    },
    { success: 'Contacto actualizado' },
  );

  const moveToTeam = useEntityMutate(
    `person-move-email:${person.id}`,
    async () => {
      await actions.assignEmailToTeam!(moveTeamId, moveEmail.trim());
      setMoveEmail('');
      onSaved?.();
    },
    { success: 'Email movido al equipo' },
  );

  const body = (
    <>
      <Field label="Nombre">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Emails" hint="Separados por coma">
        <input className="field-input" value={emails} onChange={(e) => setEmails(e.target.value)} />
      </Field>
      <TeamProjectPickers
        teams={view.teams}
        projects={view.projects}
        teamIds={teamIds}
        projectIds={projectIds}
        onTeamIds={setTeamIds}
        onProjectIds={setProjectIds}
        onCreateTeam={actions.createTeam}
        onCreateProject={actions.createProject}
      />
      {actions.assignEmailToTeam && view.teams.length ? (
        <Field label="Mover email a equipo" hint="Para emails de equipo que aparecen como persona">
          <div className="graph-move-email-row">
            <input
              className="field-input"
              placeholder="email@equipo.com"
              value={moveEmail}
              onChange={(e) => setMoveEmail(e.target.value)}
            />
            <select
              className="field-input field-input--sm"
              value={moveTeamId}
              onChange={(e) => setMoveTeamId(e.target.value)}
            >
              <option value="">Equipo…</option>
              {view.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!moveEmail.trim() || !moveTeamId}
              loading={moveToTeam.isPending}
              onClick={() => moveToTeam.run()}
            >
              Mover
            </Button>
          </div>
        </Field>
      ) : null}
      <div className="btn-row" style={{ marginTop: inline ? 0 : 'var(--space-3)' }}>
        <Button loading={save.isPending} onClick={() => save.run()}>
          Guardar
        </Button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div
        className="person-entity-inline"
        data-cerebro-entity={`${person.kind === 'prospect' ? 'prospect' : 'person'}:${person.id}`}
      >
        {body}
      </div>
    );
  }

  return (
    <div data-cerebro-entity={`${person.kind === 'prospect' ? 'prospect' : 'person'}:${person.id}`}>{body}</div>
  );
}

function buildProspectEnrichment(
  aliasesRaw: string,
  teamIds: string[],
  projectIds: string[],
): ProspectResolveEnrichment | undefined {
  const aliases = aliasesRaw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const enrichment: ProspectResolveEnrichment = {};
  if (aliases.length) enrichment.aliases = aliases;
  if (teamIds.length) enrichment.teamIds = teamIds;
  if (projectIds.length) enrichment.projectIds = projectIds;
  return Object.keys(enrichment).length ? enrichment : undefined;
}

function normalizeEmailInput(email: string): string {
  return email.toLowerCase().trim();
}

function findContactByEmail(view: PeopleView, email: string): PersonListItem | null {
  const normalized = normalizeEmailInput(email);
  if (!normalized.includes('@')) return null;
  return (
    view.people.find(
      (p) => p.kind === 'person' && p.emails.some((e) => normalizeEmailInput(e) === normalized),
    ) ?? null
  );
}

function resolveSelectedContact(
  selectedLinkId: string | null,
  candidates: ProspectCandidate[] | undefined,
  people: PersonListItem[],
): ProspectCandidate | null {
  if (!selectedLinkId) return null;
  const fromCandidates = candidates?.find((c) => c.personId === selectedLinkId);
  if (fromCandidates) return fromCandidates;
  const fromView = people.find((p) => p.kind === 'person' && p.id === selectedLinkId);
  if (!fromView) return null;
  return {
    personId: fromView.id,
    displayName: fromView.displayName,
    emails: fromView.emails,
    score: 0,
    sharedMeetings: 0,
  };
}

type ProspectCandidate = {
  personId: string;
  displayName: string;
  emails: string[];
  score: number;
  sharedMeetings: number;
};

function ProspectCandidatesSection({
  loading,
  error,
  candidates,
  onRetry,
  selectedPersonId,
  onSelect,
  disabled,
}: {
  loading: boolean;
  error: boolean;
  candidates: ProspectCandidate[] | undefined;
  onRetry: () => void;
  selectedPersonId: string | null;
  onSelect: (personId: string) => void;
  disabled?: boolean;
}) {
  if (loading) {
    return (
      <div
        className="prospect-candidates-loading"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        <div className="prospect-candidates-loading-head">
          <span className="prospect-candidates-spinner" aria-hidden="true" />
          <div>
            <strong className="prospect-candidates-loading-title">Buscando contactos similares…</strong>
            <p className="muted prospect-candidates-loading-hint">
              Comparando reuniones y emails en tu directorio
            </p>
          </div>
        </div>
        <div className="prospect-candidates-skeletons" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="smart-suggestion smart-suggestion--skeleton">
              <div className="skeleton skeleton-line prospect-candidates-skeleton-name" />
              <div className="skeleton skeleton-line prospect-candidates-skeleton-meta" />
              <div className="skeleton skeleton-line prospect-candidates-skeleton-btn" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="prospect-candidates-feedback prospect-candidates-feedback--error" role="alert">
        No pudimos buscar coincidencias.{' '}
        <button type="button" className="kpi-link" onClick={onRetry}>
          Reintentar
        </button>
      </p>
    );
  }

  if (!candidates?.length) {
    return (
      <p className="prospect-candidates-feedback muted" role="status">
        No hay contactos similares en tu directorio — podés crear uno nuevo abajo.
      </p>
    );
  }

  return (
    <div className="list-stack prospect-candidates-list">
      <strong>¿Es alguno de estos contactos?</strong>
      <p className="muted prospect-candidates-select-hint">Elegí uno — abajo podés completar alias, equipos y proyectos antes de vincular.</p>
      {candidates.slice(0, 5).map((c) => {
        const selected = selectedPersonId === c.personId;
        return (
          <label
            key={c.personId}
            className={`smart-suggestion prospect-candidate-pick${selected ? ' prospect-candidate-pick--selected' : ''}`}
          >
            <input
              type="radio"
              name="prospect-link-candidate"
              className="prospect-candidate-pick-input"
              checked={selected}
              disabled={disabled}
              onChange={() => onSelect(c.personId)}
            />
            <div className="prospect-candidate-pick-body">
              <div className="smart-suggestion-title">{c.displayName}</div>
              <p className="smart-suggestion-reason">
                {c.emails[0] ?? 'sin email'} · {c.sharedMeetings} reuniones compartidas
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function ProspectResolveForm({
  prospect,
  view,
  actions,
  onQueued,
  onBack,
  inline,
}: {
  prospect: PersonListItem;
  view: PeopleView;
  actions: PeopleActions;
  /** Volver al listado / cerrar tras encolar (procesa en cola de fondo). */
  onQueued?: () => void;
  onBack?: () => void;
  inline?: boolean;
}) {
  const queue = useActionQueue();
  const [email, setEmail] = useState('');
  const [name, setName] = useState(prospect.displayName);
  const [aliases, setAliases] = useState('');
  const [teamIds, setTeamIds] = useState<string[]>(prospect.teamIds);
  const [projectIds, setProjectIds] = useState<string[]>(prospect.projectIds);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLinkId(null);
    setEmail('');
    setName(prospect.displayName);
    setAliases('');
    setTeamIds(prospect.teamIds);
    setProjectIds(prospect.projectIds);
  }, [prospect.id]);

  const candidates = useQuery({
    queryKey: ['prospect-candidates', prospect.id],
    queryFn: () => actions.getProspectCandidates(prospect.id),
  });

  const dismissKey = `prospect:dismiss:${prospect.id}`;
  const promoteKey = `prospect:promote:${prospect.id}`;
  const prospectPending = queue.isProspectPending(prospect.id);
  const dismissPending = queue.isPending(dismissKey);
  const promotePending = queue.isPending(promoteKey);
  const linkPending = selectedLinkId
    ? queue.isPending(`prospect:link:${prospect.id}:${selectedLinkId}`)
    : false;
  const enrichment = () => buildProspectEnrichment(aliases, teamIds, projectIds);
  const emailMatch = useMemo(() => findContactByEmail(view, email), [view.people, email]);
  const selectedContact = useMemo(
    () => resolveSelectedContact(selectedLinkId, candidates.data?.candidates, view.people),
    [selectedLinkId, candidates.data?.candidates, view.people],
  );
  const emailDuplicateBlocksCreate = emailMatch != null;
  const showEmailDuplicateNotice =
    emailMatch != null && selectedLinkId !== emailMatch.id;
  const emailMatchLinkKey = emailMatch ? `prospect:link:${prospect.id}:${emailMatch.id}` : '';
  const emailMatchLinkPending = emailMatchLinkKey ? queue.isPending(emailMatchLinkKey) : false;
  const enrichmentSummary = useMemo(() => {
    const parts: string[] = [];
    if (teamIds.length) parts.push(`${teamIds.length} equipo${teamIds.length === 1 ? '' : 's'}`);
    if (projectIds.length) parts.push(`${projectIds.length} proyecto${projectIds.length === 1 ? '' : 's'}`);
    if (aliases.trim()) parts.push('alias');
    return parts;
  }, [teamIds, projectIds, aliases]);

  const enqueueDismiss = () => {
    if (prospectPending || !actions.restoreProspectDismiss) return;
    queue.enqueue(
      buildProspectDismissEnqueue({
        prospectId: prospect.id,
        displayName: prospect.displayName,
        dismiss: () =>
          actions.dismissProspect(prospect.id) as Promise<
            import('../lib/prospect-dismiss-queue.js').ProspectDismissApiResult
          >,
        restore: actions.restoreProspectDismiss,
      }),
    );
    onQueued?.();
  };

  const enqueuePromote = () => {
    if (!email.trim() || prospectPending) return;
    queue.enqueue({
      key: promoteKey,
      prospectIds: [prospect.id],
      execute: () =>
        actions.promoteProspect(prospect.id, email.trim(), name.trim() || undefined, enrichment()),
      successMessage: 'Prospect promovido a contacto',
    });
    onQueued?.();
  };

  const confirmLink = () => {
    if (!selectedLinkId || prospectPending) return;
    queue.enqueue({
      key: `prospect:link:${prospect.id}:${selectedLinkId}`,
      prospectIds: [prospect.id],
      execute: () => actions.linkProspect(prospect.id, selectedLinkId, enrichment()),
      successMessage: 'Prospect vinculado al contacto',
    });
    onQueued?.();
  };

  const linkToEmailMatch = () => {
    if (!emailMatch || prospectPending) return;
    queue.enqueue({
      key: emailMatchLinkKey,
      prospectIds: [prospect.id],
      execute: () => actions.linkProspect(prospect.id, emailMatch.id, enrichment()),
      successMessage: 'Prospect vinculado al contacto',
    });
    onQueued?.();
  };

  const body = (
    <>
      {onBack ? (
        <div className="person-resolve-nav">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Volver al listado
          </Button>
        </div>
      ) : null}
      <p className="muted" style={{ marginTop: 0 }}>
        Detectado en {prospect.meetingCount} reuniones sin email confirmado.
      </p>
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <ProspectCandidatesSection
          loading={candidates.isPending}
          error={candidates.isError}
          candidates={candidates.data?.candidates}
          onRetry={() => void candidates.refetch()}
          selectedPersonId={selectedLinkId}
          onSelect={setSelectedLinkId}
          disabled={prospectPending}
        />
      </div>
      <div className="prospect-enrich-block">
        <strong>Enriquecer contacto</strong>
        <p className="muted prospect-enrich-hint">
          {selectedContact
            ? `Alias, equipos y proyectos se aplicarán al vincular con ${selectedContact.displayName}.`
            : 'Elegí equipos y proyectos acá; se guardan al vincular una coincidencia o al crear contacto con email abajo.'}
        </p>
        {enrichmentSummary.length ? (
          <p className="prospect-enrich-summary muted" role="status">
            Seleccionado: {enrichmentSummary.join(', ')}.
            {!selectedLinkId && !email.trim()
              ? ' Completá el email o elegí una coincidencia para guardar.'
              : selectedLinkId
                ? ' Confirmá con «Vincular contacto».'
                : ' Confirmá con «Crear contacto».'}
          </p>
        ) : null}
        <Field label="Alias" hint="Separados por coma — otros nombres con los que aparece">
          <input
            className="field-input"
            value={aliases}
            placeholder={prospect.displayName}
            disabled={prospectPending}
            onChange={(e) => setAliases(e.target.value)}
          />
        </Field>
        <TeamProjectPickers
          teams={view.teams}
          projects={view.projects}
          teamIds={teamIds}
          projectIds={projectIds}
          onTeamIds={setTeamIds}
          onProjectIds={setProjectIds}
          disabled={prospectPending}
          onCreateTeam={actions.createTeam}
          onCreateProject={actions.createProject}
        />
        {selectedLinkId && selectedContact ? (
          <div className="prospect-link-confirm">
            <p className="prospect-link-confirm-copy">
              Vincular <strong>{prospect.displayName}</strong> con{' '}
              <strong>{selectedContact.displayName}</strong>
              {selectedContact.emails[0] ? ` (${selectedContact.emails[0]})` : ''}
            </p>
            <AsyncActionButton
              variant="primary"
              pending={linkPending}
              disabled={prospectPending && !linkPending}
              onClick={confirmLink}
            >
              Vincular contacto
            </AsyncActionButton>
          </div>
        ) : null}
      </div>
      <strong>Crear contacto nuevo</strong>
      <Field label="Nombre">
        <input
          className="field-input"
          value={name}
          disabled={prospectPending}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field
        label="Email"
        hint={
          enrichmentSummary.length
            ? 'Requerido — al crear el contacto también se guardan equipos, proyectos y alias'
            : 'Requerido para crear el contacto'
        }
      >
        <input
          className="field-input"
          type="email"
          value={email}
          placeholder="nombre@empresa.com"
          disabled={prospectPending}
          aria-invalid={showEmailDuplicateNotice || undefined}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {showEmailDuplicateNotice ? (
        <div className="prospect-email-dup-notice" role="status">
          <p className="prospect-email-dup-notice-copy">
            Este email ya pertenece a <strong>{emailMatch.displayName}</strong>
            {emailMatch.emails[0] ? ` (${emailMatch.emails[0]})` : ''}. ¿Vincular en su lugar? No se
            creará un contacto duplicado.
          </p>
          <AsyncActionButton
            variant="secondary"
            size="sm"
            pending={emailMatchLinkPending}
            disabled={prospectPending && !emailMatchLinkPending}
            onClick={linkToEmailMatch}
          >
            Vincular con {emailMatch.displayName}
          </AsyncActionButton>
        </div>
      ) : null}
      {!inline ? (
        <div className="btn-row">
          <AsyncActionButton
            variant="primary"
            pending={promotePending}
            disabled={
              !email.trim() ||
              emailDuplicateBlocksCreate ||
              (prospectPending && !promotePending)
            }
            onClick={enqueuePromote}
          >
            Crear contacto
          </AsyncActionButton>
          <AsyncActionButton
            variant="ghost"
            pending={dismissPending}
            disabled={prospectPending && !dismissPending}
            onClick={enqueueDismiss}
          >
            No es una persona
          </AsyncActionButton>
        </div>
      ) : (
        <div className="btn-row" style={{ marginTop: 'var(--space-2)' }}>
          <AsyncActionButton
            variant="primary"
            pending={promotePending}
            disabled={
              !email.trim() ||
              emailDuplicateBlocksCreate ||
              (prospectPending && !promotePending)
            }
            onClick={enqueuePromote}
          >
            Crear contacto
          </AsyncActionButton>
          <AsyncActionButton
            variant="ghost"
            pending={dismissPending}
            disabled={prospectPending && !dismissPending}
            onClick={enqueueDismiss}
          >
            No es una persona
          </AsyncActionButton>
        </div>
      )}
    </>
  );

  if (inline) return <div className="person-entity-inline">{body}</div>;
  return body;
}

export function ProspectResolvePanel({
  prospect,
  view,
  actions,
  onBack,
  title,
}: {
  prospect: PersonListItem;
  view: PeopleView;
  actions: PeopleActions;
  onBack: () => void;
  title?: string;
}) {
  return (
    <section className="person-resolve-panel" aria-labelledby="person-resolve-title">
      <header className="person-resolve-header">
        <div>
          <h2 id="person-resolve-title" className="person-resolve-title">
            {title ?? `Confirmar: ${prospect.displayName}`}
          </h2>
          <p className="muted person-resolve-subtitle">Por confirmar · {prospect.meetingCount} reuniones</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Volver al listado
        </Button>
      </header>
      <ProspectResolveForm prospect={prospect} view={view} actions={actions} onQueued={onBack} inline />
    </section>
  );
}

function MergeBlock({
  personId,
  maintenanceItems,
  actions,
  people,
  onMerged,
}: {
  personId: string;
  maintenanceItems?: MaintenanceItem[];
  actions: PeopleActions;
  people: PersonListItem[];
  onMerged?: () => void;
}) {
  const queue = useActionQueue();
  const mergeItem = useMemo(
    () =>
      maintenanceItems?.find(
        (item) =>
          item.kind === 'merge_contacts' &&
          ((item.payload.personIds as string[]) ?? []).includes(personId),
      ),
    [maintenanceItems, personId],
  );
  const [canonical, setCanonical] = useState(personId);

  const mergeIds = mergeItem ? ((mergeItem.payload.personIds as string[]) ?? []) : [];
  const candidates = people.filter((p) => mergeIds.includes(p.id));
  const mergeKey = mergeItem ? `merge:${mergeItem.id}` : '';
  const mergePending = mergeKey ? queue.isPending(mergeKey) : false;
  const toRemove = mergeIds.filter((id) => id !== canonical);

  const enqueueMerge = () => {
    if (!mergeItem || !actions.mergePeople) return;
    queue.enqueue({
      key: mergeKey,
      itemIds: [mergeItem.id],
      removePersonIds: toRemove,
      execute: () => actions.mergePeople!(canonical, toRemove),
      successMessage: 'Contactos unificados',
    });
    onMerged?.();
  };

  if (!mergeItem || !actions.mergePeople || candidates.length < 2) return null;

  return (
    <div className="graph-merge-block">
      <p className="graph-neighbors-title">Posible duplicado</p>
      <p className="muted">{mergeItem.detail ?? mergeItem.title}</p>
      <div className="list-stack">
        {candidates.map((p) => (
          <label key={p.id} className="smart-suggestion" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              name="merge-canonical"
              checked={canonical === p.id}
              disabled={mergePending}
              onChange={() => setCanonical(p.id)}
            />{' '}
            {p.displayName} · {p.emails[0] ?? 'sin email'}
          </label>
        ))}
      </div>
      <AsyncActionButton variant="secondary" pending={mergePending} onClick={enqueueMerge}>
        Unificar contactos
      </AsyncActionButton>
    </div>
  );
}

export function PersonEntityModal({
  person,
  view,
  actions,
  maintenanceItems,
  onClose,
}: {
  person: PersonListItem;
  view: PeopleView;
  actions: PeopleActions;
  maintenanceItems?: MaintenanceItem[];
  onClose: () => void;
}) {
  const isProspect = person.kind === 'prospect';

  return (
    <Modal
      title={isProspect ? `Confirmar: ${person.displayName}` : `Editar: ${person.displayName}`}
      onClose={onClose}
      footer={
        isProspect ? (
          <div className="btn-row">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="btn-row">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          </div>
        )
      }
    >
      {isProspect ? (
        <ProspectResolveForm
          prospect={person}
          view={view}
          actions={actions}
          onQueued={onClose}
          onBack={onClose}
        />
      ) : (
        <>
          <PersonEditForm person={person} view={view} actions={actions} onSaved={onClose} />
          <MergeBlock
            personId={person.id}
            maintenanceItems={maintenanceItems}
            actions={actions}
            people={view.people}
            onMerged={onClose}
          />
        </>
      )}
    </Modal>
  );
}

export function PersonEntityInlinePanel({
  person,
  view,
  actions,
  maintenanceItems,
}: {
  person: PersonListItem;
  view: PeopleView;
  actions: PeopleActions;
  maintenanceItems?: MaintenanceItem[];
}) {
  if (person.kind === 'prospect') {
    return <ProspectResolveForm prospect={person} view={view} actions={actions} inline />;
  }
  return (
    <>
      <PersonEditForm person={person} view={view} actions={actions} inline />
      <MergeBlock
        personId={person.id}
        maintenanceItems={maintenanceItems}
        actions={actions}
        people={view.people}
      />
    </>
  );
}
