import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
import { compileDevelopmentPack, canonicalStringify, validateContentPack } from '../../src/application/content/ContentPackCodec';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { RunApplication } from '../../src/application/run/RunApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';
import { APP_VERSION, DEVELOPMENT_RULESET_VERSION } from '../../src/application/version';

const sourcePath = path.resolve('content/authoring/development-starter-ship-v1.json');
const runtimePath = path.resolve('public/content/packs/development/manifest.json');
const compatibility = { appVersion: APP_VERSION, rulesetVersion: DEVELOPMENT_RULESET_VERSION };
const execute = promisify(execFile);

// Expected values come from the user's explicit Q1/Q2 approval, not a test fixture factory.
const approvedSource = {
  contentVersion: 'development-starter-ship-v1',
  schemaVersion: 1,
  compatibleRuleset: 'development-ruleset-2026-09-30',
  minimumAppVersion: '0.1.0',
  preRun: {
    collectionQuota: 8,
    starterObjective: { targetWord: 'SHIP', requiresWeaponTile: true },
    viabilityTiles: [
      { letter: 'S', subtype: 'Ballistic' },
      { letter: 'H', subtype: 'Armor' },
      { letter: 'I', subtype: 'Power' },
      { letter: 'P', subtype: 'Armor' },
      { letter: 'S', subtype: 'Ballistic' },
      { letter: 'H', subtype: 'Armor' },
      { letter: 'I', subtype: 'Power' },
      { letter: 'P', subtype: 'Armor' },
    ],
  },
  assets: [],
};

it('authors exactly the approved SHIP content and validates it without selecting any assets', async () => {
  expect(existsSync(sourcePath), 'The approved SHIP authoring source must exist.').toBe(true);
  const source: unknown = JSON.parse(await readFile(sourcePath, 'utf8'));
  expect(source).toEqual(approvedSource);
  const compiled = await compileDevelopmentPack(source, async () => {
    throw new Error('The approved empty assets list must not read asset files.');
  });
  expect(compiled.preRun).toEqual(approvedSource.preRun);
  expect(compiled.assetManifest).toEqual([]);
  expect((await validateContentPack(compiled, compatibility)).issues).toEqual([]);
});

it('ships the canonical generated artifact at the actual runtime content path', async () => {
  expect(existsSync(runtimePath), 'The approved compiled runtime manifest must exist.').toBe(true);
  const source: unknown = JSON.parse(await readFile(sourcePath, 'utf8'));
  const generated = await compileDevelopmentPack(source, async () => { throw new Error('No assets approved.'); });
  const text = await readFile(runtimePath, 'utf8');
  expect(text).toBe(canonicalStringify(generated) + '\n');
  const validation = await validateContentPack(JSON.parse(text), compatibility);
  expect(validation.issues).toEqual([]);
  expect(validation.pack?.preRun).toEqual(approvedSource.preRun);
});

it('compiles the real approved source twice with the actual CLI to byte-identical runtime content', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'crossdefense-ship-compile-'));
  try {
    const a = path.join(directory, 'a.json');
    const b = path.join(directory, 'b.json');
    for (const output of [a, b]) {
      await execute(process.execPath, [path.resolve('scripts/content/compile-development-pack.mjs'),
        '--source', sourcePath, '--assets-root', path.dirname(sourcePath), '--out', output],
      { timeout: 20000, windowsHide: true });
    }
    const first = await readFile(a, 'utf8');
    expect(await readFile(b, 'utf8')).toBe(first);
    expect(await readFile(runtimePath, 'utf8')).toBe(first);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 60000);

it('starts one pinned SHIP Run, preserves it on reload and restores it after content returns', async () => {
  const manifest: unknown = JSON.parse(await readFile(runtimePath, 'utf8'));
  const packs = new InMemoryContentPackRepository();
  const content = new ContentPackApplication(packs, compatibility);
  await content.bootstrap();
  expect((await content.activateCandidate(manifest)).activated).toBe(true);
  const repository = new InMemoryRunRepository();
  let sequence = 0;
  const app = new RunApplication(repository, content, () => 'ship-run-' + ++sequence,
    () => '2026-10-05T12:00:00.000Z');
  await app.bootstrap();
  const first = await app.startRun({ operationId: 'ship-start', pilotId: 'ship-pilot' });
  expect(first).toMatchObject({ kind: 'pre-run-salvage', run: {
    contentVersion: 'development-starter-ship-v1', rulesetVersion: DEVELOPMENT_RULESET_VERSION,
    quota: { total: 8, remaining: 8 }, starterObjective: { targetWord: 'SHIP', requiresWeaponTile: true },
  } });
  for (const result of await Promise.all([
    app.startRun({ operationId: 'ship-start', pilotId: 'ship-pilot' }),
    app.startRun({ operationId: 'ship-start-again', pilotId: 'ship-pilot' }),
  ])) expect(result).toEqual(first);
  expect(await repository.countRuns()).toBe(1);
  const reloaded = new RunApplication(repository, content, () => 'unused');
  expect(await reloaded.getRunProjection('ship-pilot')).toEqual(first);
  packs.removePack('development-starter-ship-v1');
  expect(await reloaded.getRunProjection('ship-pilot')).toMatchObject({
    kind: 'content-required', missingContentVersion: 'development-starter-ship-v1',
  });
  expect((await content.activateCandidate(manifest)).activated).toBe(true);
  expect(await reloaded.getRunProjection('ship-pilot')).toEqual(first);
});

it('rejects tampering with the real SHIP candidate while preserving its Last Known Good', async () => {
  const manifest = JSON.parse(await readFile(runtimePath, 'utf8'));
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), compatibility);
  await content.bootstrap();
  const accepted = await content.activateCandidate(manifest);
  expect(accepted.activated).toBe(true);
  const damaged = structuredClone(manifest);
  damaged.preRun.collectionQuota = 7; // Negative test only; never saved to authored/runtime content.
  const rejected = await content.activateCandidate(damaged);
  expect(rejected.activated).toBe(false);
  expect(rejected.issues).toContainEqual(expect.objectContaining({ code: 'INTEGRITY_MISMATCH' }));
  expect(rejected.state).toEqual(accepted.state);
  expect((await content.getActivePack())?.preRun).toEqual(approvedSource.preRun);
});
