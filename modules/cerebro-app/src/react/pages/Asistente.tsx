import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { auth } from '../../lib/firebase.js';
import {
  ASSISTANT_PROMPTS,
  CATEGORY_LABELS,
  labelForTool,
  type PromptCategory,
} from '../../lib/assistant-catalog.js';
import {
  clearSavedConversationId,
  getSavedConversationId,
  getTopPrompts,
  recordPromptUsage,
  saveConversationId,
} from '../../lib/assistant-memory.js';
import { Button, EmptyState, Icon, PageHeader, toast } from '../ds.js';
import { qk } from '../hooks.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tools?: string[];
  streaming?: boolean;
}

export default function Asistente() {
  const uid = auth.currentUser?.uid;
  const client = useQueryClient();
  const [conversationId, setConversationId] = useState<string | undefined>(() => getSavedConversationId(uid));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const status = useQuery({ queryKey: qk.assistantStatus, queryFn: api.assistantStatus, staleTime: 60_000 });
  const conversations = useQuery({
    queryKey: qk.assistantConversations,
    queryFn: api.assistantConversations,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    api
      .getAssistantConversation(conversationId)
      .then((conv) => {
        if (cancelled) return;
        setMessages(
          conv.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              tools: m.toolCalls?.map((t) => labelForTool(t.name)),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) {
          clearSavedConversationId(uid);
          setConversationId(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, uid]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, activity]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setInput('');
    recordPromptUsage(uid, message);
    setMessages((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '', streaming: true }]);

    const tools: string[] = [];
    try {
      await api.assistantChat(message, conversationId, { route: 'assistant', pageTitle: 'Asistente' }, (event) => {
        if (event.type === 'conversation' && event.conversationId) {
          setConversationId(event.conversationId);
          saveConversationId(uid, event.conversationId);
        }
        if (event.type === 'tool_call' && event.name) {
          const label = labelForTool(event.name);
          tools.push(label);
          setActivity(label + '…');
        }
        if (event.type === 'delta' && event.delta) {
          setActivity(null);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + event.delta, tools: [...tools] };
            }
            return next;
          });
        }
        if (event.type === 'error') {
          toast(event.message ?? 'Error del asistente', 'error');
        }
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
      setMessages((prev) => prev.filter((m) => !(m.streaming && !m.content)));
    } finally {
      setActivity(null);
      setSending(false);
      setMessages((prev) => prev.map((m) => ({ ...m, streaming: false })));
      void client.invalidateQueries({ queryKey: qk.assistantConversations });
    }
  }

  function newConversation() {
    clearSavedConversationId(uid);
    setConversationId(undefined);
    setMessages([]);
  }

  async function deleteConversation(id: string) {
    try {
      await api.deleteAssistantConversation(id);
      if (id === conversationId) newConversation();
      void client.invalidateQueries({ queryKey: qk.assistantConversations });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  const llmConfigured = status.data?.llmConfigured !== false;
  const recentPrompts = getTopPrompts(uid, 3);
  const groups = new Map<PromptCategory, typeof ASSISTANT_PROMPTS>();
  for (const p of ASSISTANT_PROMPTS) {
    groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  }

  return (
    <div>
      <PageHeader
        title="Asistente"
        desc="Preguntá y actuá sobre tu cerebro con datos reales — reuniones, contactos, tareas y sync."
        actions={
          <Button variant="secondary" size="sm" onClick={newConversation}>
            Nueva conversación
          </Button>
        }
      />

      {!llmConfigured ? (
        <EmptyState
          title="Configurá una API key de IA"
          desc="El asistente necesita Gemini u OpenAI. Andá a Ajustes → IA para cargar tu key."
        />
      ) : null}

      <div className="assistant-layout">
        <aside className="assistant-sidebar" aria-label="Historial de conversaciones">
          <div className="assistant-sidebar-head">
            <h2>Conversaciones</h2>
          </div>
          <div className="assistant-conv-list" role="list">
            {(conversations.data?.conversations ?? []).map((c) => (
              <div
                key={c.id}
                role="listitem"
                className={`assistant-conv-item${c.id === conversationId ? ' active' : ''}`}
                onClick={() => setConversationId(c.id)}
                style={{ cursor: 'pointer' }}
              >
                <span className="assistant-conv-title">{c.title || 'Sin título'}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Eliminar conversación"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteConversation(c.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {!conversations.data?.conversations.length ? (
              <p className="muted" style={{ padding: 'var(--space-3)' }}>
                Sin conversaciones aún.
              </p>
            ) : null}
          </div>
        </aside>

        <main className="assistant-main">
          {activity ? (
            <div className="assistant-activity" role="status">
              {activity}
            </div>
          ) : null}
          <div className="assistant-thread" ref={threadRef} role="log" aria-live="polite">
            {messages.length === 0 ? (
              <p className="muted">Empezá una conversación o elegí un prompt de la derecha.</p>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`assistant-msg assistant-msg--${m.role}`}>
                  {m.tools?.length ? (
                    <p className="row-meta">{m.tools.join(' · ')}</p>
                  ) : null}
                  <div className="md-content">{m.content || (m.streaming ? '…' : '')}</div>
                </div>
              ))
            )}
          </div>
          <form
            className="assistant-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label className="visually-hidden" htmlFor="assistant-input">
              Mensaje al asistente
            </label>
            <textarea
              id="assistant-input"
              className="assistant-input"
              rows={2}
              placeholder="Escribí tu pregunta…"
              value={input}
              disabled={sending || !llmConfigured}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <Button type="submit" loading={sending} disabled={!llmConfigured || !input.trim()}>
              Enviar
            </Button>
          </form>
        </main>

        <aside className="assistant-guide" aria-label="Guía y sugerencias">
          <div className="assistant-guide-block">
            <h2>Qué podés hacer</h2>
            <p className="muted">El asistente consulta tu cerebro en tiempo real y puede iniciar sync o reparación.</p>
            <ul className="assistant-cap-list">
              <li>
                <Icon name="users" /> Contactos y prospects
              </li>
              <li>
                <Icon name="calendar" /> Reuniones y notas
              </li>
              <li>
                <Icon name="check" /> Tareas y sugerencias
              </li>
              <li>
                <Icon name="share" /> Grafo de relaciones
              </li>
            </ul>
          </div>
          <div className="assistant-guide-block">
            <h2>Empezá con…</h2>
            {recentPrompts.length ? (
              <div className="assistant-prompt-group">
                <p className="assistant-prompt-cat">Usaste recientemente</p>
                <div className="assistant-prompt-list">
                  {recentPrompts.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      className="assistant-prompt-chip assistant-prompt-chip--recent"
                      title={p.text}
                      onClick={() => setInput(p.text)}
                    >
                      {p.text.length > 40 ? `${p.text.slice(0, 37)}…` : p.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {[...groups.entries()].map(([cat, items]) => (
              <div key={cat} className="assistant-prompt-group">
                <p className="assistant-prompt-cat">{CATEGORY_LABELS[cat]}</p>
                <div className="assistant-prompt-list">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="assistant-prompt-chip"
                      title={item.prompt}
                      onClick={() => setInput(item.prompt)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
