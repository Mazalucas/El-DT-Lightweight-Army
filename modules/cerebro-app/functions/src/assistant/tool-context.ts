export interface ToolContext {
  uid: string;
}

export function createToolContext(uid: string): ToolContext {
  return { uid };
}
