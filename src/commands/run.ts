import { spawn } from 'child_process';
import { agentStore } from '../agent/store.js';
import { checkClaudeCLI } from '../agent/claude-cli.js';
import type { AgentDefinition } from '../types/index.js';

interface RunOptions {
  task: string;
  agents?: string[];
  coordinator?: string;
  teamMode?: boolean; // 工作群模式：智能体直接交流
}

/**
 * 发起任务
 */
export async function runTask(options: RunOptions): Promise<void> {
  const { task, agents: agentNames, coordinator, teamMode } = options;

  if (!task) {
    console.error('❌ 请指定任务描述');
    process.exit(1);
  }

  // 检查 Claude CLI
  const cliCheck = await checkClaudeCLI();
  if (!cliCheck.available) {
    console.error('❌ Claude CLI 不可用:', cliCheck.error);
    process.exit(1);
  }

  // 显示模式信息
  if (teamMode) {
    console.log('👥 工作群模式: 智能体将直接交流协作\n');
  }

  console.log('🚀 发起任务:', task);

  // 获取智能体配置
  let selectedAgents: AgentDefinition[] = [];

  if (agentNames && agentNames.length > 0) {
    for (const name of agentNames) {
      const agent = await agentStore.get(name);
      if (!agent) {
        console.error(`❌ 智能体 "${name}" 不存在`);
        process.exit(1);
      }
      selectedAgents.push(agent);
    }
  }

  // 构建 --agents JSON
  const agentsJson = buildAgentsJson(selectedAgents);

  // 构建 prompt
  const prompt = buildPrompt(task, selectedAgents, coordinator, teamMode);

  console.log('\n📋 参与智能体:', selectedAgents.map(a => a.name).join(', ') || '默认');
  console.log('');

  // 调用 Claude CLI
  await callClaudeWithAgents(agentsJson, prompt);
}

/**
 * 构建 agents JSON
 */
export function buildAgentsJson(agents: AgentDefinition[]): string {
  if (agents.length === 0) {
    return '{}';
  }

  const agentsObj: Record<string, any> = {};

  for (const agent of agents) {
    const systemPrompt = buildAgentSystemPrompt(agent);
    agentsObj[agent.name] = {
      description: agent.description || `${agent.role} - ${agent.specialty || agent.role}`,
      prompt: systemPrompt,
      model: agent.model || 'sonnet',
      tools: agent.tools || ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
    };
  }

  return JSON.stringify(agentsObj);
}

/**
 * 构建单个智能体的 system prompt
 */
export function buildAgentSystemPrompt(agent: AgentDefinition): string {
  let prompt = `你是一个${agent.role}`;

  if (agent.personality) {
    prompt += `，性格${agent.personality}`;
  }

  if (agent.specialty) {
    prompt += `，专长于${agent.specialty}`;
  }

  prompt += '。';

  if (agent.systemPrompt) {
    prompt += '\n\n' + agent.systemPrompt;
  }

  return prompt;
}

/**
 * 构建任务 prompt
 */
export function buildPrompt(task: string, agents: AgentDefinition[], coordinator?: string, teamMode?: boolean): string {
  let prompt = '';

  if (agents.length > 0) {
    if (teamMode) {
      // 工作群模式：让智能体像工作群一样直接交流
      prompt = `你需要创建一个智能体工作群，让成员直接交流协作完成以下任务：\n\n任务：${task}\n\n`;

      prompt += '工作群成员：\n';
      for (const agent of agents) {
        prompt += `- ${agent.name} (${agent.role}): ${agent.specialty || '通用'}\n`;
      }

      prompt += '\n工作群协作规则：\n';
      prompt += '1. 创建一个团队，包含所有成员\n';
      prompt += '2. 成员之间可以直接发消息交流（使用 SendMessage）\n';
      prompt += '3. 创建共享任务列表（使用 TaskList）\n';
      prompt += '4. 成员可以认领任务、完成任务（使用 ClaimTask, CompleteTask）\n';
      prompt += '5. 让成员讨论并协作完成最终任务\n';
      prompt += '6. 最后总结各成员的工作成果\n';
    } else {
      // 传统模式：通过 Lead 中转
      prompt = `你需要协调多个智能体完成以下任务：\n\n任务：${task}\n\n`;

      if (coordinator) {
        prompt += `协调者：${coordinator}\n\n`;
      }

      prompt += '智能体团队：\n';
      for (const agent of agents) {
        prompt += `- ${agent.name} (${agent.role}): ${agent.specialty || '通用'}\n`;
      }

      prompt += '\n请按照以下步骤协调：\n';
      prompt += '1. 分析任务，拆分子任务\n';
      prompt += '2. 分配给合适的智能体\n';
      prompt += '3. 收集结果，整合输出\n';
      prompt += '4. 确保各智能体的工作协调一致\n';
    }
  } else {
    prompt = task;
  }

  return prompt;
}

/**
 * 调用 Claude CLI
 */
async function callClaudeWithAgents(agentsJson: string, prompt: string): Promise<void> {
  // 移除 CLAUDECODE 环境变量，避免嵌套会话问题
  const childEnv = { ...process.env };
  delete childEnv.CLAUDECODE;

  // 启用 Agent Teams 实验性功能
  childEnv.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';

  const args = [
    '--print',
    '-',
    '--output-format', 'stream-json',
    '--verbose',
    '--agents', agentsJson,
    '--dangerously-skip-permissions',
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;

      // 解析 JSON 行并提取有用信息
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);

          // 打印文本内容
          if (data.type === 'assistant' && data.message?.content) {
            for (const block of data.message.content) {
              if (block.type === 'text' && block.text) {
                process.stdout.write(block.text);
              }
            }
          }

          // 打印工具结果
          if (data.type === 'user' && data.tool_use_result?.content) {
            for (const block of data.tool_use_result.content) {
              if (block.type === 'text') {
                process.stdout.write('\n📝 ' + block.text + '\n');
              }
            }
          }
        } catch {
          // 非 JSON 行直接输出
          if (!line.startsWith('{')) {
            process.stdout.write(line);
          }
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n\n✅ 任务完成');
        resolve();
      } else {
        reject(new Error(`Claude CLI exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}
