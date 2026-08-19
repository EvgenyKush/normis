/**
 * Serves the built static site so relative CSS/JS resolve (they do not over `file://`).
 * Read-only, loopback-only, no dependencies.
 *
 * Usage:
 *   node scripts/serve.mjs            → http://127.0.0.1:8765
 *   node scripts/serve.mjs 3000       → another port
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.argv[2] ?? 8765);

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
]);

const server = http.createServer((request, response) => {
  let relative;
  try {
    relative = decodeURIComponent(request.url.split('?')[0]);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (relative.endsWith('/')) relative += 'index.html';

  const target = path.resolve(root, `.${relative}`);
  if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
    return;
  }

  response.writeHead(200, {
    'content-type': CONTENT_TYPES.get(path.extname(target)) ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  response.end(fs.readFileSync(target));
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Serving ${root}\n`);
  process.stdout.write(`  landing  http://127.0.0.1:${port}/index.html\n`);
  process.stdout.write(`  course   http://127.0.0.1:${port}/course/index.html\n`);
  process.stdout.write(`  letters  http://127.0.0.1:${port}/letters/index.html\n`);
  process.stdout.write('Stop with Ctrl+C.\n');
});
