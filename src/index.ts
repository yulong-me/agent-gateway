#!/usr/bin/env node

import { Agent } from './agent/Agent.js';
import { checkClaudeCLI } from './agent/claude-cli.js';
import { parseArgs } from './utils/args.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));

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

async function sendMessage(content: string) {
  const agent = new Agent({
    id: 'cli-agent',
    name: 'CLI Agent',
    role: 'assistant',
  });

  console.log('\n🤔 思考中...\n');

  let isFirstChunk = true;
  process.stdout.write('📝 ');

  try {
    const response = await agent.chat(content, {
      onChunk: (chunk) => {
        if (isFirstChunk) {
          isFirstChunk = false;
        }
        process.stdout.write(chunk);
        process.stdout.flush();
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
          process.stdout.flush();
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
🎯 Agent Gateway

用法:
  agent-gateway [选项] [消息]

选项:
  -i, --interactive    启动交互模式
  -m, --message <msg>  发送单条消息
  -h, --help           显示帮助信息

示例:
  agent-gateway "你好"
  agent-gateway --interactive
  agent-gateway -m "帮我写一个函数"
`);
}

main();
