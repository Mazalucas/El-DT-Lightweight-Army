import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { deleteConversation, getConversation, listConversations, } from '../assistant/conversation.service.js';
import { userHasLlmKey } from '../services/llm-service.js';
import { getCerebroContext, runCerebroChat, dismissCerebroMoment } from '../cerebro/cerebro.service.js';
export const cerebroRouter = Router();
function writeSse(res, event) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
}
cerebroRouter.get('/status', async (req, res) => {
    try {
        const uid = getUid(req);
        const hasKey = await userHasLlmKey(uid);
        res.json({ ok: true, llmConfigured: hasKey });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
cerebroRouter.get('/context', async (req, res) => {
    try {
        const uid = getUid(req);
        const client = parseClientContext(undefined, req.query);
        const dismissed = parseDismissed(req.query);
        const result = await getCerebroContext(uid, client, {
            dismissedMomentKeys: dismissed,
            userTyping: req.query.userTyping === '1',
            toolRunning: req.query.toolRunning === '1',
            planPending: req.query.planPending === '1',
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
cerebroRouter.post('/context', async (req, res) => {
    try {
        const uid = getUid(req);
        const body = (req.body ?? {});
        const client = body.clientContext ?? parseClientContext(undefined, req.query);
        const result = await getCerebroContext(uid, client, {
            dismissedMomentKeys: body.dismissedMomentKeys,
            userTyping: body.userTyping,
            toolRunning: body.toolRunning,
            planPending: body.planPending,
        });
        res.json(result);
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
cerebroRouter.post('/moments/dismiss', async (req, res) => {
    try {
        const uid = getUid(req);
        const { conversationId, momentKey } = (req.body ?? {});
        if (!conversationId?.trim() || !momentKey?.trim()) {
            res.status(400).json({ error: 'conversationId and momentKey required' });
            return;
        }
        await dismissCerebroMoment(uid, conversationId.trim(), momentKey.trim());
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
cerebroRouter.get('/conversations', async (req, res) => {
    try {
        res.json({ conversations: await listConversations(getUid(req)) });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
cerebroRouter.get('/conversations/:id', async (req, res) => {
    try {
        const conv = await getConversation(getUid(req), String(req.params.id));
        if (!conv) {
            res.status(404).json({ error: 'not_found' });
            return;
        }
        res.json(conv);
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
cerebroRouter.delete('/conversations/:id', async (req, res) => {
    try {
        await deleteConversation(getUid(req), String(req.params.id));
        res.status(204).end();
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
cerebroRouter.post('/chat', async (req, res) => {
    try {
        const uid = getUid(req);
        const { message, conversationId, clientContext } = (req.body ?? {});
        if (!message?.trim()) {
            res.status(400).json({ error: 'message required' });
            return;
        }
        if (!clientContext?.navigation) {
            res.status(400).json({ error: 'clientContext.navigation required' });
            return;
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        await runCerebroChat({
            uid,
            message: message.trim(),
            conversationId,
            clientContext,
            write: (event) => writeSse(res, event),
        });
        res.end();
    }
    catch (e) {
        if (!res.headersSent) {
            res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
            return;
        }
        writeSse(res, { type: 'error', message: e instanceof Error ? e.message : String(e) });
        res.end();
    }
});
function parseDismissed(query) {
    const raw = query.dismissed;
    if (typeof raw !== 'string' || !raw.trim())
        return undefined;
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function parseClientContext(body, query) {
    const fromBody = body?.clientContext;
    if (fromBody?.navigation)
        return fromBody;
    const route = String(query.route ?? 'home');
    const hash = String(query.hash ?? `#/${route === 'home' ? '' : route}`);
    return {
        navigation: {
            route,
            hash,
            pageTitle: String(query.pageTitle ?? 'Cerebro'),
            pageDescription: query.pageDescription ? String(query.pageDescription) : undefined,
            viewport: query.viewport === 'mobile' ? 'mobile' : 'desktop',
            orgId: query.orgId ? String(query.orgId) : undefined,
            meetingId: query.meetingId ? String(query.meetingId) : undefined,
            settingsSection: query.settingsSection ? String(query.settingsSection) : undefined,
        },
        ambient: {
            visibleTargets: typeof query.visibleTargets === 'string'
                ? query.visibleTargets.split(',').filter(Boolean)
                : [],
        },
        user: query.timezone ? { timezone: String(query.timezone) } : undefined,
    };
}
