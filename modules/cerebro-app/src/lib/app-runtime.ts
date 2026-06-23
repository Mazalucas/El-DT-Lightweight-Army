import type { Organization, OrgRole } from '@shared/types.js';
import { api } from './api.js';
import { membershipRoleForOrg } from './nav-config.js';
import { applyOrgBranding, clearOrgBranding } from './org-branding.js';
import type { Route } from './router.js';

export type OrgContextCache = {
  orgId: string;
  org: Organization;
  membershipRole?: OrgRole;
};

let layoutEl: HTMLElement | null = null;
let contentViewEl: HTMLElement | null = null;
let contentInnerEl: HTMLElement | null = null;
let orgCache: OrgContextCache | null = null;
let renderGeneration = 0;
let lastBrandedOrgId: string | null = null;

export function nextRenderGeneration(): number {
  renderGeneration += 1;
  return renderGeneration;
}

export function isRenderCurrent(gen: number): boolean {
  return gen === renderGeneration;
}

export function getContentInner(): HTMLElement | null {
  return contentInnerEl;
}

export function getContentView(): HTMLElement | null {
  return contentViewEl;
}

export function getLayout(): HTMLElement | null {
  return layoutEl;
}

export function setShellNodes(layout: HTMLElement, contentView: HTMLElement, contentInner: HTMLElement): void {
  layoutEl = layout;
  contentViewEl = contentView;
  contentInnerEl = contentInner;
}

export function teardownShell(): void {
  layoutEl = null;
  contentViewEl = null;
  contentInnerEl = null;
  orgCache = null;
  lastBrandedOrgId = null;
  clearOrgBranding();
}

export async function resolveOrgContext(
  route: Route,
  orgId: string | undefined,
): Promise<{ org: Organization | null; membershipRole?: OrgRole }> {
  if (!orgId || (route !== 'org' && route !== 'org-admin')) {
    if (lastBrandedOrgId) {
      clearOrgBranding();
      lastBrandedOrgId = null;
    }
    return { org: null };
  }

  if (orgCache?.orgId === orgId) {
    applyOrgBranding(orgCache.org);
    lastBrandedOrgId = orgId;
    return { org: orgCache.org, membershipRole: orgCache.membershipRole };
  }

  try {
    const [{ org }, { memberships }] = await Promise.all([api.getOrg(orgId), api.listOrgs()]);
    orgCache = { orgId, org, membershipRole: membershipRoleForOrg(memberships, orgId) };
    applyOrgBranding(org);
    lastBrandedOrgId = orgId;
    return orgCache;
  } catch {
    orgCache = null;
    clearOrgBranding();
    lastBrandedOrgId = null;
    return { org: null };
  }
}

export function invalidateOrgCache(orgId?: string): void {
  if (!orgId || orgCache?.orgId === orgId) orgCache = null;
}
