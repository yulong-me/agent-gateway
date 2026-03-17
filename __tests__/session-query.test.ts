import { describe, it, expect, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const CLI_PATH = '/Users/yulong/playground/agent-gateway/dist/index.js';

describe('会话查询功能', () => {
  describe('task 命令', () => {
    it('应该显示任务列表', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} task list`);
      expect(stdout).toContain('任务');
    });

    it('应该能显示团队任务详情', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} task show agent-team`);
      expect(stdout).toContain('agent-team');
    });
  });

  describe('session 命令', () => {
    it('应该显示会话列表', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} session list`);
      expect(stdout).toContain('会话') || stdout.length > 0;
    });
  });
});
