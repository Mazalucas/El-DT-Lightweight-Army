import { executeTool } from './tools.js';
export async function routeToolCall(ctx, name, args) {
    return executeTool(ctx, name, args);
}
