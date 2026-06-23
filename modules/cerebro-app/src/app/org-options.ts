import { api } from '../lib/api.js';
import type { OrgOption } from './workspace-ui.js';

/** Carga todas las empresas del usuario con nombre para el selector de contexto. */
export async function loadUserOrgOptions(): Promise<OrgOption[]> {
  const { memberships } = await api.listOrgs();
  if (!memberships.length) return [];

  const orgs = await Promise.all(
    memberships.map(async (m) => {
      try {
        const { org } = await api.getOrg(m.orgId);
        return { id: m.orgId, name: org.branding?.displayName ?? org.name };
      } catch {
        return { id: m.orgId, name: m.orgId };
      }
    }),
  );
  return orgs.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
