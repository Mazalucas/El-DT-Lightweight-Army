import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { auth } from '../../lib/firebase.js';
import { ASSISTANT_PROMPTS, CATEGORY_LABELS, type PromptCategory } from '../../lib/assistant-catalog.js';
import {
  clearSavedConversationId,
  getSavedConversationId,
  getTopPrompts,
  saveConversationId,
} from '../../lib/assistant-memory.js';
import { Button, EmptyState, PageHeader, toast } from '../ds.js';
import { qk } from '../hooks.js';
import { CerebroPanel } from '../components/cerebro/CerebroPanel.js';

export default function CerebroPage() {
  const uid = auth.currentUser?.uid;
  const client = useQueryClient();
  const [conversationId, setConversationId] = useState<string | undefined>(() => getSavedConversationId(uid));

  useEffect(() => {
    setConversationId(getSavedConversationId(uid));
  }, [uid]);

  const status = useQuery({ queryKey: qk.cerebroStatus, queryFn: api.cerebroStatus, staleTime: 60_000 });
  const conversations = useQuery({
    queryKey: qk.cerebroConversations,
    queryFn: api.cerebroConversations,
    staleTime: 30_000,
  });

  const llmConfigured = status.data?.llmConfigured !== false;
  const recentPrompts = getTopPrompts(uid, 3);
  const groups = new Map<PromptCategory, typeof ASSISTANT_PROMPTS>();
  for (const p of ASSISTANT_PROMPTS) {
    groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  }

  function newConversation() {
    clearSavedConversationId(uid);
    setConversationId(undefined);
  }

  async function deleteConversation(id: string) {
    try {
      await api.deleteCerebroConversation(id);
      if (id === conversationId) newConversation();
      void client.invalidateQueries({ queryKey: qk.cerebroConversations });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
    }
  }

  return (
    <div>
      <PageHeader
        title="Cerebro"
        desc="Copiloto con contexto de pantalla, calendario, planes confirmables y guía visual."
        actions={
          <Button variant="secondary" size="sm" onClick={newConversation}>
            Nueva conversación
          </Button>
        }
      />

      {!llmConfigured ? (
        <EmptyState
          title="Configurá una API key de IA"
          desc="Cerebro necesita Gemini u OpenAI. Andá a Ajustes → IA."
          action={
            <Link to="/ajustes?section=ia" className="btn btn-primary btn-sm">
              Ir a Ajustes
            </Link>
          }
        />
      ) : null}

      <div className="assistant-layout cerebro-page-layout">
        <aside className="assistant-sidebar" aria-label="Historial">
          <div className="assistant-sidebar-head">
            <h2>Conversaciones</h2>
          </div>
          <div className="assistant-conv-list" role="list">
            {(conversations.data?.conversations ?? []).map((c) => (
              <div
                key={c.id}
                role="listitem"
                className={`assistant-conv-item${c.id === conversationId ? ' active' : ''}`}
                onClick={() => {
                  setConversationId(c.id);
                  saveConversationId(uid, c.id);
                }}
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
          </div>
        </aside>

        <main className="assistant-main cerebro-page-main">
          <div className="cerebro-page-panel">
            <CerebroPanel
              conversationId={conversationId}
              onConversationChange={(id) => {
                setConversationId(id);
                if (id) saveConversationId(uid, id);
              }}
            />
          </div>
        </main>

        <aside className="assistant-guide" aria-label="Guía">
          <div className="assistant-guide-block">
            <h2>Qué podés hacer</h2>
            <p className="muted">Cerebro consulta datos reales, propone planes y puede señalar botones en la UI.</p>
          </div>
          {recentPrompts.length ? (
            <div className="assistant-guide-block">
              <h2>Usaste recientemente</h2>
              <div className="assistant-prompt-list">
                {recentPrompts.map((p) => (
                  <span key={p.text} className="assistant-prompt-chip assistant-prompt-chip--recent" title={p.text}>
                    {p.text.length > 40 ? `${p.text.slice(0, 37)}…` : p.text}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {[...groups.entries()].slice(0, 3).map(([cat, items]) => (
            <div key={cat} className="assistant-guide-block">
              <p className="assistant-prompt-cat">{CATEGORY_LABELS[cat]}</p>
              <div className="assistant-prompt-list">
                {items.slice(0, 4).map((item) => (
                  <span key={item.id} className="assistant-prompt-chip" title={item.prompt}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
