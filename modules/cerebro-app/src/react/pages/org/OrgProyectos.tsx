import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api.js';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Section,
  Skeleton,
  toast,
} from '../../ds.js';
import { useInvalidateViews, useOrgBoardView } from '../../hooks.js';

function CatalogSection({
  title,
  desc,
  items,
  usage,
  onCreate,
  onDelete,
  placeholder,
}: {
  title: string;
  desc: string;
  items: Array<{ id: string; name: string }>;
  usage: Map<string, number>;
  onCreate: (name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  placeholder: string;
}) {
  const invalidate = useInvalidateViews();
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () => onCreate(name.trim()),
    onSuccess: () => {
      invalidate();
      setName('');
      toast('Creado');
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => onDelete(id),
    onSuccess: invalidate,
    onError: (e) => toast(e instanceof Error ? e.message : 'Error', 'error'),
  });

  return (
    <Section title={title} desc={desc}>
      <div className="toolbar-row">
        <input
          className="field-input"
          value={name}
          placeholder={placeholder}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) create.mutate();
          }}
        />
        <Button size="sm" disabled={!name.trim()} loading={create.isPending} onClick={() => create.mutate()}>
          Crear
        </Button>
      </div>
      {items.length ? (
        <DataTable headers={['Nombre', 'Tareas', '']}>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td className="row-meta">{usage.get(item.id) ?? 0}</td>
              <td>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm(`¿Eliminar «${item.name}»?`)) remove.mutate(item.id);
                  }}
                >
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
        onCreate={(name) => api.orgCreateProject(orgId, name)}
        onDelete={(id) => api.orgDeleteProject(orgId, id)}
        placeholder="Nuevo proyecto…"
      />
      <CatalogSection
        title="Equipos"
        desc="Agrupan personas y reuniones por equipo."
        items={data.teams}
        usage={teamUsage}
        onCreate={(name) => api.orgCreateTeam(orgId, name)}
        onDelete={(id) => api.orgDeleteTeam(orgId, id)}
        placeholder="Nuevo equipo…"
      />
    </div>
  );
}
