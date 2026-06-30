import crypto from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { v4 as uuidv4 } from 'uuid';
import type {
  CerebroStore,
  OrgBranding,
  OrgInvite,
  OrgJoinPolicy,
  OrgJoinRequest,
  OrgMember,
  OrgRole,
  Organization,
  UserMembership,
} from '../shared/types.js';
import {
  membershipRef,
  membershipsCol,
  orgInvitesCol,
  orgJoinRequestsCol,
  orgMemberRef,
  orgMembersCol,
  orgRef,
  orgStoreRef,
  db,
} from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { mergeDismissedMaintenanceMeta } from '../core/profesional/prospect-dismiss.js';
import { rebuildGraphEdges } from './graph-edges.js';
import { loadStore } from './store.js';
import { hydrateCerebroStore, persistCerebroStore } from './store-persist.js';
import { mergeMemberStoreIntoOrg } from './org-federated.js';

const INVITE_TTL_DAYS = 14;

function slugifyOrg(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function hashToken(token: string): string {
  const pepper = process.env.INVITE_TOKEN_PEPPER ?? 'dev-pepper-change-in-prod';
  return crypto.createHash('sha256').update(`${pepper}:${token}`).digest('hex');
}

async function getUserEmail(uid: string): Promise<string> {
  const user = await getAuth().getUser(uid);
  return (user.email ?? '').toLowerCase();
}

function emailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export async function requireOrgMember(orgId: string, uid: string): Promise<OrgMember> {
  return requireOrgRole(orgId, uid, ['org_owner', 'org_admin', 'org_member']);
}

async function syncClaims(uid: string): Promise<void> {
  const snap = await membershipsCol(uid).get();
  const orgs: Record<string, OrgRole> = {};
  for (const doc of snap.docs) {
    const data = doc.data() as { role: OrgRole };
    orgs[doc.id] = data.role;
  }
  await getAuth().setCustomUserClaims(uid, { orgs });
}

export async function createOrganization(
  uid: string,
  input: { name: string; slug?: string; domains?: string[] },
): Promise<{ org: Organization; member: OrgMember }> {
  const name = input.name.trim();
  if (!name) throw new Error('Nombre de empresa requerido');
  const slug = slugifyOrg(input.slug?.trim() || name);
  if (!slug) throw new Error('Slug inválido');

  const existing = await orgRef(slug).get();
  if (existing.exists) throw new Error('Ya existe una empresa con ese identificador');

  const email = await getUserEmail(uid);
  const now = new Date().toISOString();
  const org: Organization = {
    id: slug,
    name,
    slug,
    domains: (input.domains ?? []).map((d) => d.toLowerCase().trim()).filter(Boolean),
    joinPolicy: 'invite_only',
    plan: 'free',
    createdAt: now,
    createdBy: uid,
  };

  const member: OrgMember = {
    uid,
    email,
    role: 'org_owner',
    status: 'active',
    joinedAt: now,
  };

  const emptyStore: CerebroStore = {
    version: 1,
    savedAt: now,
    meetings: [],
    people: [],
    prospects: [],
    projects: [],
    teams: [],
    todos: [],
  };

  await orgRef(slug).set(stripUndefined(org));
  await orgMemberRef(slug, uid).set(stripUndefined(member));
  await orgStoreRef(slug).set(emptyStore);
  await membershipRef(uid, slug).set({ orgId: slug, orgName: name, role: 'org_owner' });
  await syncClaims(uid);

  return { org, member };
}

export async function listUserMemberships(uid: string): Promise<UserMembership[]> {
  const snap = await membershipsCol(uid).get();
  return snap.docs.map((d) => {
    const data = d.data() as UserMembership;
    return { orgId: d.id, orgName: data.orgName, role: data.role };
  });
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await orgRef(orgId).get();
  return snap.exists ? (snap.data() as Organization) : null;
}

export async function requireOrgRole(orgId: string, uid: string, roles: OrgRole[]): Promise<OrgMember> {
  const snap = await orgMemberRef(orgId, uid).get();
  if (!snap.exists) throw new Error('No sos miembro de esta empresa');
  const member = snap.data() as OrgMember;
  if (member.status !== 'active') throw new Error('Membresía inactiva');
  if (!roles.includes(member.role)) throw new Error('Permiso insuficiente');
  return member;
}

async function loadOrgStoreOverlay(orgId: string): Promise<CerebroStore> {
  const snap = await orgStoreRef(orgId).get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    return {
      version: 1,
      savedAt: now,
      meetings: [],
      people: [],
      prospects: [],
      projects: [],
      teams: [],
      todos: [],
      pendingSuggestions: [],
      graphEdges: [],
    };
  }
  const store = await hydrateCerebroStore(snap.data() as CerebroStore, { orgId });
  if (!store.pendingSuggestions) store.pendingSuggestions = [];
  return store;
}

/** Vista federada: overlay org + stores personales de miembros activos (sin copiar a disco). */
export async function loadOrgStore(orgId: string, uid?: string): Promise<CerebroStore> {
  if (uid) await requireOrgMember(orgId, uid);
  const overlay = await loadOrgStoreOverlay(orgId);
  const members = await listOrgMembers(orgId);
  for (const member of members) {
    const personal = await loadStore(member.uid);
    mergeDismissedMaintenanceMeta(overlay, personal);
    mergeMemberStoreIntoOrg(overlay, personal, member.uid);
  }
  overlay.graphEdges = rebuildGraphEdges(overlay, { includeMembers: true, members });
  return overlay;
}

export async function saveOrgStore(orgId: string, store: CerebroStore): Promise<void> {
  store.savedAt = new Date().toISOString();
  await persistCerebroStore(orgStoreRef(orgId), store, { orgId });
}

export async function ingestMemberStoreToOrg(
  uid: string,
  orgId: string,
): Promise<{ merged: number; federated: boolean }> {
  await requireOrgRole(orgId, uid, ['org_owner', 'org_admin', 'org_member']);
  const personal = await loadStore(uid);
  await orgMemberRef(orgId, uid).set({ lastSyncAt: new Date().toISOString() }, { merge: true });
  return { merged: personal.meetings.length, federated: true };
}

export async function listOrgMembers(orgId: string): Promise<OrgMember[]> {
  const snap = await orgMembersCol(orgId).where('status', '==', 'active').get();
  return snap.docs.map((d) => d.data() as OrgMember);
}

export async function createOrgInvite(
  uid: string,
  orgId: string,
  email: string,
  role: OrgRole = 'org_member',
): Promise<{ invite: OrgInvite; token: string; joinUrl: string }> {
  await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
  const normalized = email.toLowerCase().trim();
  if (!normalized.includes('@')) throw new Error('Email inválido');
  if (role === 'org_owner') throw new Error('No podés invitar como owner');

  const token = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 86400000).toISOString();
  const invite: OrgInvite = {
    id: uuidv4(),
    email: normalized,
    role,
    status: 'pending',
    invitedBy: uid,
    createdAt: now.toISOString(),
    expiresAt,
  };

  await orgInvitesCol(orgId).doc(invite.id).set({
    ...invite,
    tokenHash: hashToken(token),
  });

  const appUrl = process.env.APP_URL ?? 'http://localhost:5190';
  const joinUrl = `${appUrl}/#/join/${token}`;

  await sendInviteEmail(normalized, joinUrl, orgId).catch((e) => {
    console.warn('invite email failed', e);
  });

  return { invite, token, joinUrl };
}

async function sendInviteEmail(to: string, joinUrl: string, orgId: string): Promise<void> {
  const apiKey = process.env.MAIL_API_KEY;
  if (!apiKey) {
    console.log(`[invite] ${to} → ${joinUrl} (org: ${orgId})`);
    return;
  }
  const from = process.env.MAIL_FROM ?? 'noreply@cerebro.app';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Invitación a Cerebro',
      html: `<p>Te invitaron a unirte a una empresa en Cerebro.</p><p><a href="${joinUrl}">Aceptar invitación</a></p>`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

export async function acceptOrgInvite(uid: string, token: string): Promise<{ orgId: string; role: OrgRole }> {
  const tokenHash = hashToken(token);
  const orgsSnap = await db.collection('orgs').get();
  let foundOrgId: string | null = null;
  let inviteId: string | null = null;
  let inviteDoc: OrgInvite | null = null;

  for (const orgDoc of orgsSnap.docs) {
    const invites = await orgInvitesCol(orgDoc.id).where('tokenHash', '==', tokenHash).limit(1).get();
    if (!invites.empty) {
      foundOrgId = orgDoc.id;
      inviteId = invites.docs[0]!.id;
      const data = invites.docs[0]!.data();
      inviteDoc = {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        invitedBy: data.invitedBy,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      };
      break;
    }
  }

  if (!foundOrgId || !inviteDoc || !inviteId) throw new Error('Invitación inválida o expirada');
  if (inviteDoc.status !== 'pending') throw new Error('Invitación ya utilizada');
  if (new Date(inviteDoc.expiresAt).getTime() < Date.now()) throw new Error('Invitación expirada');

  const userEmail = await getUserEmail(uid);
  if (userEmail && userEmail !== inviteDoc.email) {
    throw new Error(`Esta invitación es para ${inviteDoc.email}`);
  }

  const org = await getOrganization(foundOrgId);
  if (!org) throw new Error('Empresa no encontrada');

  const now = new Date().toISOString();
  const member: OrgMember = {
    uid,
    email: inviteDoc.email,
    role: inviteDoc.role,
    status: 'active',
    joinedAt: now,
    invitedVia: inviteDoc.id,
  };

  await orgMemberRef(foundOrgId, uid).set(stripUndefined(member));
  await membershipRef(uid, foundOrgId).set({ orgId: foundOrgId, orgName: org.name, role: inviteDoc.role });
  await orgInvitesCol(foundOrgId).doc(inviteId).set({ status: 'accepted' }, { merge: true });
  await syncClaims(uid);

  return { orgId: foundOrgId, role: inviteDoc.role };
}

export async function listPendingInvites(orgId: string, uid: string): Promise<OrgInvite[]> {
  await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
  const snap = await orgInvitesCol(orgId).where('status', '==', 'pending').get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      status: data.status,
      invitedBy: data.invitedBy,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
    } as OrgInvite;
  });
}

export async function updateOrganization(
  uid: string,
  orgId: string,
  patch: { name?: string; domains?: string[]; joinPolicy?: OrgJoinPolicy; branding?: OrgBranding | Record<string, never> },
): Promise<Organization> {
  await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
  const snap = await orgRef(orgId).get();
  if (!snap.exists) throw new Error('Empresa no encontrada');
  const org = snap.data() as Organization;
  const nextBranding =
    patch.branding !== undefined
      ? Object.keys(patch.branding).length === 0
        ? undefined
        : (() => {
            const merged = { ...(org.branding ?? {}), ...patch.branding };
            for (const key of Object.keys(merged) as (keyof OrgBranding)[]) {
              if (merged[key] === undefined) delete merged[key];
            }
            return Object.keys(merged).length ? merged : undefined;
          })()
      : org.branding;
  const next: Organization = {
    ...org,
    name: patch.name?.trim() || org.name,
    domains: patch.domains
      ? patch.domains.map((d) => d.toLowerCase().trim()).filter(Boolean)
      : org.domains,
    joinPolicy: patch.joinPolicy ?? org.joinPolicy,
    branding: nextBranding,
  };
  if (!next.branding) delete next.branding;
  await orgRef(orgId).set(stripUndefined(next));
  if (next.name !== org.name) {
    const members = await orgMembersCol(orgId).get();
    for (const doc of members.docs) {
      const member = doc.data() as OrgMember;
      await membershipRef(member.uid, orgId).set({ orgId, orgName: next.name, role: member.role }, { merge: true });
    }
  }
  return next;
}

export async function listOrgsMatchingUserDomain(uid: string): Promise<Organization[]> {
  const email = await getUserEmail(uid);
  const domain = emailDomain(email);
  if (!domain) return [];
  const memberships = await listUserMemberships(uid);
  const memberIds = new Set(memberships.map((m) => m.orgId));
  const snap = await db.collection('orgs').get();
  return snap.docs
    .map((d) => d.data() as Organization)
    .filter(
      (o) =>
        !memberIds.has(o.id) &&
        o.domains.includes(domain) &&
        (o.joinPolicy === 'domain_request' || o.joinPolicy === 'domain_auto'),
    );
}

export async function requestOrgJoin(uid: string, orgId: string): Promise<{ status: 'joined' | 'pending'; orgId: string }> {
  const org = await getOrganization(orgId);
  if (!org) throw new Error('Empresa no encontrada');
  if (org.joinPolicy === 'invite_only') throw new Error('Esta empresa solo admite invitaciones por email');

  const email = await getUserEmail(uid);
  if (!email) throw new Error('Tu cuenta debe tener email verificado');
  const domain = emailDomain(email);
  if (!org.domains.includes(domain)) {
    throw new Error(`Tu dominio (@${domain}) no está autorizado. Pedí al admin que lo añada.`);
  }

  const existing = await orgMemberRef(orgId, uid).get();
  if (existing.exists && (existing.data() as OrgMember).status === 'active') {
    return { status: 'joined', orgId };
  }

  if (org.joinPolicy === 'domain_auto') {
    const now = new Date().toISOString();
    const member: OrgMember = {
      uid,
      email,
      role: 'org_member',
      status: 'active',
      joinedAt: now,
    };
    await orgMemberRef(orgId, uid).set(stripUndefined(member));
    await membershipRef(uid, orgId).set({ orgId, orgName: org.name, role: 'org_member' });
    await syncClaims(uid);
    return { status: 'joined', orgId };
  }

  const pending = await orgJoinRequestsCol(orgId).where('uid', '==', uid).where('status', '==', 'pending').limit(1).get();
  if (!pending.empty) return { status: 'pending', orgId };

  const now = new Date().toISOString();
  const request: OrgJoinRequest = {
    id: uuidv4(),
    uid,
    email,
    status: 'pending',
    createdAt: now,
  };
  await orgJoinRequestsCol(orgId).doc(request.id).set(stripUndefined(request));
  return { status: 'pending', orgId };
}

export async function listJoinRequests(orgId: string, uid: string): Promise<OrgJoinRequest[]> {
  await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
  const snap = await orgJoinRequestsCol(orgId).where('status', '==', 'pending').get();
  return snap.docs.map((d) => d.data() as OrgJoinRequest);
}

export async function reviewJoinRequest(
  adminUid: string,
  orgId: string,
  requestId: string,
  approve: boolean,
): Promise<void> {
  await requireOrgRole(orgId, adminUid, ['org_owner', 'org_admin']);
  const ref = orgJoinRequestsCol(orgId).doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Solicitud no encontrada');
  const request = snap.data() as OrgJoinRequest;
  if (request.status !== 'pending') throw new Error('Solicitud ya procesada');

  const now = new Date().toISOString();
  if (!approve) {
    await ref.set({ status: 'rejected', reviewedBy: adminUid, reviewedAt: now }, { merge: true });
    return;
  }

  const org = await getOrganization(orgId);
  if (!org) throw new Error('Empresa no encontrada');

  const member: OrgMember = {
    uid: request.uid,
    email: request.email,
    role: 'org_member',
    status: 'active',
    joinedAt: now,
  };
  await orgMemberRef(orgId, request.uid).set(stripUndefined(member));
  await membershipRef(request.uid, orgId).set({ orgId, orgName: org.name, role: 'org_member' });
  await ref.set({ status: 'approved', reviewedBy: adminUid, reviewedAt: now }, { merge: true });
  await syncClaims(request.uid);
}
