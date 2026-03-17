import readline from 'readline';
import { agentStore } from '../agent/store.js';
import type { AgentDefinition } from '../types/index.js';

/**
 * 交互式创建智能体
 */
export async function createAgentInteractive(): Promise<void> {
  const rl = createInterface();

  console.log('\n🎯 创建新智能体\n');

  const name = await askQuestion(rl, '名称 (name): ');
  if (!name) {
    console.error('❌ 名称不能为空');
    process.exit(1);
  }

  // 检查是否已存在
  const exists = await agentStore.exists(name);
  if (exists) {
    console.error(`❌ 智能体 "${name}" 已存在`);
    process.exit(1);
  }

  const role = await askQuestion(rl, '角色 (role): ');
  if (!role) {
    console.error('❌ 角色不能为空');
    process.exit(1);
  }

  const personality = await askQuestion(rl, '性格 (personality, 可选): ');
  const specialty = await askQuestion(rl, '专业 (specialty, 可选): ');
  const description = await askQuestion(rl, '描述 (description, 可选): ');
  const model = await askQuestion(rl, '模型 (model, 默认 sonnet): ');
  const color = await askQuestion(rl, '颜色 (color, 可选): ');

  const agent: AgentDefinition = {
    name,
    role,
    personality: personality || undefined,
    specialty: specialty || undefined,
    description: description || undefined,
    model: model || 'sonnet',
    color: color || undefined,
  };

  await agentStore.save(agent);

  console.log(`\n✅ 智能体 "${name}" 创建成功!\n`);
}

/**
 * 通过参数创建智能体
 */
export async function createAgentFromArgs(args: {
  name: string;
  role?: string;
  personality?: string;
  specialty?: string;
  description?: string;
  model?: string;
  color?: string;
}): Promise<void> {
  const { name, role, personality, specialty, description, model, color } = args;

  if (!name) {
    console.error('❌ 名称不能为空');
    process.exit(1);
  }

  if (!role) {
    console.error('❌ 角色不能为空');
    process.exit(1);
  }

  // 检查是否已存在
  const exists = await agentStore.exists(name);
  if (exists) {
    console.error(`❌ 智能体 "${name}" 已存在`);
    process.exit(1);
  }

  const agent: AgentDefinition = {
    name,
    role,
    personality,
    specialty,
    description,
    model: model || 'sonnet',
    color,
  };

  await agentStore.save(agent);

  console.log(`✅ 智能体 "${name}" 创建成功!`);
}

/**
 * 列出所有智能体
 */
export async function listAgents(): Promise<void> {
  const agents = await agentStore.list();

  if (agents.length === 0) {
    console.log('暂无智能体，请使用 "ag agent create" 创建');
    return;
  }

  console.log(`\n📋 智能体列表 (${agents.length} 个)\n`);
  console.log('名称'.padEnd(15) + '角色'.padEnd(15) + '模型'.padEnd(12) + '专业');
  console.log('-'.repeat(60));

  for (const agent of agents) {
    console.log(
      agent.name.padEnd(15) +
      agent.role.padEnd(15) +
      (agent.model || 'sonnet').padEnd(12) +
      (agent.specialty || '-')
    );
  }

  console.log('');
}

/**
 * 显示智能体详情
 */
export async function showAgent(name: string): Promise<void> {
  if (!name) {
    console.error('请指定智能体名称');
    process.exit(1);
  }

  const agent = await agentStore.get(name);

  if (!agent) {
    console.error(`❌ 智能体 "${name}" 不存在`);
    process.exit(1);
  }

  console.log(`\n🤖 智能体详情: ${name}\n`);
  console.log(`  名称: ${agent.name}`);
  console.log(`  角色: ${agent.role}`);
  if (agent.personality) console.log(`  性格: ${agent.personality}`);
  if (agent.specialty) console.log(`  专业: ${agent.specialty}`);
  if (agent.description) console.log(`  描述: ${agent.description}`);
  console.log(`  模型: ${agent.model || 'sonnet'}`);
  if (agent.color) console.log(`  颜色: ${agent.color}`);
  console.log('');
}

/**
 * 删除智能体
 */
export async function deleteAgent(name: string): Promise<void> {
  if (!name) {
    console.error('请指定智能体名称');
    process.exit(1);
  }

  const exists = await agentStore.exists(name);
  if (!exists) {
    console.error(`❌ 智能体 "${name}" 不存在`);
    process.exit(1);
  }

  await agentStore.delete(name);
  console.log(`✅ 智能体 "${name}" 已删除`);
}

// 辅助函数
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}
