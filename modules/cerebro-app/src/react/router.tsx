import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from './auth.js';
import AppShell from './shell/AppShell.js';
import { SyncProvider } from './sync-context.js';
import { CerebroProvider } from './components/cerebro/CerebroProvider.js';
import { EntityActionBusProvider } from './lib/entity-action/EntityActionBus.js';
import { VisibleEntitiesTracker } from './lib/entity-action/use-visible-entities.js';
import { ActionQueueProvider } from './lib/action-queue/ActionQueueProvider.js';

function Splash({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="app-splash" aria-busy="true">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div className="skeleton skeleton-line" style={{ width: 220 }} />
        <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash label="Verificando sesión…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const Login = lazy(() => import('./pages/Login.js'));
const Hoy = lazy(() => import('./pages/Hoy.js'));
const Buscar = lazy(() => import('./pages/Buscar.js'));
const Reuniones = lazy(() => import('./pages/Reuniones.js'));
const ReunionDetalle = lazy(() => import('./pages/ReunionDetalle.js'));
const Tareas = lazy(() => import('./pages/Tareas.js'));
const Personas = lazy(() => import('./pages/Personas.js'));
const ProyectosEquipos = lazy(() => import('./pages/ProyectosEquipos.js'));
const Red = lazy(() => import('./pages/Red.js'));
const Mantenimiento = lazy(() => import('./pages/Mantenimiento.js'));
const CerebroPage = lazy(() => import('./pages/Cerebro.js'));
const Empresa = lazy(() => import('./pages/Empresa.js'));
const Join = lazy(() => import('./pages/Join.js'));
const Ajustes = lazy(() => import('./pages/Ajustes.js'));
const OrgResumen = lazy(() => import('./pages/org/OrgResumen.js'));
const OrgReuniones = lazy(() => import('./pages/org/OrgReuniones.js'));
const OrgReunionDetalle = lazy(() => import('./pages/org/OrgReunionDetalle.js'));
const OrgTareas = lazy(() => import('./pages/org/OrgTareas.js'));
const OrgPersonas = lazy(() => import('./pages/org/OrgPersonas.js'));
const OrgProyectos = lazy(() => import('./pages/org/OrgProyectos.js'));
const OrgRed = lazy(() => import('./pages/org/OrgRed.js'));
const OrgAdmin = lazy(() => import('./pages/org/OrgAdmin.js'));

/** Redirecciones de la IA vieja (#/profesional/...) a la nueva. */
const PROF_TAB_REDIRECTS: Record<string, string> = {
  dashboard: '/',
  tablero: '/tareas',
  inbox: '/tareas',
  tareas: '/tareas',
  reuniones: '/reuniones',
  contactos: '/personas',
  proyectos: '/proyectos',
  equipos: '/proyectos',
  red: '/red',
};

function LegacyProfesionalRedirect() {
  const { tab } = useParams();
  return <Navigate to={PROF_TAB_REDIRECTS[tab ?? 'dashboard'] ?? '/'} replace />;
}

function LegacyMeetingRedirect() {
  const { id } = useParams();
  return <Navigate to={`/reuniones/${id}`} replace />;
}

function LegacySettingsRedirect() {
  const [params] = useSearchParams();
  const section = params.get('section');
  return <Navigate to={section ? `/ajustes?section=${section}` : '/ajustes'} replace />;
}

function RouteError() {
  return (
    <div className="app-splash" style={{ padding: '2rem' }}>
      <p>No se pudo cargar esta pantalla.</p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
        Recargar
      </button>
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <RequireAuth>
      <EntityActionBusProvider>
        <VisibleEntitiesTracker />
        <ActionQueueProvider>
          <SyncProvider>
            <CerebroProvider>
              <AppShell />
            </CerebroProvider>
          </SyncProvider>
        </ActionQueueProvider>
      </EntityActionBusProvider>
    </RequireAuth>
  );
}

export const router = createHashRouter([
  {
    path: '/login',
    element: (
      <Page>
        <Login />
      </Page>
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: <AuthenticatedApp />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Page><Hoy /></Page> },
      { path: 'buscar', element: <Page><Buscar /></Page> },
      { path: 'reuniones', element: <Page><Reuniones /></Page> },
      { path: 'reuniones/:id', element: <Page><ReunionDetalle /></Page> },
      { path: 'tareas', element: <Page><Tareas /></Page> },
      { path: 'personas', element: <Page><Personas /></Page> },
      { path: 'proyectos', element: <Page><ProyectosEquipos /></Page> },
      { path: 'red', element: <Page><Red /></Page> },
      { path: 'mantenimiento', element: <Page><Mantenimiento /></Page> },
      { path: 'cerebro', element: <Page><CerebroPage /></Page> },
      { path: 'asistente', element: <Navigate to="/cerebro" replace /> },
      { path: 'empresa', element: <Page><Empresa /></Page> },
      { path: 'join/:token', element: <Page><Join /></Page> },
      { path: 'ajustes', element: <Page><Ajustes /></Page> },
      {
        path: 'org/:orgId',
        children: [
          { index: true, element: <Page><OrgResumen /></Page> },
          { path: 'reuniones', element: <Page><OrgReuniones /></Page> },
          { path: 'reuniones/:id', element: <Page><OrgReunionDetalle /></Page> },
          { path: 'tareas', element: <Page><OrgTareas /></Page> },
          { path: 'personas', element: <Page><OrgPersonas /></Page> },
          { path: 'proyectos', element: <Page><OrgProyectos /></Page> },
          { path: 'red', element: <Page><OrgRed /></Page> },
          { path: 'admin', element: <Page><OrgAdmin /></Page> },
          { path: 'admin/:adminTab', element: <Page><OrgAdmin /></Page> },
        ],
      },
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: 'profesional', element: <Navigate to="/" replace /> },
      { path: 'profesional/:tab', element: <LegacyProfesionalRedirect /> },
      { path: 'meeting/:id', element: <LegacyMeetingRedirect /> },
      { path: 'assistant', element: <Navigate to="/cerebro" replace /> },
      { path: 'settings', element: <LegacySettingsRedirect /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
