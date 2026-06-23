import { createHashRouter, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './auth.js';
import AppShell from './shell/AppShell.js';

function Splash() {
  return (
    <div className="app-splash" aria-busy="true">
      <div className="skeleton skeleton-line" style={{ width: 220 }} />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

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

function lazyPage(loader: () => Promise<{ default: React.ComponentType }>) {
  return async () => ({ Component: (await loader()).default });
}

export const router = createHashRouter([
  {
    path: '/login',
    lazy: lazyPage(() => import('./pages/Login.js')),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/Hoy.js')) },
      { path: 'buscar', lazy: lazyPage(() => import('./pages/Buscar.js')) },
      { path: 'reuniones', lazy: lazyPage(() => import('./pages/Reuniones.js')) },
      { path: 'reuniones/:id', lazy: lazyPage(() => import('./pages/ReunionDetalle.js')) },
      { path: 'tareas', lazy: lazyPage(() => import('./pages/Tareas.js')) },
      { path: 'personas', lazy: lazyPage(() => import('./pages/Personas.js')) },
      { path: 'proyectos', lazy: lazyPage(() => import('./pages/ProyectosEquipos.js')) },
      { path: 'red', lazy: lazyPage(() => import('./pages/Red.js')) },
      { path: 'mantenimiento', lazy: lazyPage(() => import('./pages/Mantenimiento.js')) },
      { path: 'asistente', lazy: lazyPage(() => import('./pages/Asistente.js')) },
      { path: 'facturas', lazy: lazyPage(() => import('./pages/Facturas.js')) },
      { path: 'empresa', lazy: lazyPage(() => import('./pages/Empresa.js')) },
      { path: 'join/:token', lazy: lazyPage(() => import('./pages/Join.js')) },
      { path: 'ajustes', lazy: lazyPage(() => import('./pages/Ajustes.js')) },
      {
        path: 'org/:orgId',
        children: [
          { index: true, lazy: lazyPage(() => import('./pages/org/OrgResumen.js')) },
          { path: 'reuniones', lazy: lazyPage(() => import('./pages/org/OrgReuniones.js')) },
          { path: 'reuniones/:id', lazy: lazyPage(() => import('./pages/org/OrgReunionDetalle.js')) },
          { path: 'tareas', lazy: lazyPage(() => import('./pages/org/OrgTareas.js')) },
          { path: 'personas', lazy: lazyPage(() => import('./pages/org/OrgPersonas.js')) },
          { path: 'proyectos', lazy: lazyPage(() => import('./pages/org/OrgProyectos.js')) },
          { path: 'red', lazy: lazyPage(() => import('./pages/org/OrgRed.js')) },
          { path: 'admin', lazy: lazyPage(() => import('./pages/org/OrgAdmin.js')) },
          { path: 'admin/:adminTab', lazy: lazyPage(() => import('./pages/org/OrgAdmin.js')) },
        ],
      },
      // --- Rutas legacy → nueva arquitectura ---
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: 'profesional', element: <Navigate to="/" replace /> },
      { path: 'profesional/:tab', element: <LegacyProfesionalRedirect /> },
      { path: 'meeting/:id', element: <LegacyMeetingRedirect /> },
      { path: 'assistant', element: <Navigate to="/asistente" replace /> },
      { path: 'settings', element: <LegacySettingsRedirect /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
