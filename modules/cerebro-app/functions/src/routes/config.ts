import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import { loadSettings, saveSettings } from '../lib/settings.js';
import type { UserAppSettings } from '../shared/types.js';

export const configRouter = Router();

configRouter.get('/', async (req: AuthedRequest, res) => {
  try {
    res.json(await loadSettings(getUid(req)));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

configRouter.put('/', async (req: AuthedRequest, res) => {
  try {
    const patch = req.body as Partial<UserAppSettings>;
    res.json(await saveSettings(getUid(req), patch));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
