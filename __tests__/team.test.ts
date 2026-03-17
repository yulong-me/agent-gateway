import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TeamStore } from '../src/team/store.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 创建临时目录用于测试
const tempDir = path.join(os.tmpdir(), `team-store-test-${Date.now()}`);

describe('TeamStore', () => {
  let store: TeamStore;

  beforeEach(async () => {
    store = new TeamStore(tempDir);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('constructor', () => {
    it('should use default config directory', () => {
      const defaultStore = new TeamStore();
      expect(defaultStore).toBeDefined();
    });

    it('should use custom config directory', () => {
      const customStore = new TeamStore('/custom/path');
      expect(customStore).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new team', async () => {
      const team = await store.create('blog-team', 'Blog开发团队', 'coder');

      expect(team.name).toBe('blog-team');
      expect(team.description).toBe('Blog开发团队');
      expect(team.coordinator).toBe('coder');
      expect(team.members).toEqual([]);
      expect(team.createdAt).toBeDefined();
    });
  });

  describe('save and get', () => {
    it('should save and retrieve a team', async () => {
      await store.create('blog-team', '描述');
      const team = await store.get('blog-team');

      expect(team).toBeDefined();
      expect(team?.name).toBe('blog-team');
    });

    it('should return null for non-existent team', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return empty array when no teams exist', async () => {
      const teams = await store.list();
      expect(teams).toEqual([]);
    });

    it('should list all saved teams', async () => {
      await store.create('team1', 'Team 1');
      await store.create('team2', 'Team 2');

      const teams = await store.list();
      expect(teams).toHaveLength(2);
    });
  });

  describe('addMember', () => {
    it('should add member to team', async () => {
      await store.create('blog-team');

      const team = await store.addMember('blog-team', { name: 'coder', role: '程序员' });

      expect(team?.members).toHaveLength(1);
      expect(team?.members[0].name).toBe('coder');
    });

    it('should not add duplicate members', async () => {
      await store.create('blog-team');
      await store.addMember('blog-team', { name: 'coder' });
      await store.addMember('blog-team', { name: 'coder' });

      const team = await store.get('blog-team');
      expect(team?.members).toHaveLength(1);
    });
  });

  describe('removeMember', () => {
    it('should remove member from team', async () => {
      await store.create('blog-team');
      await store.addMember('blog-team', { name: 'coder' });
      await store.removeMember('blog-team', 'coder');

      const team = await store.get('blog-team');
      expect(team?.members).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete an existing team', async () => {
      await store.create('blog-team');

      const result = await store.delete('blog-team');
      expect(result).toBe(true);

      const team = await store.get('blog-team');
      expect(team).toBeNull();
    });

    it('should return false for non-existent team', async () => {
      const result = await store.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing team', async () => {
      await store.create('blog-team');

      const result = await store.exists('blog-team');
      expect(result).toBe(true);
    });

    it('should return false for non-existing team', async () => {
      const result = await store.exists('non-existent');
      expect(result).toBe(false);
    });
  });
});
