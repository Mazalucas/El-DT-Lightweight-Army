import type { ThemePreference } from '@shared/types.js';

export const THEME_STORAGE_KEY = 'cerebro-theme';

export type ResolvedTheme = 'dark' | 'light';

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function loadThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'system';
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyTheme(preference);
}

let systemListener: (() => void) | null = null;

export function initTheme(preference?: ThemePreference): ResolvedTheme {
  const pref = preference ?? loadThemePreference();
  const resolved = applyTheme(pref);

  if (systemListener) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', systemListener);
    systemListener = null;
  }

  if (pref === 'system') {
    systemListener = () => {
      if (loadThemePreference() === 'system') applyTheme('system');
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', systemListener);
  }

  return resolved;
}

export function syncThemeFromSettings(serverPreference: ThemePreference | undefined): void {
  if (!serverPreference) return;
  const local = loadThemePreference();
  if (local !== serverPreference) {
    saveThemePreference(serverPreference);
  }
}
