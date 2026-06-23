import { v4 as uuidv4 } from 'uuid';
import { assistantConversationsCol } from '../lib/firebase.js';
export async function listConversations(uid, limit = 30) {
    const snap = await assistantConversationsCol(uid).orderBy('updatedAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => d.data());
}
export async function getConversation(uid, id) {
    const snap = await assistantConversationsCol(uid).doc(id).get();
    return snap.exists ? snap.data() : null;
}
export async function createConversation(uid, title) {
    const now = new Date().toISOString();
    const conv = {
        id: uuidv4(),
        title: title ?? 'Nueva conversación',
        messages: [],
        createdAt: now,
        updatedAt: now,
    };
    await assistantConversationsCol(uid).doc(conv.id).set(conv);
    return conv;
}
export async function appendMessages(uid, conversationId, messages, title) {
    const ref = assistantConversationsCol(uid).doc(conversationId);
    const snap = await ref.get();
    const now = new Date().toISOString();
    if (!snap.exists) {
        const conv = {
            id: conversationId,
            title: title ?? messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? 'Conversación',
            messages,
            createdAt: now,
            updatedAt: now,
        };
        await ref.set(conv);
        return conv;
    }
    const existing = snap.data();
    const updated = {
        ...existing,
        title: title ?? existing.title,
        messages: [...existing.messages, ...messages],
        updatedAt: now,
    };
    await ref.set(updated);
    return updated;
}
export async function deleteConversation(uid, id) {
    await assistantConversationsCol(uid).doc(id).delete();
}
