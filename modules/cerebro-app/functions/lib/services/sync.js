import { google } from 'googleapis';
import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { bucket, meetingsCol, mirrorPath, syncRef } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { loadSettings } from '../lib/settings.js';
import { fetchDocParsed, fetchDrivePermissions, getGoogleClient } from './google.js';
import { buildMarkdownBody } from '../core/profesional/doc-to-parsed.js';
import { parseDateFromMeetFilename } from '../shared/parse-meet-filename.js';
import { resolveMeetingStartedAt } from '../shared/meeting-dates.js';
import { pickLatestIso } from '../shared/recency-sort.js';
import { filterByProcessLookback, isWithinProcessLookback, processLookbackLabel, resolveProcessLookbackDays, sortByMeetingDateDesc, } from '../shared/sync-policy.js';
function meetingIdFromDocId(docId) {
    return crypto.createHash('sha256').update(docId).digest('hex').slice(0, 16);
}
/** Título seguro para UI de progreso (manifest legacy puede tener title no-string). */
export function progressTitle(value) {
    if (value == null || value === '')
        return 'Reunión';
    return typeof value === 'string' ? value : String(value);
}
function scoreEntry(e) {
    let score = 0;
    if (e.syncStatus === 'synced')
        score += 4;
    if (e.lastSyncedAt)
        score += 2;
    if (e.teamId)
        score += 1;
    return score;
}
/** Combina metadata de Drive con manifest existente — no resetea reuniones ya sincronizadas. */
function mergeDriveFileWithExisting(file, source, existing) {
    const docId = file.mimeType === 'application/vnd.google-apps.document' ? file.id ?? undefined : undefined;
    const fileId = file.id ?? '';
    const meetingId = docId
        ? meetingIdFromDocId(docId)
        : crypto.createHash('sha256').update(fileId).digest('hex').slice(0, 16);
    const parsed = parseDateFromMeetFilename(file.name ?? 'Reunión');
    const resolvedStartedAt = parsed.startedAt ?? existing?.startedAt;
    const driveModifiedTime = file.modifiedTime ?? file.createdTime ?? undefined;
    const scanFields = stripUndefined({
        meetingId,
        docId,
        driveFileId: file.id ?? undefined,
        sourceFile: file.name ?? '',
        title: parsed.title || existing?.title || 'Reunión',
        startedAt: resolvedStartedAt,
        timezone: parsed.timezone ?? existing?.timezone,
        teamId: source.teamId,
        driveFolderId: source.driveFolderId,
        driveModifiedTime: file.modifiedTime ?? file.createdTime ?? undefined,
    });
    if (!existing) {
        return stripUndefined({
            ...scanFields,
            syncStatus: 'discovered',
            analysisStatus: 'pending',
        });
    }
    const driveChanged = Boolean(driveModifiedTime) &&
        (!existing.driveModifiedTime || driveModifiedTime !== existing.driveModifiedTime);
    const needsResync = existing.syncStatus === 'synced' &&
        driveChanged &&
        Boolean(existing.driveModifiedTime);
    if (existing.syncStatus === 'synced' && !needsResync) {
        return stripUndefined({
            ...existing,
            ...scanFields,
            syncStatus: 'synced',
            analysisStatus: existing.analysisStatus,
            lastSyncedAt: existing.lastSyncedAt,
            contentHash: existing.contentHash,
            driveModifiedTime: driveModifiedTime ?? existing.driveModifiedTime,
        });
    }
    if (needsResync) {
        const resetAnalysis = existing.analysisStatus === 'analyzed' || existing.analysisStatus === 'needs_review';
        return stripUndefined({
            ...existing,
            ...scanFields,
            syncStatus: 'content_pending',
            analysisStatus: resetAnalysis ? 'pending' : existing.analysisStatus,
        });
    }
    return stripUndefined({
        ...existing,
        ...scanFields,
    });
}
/** Unifica entradas que apuntan al mismo Google Doc (docId). */
function consolidateByDocId(entries) {
    const byDocId = new Map();
    const noDoc = [];
    for (const entry of entries) {
        if (entry.docId) {
            const list = byDocId.get(entry.docId) ?? [];
            list.push(entry);
            byDocId.set(entry.docId, list);
        }
        else {
            noDoc.push(entry);
        }
    }
    let merged = 0;
    const result = [...noDoc];
    for (const [docId, group] of byDocId) {
        if (group.length === 1) {
            const canonicalId = meetingIdFromDocId(docId);
            const e = group[0];
            result.push(e.meetingId === canonicalId ? e : { ...e, meetingId: canonicalId, docId });
            if (e.meetingId !== canonicalId)
                merged++;
            continue;
        }
        const canonicalId = meetingIdFromDocId(docId);
        const sorted = [...group].sort((a, b) => scoreEntry(b) - scoreEntry(a));
        const primary = sorted[0];
        result.push({
            ...primary,
            meetingId: canonicalId,
            docId,
            title: primary.title || sorted.find((e) => e.title)?.title || canonicalId,
            startedAt: primary.startedAt ?? sorted.find((e) => e.startedAt)?.startedAt,
            teamId: primary.teamId ?? sorted.find((e) => e.teamId)?.teamId,
            syncStatus: sorted.some((e) => e.syncStatus === 'synced') ? 'synced' : primary.syncStatus,
            lastSyncedAt: primary.lastSyncedAt ?? sorted.find((e) => e.lastSyncedAt)?.lastSyncedAt,
            contentHash: primary.contentHash ?? sorted.find((e) => e.contentHash)?.contentHash,
        });
        merged += group.length - 1;
    }
    return { entries: result.map((e) => stripUndefined(e)), merged };
}
export async function markSyncStarting(uid, initial) {
    const startedAt = initial.startedAt ?? new Date().toISOString();
    await syncRef(uid).set(stripUndefined({ ...initial, startedAt, done: false }), { merge: true });
    await syncRef(uid).update({
        error: FieldValue.delete(),
        result: FieldValue.delete(),
        finishedAt: FieldValue.delete(),
    });
    return startedAt;
}
const MIRROR_CHECK_BATCH = 25;
async function mirrorExists(uid, meetingId) {
    const [exists] = await bucket.file(mirrorPath(uid, meetingId)).exists();
    return exists;
}
/** Manifest synced pero sin archivo en Storage → forzar re-descarga. */
async function flagMissingMirrorsForResync(uid, entries, lookbackDays) {
    const candidates = entries.filter((e) => e.syncStatus === 'synced' && isWithinProcessLookback(e, lookbackDays));
    let flagged = 0;
    for (let i = 0; i < candidates.length; i += MIRROR_CHECK_BATCH) {
        const batch = candidates.slice(i, i + MIRROR_CHECK_BATCH);
        const checked = await Promise.all(batch.map(async (entry) => ({
            entry,
            exists: await mirrorExists(uid, entry.meetingId),
        })));
        for (const { entry, exists } of checked) {
            if (exists)
                continue;
            flagged++;
            entry.syncStatus = 'content_pending';
            await meetingsCol(uid).doc(entry.meetingId).set({
                syncStatus: 'content_pending',
                syncError: FieldValue.delete(),
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        }
    }
    return flagged;
}
export async function updateSyncProgress(uid, patch) {
    await syncRef(uid).set(stripUndefined(patch), { merge: true });
}
export async function getSyncProgress(uid) {
    const snap = await syncRef(uid).get();
    return snap.exists ? snap.data() : null;
}
export async function scanDriveSources(uid) {
    const settings = await loadSettings(uid);
    const auth = await getGoogleClient(uid);
    const drive = google.drive({ version: 'v3', auth: auth });
    const existingList = await listMeetings(uid);
    const existingByMeetingId = new Map(existingList.map((e) => [e.meetingId, e]));
    const existingByDocId = new Map(existingList.filter((e) => e.docId).map((e) => [e.docId, e]));
    const rawEntries = [];
    for (const source of settings.meetSources) {
        const q = `'${source.driveFolderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.document' or mimeType='text/plain' or mimeType='text/markdown')`;
        let pageToken;
        do {
            const res = await drive.files.list({
                q,
                fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,createdTime)',
                pageSize: 100,
                pageToken,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            for (const f of res.data.files ?? []) {
                if (!f.id)
                    continue;
                const docId = f.mimeType === 'application/vnd.google-apps.document' ? f.id : undefined;
                const meetingId = docId
                    ? meetingIdFromDocId(docId)
                    : crypto.createHash('sha256').update(f.id).digest('hex').slice(0, 16);
                const existing = (docId ? existingByDocId.get(docId) : undefined) ?? existingByMeetingId.get(meetingId);
                rawEntries.push(mergeDriveFileWithExisting(f, { driveFolderId: source.driveFolderId, teamId: source.teamId }, existing));
            }
            pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);
    }
    const { entries, merged } = consolidateByDocId(rawEntries);
    for (const e of entries) {
        await meetingsCol(uid)
            .doc(e.meetingId)
            .set(stripUndefined({ ...e, updatedAt: new Date().toISOString() }), { merge: true });
    }
    return { scanned: entries.length, entries, merged };
}
export async function runSync(uid, limit, options) {
    const startedAt = new Date().toISOString();
    if (!options?.skipInitialProgress) {
        await markSyncStarting(uid, {
            phase: 'scan',
            current: 0,
            total: 0,
            currentTitle: 'Escaneando…',
            startedAt,
        });
    }
    try {
        const settings = await loadSettings(uid);
        const lookbackDays = resolveProcessLookbackDays(settings.syncPolicy);
        const { entries, merged } = await scanDriveSources(uid);
        const missingMirrors = await flagMissingMirrorsForResync(uid, entries, lookbackDays);
        const pendingRaw = entries.filter((e) => e.syncStatus !== 'synced');
        const { inWindow: inLookback, skipped: outsideLookback } = filterByProcessLookback(pendingRaw, lookbackDays);
        const pending = sortByMeetingDateDesc(inLookback);
        const toProcess = limit ? pending.slice(0, limit) : pending;
        const total = toProcess.length;
        let synced = 0;
        let skipped = 0;
        let errors = 0;
        const syncedMeetingIds = [];
        const messages = [`Índice: ${entries.length} archivos.`];
        if (merged > 0)
            messages.push(`${merged} duplicado(s) unificado(s) por docId.`);
        if (missingMirrors > 0) {
            messages.push(`${missingMirrors} reunión(es) sin mirror — marcadas para re-descarga.`);
        }
        if (lookbackDays > 0) {
            messages.push(`Ventana de procesamiento: ${processLookbackLabel(lookbackDays)}.`);
        }
        if (outsideLookback > 0) {
            messages.push(`${outsideLookback} reunión(es) fuera de ventana (${processLookbackLabel(lookbackDays)}) — omitidas del sync.`);
        }
        if (total === 0)
            messages.push('Sin reuniones nuevas o modificadas para sincronizar.');
        await updateSyncProgress(uid, {
            phase: 'sync',
            current: 0,
            total,
            done: false,
            currentTitle: toProcess[0] ? progressTitle(toProcess[0].title) : 'Sin cambios en Drive',
        });
        for (let i = 0; i < toProcess.length; i++) {
            const entry = toProcess[i];
            await updateSyncProgress(uid, { current: i + 1, total, currentTitle: progressTitle(entry.title) });
            try {
                let body = '';
                let parsedDoc;
                let sharedWith = [];
                if (entry.docId) {
                    parsedDoc = await fetchDocParsed(uid, entry.docId);
                    body = buildMarkdownBody(parsedDoc);
                    sharedWith = await fetchDrivePermissions(uid, entry.docId);
                }
                else if (entry.driveFileId) {
                    const auth = await getGoogleClient(uid);
                    const drive = google.drive({ version: 'v3', auth: auth });
                    const res = await drive.files.get({ fileId: entry.driveFileId, alt: 'media', supportsAllDrives: true }, { responseType: 'text' });
                    body = String(res.data ?? '');
                }
                if (!body.trim()) {
                    skipped++;
                    await meetingsCol(uid).doc(entry.meetingId).set({ syncStatus: 'skipped', syncError: 'empty_content', updatedAt: new Date().toISOString() }, { merge: true });
                    continue;
                }
                const contentHash = crypto.createHash('sha256').update(body).digest('hex');
                const md = buildMirrorMarkdown(entry, body, contentHash, sharedWith, parsedDoc);
                const file = bucket.file(mirrorPath(uid, entry.meetingId));
                await file.save(md, { contentType: 'text/markdown', metadata: { cacheControl: 'private' } });
                await meetingsCol(uid)
                    .doc(entry.meetingId)
                    .set(stripUndefined({
                    ...entry,
                    syncStatus: 'synced',
                    lastSyncedAt: new Date().toISOString(),
                    contentHash,
                    driveModifiedTime: entry.driveModifiedTime,
                    bodyPreview: body.slice(0, 400),
                    updatedAt: new Date().toISOString(),
                }), { merge: true });
                synced++;
                syncedMeetingIds.push(entry.meetingId);
            }
            catch (e) {
                errors++;
                const msg = e instanceof Error ? e.message : String(e);
                await meetingsCol(uid).doc(entry.meetingId).set({ syncStatus: 'sync_error', syncError: msg, updatedAt: new Date().toISOString() }, { merge: true });
            }
        }
        const result = { scanned: entries.length, synced, skipped, errors, messages, syncedMeetingIds };
        if (options?.finalizeProgress !== false) {
            await updateSyncProgress(uid, {
                phase: 'idle',
                done: true,
                finishedAt: new Date().toISOString(),
                result: { scanned: entries.length, synced, skipped, errors, messages },
            });
        }
        return result;
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (options?.finalizeProgress !== false) {
            await updateSyncProgress(uid, {
                phase: 'idle',
                done: true,
                error: msg,
                finishedAt: new Date().toISOString(),
            });
        }
        throw e;
    }
}
function buildMirrorMarkdown(entry, body, contentHash, sharedWith, parsedDoc) {
    const startedAt = resolveMeetingStartedAt({
        startedAt: entry.startedAt,
        sourceFile: entry.sourceFile,
        title: entry.title,
        timezone: entry.timezone,
    });
    const fm = stripUndefined({
        meetingId: entry.meetingId,
        docId: entry.docId,
        sourceFile: entry.sourceFile,
        title: entry.title,
        startedAt,
        timezone: entry.timezone,
        teamId: entry.teamId,
        contentHash,
        syncVersion: 3,
        syncedAt: new Date().toISOString(),
        participants: parsedDoc?.participants.length ? parsedDoc.participants : undefined,
        invitees: parsedDoc?.invitees.length ? parsedDoc.invitees : undefined,
        mentionedEmails: parsedDoc?.mentionedEmails.length ? parsedDoc.mentionedEmails : undefined,
        summary: parsedDoc?.summary,
        sharedWith: sharedWith.length ? sharedWith : undefined,
    });
    return `---\n${Object.entries(fm).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n# ${entry.title}\n\n${body}\n`;
}
/** Re-descarga mirrors synced con parser estructurado (chips Person + emails). */
export async function resyncAllSyncedMirrors(uid, options) {
    const settings = await loadSettings(uid);
    const lookbackDays = resolveProcessLookbackDays(settings.syncPolicy);
    const allSynced = (await listMeetings(uid)).filter((e) => e.syncStatus === 'synced' && e.docId);
    const { inWindow: entries, skipped: skippedOutsideWindow } = filterByProcessLookback(allSynced, lookbackDays);
    let updated = 0;
    let errors = 0;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        await options?.onProgress?.(i + 1, entries.length, progressTitle(entry.title));
        try {
            const parsedDoc = await fetchDocParsed(uid, entry.docId);
            const body = buildMarkdownBody(parsedDoc);
            const contentHash = crypto.createHash('sha256').update(body).digest('hex');
            const sharedWith = options?.skipPermissions ? [] : await fetchDrivePermissions(uid, entry.docId);
            const md = buildMirrorMarkdown(entry, body, contentHash, sharedWith, parsedDoc);
            const file = bucket.file(mirrorPath(uid, entry.meetingId));
            await file.save(md, { contentType: 'text/markdown', metadata: { cacheControl: 'private' } });
            await meetingsCol(uid).doc(entry.meetingId).set(stripUndefined({
                contentHash,
                lastSyncedAt: new Date().toISOString(),
                driveModifiedTime: entry.driveModifiedTime,
                updatedAt: new Date().toISOString(),
            }), { merge: true });
            updated++;
        }
        catch (e) {
            errors++;
            console.warn(`resync mirror ${entry.meetingId}`, e);
        }
    }
    return { updated, errors, total: entries.length, skippedOutsideWindow };
}
export async function getMirrorContent(uid, meetingId) {
    const file = bucket.file(mirrorPath(uid, meetingId));
    const [exists] = await file.exists();
    if (!exists)
        return null;
    const [buf] = await file.download();
    return buf.toString('utf8');
}
export async function listMeetings(uid) {
    try {
        const snap = await meetingsCol(uid).orderBy('updatedAt', 'desc').limit(500).get();
        return snap.docs.map((d) => d.data());
    }
    catch (err) {
        console.warn('listMeetings orderBy failed, using unsorted fallback', err);
        const snap = await meetingsCol(uid).limit(500).get();
        return snap.docs.map((d) => d.data());
    }
}
/** Timestamp canónico de última sync manual o programada (varias fuentes en Firestore). */
export async function resolveLastSyncAt(uid) {
    const { syncLastRunRef } = await import('../lib/firebase.js');
    const { loadSettings } = await import('../lib/settings.js');
    const [settings, lastRunSnap, progress] = await Promise.all([
        loadSettings(uid),
        syncLastRunRef(uid).get(),
        getSyncProgress(uid),
    ]);
    const lastRun = lastRunSnap.data();
    return pickLatestIso(settings.syncSchedule?.lastRunAt, lastRun?.finishedAt, progress?.finishedAt);
}
