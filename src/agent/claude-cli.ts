import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ClaudeCLIConfig {
  command?: string;
  model?: string;
  cwd?: string;
  env?: Record<string, string>;
  onChunk?: (chunk: string) => void;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Check if Claude CLI is available
 */
export async function checkClaudeCLI(): Promise<{
  available: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const { stdout } = await execAsync('claude --version');
    const version = stdout.trim();
    return { available: true, version };
  } catch (error: any) {
    return {
      available: false,
      error: error.message || 'Claude CLI not found',
    };
  }
}

/**
 * Parse Claude CLI JSON stream output
 */
function parseClaudeOutput(stdout: string, onChunk?: (text: string) => void): ClaudeResponse {
  const lines = stdout.split('\n').filter(Boolean);
  const parts: string[] = [];
  let usage: ClaudeResponse['usage'];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);

      // Handle assistant message (完整消息格式)
      if (data.type === 'assistant' && data.message?.content) {
        for (const block of data.message.content) {
          if (block.type === 'text') {
            const text = block.text || '';
            parts.push(text);
            if (onChunk) onChunk(text);
          } else if (block.type === 'tool_use') {
            // 工具调用
            const toolName = block.name || 'unknown';
            const toolInput = JSON.stringify(block.input || {}).slice(0, 100);
            const toolMsg = `\n\n🔧 [工具调用: ${toolName}]\n输入: ${toolInput}\n`;
            parts.push(toolMsg);
            if (onChunk) onChunk(toolMsg);
          }
        }
        // 获取 usage
        if (data.message.usage) {
          usage = {
            inputTokens: data.message.usage.input_tokens || 0,
            outputTokens: data.message.usage.output_tokens || 0,
          };
        }
        continue;
      }

      // Handle content block delta (stream-json format)

      // Handle content block delta (stream-json format)
      if (data.type === 'content_block_delta') {
        if (data.delta?.type === 'text_delta') {
          const text = data.delta.text;
          parts.push(text);
          if (onChunk) onChunk(text);
        }
      }
      // Handle result (最终结果)
      else if (data.type === 'result') {
        if (data.result && parts.length === 0) {
          parts.push(data.result);
        }
        // 从 result 中获取 usage
        if (data.usage) {
          usage = {
            inputTokens: data.usage.input_tokens || usage?.inputTokens || 0,
            outputTokens: data.usage.output_tokens || usage?.outputTokens || 0,
          };
        }
      }
      // Handle message start
      else if (data.type === 'message_start') {
        if (data.message?.usage) {
          usage = {
            inputTokens: data.message.usage.input_tokens || 0,
            outputTokens: data.message.usage.output_tokens || 0,
          };
        }
      }
      // Handle message delta
      else if (data.type === 'message_delta') {
        if (data.usage?.output_tokens) {
          usage = {
            inputTokens: usage?.inputTokens || 0,
            outputTokens: data.usage.output_tokens,
          };
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return {
    content: parts.join(''),
    usage,
  };
}

/**
 * Call Claude CLI
 */
export async function callClaudeCLI(
  config: ClaudeCLIConfig,
  systemPrompt: string,
  userMessage: string,
  options?: {
    timeoutMs?: number;
    onChunk?: (chunk: string) => void;
  }
): Promise<ClaudeResponse> {
  const timeoutMs = options?.timeoutMs ?? 60000;
  const onChunk = options?.onChunk ?? config.onChunk;
  const command = config.command || 'claude';
  const args = [
    '--print',
    '-',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', config.model || 'claude-sonnet-4-6',
    '--dangerously-skip-permissions', // 跳过权限检查，允许写入文件
  ];

  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  // Remove CLAUDECODE to avoid nested session issues
  const childEnv = { ...process.env };
  delete childEnv.CLAUDECODE;
  Object.assign(childEnv, config.env);

  return new Promise((resolve, reject) => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const child = spawn(command, args, {
      cwd: config.cwd || process.cwd(),
      env: childEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Claude CLI 调用超时'));
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const stdout = Buffer.concat(stdoutChunks).toString();
      const stderr = Buffer.concat(stderrChunks).toString();

      if (code === 0) {
        try {
          const response = parseClaudeOutput(stdout, onChunk);
          resolve(response);
        } catch (error) {
          resolve({
            content: stdout || '无法解析输出',
          });
        }
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    child.stdin?.write(fullPrompt);
    child.stdin?.end();
  });
}
