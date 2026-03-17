/**
 * 消息显示工具 - 智能体对话界面
 */

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // 前景色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // 背景色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// 智能体默认颜色
const agentColors: Record<string, { border: string; name: string }> = {
  alice: { border: colors.green, name: colors.green },
  bob: { border: colors.blue, name: colors.blue },
};

/**
 * 显示消息气泡
 */
export function showMessageBubble(sender: string, message: string): void {
  const color = agentColors[sender.toLowerCase()] || { border: colors.cyan, name: colors.cyan };

  const borderColor = color.border;
  const nameColor = color.name;
  const reset = colors.reset;

  // 计算气泡宽度
  const maxWidth = Math.min(process.stdout.columns || 60, 60);
  const contentWidth = maxWidth - 4; // 减去边框和间距

  // 分割多行消息
  const lines = message.split('\n');
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (line.length <= contentWidth) {
      wrappedLines.push(line);
    } else {
      // 简单换行处理
      let remaining = line;
      while (remaining.length > contentWidth) {
        wrappedLines.push(remaining.slice(0, contentWidth));
        remaining = remaining.slice(contentWidth);
      }
      if (remaining) {
        wrappedLines.push(remaining);
      }
    }
  }

  // 构建气泡
  const topBorder = `${borderColor}┌─${nameColor}${sender}${borderColor}─${'─'.repeat(Math.max(0, maxWidth - sender.length - 4))}┐${reset}`;
  const bottomBorder = `${borderColor}└${'─'.repeat(maxWidth - 2)}┘${reset}`;

  console.log('');
  console.log(topBorder);

  for (const line of wrappedLines) {
    const padding = ' '.repeat(Math.max(0, maxWidth - line.length - 4));
    console.log(`${borderColor}│${reset} ${line}${padding}${borderColor} │${reset}`);
  }

  console.log(bottomBorder);
  console.log('');
}

/**
 * 显示简洁的消息行
 */
export function showMessageLine(sender: string, message: string): void {
  const color = agentColors[sender.toLowerCase()] || { border: colors.cyan, name: colors.cyan };
  console.log(`\n${color.name}${sender}${colors.reset}: ${message}\n`);
}
