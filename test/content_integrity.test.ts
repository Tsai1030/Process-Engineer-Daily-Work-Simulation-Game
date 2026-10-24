import { describe, expect, test } from 'bun:test';
import { formatIssueLine, formatSummary } from '../scripts/validate_content';
import { content } from '../src/content';
import { validateContent } from '../src/core/content_validator';
import type { ContentIssue } from '../src/model';

// 01 §8.7 的輸出範例
const EXAMPLE_ERROR: ContentIssue = {
  severity: 'error',
  id: 'ev.et03_down',
  path: 'nodes.n_choice.choices[2].requires.all[1].flag',
  message: "unknown flag 'flag.azhe_refuse_coordination'",
};
const EXAMPLE_WARNING: ContentIssue = {
  severity: 'warning',
  id: 'ev.et03_down',
  path: 'nodes.n_r_stay.text',
  message: 'narration longer than 120 chars: length=126',
};

describe('real content', () => {
  test('passes the validator with zero issues', () => {
    expect(validateContent(content)).toEqual([]);
  });
  test('survives a JSON round trip unchanged (spec 01 section 1.2.3)', () => {
    expect(JSON.parse(JSON.stringify(content))).toEqual(content);
  });
});

describe('validate-content output', () => {
  test('formats each issue as one aligned line', () => {
    expect([formatIssueLine(EXAMPLE_ERROR), formatIssueLine(EXAMPLE_WARNING)]).toEqual([
      "error   ev.et03_down  nodes.n_choice.choices[2].requires.all[1].flag  unknown flag 'flag.azhe_refuse_coordination'",
      'warning ev.et03_down  nodes.n_r_stay.text  narration longer than 120 chars: length=126',
    ]);
  });
  test('summarizes counts and fails when any error exists', () => {
    const texts = Object.keys(content.text).length;
    expect([
      formatSummary([EXAMPLE_ERROR, EXAMPLE_WARNING], content),
      formatSummary([EXAMPLE_WARNING], content),
    ]).toEqual([
      `content validation failed: errors=1 warnings=1 events=0 texts=${texts}`,
      `content validation passed: errors=0 warnings=1 events=0 texts=${texts}`,
    ]);
  });
  test('the CLI exits 0 on the real content and prints the passing summary last', () => {
    const run = Bun.spawnSync(['bun', 'run', 'scripts/validate_content.ts']);
    const lastLine = run.stdout.toString().trim().split('\n').at(-1);
    expect({ exitCode: run.exitCode, lastLine }).toEqual({
      exitCode: 0,
      lastLine: `content validation passed: errors=0 warnings=0 events=0 texts=${Object.keys(content.text).length}`,
    });
  });
});
