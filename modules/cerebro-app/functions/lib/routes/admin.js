import { Router } from 'express';
import { getUid } from '../lib/auth-middleware.js';
import { runRepairOrgStore, runRepairUserStore } from '../services/repair-store.js';
import { requireOrgRole } from '../services/org.js';
import { markSyncStarting } from '../services/sync.js';
import { resolveSyncStartMode } from '../lib/sync-running.js';
import { migrateStoreToNormalized } from '../services/store-repository.js';
export const adminRouter = Router();
adminRouter.post('/repair-store', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const { orgId } = req.body;
        const { mode, progress } = await resolveSyncStartMode(uid);
        if (mode === 'join') {
            res.status(202).json({
                ok: false,
                started: false,
                alreadyRunning: true,
                startedAt: progress?.startedAt,
                message: 'Ya hay un proceso en curso; consultá /api/sync/progress',
            });
            return;
        }
        const startedAt = await markSyncStarting(uid, {
            phase: 'repair',
            current: 0,
            total: 0,
            currentTitle: orgId ? 'Iniciando reparación org…' : 'Iniciando reparación…',
        });
        if (orgId) {
            await requireOrgRole(orgId, uid, ['org_owner', 'org_admin']);
            void runRepairOrgStore(orgId, uid).catch((e) => {
                console.error('POST /api/admin/repair-store org background failed', e);
            });
            res.status(202).json({
                ok: true,
                started: true,
                scope: 'org',
                orgId,
                startedAt,
                message: 'Reparación org en segundo plano; consultá /api/sync/progress',
            });
            return;
        }
        void runRepairUserStore(uid).catch((e) => {
            console.error('POST /api/admin/repair-store background failed', e);
        });
        res.status(202).json({
            ok: true,
            started: true,
            scope: 'personal',
            uid,
            startedAt,
            message: 'Reparación en segundo plano; consultá /api/sync/progress',
        });
    }
    catch (e) {
        next(e);
    }
});
adminRouter.post('/migrate-store-v2', async (req, res, next) => {
    try {
        const uid = getUid(req);
        const meta = await migrateStoreToNormalized(uid);
        res.json({ ok: true, meta });
    }
    catch (e) {
        next(e);
    }
});
