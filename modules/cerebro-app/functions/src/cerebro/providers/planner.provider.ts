import type { PlanCardBlock } from '../../shared/cerebro-chat.js';
import type { EntityRef } from '../../shared/cerebro-elements.js';
import type { CerebroToolProvider } from './types.js';
import { confirmPlan, getPendingPlan, proposePlan } from '../plan-store.js';

function parseEntityRef(raw: unknown): EntityRef | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if (!o.kind || !o.id) return undefined;
  return {
    kind: String(o.kind) as EntityRef['kind'],
    id: String(o.id),
    orgId: o.orgId ? String(o.orgId) : undefined,
  };
}

function inferEntityRefFromStep(tool: string, args?: Record<string, unknown>): EntityRef | undefined {
  if (!args) return undefined;
  if (tool.includes('todo') && args.todoId) return { kind: 'todo', id: String(args.todoId) };
  if (tool === 'highlight_entity' && args.kind && args.id) {
    return { kind: String(args.kind) as EntityRef['kind'], id: String(args.id) };
  }
  return undefined;
}

function toPlanCard(plan: Awaited<ReturnType<typeof proposePlan>>): PlanCardBlock {
  return {
    type: 'plan_card',
    planId: plan.id,
    title: plan.title,
    summary: plan.summary,
    steps: plan.steps.map((s) => ({
      id: s.id,
      label: s.label,
      tool: s.tool,
      entityRef: s.entityRef,
      status: 'pending',
    })),
    status: 'proposed',
  };
}

export const plannerProvider: CerebroToolProvider = {
  id: 'planner',
  toolNames: ['propose_action_plan', 'confirm_plan'],
  declarations: [
    {
      name: 'propose_action_plan',
      description: 'Propone un plan de acción multi-paso para confirmación del usuario.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                tool: { type: 'string' },
                args: { type: 'object' },
                entityRef: {
                  type: 'object',
                  properties: {
                    kind: { type: 'string' },
                    id: { type: 'string' },
                    orgId: { type: 'string' },
                  },
                  required: ['kind', 'id'],
                },
              },
              required: ['id', 'label', 'tool'],
            },
          },
        },
        required: ['title', 'summary', 'steps'],
      },
    },
    {
      name: 'confirm_plan',
      description: 'Ejecuta un plan previamente propuesto (planId de propose_action_plan).',
      parameters: {
        type: 'object',
        properties: { planId: { type: 'string' } },
        required: ['planId'],
      },
    },
  ],
  async execute(ctx, name, args) {
    const uid = ctx.uid;
    if (name === 'propose_action_plan') {
      const plan = await proposePlan(uid, {
        title: String(args.title ?? 'Plan'),
        summary: String(args.summary ?? ''),
        steps:
          (args.steps as Array<{
            id: string;
            label: string;
            tool: string;
            args?: Record<string, unknown>;
            entityRef?: EntityRef;
          }>)?.map((s) => ({
            id: s.id,
            label: s.label,
            tool: s.tool,
            args: s.args ?? {},
            entityRef:
              parseEntityRef(s.entityRef) ?? inferEntityRefFromStep(s.tool, s.args ?? {}),
          })) ?? [],
      });
      const block = toPlanCard(plan);
      ctx.cerebro?.emitBlock?.(block);
      if (ctx.cerebro?.conversationId) {
        const { updateConversationMetadata } = await import('../../assistant/conversation.service.js');
        await updateConversationMetadata(uid, ctx.cerebro.conversationId, { pendingPlanId: plan.id });
      }
      return { planId: plan.id, status: plan.status, steps: plan.steps.length };
    }
    if (name === 'confirm_plan') {
      const planId = String(args.planId ?? '');
      const plan = await getPendingPlan(uid, planId);
      if (!plan) return { error: 'Plan no encontrado o ya ejecutado' };
      const { executeTool } = await import('../../assistant/tools.js');
      const executed = await confirmPlan(uid, planId, (tool, toolArgs) => executeTool(ctx, tool, toolArgs));
      if (ctx.cerebro?.conversationId) {
        const { updateConversationMetadata } = await import('../../assistant/conversation.service.js');
        await updateConversationMetadata(uid, ctx.cerebro.conversationId, { pendingPlanId: undefined });
      }
      return executed;
    }
    throw new Error(`planner provider: ${name}`);
  },
};
