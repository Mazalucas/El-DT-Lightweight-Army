import type { ToolContext } from './tool-context.js';
import { executeTool } from './tools.js';

export async function routeToolCall(
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return executeTool(ctx, name, args);
}
