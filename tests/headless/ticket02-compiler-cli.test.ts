import { expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { syntheticPack } from '../developmentPackFixture';
import { validateContentPack } from '../../src/application/content/ContentPackCodec';

const execute = promisify(execFile);

it('the actual compiler CLI writes deterministic validated bytes and refuses output overwrite', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'crossdefense-content-test-'));
  try {
    const assetsRoot = path.join(directory, 'assets');
    await mkdir(assetsRoot);
    await writeFile(path.join(assetsRoot, 'fixture.txt'), 'abc');
    const { assetManifest: _assets, integrity: _integrity, ...definition } = syntheticPack();
    const source = path.join(directory, 'source.json');
    await writeFile(source, JSON.stringify({ ...definition, assets: [{ path: 'fixture.txt', provenance: 'Synthetic test bytes.' }] }));
    const run = (out: string) => execute(process.execPath, [path.resolve('scripts/content/compile-development-pack.mjs'), '--source', source, '--assets-root', assetsRoot, '--out', out], { timeout: 20000, windowsHide: true });
    const a = path.join(directory, 'a.json'), b = path.join(directory, 'b.json');
    await run(a);
    await run(b);
    const first = await readFile(a, 'utf8');
    expect(await readFile(b, 'utf8')).toBe(first);
    expect((await validateContentPack(JSON.parse(first))).issues).toEqual([]);
    await expect(run(a)).rejects.toThrow();
    expect(await readFile(a, 'utf8')).toBe(first);
    await writeFile(source, JSON.stringify({ ...definition, assets: [{ path: '../source.json', provenance: 'Invalid path test.' }] }));
    await expect(run(path.join(directory, 'unsafe.json'))).rejects.toThrow();
    await expect(readFile(path.join(directory, 'unsafe.json'))).rejects.toThrow();
  } finally { await rm(directory, { recursive: true, force: true }); }
}, 60000);
