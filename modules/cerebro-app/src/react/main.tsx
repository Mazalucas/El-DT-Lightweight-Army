import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/responsive.css';
import '../styles/react.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { initTheme, loadThemePreference } from '../lib/theme.js';
import { AuthProvider } from './auth.js';
import { router } from './router.js';

initTheme(loadThemePreference());

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
