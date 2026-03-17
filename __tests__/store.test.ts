import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentStore } from '../src/agent/store.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 创建临时目录用于测试
const tempDir = path.join(os.tmpdir(), `agent-gateway-test-${Date.now()}`);

describe('AgentStore', () => {
  let store: AgentStore;

  beforeEach(async () => {
    store = new AgentStore(tempDir);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('constructor', () => {
    it('should use default config directory', () => {
      const defaultStore = new AgentStore();
      expect(defaultStore).toBeDefined();
    });

    it('should use custom config directory', () => {
      const customStore = new AgentStore('/custom/path');
      expect(customStore).toBeDefined();
    });
  });

  describe('save and get', () => {
    it('should save and retrieve an agent', async () => {
      const agent = {
        name: 'coder',
        role: '程序员',
        specialty: 'TypeScript',
        model: 'sonnet',
      };

      await store.save(agent);
      const retrieved = await store.get('coder');

      expect(retrieved).toEqual(agent);
    });

    it('should return null for non-existent agent', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no agents exist', async () => {
      const agents = await store.list();
      expect(agents).toEqual([]);
    });

    it('should list all saved agents', async () => {
      await store.save({ name: 'coder', role: '程序员', specialty: 'TypeScript' });
      await store.save({ name: 'designer', role: '设计师', specialty: 'UI/UX' });

      const agents = await store.list();
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.name)).toContain('coder');
      expect(agents.map(a => a.name)).toContain('designer');
    });
  });

  describe('delete', () => {
    it('should delete an existing agent', async () => {
      await store.save({ name: 'coder', role: '程序员' });

      const result = await store.delete('coder');
      expect(result).toBe(true);

      const agent = await store.get('coder');
      expect(agent).toBeNull();
    });

    it('should return false for non-existent agent', async () => {
      const result = await store.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing agent', async () => {
      await store.save({ name: 'coder', role: '程序员' });

      const result = await store.exists('coder');
      expect(result).toBe(true);
    });

    it('should return false for non-existing agent', async () => {
      const result = await store.exists('non-existent');
      expect(result).toBe(false);
    });
  });
});
