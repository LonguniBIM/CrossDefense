import { expect, it } from 'vitest';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { BuildApplication } from '../../src/application/build/BuildApplication';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';

async function setup(repository = new InMemoryRunRepository()) {
  const pack = buildPack(), run = finishedBuildRun();
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  await repository.createRun({ operationId: 'seed', run });
  const app = new BuildApplication(repository, content); await app.open(run.pilotId);
  return { app, repository, run, tileId: run.runId + ':starter:0' };
}

it('an admitted App update freezes Build commands and a refused activation releases the same saved Build', async () => {
  const { app, repository, run, tileId } = await setup();
  const before = app.snapshot();
  const release = app.holdForAppUpdate();
  await expect(app.place({ operationId: 'blocked-edit', tileId, x: 0, y: 2 })).rejects.toMatchObject({ code: 'BUILD_TRANSITION' });
  expect(() => app.holdForAttemptStart()).toThrow();
  expect(app.snapshot()).toEqual(before);
  expect(await repository.getActiveRun(run.pilotId)).toEqual(before.run);
  release();
  const saved = await app.place({ operationId: 'allowed-edit', tileId, x: 0, y: 2 });
  expect(saved.summary.equipped.map(tile => tile.id)).toEqual([tileId]);
  expect((await repository.getActiveRun(run.pilotId))?.shipBuild?.revision).toBe(1);
});

it('a layout command queued in the same turn excludes an App update until its acknowledgment', async () => {
  const { app, tileId } = await setup();
  const edit = app.place({ operationId: 'queued-edit', tileId, x: 0, y: 2 });
  expect(app.canHoldForAppUpdate()).toBe(false);
  expect(() => app.holdForAppUpdate()).toThrow(/Finish or retry/);
  const saved = await edit;
  expect(saved.summary.equipped.map(tile => tile.id)).toEqual([tileId]);
  expect(app.canHoldForAppUpdate()).toBe(true);
  app.holdForAppUpdate()();
});

import type { PlacementOperation } from '../../src/domain/build/shipBuild';
import type { BuildContent } from '../../src/domain/content/contentPack';

it('a lost Build save acknowledgment blocks updates until retry preserves the once-only durable edit', async () => {
  class LostAcknowledgment extends InMemoryRunRepository {
    lost = false;
    override async applyPlacement(operation: PlacementOperation, content: BuildContent) {
      const saved = await super.applyPlacement(operation, content);
      if (!this.lost) { this.lost = true; throw Error('Lost acknowledgment'); }
      return saved;
    }
  }
  const { app, repository, run, tileId } = await setup(new LostAcknowledgment());
  await expect(app.place({ operationId: 'uncertain-edit', tileId, x: 0, y: 2 })).rejects.toThrow('Lost acknowledgment');
  expect(app.canHoldForAppUpdate()).toBe(false);
  expect(() => app.holdForAppUpdate()).toThrow(/Finish or retry/);
  expect((await repository.getActiveRun(run.pilotId))?.shipBuild?.revision).toBe(1);
  await app.retry();
  expect(app.canHoldForAppUpdate()).toBe(true);
  const release = app.holdForAppUpdate();
  expect(app.snapshot().run.shipBuild?.revision).toBe(1);
  expect(app.snapshot().summary.equipped.map(tile => tile.id)).toEqual([tileId]);
  release();
});

it('an old release callback cannot unfreeze a later App transition', async () => {
  const { app, tileId } = await setup();
  const oldRelease = app.holdForAppUpdate(); oldRelease();
  const currentRelease = app.holdForAppUpdate(); oldRelease();
  await expect(app.place({ operationId: 'late-edit', tileId, x: 0, y: 2 })).rejects.toMatchObject({ code: 'BUILD_TRANSITION' });
  currentRelease();
  await app.place({ operationId: 'after-release', tileId, x: 0, y: 2 });
  expect(app.snapshot().summary.equipped.map(tile => tile.id)).toEqual([tileId]);
});
