import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.CROSSDEFENSE_T12_PORT ?? '4188');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid owned Ticket12 port.');
const defaultRoot = process.env.CROSSDEFENSE_T12_DIST ?? fileURLToPath(new URL('../../dist/', import.meta.url));
const roots = { a: await realpath(resolve(process.env.CROSSDEFENSE_T12_DIST_A ?? defaultRoot)),
  b: process.env.CROSSDEFENSE_T12_DIST_B ? await realpath(resolve(process.env.CROSSDEFENSE_T12_DIST_B)) : undefined };
const controlToken = process.env.CROSSDEFENSE_T12_CONTROL_TOKEN;
let variant = 'a', failPaths = new Set(), corruptPackPaths = new Set();
const media = new Map([['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json'], ['.webmanifest', 'application/manifest+json'],
  ['.png', 'image/png'], ['.svg', 'image/svg+xml'], ['.ico', 'image/x-icon'], ['.woff2', 'font/woff2']]);

/** Node-side test controls are confined to this loopback server and an ephemeral per-run token. */
async function control(request, response) {
  if (!controlToken || request.headers.authorization !== 'Bearer ' + controlToken) {
    response.writeHead(403).end('Forbidden'); return;
  }
  if (request.method !== 'POST') { response.writeHead(405).end('Method not allowed'); return; }
  try {
    const chunks = []; let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > 4096) { response.writeHead(413).end('Control payload too large'); return; }
      chunks.push(chunk);
    }
    const next = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!['a', 'b'].includes(next.variant) || !roots[next.variant] || !Array.isArray(next.failPaths) ||
        next.failPaths.length > 20 || next.failPaths.some(path => typeof path !== 'string' || !path.startsWith('/') || path.length > 500)) {
      response.writeHead(400).end('An available build variant and bounded exact failure paths are required'); return;
    }
    if (next.corruptPackPaths !== undefined && (!Array.isArray(next.corruptPackPaths) || next.corruptPackPaths.length > 20 ||
        next.corruptPackPaths.some(path => typeof path !== 'string' || !/^\/content\/packs\/[a-z0-9-]+\/manifest\.json$/.test(path)))) {
      response.writeHead(400).end('Corruption is limited to exact Content Pack manifest paths'); return;
    }
    variant = next.variant; failPaths = new Set(next.failPaths); corruptPackPaths = new Set(next.corruptPackPaths ?? []);
    response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ variant, failPaths: [...failPaths],
      ...(next.corruptPackPaths === undefined ? {} : { corruptPackPaths: [...corruptPackPaths] }) }));
  } catch { response.writeHead(400).end('Invalid control payload'); }
}

/** Owned loopback production bundle. No SPA/source fallback or existing-server reuse. */
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400).end('Invalid path'); return; }
  if (pathname === '/__ticket12_control') { await control(request, response); return; }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end('Method not allowed'); return;
  }
  if (pathname === '/__ticket12_health') {
    response.writeHead(200, { 'Content-Type': 'text/plain' }).end('Ticket12 owned production server'); return;
  }
  if (failPaths.has(pathname)) { response.writeHead(503).end('Injected owned preparation failure'); return; }
  const root = roots[variant];
  try {
    const target = await realpath(resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname)));
    const rel = relative(root, target);
    if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep)) {
      response.writeHead(404).end('Not found'); return;
    }
    const info = await stat(target);
    if (!info.isFile()) { response.writeHead(404).end('Not found'); return; }
    if (corruptPackPaths.has(pathname)) {
      const pack = JSON.parse(await readFile(target, 'utf8'));
      pack.integrity.manifestSha256 = '0'.repeat(64);
      const bytes = Buffer.from(JSON.stringify(pack));
      response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes); return;
    }
    response.writeHead(200, { 'Content-Type': media.get(extname(target)) ?? 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = createReadStream(target);
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
});
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('Ticket12 production server ready: http://127.0.0.1:' + port));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
