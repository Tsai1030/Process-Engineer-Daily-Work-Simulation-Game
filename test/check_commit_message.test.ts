import { describe, expect, test } from 'bun:test';
import { checkCommitMessage } from '../scripts/check_commit_message';

const LONG_DESCRIPTION = 'x'.repeat(73);
const ACCEPTED: string[] = [
  'chore(repo): initialize bun, vite, typescript and biome toolchain',
  'feat(core)!: drop the legacy spread formula',
  'docs: explain the CLAUDE.md rules for contributors',
  "Merge branch 'main' into stage1",
  'fix(save): reject saves whose checksum does not match\n\nTruncated writes were loading as half-empty states.',
];
const header = (line: string): string =>
  `commit message rejected: header does not match Conventional Commits: "${line}"`;
const REJECTED: [string, string][] = [
  ['update stuff', header('update stuff')],
  ['Feat: add hud', header('Feat: add hud')],
  ['fix(Core): clamp stats', header('fix(Core): clamp stats')],
  [`feat: ${LONG_DESCRIPTION}`, header(`feat: ${LONG_DESCRIPTION}`)],
  [
    'feat(core): add rng\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
    'commit message rejected: AI co-author trailer: line="Co-Authored-By: Claude <noreply@anthropic.com>"',
  ],
  ['feat(core): port the evaluator suggested by ChatGPT', 'commit message rejected: mentions an AI tool: word=chatgpt'],
  ['chore: tidy gemini settings', 'commit message rejected: mentions an AI tool: word=gemini'],
];

describe('checkCommitMessage', () => {
  test.each(ACCEPTED)('accepts %p', (message) => {
    expect(checkCommitMessage(message)).toBeNull();
  });
  test.each(REJECTED)('rejects %p with the exact single-line reason', (message, reason) => {
    expect(checkCommitMessage(message)).toBe(reason);
  });
});
