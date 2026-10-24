import { readFileSync } from 'node:fs';

const HEADER_PATTERN = /^(feat|fix|build|chore|ci|docs|style|refactor|perf|test)(\([a-z0-9_-]+\))?!?: .{1,72}$/;
const AI_TOOL_WORDS: readonly string[] = ['claude', 'anthropic', 'chatgpt', 'openai', 'copilot', 'gemini'];
const ALLOWED_FILE_NAME = /CLAUDE\.md/g;

function findAiToolWord(text: string): string | undefined {
  const lowered = text.replace(ALLOWED_FILE_NAME, '').toLowerCase();
  return AI_TOOL_WORDS.find((word) => lowered.includes(word));
}

export function checkCommitMessage(message: string): string | null {
  const lines = message.split('\n').filter((line) => !line.startsWith('#'));
  const header = lines[0] ?? '';
  if (header.startsWith('Merge ')) return null;
  if (!HEADER_PATTERN.test(header)) {
    return `commit message rejected: header does not match Conventional Commits: "${header}"`;
  }
  const coAuthorLine = lines.find((line) => /^co-authored-by:/i.test(line) && findAiToolWord(line) !== undefined);
  if (coAuthorLine !== undefined) return `commit message rejected: AI co-author trailer: line="${coAuthorLine}"`;
  const word = findAiToolWord(lines.join('\n'));
  if (word !== undefined) return `commit message rejected: mentions an AI tool: word=${word}`;
  return null;
}

if (import.meta.main) {
  const messagePath = process.argv[2];
  if (messagePath === undefined) {
    console.error('commit message rejected: missing message file argument');
    process.exit(1);
  }
  const reason = checkCommitMessage(readFileSync(messagePath, 'utf8'));
  if (reason !== null) {
    console.error(reason);
    process.exit(1);
  }
}
