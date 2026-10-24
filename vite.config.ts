import { defineConfig, type Plugin } from 'vite';

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob:",
  "connect-src 'self'",
].join('; ');

function productionCsp(): Plugin {
  return {
    name: 'fab7-production-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<!-- CSP -->', `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`),
  };
}

export default defineConfig({
  base: './',
  plugins: [productionCsp()],
  build: { target: 'es2022', sourcemap: true },
});
