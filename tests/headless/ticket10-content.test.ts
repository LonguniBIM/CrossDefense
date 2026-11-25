import { expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { compileDevelopmentPack, validateContentPack } from '../../src/application/content/ContentPackCodec';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { LocalStorageContentPackRepository, CONTENT_PACK_STORAGE_KEYS } from '../../src/infrastructure/content/LocalStorageContentPackRepository';
import { RenderPackBodyStore } from '../../src/infrastructure/content/RenderPackBodyStore';
import { loadRenderAssets } from '../../src/presentation/renderer/RenderAssetLoader';
import { RenderResources } from '../../src/presentation/renderer/RenderResources';
import { MemoryStorage, sealFixture } from '../developmentPackFixture';

const approvedReview = {
  version: 'development-review-rules-v1',
  occurrencePolicy: 'settled-outcome-immediate-due',
  rewards: { completionCredits: 1, independentFirstResponseCredits: 1 },
  entries: [{
    id: 'ship-noun-water-vessel-v1', spelling: 'SHIP', partOfSpeech: 'noun', targetSense: 'water-vessel',
    prompt: 'A large boat that carries people or goods across water. Type the English word.',
    acceptedAnswers: ['SHIP'],
    hints: { context: 'The ___ carries goods across the sea.', letter: 'It starts with S and has four letters.', reveal: 'SHIP' },
  }],
};
const source = () => JSON.parse(readFileSync('content/authoring/development-review-ship-v1.json', 'utf8'));
const asset = async (path: string) => new Uint8Array(readFileSync('content/authoring/rendered-assets-v1/' + path));

it('Q15 compiles and validates the approved schema 5 Review capability with unchanged combat and assets', async () => {
  const input = source();
  const previous = JSON.parse(readFileSync('content/authoring/development-rendered-combat-ship-v1.json', 'utf8'));
  const inherited = structuredClone(input); delete inherited.review;
  inherited.contentVersion = previous.contentVersion; inherited.schemaVersion = previous.schemaVersion;
  expect(inherited).toEqual(previous);
  const pack = await compileDevelopmentPack(input, asset);
  expect(pack).toMatchObject({
    contentVersion: 'development-review-ship-v1', schemaVersion: 5,
    compatibleRuleset: 'development-combat-ruleset-v1', review: approvedReview,
    combat: previous.combat, build: previous.build, launch: previous.launch, preRun: previous.preRun,
  });
  const oldBytes = readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json');
  expect(createHash('sha256').update(oldBytes).digest('hex')).toBe('37eca6c6af3ce199d28723b2ebde9e82c4524f08ce29e99778f4cd9b4f2e31ca');
  const oldPack = JSON.parse(oldBytes.toString('utf8'));
  expect(pack.assetManifest).toHaveLength(14);
  for (const entry of pack.assetManifest) {
    const original = oldPack.assetManifest.find((item: { path: string }) => item.path === entry.path);
    expect(entry.sha256, entry.path).toBe(original.sha256);
    expect(entry.bytes, entry.path).toBe(original.bytes);
    expect(entry.dataBase64 === original.dataBase64, entry.path).toBe(true);
  }
  expect(pack.integrity.manifestSha256).toBe('1b496a087a3c9f576164c83653736dbd40f6d749eeea9adffa5cda3fc127b9b6');
  const validated = await validateContentPack(pack, { appVersion: '0.1.0', rulesetVersion: 'development-combat-ruleset-v1' });
  expect(validated.issues).toEqual([]);
  expect(validated.pack?.review).toEqual(approvedReview);
}, 20000);

it('Q15 rejects duplicate Learning Entry identities before a Review occurrence can freeze ambiguous content', async () => {
  const input = source();
  input.review.entries.push({ ...input.review.entries[0]!, targetSense: 'another-sense' });
  const result = await compileDevelopmentPack(input, asset).then(() => 'accepted', error => String(error));
  expect(result).toMatch(/Review content violates/);
}, 20000);

it('Q15 rejects a Review pack that omits the inherited fourteen Q14 assets', async () => {
  const input = source();
  input.assets = [];
  const result = await compileDevelopmentPack(input, asset).then(() => 'accepted', error => String(error));
  expect(result).toMatch(/Q14 render assets/);
});

it('Q15 publishes and reloads its large cache body without exhausting localStorage metadata capacity', async () => {
  class MetadataOnlyStorage extends MemoryStorage {
    override setItem(key: string, value: string): void {
      if (key.startsWith(CONTENT_PACK_STORAGE_KEYS.packPrefix)) throw new Error('Large body exceeds localStorage capacity.');
      super.setItem(key, value);
    }
  }
  // Replace only the external IndexedDB boundary; native transaction proof is a separate integration gate.
  const bodies = new Map<string, string>();
  const stage = vi.spyOn(RenderPackBodyStore.prototype, 'stage').mockImplementation(async (pack, encoded) => { bodies.set(pack.contentVersion, encoded); });
  const get = vi.spyOn(RenderPackBodyStore.prototype, 'get').mockImplementation(async version => {
    const body = bodies.get(version); return body === undefined ? undefined : JSON.parse(body);
  });
  try {
    const storage = new MetadataOnlyStorage();
    const pack = JSON.parse(readFileSync('public/content/packs/development-review-ship-v1/manifest.json', 'utf8'));
    const app = new ContentPackApplication(new LocalStorageContentPackRepository(storage), { appVersion: '0.1.0', rulesetVersion: 'development-combat-ruleset-v1' });
    await app.bootstrap();
    expect((await app.activateCandidate(pack)).activated).toBe(true);
    const reloaded = new ContentPackApplication(new LocalStorageContentPackRepository(storage), { appVersion: '0.1.0', rulesetVersion: 'development-combat-ruleset-v1' });
    await reloaded.bootstrap();
    expect((await reloaded.getActivePack())?.integrity.manifestSha256).toBe(pack.integrity.manifestSha256);
    expect((await reloaded.getPack(pack.contentVersion))?.review).toEqual(approvedReview);
  } finally { stage.mockRestore(); get.mockRestore(); }
}, 20000);

it('Q15 renderer admits both approved pack identities and rejects an altered digest before graphics decode', async () => {
  for (const version of ['development-rendered-combat-ship-v1', 'development-review-ship-v1']) {
    const pack = JSON.parse(readFileSync('public/content/packs/' + version + '/manifest.json', 'utf8'));
    const cancelled = new AbortController(); cancelled.abort();
    await expect(loadRenderAssets(pack, new RenderResources(), cancelled.signal)).rejects.toHaveProperty('name', 'AbortError');
    pack.integrity.manifestSha256 = '0'.repeat(64);
    await expect(loadRenderAssets(pack, new RenderResources(), cancelled.signal)).rejects.toThrow(/approved content identity/);
  }
});

it('Q15 rejects altered rewards and learning prompts under the same immutable Review rules version', async () => {
  for (const changedField of ['reward', 'prompt']) {
    const input = source();
    if (changedField === 'reward') input.review.rewards.completionCredits = 2;
    else input.review.entries[0].prompt = 'A different meaning prompt.';
    const result = await compileDevelopmentPack(input, asset).then(() => 'accepted', error => String(error));
    expect(result).toMatch(/Review content violates/);
  }
}, 20000);

// Preservation proof: strict authoring admission must not add unsupported Review capabilities.
it.each(['missing-review', 'legacy-schema', 'unknown-version', 'scheduled-recurrence', 'celestium', 'blueprint', 'audio', 'cefr', 'extra-answer', 'different-reveal'])(
  'Q15 rejects unsupported authoring %s before assets are read', async mutation => {
    const input = source();
    if (mutation === 'missing-review') delete input.review;
    if (mutation === 'legacy-schema') input.schemaVersion = 4;
    if (mutation === 'unknown-version') input.review.version = 'unreviewed-v1';
    if (mutation === 'scheduled-recurrence') input.review.occurrencePolicy = 'daily';
    if (mutation === 'celestium') input.review.rewards.celestium = 1;
    if (mutation === 'blueprint') input.review.rewards.blueprint = 'extra-item';
    if (mutation === 'audio') input.review.entries[0].audio = 'audio/ship.mp3';
    if (mutation === 'cefr') input.review.entries[0].cefr = 'A1';
    if (mutation === 'extra-answer') input.review.entries[0].acceptedAnswers.push('BOAT');
    if (mutation === 'different-reveal') input.review.entries[0].hints.reveal = 'BOAT';
    const result = await compileDevelopmentPack(input, async () => { throw Error('Unexpected asset read.'); }).then(() => 'accepted', error => String(error));
    expect(result).toMatch(/Review|content schema/i);
    expect(result).not.toContain('Unexpected asset read.');
  },
);

it('Q15 runtime rejects resealed Review changes and repacked assets independently of the manifest checksum', async () => {
  const original = JSON.parse(readFileSync('public/content/packs/development-review-ship-v1/manifest.json', 'utf8'));
  const changedReview = structuredClone(original); changedReview.review.rewards.independentFirstResponseCredits = 9;
  const reviewResult = await validateContentPack(sealFixture(changedReview));
  expect(reviewResult.issues.map(issue => issue.code)).toEqual(['INVALID_MANIFEST']);
  const changedAsset = structuredClone(original);
  const license = changedAsset.assetManifest.find((entry: { path: string }) => entry.path === 'licenses/Quaternius.txt');
  const bytes = Buffer.from('A different asset with internally consistent metadata.');
  license.bytes = bytes.length; license.sha256 = createHash('sha256').update(bytes).digest('hex'); license.dataBase64 = bytes.toString('base64');
  const assetResult = await validateContentPack(sealFixture(changedAsset));
  expect(assetResult.issues.map(issue => issue.code)).toEqual(['INVALID_ASSET']);
  expect(assetResult.issues[0]?.message).toMatch(/Q14 render assets/);
});

it.each([
  ['development', 1], ['development-build-ship-v1', 2], ['development-attempt-ship-v1', 3],
  ['development-combat-ship-v1', 4], ['development-rendered-combat-ship-v1', 4],
] as const)('legacy pack %s retains schema %i without acquiring Review', async (version, schemaVersion) => {
  const pack = JSON.parse(readFileSync('public/content/packs/' + version + '/manifest.json', 'utf8'));
  const result = await validateContentPack(pack);
  expect(result.issues).toEqual([]);
  expect(result.pack?.schemaVersion).toBe(schemaVersion);
  expect(result.pack?.review).toBeUndefined();
  pack.review = structuredClone(approvedReview);
  expect((await validateContentPack(sealFixture(pack))).issues.map(issue => issue.code)).toEqual(['INVALID_MANIFEST']);
});

it('the actual CLI reproduces Q15 bytes while preserving every older authored and compiled pack', () => {
  const versions = ['development-starter-ship-v1', 'development-build-ship-v1', 'development-attempt-ship-v1', 'development-combat-ship-v1', 'development-rendered-combat-ship-v1'];
  const oldPaths = versions.flatMap(version => [
    'content/authoring/' + version + '.json',
    'public/content/packs/' + (version === 'development-starter-ship-v1' ? 'development' : version) + '/manifest.json',
  ]);
  const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const before = oldPaths.map(digest);
  const directory = mkdtempSync(path.join(tmpdir(), 'crossdefense-q15-cli-'));
  try {
    const output = path.join(directory, 'manifest.json');
    execFileSync(process.execPath, [
      'scripts/content/compile-development-pack.mjs', '--source', 'content/authoring/development-review-ship-v1.json',
      '--assets-root', 'content/authoring/rendered-assets-v1', '--out', output,
    ], { stdio: 'pipe', timeout: 20000 });
    expect(readFileSync(output).equals(readFileSync('public/content/packs/development-review-ship-v1/manifest.json'))).toBe(true);
    expect(digest(output)).toBe('d6904be23e0421b13a5276c473cdbb20124653f56f79cc42430273c13d9649cc');
    expect(oldPaths.map(digest)).toEqual(before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}, 25000);
