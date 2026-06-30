import { Router } from 'express';
import type { AuthedRequest } from '../lib/auth-middleware.js';
import { getUid } from '../lib/auth-middleware.js';
import {
  getAuthUrl,
  getCalendarAuthUrl,
  exchangeCode,
  saveGoogleTokens,
  revokeGoogle,
  hasGoogleIntegration,
  hasCalendarScope,
  getGoogleAccessToken,
  getGooglePickerConfig,
  listDriveFolders,
  testDriveFolder,
  suggestMeetFolders,
  CALENDAR_SCOPE,
} from '../services/google.js';
import { fetchPrimaryCalendarTimezone } from '../services/calendar.service.js';
import { applyGoogleCalendarTimezone } from '../lib/settings.js';
import { db } from '../lib/firebase.js';

function driveErrorStatus(message: string): number {
  if (message.includes('not connected') || message.includes('Reconectá') || message.includes('Desconectá')) {
    return 401;
  }
  return 500;
}

export const authRouter = Router();

authRouter.get('/status', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const connected = await hasGoogleIntegration(uid);
    res.json({ connected, hasCalendarScope: connected ? await hasCalendarScope(uid) : false });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

authRouter.get('/google/start', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const state = Buffer.from(JSON.stringify({ uid, ts: Date.now() })).toString('base64url');
    await db.collection('oauth_states').doc(state).set({ uid, createdAt: Date.now() });
    res.json({ url: getAuthUrl(state) });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

authRouter.get('/google/calendar/start', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const state = Buffer.from(JSON.stringify({ uid, ts: Date.now(), kind: 'calendar' })).toString('base64url');
    await db.collection('oauth_states').doc(state).set({ uid, createdAt: Date.now() });
    res.json({ url: getCalendarAuthUrl(state) });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export async function handleGoogleCallback(req: import('express').Request, res: import('express').Response): Promise<void> {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    if (!code || !state) {
      res.status(400).send('Missing code or state');
      return;
    }
    const stateSnap = await db.collection('oauth_states').doc(state).get();
    if (!stateSnap.exists) {
      res.status(400).send('Invalid state');
      return;
    }
    const stateData = stateSnap.data() as { uid: string; kind?: string };
    const { uid } = stateData;
    await db.collection('oauth_states').doc(state).delete();
    const tokens = await exchangeCode(code);
    if (stateData.kind === 'calendar') {
      await saveGoogleTokens(uid, tokens, { scopes: [CALENDAR_SCOPE] });
    } else {
      await saveGoogleTokens(uid, tokens);
    }
    try {
      if (await hasCalendarScope(uid)) {
        const googleTz = await fetchPrimaryCalendarTimezone(uid);
        if (googleTz) await applyGoogleCalendarTimezone(uid, googleTz);
      }
    } catch {
      // TZ seed opcional; no bloquea OAuth
    }
    const appUrl = process.env.APP_URL || '/';
    res.redirect(`${appUrl}/#/settings?google=connected`);
  } catch (e) {
    res.status(500).send(e instanceof Error ? e.message : String(e));
  }
}

authRouter.post('/google/revoke', async (req: AuthedRequest, res) => {
  try {
    await revokeGoogle(getUid(req));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

authRouter.post('/google/refresh-timezone', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const googleTz = await fetchPrimaryCalendarTimezone(uid);
    if (!googleTz) {
      res.status(400).json({ error: 'Google Calendar no disponible o sin permiso de calendario' });
      return;
    }
    const settings = await applyGoogleCalendarTimezone(uid, googleTz);
    res.json({ timezone: googleTz, locale: settings.locale });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

authRouter.get('/google/picker-config', async (req: AuthedRequest, res) => {
  try {
    const uid = getUid(req);
    const connected = await hasGoogleIntegration(uid);
    if (!connected) {
      res.status(401).json({ error: 'Google not connected' });
      return;
    }
    const [accessToken, picker] = await Promise.all([getGoogleAccessToken(uid), Promise.resolve(getGooglePickerConfig())]);
    res.json({ accessToken, ...picker });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('GET /api/auth/google/picker-config', message);
    res.status(driveErrorStatus(message)).json({ error: message });
  }
});

export const driveRouter = Router();

driveRouter.get('/folders', async (req: AuthedRequest, res) => {
  try {
    const parentId = (req.query.parentId as string) || 'root';
    const q = req.query.q as string | undefined;
    const sharedWithMe = req.query.sharedWithMe === 'true';
    const folders = await listDriveFolders(getUid(req), parentId, q, { sharedWithMe });
    res.json({ folders });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('GET /api/drive/folders', message);
    res.status(driveErrorStatus(message)).json({ error: message });
  }
});

driveRouter.get('/folders/suggest', async (req: AuthedRequest, res) => {
  try {
    const folders = await suggestMeetFolders(getUid(req));
    res.json({ folders });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('GET /api/drive/folders/suggest', message);
    res.status(driveErrorStatus(message)).json({ error: message });
  }
});

driveRouter.post('/test-all-sources', async (req: AuthedRequest, res) => {
  try {
    const { loadSettings } = await import('../lib/settings.js');
    const settings = await loadSettings(getUid(req));
    const results = await Promise.all(
      settings.meetSources.map(async (s) => {
        const r = await testDriveFolder(getUid(req), s.driveFolderId);
        return { label: s.label, folderId: s.driveFolderId, ...r };
      }),
    );
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

driveRouter.post('/test-folder', async (req: AuthedRequest, res) => {
  try {
    const { folderId } = req.body as { folderId?: string };
    if (!folderId) {
      res.status(400).json({ error: 'folderId required' });
      return;
    }
    res.json(await testDriveFolder(getUid(req), folderId));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});
