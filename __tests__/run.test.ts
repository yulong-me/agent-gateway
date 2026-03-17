import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAgentsJson, buildAgentSystemPrompt, buildPrompt } from '../src/commands/run.js';
import type { AgentDefinition } from '../src/types/index.js';

describe('run command', () => {
  describe('buildAgentsJson', () => {
    it('should return empty object for empty array', () => {
      const result = buildAgentsJson([]);
      expect(result).toBe('{}');
    });

    it('should build JSON for single agent', () => {
      const agents: AgentDefinition[] = [
        {
          name: 'coder',
          role: '程序员',
          specialty: 'TypeScript',
          model: 'sonnet',
        },
      ];

      const result = buildAgentsJson(agents);
      const parsed = JSON.parse(result);

      expect(parsed.coder).toBeDefined();
      expect(parsed.coder.description).toContain('程序员');
      expect(parsed.coder.model).toBe('sonnet');
      expect(parsed.coder.tools).toBeDefined();
    });

    it('should build JSON for multiple agents', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员', specialty: 'TypeScript' },
        { name: 'designer', role: '设计师', specialty: 'UI/UX' },
      ];

      const result = buildAgentsJson(agents);
      const parsed = JSON.parse(result);

      expect(parsed.coder).toBeDefined();
      expect(parsed.designer).toBeDefined();
    });

    it('should use default tools if not specified', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员' },
      ];

      const result = buildAgentsJson(agents);
      const parsed = JSON.parse(result);

      expect(parsed.coder.tools).toEqual(['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep']);
    });

    it('should use custom tools when specified', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员', tools: ['Read', 'Bash'] },
      ];

      const result = buildAgentsJson(agents);
      const parsed = JSON.parse(result);

      expect(parsed.coder.tools).toEqual(['Read', 'Bash']);
    });
  });

  describe('buildAgentSystemPrompt', () => {
    it('should build basic prompt from role', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
      };

      const result = buildAgentSystemPrompt(agent);
      expect(result).toContain('程序员');
    });

    it('should include personality when specified', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
        personality: '严谨',
      };

      const result = buildAgentSystemPrompt(agent);
      expect(result).toContain('严谨');
    });

    it('should include specialty when specified', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
        specialty: 'TypeScript',
      };

      const result = buildAgentSystemPrompt(agent);
      expect(result).toContain('TypeScript');
    });

    it('should include custom system prompt when specified', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
        systemPrompt: 'Always write clean code.',
      };

      const result = buildAgentSystemPrompt(agent);
      expect(result).toContain('Always write clean code.');
    });

    it('should combine all attributes', () => {
      const agent: AgentDefinition = {
        name: 'coder',
        role: '程序员',
        personality: '严谨',
        specialty: 'TypeScript, Node.js',
        systemPrompt: 'Write tests first.',
      };

      const result = buildAgentSystemPrompt(agent);
      expect(result).toContain('程序员');
      expect(result).toContain('严谨');
      expect(result).toContain('TypeScript, Node.js');
      expect(result).toContain('Write tests first.');
    });
  });

  describe('buildPrompt', () => {
    it('should return simple prompt for no agents', () => {
      const result = buildPrompt('Build a website', []);
      expect(result).toBe('Build a website');
    });

    it('should build coordinator prompt for multiple agents', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员', specialty: 'TypeScript' },
        { name: 'designer', role: '设计师', specialty: 'UI/UX' },
      ];

      const result = buildPrompt('开发一个博客系统', agents);

      expect(result).toContain('开发一个博客系统');
      expect(result).toContain('coder');
      expect(result).toContain('designer');
      expect(result).toContain('程序员');
      expect(result).toContain('设计师');
    });

    it('should include coordinator when specified', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员' },
      ];

      const result = buildPrompt('Build a website', agents, 'manager');

      expect(result).toContain('manager');
      expect(result).toContain('协调者');
    });

    it('should include coordination steps', () => {
      const agents: AgentDefinition[] = [
        { name: 'coder', role: '程序员' },
      ];

      const result = buildPrompt('Build a website', agents);

      expect(result).toContain('分析任务');
      expect(result).toContain('分配给合适的智能体');
      expect(result).toContain('收集结果');
    });
  });
});
