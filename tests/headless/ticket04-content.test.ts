import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compileDevelopmentPack, validateContentPack } from '../../src/application/content/ContentPackCodec';

const legacy = JSON.parse(readFileSync('content/authoring/development-starter-ship-v1.json', 'utf8'));
const cells = [
  { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
  { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 2, y: 4 },
];
const definition = {
  ...legacy, schemaVersion: 2, contentVersion: 'development-build-ship-v1',
  compatibleRuleset: 'development-build-ruleset-v1',
  build: {
    hull: { id: 'development-diamond-13', width: 5, height: 5, cells },
    supportedSpellings: ['SHIP', 'SHIPS', 'HIP', 'HIPS', 'SIP', 'SIPS'].map(spelling => ({ spelling, cefr: 'Unknown' })),
  },
};
const noAssets = async (): Promise<Uint8Array> => { throw new Error('Approved assets list is empty.'); };

it('compiles the approved Build hull and spelling library without modifying the legacy starter', async () => {
  const before = readFileSync('public/content/packs/development/manifest.json');
  const pack = await compileDevelopmentPack(definition, noAssets);
  expect(pack).toMatchObject({ schemaVersion: 2, contentVersion: definition.contentVersion, build: definition.build, assetManifest: [], preRun: legacy.preRun });
  expect((await validateContentPack(pack, { appVersion: '0.1.0', rulesetVersion: definition.compatibleRuleset })).issues).toEqual([]);
  expect(readFileSync('public/content/packs/development/manifest.json')).toEqual(before);
});

it('the actual authored Build source and generated artifact match the approved values and deterministic codec', async () => {
  const source = JSON.parse(readFileSync('content/authoring/development-build-ship-v1.json', 'utf8'));
  expect(source).toEqual(definition);
  const first = await compileDevelopmentPack(source, noAssets), second = await compileDevelopmentPack(source, noAssets);
  expect(second).toEqual(first);
  expect(JSON.parse(readFileSync('public/content/packs/development-build-ship-v1/manifest.json', 'utf8'))).toEqual(first);
  expect((await validateContentPack(first)).issues).toEqual([]);
});

it('rejects duplicate/out-of-range hull cells, duplicate vocabulary and Build/schema mismatches', async () => {
  const duplicate = structuredClone(definition); duplicate.build.hull.cells[1] = { ...duplicate.build.hull.cells[0]! };
  const outside = structuredClone(definition); outside.build.hull.cells[0] = { x: 5, y: 0 };
  const words = structuredClone(definition); words.build.supportedSpellings.push({ spelling: 'SHIP', cefr: 'Unknown' });
  const noStarter = structuredClone(definition); noStarter.build.supportedSpellings = [{ spelling: 'HIP', cefr: 'Unknown' }];
  for (const candidate of [duplicate, outside, words, noStarter, { ...definition, schemaVersion: 1 }, { ...legacy, schemaVersion: 2 }]) {
    await expect(compileDevelopmentPack(candidate, noAssets)).rejects.toThrow();
  }
});
