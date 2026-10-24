import { describe, expect, test } from 'bun:test';
import type { ContentIssue } from '../model';
import { ContentError, InvariantError, RenderError, SaveError } from './errors';

// 01 §12.2 的訊息範例：3 個 error、前面有 1 個 warning
const ISSUES: readonly ContentIssue[] = [
  {
    severity: 'warning',
    id: 'ev.et03_down',
    path: 'nodes.n_r_stay.text',
    message: 'narration longer than 120 chars: length=126',
  },
  {
    severity: 'error',
    id: 'ev.et03_down',
    path: 'nodes.n_choice.choices[2].requires.all[1].flag',
    message: "unknown flag 'flag.azhe_refuse_coordination'",
  },
  { severity: 'error', id: 'ev.x', path: 'start', message: "unknown node 'n_x'" },
  { severity: 'error', id: 'ev.y', path: 'start', message: "unknown node 'n_y'" },
];

describe('ContentError.fromIssues', () => {
  test('summarizes the error count and the first error on one line, keeping every issue', () => {
    const error = ContentError.fromIssues(ISSUES);
    expect({ message: error.message, issues: error.issues }).toEqual({
      message:
        "Content invalid: errors=3 first=ev.et03_down nodes.n_choice.choices[2].requires.all[1].flag unknown flag 'flag.azhe_refuse_coordination'",
      issues: ISSUES,
    });
  });
  test('refuses an empty issue list', () => {
    expect(() => ContentError.fromIssues([])).toThrow(InvariantError);
  });
});

describe('SaveError and RenderError', () => {
  test('carry kind and detail in a single-line message', () => {
    expect([
      new SaveError('checksum', 'slot1', 'expected=1a2b actual=3c4d').message,
      new SaveError('storageUnavailable', null, 'quota').message,
      new RenderError('webglUnavailable', 'context creation failed').message,
    ]).toEqual([
      'Save failed: kind=checksum slot=slot1 detail=expected=1a2b actual=3c4d',
      'Save failed: kind=storageUnavailable slot=none detail=quota',
      'Render failed: kind=webglUnavailable detail=context creation failed',
    ]);
  });
});
