import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 默认配置目录 - 支持 AG_CONFIG_DIR 环境变量
const DEFAULT_CONFIG_DIR = process.env.AG_CONFIG_DIR || path.join(process.env.HOME || '', '.agent-gateway');

export interface TeamMember {
  name: string;
  role?: string;
}

export interface Team {
  name: string;
  description?: string;
  members: TeamMember[];
  coordinator?: string;
  createdAt: number;
  updatedAt: number;
}

export class TeamStore {
  private configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || DEFAULT_CONFIG_DIR;
  }

  /**
   * 确保配置目录存在
   */
  async ensureDir(): Promise<void> {
    const teamsDir = path.join(this.configDir, 'teams');
    await fs.mkdir(teamsDir, { recursive: true });
  }

  /**
   * 获取团队文件路径
   */
  private getTeamPath(name: string): string {
    return path.join(this.configDir, 'teams', `${name}.json`);
  }

  /**
   * 获取所有团队
   */
  async list(): Promise<Team[]> {
    await this.ensureDir();
    const teamsDir = path.join(this.configDir, 'teams');

    try {
      const files = await fs.readdir(teamsDir);
      const teams: Team[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(teamsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        teams.push(JSON.parse(content));
      }

      return teams;
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  /**
   * 获取单个团队
   */
  async get(name: string): Promise<Team | null> {
    const filePath = this.getTeamPath(name);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  /**
   * 保存团队
   */
  async save(team: Team): Promise<void> {
    await this.ensureDir();
    const filePath = this.getTeamPath(team.name);
    team.updatedAt = Date.now();
    await fs.writeFile(filePath, JSON.stringify(team, null, 2), 'utf-8');
  }

  /**
   * 创建团队
   */
  async create(name: string, description?: string, coordinator?: string): Promise<Team> {
    const team: Team = {
      name,
      description,
      members: [],
      coordinator,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.save(team);
    return team;
  }

  /**
   * 添加成员
   */
  async addMember(teamName: string, member: TeamMember): Promise<Team | null> {
    const team = await this.get(teamName);
    if (!team) return null;

    // 检查成员是否已存在
    const exists = team.members.some(m => m.name === member.name);
    if (!exists) {
      team.members.push(member);
      await this.save(team);
    }

    return team;
  }

  /**
   * 移除成员
   */
  async removeMember(teamName: string, memberName: string): Promise<Team | null> {
    const team = await this.get(teamName);
    if (!team) return null;

    team.members = team.members.filter(m => m.name !== memberName);
    await this.save(team);

    return team;
  }

  /**
   * 删除团队
   */
  async delete(name: string): Promise<boolean> {
    const filePath = this.getTeamPath(name);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  /**
   * 检查团队是否存在
   */
  async exists(name: string): Promise<boolean> {
    const team = await this.get(name);
    return team !== null;
  }
}

// 导出单例
export const teamStore = new TeamStore();
