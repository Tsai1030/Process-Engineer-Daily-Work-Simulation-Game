import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join as joinNative, resolve as resolveNative } from 'node:path';
import { dirname, join, normalize } from 'node:path/posix';

const REPO_ROOT = resolveNative(import.meta.dir, '..');
const FORBIDDEN_GLOBALS =
  /\b(window|document|localStorage|navigator|requestAnimationFrame|performance)\b|Math\.random|Date\.now|new Date\(\s*\)/g;

interface Violation {
  file: string;
  detail: string;
}

interface ImportRef {
  target: string;
  typeOnly: boolean;
  dynamic: boolean;
}

const LAYER_IMPORTS: Record<string, readonly string[]> = {
  model: [],
  utils: ['model', 'utils'],
  core: ['model', 'utils', 'core'],
  content: ['model', 'content'],
  persistence: ['model', 'utils', 'persistence'],
  render: ['model', 'utils', 'render'],
  audio: ['model', 'utils', 'audio'],
  ui: ['model', 'utils', 'ui'],
  app: ['model', 'utils', 'core', 'content', 'persistence', 'render', 'audio', 'ui', 'app'],
  main: [],
};
const MARKER = 'TO' + 'DO';
const UI_CORE_EXCEPTIONS = ['src/core/selectors', 'src/core/text'];

function listFiles(root: string): string[] {
  const names = [...new Bun.Glob('**/*').scanSync({ cwd: joinNative(REPO_ROOT, root) })];
  return names.map((name) => `${root}/${name.replaceAll('\\', '/')}`).sort();
}

function readText(path: string): string {
  return readFileSync(joinNative(REPO_ROOT, path), 'utf8');
}

function blank(chars: string[], from: number, to: number): void {
  for (let i = from; i < to; i++) {
    if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
  }
}

function skipQuoted(source: string, start: number, quote: string): number {
  let j = start + 1;
  while (j < source.length && source[j] !== quote && source[j] !== '\n') j += source[j] === '\\' ? 2 : 1;
  return j;
}

function skipTemplateExpression(source: string, start: number): number {
  let depth = 1;
  let j = start + 2;
  while (j < source.length && depth > 0) {
    if (source[j] === '{') depth++;
    else if (source[j] === '}') depth--;
    j++;
  }
  return j;
}

function skipTemplate(source: string, start: number): number {
  let j = start + 1;
  while (j < source.length && source[j] !== '`') {
    if (source[j] === '\\') j += 2;
    else if (source[j] === '$' && source[j + 1] === '{') j = skipTemplateExpression(source, j);
    else j++;
  }
  return j;
}

function skipComment(source: string, start: number, opener: string): number {
  const isLine = opener === '//';
  const close = isLine ? source.indexOf('\n', start) : source.indexOf('*/', start + 2);
  if (close < 0) return source.length;
  return isLine ? close : close + 2;
}

// Same-length copy: comments and string contents become spaces so indices line up with the original.
function stripCommentsAndStrings(source: string): string {
  const chars = source.split('');
  let i = 0;
  while (i < source.length) {
    const pair = source.slice(i, i + 2);
    if (pair === '//' || pair === '/*') {
      const end = skipComment(source, i, pair);
      blank(chars, i, end);
      i = end;
    } else if (source[i] === "'" || source[i] === '"' || source[i] === '`') {
      const end = source[i] === '`' ? skipTemplate(source, i) : skipQuoted(source, i, source[i] ?? '');
      blank(chars, i + 1, end);
      i = end + 1;
    } else {
      i++;
    }
  }
  return chars.join('');
}

function importsOf(source: string): ImportRef[] {
  const masked = stripCommentsAndStrings(source);
  const found: (ImportRef & { index: number })[] = [];
  const collect = (pattern: RegExp, dynamic: boolean): void => {
    for (const match of masked.matchAll(pattern)) {
      const quoteIndex = match.index + match[0].length - 1;
      const quote = masked[quoteIndex] ?? '';
      const closeIndex = masked.indexOf(quote, quoteIndex + 1);
      found.push({
        index: match.index,
        target: source.slice(quoteIndex + 1, closeIndex),
        typeOnly: !dynamic && match[1] !== undefined,
        dynamic,
      });
    }
  };
  collect(/\b(?:import|export)(\s+type\b)?\s*(?:[\w*${}\s,]+?\s*from)?\s*['"`]/g, false);
  collect(/\bimport\s*\(\s*['"`]/g, true);
  return found
    .sort((a, b) => a.index - b.index)
    .map(({ target, typeOnly, dynamic }) => ({ target, typeOnly, dynamic }));
}

function layerOf(path: string): string | null {
  const parts = path.split('/');
  if (parts[0] !== 'src' || parts.length < 2) return null;
  const second = parts[1] ?? '';
  return parts.length === 2 ? second.replace(/\.ts$/, '') : second;
}

function resolveImport(file: string, target: string): string {
  return normalize(join(dirname(file), target))
    .replace(/\?raw$/, '')
    .replace(/\.ts$/, '');
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

const isSpec = (file: string): boolean => file.endsWith('.spec.ts');
const isTs = (file: string): boolean => file.endsWith('.ts');
const srcFiles = listFiles('src').filter(isTs);
const testFiles = listFiles('test').filter(isTs);
const scriptFiles = listFiles('scripts').filter(isTs);
const filesInLayers = (layers: readonly string[]): string[] =>
  srcFiles.filter((file) => layers.includes(layerOf(file) ?? ''));

function isAllowedLocalImport(file: string, target: string, resolved: string): boolean {
  const layer = layerOf(file) ?? '';
  const targetLayer = layerOf(resolved);
  return (
    (isSpec(file) && resolved === 'test/fixtures') ||
    (layer === 'main' && resolved === 'src/app/bootstrap') ||
    (layer === 'ui' && UI_CORE_EXCEPTIONS.includes(resolved)) ||
    (layer === 'ui' && resolved.startsWith('src/assets/') && target.endsWith('.svg?raw')) ||
    (targetLayer !== null && (LAYER_IMPORTS[layer] ?? []).includes(targetLayer))
  );
}

function layerViolation(file: string, target: string): string | null {
  const layer = layerOf(file) ?? '';
  if (target.startsWith('bun:') || target.startsWith('node:')) return null;
  if (!target.startsWith('.')) {
    const isThree = target === 'three' || target.startsWith('three/addons/');
    return layer === 'render' && isThree ? null : `${layer} may not import package ${target}`;
  }
  const resolved = resolveImport(file, target);
  return isAllowedLocalImport(file, target, resolved) ? null : `${layer} may not import ${target} (${resolved})`;
}

function scanStripped(
  files: string[],
  pattern: RegExp,
  describeMatch: (match: RegExpMatchArray, line: number) => string,
): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const stripped = stripCommentsAndStrings(readText(file));
    for (const match of stripped.matchAll(pattern)) {
      violations.push({ file, detail: describeMatch(match, lineOf(stripped, match.index)) });
    }
  }
  return violations;
}

describe('architecture scanner', () => {
  test('importsOf finds static, multi-line, side-effect, re-export and dynamic imports but not comments or strings', () => {
    const source = [
      "import type { A } from '../model';",
      "import {\n  b,\n  c,\n} from 'three';",
      "import './side_effect';",
      "export { d } from './d';",
      "const m = await import('./dev_panel');",
      "// import x from 'commented';",
      'const s = "import y from \'in_string\'";',
    ].join('\n');
    expect(importsOf(source)).toEqual([
      { target: '../model', typeOnly: true, dynamic: false },
      { target: 'three', typeOnly: false, dynamic: false },
      { target: './side_effect', typeOnly: false, dynamic: false },
      { target: './d', typeOnly: false, dynamic: false },
      { target: './dev_panel', typeOnly: false, dynamic: true },
    ]);
  });

  test('stripCommentsAndStrings keeps code identifiers only', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: the sample source deliberately contains a template literal
    const source = "const a = 'window'; // document\n/* navigator */ const b = performance; const c = `x${location}`;";
    expect(stripCommentsAndStrings(source).match(/\b[A-Za-z_]\w*\b/g)).toEqual([
      'const',
      'a',
      'const',
      'b',
      'performance',
      'const',
      'c',
    ]);
  });
});

describe('architecture rules', () => {
  test('model.ts imports nothing', () => {
    const violations = importsOf(readText('src/model.ts')).map(({ target }) => ({
      file: 'src/model.ts',
      detail: `imports ${target}`,
    }));
    expect(violations).toEqual([]);
  });

  test('every import respects the layer rules of spec 01 section 4.2', () => {
    const violations: Violation[] = [];
    for (const file of srcFiles) {
      for (const { target } of importsOf(readText(file))) {
        const detail = layerViolation(file, target);
        if (detail !== null) violations.push({ file, detail });
      }
    }
    expect(violations).toEqual([]);
  });

  test('content imports model only as types', () => {
    const violations: Violation[] = [];
    for (const file of filesInLayers(['content'])) {
      for (const { target, typeOnly } of importsOf(readText(file))) {
        if (target.startsWith('.') && layerOf(resolveImport(file, target)) === 'model' && !typeOnly) {
          violations.push({ file, detail: `value import of ${target}` });
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('main.ts imports only app/bootstrap', () => {
    const violations = importsOf(readText('src/main.ts'))
      .filter(({ target }) => !target.startsWith('.') || resolveImport('src/main.ts', target) !== 'src/app/bootstrap')
      .map(({ target }) => ({ file: 'src/main.ts', detail: `imports ${target}` }));
    expect(violations).toEqual([]);
  });

  test('nothing imports dev_panel statically', () => {
    const violations: Violation[] = [];
    for (const file of [...srcFiles, ...testFiles]) {
      for (const { target, dynamic } of importsOf(readText(file))) {
        if (!dynamic && /(^|\/)dev_panel$/.test(target.replace(/\.ts$/, '')))
          violations.push({ file, detail: `static import of ${target}` });
      }
    }
    expect(violations).toEqual([]);
  });

  test('unit tests do not import real content', () => {
    const violations: Violation[] = [];
    for (const file of srcFiles.filter(isSpec)) {
      for (const { target } of importsOf(readText(file))) {
        if (target.startsWith('.') && resolveImport(file, target).startsWith('src/content'))
          violations.push({ file, detail: `imports ${target}` });
      }
    }
    expect(violations).toEqual([]);
  });

  test('core, utils and content use no forbidden globals', () => {
    const violations = scanStripped(
      filesInLayers(['core', 'utils', 'content']),
      FORBIDDEN_GLOBALS,
      (match, line) => `${match[0]} at line ${line}`,
    );
    expect(violations).toEqual([]);
  });

  test('persistence touches window and localStorage only in storage.ts', () => {
    const files = filesInLayers(['persistence']).filter((file) => file !== 'src/persistence/storage.ts');
    const violations = scanStripped(
      files,
      /\b(window|localStorage)\b/g,
      (match, line) => `${match[0]} at line ${line}`,
    );
    expect(violations).toEqual([]);
  });

  test('every directory under src and test has at least two entries', () => {
    const entries = new Map<string, Set<string>>();
    for (const file of [...listFiles('src'), ...listFiles('test')]) {
      const parts = file.split('/');
      for (let depth = 1; depth < parts.length; depth++) {
        const dir = parts.slice(0, depth).join('/');
        entries.set(dir, (entries.get(dir) ?? new Set<string>()).add(parts[depth] ?? ''));
      }
    }
    const violations = [...entries]
      .filter(([, children]) => children.size < 2)
      .map(([dir, children]) => ({ file: dir, detail: `has ${children.size} entry` }));
    expect(violations).toEqual([]);
  });

  test('file names are snake_case with an allowed extension', () => {
    const allowed = /^[a-z0-9_]+(\.spec|\.test)?\.(ts|css|svg)$/;
    const violations = [...listFiles('src'), ...listFiles('test'), ...listFiles('scripts')]
      .filter((file) => !allowed.test(file.split('/').pop() ?? ''))
      .map((file) => ({ file, detail: 'file name does not match snake_case pattern' }));
    expect(violations).toEqual([]);
  });

  test('spec files live in src and test files live in test', () => {
    const files = [...listFiles('src'), ...listFiles('test'), ...listFiles('scripts')];
    const violations = files.flatMap((file) => {
      if (file.endsWith('.spec.ts') && !file.startsWith('src/')) return [{ file, detail: '.spec.ts outside src' }];
      if (file.endsWith('.test.ts') && !file.startsWith('test/')) return [{ file, detail: '.test.ts outside test' }];
      return [];
    });
    expect(violations).toEqual([]);
  });

  test('no focused, skipped or todo tests are committed', () => {
    const pattern = /\.(only|skip|todo)\(/g;
    const testSources = [...srcFiles, ...testFiles, ...scriptFiles].filter(
      (file) => isSpec(file) || file.endsWith('.test.ts'),
    );
    const violations = scanStripped(testSources, pattern, (match, line) => `${match[0]} at line ${line}`);
    expect(violations).toEqual([]);
  });

  test(`every ${MARKER} carries an issue number registered in docs/issues.md`, () => {
    const marker = MARKER;
    const registered = new Set([...readText('docs/issues.md').matchAll(/^\| #(\d+) \|/gm)].map((match) => match[1]));
    const violations: Violation[] = [];
    for (const file of [...listFiles('src'), ...listFiles('test'), ...listFiles('scripts')]) {
      const source = readText(file);
      for (const match of source.matchAll(new RegExp(`${marker}(?: #(\\d+))?`, 'g'))) {
        const line = lineOf(source, match.index);
        if (match[1] === undefined) violations.push({ file, detail: `${marker} without issue number at line ${line}` });
        else if (!registered.has(match[1]))
          violations.push({ file, detail: `${marker} #${match[1]} not in docs/issues.md at line ${line}` });
      }
    }
    expect(violations).toEqual([]);
  });

  test('core, utils and content have no top-level let', () => {
    const violations = scanStripped(
      filesInLayers(['core', 'utils', 'content']),
      /^(?:export )?let /gm,
      (_match, line) => `top-level let at line ${line}`,
    );
    expect(violations).toEqual([]);
  });

  test('only Error subclasses use extends', () => {
    const pattern = /\bclass\s+\w+(?:<[^>{]*>)?\s+extends\s+([\w.]+)/g;
    const violations = scanStripped(srcFiles, pattern, (match, line) => `extends ${match[1]} at line ${line}`).filter(
      ({ detail }) => !detail.startsWith('extends Error at'),
    );
    expect(violations).toEqual([]);
  });

  test('no other file exports a type named like a model type', () => {
    const exportPattern = /\bexport\s+(?:type|interface)\s+(\w+)/g;
    const modelNames = new Set(
      [...stripCommentsAndStrings(readText('src/model.ts')).matchAll(exportPattern)].map((match) => match[1]),
    );
    const violations = scanStripped(
      srcFiles.filter((file) => file !== 'src/model.ts'),
      /\bexport\s+(?:type|interface|class)\s+(\w+)/g,
      (match, line) => `${match[1]} at line ${line}`,
    ).filter(({ detail }) => modelNames.has(detail.split(' ')[0]));
    expect(violations).toEqual([]);
  });

  test('content exports no functions', () => {
    const violations = scanStripped(
      filesInLayers(['content']),
      /\bexport\s+(?:async\s+)?function\b|\bexport\s+const\s+\w+\s*=\s*(?:async\s*)?\(/g,
      (match, line) => `${match[0]} at line ${line}`,
    );
    expect(violations).toEqual([]);
  });
});
