import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    loadEnv({ path: path.join(dir, '..', '.env.local') });
}
const app = createApp();
const fnBase = {
    region: 'europe-west1',
    memory: '1GiB',
    secrets: ['GOOGLE_OAUTH_CLIENT_SECRET', 'ENCRYPTION_KEY', 'INVITE_TOKEN_PEPPER'],
};
export const api = onRequest({ ...fnBase, timeoutSeconds: 3600 }, app);
export const scheduledMeetSync = onSchedule({
    schedule: 'every 1 hours',
    timeZone: 'UTC',
    ...fnBase,
    timeoutSeconds: 1800,
}, async () => {
    const { runScheduledSyncForAllUsers } = await import('./services/pipeline.js');
    const result = await runScheduledSyncForAllUsers();
    console.log('scheduledMeetSync', result);
});
