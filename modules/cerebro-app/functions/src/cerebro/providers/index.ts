import { calendarProvider } from './calendar.provider.js';
import { meetingPrepProvider } from './meeting-prep.provider.js';
import { navigationProvider } from './navigation.provider.js';
import { plannerProvider } from './planner.provider.js';
import type { CerebroToolProvider } from './types.js';
import { executeViaProviders, mergeProviderDeclarations } from './types.js';

export const CEREBRO_TOOL_PROVIDERS: CerebroToolProvider[] = [
  calendarProvider,
  meetingPrepProvider,
  navigationProvider,
  plannerProvider,
];

export const CEREBRO_PROVIDER_TOOL_NAMES = new Set(
  CEREBRO_TOOL_PROVIDERS.flatMap((p) => p.toolNames),
);

export const CEREBRO_PROVIDER_DECLARATIONS = mergeProviderDeclarations(CEREBRO_TOOL_PROVIDERS);

export async function executeCerebroProviderTool(
  ctx: import('../../assistant/tool-context.js').ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown | undefined> {
  return executeViaProviders(CEREBRO_TOOL_PROVIDERS, ctx, name, args);
}
