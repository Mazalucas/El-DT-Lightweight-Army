import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { loadFacturas, saveFacturas } from '../services/store.js';
import { uploadToDriveFolder } from '../services/google.js';
import { loadSettings } from '../lib/settings.js';
export const invoicesRouter = Router();
invoicesRouter.get('/', async (req, res) => {
    try {
        res.json(await loadFacturas(getUid(req)));
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
invoicesRouter.put('/', async (req, res) => {
    try {
        await saveFacturas(getUid(req), req.body);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
invoicesRouter.post('/export', async (req, res) => {
    try {
        const uid = getUid(req);
        const settings = await loadSettings(uid);
        const folderId = settings.facturasExportFolderId;
        if (!folderId) {
            res.status(400).json({ error: 'Configure facturas export folder in Settings' });
            return;
        }
        const { fileName, mimeType, dataBase64 } = req.body;
        if (!fileName || !mimeType || !dataBase64) {
            res.status(400).json({ error: 'fileName, mimeType, dataBase64 required' });
            return;
        }
        const buffer = Buffer.from(dataBase64, 'base64');
        const fileId = await uploadToDriveFolder(uid, folderId, fileName, mimeType, buffer);
        res.json({ ok: true, fileId });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
