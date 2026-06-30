import type { ToolRun } from '../../../lib/assistant-tool-ui.js';
import { labelForTool } from '../../../lib/assistant-catalog.js';

export type ProcessingStepKind = 'status' | 'plan' | 'tool';

export type ProcessingStepPhase = 'active' | 'done';

export interface ProcessingStep {
  id: string;
  kind: ProcessingStepKind;
  label: string;
  sublabel?: string;
  phase: ProcessingStepPhase;
  toolStatus?: ToolRun['status'];
}

export interface ProcessingState {
  steps: ProcessingStep[];
  toolRuns: ToolRun[];
}

export const EMPTY_PROCESSING: ProcessingState = { steps: [], toolRuns: [] };

function markStatusStepsDone(steps: ProcessingStep[]): ProcessingStep[] {
  return steps.map((s) => (s.kind === 'status' && s.phase === 'active' ? { ...s, phase: 'done' } : s));
}

function finishActiveSteps(steps: ProcessingStep[]): ProcessingStep[] {
  return steps.map((s) => (s.phase === 'active' ? { ...s, phase: 'done' } : s));
}

export function applyStatusEvent(state: ProcessingState, message: string): ProcessingState {
  const steps = [
    ...markStatusStepsDone(state.steps),
    {
      id: `status-${state.steps.length}-${message}`,
      kind: 'status' as const,
      label: message,
      phase: 'active' as const,
    },
  ];
  return { ...state, steps };
}

export function applyPlanEvent(
  state: ProcessingState,
  plan: { domains: string[]; intent: string; summary: string; suggestedTools: string[] },
): ProcessingState {
  const steps = [
    ...markStatusStepsDone(state.steps),
    {
      id: `plan-${state.steps.length}`,
      kind: 'plan' as const,
      label: plan.summary || plan.intent,
      sublabel: plan.domains.length ? plan.domains.join(' · ') : undefined,
      phase: 'done' as const,
    },
  ];
  return { ...state, steps };
}

export function applyToolCallEvent(
  state: ProcessingState,
  name: string,
  args?: Record<string, unknown>,
): ProcessingState {
  const label = labelForTool(name);
  const toolRuns: ToolRun[] = [...state.toolRuns, { name, args, status: 'running' }];
  const steps: ProcessingStep[] = [
    ...markStatusStepsDone(state.steps),
    {
      id: `tool-${toolRuns.length - 1}-${name}`,
      kind: 'tool',
      label,
      phase: 'active',
      toolStatus: 'running',
    },
  ];
  return { steps, toolRuns };
}

export function applyToolResultEvent(state: ProcessingState, name: string, result: unknown): ProcessingState {
  let targetIdx = -1;
  for (let i = state.toolRuns.length - 1; i >= 0; i--) {
    if (state.toolRuns[i]!.name === name && state.toolRuns[i]!.status === 'running') {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx < 0) return state;

  const status: ToolRun['status'] =
    result && typeof result === 'object' && 'error' in (result as object) ? 'error' : 'done';

  const toolRuns = state.toolRuns.map((run, i) =>
    i === targetIdx ? { ...run, result, status } : run,
  );

  const steps = state.steps.map((step) =>
    step.id === `tool-${targetIdx}-${name}`
      ? { ...step, phase: 'done' as const, toolStatus: status }
      : step,
  );

  return { steps, toolRuns };
}

export function applyTextStarted(state: ProcessingState): ProcessingState {
  return {
    steps: finishActiveSteps(state.steps),
    toolRuns: state.toolRuns,
  };
}

export function toolRunsFromHistory(
  toolCalls: Array<{ name: string; args?: Record<string, unknown>; result?: unknown }>,
): ToolRun[] {
  return toolCalls.map((t) => ({
    name: t.name,
    args: t.args,
    result: t.result,
    status:
      t.result && typeof t.result === 'object' && 'error' in (t.result as object) ? 'error' : 'done',
  }));
}

export function stepsFromToolRuns(toolRuns: ToolRun[]): ProcessingStep[] {
  return toolRuns.map((run, i) => ({
    id: `tool-${i}-${run.name}`,
    kind: 'tool',
    label: labelForTool(run.name),
    phase: 'done',
    toolStatus: run.status,
  }));
}
