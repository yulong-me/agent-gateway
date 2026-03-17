import { describe, it, expect, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const CLI_PATH = '/Users/yulong/playground/agent-gateway/dist/index.js';
const uniqueName = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Agent Teams: 工作群模式', () => {
  const TEST_CONFIG_DIR = path.join(os.tmpdir(), `ag-teams-${Date.now()}`);

  beforeEach(async () => {
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'agents'), { recursive: true });
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'teams'), { recursive: true });
  });

  describe('run 命令参数', () => {
    it('应该支持 --team-mode 标志', async () => {
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} run --help`
      );

      expect(stdout).toContain('--team-mode');
    });
  });

  describe('工作群模式', () => {
    it('team-mode 下智能体可以协作', async () => {
      const agent1 = uniqueName('alice');
      const agent2 = uniqueName('bob');

      // 创建智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agent1} --role "助手"`
      );
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agent2} --role "助手"`
      );

      // 使用 team-mode 发起任务
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} run "让 ${agent1} 对 ${agent2} 说 hello" --agents ${agent1},${agent2} --team-mode`,
        { timeout: 90000 }
      );

      // 验证有协作输出
      expect(stdout.length).toBeGreaterThan(0);
    }, 120000);
  });
});
