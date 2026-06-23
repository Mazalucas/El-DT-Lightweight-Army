import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { getBoardView, getDashboardView, getMaintenanceView, getMeetingDetailView, getMeetingsView, getPeopleView, } from '../domain/views.service.js';
import { getSmartSuggestion, setSmartSuggestionStatus } from '../services/smart-suggestions.js';
import { runIntelligence } from '../services/suggestion-engine.js';
import { searchCatalog } from '../domain/search.service.js';
import { createTodo } from '../domain/todos.service.js';
export const viewsRouter = Router();
viewsRouter.get('/dashboard', async (req, res, next) => {
    try {
        const uid = getUid(req);
        res.json(await getDashboardView(uid));
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.get('/meetings', async (req, res, next) => {
    try {
        const uid = getUid(req);
        res.json(await getMeetingsView(uid, {
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            offset: req.query.offset ? Number(req.query.offset) : undefined,
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            projectId: typeof req.query.projectId === 'string' ? req.query.projectId : undefined,
            teamId: typeof req.query.teamId === 'string' ? req.query.teamId : undefined,
        }));
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.get('/meetings/:id', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const view = await getMeetingDetailView(uid, String(req.params.id));
        if (!view) {
            res.status(404).json({ error: 'not_found' });
            return;
        }
        res.json(view);
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.get('/people', async (req, res, next) => {
    try {
        const uid = getUid(req);
        res.json(await getPeopleView(uid, { q: typeof req.query.q === 'string' ? req.query.q : undefined }));
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.get('/board', async (req, res, next) => {
    try {
        const uid = getUid(req);
        res.json(await getBoardView(uid));
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.get('/maintenance', async (req, res, next) => {
    try {
        const uid = getUid(req);
        res.json(await getMaintenanceView(uid));
    }
    catch (e) {
        next(e);
    }
});
/** Búsqueda global: metadata + semántica (si hay índice de embeddings). */
viewsRouter.get('/search', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const q = typeof req.query.q === 'string' ? req.query.q : '';
        res.json(await searchCatalog(uid, q, { limit: req.query.limit ? Number(req.query.limit) : undefined }));
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.post('/suggestions/:id/accept', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const id = String(req.params.id);
        const suggestion = await getSmartSuggestion(uid, id);
        if (!suggestion) {
            res.status(404).json({ error: 'not_found' });
            return;
        }
        let createdTodoId;
        if (suggestion.action.kind === 'create_todo' && suggestion.action.payload?.text) {
            const payload = suggestion.action.payload;
            const input = { text: payload.text, dueAt: payload.dueAt };
            const result = await createTodo(uid, input);
            createdTodoId = result.todo.id;
        }
        const updated = await setSmartSuggestionStatus(uid, id, 'accepted');
        res.json({ suggestion: updated, createdTodoId });
    }
    catch (e) {
        next(e);
    }
});
viewsRouter.post('/suggestions/:id/dismiss', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const updated = await setSmartSuggestionStatus(uid, String(req.params.id), 'dismissed');
        res.json({ suggestion: updated });
    }
    catch (e) {
        next(e);
    }
});
/** Regenera sugerencias + digest a demanda (requiere API key LLM). */
viewsRouter.post('/intelligence/run', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const result = await runIntelligence(uid);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
