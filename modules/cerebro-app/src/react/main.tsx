import '../styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { initTheme, loadThemePreference } from '../lib/theme.js';
import { AuthProvider } from './auth.js';
import { router } from './router.js';

initTheme(loadThemePreference());

sessionStorage.removeItem('cerebro-chunk-reload');

/** Tras deploy, recargar si la versión server ≠ bundle cacheado en sesión (solo prod). */
if (!import.meta.env.DEV) {
  void fetch('/api/health')
    .then((r) => r.json())
    .then((h: { version?: string }) => {
      if (!h?.version) return;
      const key = 'cerebro-app-version';
      const prev = sessionStorage.getItem(key);
      if (prev && prev !== h.version) {
        sessionStorage.setItem(key, h.version);
        window.location.reload();
        return;
      }
      sessionStorage.setItem(key, h.version);
    })
    .catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason ?? '');
  if (!msg.includes('Failed to fetch dynamically imported module')) return;
  const key = 'cerebro-chunk-reload';
  if (sessionStorage.getItem(key)) return;
  event.preventDefault();
  sessionStorage.setItem(key, '1');
  window.location.reload();
});
