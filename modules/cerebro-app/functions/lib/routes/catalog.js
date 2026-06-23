import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { acceptTodosBatch, createPerson, createProject, createTeam, deleteProject, deleteTeam, dismissTodosBatch, linkProspectToContact, mergePersonsIntoCanonical, promoteProspectToContact, updatePerson, updateProject, updateTeam, } from '../services/catalog-mutate.js';
import { getGraph, getSuggestions } from '../services/suggestions-graph.js';
import { computeStoreHealth } from '../services/store-health.js';
import { acceptProjectSuggestionOnAdapter, acceptTeamSuggestionOnAdapter, dismissSuggestionOnAdapter, } from '../services/pending-suggestions.js';
import { userStoreAdapter } from '../services/catalog-mutate.js';
import { rankProspectLinkCandidates } from '../services/prospect-matching.js';
import { loadStore } from '../services/store.js';
import { getBoardSnapshot } from '../domain/board.service.js';
import { completeTodosBatch, createTodo, moveTodo, reopenTodosBatch, updateTodo, } from '../domain/todos.service.js';
export const catalogRouter = Router();
catalogRouter.get('/suggestions', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const suggestions = await getSuggestions(uid);
        res.json({ suggestions });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.get('/board', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const board = await getBoardSnapshot(uid);
        res.json({ board });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.get('/health', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await loadStore(uid);
        res.json({ health: computeStoreHealth(store) });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.get('/graph', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const center = typeof req.query.center === 'string' ? req.query.center : undefined;
        const depth = req.query.depth ? Number(req.query.depth) : undefined;
        const types = typeof req.query.types === 'string' ? req.query.types.split(',') : undefined;
        const graph = await getGraph(uid, { limit, center, depth, types });
        res.json({ graph });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/suggestions/:id/dismiss', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await dismissSuggestionOnAdapter(userStoreAdapter(uid), req.params.id);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/suggestions/:id/accept-project', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { existingProjectId, projectName } = req.body;
        const store = await acceptProjectSuggestionOnAdapter(userStoreAdapter(uid), req.params.id, {
            existingProjectId,
            projectName,
        });
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/suggestions/:id/accept-team', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await acceptTeamSuggestionOnAdapter(userStoreAdapter(uid), req.params.id);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.get('/prospects/:id/candidates', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await loadStore(uid);
        const candidates = rankProspectLinkCandidates(store, req.params.id);
        res.json({ candidates });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/teams', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { name } = req.body;
        const result = await createTeam(uid, name ?? '');
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.patch('/teams/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await updateTeam(uid, req.params.id, req.body);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.delete('/teams/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await deleteTeam(uid, req.params.id);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/projects', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { name } = req.body;
        const result = await createProject(uid, name ?? '');
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.patch('/projects/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await updateProject(uid, req.params.id, req.body);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.delete('/projects/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await deleteProject(uid, req.params.id);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/people', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { displayName, email, teamIds, projectIds } = req.body;
        const result = await createPerson(uid, displayName ?? '', email ?? '', teamIds, projectIds);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.patch('/people/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await updatePerson(uid, req.params.id, req.body);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/people/merge', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { canonicalId, mergeIds } = req.body;
        const result = await mergePersonsIntoCanonical(uid, canonicalId ?? '', mergeIds ?? []);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/prospects/:id/promote', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { email, displayName } = req.body;
        const result = await promoteProspectToContact(uid, req.params.id, email ?? '', displayName);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/prospects/:id/link', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { personId } = req.body;
        const store = await linkProspectToContact(uid, req.params.id, personId ?? '');
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const result = await createTodo(uid, req.body);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.patch('/todos/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await updateTodo(uid, req.params.id, req.body);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos/:id/move', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const store = await moveTodo(uid, req.params.id, req.body);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos/complete-batch', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { todoIds } = req.body;
        const store = await completeTodosBatch(uid, todoIds ?? []);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos/reopen-batch', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { todoIds } = req.body;
        const store = await reopenTodosBatch(uid, todoIds ?? []);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos/accept-batch', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { todoIds } = req.body;
        const store = await acceptTodosBatch(uid, todoIds ?? []);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
catalogRouter.post('/todos/dismiss-batch', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { todoIds } = req.body;
        const store = await dismissTodosBatch(uid, todoIds ?? []);
        res.json({ store });
    }
    catch (e) {
        next(e);
    }
});
