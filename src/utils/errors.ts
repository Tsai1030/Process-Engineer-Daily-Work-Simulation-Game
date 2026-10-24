import type { ContentIssue, SaveErrorKind, SaveSlotId } from '../model';

export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

export class ContentError extends Error {
  readonly issues: readonly ContentIssue[];

  constructor(message: string, issues: readonly ContentIssue[]) {
    super(message);
    this.name = 'ContentError';
    this.issues = issues;
  }

  static fromIssues(issues: readonly ContentIssue[]): ContentError {
    const errors = issues.filter((issue) => issue.severity === 'error');
    const first = errors[0] ?? issues[0];
    if (first === undefined) {
      throw new InvariantError('ContentError.fromIssues called without issues');
    }
    return new ContentError(
      `Content invalid: errors=${errors.length} first=${first.id} ${first.path} ${first.message}`,
      issues,
    );
  }
}

export class SaveError extends Error {
  constructor(
    readonly kind: SaveErrorKind,
    readonly slot: SaveSlotId | null,
    readonly detail: string,
  ) {
    super(`Save failed: kind=${kind} slot=${slot ?? 'none'} detail=${detail}`);
    this.name = 'SaveError';
  }
}

export class RenderError extends Error {
  constructor(
    readonly kind: 'webglUnavailable' | 'contextLost' | 'sceneBuild',
    readonly detail: string,
  ) {
    super(`Render failed: kind=${kind} detail=${detail}`);
    this.name = 'RenderError';
  }
}
