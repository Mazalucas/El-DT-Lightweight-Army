import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { loadSettings, saveSettings } from '../lib/settings.js';
export const configRouter = Router();
configRouter.get('/', async (req, res) => {
    try {
        res.json(await loadSettings(getUid(req)));
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
configRouter.put('/', async (req, res) => {
    try {
        const patch = req.body;
        res.json(await saveSettings(getUid(req), patch));
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
