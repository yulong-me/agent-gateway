import fs from 'fs/promises';
import path from 'path';

const CLAUDE_DIR = path.join(process.env.HOME || '', '.claude');

/**
 * 列出所有任务
 */
export async function listTasks(): Promise<void> {
  const tasksDir = path.join(CLAUDE_DIR, 'tasks');

  try {
    const teams = await fs.readdir(tasksDir);
    let totalTasks = 0;

    console.log('\n📋 任务列表\n');
    console.log('团队                  任务数  状态');
    console.log('─'.repeat(50));

    for (const team of teams) {
      if (team.startsWith('.')) continue;

      const teamTasksDir = path.join(tasksDir, team);
      const stat = await fs.stat(teamTasksDir);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(teamTasksDir);
      const taskFiles = files.filter(f => f.endsWith('.json') && f !== '.lock');

      let completed = 0;
      let inProgress = 0;
      let pending = 0;

      for (const file of taskFiles) {
        try {
          const content = await fs.readFile(path.join(teamTasksDir, file), 'utf-8');
          const task = JSON.parse(content);
          if (task.status === 'completed') completed++;
          else if (task.status === 'in-progress') inProgress++;
          else pending++;
        } catch {
          // ignore
        }
      }

      totalTasks += taskFiles.length;
      console.log(`${team.padEnd(20)} ${String(taskFiles.length).padEnd(8)} ✅${completed} 🔄${inProgress} ⏳${pending}`);
    }

    console.log(`\n总计: ${totalTasks} 个任务\n`);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('暂无任务记录');
    } else {
      console.error('❌ 读取任务失败:', error.message);
    }
  }
}

/**
 * 显示任务详情
 */
export async function showTask(teamName: string): Promise<void> {
  if (!teamName) {
    console.error('请指定团队名称');
    return;
  }

  const tasksDir = path.join(CLAUDE_DIR, 'tasks', teamName);

  try {
    const files = await fs.readdir(tasksDir);
    const taskFiles = files.filter(f => f.endsWith('.json') && f !== '.lock');

    console.log(`\n📋 团队 "${teamName}" 任务详情\n`);

    for (const file of taskFiles) {
      const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
      const task = JSON.parse(content);

      console.log(`\n任务 #${task.id}: ${task.subject || '无主题'}`);
      console.log(`  状态: ${task.status}`);
      console.log(`  描述: ${task.description?.substring(0, 100) || '无'}`);
    }

    console.log('');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`团队 "${teamName}" 无任务记录`);
    } else {
      console.error('❌ 读取任务失败:', error.message);
    }
  }
}
