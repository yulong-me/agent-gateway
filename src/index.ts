#!/usr/bin/env node

import { Agent } from './agent/Agent.js';
import { checkClaudeCLI } from './agent/claude-cli.js';
import { parseArgs } from './utils/args.js';
import * as agentCmd from './commands/agent.js';
import * as runCmd from './commands/run.js';
import * as teamCmd from './commands/team.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Agent 子命令
  if (args._[0] === 'agent') {
    await handleAgentCommand(args);
    return;
  }

  // Run 子命令
  if (args._[0] === 'run') {
    if (args.help) {
      console.log(`
任务发起:
  run <任务描述> [--agents <智能体列表>] [--coordinator <协调者>] [--team-mode]
  run <任务描述> --team <团队>

选项:
  --agents <列表>    指定参与的智能体，用逗号分隔
  --coordinator <名> 指定协调者
  --team-mode       工作群模式：智能体直接交流协作
  --help            显示帮助

示例:
  agent-gateway run "开发一个博客系统" --agents coder,designer
  agent-gateway run "开发一个博客系统" --agents coder,designer --team-mode
`);
      return;
    }

    const task = args._.slice(1).join(' ') || args.task || '';
    const agents = args.agents ? args.agents.split(',') : undefined;
    const coordinator = args.coordinator;
    const teamMode = args.teamMode;

    await runCmd.runTask({ task, agents, coordinator, teamMode });
    return;
  }

  // Team 子命令
  if (args._[0] === 'team') {
    await handleTeamCommand(args);
    return;
  }

  // Task 子命令 - 查询任务历史
  if (args._[0] === 'task') {
    if (args._[1] === 'list' || !args._[1]) {
      const { listTasks } = await import('./commands/task.js');
      await listTasks();
    } else if (args._[1] === 'show') {
      const { showTask } = await import('./commands/task.js');
      await showTask(args._[2]);
    }
    return;
  }

  // Session 子命令 - 查询会话历史
  if (args._[0] === 'session') {
    if (args._[1] === 'list' || !args._[1]) {
      const { listSessions } = await import('./commands/session.js');
      await listSessions();
    } else if (args._[1] === 'show') {
      const { showSession } = await import('./commands/session.js');
      await showSession(args._[2]);
    }
    return;
  }

  // Check CLI availability
  console.log('🔍 检查 Claude CLI...');
  const cliCheck = await checkClaudeCLI();

  if (!cliCheck.available) {
    console.error('❌ Claude CLI 不可用:', cliCheck.error);
    console.log('请先安装 Claude Code: https://claude.ai/code');
    process.exit(1);
  }

  console.log('✅ Claude CLI 已就绪:', cliCheck.version);

  // Show help
  if (args.help || args._.includes('help')) {
    showHelp();
    return;
  }

  // Start chat mode
  if (args.interactive || args.i) {
    await startChatMode();
    return;
  }

  // Single message mode
  const message = args._[0] || args.message || args.m;
  if (message) {
    await sendMessage(message);
    return;
  }

  // Default: show help
  showHelp();
}

/**
 * 处理 agent 子命令
 */
async function handleAgentCommand(args: any): Promise<void> {
  const subCommand = args._[1];

  switch (subCommand) {
    case 'create':
      if (args.name) {
        await agentCmd.createAgentFromArgs({
          name: args.name,
          role: args.role,
          personality: args.personality,
          specialty: args.specialty,
          description: args.description,
          model: args.model,
          color: args.color,
        });
      } else {
        await agentCmd.createAgentInteractive();
      }
      break;

    case 'list':
      await agentCmd.listAgents();
      break;

    case 'show':
      await agentCmd.showAgent(args._[2]);
      break;

    case 'delete':
      await agentCmd.deleteAgent(args._[2]);
      break;

    default:
      console.log(`
🤖 Agent 子命令:

  ag agent create [--name <名称>] [--role <角色>] [--specialty <专业>]
  ag agent list
  ag agent show <名称>
  ag agent delete <名称>
`);
  }
}

/**
 * 处理 team 子命令
 */
async function handleTeamCommand(args: any): Promise<void> {
  const subCommand = args._[1];

  switch (subCommand) {
    case 'create':
      if (args.name) {
        await teamCmd.createTeamFromArgs({
          name: args.name,
          description: args.description,
          coordinator: args.coordinator,
        });
      } else {
        await teamCmd.createTeamInteractive();
      }
      break;

    case 'list':
      await teamCmd.listTeams();
      break;

    case 'show':
      await teamCmd.showTeam(args._[2]);
      break;

    case 'add':
      // ag team add <member> --team <team>
      if (args._[2] && args.team) {
        await teamCmd.addMemberToTeam({
          team: args.team,
          member: args._[2],
          role: args.role,
        });
      } else {
        console.log('用法: ag team add <成员> --team <团队> [--role <角色>]');
      }
      break;

    case 'remove':
      if (args._[2] && args.team) {
        await teamCmd.removeMemberFromTeam(args.team, args._[2]);
      } else {
        console.log('用法: ag team remove <成员> --team <团队>');
      }
      break;

    case 'delete':
      await teamCmd.deleteTeam(args._[2]);
      break;

    default:
      console.log(`
👥 Team 子命令:

  ag team create [--name <名称>] [--description <描述>] [--coordinator <协调者>]
  ag team list
  ag team show <名称>
  ag team add <成员> --team <团队>
  ag team remove <成员> --team <团队>
  ag team delete <名称>
`);
  }
}

async function sendMessage(content: string) {
  const agent = new Agent({
    id: 'cli-agent',
    name: 'CLI Agent',
    role: 'assistant',
  });

  console.log('\n🤔 思考中...\n');

  let output = '';

  try {
    const response = await agent.chat(content, {
      onChunk: (chunk) => {
        // 实时输出
        process.stdout.write(chunk);
        output += chunk;
      },
    });

    console.log('\n\n📊 Token 使用:', response.usage?.inputTokens, '→', response.usage?.outputTokens);
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

async function startChatMode() {
  const agent = new Agent({
    id: 'cli-agent',
    name: 'CLI Agent',
    role: 'assistant',
  });

  console.log('\n🎯 Agent Gateway - 交互模式');
  console.log('输入消息开始对话，输入 :quit 或 :exit 退出\n');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input === ':quit' || input === ':exit') {
      console.log('👋 再见!');
      process.exit(0);
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      let isFirstChunk = true;
      process.stdout.write('\n📝 ');

      const response = await agent.chat(input, {
        onChunk: (chunk) => {
          if (isFirstChunk) {
            isFirstChunk = false;
          }
          process.stdout.write(chunk);
        },
      });

      console.log('\n📊 Token:', response.usage?.inputTokens, '→', response.usage?.outputTokens, '\n');
    } catch (error: any) {
      console.error('❌ 错误:', error.message);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 再见!');
    process.exit(0);
  });
}

function showHelp() {
  console.log(`
🎯 Agent Gateway - 多智能体任务编排系统

用法:
  agent-gateway [命令] [选项]

命令:
  agent              智能体管理
  team               团队管理
  run                发起任务

智能体管理:
  agent create [--name <名称>] [--role <角色>] [--specialty <专业>]
  agent list
  agent show <名称>
  agent delete <名称>

团队管理:
  team create [--name <名称>] [--description <描述>] [--coordinator <协调者>]
  team list
  team show <名称>
  team add <成员> --team <团队>
  team remove <成员> --team <团队>
  team delete <名称>

任务发起:
  run <任务描述> [--agents <智能体列表>] [--coordinator <协调者>] [--team-mode]
  run <任务描述> --team <团队>

任务查询:
  task list                    列出所有任务
  task show <团队>             显示团队任务详情

会话查询:
  session list                 列出所有会话
  session show <会话ID>        显示会话详情

选项:
  -i, --interactive    启动交互模式
  -m, --message <msg>  发送单条消息
  -h, --help           显示帮助信息

示例:
  # 创建智能体
  agent-gateway agent create --name coder --role 程序员 --specialty TypeScript
  agent-gateway agent create --name designer --role 设计师 --specialty UI/UX
  agent-gateway agent create --name tester --role 测试工程师 --specialty E2E

  # 创建团队
  agent-gateway team create --name blog-team --coordinator coder

  # 添加成员到团队
  agent-gateway team add coder --team blog-team
  agent-gateway team add designer --team blog-team

  # 发起任务
  agent-gateway run "开发一个博客系统" --agents coder,designer,tester
  agent-gateway run "开发一个博客系统" --team blog-team
`);
}

main();
