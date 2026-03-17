import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// 生成唯一名称
const uniqueName = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 测试配置 - 使用临时配置目录
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `ag-e2e-config-${Date.now()}`);
const CLI_PATH = '/Users/yulong/playground/agent-gateway/dist/index.js';

describe('E2E: Agent Gateway CLI', () => {
  beforeEach(async () => {
    // 创建临时配置目录
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'agents'), { recursive: true });
    await fs.mkdir(path.join(TEST_CONFIG_DIR, 'teams'), { recursive: true });
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.rm(TEST_CONFIG_DIR, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  /**
   * 用户旅程 1: 创建和管理智能体
   * As a 开发者, I want 创建和管理智能体, so that 我可以快速配置不同角色的 AI 助手
   */
  describe('User Journey 1: 创建和管理智能体', () => {
    it('should create agent with all options', async () => {
      const agentName = uniqueName('coder');
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "程序员" --specialty "TypeScript, Node.js" --personality "严谨" --model "sonnet"`
      );

      expect(stdout).toContain('✅');
      expect(stdout).toContain(agentName);
      expect(stdout).toContain('创建成功');
    });

    it('should list all agents', async () => {
      const agentName = uniqueName('tester');
      // 先创建一个智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "测试工程师"`
      );

      // 列出智能体
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent list`
      );

      expect(stdout).toContain(agentName);
      expect(stdout).toContain('测试工程师');
    });

    it('should show agent details', async () => {
      const agentName = uniqueName('designer');
      // 先创建一个智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "设计师" --specialty "UI/UX"`
      );

      // 查看详情
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent show ${agentName}`
      );

      expect(stdout).toContain(agentName);
      expect(stdout).toContain('设计师');
      expect(stdout).toContain('UI/UX');
    });

    it('should delete an agent', async () => {
      const agentName = uniqueName('temp');
      // 先创建一个智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "临时"`
      );

      // 删除智能体
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent delete ${agentName}`
      );

      expect(stdout).toContain('✅');
      expect(stdout).toContain('删除');
    });

    it('should handle duplicate agent name', async () => {
      const agentName = uniqueName('dup');
      // 先创建一个智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "测试"`
      );

      // 尝试重复创建
      const { stderr } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "测试"`
      ).catch((err) => ({ stderr: err.stderr }));

      expect(stderr).toContain('已存在');
    });

    it('should handle non-existent agent', async () => {
      const { stderr } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent show non-existent-agent`
      ).catch((err) => ({ stderr: err.stderr }));

      expect(stderr).toContain('不存在');
    });
  });

  /**
   * 用户旅程 2: 团队协作
   * As a 项目经理, I want 创建团队并添加成员, so that 我可以协调多个智能体完成复杂任务
   */
  describe('User Journey 2: 团队协作', () => {
    it('should create a team', async () => {
      const teamName = uniqueName('blog-team');
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName} --description "博客开发团队" --coordinator "coder"`
      );

      expect(stdout).toContain('✅');
      expect(stdout).toContain(teamName);
    });

    it('should list all teams', async () => {
      const teamName = uniqueName('team-2');
      // 先创建一个团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName}`
      );

      // 列出团队
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team list`
      );

      expect(stdout).toContain(teamName);
    });

    it('should show team details', async () => {
      const teamName = uniqueName('detail-team');
      // 先创建一个团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName} --description "详细团队"`
      );

      // 查看详情
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team show ${teamName}`
      );

      expect(stdout).toContain(teamName);
      expect(stdout).toContain('详细团队');
    });

    it('should add member to team', async () => {
      const agentName = uniqueName('member-test');
      const teamName = uniqueName('team-with-member');

      // 先创建智能体和团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${agentName} --role "成员"`
      );
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName}`
      );

      // 添加成员
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team add ${agentName} --team ${teamName}`
      );

      expect(stdout).toContain('✅');
      expect(stdout).toContain('已添加');
    });

    it('should delete a team', async () => {
      const teamName = uniqueName('team-to-delete');
      // 先创建一个团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName}`
      );

      // 删除团队
      const { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team delete ${teamName}`
      );

      expect(stdout).toContain('✅');
      expect(stdout).toContain('删除');
    });
  });

  /**
   * 用户旅程 3: 完整工作流
   * As a 用户, I want 完成完整的智能体协作流程, so that 我可以高效完成项目
   */
  describe('User Journey 3: 完整工作流', () => {
    it('should complete full workflow: create agents, create team, add members', async () => {
      const coderName = uniqueName('wf-coder');
      const designerName = uniqueName('wf-designer');
      const teamName = uniqueName('wf-team');

      // Step 1: 创建多个智能体
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${coderName} --role "程序员" --specialty "TypeScript"`
      );
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent create --name ${designerName} --role "设计师" --specialty "UI/UX"`
      );

      // Step 2: 验证智能体已创建
      let { stdout } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} agent list`
      );
      expect(stdout).toContain(coderName);
      expect(stdout).toContain(designerName);

      // Step 3: 创建团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team create --name ${teamName} --coordinator ${coderName}`
      );

      // Step 4: 添加成员到团队
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team add ${coderName} --team ${teamName}`
      );
      await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team add ${designerName} --team ${teamName}`
      );

      // Step 5: 验证团队详情
      const { stdout: teamOutput } = await execAsync(
        `AG_CONFIG_DIR=${TEST_CONFIG_DIR} node ${CLI_PATH} team show ${teamName}`
      );
      expect(teamOutput).toContain(coderName);
      expect(teamOutput).toContain(designerName);
    });
  });

  /**
   * 边界条件和错误处理
   */
  describe('Edge Cases and Error Handling', () => {
    it('should show help when no arguments', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} --help`);

      expect(stdout).toContain('Agent Gateway');
      expect(stdout).toContain('agent');
      expect(stdout).toContain('team');
      expect(stdout).toContain('run');
    }, 10000);
  });
});
