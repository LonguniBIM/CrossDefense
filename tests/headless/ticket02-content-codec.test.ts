import { expect, it } from 'vitest';
import { compileDevelopmentPack } from '../../src/application/content/ContentPackCodec';

const source = {
  contentVersion: 'test-codec-v1', schemaVersion: 1, compatibleRuleset: 'test-rules', minimumAppVersion: '0.1.0',
  preRun: { collectionQuota: 4, starterObjective: { targetWord: 'TEST', requiresWeaponTile: true },
    viabilityTiles: [{ letter: 'T', subtype: 'Ballistic' }, { letter: 'E', subtype: 'Armor' }, { letter: 'S', subtype: 'Power' }, { letter: 'T', subtype: 'Shield' }] },
  assets: [{ path: 'fixture.txt', provenance: 'Synthetic test bytes, not production art.' }],
};

it('deterministically compiles the actual selected asset bytes with the known SHA-256 digest of abc', async () => {
  const read = async () => new TextEncoder().encode('abc');
  const compiled = await compileDevelopmentPack(source, read);
  expect(compiled).toMatchObject({
    contentVersion: 'test-codec-v1',
    assetManifest: [{ path: 'fixture.txt', bytes: 3, sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', dataBase64: 'YWJj', provenance: 'Synthetic test bytes, not production art.' }],
    integrity: { algorithm: 'SHA-256', manifestSha256: expect.stringMatching(/^[a-f0-9]{64}$/) },
  });
  expect(await compileDevelopmentPack(source, read)).toEqual(compiled);
});

it('rejects missing integrity, tampered manifest values and invalid embedded asset bytes', async () => {
  const { validateContentPack } = await import('../../src/application/content/ContentPackCodec');
  const { sealFixture } = await import('../developmentPackFixture');
  const pack = await compileDevelopmentPack(source, async () => new TextEncoder().encode('abc'));
  const { integrity: _ignored, ...missing } = pack;
  expect((await validateContentPack(missing)).issues.map(issue => issue.code)).toContain('INVALID_MANIFEST');
  expect((await validateContentPack({ ...pack, preRun: { ...pack.preRun, collectionQuota: 5 } })).issues.map(issue => issue.code)).toContain('INTEGRITY_MISMATCH');
  // Reseal the outer manifest independently: the asset's own checksum must still fail.
  const altered = sealFixture({ ...pack, assetManifest: pack.assetManifest.map(asset => ({ ...asset, dataBase64: 'YWJk' })) });
  expect((await validateContentPack(altered)).issues.map(issue => issue.code)).toContain('INVALID_ASSET');
});

it('rejects unsafe and duplicate asset paths before requesting asset bytes', async () => {
  for (const path of ['../secret.txt', '/absolute.txt', 'C:/secret.txt', 'a\\secret.txt', 'https://example.test/file', 'a//b']) {
    await expect(compileDevelopmentPack({ ...source, assets: [{ path, provenance: 'Synthetic test' }] }, async () => { throw new Error('Reader must not be called'); })).rejects.not.toThrow('Reader must not be called');
  }
  await expect(compileDevelopmentPack({ ...source, assets: [{ path: 'a.txt', provenance: 'Test' }, { path: 'A.txt', provenance: 'Test' }] }, async () => new Uint8Array())).rejects.toThrow('Duplicate');
});
