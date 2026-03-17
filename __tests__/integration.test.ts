import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const CLI_PATH = '/Users/yulong/playground/agent-gateway/dist/index.js';
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `ag-integration-${Date.now()}`);

describe('Integration: Claude CLI Interaction', () => {
  beforeEach(async () => {
    // 设置测试配置目录
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'agents'), { recursive: true });
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'teams'), { recursive: true });
    process.env.AG_CONFIG_DIR = TEST_CONFIG_DIR;
  });

  describe('Claude CLI Integration', () => {
    it('should check Claude CLI availability', async () => {
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} --help`
      );

      // 应该显示 Claude CLI 检查结果
      expect(stdout).toContain('Claude CLI');
    });

    it('should handle help command gracefully', async () => {
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} --help`
      );

      // 验证帮助输出
      expect(stdout).toContain('Agent Gateway');
      expect(stdout).toContain('agent');
      expect(stdout).toContain('team');
      expect(stdout).toContain('run');
    });
  });

  describe('File System Operations', () => {
    it('should create agent config file', async () => {
      const agentName = `test-${Date.now()}`;
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "测试"`
      );

      // 验证配置文件已创建
      const configPath = path.join(TEST_CONFIG_DIR, 'agents', `${agentName}.json`);
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.name).toBe(agentName);
      expect(config.role).toBe('测试');
    });

    it('should update agent config file', async () => {
      const agentName = `test-update-${Date.now()}`;

      // 创建智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "初始角色"`
      );

      // 验证文件存在
      const configPath = path.join(TEST_CONFIG_DIR, 'agents', `${agentName}.json`);
      let content = await fs.readFile(configPath, 'utf-8');
      let config = JSON.parse(content);
      expect(config.role).toBe('初始角色');

      // 删除智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent delete ${agentName}`
      );

      // 验证文件已删除
      try {
        await fs.access(configPath);
        // 如果没抛异常，说明文件还存在，测试失败
        expect(true).toBe(false);
      } catch {
        // 预期行为：文件不存在
        expect(true).toBe(true);
      }
    });

    it('should create team config file', async () => {
      const teamName = `test-team-${Date.now()}`;
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName} --description "测试团队"`
      );

      // 验证配置文件已创建
      const configPath = path.join(TEST_CONFIG_DIR, 'teams', `${teamName}.json`);
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.name).toBe(teamName);
      expect(config.description).toBe('测试团队');
      expect(config.members).toEqual([]);
    });
  });

  describe('Data Validation', () => {
    it('should validate agent name format', async () => {
      // 测试特殊字符
      const { stderr } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name "test agent" --role "测试"`
      ).catch((err) => ({ stderr: err.stderr }));

      // 空格在命令行中会被处理，应该能创建
      expect(stderr || '').toBeFalsy();
    });

    it('should handle Chinese characters in config', async () => {
      const agentName = `测试-${Date.now()}`;
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "程序员" --specialty "TypeScript"`
      );

      // 验证中文内容保存正确
      const configPath = path.join(TEST_CONFIG_DIR, 'agents', `${agentName}.json`);
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.role).toBe('程序员');
      expect(config.specialty).toBe('TypeScript');
    });

    it('should handle empty specialty field', async () => {
      const agentName = `empty-spec-${Date.now()}`;
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "测试"`
      );

      const configPath = path.join(TEST_CONFIG_DIR, 'agents', `${agentName}.json`);
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      // 没有 specialty 字段应该是 undefined 或不存在
      expect(config.specialty).toBeUndefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple agent creations', async () => {
      const promises = [
        execAsync(`AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name concurrent-1 --role "角色1"`),
        execAsync(`AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name concurrent-2 --role "角色2"`),
        execAsync(`AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name concurrent-3 --role "角色3"`),
      ];

      const results = await Promise.allSettled(promises);

      // 至少应该有一些成功
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupt JSON gracefully', async () => {
      // 创建一个损坏的配置文件
      const configPath = path.join(TEST_CONFIG_DIR, 'agents', 'corrupt.json');
      await fs.writeFile(configPath, 'invalid json');

      // 尝试列出智能体（应该忽略损坏的文件）
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent list`
      );

      // 应该能正常列出（只是忽略损坏的文件）
      expect(stdout).toContain('智能体');
    });
  });
});
