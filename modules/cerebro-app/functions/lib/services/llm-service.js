import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import OpenAI from 'openai';
import { decrypt } from '../lib/crypto.js';
import { llmProviderRef } from '../lib/firebase.js';
import { loadSettings } from '../lib/settings.js';
const PROVIDER_DEFAULTS = {
    google_gemini: { modelDefault: 'gemini-2.5-flash' },
    openai: { modelDefault: 'gpt-4o-mini' },
};
export async function getUserLlmCredentials(uid, providerId) {
    const settings = await loadSettings(uid);
    const pid = providerId ?? settings.ai.defaultProviderId;
    const snap = await llmProviderRef(uid, pid).get();
    if (!snap.exists) {
        throw new Error(`No hay API key configurada para ${pid}. Configurala en Ajustes → Proveedores IA.`);
    }
    const data = snap.data();
    if (data.enabled === false)
        throw new Error(`Proveedor ${pid} deshabilitado`);
    return {
        providerId: pid,
        key: decrypt(data.encryptedKey),
        model: data.modelDefault ?? PROVIDER_DEFAULTS[pid].modelDefault,
    };
}
export async function userHasLlmKey(uid) {
    try {
        await getUserLlmCredentials(uid);
        return true;
    }
    catch {
        return false;
    }
}
export async function callUserLlmText(uid, prompt, opts) {
    const { providerId, key, model } = await getUserLlmCredentials(uid);
    if (providerId === 'google_gemini') {
        const gen = new GoogleGenerativeAI(key);
        const m = gen.getGenerativeModel({
            model,
            systemInstruction: opts?.systemInstruction,
        });
        const r = await m.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: opts?.temperature ?? 0.4,
                maxOutputTokens: opts?.maxTokens ?? 8192,
            },
        });
        return r.response.text();
    }
    const client = new OpenAI({ apiKey: key });
    const messages = [];
    if (opts?.systemInstruction) {
        messages.push({ role: 'system', content: opts.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });
    const r = await client.chat.completions.create({
        model,
        messages,
        temperature: opts?.temperature ?? 0.4,
        max_tokens: opts?.maxTokens ?? 8192,
    });
    return r.choices[0]?.message?.content ?? '';
}
export async function callUserLlmJson(uid, prompt, opts) {
    const { providerId, key, model } = await getUserLlmCredentials(uid);
    if (providerId === 'google_gemini') {
        const gen = new GoogleGenerativeAI(key);
        const m = gen.getGenerativeModel({
            model,
            systemInstruction: opts?.systemInstruction,
        });
        const r = await m.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: opts?.temperature ?? 0.2,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
            },
        });
        return r.response.text();
    }
    const client = new OpenAI({ apiKey: key });
    const messages = [];
    if (opts?.systemInstruction)
        messages.push({ role: 'system', content: opts.systemInstruction });
    messages.push({ role: 'user', content: prompt });
    const r = await client.chat.completions.create({
        model,
        messages,
        temperature: opts?.temperature ?? 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 2048,
    });
    return r.choices[0]?.message?.content ?? '{}';
}
function toGeminiDeclarations(tools) {
    return tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
            type: SchemaType.OBJECT,
            properties: t.parameters?.properties ?? {},
            required: t.parameters?.required ?? [],
        },
    }));
}
function toOpenAiTools(tools) {
    return tools.map((t) => ({
        type: 'function',
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters ?? { type: 'object', properties: {} },
        },
    }));
}
export async function callUserLlmWithTools(uid, opts) {
    const { providerId, key, model } = await getUserLlmCredentials(uid);
    if (providerId === 'google_gemini') {
        const gen = new GoogleGenerativeAI(key);
        const m = gen.getGenerativeModel({
            model,
            systemInstruction: opts.systemInstruction,
            tools: [{ functionDeclarations: toGeminiDeclarations(opts.tools) }],
        });
        const contents = opts.contents.map((c) => ({
            role: c.role,
            parts: c.parts.map((p) => {
                if ('text' in p)
                    return { text: p.text };
                if ('functionCall' in p)
                    return { functionCall: p.functionCall };
                return { functionResponse: p.functionResponse };
            }),
        }));
        const r = await m.generateContent({
            contents,
            generationConfig: {
                temperature: opts.temperature ?? 0.4,
                maxOutputTokens: opts.maxTokens ?? 8192,
            },
        });
        const parts = r.response.candidates?.[0]?.content?.parts ?? [];
        const functionCalls = [];
        let text = '';
        for (const part of parts) {
            if ('text' in part && part.text)
                text += part.text;
            if ('functionCall' in part && part.functionCall) {
                functionCalls.push({
                    name: part.functionCall.name,
                    args: (part.functionCall.args ?? {}),
                });
            }
        }
        return { text: text || undefined, functionCalls: functionCalls.length ? functionCalls : undefined };
    }
    const client = new OpenAI({ apiKey: key });
    const messages = [
        { role: 'system', content: opts.systemInstruction },
    ];
    for (const block of opts.contents) {
        if (block.role === 'user') {
            const toolResults = block.parts.filter((p) => 'functionResponse' in p);
            if (toolResults.length) {
                for (const tr of toolResults) {
                    if ('functionResponse' in tr) {
                        messages.push({
                            role: 'tool',
                            tool_call_id: tr.functionResponse.name,
                            content: JSON.stringify(tr.functionResponse.response),
                        });
                    }
                }
                continue;
            }
            const textPart = block.parts.find((p) => 'text' in p);
            if (textPart && 'text' in textPart) {
                messages.push({ role: 'user', content: textPart.text });
            }
        }
        else {
            const fcParts = block.parts.filter((p) => 'functionCall' in p);
            if (fcParts.length) {
                messages.push({
                    role: 'assistant',
                    tool_calls: fcParts.map((p, i) => {
                        const fc = 'functionCall' in p ? p.functionCall : { name: '', args: {} };
                        return {
                            id: `call_${i}`,
                            type: 'function',
                            function: { name: fc.name, arguments: JSON.stringify(fc.args) },
                        };
                    }),
                });
            }
            const textPart = block.parts.find((p) => 'text' in p);
            if (textPart && 'text' in textPart) {
                messages.push({ role: 'assistant', content: textPart.text });
            }
        }
    }
    const r = await client.chat.completions.create({
        model,
        messages,
        tools: toOpenAiTools(opts.tools),
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 8192,
    });
    const msg = r.choices[0]?.message;
    const functionCalls = (msg?.tool_calls ?? []).map((tc) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || '{}'),
    }));
    return {
        text: msg?.content ?? undefined,
        functionCalls: functionCalls.length ? functionCalls : undefined,
    };
}
