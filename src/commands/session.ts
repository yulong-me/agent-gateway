import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLAUDE_DIR = path.join(process.env.HOME || '', '.claude');

/**
 * 列出所有会话
 */
export async function listSessions(): Promise<void> {
  // 查找所有项目的会话
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  try {
    const projects = await fs.readdir(projectsDir);

    console.log('\n💬 会话列表\n');
    console.log('项目                          会话数');
    console.log('─'.repeat(50));

    let totalSessions = 0;

    for (const project of projects) {
      if (project.startsWith('.')) continue;

      const projectSessionsDir = path.join(projectsDir, project, 'sessions');
      const stat = await fs.stat(projectSessionsDir).catch(() => null);

      if (!stat || !stat.isDirectory()) continue;

      const sessions = await fs.readdir(projectSessionsDir);
      const sessionCount = sessions.length;

      if (sessionCount > 0) {
        totalSessions += sessionCount;
        console.log(`${project.padEnd(30)} ${sessionCount}`);
      }
    }

    // 列出团队会话
    const teamsDir = path.join(CLAUDE_DIR, 'teams');
    const teams = await fs.readdir(teamsDir).catch(() => []);

    console.log('\n👥 团队会话:');
    console.log('─'.repeat(30));

    for (const team of teams) {
      if (team.startsWith('.')) continue;
      console.log(`  ${team}`);
    }

    console.log(`\n总计: ${totalSessions} 个会话\n`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('暂无会话记录');
    } else {
      console.error('❌ 读取会话失败:', error.message);
    }
  }
}

/**
 * 显示会话详情
 */
export async function showSession(sessionId: string): Promise<void> {
  if (!sessionId) {
    console.error('请指定会话 ID');
    return;
  }

  // 在项目中查找会话
  const projectsDir = path.join(CLAUDE_DIR, 'projects');

  try {
    const projects = await fs.readdir(projectsDir);

    for (const project of projects) {
      if (project.startsWith('.')) continue;

      const sessionPath = path.join(projectsDir, project, 'sessions', sessionId);

      try {
        const stat = await fs.stat(sessionPath);

        if (stat.isDirectory()) {
          console.log(`\n💬 会话详情: ${sessionId}`);
          console.log(`  项目: ${project}`);
          console.log(`  路径: ${sessionPath}`);

          // 列出会话中的文件
          const files = await fs.readdir(sessionPath);
          console.log(`  文件数: ${files.length}`);

          return;
        }
      } catch {
        // continue
      }
    }

    console.log(`未找到会话: ${sessionId}`);
  } catch (error: any) {
    console.error('❌ 读取会话失败:', error.message);
  }
}
