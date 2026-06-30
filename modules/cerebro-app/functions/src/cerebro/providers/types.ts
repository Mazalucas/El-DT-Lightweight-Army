import type { LlmToolDeclaration } from '../../services/llm-service.js';
import type { ToolContext } from '../../assistant/tool-context.js';

export interface CerebroToolProvider {
  id: string;
  toolNames: string[];
  declarations: LlmToolDeclaration[];
  execute(ctx: ToolContext, name: string, args: Record<string, unknown>): Promise<unknown>;
}

export function mergeProviderDeclarations(providers: CerebroToolProvider[]): LlmToolDeclaration[] {
  const map = new Map<string, LlmToolDeclaration>();
  for (const p of providers) {
    for (const d of p.declarations) map.set(d.name, d);
  }
  return [...map.values()];
}

export async function executeViaProviders(
  providers: CerebroToolProvider[],
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown | undefined> {
  for (const p of providers) {
    if (!p.toolNames.includes(name)) continue;
    return p.execute(ctx, name, args);
  }
  return undefined;
}
