import { expect, it } from 'vitest';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { LocalStorageContentPackRepository, CONTENT_PACK_STORAGE_KEYS } from '../../src/infrastructure/content/LocalStorageContentPackRepository';
import { syntheticPack, sealFixture, MemoryStorage } from '../developmentPackFixture';

const compatibility = { appVersion: '0.1.0', rulesetVersion: 'development-ruleset-2026-09-30' };

it('does not trust a cached manifest whose positive quota cannot satisfy its starter', async () => {
  const repository = new InMemoryContentPackRepository();
  const valid = syntheticPack();
  const invalid = sealFixture({ ...valid, preRun: { ...valid.preRun, collectionQuota: 1 } });
  // Simulate a corrupt replaceable cache below the Application boundary.
  await repository.activate(invalid);
  const app = new ContentPackApplication(repository, compatibility);
  await app.bootstrap();
  expect(await app.getActivePack()).toBeNull();
});

it('admits at most one concurrent different candidate per version across Application instances', async () => {
  const repository = new InMemoryContentPackRepository();
  const a = new ContentPackApplication(repository, compatibility);
  const b = new ContentPackApplication(repository, compatibility);
  await a.bootstrap();
  const pack = syntheticPack();
  const different = sealFixture({ ...pack, preRun: { ...pack.preRun, collectionQuota: 5 } });
  const results = await Promise.all([a.activateCandidate(pack), b.activateCandidate(different)]);
  expect(results.filter(result => result.activated)).toHaveLength(1);
  expect(results.flatMap(result => result.issues).map(issue => issue.code)).toContain('VERSION_CONTENT_CONFLICT');
});

it('does not treat malformed cached JSON as a storage exception', async () => {
  const storage = new MemoryStorage();
  const repository = new LocalStorageContentPackRepository(storage);
  const app = new ContentPackApplication(repository, compatibility);
  await app.bootstrap();
  expect((await app.activateCandidate(syntheticPack())).activated).toBe(true);
  storage.setItem(CONTENT_PACK_STORAGE_KEYS.packPrefix + 'test-content-v1', '{broken');
  expect(await app.getPack('test-content-v1')).toBeNull();
});

it('rejects wrong cache identity, incompatible versions and resealed changes under an admitted version', async () => {
  const storage = new MemoryStorage();
  const app = new ContentPackApplication(new LocalStorageContentPackRepository(storage), compatibility);
  await app.bootstrap();
  const pack = syntheticPack();
  await app.activateCandidate(pack);
  const key = CONTENT_PACK_STORAGE_KEYS.packPrefix + pack.contentVersion;
  for (const changed of [
    sealFixture({ ...pack, contentVersion: 'other-content' }),
    sealFixture({ ...pack, compatibleRuleset: 'other-rules' }),
    sealFixture({ ...pack, minimumAppVersion: '99.0.0' }),
    sealFixture({ ...pack, preRun: { ...pack.preRun, collectionQuota: 5 } }),
  ]) {
    storage.setItem(key, JSON.stringify(changed));
    expect(await app.getPack(pack.contentVersion)).toBeNull();
  }
  expect((await app.activateCandidate(pack)).activated).toBe(true);
  expect(await app.getPack(pack.contentVersion)).toEqual(pack);
});

it('retains an older supported Ruleset for a pinned Run instead of substituting the current default', async () => {
  const repository = new InMemoryContentPackRepository();
  const original = new ContentPackApplication(repository, compatibility);
  await original.bootstrap();
  const pack = syntheticPack();
  await original.activateCandidate(pack);
  const upgraded = new ContentPackApplication(repository, { appVersion: '0.2.0', rulesetVersion: 'new-rules', supportedRulesetVersions: [compatibility.rulesetVersion, 'new-rules'] });
  expect(await upgraded.getPack(pack.contentVersion, compatibility.rulesetVersion)).toEqual(pack);
  expect(await upgraded.getPack(pack.contentVersion, 'new-rules')).toBeNull();
  const unsupported = new ContentPackApplication(repository, { appVersion: '0.2.0', rulesetVersion: 'new-rules' });
  expect(await unsupported.getPack(pack.contentVersion, compatibility.rulesetVersion)).toBeNull();
});

it('preserves Last Known Good on failed publication and admits an identical retry', async () => {
  class FaultStorage extends MemoryStorage {
    fail = false;
    override setItem(key: string, value: string): void {
      if (this.fail && key === CONTENT_PACK_STORAGE_KEYS.state) throw new Error('Injected publication failure');
      super.setItem(key, value);
    }
  }
  const storage = new FaultStorage();
  const repository = new LocalStorageContentPackRepository(storage);
  const app = new ContentPackApplication(repository, compatibility);
  await app.bootstrap();
  const first = syntheticPack();
  await app.activateCandidate(first);
  storage.fail = true;
  const next = syntheticPack({ contentVersion: 'test-content-v2' });
  await expect(app.activateCandidate(next)).rejects.toThrow(/storage/i);
  expect(await app.getActivePack()).toEqual(first);
  expect(await repository.getState()).toEqual({ activeVersion: first.contentVersion, lastKnownGoodVersion: first.contentVersion });
  storage.fail = false;
  expect((await app.activateCandidate(next)).activated).toBe(true);
});

it('keeps admitted version identity after cache eviction and synchronizes separate local-storage adapters', async () => {
  const storage = new MemoryStorage();
  const a = new ContentPackApplication(new LocalStorageContentPackRepository(storage), compatibility);
  const b = new ContentPackApplication(new LocalStorageContentPackRepository(storage), compatibility);
  await a.bootstrap();
  const pack = syntheticPack();
  const changed = sealFixture({ ...pack, preRun: { ...pack.preRun, collectionQuota: 5 } });
  const results = await Promise.all([a.activateCandidate(pack), b.activateCandidate(changed)]);
  expect(results.filter(result => result.activated)).toHaveLength(1);
  const admitted = await a.getActivePack();
  expect(admitted).not.toBeNull();
  storage.removeItem(CONTENT_PACK_STORAGE_KEYS.packPrefix + pack.contentVersion);
  expect(await a.getPack(pack.contentVersion)).toBeNull();
  const conflicting = admitted!.integrity.manifestSha256 === pack.integrity.manifestSha256 ? changed : pack;
  expect((await b.activateCandidate(conflicting)).activated).toBe(false);
  expect((await b.activateCandidate(admitted)).activated).toBe(true);
});
