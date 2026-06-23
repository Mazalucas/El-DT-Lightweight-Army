import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { getAuthUrl, exchangeCode, saveGoogleTokens, revokeGoogle, hasGoogleIntegration, getGoogleAccessToken, getGooglePickerConfig, listDriveFolders, testDriveFolder, suggestMeetFolders, } from '../services/google.js';
import { db } from '../lib/firebase.js';
function driveErrorStatus(message) {
    if (message.includes('not connected') || message.includes('Reconectá') || message.includes('Desconectá')) {
        return 401;
    }
    return 500;
}
export const authRouter = Router();
authRouter.get('/status', async (req, res) => {
    try {
        const uid = getUid(req);
        res.json({ connected: await hasGoogleIntegration(uid) });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
authRouter.get('/google/start', async (req, res) => {
    try {
        const uid = getUid(req);
        const state = Buffer.from(JSON.stringify({ uid, ts: Date.now() })).toString('base64url');
        await db.collection('oauth_states').doc(state).set({ uid, createdAt: Date.now() });
        res.json({ url: getAuthUrl(state) });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
export async function handleGoogleCallback(req, res) {
    try {
        const code = req.query.code;
        const state = req.query.state;
        if (!code || !state) {
            res.status(400).send('Missing code or state');
            return;
        }
        const stateSnap = await db.collection('oauth_states').doc(state).get();
        if (!stateSnap.exists) {
            res.status(400).send('Invalid state');
            return;
        }
        const { uid } = stateSnap.data();
        await db.collection('oauth_states').doc(state).delete();
        const tokens = await exchangeCode(code);
        await saveGoogleTokens(uid, tokens);
        const appUrl = process.env.APP_URL || '/';
        res.redirect(`${appUrl}/#/settings?google=connected`);
    }
    catch (e) {
        res.status(500).send(e instanceof Error ? e.message : String(e));
    }
}
authRouter.post('/google/revoke', async (req, res) => {
    try {
        await revokeGoogle(getUid(req));
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
authRouter.get('/google/picker-config', async (req, res) => {
    try {
        const uid = getUid(req);
        const connected = await hasGoogleIntegration(uid);
        if (!connected) {
            res.status(401).json({ error: 'Google not connected' });
            return;
        }
        const [accessToken, picker] = await Promise.all([getGoogleAccessToken(uid), Promise.resolve(getGooglePickerConfig())]);
        res.json({ accessToken, ...picker });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('GET /api/auth/google/picker-config', message);
        res.status(driveErrorStatus(message)).json({ error: message });
    }
});
export const driveRouter = Router();
driveRouter.get('/folders', async (req, res) => {
    try {
        const parentId = req.query.parentId || 'root';
        const q = req.query.q;
        const sharedWithMe = req.query.sharedWithMe === 'true';
        const folders = await listDriveFolders(getUid(req), parentId, q, { sharedWithMe });
        res.json({ folders });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('GET /api/drive/folders', message);
        res.status(driveErrorStatus(message)).json({ error: message });
    }
});
driveRouter.get('/folders/suggest', async (req, res) => {
    try {
        const folders = await suggestMeetFolders(getUid(req));
        res.json({ folders });
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error('GET /api/drive/folders/suggest', message);
        res.status(driveErrorStatus(message)).json({ error: message });
    }
});
driveRouter.post('/test-all-sources', async (req, res) => {
    try {
        const { loadSettings } = await import('../lib/settings.js');
        const settings = await loadSettings(getUid(req));
        const results = await Promise.all(settings.meetSources.map(async (s) => {
            const r = await testDriveFolder(getUid(req), s.driveFolderId);
            return { label: s.label, folderId: s.driveFolderId, ...r };
        }));
        res.json({ results });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
driveRouter.post('/test-folder', async (req, res) => {
    try {
        const { folderId } = req.body;
        if (!folderId) {
            res.status(400).json({ error: 'folderId required' });
            return;
        }
        res.json(await testDriveFolder(getUid(req), folderId));
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
