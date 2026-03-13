import type { AgentStatus, ChatOptions, ChatResponse, Message } from '../types/index.js';
import { callClaudeCLI, checkClaudeCLI, type ClaudeResponse } from './claude-cli.js';

interface AgentOptions {
  id: string;
  name: string;
  role: string;
  model?: string;
  systemPrompt?: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
  };
}

type EventCallback = (...args: unknown[]) => void;

export class Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  systemPrompt: string;
  status: AgentStatus = 'idle';

  private eventListeners: Map<string, EventCallback[]> = new Map();
  private messageHistory: Message[] = [];

  constructor(options: AgentOptions) {
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.model = options.model || 'claude-sonnet-4-6';
    this.systemPrompt = options.systemPrompt || 'You are a helpful AI assistant.';
  }

  /**
   * Send a chat message and get response
   */
  async chat(content: string, options?: ChatOptions): Promise<ChatResponse> {
    // Check CLI availability
    const cliCheck = await checkClaudeCLI();
    if (!cliCheck.available) {
      throw new Error(`Claude CLI 不可用: ${cliCheck.error}`);
    }

    // Add user message to history
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.messageHistory.push(userMessage);

    // Update status
    this.status = 'loading';
    this.emit('statusChange', 'loading');

    try {
      this.status = 'thinking';
      this.emit('statusChange', 'thinking');

      // Stream callback for real-time output
      let fullContent = '';

      const response = await callClaudeCLI(
        {
          command: 'claude',
          model: this.model,
        },
        this.systemPrompt,
        content,
        {
          onChunk: (chunk: string) => {
            fullContent += chunk;
            if (options?.onChunk) {
              options.onChunk(chunk);
            }
          },
        }
      );

      // Add assistant message to history
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };
      this.messageHistory.push(assistantMessage);

      this.status = 'completed';
      this.emit('statusChange', 'completed');

      return {
        content: fullContent,
        usage: response.usage,
        done: true,
      };
    } catch (error) {
      this.status = 'error';
      this.emit('statusChange', 'error');
      throw error;
    }
  }

  /**
   * Get message history
   */
  getHistory(): Message[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (...args: unknown[]) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(...args);
      }
    }
  }
}
