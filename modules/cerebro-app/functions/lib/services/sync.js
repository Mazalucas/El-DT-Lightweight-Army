import { google } from 'googleapis';
import crypto from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { bucket, meetingsCol, mirrorPath, syncRef } from '../lib/firebase.js';
import { stripUndefined } from '../lib/firestore-utils.js';
import { loadSettings } from '../lib/settings.js';
import { fetchDocParsed, fetchDrivePermissions, getGoogleClient } from './google.js';
import { buildMarkdownBody } from '../core/profesional/doc-to-parsed.js';
function meetingIdFromDocId(docId) {
    return crypto.createHash('sha256').update(docId).digest('hex').slice(0, 16);
}
/** Título seguro para UI de progreso (manifest legacy puede tener title no-string). */
export function progressTitle(value) {
    if (value == null || value === '')
        return 'Reunión';
    return typeof value === 'string' ? value : String(value);
}
function parseMeetTitle(name) {
    const base = name.replace(/\s*-\s*Notas de Gemini\s*$/i, '').replace(/\.[^.]+$/, '');
    const m = base.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)$/);
    if (m)
        return { startedAt: m[1], title: m[2].trim() };
    return { title: base.trim() };
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
    await syncRef(uid).update({ error: FieldValue.delete(), result: FieldValue.delete() });
    return startedAt;
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
                const docId = f.mimeType === 'application/vnd.google-apps.document' ? f.id : undefined;
                const meetingId = docId ? meetingIdFromDocId(docId) : crypto.createHash('sha256').update(f.id).digest('hex').slice(0, 16);
                const parsed = parseMeetTitle(f.name ?? 'Reunión');
                rawEntries.push(stripUndefined({
                    meetingId,
                    docId,
                    driveFileId: f.id ?? undefined,
                    sourceFile: f.name ?? '',
                    title: parsed.title,
                    startedAt: parsed.startedAt,
                    teamId: source.teamId,
                    syncStatus: 'discovered',
                    analysisStatus: 'pending',
                    driveFolderId: source.driveFolderId,
                }));
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
        const { entries, merged } = await scanDriveSources(uid);
        const pending = entries.filter((e) => e.syncStatus !== 'synced');
        const toProcess = limit ? pending.slice(0, limit) : pending;
        const total = toProcess.length;
        let synced = 0;
        let skipped = 0;
        let errors = 0;
        const messages = [`Índice: ${entries.length} archivos.`];
        if (merged > 0)
            messages.push(`${merged} duplicado(s) unificado(s) por docId.`);
        await updateSyncProgress(uid, {
            phase: 'sync',
            current: 0,
            total,
            done: false,
            currentTitle: toProcess[0] ? progressTitle(toProcess[0].title) : undefined,
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
                    bodyPreview: body.slice(0, 400),
                    updatedAt: new Date().toISOString(),
                }), { merge: true });
                synced++;
            }
            catch (e) {
                errors++;
                const msg = e instanceof Error ? e.message : String(e);
                await meetingsCol(uid).doc(entry.meetingId).set({ syncStatus: 'sync_error', syncError: msg, updatedAt: new Date().toISOString() }, { merge: true });
            }
        }
        const result = { scanned: entries.length, synced, skipped, errors, messages };
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
    const fm = stripUndefined({
        meetingId: entry.meetingId,
        docId: entry.docId,
        sourceFile: entry.sourceFile,
        title: entry.title,
        startedAt: entry.startedAt,
        teamId: entry.teamId,
        syncedAt: new Date().toISOString(),
        contentHash,
        syncVersion: 3,
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
    const entries = (await listMeetings(uid)).filter((e) => e.syncStatus === 'synced' && e.docId);
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
                updatedAt: new Date().toISOString(),
            }), { merge: true });
            updated++;
        }
        catch (e) {
            errors++;
            console.warn(`resync mirror ${entry.meetingId}`, e);
        }
    }
    return { updated, errors, total: entries.length };
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
