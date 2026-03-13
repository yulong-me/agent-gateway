import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ClaudeCLIConfig {
  command?: string;
  model?: string;
  cwd?: string;
  env?: Record<string, string>;
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
function parseClaudeOutput(stdout: string): ClaudeResponse {
  const lines = stdout.split('\n').filter(Boolean);
  const parts: string[] = [];
  let usage: ClaudeResponse['usage'];

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      // Handle content block delta
      if (data.type === 'content_block_delta') {
        if (data.delta?.type === 'text_delta') {
          parts.push(data.delta.text);
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
      // Handle result
      else if (data.type === 'result') {
        if (data.result && parts.length === 0) {
          parts.push(data.result);
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
  timeoutMs: number = 60000
): Promise<ClaudeResponse> {
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
          const response = parseClaudeOutput(stdout);
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
