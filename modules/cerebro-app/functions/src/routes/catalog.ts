import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import {
  acceptTodosBatch,
  createPerson,
  createProject,
  createTeam,
  deleteProject,
  deleteTeam,
  dismissTodosBatch,
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
  dismissSuggestionOnAdapter,
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
    const { email, displayName } = req.body as { email?: string; displayName?: string };
    const result = await promoteProspectToContact(uid, req.params.id!, email ?? '', displayName);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/prospects/:id/link', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { personId } = req.body as { personId?: string };
    const store = await linkProspectToContact(uid, req.params.id!, personId ?? '');
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
    const store = await updateTodo(uid, req.params.id!, req.body as UpdateTodoInput);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/:id/move', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const store = await moveTodo(uid, req.params.id!, req.body as MoveTodoInput);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/complete-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const store = await completeTodosBatch(uid, todoIds ?? []);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/reopen-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const store = await reopenTodosBatch(uid, todoIds ?? []);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/accept-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const store = await acceptTodosBatch(uid, todoIds ?? []);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});

catalogRouter.post('/todos/dismiss-batch', async (req, res, next) => {
  try {
    const uid = getUid(req as AuthedRequest);
    const { todoIds } = req.body as { todoIds?: string[] };
    const store = await dismissTodosBatch(uid, todoIds ?? []);
    res.json({ store });
  } catch (e) {
    next(e);
  }
});
