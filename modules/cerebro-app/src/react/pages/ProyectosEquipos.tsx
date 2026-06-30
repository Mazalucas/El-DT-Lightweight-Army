import { useState } from 'react';
import { api } from '../../lib/api.js';
import { Button, DataTable, EmptyState, ErrorState, Field, Modal, PageHeader, Section, Skeleton } from '../ds.js';
import { useBoardView, useSettings } from '../hooks.js';
import type { Team } from '@shared/types.js';
import { useEntityMutation } from '../lib/entity-action/use-entity-mutation.js';

function CatalogSection({
  title,
  desc,
  items,
  usageLabel,
  usage,
  onCreate,
  onDelete,
  placeholder,
}: {
  title: string;
  desc: string;
  items: Array<{ id: string; name: string }>;
  usageLabel: string;
  usage: Map<string, number>;
  onCreate: (name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  placeholder: string;
}) {
  const { enqueue } = useEntityMutation();
  const settings = useSettings();
  const liveElements = settings.data?.cerebro?.liveElements === true;
  const [name, setName] = useState('');
  const isProject = title === 'Proyectos';

  const runCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const tempId = `optimistic-${Date.now()}`;
    enqueue({
      key: `catalog-create:${title}:${trimmed}`,
      catalogBoard: liveElements
        ? isProject
          ? { addProject: { id: tempId, name: trimmed } }
          : { addTeam: { id: tempId, name: trimmed, emails: [] } }
        : undefined,
      execute: () => onCreate(trimmed),
      successMessage: `${title.slice(0, -1)} creado`,
    });
    setName('');
  };

  const runDelete = (id: string, itemName: string) => {
    if (!confirm(`¿Eliminar «${itemName}»?`)) return;
    enqueue({
      key: `catalog-delete:${title}:${id}`,
      catalogBoard: liveElements
        ? isProject
          ? { removeProjectId: id }
          : { removeTeamId: id }
        : undefined,
      execute: () => onDelete(id),
      successMessage: 'Eliminado',
    });
  };

  return (
    <Section title={title} desc={desc}>
      <div className="toolbar-row">
        <input
          className="field-input"
          value={name}
          placeholder={placeholder}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) runCreate();
          }}
        />
        <Button size="sm" disabled={!name.trim()} onClick={runCreate}>
          Crear
        </Button>
      </div>
      {items.length ? (
        <DataTable headers={['Nombre', usageLabel, '']}>
          {items.map((item) => (
            <tr key={item.id} data-cerebro-entity={`${isProject ? 'project' : 'team'}:${item.id}`}>
              <td>{item.name}</td>
              <td className="row-meta">{usage.get(item.id) ?? 0}</td>
              <td>
                <Button size="sm" variant="ghost" onClick={() => runDelete(item.id, item.name)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title={`Sin ${title.toLowerCase()}`} desc="Crealos a mano o aceptá sugerencias de Mantenimiento." />
      )}
    </Section>
  );
}

function TeamEditModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { useEntityMutate } = useEntityMutation();
  const [name, setName] = useState(team.name);
  const [emails, setEmails] = useState((team.emails ?? []).join(', '));

  const save = useEntityMutate(
    `team-update:${team.id}`,
    () =>
      api.updateTeam(team.id, {
        name: name.trim(),
        emails: emails
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      }),
    { success: 'Equipo actualizado' },
  );

  const runSave = () => {
    void save.run().then(() => onClose());
  };

  return (
    <Modal
      title={`Editar equipo: ${team.name}`}
      onClose={onClose}
      footer={
        <div className="btn-row">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={save.isPending} onClick={runSave}>Guardar</Button>
        </div>
      }
    >
      <Field label="Nombre">
        <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Emails del equipo" hint="Separados por coma">
        <input className="field-input" value={emails} onChange={(e) => setEmails(e.target.value)} />
      </Field>
    </Modal>
  );
}

function TeamsSection({ teams, usage }: { teams: Team[]; usage: Map<string, number> }) {
  const { enqueue } = useEntityMutation();
  const settings = useSettings();
  const liveElements = settings.data?.cerebro?.liveElements === true;
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Team | null>(null);

  const runCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    enqueue({
      key: `team-create:${trimmed}`,
      catalogBoard: liveElements ? { addTeam: { id: `optimistic-${Date.now()}`, name: trimmed, emails: [] } } : undefined,
      execute: () => api.createTeam(trimmed),
      successMessage: 'Equipo creado',
    });
    setName('');
  };

  const runDelete = (id: string, teamName: string) => {
    if (!confirm(`¿Eliminar «${teamName}»?`)) return;
    enqueue({
      key: `team-delete:${id}`,
      catalogBoard: liveElements ? { removeTeamId: id } : undefined,
      execute: () => api.deleteTeam(id),
      successMessage: 'Equipo eliminado',
    });
  };

  return (
    <Section title="Equipos" desc="Agrupan personas y reuniones. Los emails de equipo no aparecen como personas.">
      <div className="toolbar-row">
        <input
          className="field-input"
          value={name}
          placeholder="Nuevo equipo…"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) runCreate();
          }}
        />
        <Button size="sm" disabled={!name.trim()} onClick={runCreate}>
          Crear
        </Button>
      </div>
      {teams.length ? (
        <DataTable headers={['Nombre', 'Emails', 'Tareas', '']}>
          {teams.map((team) => (
            <tr key={team.id} data-cerebro-entity={`team:${team.id}`}>
              <td>{team.name}</td>
              <td className="row-meta">{(team.emails ?? []).join(', ') || '—'}</td>
              <td className="row-meta">{usage.get(team.id) ?? 0}</td>
              <td>
                <Button size="sm" variant="ghost" onClick={() => setEditing(team)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => runDelete(team.id, team.name)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Sin equipos" desc="Crealos a mano o aceptá sugerencias de Mantenimiento." />
      )}
      {editing ? <TeamEditModal team={editing} onClose={() => setEditing(null)} /> : null}
    </Section>
  );
}

export default function ProyectosEquipos() {
  const { data, isPending, error, refetch } = useBoardView();

  if (isPending) return <Skeleton lines={8} />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;

  const projectUsage = new Map<string, number>();
  const teamUsage = new Map<string, number>();
  for (const t of data.todos) {
    for (const pid of t.projectIds) projectUsage.set(pid, (projectUsage.get(pid) ?? 0) + 1);
    for (const tid of t.teamIds) teamUsage.set(tid, (teamUsage.get(tid) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="Proyectos y equipos" desc="El catálogo que organiza reuniones, tareas y personas." />
      <CatalogSection
        title="Proyectos"
        desc="Agrupan reuniones y tareas por iniciativa."
        items={data.projects}
        usageLabel="Tareas"
        usage={projectUsage}
        onCreate={(name) => api.createProject(name)}
        onDelete={(id) => api.deleteProject(id)}
        placeholder="Nuevo proyecto…"
      />
      <TeamsSection teams={data.teams} usage={teamUsage} />
    </div>
  );
}
