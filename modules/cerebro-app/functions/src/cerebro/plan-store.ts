import type { ActionPlan } from '../shared/cerebro-chat.js';
import type { EntityRef } from '../shared/cerebro-elements.js';
import { cerebroPlansCol } from '../lib/firebase.js';

const memory = new Map<string, ActionPlan>();

function key(uid: string, planId: string): string {
  return `${uid}:${planId}`;
}

export async function proposePlan(
  uid: string,
  input: {
    title: string;
    summary: string;
    steps: Array<{ id: string; label: string; tool: string; args?: Record<string, unknown>; entityRef?: EntityRef }>;
  },
): Promise<ActionPlan> {
  const { v4: uuidv4 } = await import('uuid');
  const plan: ActionPlan = {
    id: uuidv4(),
    title: input.title,
    summary: input.summary,
    steps: input.steps.map((s) => ({
      id: s.id,
      label: s.label,
      tool: s.tool,
      args: s.args ?? {},
      entityRef: s.entityRef,
    })),
    status: 'proposed',
  };
  memory.set(key(uid, plan.id), plan);
  await cerebroPlansCol(uid).doc(plan.id).set(plan);
  return plan;
}

export async function getPendingPlan(uid: string, planId: string): Promise<ActionPlan | undefined> {
  const cached = memory.get(key(uid, planId));
  if (cached?.status === 'proposed') return cached;
  const snap = await cerebroPlansCol(uid).doc(planId).get();
  if (!snap.exists) return undefined;
  const plan = snap.data() as ActionPlan;
  if (plan.status !== 'proposed') return undefined;
  memory.set(key(uid, planId), plan);
  return plan;
}

export async function confirmPlan(
  uid: string,
  planId: string,
  execute: (tool: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<{ planId: string; results: Array<{ stepId: string; ok: boolean; result?: unknown; error?: string }> }> {
  const plan = await getPendingPlan(uid, planId);
  if (!plan) throw new Error('Plan no encontrado');

  plan.status = 'confirmed';
  await cerebroPlansCol(uid).doc(planId).set(plan, { merge: true });

  const results: Array<{ stepId: string; ok: boolean; result?: unknown; error?: string }> = [];
  for (const step of plan.steps) {
    try {
      const result = await execute(step.tool, step.args);
      results.push({ stepId: step.id, ok: true, result });
    } catch (e) {
      results.push({
        stepId: step.id,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  plan.status = 'completed';
  memory.set(key(uid, planId), plan);
  await cerebroPlansCol(uid).doc(planId).set(plan, { merge: true });
  return { planId, results };
}
