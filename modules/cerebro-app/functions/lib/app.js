import express from 'express';
import cors from 'cors';
import { APP_VERSION } from './lib/app-version.js';
import { requireAuth } from './lib/auth-middleware.js';
import { authRouter, driveRouter, handleGoogleCallback } from './routes/auth.js';
import { configRouter } from './routes/config.js';
import { syncRouter, meetingsRouter, storeRouter } from './routes/sync.js';
import { secretsRouter, aiRouter } from './routes/ai.js';
import { catalogRouter } from './routes/catalog.js';
import { viewsRouter } from './routes/views.js';
import { orgRouter } from './routes/org.js';
import { adminRouter } from './routes/admin.js';
import { assistantRouter } from './routes/assistant.js';
import { cerebroRouter } from './routes/cerebro.js';
export function createApp() {
    const app = express();
    app.use(cors({ origin: true }));
    app.use(express.json({ limit: '15mb' }));
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        app.use((req, res, next) => {
            const started = Date.now();
            const line = `${req.method} ${req.url}`;
            res.on('finish', () => {
                const uid = req.uid;
                console.log(`[api] ${line} → ${res.statusCode} ${Date.now() - started}ms uid=${uid ?? '-'}`);
            });
            next();
        });
    }
    app.get('/api/health', (_req, res) => {
        res.json({ ok: true, service: 'cerebro-app', version: APP_VERSION });
    });
    app.get('/api/auth/google/callback', (req, res) => {
        void handleGoogleCallback(req, res);
    });
    app.use(requireAuth);
    app.use('/api/auth', authRouter);
    app.use('/api/config', configRouter);
    app.use('/api/drive', driveRouter);
    app.use('/api/sync', syncRouter);
    app.use('/api/meetings', meetingsRouter);
    app.use('/api/store', storeRouter);
    app.use('/api/secrets', secretsRouter);
    app.use('/api/ai', aiRouter);
    app.use('/api/catalog', catalogRouter);
    app.use('/api/views', viewsRouter);
    app.use('/api/orgs', orgRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/assistant', assistantRouter);
    app.use('/api/cerebro', cerebroRouter);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: err.message });
    });
    return app;
}
