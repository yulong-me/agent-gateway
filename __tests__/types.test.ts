import { describe, it, expect } from 'vitest';
import type { Agent, AgentConfig, AgentDefinition, Message, Task, TaskResult } from '../src/types/index.js';

describe('Agent Types', () => {
  describe('AgentStatus', () => {
    it('should have valid status values', () => {
      const statuses = ['idle', 'loading', 'thinking', 'working', 'completed', 'error'] as const;
      expect(statuses).toContain('idle');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('error');
    });
  });

  describe('Agent', () => {
    it('should validate required Agent properties', () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        role: 'assistant',
        status: 'idle',
        model: 'claude-sonnet-4-6',
        systemPrompt: 'You are a helpful assistant.',
      };

      expect(agent.id).toBe('test-agent');
      expect(agent.name).toBe('Test Agent');
      expect(agent.status).toBe('idle');
      expect(agent.model).toBe('claude-sonnet-4-6');
    });

    it('should allow optional properties', () => {
      const agent: Agent = {
        id: 'test-agent',
        name: 'Test Agent',
        role: 'assistant',
        status: 'idle',
      };

      expect(agent.model).toBeUndefined();
      expect(agent.systemPrompt).toBeUndefined();
    });
  });

  describe('Message', () => {
    it('should validate required Message properties', () => {
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      expect(message.id).toBe('msg-1');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello');
      expect(message.timestamp).toBeDefined();
    });

    it('should support assistant role with tool calls', () => {
      const message: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'I will help you.',
        timestamp: Date.now(),
        toolCalls: [
          {
            id: 'tool-1',
            name: 'Bash',
            input: { command: 'ls -la' },
          },
        ],
      };

      expect(message.role).toBe('assistant');
      expect(message.toolCalls).toHaveLength(1);
      expect(message.toolCalls?.[0].name).toBe('Bash');
    });
  });

  describe('Task', () => {
    it('should validate task structure', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(task.id).toBe('task-1');
      expect(task.status).toBe('pending');
      expect(task.result).toBeUndefined();
    });

    it('should support completed task with result', () => {
      const task: Task = {
        id: 'task-2',
        title: 'Completed Task',
        status: 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        result: {
          content: 'Task completed successfully',
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      };

      expect(task.status).toBe('completed');
      expect(task.result?.content).toBe('Task completed successfully');
      expect(task.result?.usage?.outputTokens).toBe(50);
    });
  });

  describe('AgentDefinition', () => {
    it('should validate required properties', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
      };

      expect(agent.name).toBe('coder');
      expect(agent.role).toBe('程序员');
    });

    it('should support optional properties', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
        personality: '严谨',
        specialty: 'TypeScript, Node.js',
        model: 'sonnet',
        tools: ['Read', 'Write', 'Edit'],
        description: '专业程序员',
        systemPrompt: 'You are a coding expert.',
        color: 'blue',
      };

      expect(agent.personality).toBe('严谨');
      expect(agent.specialty).toBe('TypeScript, Node.js');
      expect(agent.model).toBe('sonnet');
      expect(agent.tools).toEqual(['Read', 'Write', 'Edit']);
      expect(agent.description).toBe('专业程序员');
      expect(agent.systemPrompt).toBe('You are a coding expert.');
      expect(agent.color).toBe('blue');
    });

    it('should allow partial configuration', () => {
      const agent: AgentDefinition = {
        name: 'tester',
        role: '测试工程师',
      };

      expect(agent.personality).toBeUndefined();
      expect(agent.specialty).toBeUndefined();
      expect(agent.model).toBeUndefined();
      expect(agent.tools).toBeUndefined();
    });
  });

  describe('TaskStatus', () => {
    it('should have valid status values', () => {
      const statuses = ['pending', 'in_progress', 'completed', 'failed'] as const;
      expect(statuses).toContain('pending');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('failed');
    });
  });
});
