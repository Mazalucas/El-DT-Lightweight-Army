import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { getSyncProgress, listMeetings, markSyncStarting, runSync, scanDriveSources, getMirrorContent, } from '../services/sync.js';
import { hasGoogleIntegration } from '../services/google.js';
import { meetingsCol } from '../lib/firebase.js';
import { importMeetingsToStore, loadStore, listLlmProviders } from '../services/store.js';
import { getStoreSummary } from '../domain/health.service.js';
import { listMeetingsPage } from '../domain/meetings.service.js';
import { loadSettings } from '../lib/settings.js';
import { isSetupComplete } from '../services/setup.js';
import { runFullPipeline } from '../services/pipeline.js';
import { isSyncRunning, resolveSyncStartMode } from '../lib/sync-running.js';
import { progressTitle } from '../services/sync.js';
function normalizeSyncProgress(progress) {
    if (!progress)
        return null;
    const { currentTitle, error, ...rest } = progress;
    return {
        ...rest,
        ...(currentTitle != null && currentTitle !== '' ? { currentTitle: progressTitle(currentTitle) } : {}),
        ...(error != null ? { error: typeof error === 'string' ? error : String(error) } : {}),
    };
}
export const syncRouter = Router();
syncRouter.get('/status', async (req, res) => {
    try {
        const uid = getUid(req);
        const [meetings, progress, google, llm, store, settings] = await Promise.all([
            listMeetings(uid),
            getSyncProgress(uid),
            hasGoogleIntegration(uid),
            listLlmProviders(uid),
            loadStore(uid),
            loadSettings(uid),
        ]);
        const status = {
            hasFirebaseAuth: true,
            hasGoogleIntegration: google,
            meetingCount: store.meetings.length,
            mirrorCount: meetings.filter((m) => m.syncStatus === 'synced').length,
            syncRunning: isSyncRunning(progress),
            syncProgress: progress ?? undefined,
            llmProviders: llm,
            meetSourceCount: settings.meetSources.length,
            setupComplete: isSetupComplete(settings, google),
            syncSchedule: settings.syncSchedule,
        };
        res.json(status);
    }
    catch (e) {
        console.error('GET /api/sync/status failed', e);
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
syncRouter.post('/scan', async (req, res) => {
    try {
        res.json(await scanDriveSources(getUid(req)));
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
syncRouter.post('/run', async (req, res) => {
    try {
        const uid = getUid(req);
        const { mode, progress } = await resolveSyncStartMode(uid);
        if (mode === 'join') {
            res.status(202).json({
                started: false,
                alreadyRunning: true,
                startedAt: progress?.startedAt,
                message: 'Sync ya en curso; consultá /api/sync/progress',
            });
            return;
        }
        const { limit } = (req.body ?? {});
        const startedAt = await markSyncStarting(uid, {
            phase: 'scan',
            current: 0,
            total: 0,
            currentTitle: 'Iniciando sync…',
        });
        void runSync(uid, limit, { skipInitialProgress: true }).catch((e) => {
            console.error('POST /api/sync/run background failed', e);
        });
        res.status(202).json({ started: true, startedAt, message: 'Sync en segundo plano; consultá /api/sync/progress' });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
syncRouter.get('/progress', async (req, res) => {
    try {
        const raw = await getSyncProgress(getUid(req));
        const progress = normalizeSyncProgress(raw);
        const response = {
            phase: 'idle',
            current: 0,
            total: 0,
            done: true,
            ...(progress ?? {}),
            running: isSyncRunning(progress),
        };
        res.json(response);
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
syncRouter.post('/pipeline', async (req, res) => {
    try {
        const uid = getUid(req);
        const { mode, progress } = await resolveSyncStartMode(uid);
        if (mode === 'join') {
            res.status(202).json({
                started: false,
                alreadyRunning: true,
                startedAt: progress?.startedAt,
                message: 'Pipeline ya en curso; consultá /api/sync/progress',
            });
            return;
        }
        const { limit, skipAnalysis } = (req.body ?? {});
        const startedAt = await markSyncStarting(uid, {
            phase: 'pipeline',
            current: 0,
            total: 4,
            currentTitle: 'Pipeline completo…',
        });
        void runFullPipeline(uid, { limit, skipAnalysis, startedAt, skipInitialProgress: true }).catch((e) => {
            console.error('POST /api/sync/pipeline background failed', e);
        });
        res.status(202).json({ started: true, startedAt, message: 'Pipeline en segundo plano; consultá /api/sync/progress' });
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
export const meetingsRouter = Router();
meetingsRouter.get('/', async (req, res) => {
    try {
        res.json({ meetings: await listMeetings(getUid(req)) });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
meetingsRouter.get('/:id', async (req, res) => {
    try {
        const snap = await meetingsCol(getUid(req)).doc(String(req.params.id)).get();
        if (!snap.exists) {
            res.status(404).json({ error: 'not_found' });
            return;
        }
        res.json(snap.data());
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
meetingsRouter.get('/:id/content', async (req, res) => {
    try {
        const content = await getMirrorContent(getUid(req), String(req.params.id));
        if (!content) {
            res.status(404).json({ error: 'not_found' });
            return;
        }
        res.json({ content });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
meetingsRouter.post('/import', async (req, res) => {
    try {
        res.json(await importMeetingsToStore(getUid(req)));
    }
    catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
});
export const storeRouter = Router();
storeRouter.get('/', async (req, res) => {
    try {
        res.json(await loadStore(getUid(req)));
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
storeRouter.put('/', async (req, res) => {
    try {
        const { saveStore } = await import('../services/store.js');
        await saveStore(getUid(req), req.body);
        res.json({ ok: true });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
storeRouter.get('/summary', async (req, res) => {
    try {
        const uid = getUid(req);
        const { isNormalizedStore } = await import('../services/store-repository.js');
        const summary = await getStoreSummary(uid);
        const normalized = await isNormalizedStore(uid);
        res.json({ ...summary, storeVersion: normalized ? 3 : 1, needsMigration: !normalized });
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
storeRouter.get('/meetings', async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const offset = Number(req.query.offset) || 0;
        res.json(await listMeetingsPage(getUid(req), { limit, offset }));
    }
    catch (e) {
        res.status(500).json({ error: String(e) });
    }
});
