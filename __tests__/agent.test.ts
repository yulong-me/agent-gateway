import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../src/agent/Agent.js';

// Mock the claude-cli module
vi.mock('../src/agent/claude-cli.js', () => ({
  callClaudeCLI: vi.fn().mockResolvedValue({
    content: 'Hello! How can I help you?',
    usage: { inputTokens: 100, outputTokens: 50 },
  }),
  checkClaudeCLI: vi.fn().mockResolvedValue({ available: true, version: '1.0.0' }),
}));

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      role: 'assistant',
      model: 'claude-sonnet-4-6',
      systemPrompt: 'You are a helpful assistant.',
    });
  });

  describe('constructor', () => {
    it('should create agent with required properties', () => {
      expect(agent.id).toBe('test-agent');
      expect(agent.name).toBe('Test Agent');
      expect(agent.role).toBe('assistant');
      expect(agent.status).toBe('idle');
    });

    it('should set default model if not provided', () => {
      const agent2 = new Agent({
        id: 'agent-2',
        name: 'Agent 2',
        role: 'assistant',
      });
      expect(agent2.model).toBe('claude-sonnet-4-6');
    });
  });

  describe('status transitions', () => {
    it('should start from idle status', () => {
      expect(agent.status).toBe('idle');
    });

    it('should update status correctly', () => {
      agent.status = 'thinking';
      expect(agent.status).toBe('thinking');

      agent.status = 'working';
      expect(agent.status).toBe('working');

      agent.status = 'completed';
      expect(agent.status).toBe('completed');
    });

    it('should allow status to error', () => {
      agent.status = 'error';
      expect(agent.status).toBe('error');
    });
  });

  describe('chat', () => {
    it('should throw error if CLI not available', async () => {
      const { checkClaudeCLI } = await import('../src/agent/claude-cli.js');
      vi.mocked(checkClaudeCLI).mockResolvedValueOnce({
        available: false,
        error: 'CLI not found',
      });

      await expect(agent.chat('Hello')).rejects.toThrow('Claude CLI 不可用');
    });

    it('should return chat response', async () => {
      const response = await agent.chat('Hello');
      expect(response.content).toBe('Hello! How can I help you?');
      expect(response.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
    });

    it('should update status during chat', async () => {
      const statusChanges: string[] = [];
      agent.on('statusChange', (status) => {
        statusChanges.push(status);
      });

      await agent.chat('Hello');

      expect(statusChanges).toContain('loading');
      expect(statusChanges).toContain('thinking');
      expect(statusChanges).toContain('completed');
    });
  });

  describe('events', () => {
    it('should support event listeners', () => {
      const callback = vi.fn();
      agent.on('statusChange', callback);
      agent.on('message', callback);

      agent.emit('statusChange', 'thinking');
      agent.emit('message', 'Hello');

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should support one-time listeners', () => {
      const callback = vi.fn();
      agent.once('statusChange', callback);

      agent.emit('statusChange', 'thinking');
      agent.emit('statusChange', 'completed');

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
