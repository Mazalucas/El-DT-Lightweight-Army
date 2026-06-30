import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CerebroContentBlock, EntityEffect, MomentCardBlock, PlanCardBlock, UiCue } from '@shared/cerebro-chat.js';
import { api } from '../../../lib/api.js';
import {
  buildCerebroClientContext,
  cerebroWelcomeMessage,
  dismissMoment as persistMomentDismiss,
  loadDismissedMoments,
  markMomentDelivered,
  resolveMomentKey,
  shouldSurfaceProactiveMoment,
} from '../../../lib/cerebro-context.js';
import { saveConversationId } from '../../../lib/assistant-memory.js';
import { labelForTool } from '../../../lib/assistant-catalog.js';
import { useAuth } from '../../auth.js';
import { useSettings } from '../../hooks.js';
import { Button, Icon, toast } from '../../ds.js';
import { useCerebroUi } from './CerebroProvider.js';
import { useOptionalEntityActionBus } from '../../lib/entity-action/EntityActionBus.js';
import { useEntityLifecycleStore } from '../../lib/entity-action/entity-lifecycle-store.js';
import { BlockRenderer } from './BlockRenderer.js';
import { CerebroProcessingTrace } from './CerebroProcessingTrace.js';
import { MarkdownContent } from '../MarkdownContent.js';
import type { ToolRun } from '../../../lib/assistant-tool-ui.js';
import {
  applyPlanEvent,
  applyStatusEvent,
  applyTextStarted,
  applyToolCallEvent,
  applyToolResultEvent,
  EMPTY_PROCESSING,
  stepsFromToolRuns,
  toolRunsFromHistory,
  type ProcessingStep,
} from './processing-stream.js';

interface ThreadItem {
  role: 'user' | 'assistant' | 'moment';
  text?: string;
  blocks?: CerebroContentBlock[];
  tools?: string[];
  streaming?: boolean;
  processingSteps?: ProcessingStep[];
  toolRuns?: ToolRun[];
}

export function CerebroPanel({
  compact,
  conversationId: controlledConversationId,
  onConversationChange,
}: {
  compact?: boolean;
  conversationId?: string;
  onConversationChange?: (id: string | undefined) => void;
}) {
  const { user } = useAuth();
  const settings = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const { applyCue, pendingMoment, clearPendingMoment, contextData, pendingPrompt, clearPendingPrompt, meetingPrepFocus, clearMeetingPrepFocus } = useCerebroUi();
  const entityBus = useOptionalEntityActionBus();
  const focusedEntity = useEntityLifecycleStore((s) => s.focusedEntity);
  const uid = user?.uid;
  const [internalConversationId, setInternalConversationId] = useState<string | undefined>(controlledConversationId);
  const conversationId = controlledConversationId ?? internalConversationId;
  const setConversationId = (id: string | undefined) => {
    setInternalConversationId(id);
    onConversationChange?.(id);
  };

  const [items, setItems] = useState<ThreadItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      clearPendingPrompt();
    }
  }, [pendingPrompt, clearPendingPrompt]);

  const clientContext = buildCerebroClientContext({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    user,
    conversationId,
    preferences: settings.data?.cerebro
      ? {
          proactiveLevel: settings.data.cerebro.proactiveLevel,
          meetingReminderMinutes: settings.data.cerebro.meetingReminderMinutes,
          chipMeetingMinutesMax: settings.data.cerebro.chipMeetingMinutesMax,
          liveElements: settings.data.cerebro.liveElements,
        }
      : undefined,
    settings: settings.data ?? null,
    focusedEntity,
    meetingPrepFocus,
  });

  const chip = contextData?.chip;
  const screenChip = chip?.kind === 'screen' ? chip.label : clientContext.navigation.pageTitle;
  const meetingChip = chip?.kind === 'meeting' ? chip : null;

  useEffect(() => {
    api.cerebroStatus().then((s) => setLlmConfigured(s.llmConfigured)).catch(() => setLlmConfigured(false));
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    api
      .getAssistantConversation(conversationId)
      .then((conv) => {
        if (cancelled) return;
        setItems(
          conv.messages
            .filter((m) => m.role !== 'system')
            .map((m) => {
              const toolRuns = m.toolCalls?.length ? toolRunsFromHistory(m.toolCalls) : undefined;
              return {
                role: m.role as 'user' | 'assistant',
                text: m.content,
                tools: m.toolCalls?.map((t) => labelForTool(t.name)),
                toolRuns,
                processingSteps: toolRuns?.length ? stepsFromToolRuns(toolRuns) : undefined,
              };
            }),
        );
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!pendingMoment) return;
    if (!shouldSurfaceProactiveMoment(pendingMoment)) {
      clearPendingMoment();
      return;
    }
    markMomentDelivered(resolveMomentKey(pendingMoment));
    setItems((prev) => [...prev, { role: 'moment', blocks: [pendingMoment] }]);
    clearPendingMoment();
  }, [pendingMoment, clearPendingMoment]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [items]);

  async function dismissMoment(block: MomentCardBlock) {
    const key = resolveMomentKey(block);
    persistMomentDismiss(key);
    if (conversationId) {
      try {
        await api.cerebroDismissMoment(conversationId, key);
      } catch {
        /* session fallback */
      }
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setInput('');
    setItems((prev) => [
      ...prev,
      { role: 'user', text: message },
      {
        role: 'assistant',
        text: '',
        blocks: [],
        streaming: true,
        processingSteps: [{ id: 'boot', kind: 'status', label: 'Preparando…', phase: 'active' }],
        toolRuns: [],
      },
    ]);

    const tools: string[] = [];
    let textStarted = false;
    try {
      await api.cerebroChat(message, conversationId, clientContext, loadDismissedMoments(), (event) => {
        const type = String(event.type ?? '');
        if (type === 'done' && typeof event.conversationId === 'string') {
          setConversationId(event.conversationId);
          saveConversationId(uid, event.conversationId);
        }
        if (type === 'ui_cue' && event.cue && typeof event.cue === 'object') {
          applyCue(event.cue as UiCue);
        }
        if (type === 'entity_effect' && event.effect && typeof event.effect === 'object') {
          entityBus?.applyEffect(event.effect as EntityEffect);
        }
        if (type === 'status' && typeof event.message === 'string') {
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== 'assistant') return prev;
            const updated = applyStatusEvent(
              { steps: last.processingSteps ?? [], toolRuns: last.toolRuns ?? [] },
              event.message as string,
            );
            next[next.length - 1] = { ...last, processingSteps: updated.steps, toolRuns: updated.toolRuns };
            return next;
          });
        }
        if (type === 'plan' && event.plan && typeof event.plan === 'object') {
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== 'assistant') return prev;
            const updated = applyPlanEvent(
              { steps: last.processingSteps ?? [], toolRuns: last.toolRuns ?? [] },
              event.plan as {
                domains: string[];
                intent: string;
                summary: string;
                suggestedTools: string[];
              },
            );
            next[next.length - 1] = { ...last, processingSteps: updated.steps, toolRuns: updated.toolRuns };
            return next;
          });
        }
        if (type === 'block' && event.block && typeof event.block === 'object') {
          const block = event.block as CerebroContentBlock;
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = {
                ...last,
                blocks: [...(last.blocks ?? []), block],
              };
            }
            return next;
          });
        }
        if (type === 'proactive_moment' && event.moment && typeof event.moment === 'object') {
          const moment = event.moment as MomentCardBlock;
          if (shouldSurfaceProactiveMoment(moment)) {
            markMomentDelivered(resolveMomentKey(moment));
            setItems((prev) => [...prev, { role: 'moment', blocks: [moment] }]);
          }
        }
        if (type === 'tool_call' && typeof event.name === 'string') {
          const label = labelForTool(event.name);
          tools.push(label);
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== 'assistant') return prev;
            const updated = applyToolCallEvent(
              { steps: last.processingSteps ?? [], toolRuns: last.toolRuns ?? [] },
              event.name as string,
              event.args as Record<string, unknown> | undefined,
            );
            next[next.length - 1] = {
              ...last,
              processingSteps: updated.steps,
              toolRuns: updated.toolRuns,
              tools: [...tools],
            };
            return next;
          });
        }
        if (type === 'tool_result' && typeof event.name === 'string') {
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== 'assistant') return prev;
            const updated = applyToolResultEvent(
              { steps: last.processingSteps ?? [], toolRuns: last.toolRuns ?? [] },
              event.name as string,
              event.result,
            );
            next[next.length - 1] = { ...last, processingSteps: updated.steps, toolRuns: updated.toolRuns };
            return next;
          });
        }
        if (type === 'text' && typeof event.delta === 'string') {
          if (!textStarted) {
            textStarted = true;
            setItems((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role !== 'assistant') return prev;
              const updated = applyTextStarted({
                steps: last.processingSteps ?? [],
                toolRuns: last.toolRuns ?? [],
              });
              next[next.length - 1] = {
                ...last,
                processingSteps: updated.steps,
                toolRuns: updated.toolRuns,
                text: event.delta as string,
                tools: [...tools],
              };
              return next;
            });
            return;
          }
          setItems((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, text: (last.text ?? '') + event.delta, tools: [...tools] };
            }
            return next;
          });
        }
        if (type === 'error' && typeof event.message === 'string') {
          toast(event.message ?? 'Error de Cerebro', 'error');
        }
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error', 'error');
      setItems((prev) => prev.filter((m) => !(m.streaming && !m.text && !(m.blocks?.length))));
    } finally {
      setSending(false);
      clearMeetingPrepFocus();
      setItems((prev) =>
        prev.map((m) => {
          if (!m.streaming) return m;
          const processingSteps = m.processingSteps?.map((s) =>
            s.phase === 'active' ? { ...s, phase: 'done' as const } : s,
          );
          return { ...m, streaming: false, processingSteps };
        }),
      );
    }
  }

  function handleBlockAction(payload: string, block?: PlanCardBlock) {
    if (payload.startsWith('#') || payload.startsWith('/')) {
      navigate(payload.startsWith('#') ? payload.replace(/^#/, '') : payload);
      return;
    }
    if (payload.startsWith('http')) {
      window.open(payload, '_blank', 'noopener');
      return;
    }
    if (payload.startsWith('confirm_plan:') || block?.planId) {
      const planId = payload.startsWith('confirm_plan:')
        ? payload.slice('confirm_plan:'.length)
        : block!.planId;
      void send(`Confirmá y ejecutá el plan ${planId}`);
      return;
    }
    if (payload.startsWith('cancel_plan:')) {
      void send('Cancelá el plan propuesto');
      return;
    }
    void send(payload);
  }

  const welcome =
    items.length === 0
      ? cerebroWelcomeMessage(clientContext.navigation.pageTitle, clientContext.user?.firstName)
      : null;

  return (
    <div className={`cerebro-panel${compact ? ' cerebro-panel--compact' : ''}`}>
      <header className="cerebro-panel-header">
        <div>
          <h2 className="cerebro-panel-title">Cerebro</h2>
          <div className="cerebro-panel-chips">
            <span className="cerebro-chip cerebro-chip--screen">{screenChip}</span>
            {meetingChip ? (
              <button
                type="button"
                className="cerebro-chip cerebro-chip--meeting"
                onClick={() => {
                  if (meetingChip.meetLink) window.open(meetingChip.meetLink, '_blank', 'noopener');
                  else if (meetingChip.meetingId) navigate(`/reuniones/${meetingChip.meetingId}`);
                }}
              >
                {meetingChip.label}
              </button>
            ) : null}
          </div>
        </div>
        {compact ? (
          <div className="cerebro-panel-actions">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cerebro')} aria-label="Pantalla completa">
              <Icon name="chevron" />
            </Button>
          </div>
        ) : null}
      </header>

      {!llmConfigured ? (
        <p className="cerebro-panel-warn">
          Configurá tu API key en{' '}
          <button type="button" className="btn btn-link" onClick={() => navigate('/ajustes?section=ia')}>
            Ajustes → IA
          </button>
          .
        </p>
      ) : null}

      <div className="cerebro-thread" ref={threadRef} role="log" aria-live="polite">
        {welcome ? <p className="cerebro-welcome muted">{welcome}</p> : null}
        {items.map((item, i) => (
          <div key={i} className={`cerebro-msg cerebro-msg--${item.role}${item.streaming ? ' cerebro-msg--streaming' : ''}`}>
            {item.role === 'assistant' ? (
              <CerebroProcessingTrace
                steps={item.processingSteps ?? EMPTY_PROCESSING.steps}
                toolRuns={item.toolRuns ?? EMPTY_PROCESSING.toolRuns}
                streaming={item.streaming}
                hasContent={Boolean(item.text || item.blocks?.length)}
              />
            ) : null}
            {item.blocks?.map((b, j) => (
              <BlockRenderer
                key={j}
                block={b}
                conversationId={conversationId}
                onDismissMoment={dismissMoment}
                onAction={(payload) =>
                  handleBlockAction(payload, b.type === 'plan_card' ? b : undefined)
                }
              />
            ))}
            {item.text ? <MarkdownContent content={item.text} /> : null}
          </div>
        ))}
      </div>

      <form
        className="cerebro-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <textarea
          className="cerebro-input"
          rows={compact ? 1 : 2}
          placeholder="Escribí a Cerebro…"
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
    </div>
  );
}
