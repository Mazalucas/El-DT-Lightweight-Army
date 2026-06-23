import { v4 as uuidv4 } from 'uuid';
import { assistantConversationsCol } from '../lib/firebase.js';
import type { AssistantConversation, AssistantMessage } from './types.js';

export async function listConversations(uid: string, limit = 30): Promise<AssistantConversation[]> {
  const snap = await assistantConversationsCol(uid).orderBy('updatedAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data() as AssistantConversation);
}

export async function getConversation(uid: string, id: string): Promise<AssistantConversation | null> {
  const snap = await assistantConversationsCol(uid).doc(id).get();
  return snap.exists ? (snap.data() as AssistantConversation) : null;
}

export async function createConversation(uid: string, title?: string): Promise<AssistantConversation> {
  const now = new Date().toISOString();
  const conv: AssistantConversation = {
    id: uuidv4(),
    title: title ?? 'Nueva conversación',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  await assistantConversationsCol(uid).doc(conv.id).set(conv);
  return conv;
}

export async function appendMessages(
  uid: string,
  conversationId: string,
  messages: AssistantMessage[],
  title?: string,
): Promise<AssistantConversation> {
  const ref = assistantConversationsCol(uid).doc(conversationId);
  const snap = await ref.get();
  const now = new Date().toISOString();
  if (!snap.exists) {
    const conv: AssistantConversation = {
      id: conversationId,
      title: title ?? messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? 'Conversación',
      messages,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(conv);
    return conv;
  }
  const existing = snap.data() as AssistantConversation;
  const updated: AssistantConversation = {
    ...existing,
    title: title ?? existing.title,
    messages: [...existing.messages, ...messages],
    updatedAt: now,
  };
  await ref.set(updated);
  return updated;
}

export async function deleteConversation(uid: string, id: string): Promise<void> {
  await assistantConversationsCol(uid).doc(id).delete();
}
