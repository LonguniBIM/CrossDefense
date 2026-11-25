import { syntheticPack } from '../developmentPackFixture';
import { describe, expect, it } from 'vitest';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';

const compatibility = {
  appVersion: '0.1.0',
  rulesetVersion: 'development-ruleset-2026-09-30',
};

describe('Ticket 02 development Content Pack validation', () => {
  it('activates a compatible viable candidate and rejects a later invalid candidate without replacing Last Known Good', async () => {
    const repository = new InMemoryContentPackRepository();
    const app = new ContentPackApplication(repository, compatibility);
    await app.bootstrap();

    const activated = await app.activateCandidate(syntheticPack());
    expect(activated.activated).toBe(true);
    expect(activated.state).toEqual({
      activeVersion: 'test-content-v1',
      lastKnownGoodVersion: 'test-content-v1',
    });

    const rejected = await app.activateCandidate(
      syntheticPack({
        contentVersion: 'test-content-v2',
        compatibleRuleset: 'other-ruleset',
      }),
    );

    expect(rejected.activated).toBe(false);
    expect(rejected.issues).toContainEqual(
      expect.objectContaining({ code: 'INCOMPATIBLE_RULESET' }),
    );
    expect(rejected.state).toEqual(activated.state);
    expect((await app.getActivePack())?.contentVersion).toBe('test-content-v1');
  });

  it('treats a Content version as immutable once the validated version is stored', async () => {
    const repository = new InMemoryContentPackRepository();
    const app = new ContentPackApplication(repository, compatibility);
    await app.bootstrap();

    expect((await app.activateCandidate(syntheticPack())).activated).toBe(true);

    const conflict = await app.activateCandidate(
      syntheticPack({
        preRun: {
          collectionQuota: 5,
          starterObjective: {
            targetWord: 'TEST',
            requiresWeaponTile: true,
          },
          viabilityTiles: [
            { letter: 'T', subtype: 'Ballistic' },
            { letter: 'E', subtype: 'Armor' },
            { letter: 'S', subtype: 'Power' },
            { letter: 'T', subtype: 'Shield' },
          ],
        },
      }),
    );

    expect(conflict.activated).toBe(false);
    expect(conflict.issues).toContainEqual(
      expect.objectContaining({ code: 'VERSION_CONTENT_CONFLICT' }),
    );
    expect((await app.getActivePack())?.preRun.collectionQuota).toBe(4);
  });

  it('rejects authored starter content when the quota and tiles cannot satisfy the required target-word Weapon starter', async () => {
    const repository = new InMemoryContentPackRepository();
    const app = new ContentPackApplication(repository, compatibility);
    await app.bootstrap();

    const result = await app.activateCandidate(
      syntheticPack({
        preRun: {
          collectionQuota: 3,
          starterObjective: {
            targetWord: 'TEST',
            requiresWeaponTile: true,
          },
          viabilityTiles: [
            { letter: 'T', subtype: 'Armor' },
            { letter: 'E', subtype: 'Shield' },
            { letter: 'S', subtype: 'Power' },
          ],
        },
      }),
    );

    expect(result.activated).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['STARTER_QUOTA_TOO_SMALL', 'STARTER_WORD_UNAVAILABLE', 'STARTER_WEAPON_MISSING']),
    );
    expect(await app.getActivePack()).toBeNull();
  });
});
