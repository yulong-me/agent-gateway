interface ParsedArgs {
  help: boolean;
  interactive: boolean;
  i: boolean;
  message: string | null;
  m: string | null;
  _: string[];
  // agent 命令参数
  name?: string;
  role?: string;
  personality?: string;
  specialty?: string;
  description?: string;
  model?: string;
  color?: string;
  // run 命令参数
  agents?: string;
  coordinator?: string;
  task?: string;
  teamMode?: boolean;
  // team 命令参数
  team?: string;
}

export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    help: false,
    interactive: false,
    i: false,
    message: null,
    m: null,
    _: [],
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      i++;
      continue;
    }

    if (arg === '--interactive' || arg === '-i') {
      result.interactive = true;
      result.i = true;
      i++;
      continue;
    }

    if (arg === '--message' || arg === '-m') {
      result.message = args[i + 1] || null;
      result.m = result.message;
      i += 2;
      continue;
    }

    // agent 命令参数
    if (arg === '--name') {
      result.name = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--role') {
      result.role = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--personality') {
      result.personality = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--specialty') {
      result.specialty = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--description') {
      result.description = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--model') {
      result.model = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--color') {
      result.color = args[i + 1];
      i += 2;
      continue;
    }

    // run 命令参数
    if (arg === '--agents' || arg === '-a') {
      result.agents = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--coordinator') {
      result.coordinator = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--task') {
      result.task = args[i + 1];
      i += 2;
      continue;
    }
    if (arg === '--team-mode') {
      result.teamMode = true;
      i++;
      continue;
    }

    // team 命令参数
    if (arg === '--team') {
      result.team = args[i + 1];
      i += 2;
      continue;
    }

    // Positional argument
    if (!arg.startsWith('-')) {
      result._.push(arg);
      i++;
      continue;
    }

    i++;
  }

  return result;
}
