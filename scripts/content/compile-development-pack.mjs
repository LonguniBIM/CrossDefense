import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const usage = 'Usage: node scripts/content/compile-development-pack.mjs --source <authored.json> --assets-root <directory> --out <new-manifest.json>';
const values = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!['--source', '--assets-root', '--out'].includes(key) || !value || values.has(key)) {
    console.error(usage);
    process.exitCode = 1;
    break;
  }
  values.set(key, value);
}
if (values.size !== 3 && !process.exitCode) { console.error(usage); process.exitCode = 1; }

if (!process.exitCode) {
  let server;
  try {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const assetRoot = await realpath(path.resolve(values.get('--assets-root')));
    if (!(await stat(assetRoot)).isDirectory()) throw new Error('Assets root must be a directory.');
    const source = JSON.parse(await readFile(path.resolve(values.get('--source')), 'utf8'));
    // Use the repository's existing TS transform without listening on a port or
    // loading project/provider plugins. Runtime and authoring share one codec.
    server = await createServer({ root, configFile: false, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, watch: null } });
    const { compileDevelopmentPack, canonicalStringify } = await server.ssrLoadModule('/src/application/content/ContentPackCodec.ts');
    const compiled = await compileDevelopmentPack(source, async relativePath => {
      const target = await realpath(path.join(assetRoot, relativePath));
      const relative = path.relative(assetRoot, target);
      if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Asset path escapes the selected assets root.');
      if (!(await stat(target)).isFile()) throw new Error('An asset source is not a regular file.');
      return new Uint8Array(await readFile(target));
    });
    const out = path.resolve(values.get('--out'));
    await mkdir(path.dirname(out), { recursive: true });
    // Never overwrite authored sources or an existing artifact implicitly.
    await writeFile(out, canonicalStringify(compiled) + '\n', { flag: 'wx' });
    console.log('Compiled development pack: ' + out);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await server?.close();
  }
}
