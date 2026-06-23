import type { UserAppSettings } from '../shared/types.js';

export function isSetupComplete(settings: UserAppSettings, googleConnected: boolean): boolean {
  if (!googleConnected) return false;
  return settings.meetSources.length > 0;
}
