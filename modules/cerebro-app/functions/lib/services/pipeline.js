import { syncLastRunRef } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { loadSettings, saveSettings } from '../lib/settings.js';
import { hasGoogleIntegration } from './google.js';
import { listLlmProviders, runAnalyzeBatch } from './store.js';
import { fullImportFromMirrors } from './reindex.js';
import { markSyncStarting, runSync, updateSyncProgress } from './sync.js';
export async function runFullPipeline(uid, options) {
    const startedAt = options?.startedAt ?? new Date().toISOString();
    const messages = [];
    if (!options?.skipInitialProgress) {
        await markSyncStarting(uid, {
            phase: 'pipeline',
            current: 0,
            total: 5,
            currentTitle: 'Pipeline completo…',
            startedAt,
        });
    }
    try {
        const google = await hasGoogleIntegration(uid);
        if (!google)
            throw new Error('Google no conectado');
        const settings = await loadSettings(uid);
        if (!settings.meetSources.length)
            throw new Error('Sin carpetas Meet configuradas');
        await updateSyncProgress(uid, { phase: 'pipeline', current: 1, total: 5, done: false, currentTitle: 'Sincronizando…' });
        const syncResult = await runSync(uid, options?.limit, { finalizeProgress: false, skipInitialProgress: true });
        messages.push(...syncResult.messages);
        await updateSyncProgress(uid, {
            phase: 'reindex',
            current: 2,
            total: 5,
            done: false,
            currentTitle: 'Extrayendo contactos y reuniones…',
        });
        const importResult = await fullImportFromMirrors(uid);
        const { loadStore, saveStore } = await import('./store.js');
        const { rebuildGraphEdges } = await import('./graph-edges.js');
        const { computeStoreHealth } = await import('./store-health.js');
        const afterImport = await loadStore(uid);
        afterImport.graphEdges = rebuildGraphEdges(afterImport);
        await saveStore(uid, afterImport);
        const health = computeStoreHealth(afterImport);
        messages.push(`Importadas ${importResult.meetings} reuniones · ${importResult.people} contactos · ${importResult.prospects} prospects · ${importResult.todosSynced} todos · ${health.projectSuggestionsPending} sugerencias de proyecto.`);
        const { listUserMemberships, ingestMemberStoreToOrg } = await import('./org.js');
        const memberships = await listUserMemberships(uid);
        for (const m of memberships) {
            try {
                const ing = await ingestMemberStoreToOrg(uid, m.orgId);
                if (ing.merged > 0)
                    messages.push(`Org ${m.orgId}: ${ing.merged} reuniones unificadas.`);
                else
                    messages.push(`Org ${m.orgId}: catálogo actualizado.`);
            }
            catch (e) {
                messages.push(`Org ${m.orgId}: ingest omitido (${e instanceof Error ? e.message : String(e)}).`);
            }
        }
        const store = await loadStore(uid);
        let analysisJobId;
        const llm = await listLlmProviders(uid);
        const hasLlm = llm.some((p) => p.keyHint);
        const runAnalysis = !options?.skipAnalysis && settings.ai.autoAnalyzeAfterSync !== false && hasLlm;
        if (runAnalysis) {
            await updateSyncProgress(uid, {
                phase: 'analyze',
                current: 4,
                total: 5,
                done: false,
                currentTitle: 'Analizando con IA…',
            });
            analysisJobId = await runAnalyzeBatch(uid);
            messages.push(`Análisis IA iniciado (job ${analysisJobId}).`);
            // El Suggestion Engine corre al terminar el batch (ver runAnalyzeBatch).
        }
        else if (hasLlm) {
            // Sin batch de análisis pero con key: regenerar sugerencias y digest igual.
            const { runIntelligence } = await import('./suggestion-engine.js');
            void runIntelligence(uid).catch((e) => console.error('[pipeline] intelligence falló:', e));
            messages.push('Sugerencias inteligentes en regeneración.');
        }
        else {
            messages.push('IA omitida: sin API key configurada — modo básico sin sugerencias ni digest.');
        }
        const result = {
            scanned: syncResult.scanned,
            synced: syncResult.synced,
            skipped: syncResult.skipped,
            errors: syncResult.errors,
            imported: store.meetings.length,
            analysisJobId,
            messages,
        };
        await syncLastRunRef(uid).set(stripUndefined({
            startedAt,
            finishedAt: new Date().toISOString(),
            status: syncResult.errors > 0 ? 'partial' : 'ok',
            summary: `Sync ${result.synced} · Import ${result.imported}${analysisJobId ? ' · IA en curso' : ''}`,
            result,
        }));
        if (settings.syncSchedule) {
            await saveSettings(uid, {
                syncSchedule: {
                    ...settings.syncSchedule,
                    lastRunAt: new Date().toISOString(),
                    lastRunStatus: syncResult.errors > 0 ? 'partial' : 'ok',
                    lastRunSummary: `Sync ${result.synced} · Import ${result.imported}`,
                },
            });
        }
        await updateSyncProgress(uid, {
            phase: 'idle',
            current: 5,
            total: 5,
            done: true,
            finishedAt: new Date().toISOString(),
            result: {
                scanned: result.scanned,
                synced: result.synced,
                skipped: result.skipped,
                errors: result.errors,
                imported: result.imported,
                analysisJobId: result.analysisJobId,
                messages,
            },
        });
        return result;
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await syncLastRunRef(uid).set({
            startedAt,
            finishedAt: new Date().toISOString(),
            status: 'error',
            summary: msg,
        });
        await updateSyncProgress(uid, { phase: 'idle', done: true, error: msg, finishedAt: new Date().toISOString() });
        throw e;
    }
}
function localHourMinuteInTimezone(timezone) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '0';
    return {
        hour: parseInt(get('hour'), 10),
        minute: parseInt(get('minute'), 10),
        dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    };
}
function lastRunDateInTimezone(iso, timezone) {
    if (!iso)
        return null;
    const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date(iso));
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shouldRunScheduledSync(schedule) {
    if (!schedule.enabled)
        return false;
    const { hour, minute, dateKey } = localHourMinuteInTimezone(schedule.timezone);
    if (hour !== schedule.hour)
        return false;
    if (minute < schedule.minute)
        return false;
    const lastDate = lastRunDateInTimezone(schedule.lastRunAt, schedule.timezone);
    if (lastDate === dateKey)
        return false;
    return true;
}
export async function runScheduledSyncForAllUsers() {
    const { db } = await import('../lib/firebase.js');
    const snap = await db.collectionGroup('settings').where('syncSchedule.enabled', '==', true).get();
    let triggered = 0;
    let errors = 0;
    for (const doc of snap.docs) {
        if (doc.id !== 'app')
            continue;
        const uid = doc.ref.parent.parent?.id;
        if (!uid)
            continue;
        const data = doc.data();
        const schedule = data.syncSchedule;
        if (!schedule?.enabled || !data.meetSources?.length)
            continue;
        if (!shouldRunScheduledSync(schedule))
            continue;
        const google = await hasGoogleIntegration(uid);
        if (!google)
            continue;
        try {
            await runFullPipeline(uid, { limit: 50 });
            triggered++;
        }
        catch {
            errors++;
        }
    }
    return { triggered, errors };
}
