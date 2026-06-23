import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import { runAssistantChat } from '../assistant/assistant.service.js';
import {
  deleteConversation,
  getConversation,
  listConversations,
} from '../assistant/conversation.service.js';
import { userHasLlmKey } from '../services/llm-service.js';
import type { AssistantPageContext, AssistantSseEvent } from '../assistant/types.js';

export const assistantRouter = Router();

function writeSse(res: import('express').Response, event: AssistantSseEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

assistantRouter.get('/status', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const hasKey = await userHasLlmKey(uid);
    res.json({ ok: true, llmConfigured: hasKey });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

assistantRouter.get('/conversations', async (req: AuthedRequest, res) => {
  try {
    res.json({ conversations: await listConversations(getUid(req)) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

assistantRouter.get('/conversations/:id', async (req: AuthedRequest, res) => {
  try {
    const conv = await getConversation(getUid(req), String(req.params.id));
    if (!conv) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(conv);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

assistantRouter.delete('/conversations/:id', async (req: AuthedRequest, res) => {
  try {
    await deleteConversation(getUid(req), String(req.params.id));
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

assistantRouter.post('/chat', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const { message, conversationId, pageContext } = (req.body ?? {}) as {
      message?: string;
      conversationId?: string;
      pageContext?: AssistantPageContext;
    };
    if (!message?.trim()) {
      res.status(400).json({ error: 'message required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await runAssistantChat({
      uid,
      message: message.trim(),
      conversationId,
      pageContext,
      write: (event) => writeSse(res, event),
    });
    res.end();
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
      return;
    }
    writeSse(res, { type: 'error', message: e instanceof Error ? e.message : String(e) });
    res.end();
  }
});
