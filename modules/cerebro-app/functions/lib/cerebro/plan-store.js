import { cerebroPlansCol } from '../lib/firebase.js';
const memory = new Map();
function key(uid, planId) {
    return `${uid}:${planId}`;
}
export async function proposePlan(uid, input) {
    const { v4: uuidv4 } = await import('uuid');
    const plan = {
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
export async function getPendingPlan(uid, planId) {
    const cached = memory.get(key(uid, planId));
    if (cached?.status === 'proposed')
        return cached;
    const snap = await cerebroPlansCol(uid).doc(planId).get();
    if (!snap.exists)
        return undefined;
    const plan = snap.data();
    if (plan.status !== 'proposed')
        return undefined;
    memory.set(key(uid, planId), plan);
    return plan;
}
export async function confirmPlan(uid, planId, execute) {
    const plan = await getPendingPlan(uid, planId);
    if (!plan)
        throw new Error('Plan no encontrado');
    plan.status = 'confirmed';
    await cerebroPlansCol(uid).doc(planId).set(plan, { merge: true });
    const results = [];
    for (const step of plan.steps) {
        try {
            const result = await execute(step.tool, step.args);
            results.push({ stepId: step.id, ok: true, result });
        }
        catch (e) {
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
