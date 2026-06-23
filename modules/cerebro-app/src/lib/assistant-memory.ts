const STORAGE_PREFIX = 'cerebro.assistant.memory';
const MAX_PROMPTS = 12;

export type PromptMemoryEntry = {
  text: string;
  count: number;
  lastUsed: string;
};

export type ToolMemoryEntry = {
  name: string;
  count: number;
  lastUsed: string;
};

export type AssistantMemory = {
  conversationId?: string;
  recentPrompts: PromptMemoryEntry[];
  recentTools: ToolMemoryEntry[];
  /** ISO — última respuesta del asistente en la conversación guardada */
  lastAssistantReplyAt?: string;
  /** ISO — última vez que el usuario abrió el bubble */
  bubbleLastOpenedAt?: string;
  /** Hay mensajes en la conversación persistida */
  hasSavedThread?: boolean;
  /** ISO — updatedAt de la conversación guardada (Firestore) */
  conversationUpdatedAt?: string;
};

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}.${uid}`;
}

function emptyMemory(): AssistantMemory {
  return { recentPrompts: [], recentTools: [] };
}

export function loadAssistantMemory(uid: string | undefined): AssistantMemory {
  if (!uid) return emptyMemory();
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw) as Partial<AssistantMemory>;
    return {
      conversationId: parsed.conversationId,
      recentPrompts: Array.isArray(parsed.recentPrompts) ? parsed.recentPrompts : [],
      recentTools: Array.isArray(parsed.recentTools) ? parsed.recentTools : [],
      lastAssistantReplyAt: parsed.lastAssistantReplyAt,
      bubbleLastOpenedAt: parsed.bubbleLastOpenedAt,
      hasSavedThread: parsed.hasSavedThread,
      conversationUpdatedAt: parsed.conversationUpdatedAt,
    };
  } catch {
    return emptyMemory();
  }
}

function saveAssistantMemory(uid: string, memory: AssistantMemory): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(memory));
  } catch {
    /* quota / private mode */
  }
}

export function getSavedConversationId(uid: string | undefined): string | undefined {
  return loadAssistantMemory(uid).conversationId;
}

export function saveConversationId(uid: string | undefined, conversationId: string | undefined): void {
  if (!uid) return;
  const memory = loadAssistantMemory(uid);
  memory.conversationId = conversationId;
  saveAssistantMemory(uid, memory);
}

export function clearSavedConversationId(uid: string | undefined): void {
  if (!uid) return;
  const memory = loadAssistantMemory(uid);
  delete memory.conversationId;
  delete memory.lastAssistantReplyAt;
  delete memory.hasSavedThread;
  delete memory.conversationUpdatedAt;
  saveAssistantMemory(uid, memory);
}

export function saveConversationMeta(uid: string | undefined, meta: { updatedAt?: string }): void {
  if (!uid || !meta.updatedAt) return;
  const memory = loadAssistantMemory(uid);
  memory.conversationUpdatedAt = meta.updatedAt;
  saveAssistantMemory(uid, memory);
}

export type AssistantBadgeState = 'none' | 'continued' | 'new';

export function getAssistantBadgeState(uid: string | undefined): AssistantBadgeState {
  if (!uid) return 'none';
  const memory = loadAssistantMemory(uid);
  if (!memory.conversationId) return 'none';

  const hasNewReply =
    Boolean(memory.lastAssistantReplyAt) &&
    (!memory.bubbleLastOpenedAt || memory.lastAssistantReplyAt! > memory.bubbleLastOpenedAt);
  if (hasNewReply) return 'new';

  const hasContinued =
    Boolean(memory.hasSavedThread) &&
    Boolean(memory.conversationUpdatedAt) &&
    (!memory.bubbleLastOpenedAt || memory.bubbleLastOpenedAt < memory.conversationUpdatedAt!);
  if (hasContinued) return 'continued';

  return 'none';
}

export function markSavedThread(uid: string | undefined, hasThread: boolean): void {
  if (!uid) return;
  const memory = loadAssistantMemory(uid);
  memory.hasSavedThread = hasThread;
  if (!hasThread) delete memory.hasSavedThread;
  saveAssistantMemory(uid, memory);
}

export function recordAssistantReply(uid: string | undefined, at?: string): void {
  if (!uid) return;
  const memory = loadAssistantMemory(uid);
  const iso = at ?? new Date().toISOString();
  if (!memory.lastAssistantReplyAt || iso > memory.lastAssistantReplyAt) {
    memory.lastAssistantReplyAt = iso;
  }
  memory.hasSavedThread = true;
  saveAssistantMemory(uid, memory);
}

export function markBubbleOpened(uid: string | undefined): void {
  if (!uid) return;
  const memory = loadAssistantMemory(uid);
  memory.bubbleLastOpenedAt = new Date().toISOString();
  saveAssistantMemory(uid, memory);
}

export function recordPromptUsage(uid: string | undefined, text: string): void {
  if (!uid) return;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4) return;

  const memory = loadAssistantMemory(uid);
  const key = trimmed.toLowerCase();
  const existing = memory.recentPrompts.find((p) => p.text.toLowerCase() === key);
  const now = new Date().toISOString();

  if (existing) {
    existing.count += 1;
    existing.lastUsed = now;
    existing.text = trimmed;
  } else {
    memory.recentPrompts.unshift({ text: trimmed, count: 1, lastUsed: now });
  }

  memory.recentPrompts.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastUsed.localeCompare(a.lastUsed);
  });
  memory.recentPrompts = memory.recentPrompts.slice(0, MAX_PROMPTS);
  saveAssistantMemory(uid, memory);
}

export function recordToolUsage(uid: string | undefined, toolName: string): void {
  if (!uid || !toolName) return;
  const memory = loadAssistantMemory(uid);
  const existing = memory.recentTools.find((t) => t.name === toolName);
  const now = new Date().toISOString();

  if (existing) {
    existing.count += 1;
    existing.lastUsed = now;
  } else {
    memory.recentTools.unshift({ name: toolName, count: 1, lastUsed: now });
  }

  memory.recentTools.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.lastUsed.localeCompare(a.lastUsed);
  });
  memory.recentTools = memory.recentTools.slice(0, 8);
  saveAssistantMemory(uid, memory);
}

export function getTopPrompts(uid: string | undefined, limit = 4): PromptMemoryEntry[] {
  return loadAssistantMemory(uid).recentPrompts.slice(0, limit);
}

export function getTopTools(uid: string | undefined, limit = 3): ToolMemoryEntry[] {
  return loadAssistantMemory(uid).recentTools.slice(0, limit);
}
