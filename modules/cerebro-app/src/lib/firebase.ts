import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import { devLog } from './dev-log.js';

const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(config);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

if (useEmulators) {
  const key = '__cerebroAuthEmulatorConnected';
  const g = globalThis as unknown as Record<string, boolean>;
  if (!g[key]) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    g[key] = true;
    devLog('auth', 'Auth emulator conectado en :9099');
  }
}

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/** Login rápido contra Auth emulator (email/password). */
export async function loginDev(): Promise<User> {
  const email = 'dev@cerebro.local';
  const password = 'devpass123';
  devLog('auth', 'loginDev: iniciando…');
  try {
    const user = (await signInWithEmailAndPassword(auth, email, password)).user;
    devLog('auth', 'loginDev: sign-in OK', { uid: user.uid });
    return user;
  } catch {
    const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
    devLog('auth', 'loginDev: usuario creado', { uid: user.uid });
    return user;
  }
}

export function isDevEmulatorMode(): boolean {
  return useEmulators;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
