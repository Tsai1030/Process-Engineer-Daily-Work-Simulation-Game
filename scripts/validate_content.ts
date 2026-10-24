import { content } from '../src/content';
import { validateContent } from '../src/core/content_validator';
import type { ContentBundle, ContentIssue } from '../src/model';

// 01 §8.7
export function formatIssueLine(issue: ContentIssue): string {
  return `${issue.severity.padEnd(8)}${issue.id}  ${issue.path}  ${issue.message}`;
}

export function formatSummary(issues: readonly ContentIssue[], bundle: ContentBundle): string {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.length - errors;
  const events = Object.keys(bundle.events).length;
  const texts = Object.keys(bundle.text).length;
  const verdict = errors > 0 ? 'failed' : 'passed';
  return `content validation ${verdict}: errors=${errors} warnings=${warnings} events=${events} texts=${texts}`;
}

if (import.meta.main) {
  const issues = validateContent(content);
  for (const issue of issues) console.log(formatIssueLine(issue));
  console.log(formatSummary(issues, content));
  if (issues.some((issue) => issue.severity === 'error')) process.exit(1);
}
