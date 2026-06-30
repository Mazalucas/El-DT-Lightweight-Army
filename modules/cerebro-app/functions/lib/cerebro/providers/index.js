import { calendarProvider } from './calendar.provider.js';
import { meetingPrepProvider } from './meeting-prep.provider.js';
import { navigationProvider } from './navigation.provider.js';
import { plannerProvider } from './planner.provider.js';
import { executeViaProviders, mergeProviderDeclarations } from './types.js';
export const CEREBRO_TOOL_PROVIDERS = [
    calendarProvider,
    meetingPrepProvider,
    navigationProvider,
    plannerProvider,
];
export const CEREBRO_PROVIDER_TOOL_NAMES = new Set(CEREBRO_TOOL_PROVIDERS.flatMap((p) => p.toolNames));
export const CEREBRO_PROVIDER_DECLARATIONS = mergeProviderDeclarations(CEREBRO_TOOL_PROVIDERS);
export async function executeCerebroProviderTool(ctx, name, args) {
    return executeViaProviders(CEREBRO_TOOL_PROVIDERS, ctx, name, args);
}
