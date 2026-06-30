import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { MeetingSortKey, MeetingsView } from '@shared/types.js';
import { MEETING_SORT_OPTIONS } from '@shared/recency-sort.js';
import { Badge, Button, DataTable, EmptyState, ErrorState, formatDate, Skeleton } from '../ds.js';

const PAGE_SIZE = 50;
/** Debe coincidir con MEETINGS_VIEW_MAX_LIMIT en functions/domain/views.service.ts */
const MAX_MEETINGS = 500;

export interface MeetingsQueryParams {
  limit?: number;
  offset?: number;
  q?: string;
  projectId?: string;
  teamId?: string;
  sort?: MeetingSortKey;
}

export interface MeetingsQueryResult {
  data: MeetingsView | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
}

function AnalysisBadge({ status }: { status: string }): ReactNode {
  if (status === 'analyzed') return <Badge tone="success">Analizada</Badge>;
  if (status === 'needs_review') return <Badge tone="warn">Revisar</Badge>;
  return <Badge>Pendiente</Badge>;
}

function sortMetaLabel(sort: MeetingSortKey): string {
  return MEETING_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Fecha reunión (más reciente)';
}

function dateColumnHeader(sort: MeetingSortKey): string {
  if (sort === 'synced_desc') return 'Sincronizada ↓';
  if (sort === 'synced_asc') return 'Sincronizada ↑';
  if (sort === 'date_asc') return 'Fecha ↑';
  if (sort === 'title_asc') return 'Fecha';
  return 'Fecha ↓';
}

function meetingDateCell(
  m: MeetingsView['meetings'][number],
  sort: MeetingSortKey,
): ReactNode {
  if (sort === 'synced_desc' || sort === 'synced_asc') {
    return formatDate(m.lastSyncedAt ?? m.displayDate ?? m.startedAt);
  }
  return formatDate(m.displayDate ?? m.startedAt);
}

/**
 * Tabla de reuniones con búsqueda, filtros y carga incremental — compartida entre
 * scope personal y organización (cambia el hook de datos y el linkBase).
 */
export function MeetingsExplorer({
  useMeetings,
  linkBase,
  emptyDesc,
}: {
  useMeetings: (params: MeetingsQueryParams) => MeetingsQueryResult;
  /** Base para links de detalle; sin esto las filas no navegan. */
  linkBase?: string;
  emptyDesc?: string;
}) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [sort, setSort] = useState<MeetingSortKey>('date_desc');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const navigate = useNavigate();

  const { data, isPending, error, refetch } = useMeetings({
    limit: visibleLimit,
    offset: 0,
    sort,
    ...(search ? { q: search } : {}),
    ...(projectId ? { projectId } : {}),
    ...(teamId ? { teamId } : {}),
  });

  const activeSort = data?.sort ?? sort;

  function resetFilters() {
    setVisibleLimit(PAGE_SIZE);
  }

  function applySearch(value: string) {
    setSearch(value);
    resetFilters();
  }

  const total = data?.total ?? 0;
  const shown = data?.meetings.length ?? 0;
  const hasMore = total > 0 ? shown < total : shown >= visibleLimit && shown >= PAGE_SIZE;
  const canLoadAll = hasMore && total > shown && total <= MAX_MEETINGS;

  return (
    <div>
      <div className="toolbar-row">
        <input
          className="field-input"
          type="search"
          placeholder="Buscar por título, persona o email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch(q.trim());
          }}
          aria-label="Buscar reuniones"
        />
        <Button variant="secondary" size="sm" onClick={() => applySearch(q.trim())}>
          Buscar
        </Button>
        <select
          className="field-input field-input--sm"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as MeetingSortKey);
            resetFilters();
          }}
          aria-label="Ordenar reuniones"
        >
          {MEETING_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="field-input field-input--sm"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            resetFilters();
          }}
          aria-label="Filtrar por proyecto"
        >
          <option value="">Todos los proyectos</option>
          {data?.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="field-input field-input--sm"
          value={teamId}
          onChange={(e) => {
            setTeamId(e.target.value);
            resetFilters();
          }}
          aria-label="Filtrar por equipo"
        >
          <option value="">Todos los equipos</option>
          {data?.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {search ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ('');
              applySearch('');
            }}
          >
            Limpiar
          </Button>
        ) : null}
      </div>

      {isPending && !data ? (
        error ? (
          <ErrorState error={error} retry={() => void refetch()} />
        ) : (
          <Skeleton lines={8} />
        )
      ) : !data?.meetings.length ? (
        <EmptyState
          title={search || projectId || teamId ? 'Sin resultados' : 'Sin reuniones'}
          desc={
            search || projectId || teamId
              ? 'Probá con otros filtros.'
              : (emptyDesc ?? 'Conectá Google en Ajustes y sincronizá para indexar tus notas de Meet.')
          }
        />
      ) : (
        <>
          <p className="meta meetings-list-meta">
            {total} reunión{total === 1 ? '' : 'es'} · {sortMetaLabel(activeSort)}
            {shown < total ? ` · mostrando ${shown}` : ''}
          </p>
          <DataTable headers={['Reunión', dateColumnHeader(activeSort), 'Participantes', 'Tareas', 'Análisis']}>
            {data.meetings.map((m) => (
              <tr
                key={m.id}
                style={linkBase ? { cursor: 'pointer' } : undefined}
                onClick={linkBase ? () => navigate(`${linkBase}/${m.id}`) : undefined}
              >
                <td>
                  {linkBase ? (
                    <Link to={`${linkBase}/${m.id}`} className="row-title-link" onClick={(e) => e.stopPropagation()}>
                      {m.title}
                    </Link>
                  ) : (
                    m.title
                  )}
                </td>
                <td className="row-meta">{meetingDateCell(m, activeSort)}</td>
                <td className="row-meta">
                  {m.participants.slice(0, 3).join(', ')}
                  {m.participants.length > 3 ? ` +${m.participants.length - 3}` : ''}
                </td>
                <td className="row-meta">{m.todoCount ? `${m.openTodoCount}/${m.todoCount}` : '—'}</td>
                <td>
                  <AnalysisBadge status={m.analysisStatus} />
                </td>
              </tr>
            ))}
          </DataTable>
          {hasMore ? (
            <div className="pagination-row meetings-pagination">
              <span>
                Mostrando {shown} de {total > 0 ? total : `${shown}+`}
              </span>
              <div className="pagination-actions">
                {canLoadAll ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={isPending}
                    onClick={() => setVisibleLimit(total)}
                  >
                    Ver todas ({total})
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isPending}
                  onClick={() =>
                    setVisibleLimit((prev) => Math.min(prev + PAGE_SIZE, total || prev + PAGE_SIZE, MAX_MEETINGS))
                  }
                >
                  Cargar {Math.min(PAGE_SIZE, (total || shown + PAGE_SIZE) - shown)} más
                </Button>
              </div>
            </div>
          ) : total > PAGE_SIZE ? (
            <p className="meta meetings-list-meta">Mostrando las {total} reuniones.</p>
          ) : null}
        </>
      )}
    </div>
  );
}
