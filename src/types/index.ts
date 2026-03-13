/**
 * Agent Gateway Types
 */

export type AgentStatus = 'idle' | 'loading' | 'thinking' | 'working' | 'completed' | 'error';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface TaskResult {
  content: string;
  usage?: Usage;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model?: string;
  systemPrompt?: string;
  config?: AgentConfig;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  result?: TaskResult;
  messages?: Message[];
}

export interface ChatOptions {
  messages?: Message[];
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  onStatusChange?: (status: AgentStatus) => void;
}

export interface ChatResponse {
  content: string;
  usage?: Usage;
  done: boolean;
}
