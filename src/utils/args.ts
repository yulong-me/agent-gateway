interface ParsedArgs {
  help: boolean;
  interactive: boolean;
  i: boolean;
  message: string | null;
  m: string | null;
  _: string[];
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
