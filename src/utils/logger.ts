import { InvariantError } from './errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(m: string): void;
  info(m: string): void;
  warn(m: string): void;
  error(m: string, cause?: unknown): void;
  child(module: string): Logger;
  recent(): readonly string[];
}

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const LINE_BREAK = /\r?\n/g;

function formatMessage(message: string, strict: boolean): string {
  if (!message.includes('\n')) {
    return message;
  }
  if (strict) {
    throw new InvariantError(`Log message must be single line: length=${message.length}`);
  }
  return message.replace(LINE_BREAK, '⏎');
}

function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

// strict 只檢查呼叫端寫的訊息；第三方 cause 可能多行，一律摺成 ⏎
function formatLine(message: string, cause: unknown, strict: boolean): string {
  const text = formatMessage(message, strict);
  return cause === undefined ? text : `${text} cause=${describeCause(cause).replace(LINE_BREAK, '⏎')}`;
}

interface LoggerCore {
  write(level: LogLevel, prefix: string, message: string, cause?: unknown): void;
  recent(): readonly string[];
}

function createLogger(core: LoggerCore, prefix: string): Logger {
  return {
    debug: (m) => core.write('debug', prefix, m),
    info: (m) => core.write('info', prefix, m),
    warn: (m) => core.write('warn', prefix, m),
    error: (m, cause) => core.write('error', prefix, m, cause),
    child: (module) => createLogger(core, `${prefix}[${module}] `),
    recent: () => core.recent(),
  };
}

export function createConsoleLogger(options: {
  level: LogLevel;
  now: () => string;
  ringSize: number;
  strictSingleLine?: boolean;
}): Logger {
  const ring: string[] = [];
  const strict = options.strictSingleLine === true;
  const core: LoggerCore = {
    write(level, prefix, message, cause) {
      if (LEVEL_RANK[level] < LEVEL_RANK[options.level]) {
        return;
      }
      const line = `${options.now()} ${level} ${prefix}${formatLine(message, cause, strict)}`;
      ring.push(line);
      if (ring.length > options.ringSize) {
        ring.shift();
      }
      console[level](line);
    },
    recent: () => [...ring],
  };
  return createLogger(core, '');
}

export function createMemoryLogger(): Logger & { lines: string[] } {
  const lines: string[] = [];
  const core: LoggerCore = {
    write(level, prefix, message, cause) {
      lines.push(`${level} ${prefix}${formatLine(message, cause, true)}`);
    },
    recent: () => lines,
  };
  return { ...createLogger(core, ''), lines };
}
