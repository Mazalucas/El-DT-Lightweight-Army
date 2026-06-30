import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import {
  acceptTodosBatch,
  assignEmailToTeam,
  createPerson,
  createProject,
  createTeam,
  deleteProject,
  deleteTeam,
  dismissTodosBatch,
  dismissProspect,
  dismissMergeContactSuggestion,
  dismissTeamEmailReassign,
  restoreProspectDismiss,
  linkProspectToContact,
  mergePersonsIntoCanonical,
  promoteProspectToContact,
  updatePerson,
  updateProject,
  updateTeam,
} from '../services/catalog-mutate.js';
import { getGraph, getSuggestions } from '../services/suggestions-graph.js';
import { computeStoreHealth } from '../services/store-health.js';
import {
  acceptProjectSuggestionOnAdapter,
  acceptTeamSuggestionOnAdapter,
  batchAcceptProjectSuggestionsOnAdapter,
  batchAcceptTeamSuggestionsOnAdapter,
  batchDismissSuggestionsOnAdapter,
  dismissSuggestionOnAdapter,
  restorePendingSuggestionsOnAdapter,
  revertSuggestionAcceptsOnAdapter,
} from '../services/pending-suggestions.js';
import { userStoreAdapter } from '../services/catalog-mutate.js';
import { rankProspectLinkCandidates } from '../services/prospect-matching.js';
import { loadStore } from '../services/store.js';
import { getBoardSnapshot } from '../domain/board.service.js';
import {
  completeTodosBatch,
  createTodo,
  moveTodo,
  reopenTodosBatch,
  updateTodo,
} from '../domain/todos.service.js';
import type { CreateTodoInput, MoveTodoInput, UpdateTodoInput } from '../shared/types.js';

export const catalogRouter = Router();

catalogRouter.get('/suggestions', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const suggestions = await getSuggestions(uid);
    res.json({ suggestions });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get('/board', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const board = await getBoardSnapshot(uid);
    res.json({ board });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get('/health', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await loadStore(uid);
    res.json({ health: computeStoreHealth(store) });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get('/graph', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const center = typeof req.query.center === 'string' ? req.query.center : undefined;
    const depth = req.query.depth ? Number(req.query.depth) : undefined;
    const types = typeof req.query.types === 'string' ? req.query.types.split(',') : undefined;
    const graph = await getGraph(uid, { limit, center, depth, types });
    res.json({ graph });
  } catch (e) {
    next(e);
  }
});

// Batch routes MUST be registered before /suggestions/:id/* — otherwise "batch" is captured as :id.
catalogRouter.post('/suggestions/batch/dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { ids } = req.body as { ids?: string[] };
    const result = await batchDismissSuggestionsOnAdapter(userStoreAdapter(uid), ids ?? []);
    res.json({ dismissed: result.dismissed });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/batch/accept-project', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { ids, existingProjectId, projectName } = req.body as {
      ids?: string[];
      existingProjectId?: string;
      projectName?: string;
    };
    const result = await batchAcceptProjectSuggestionsOnAdapter(userStoreAdapter(uid), ids ?? [], {
      existingProjectId,
      projectName,
    });
    res.json({ accepted: result.accepted, skipped: result.skipped, undoSnapshots: result.undoSnapshots });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/batch/accept-team', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { ids } = req.body as { ids?: string[] };
    const result = await batchAcceptTeamSuggestionsOnAdapter(userStoreAdapter(uid), ids ?? []);
    res.json({ accepted: result.accepted, skipped: result.skipped, undoSnapshots: result.undoSnapshots });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/batch/restore', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { ids } = req.body as { ids?: string[] };
    const result = await restorePendingSuggestionsOnAdapter(userStoreAdapter(uid), ids ?? []);
    res.json({ restored: result.restored });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/batch/revert-accept', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { snapshots } = req.body as { snapshots?: import('../shared/types.js').SuggestionAcceptUndoSnapshot[] };
    const result = await revertSuggestionAcceptsOnAdapter(userStoreAdapter(uid), snapshots ?? []);
    res.json({ reverted: result.reverted });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/:id/dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await dismissSuggestionOnAdapter(userStoreAdapter(uid), req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/:id/accept-project', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { existingProjectId, projectName } = req.body as {
      existingProjectId?: string;
      projectName?: string;
    };
    const store = await acceptProjectSuggestionOnAdapter(userStoreAdapter(uid), req.params.id!, {
      existingProjectId,
      projectName,
    });
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/suggestions/:id/accept-team', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await acceptTeamSuggestionOnAdapter(userStoreAdapter(uid), req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.get('/prospects/:id/candidates', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await loadStore(uid);
    const candidates = rankProspectLinkCandidates(store, req.params.id!);
    res.json({ candidates });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/teams', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name } = req.body as { name?: string };
    const result = await createTeam(uid, name ?? '');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.patch('/teams/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await updateTeam(uid, req.params.id!, req.body);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/teams/:id/assign-email', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { email } = req.body as { email?: string };
    if (!email?.trim()) {
      res.status(400).json({ error: 'email requerido' });
      return;
    }
    const store = await assignEmailToTeam(uid, req.params.id!, email);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.delete('/teams/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await deleteTeam(uid, req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/projects', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { name } = req.body as { name?: string };
    const result = await createProject(uid, name ?? '');
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.patch('/projects/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await updateProject(uid, req.params.id!, req.body);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.delete('/projects/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await deleteProject(uid, req.params.id!);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/people', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { displayName, email, teamIds, projectIds } = req.body as {
      displayName?: string;
      email?: string;
      teamIds?: string[];
      projectIds?: string[];
    };
    const result = await createPerson(uid, displayName ?? '', email ?? '', teamIds, projectIds);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.patch('/people/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await updatePerson(uid, req.params.id!, req.body);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/people/merge', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { canonicalId, mergeIds } = req.body as { canonicalId?: string; mergeIds?: string[] };
    const result = await mergePersonsIntoCanonical(uid, canonicalId ?? '', mergeIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/prospects/:id/promote', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { email, displayName, aliases, teamIds, projectIds } = req.body as {
      email?: string;
      displayName?: string;
      aliases?: string[];
      teamIds?: string[];
      projectIds?: string[];
    };
    const result = await promoteProspectToContact(uid, req.params.id!, email ?? '', displayName, {
      aliases,
      teamIds,
      projectIds,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/prospects/:id/link', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { personId, aliases, teamIds, projectIds } = req.body as {
      personId?: string;
      aliases?: string[];
      teamIds?: string[];
      projectIds?: string[];
    };
    const store = await linkProspectToContact(uid, req.params.id!, personId ?? '', {
      aliases,
      teamIds,
      projectIds,
    });
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/prospects/:id/dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await dismissProspect(uid, req.params.id!);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/prospects/restore-dismiss', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { snapshot } = req.body as { snapshot?: import('../shared/types.js').ProspectDismissUndoSnapshot };
    if (!snapshot?.prospectId) {
      res.status(400).json({ error: 'snapshot requerido' });
      return;
    }
    const store = await restoreProspectDismiss(uid, snapshot);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/maintenance/dismiss-team-email', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { personId, email } = req.body as { personId?: string; email?: string };
    const store = await dismissTeamEmailReassign(uid, personId ?? '', email ?? '');
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/maintenance/dismiss-merge', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { suggestionId } = req.body as { suggestionId?: string };
    const store = await dismissMergeContactSuggestion(uid, suggestionId ?? '');
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await createTodo(uid, req.body as CreateTodoInput);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.patch('/todos/:id', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await updateTodo(uid, req.params.id!, req.body as UpdateTodoInput);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/:id/move', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const result = await moveTodo(uid, req.params.id!, req.body as MoveTodoInput);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/complete-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await completeTodosBatch(uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/reopen-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await reopenTodosBatch(uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/accept-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await acceptTodosBatch(uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/dismiss-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const result = await dismissTodosBatch(uid, todoIds ?? []);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
