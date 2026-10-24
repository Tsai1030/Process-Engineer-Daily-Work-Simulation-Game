export {};

const DIST_DIR = 'dist';
const DEV_PANEL_MARKER = '__FAB7_DEV_PANEL__';
const CSP_META = '<meta http-equiv="Content-Security-Policy"';
const GZIP_LIMIT_BYTES = 358400;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const indexHtml = await Bun.file(`${DIST_DIR}/index.html`).text();
if (!indexHtml.includes(CSP_META)) fail('dist check failed: missing CSP meta: file=dist/index.html');

for await (const scannedPath of new Bun.Glob('**/*').scan({ cwd: DIST_DIR })) {
  const relativePath = scannedPath.replaceAll('\\', '/');
  const text = await Bun.file(`${DIST_DIR}/${relativePath}`).text();
  if (text.includes(DEV_PANEL_MARKER)) fail(`dist check failed: dev panel marker found: file=${relativePath}`);
}

const entrySrc = /<script\b[^>]*type="module"[^>]*\bsrc="([^"]+)"/.exec(indexHtml)?.[1];
if (entrySrc === undefined) fail('dist check failed: entry script not found: file=dist/index.html');
const entryPath = entrySrc.replace(/^\.?\//, '');
const gzipBytes = Bun.gzipSync(await Bun.file(`${DIST_DIR}/${entryPath}`).bytes()).length;
if (gzipBytes > GZIP_LIMIT_BYTES) {
  fail(`dist check failed: entry js too large: file=${entryPath} gzipBytes=${gzipBytes} limit=${GZIP_LIMIT_BYTES}`);
}
console.log(`dist check passed: entry=${entryPath} gzipBytes=${gzipBytes}`);
