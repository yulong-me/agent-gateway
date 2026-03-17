import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AgentDefinition } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 默认配置目录 - 支持 AG_CONFIG_DIR 环境变量
const DEFAULT_CONFIG_DIR = process.env.AG_CONFIG_DIR || path.join(process.env.HOME || '', '.agent-gateway');

export class AgentStore {
  private configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || DEFAULT_CONFIG_DIR;
  }

  /**
   * 确保配置目录存在
   */
  async ensureDir(): Promise<void> {
    const agentsDir = path.join(this.configDir, 'agents');
    await fs.mkdir(agentsDir, { recursive: true });
  }

  /**
   * 获取智能体文件路径
   */
  private getAgentPath(name: string): string {
    return path.join(this.configDir, 'agents', `${name}.json`);
  }

  /**
   * 获取所有智能体
   */
  async list(): Promise<AgentDefinition[]> {
    await this.ensureDir();
    const agentsDir = path.join(this.configDir, 'agents');

    try {
      const files = await fs.readdir(agentsDir);
      const agents: AgentDefinition[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(agentsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          agents.push(JSON.parse(content));
        } catch (err) {
          // 忽略损坏的 JSON 文件
          console.warn(`警告: 跳过损坏的配置文件 ${file}`);
        }
      }

      return agents;
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  /**
   * 获取单个智能体
   */
  async get(name: string): Promise<AgentDefinition | null> {
    const filePath = this.getAgentPath(name);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  /**
   * 保存智能体
   */
  async save(agent: AgentDefinition): Promise<void> {
    await this.ensureDir();
    const filePath = this.getAgentPath(agent.name);

    await fs.writeFile(filePath, JSON.stringify(agent, null, 2), 'utf-8');
  }

  /**
   * 删除智能体
   */
  async delete(name: string): Promise<boolean> {
    const filePath = this.getAgentPath(name);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  /**
   * 检查智能体是否存在
   */
  async exists(name: string): Promise<boolean> {
    const agent = await this.get(name);
    return agent !== null;
  }
}

// 导出单例
export const agentStore = new AgentStore();
