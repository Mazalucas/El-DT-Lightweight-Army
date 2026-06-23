import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import {
  analyzeMeeting,
  applyAnalysisToStore,
  deleteLlmProviderKey,
  getJob,
  listLlmProviders,
  runAnalyzeBatch,
  setLlmProviderKey,
  testStoredLlmKey,
} from '../services/store.js';
import type { LlmProviderId } from '../shared/types.js';

export const secretsRouter = Router();

secretsRouter.get('/providers', async (req: AuthedRequest, res) => {
  try {
    res.json({ providers: await listLlmProviders(getUid(req)) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

secretsRouter.post('/providers/:providerId', async (req: AuthedRequest, res) => {
  try {
    const providerId = req.params.providerId as LlmProviderId;
    const { apiKey, modelDefault } = req.body as { apiKey?: string; modelDefault?: string };
    if (!apiKey?.trim()) {
      res.status(400).json({ error: 'apiKey required' });
      return;
    }
    const meta = await setLlmProviderKey(getUid(req), providerId, apiKey.trim(), modelDefault);
    res.json({ provider: meta });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

secretsRouter.post('/providers/:providerId/test', async (req: AuthedRequest, res) => {
  try {
    await testStoredLlmKey(getUid(req), req.params.providerId as LlmProviderId);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

secretsRouter.delete('/providers/:providerId', async (req: AuthedRequest, res) => {
  try {
    await deleteLlmProviderKey(getUid(req), req.params.providerId as LlmProviderId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export const aiRouter = Router();

aiRouter.post('/analyze/:meetingId', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const analysis = await analyzeMeeting(uid, String(req.params.meetingId));
    const store = await applyAnalysisToStore(uid, analysis);
    res.json({ analysis, store });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

aiRouter.post('/analyze-batch', async (req: AuthedRequest, res) => {
  try {
    const { meetingIds } = (req.body ?? {}) as { meetingIds?: string[] };
    const jobId = await runAnalyzeBatch(getUid(req), meetingIds);
    res.json({ jobId });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

aiRouter.get('/jobs/:jobId', async (req: AuthedRequest, res) => {
  try {
    const job = await getJob(getUid(req), String(req.params.jobId));
    if (!job) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
