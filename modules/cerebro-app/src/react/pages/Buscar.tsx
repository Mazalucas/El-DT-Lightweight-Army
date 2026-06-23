import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { ErrorState, PageHeader, Section, Skeleton, formatDate } from '../ds.js';
import { useDashboard } from '../hooks.js';

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const dashboard = useDashboard();
  const hasLlm = dashboard.data?.hasLlmKey ?? false;

  useEffect(() => {
    const t = setTimeout(() => {
      const q = input.trim();
      setQuery(q);
      setParams(q ? { q } : {}, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [input, setParams]);

  const { data, isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query, 10),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });

  return (
    <div>
      <PageHeader
        title="Buscar"
        desc={
          hasLlm
            ? 'Búsqueda en todo tu cerebro — incluye el contenido de las notas (semántica).'
            : 'Búsqueda por título, participantes y resumen. Configurá una API key de IA para buscar dentro del contenido.'
        }
      />

      <div className="toolbar-row">
        <input
          className="field-input"
          type="search"
          placeholder="Buscar reuniones, personas, proyectos o temas tratados…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
      </div>

      {query.length < 2 ? (
        <p className="muted">Escribí al menos 2 caracteres.</p>
      ) : isPending ? (
        <Skeleton lines={6} />
      ) : error ? (
        <ErrorState error={error} retry={() => void refetch()} />
      ) : data ? (
        <div style={{ opacity: isFetching ? 0.6 : 1 }}>
          {data.semantic?.length ? (
            <Section
              title="Temas en tus notas"
              desc="Coincidencias semánticas dentro del contenido de las reuniones."
            >
              <ul className="search-hit-list">
                {data.semantic.map((hit) => (
                  <li key={hit.meetingId} className="search-hit">
                    <Link to={`/reuniones/${hit.meetingId}`} className="kpi-link">
                      {hit.title}
                    </Link>{' '}
                    <span className="muted">
                      {hit.startedAt ? `· ${formatDate(hit.startedAt)}` : ''} · afinidad{' '}
                      {Math.round(hit.score * 100)}%
                    </span>
                    <p className="muted search-hit-snippet">…{hit.snippet}…</p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Reuniones" desc="Coincidencias por título, participantes o resumen.">
            {data.meetings.length ? (
              <ul className="hoy-focus-list">
                {data.meetings.map((m) => (
                  <li key={m.id}>
                    <Link to={`/reuniones/${m.id}`} className="kpi-link">
                      {m.title}
                    </Link>{' '}
                    {m.startedAt ? <span className="muted">· {formatDate(m.startedAt)}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Sin coincidencias.</p>
            )}
          </Section>

          <div className="dash-grid">
            <Section title="Personas">
              {data.people.length ? (
                <ul className="hoy-focus-list">
                  {data.people.map((p) => (
                    <li key={p.id}>
                      <Link to={`/personas?q=${encodeURIComponent(p.displayName)}`} className="kpi-link">
                        {p.displayName}
                      </Link>{' '}
                      {p.emails?.length ? <span className="muted">· {p.emails[0]}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Sin coincidencias.</p>
              )}
            </Section>
            <Section title="Proyectos">
              {data.projects.length ? (
                <ul className="hoy-focus-list">
                  {data.projects.map((p) => (
                    <li key={p.id}>
                      <Link to="/proyectos" className="kpi-link">
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Sin coincidencias.</p>
              )}
            </Section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
