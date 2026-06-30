import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid, getUserEmail } from '../lib/auth-middleware.js';
import type { OrgJoinPolicy, OrgRole, OrgBranding } from '../shared/types.js';
import {
  acceptOrgInvite,
  createOrgInvite,
  createOrganization,
  getOrganization,
  ingestMemberStoreToOrg,
  listJoinRequests,
  listOrgMembers,
  listOrgsMatchingUserDomain,
  listPendingInvites,
  listUserMemberships,
  loadOrgStore,
  requestOrgJoin,
  requireOrgMember,
  reviewJoinRequest,
  saveOrgStore,
  updateOrganization,
} from '../services/org.js';
import { uploadOrgLogo } from '../services/org-branding.js';
import {
  acceptTodosBatchForOrg,
  completeTodosBatchForOrg,
  createProjectForOrg,
  createTeamForOrg,
  createTodoForOrg,
  deleteProjectForOrg,
  deleteTeamForOrg,
  dismissTodosBatchForOrg,
  dismissProspectForOrg,
  dismissMergeContactForOrg,
  restoreProspectDismissForOrg,
  getBoardSnapshotForOrg,
  linkProspectToContactForOrg,
  mergePersonsIntoCanonicalForOrg,
  moveTodoForOrg,
  promoteProspectToContactForOrg,
  reopenTodosBatchForOrg,
  updatePersonForOrg,
  updateTodoForOrg,
} from '../services/org-catalog.js';
import type { CreateTodoInput, MoveTodoInput, UpdateTodoInput } from '../shared/types.js';
import { buildGraphFromStore, buildSuggestionsFromStore } from '../services/suggestions-graph.js';
import {
  buildBoardViewFromStore,
  buildMaintenanceViewFromStore,
  buildMeetingDetailViewFromStore,
  buildMeetingsViewFromStore,
  buildPeopleViewFromStore,
} from '../domain/views.service.js';
import { computeStoreHealth } from '../services/store-health.js';
import { rankProspectLinkCandidates } from '../services/prospect-matching.js';
import {
  acceptProjectSuggestionForOrg,
  acceptTeamSuggestionForOrg,
  dismissSuggestionForOrg,
} from '../services/org-catalog.js';

export const orgRouter = Router();

orgRouter.get('/', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const memberships = await listUserMemberships(uid);
    res.json({ memberships });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/match-domain', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const orgs = await listOrgsMatchingUserDomain(uid);
    res.json({ orgs });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name, slug, domains } = req.body as { name?: string; slug?: string; domains?: string[] };
    const result = await createOrganization(uid, { name: name ?? '', slug, domains });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/join/:token', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await acceptOrgInvite(uid, req.params.token!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/join-request', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await requestOrgJoin(uid, req.params.orgId!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.patch('/:orgId', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name, domains, joinPolicy, branding } = req.body as {
      name?: string;
      domains?: string[];
      joinPolicy?: OrgJoinPolicy;
      branding?: OrgBranding;
    };
    const org = await updateOrganization(uid, req.params.orgId!, { name, domains, joinPolicy, branding });
    res.json({ org });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/branding/logo', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { dataBase64, mimeType, fileName } = req.body as {
      dataBase64?: string;
      mimeType?: string;
      fileName?: string;
    };
    const result = await uploadOrgLogo(uid, req.params.orgId!, dataBase64 ?? '', mimeType ?? '', fileName ?? 'logo');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/join-requests', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const requests = await listJoinRequests(req.params.orgId!, uid);
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/join-requests/:requestId/approve', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await reviewJoinRequest(uid, req.params.orgId!, req.params.requestId!, true);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/join-requests/:requestId/reject', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await reviewJoinRequest(uid, req.params.orgId!, req.params.requestId!, false);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/people/merge', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { canonicalId, mergeIds } = req.body as { canonicalId?: string; mergeIds?: string[] };
    const result = await mergePersonsIntoCanonicalForOrg(req.params.orgId!, uid, canonicalId ?? '', mergeIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/prospects/:id/promote', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { email, displayName, aliases, teamIds, projectIds } = req.body as {
      email?: string;
      displayName?: string;
      aliases?: string[];
      teamIds?: string[];
      projectIds?: string[];
    };
    const result = await promoteProspectToContactForOrg(
      req.params.orgId!,
      uid,
      req.params.id!,
      email ?? '',
      displayName,
      { aliases, teamIds, projectIds },
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/prospects/:id/link', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { personId, aliases, teamIds, projectIds } = req.body as {
      personId?: string;
      aliases?: string[];
      teamIds?: string[];
      projectIds?: string[];
    };
    const store = await linkProspectToContactForOrg(
      req.params.orgId!,
      uid,
      req.params.id!,
      personId ?? '',
      { aliases, teamIds, projectIds },
    );
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/prospects/:id/dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await dismissProspectForOrg(req.params.orgId!, uid, req.params.id!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/prospects/restore-dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { snapshot } = req.body as { snapshot?: import('../shared/types.js').ProspectDismissUndoSnapshot };
    if (!snapshot?.prospectId) {
      res.status(400).json({ error: 'snapshot requerido' });
      return;
    }
    const store = await restoreProspectDismissForOrg(req.params.orgId!, uid, snapshot);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/maintenance/dismiss-merge', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { suggestionId } = req.body as { suggestionId?: string };
    const store = await dismissMergeContactForOrg(req.params.orgId!, uid, suggestionId ?? '');
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.patch('/:orgId/catalog/people/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await updatePersonForOrg(req.params.orgId!, uid, req.params.id!, req.body);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/catalog/board', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const board = await getBoardSnapshotForOrg(req.params.orgId!, uid);
    res.json({ board });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await createTodoForOrg(req.params.orgId!, uid, req.body as CreateTodoInput);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.patch('/:orgId/catalog/todos/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await updateTodoForOrg(req.params.orgId!, uid, req.params.id!, req.body as UpdateTodoInput);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos/:id/move', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await moveTodoForOrg(req.params.orgId!, uid, req.params.id!, req.body as MoveTodoInput);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos/complete-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await completeTodosBatchForOrg(req.params.orgId!, uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos/reopen-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await reopenTodosBatchForOrg(req.params.orgId!, uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos/accept-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await acceptTodosBatchForOrg(req.params.orgId!, uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/todos/dismiss-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await dismissTodosBatchForOrg(req.params.orgId!, uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/teams', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name } = req.body as { name?: string };
    const result = await createTeamForOrg(req.params.orgId!, uid, name ?? '');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.delete('/:orgId/catalog/teams/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await deleteTeamForOrg(req.params.orgId!, uid, req.params.id!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/catalog/projects', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name } = req.body as { name?: string };
    const result = await createProjectForOrg(req.params.orgId!, uid, name ?? '');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.delete('/:orgId/catalog/projects/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await deleteProjectForOrg(req.params.orgId!, uid, req.params.id!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/health', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    const members = await listOrgMembers(req.params.orgId!);
    const health = computeStoreHealth(store);
    const lastSyncs = members.map((m) => (m.lastSyncAt ? new Date(m.lastSyncAt).getTime() : 0));
    const orgSaved = new Date(store.savedAt).getTime();
    if (lastSyncs.length) {
      health.orgIngestLagMs = Math.max(0, Math.max(...lastSyncs) - orgSaved);
    }
    res.json({ health });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/suggestions', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    res.json({ suggestions: buildSuggestionsFromStore(store) });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/suggestions/:id/dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await dismissSuggestionForOrg(req.params.orgId!, uid, req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/suggestions/:id/accept-project', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { existingProjectId, projectName } = req.body as {
      existingProjectId?: string;
      projectName?: string;
    };
    const store = await acceptProjectSuggestionForOrg(req.params.orgId!, uid, req.params.id!, {
      existingProjectId,
      projectName,
    });
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/suggestions/:id/accept-team', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await acceptTeamSuggestionForOrg(req.params.orgId!, uid, req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/prospects/:id/candidates', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    res.json({ candidates: rankProspectLinkCandidates(store, req.params.id!) });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/graph', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    const members = await listOrgMembers(req.params.orgId!);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const center = typeof req.query.center === 'string' ? req.query.center : undefined;
    const depth = req.query.depth ? Number(req.query.depth) : undefined;
    const types = typeof req.query.types === 'string' ? req.query.types.split(',') : undefined;
    const memberUid = typeof req.query.memberUid === 'string' ? req.query.memberUid : undefined;
    const filteredMembers = memberUid ? members.filter((m) => m.uid === memberUid) : members;
    res.json({
      graph: buildGraphFromStore(store, {
        limit,
        center,
        depth,
        types,
        members: filteredMembers,
        memberUid: memberUid ?? uid,
        userEmail: await getUserEmail(uid),
      }),
    });
  } catch (e) {
    next(e);
  }
});

// --- Vistas por pantalla (mismos DTOs que /api/views, sobre el store de la org) ---

orgRouter.get('/:orgId/views/meetings', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    const view = buildMeetingsViewFromStore(store, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      projectId: typeof req.query.projectId === 'string' ? req.query.projectId : undefined,
      teamId: typeof req.query.teamId === 'string' ? req.query.teamId : undefined,
      sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
    });
    res.json(view);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/views/meetings/:meetingId', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    const view = buildMeetingDetailViewFromStore(store, req.params.meetingId!);
    if (!view) {
      res.status(404).json({ error: 'meeting_not_found' });
      return;
    }
    res.json(view);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/views/people', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    res.json(
      buildPeopleViewFromStore(store, {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
      }),
    );
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/views/board', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    res.json(buildBoardViewFromStore(store));
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/views/maintenance', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const store = await loadOrgStore(req.params.orgId!);
    res.json(buildMaintenanceViewFromStore(store));
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const org = await getOrganization(req.params.orgId!);
    if (!org) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ org });
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/store', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await loadOrgStore(req.params.orgId!, uid);
    res.json(store);
  } catch (e) {
    next(e);
  }
});

orgRouter.put('/:orgId/store', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    await saveOrgStore(req.params.orgId!, req.body);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/ingest', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await ingestMemberStoreToOrg(uid, req.params.orgId!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/members', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    await requireOrgMember(req.params.orgId!, uid);
    const members = await listOrgMembers(req.params.orgId!);
    res.json({ members });
  } catch (e) {
    next(e);
  }
});

orgRouter.post('/:orgId/invites', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { email, role } = req.body as { email?: string; role?: OrgRole };
    const result = await createOrgInvite(uid, req.params.orgId!, email ?? '', role ?? 'org_member');
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

orgRouter.get('/:orgId/invites', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const invites = await listPendingInvites(req.params.orgId!, uid);
    res.json({ invites });
  } catch (e) {
    next(e);
  }
});
