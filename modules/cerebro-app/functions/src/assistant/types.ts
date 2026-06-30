export type AssistantDomain =
  | 'health'
  | 'meetings'
  | 'contacts'
  | 'inbox'
  | 'maintenance'
  | 'sync'
  | 'graph'
  | 'actions';

export interface OrchestratorPlan {
  domains: AssistantDomain[];
  intent: string;
  summary: string;
  suggestedTools: string[];
}

export interface AssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: unknown }>;
}

export interface AssistantConversationMetadata {
  focusTopic?: string;
  dismissedMoments?: string[];
  pendingPlanId?: string;
  sessionArtifacts?: Record<string, string>;
}

export interface AssistantConversation {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: AssistantConversationMetadata;
}

export type AssistantPageContext = {
  route?: string;
  pageTitle?: string;
  pageDescription?: string;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  orgRole?: string;
  profTab?: string;
  meetingId?: string;
  settingsSection?: string;
  orgId?: string;
};

export type AssistantSseEvent =
  | { type: 'status'; message: string }
  | { type: 'plan'; plan: OrchestratorPlan }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: unknown }
  | { type: 'text'; delta: string }
  | { type: 'done'; conversationId: string; message: string }
  | { type: 'error'; message: string };
