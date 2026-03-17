import readline from 'readline';
import { teamStore, type TeamMember } from '../team/store.js';
import { agentStore } from '../agent/store.js';

/**
 * 交互式创建团队
 */
export async function createTeamInteractive(): Promise<void> {
  const rl = createInterface();

  console.log('\n🎯 创建新团队\n');

  const name = await askQuestion(rl, '名称 (name): ');
  if (!name) {
    console.error('❌ 名称不能为空');
    process.exit(1);
  }

  // 检查是否已存在
  const exists = await teamStore.exists(name);
  if (exists) {
    console.error(`❌ 团队 "${name}" 已存在`);
    process.exit(1);
  }

  const description = await askQuestion(rl, '描述 (description, 可选): ');
  const coordinator = await askQuestion(rl, '协调者 (coordinator, 可选): ');

  const team = await teamStore.create(
    name,
    description || undefined,
    coordinator || undefined
  );

  console.log(`\n✅ 团队 "${name}" 创建成功!\n`);

  // 询问是否添加成员
  const addMembers = await askQuestion(rl, '是否添加成员? (y/n): ');
  if (addMembers.toLowerCase() === 'y') {
    await addMembersInteractive(rl, name);
  }

  console.log('');
}

/**
 * 通过参数创建团队
 */
export async function createTeamFromArgs(args: {
  name: string;
  description?: string;
  coordinator?: string;
}): Promise<void> {
  const { name, description, coordinator } = args;

  if (!name) {
    console.error('❌ 名称不能为空');
    process.exit(1);
  }

  // 检查是否已存在
  const exists = await teamStore.exists(name);
  if (exists) {
    console.error(`❌ 团队 "${name}" 已存在`);
    process.exit(1);
  }

  const team = await teamStore.create(name, description, coordinator);
  console.log(`✅ 团队 "${team.name}" 创建成功!`);
}

/**
 * 列出所有团队
 */
export async function listTeams(): Promise<void> {
  const teams = await teamStore.list();

  if (teams.length === 0) {
    console.log('暂无团队，请使用 "ag team create" 创建');
    return;
  }

  console.log(`\n📋 团队列表 (${teams.length} 个)\n`);
  console.log('名称'.padEnd(15) + '描述'.padEnd(20) + '成员数'.padEnd(10) + '协调者');
  console.log('-'.repeat(60));

  for (const team of teams) {
    console.log(
      team.name.padEnd(15) +
      (team.description || '-').padEnd(20).slice(0, 20) +
      String(team.members.length).padEnd(10) +
      (team.coordinator || '-')
    );
  }

  console.log('');
}

/**
 * 显示团队详情
 */
export async function showTeam(name: string): Promise<void> {
  if (!name) {
    console.error('请指定团队名称');
    process.exit(1);
  }

  const team = await teamStore.get(name);

  if (!team) {
    console.error(`❌ 团队 "${name}" 不存在`);
    process.exit(1);
  }

  console.log(`\n👥 团队详情: ${name}\n`);
  if (team.description) console.log(`  描述: ${team.description}`);
  if (team.coordinator) console.log(`  协调者: ${team.coordinator}`);
  console.log(`  成员数: ${team.members.length}`);

  if (team.members.length > 0) {
    console.log('\n  成员:');
    for (const member of team.members) {
      console.log(`    - ${member.name}${member.role ? ` (${member.role})` : ''}`);
    }
  }

  console.log('');
}

/**
 * 添加成员到团队
 */
export async function addMemberToTeam(args: {
  team: string;
  member: string;
  role?: string;
}): Promise<void> {
  const { team: teamName, member, role } = args;

  if (!teamName || !member) {
    console.error('❌ 请指定团队名称和成员名称');
    process.exit(1);
  }

  // 检查团队是否存在
  const teamExists = await teamStore.exists(teamName);
  if (!teamExists) {
    console.error(`❌ 团队 "${teamName}" 不存在`);
    process.exit(1);
  }

  // 检查成员是否是已定义的智能体
  const agent = await agentStore.get(member);
  const memberRole = role || (agent ? agent.role : undefined);

  const updatedTeam = await teamStore.addMember(teamName, {
    name: member,
    role: memberRole,
  });

  if (updatedTeam) {
    console.log(`✅ 成员 "${member}" 已添加到团队 "${teamName}"`);
  }
}

/**
 * 从团队移除成员
 */
export async function removeMemberFromTeam(teamName: string, memberName: string): Promise<void> {
  if (!teamName || !memberName) {
    console.error('❌ 请指定团队名称和成员名称');
    process.exit(1);
  }

  const team = await teamStore.get(teamName);
  if (!team) {
    console.error(`❌ 团队 "${teamName}" 不存在`);
    process.exit(1);
  }

  await teamStore.removeMember(teamName, memberName);
  console.log(`✅ 成员 "${memberName}" 已从团队 "${teamName}" 移除`);
}

/**
 * 删除团队
 */
export async function deleteTeam(name: string): Promise<void> {
  if (!name) {
    console.error('请指定团队名称');
    process.exit(1);
  }

  const exists = await teamStore.exists(name);
  if (!exists) {
    console.error(`❌ 团队 "${name}" 不存在`);
    process.exit(1);
  }

  await teamStore.delete(name);
  console.log(`✅ 团队 "${name}" 已删除`);
}

/**
 * 交互式添加成员
 */
async function addMembersInteractive(rl: readline.Interface, teamName: string): Promise<void> {
  while (true) {
    const memberName = await askQuestion(rl, '  成员名称 (输入空结束): ');
    if (!memberName) break;

    // 检查智能体是否存在
    const agent = await agentStore.get(memberName);
    if (!agent) {
      console.log(`    ⚠️ 智能体 "${memberName}" 不存在，将作为自定义成员添加`);
    }

    const role = await askQuestion(rl, `  角色 (可选, 默认 ${agent?.role || '成员'}): `);

    await teamStore.addMember(teamName, {
      name: memberName,
      role: role || agent?.role,
    });

    console.log(`    ✅ 已添加 ${memberName}`);
  }
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
