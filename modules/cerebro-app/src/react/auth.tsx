import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { watchAuth } from '../lib/firebase.js';
import { devLog } from '../lib/dev-log.js';

interface AuthState {
  user: User | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });

  useEffect(() => {
    devLog('auth', 'watchAuth: suscribiendo…');
    return watchAuth((user) => {
      devLog('auth', user ? `sesión: ${user.uid}` : 'sin sesión', { email: user?.email ?? null });
      setState({ user, ready: true });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
