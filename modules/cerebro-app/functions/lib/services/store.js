import { decrypt, encrypt, keyHint } from '../lib/crypto.js';
import { facturasRef, llmProviderRef } from '../lib/firebase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getMirrorContent, listMeetings } from './sync.js';
import { jobsCol } from '../lib/firebase.js';
import { fullImportFromMirrors } from './reindex.js';
import { applyAnalysisToStoreInMemory } from '../core/profesional/analysis-apply-store.js';
import { loadStoreFromRepository, saveStoreToRepository, getStoreMeta, migrateStoreToNormalized } from './store-repository.js';
const PROVIDER_DEFAULTS = {
    google_gemini: { label: 'Google Gemini', modelDefault: 'gemini-2.5-flash' },
    openai: { label: 'OpenAI', modelDefault: 'gpt-4o-mini' },
};
export async function listLlmProviders(uid) {
    const ids = ['google_gemini', 'openai'];
    const result = [];
    for (const providerId of ids) {
        const snap = await llmProviderRef(uid, providerId).get();
        const defaults = PROVIDER_DEFAULTS[providerId];
        if (!snap.exists) {
            result.push({
                providerId,
                label: defaults.label,
                keyHint: '',
                modelDefault: defaults.modelDefault,
                enabled: false,
            });
            continue;
        }
        const data = snap.data();
        result.push({
            providerId,
            label: defaults.label,
            keyHint: data.keyHint ?? '',
            modelDefault: data.modelDefault ?? defaults.modelDefault,
            enabled: data.enabled ?? true,
            lastValidatedAt: data.lastValidatedAt,
            lastError: data.lastError,
        });
    }
    return result;
}
export async function setLlmProviderKey(uid, providerId, apiKey, modelDefault) {
    await testLlmKey(providerId, apiKey, modelDefault);
    await llmProviderRef(uid, providerId).set({
        encryptedKey: encrypt(apiKey),
        keyHint: keyHint(apiKey),
        modelDefault: modelDefault ?? PROVIDER_DEFAULTS[providerId].modelDefault,
        enabled: true,
        lastValidatedAt: new Date().toISOString(),
        lastError: null,
    });
    const list = await listLlmProviders(uid);
    return list.find((p) => p.providerId === providerId);
}
export async function deleteLlmProviderKey(uid, providerId) {
    await llmProviderRef(uid, providerId).delete();
}
async function getProviderKey(uid, providerId) {
    const snap = await llmProviderRef(uid, providerId).get();
    if (!snap.exists)
        throw new Error(`No API key for ${providerId}`);
    const data = snap.data();
    if (data.enabled === false)
        throw new Error(`Provider ${providerId} disabled`);
    return { key: decrypt(data.encryptedKey), model: data.modelDefault };
}
export async function testLlmKey(providerId, apiKey, model) {
    if (providerId === 'google_gemini') {
        const gen = new GoogleGenerativeAI(apiKey);
        const m = gen.getGenerativeModel({ model: model ?? 'gemini-2.5-flash' });
        const r = await m.generateContent('Reply with OK');
        if (!r.response.text())
            throw new Error('Empty response from Gemini');
        return;
    }
    if (providerId === 'openai') {
        const client = new OpenAI({ apiKey });
        const r = await client.chat.completions.create({
            model: model ?? 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Reply with OK' }],
            max_tokens: 5,
        });
        if (!r.choices[0]?.message?.content)
            throw new Error('Empty response from OpenAI');
        return;
    }
    throw new Error(`Unknown provider ${providerId}`);
}
export async function testStoredLlmKey(uid, providerId) {
    const { key, model } = await getProviderKey(uid, providerId);
    await testLlmKey(providerId, key, model);
    await llmProviderRef(uid, providerId).set({ lastValidatedAt: new Date().toISOString(), lastError: null }, { merge: true });
}
const ANALYSIS_PROMPT = `Analizá esta reunión y respondé SOLO con JSON válido (sin markdown) con esta forma:
{
  "analysisVersion": 1,
  "id": "uuid",
  "meetingId": "...",
  "summary": "...",
  "actionItems": ["..."],
  "projects": ["..."],
  "people": [{"displayName":"...","teamIds":[]}],
  "themes": ["..."],
  "confidence": "high|medium|low",
  "needsReview": false
}`;
async function callLlm(uid, prompt) {
    const { callUserLlmText } = await import('./llm-service.js');
    return callUserLlmText(uid, prompt, { temperature: 0.3 });
}
export async function analyzeMeeting(uid, meetingId) {
    const md = await getMirrorContent(uid, meetingId);
    if (!md)
        throw new Error('Meeting mirror not found — sync first');
    const body = md.replace(/^---[\s\S]*?---\n/, '').trim();
    const prompt = `${ANALYSIS_PROMPT}\n\nmeetingId: ${meetingId}\n\nContenido:\n${body.slice(0, 120000)}`;
    const raw = await callLlm(uid, prompt);
    const json = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, '').trim());
    json.analysisVersion = 1;
    json.id = json.id || uuidv4();
    json.meetingId = meetingId;
    return json;
}
export async function applyAnalysisToStore(uid, analysis) {
    const store = await loadStore(uid);
    applyAnalysisToStoreInMemory(store, analysis);
    await saveStore(uid, store);
    return store;
}
export async function runAnalyzeBatch(uid, meetingIds) {
    const jobId = uuidv4();
    const ids = meetingIds ?? (await listMeetings(uid)).filter((m) => m.analysisStatus === 'pending').map((m) => m.meetingId);
    await jobsCol(uid).doc(jobId).set({
        id: jobId,
        type: 'analyze_batch',
        status: 'running',
        meetingIds: ids,
        progress: 0,
        total: ids.length,
        createdAt: new Date().toISOString(),
    });
    void (async () => {
        let progress = 0;
        for (const mid of ids) {
            try {
                const analysis = await analyzeMeeting(uid, mid);
                await applyAnalysisToStore(uid, analysis);
            }
            catch (e) {
                await jobsCol(uid).doc(jobId).set({ error: e instanceof Error ? e.message : String(e), status: 'error' }, { merge: true });
                return;
            }
            progress++;
            await jobsCol(uid).doc(jobId).set({ progress }, { merge: true });
        }
        await jobsCol(uid).doc(jobId).set({ status: 'done', finishedAt: new Date().toISOString(), progress: ids.length }, { merge: true });
        // Con los análisis frescos, regenerar sugerencias inteligentes y digest.
        try {
            const { runIntelligence } = await import('./suggestion-engine.js');
            await runIntelligence(uid);
        }
        catch (e) {
            console.error('[analyze-batch] intelligence post-análisis falló:', e);
        }
    })();
    return jobId;
}
export async function getJob(uid, jobId) {
    const snap = await jobsCol(uid).doc(jobId).get();
    return snap.exists ? snap.data() : null;
}
export async function loadStore(uid) {
    return loadStoreFromRepository(uid);
}
export async function saveStore(uid, store) {
    await saveStoreToRepository(uid, store);
}
export { getStoreMeta, migrateStoreToNormalized };
export async function importMeetingsToStore(uid) {
    await fullImportFromMirrors(uid);
    return loadStore(uid);
}
const EMPTY_FACTURAS = {
    emitter: { name: '', taxId: '', address: '' },
    clients: [],
    invoices: [],
    lastInvoiceNumber: 0,
};
export async function loadFacturas(uid) {
    const snap = await facturasRef(uid).get();
    return snap.exists ? snap.data() : { ...EMPTY_FACTURAS };
}
export async function saveFacturas(uid, data) {
    await facturasRef(uid).set(data);
}
