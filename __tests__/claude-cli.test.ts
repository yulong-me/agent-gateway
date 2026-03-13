import { describe, it, expect } from 'vitest';

describe('Claude CLI', () => {
  describe('checkClaudeCLI', () => {
    it('should export checkClaudeCLI function', async () => {
      const { checkClaudeCLI } = await import('../src/agent/claude-cli.js');
      expect(typeof checkClaudeCLI).toBe('function');
    });
  });

  describe('callClaudeCLI', () => {
    it('should export callClaudeCLI function', async () => {
      const { callClaudeCLI } = await import('../src/agent/claude-cli.js');
      expect(typeof callClaudeCLI).toBe('function');
    });
  });

  describe('ClaudeResponse type', () => {
    it('should have correct structure', () => {
      const response = {
        content: 'Hello',
        usage: { inputTokens: 100, outputTokens: 50 },
      };

      expect(response.content).toBe('Hello');
      expect(response.usage?.inputTokens).toBe(100);
      expect(response.usage?.outputTokens).toBe(50);
    });

    it('should allow optional usage', () => {
      const response = {
        content: 'Hello',
      };

      expect(response.content).toBe('Hello');
      expect(response.usage).toBeUndefined();
    });
  });
});
