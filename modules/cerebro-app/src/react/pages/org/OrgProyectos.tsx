import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Section,
  Skeleton,
} from '../../ds.js';
import { useOrgBoardView } from '../../hooks.js';
import { useEntityMutation } from '../../lib/entity-action/use-entity-mutation.js';
import { useSettings } from '../../hooks.js';

function CatalogSection({
  title,
  desc,
  items,
  usage,
  onCreate,
  onDelete,
  placeholder,
  orgId,
}: {
  title: string;
  desc: string;
  items: Array<{ id: string; name: string }>;
  usage: Map<string, number>;
  onCreate: (name: string) => Promise<{ project?: { id: string; name: string }; team?: { id: string; name: string } }>;
  onDelete: (id: string) => Promise<unknown>;
  placeholder: string;
  orgId: string;
}) {
  const { enqueue } = useEntityMutation();
  const { data: settings } = useSettings();
  const liveElements = settings?.cerebro?.liveElements === true;
  const [name, setName] = useState('');
  const createKey = `org-catalog-create:${title}:${orgId}`;
  const deleteKeyPrefix = `org-catalog-delete:${title}:${orgId}`;

  const runCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const isProject = title === 'Proyectos';
    const tempId = `optimistic-${Date.now()}`;
    enqueue({
      key: `${createKey}:${trimmed}`,
      orgId,
      catalogBoard: liveElements
        ? isProject
          ? { addProject: { id: tempId, name: trimmed }, orgId }
          : { addTeam: { id: tempId, name: trimmed, emails: [] }, orgId }
        : undefined,
      execute: () => onCreate(trimmed),
      successMessage: 'Creado',
    });
    setName('');
  };

  const runDelete = (id: string, itemName: string) => {
    if (!confirm(`¿Eliminar «${itemName}»?`)) return;
    const isProject = title === 'Proyectos';
    enqueue({
      key: `${deleteKeyPrefix}:${id}`,
      orgId,
      catalogBoard: liveElements
        ? isProject
          ? { removeProjectId: id, orgId }
          : { removeTeamId: id, orgId }
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
        <DataTable headers={['Nombre', 'Tareas', '']}>
          {items.map((item) => (
            <tr key={item.id} data-cerebro-entity={`${title === 'Proyectos' ? 'project' : 'team'}:${item.id}`}>
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
        <EmptyState title={`Sin ${title.toLowerCase()}`} desc="Crealos para organizar el trabajo del equipo." />
      )}
    </Section>
  );
}

export default function OrgProyectos() {
  const { orgId = '' } = useParams();
  const { data, isPending, error, refetch } = useOrgBoardView(orgId);

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
      <PageHeader title="Proyectos y equipos" desc="Catálogo compartido de la organización." />
      <CatalogSection
        title="Proyectos"
        desc="Agrupan reuniones y tareas por iniciativa."
        items={data.projects}
        usage={projectUsage}
        orgId={orgId}
        onCreate={(name) => api.orgCreateProject(orgId, name)}
        onDelete={(id) => api.orgDeleteProject(orgId, id)}
        placeholder="Nuevo proyecto…"
      />
      <CatalogSection
        title="Equipos"
        desc="Agrupan personas y reuniones por equipo."
        items={data.teams}
        usage={teamUsage}
        orgId={orgId}
        onCreate={(name) => api.orgCreateTeam(orgId, name).then((r) => ({ team: r.team }))}
        onDelete={(id) => api.orgDeleteTeam(orgId, id)}
        placeholder="Nuevo equipo…"
      />
    </div>
  );
}
