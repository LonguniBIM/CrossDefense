import { expect, it } from 'vitest';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { BuildApplication } from '../../src/application/build/BuildApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';

async function setup(repository = new InMemoryRunRepository()) {
  const pack = buildPack(), run = finishedBuildRun();
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
  await content.bootstrap(); await content.activateCandidate(pack);
  await repository.createRun({ operationId: 'seed', run });
  const app = new BuildApplication(repository, content); await app.open(run.pilotId);
  const id = (index: number) => run.runId + ':starter:' + index;
  return { app, run, content, repository, id };
}

it('Return has a read-only impact preview and unplaces the exact tile without changing retention or starter progress', async () => {
  const { app, run, repository, id } = await setup();
  for (let index = 0; index < 4; index += 1) await app.place({ operationId: 'place-' + index, tileId: id(index), x: index, y: 2 });
  const before = app.snapshot();
  const preview = app.previewReturn(id(2));
  expect(preview.valid).toBe(true);
  expect(preview.before.power).toEqual({ available: 405, required: 100, surplus: 305 });
  expect(preview.after?.power).toEqual({ available: 0, required: 100, surplus: -100 });
  expect(app.snapshot()).toEqual(before);
  const returned = await app.returnToCargo({ operationId: 'return-i', tileId: id(2) });
  expect(returned.summary.unplaced.map(tile => tile.id)).toContain(id(2));
  expect(returned.summary.equipped.map(tile => tile.id)).not.toContain(id(2));
  expect(returned.summary.retainedCount).toBe(8);
  expect(returned.run.salvage).toEqual(run.salvage);
  expect(returned.run.quota).toEqual(run.quota);
  expect(returned.run.shipBuild?.revision).toBe(5);
  expect((await repository.getActiveRun(run.pilotId))?.shipBuild).toEqual(returned.run.shipBuild);
  expect(await app.returnToCargo({ operationId: 'return-i', tileId: id(2) })).toEqual(returned);
});

it('Undo and Redo are new durable layout edits; a fresh editing context keeps the layout but not history', async () => {
  const { app, run, content, repository, id } = await setup();
  for (let index = 0; index < 4; index += 1) await app.place({ operationId: 'ship-' + index, tileId: id(index), x: index, y: 2 });
  const ship = app.snapshot();
  await app.returnToCargo({ operationId: 'return-h', tileId: id(1) });
  const returned = app.snapshot();
  expect(returned.history).toEqual({ canUndo: true, canRedo: false, undoCount: 5, redoCount: 0 });
  const restored = await app.undo({ operationId: 'undo-return' });
  expect(restored.run.shipBuild?.placements).toEqual(ship.run.shipBuild?.placements);
  expect(restored.summary).toEqual(ship.summary);
  expect(restored.run.shipBuild?.revision).toBe(6);
  expect(restored.history).toEqual({ canUndo: true, canRedo: true, undoCount: 4, redoCount: 1 });
  expect(await app.undo({ operationId: 'undo-return' })).toEqual(restored);
  const redone = await app.redo({ operationId: 'redo-return' });
  expect(redone.summary).toEqual(returned.summary);
  expect(redone.run.shipBuild?.revision).toBe(7);
  expect(redone.run.salvage).toEqual(run.salvage);
  expect(redone.run.quota).toEqual(run.quota);
  const reloaded = new BuildApplication(repository, content); await reloaded.open(run.pilotId);
  expect(reloaded.snapshot().run).toEqual(redone.run);
  expect(reloaded.snapshot().summary).toEqual(redone.summary);
  expect(reloaded.snapshot().history).toEqual({ canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 });
  await expect(reloaded.undo({ operationId: 'no-history' })).rejects.toMatchObject({ code: 'NOTHING_TO_UNDO' });
});

it('rejects unavailable Return/history, preserves Redo on rejection/no-op, and clears Redo after a new committed edit', async () => {
  const { app, id } = await setup();
  await expect(app.undo({ operationId: 'empty-undo' })).rejects.toMatchObject({ code: 'NOTHING_TO_UNDO' });
  await expect(app.returnToCargo({ operationId: 'unplaced', tileId: id(0) })).rejects.toMatchObject({ code: 'TILE_NOT_PLACED' });
  await app.place({ operationId: 's', tileId: id(0), x: 0, y: 2 });
  await app.place({ operationId: 'h', tileId: id(1), x: 1, y: 2 });
  await app.undo({ operationId: 'undo-h' });
  await expect(app.place({ operationId: 'occupied', tileId: id(1), x: 0, y: 2 })).rejects.toMatchObject({ code: 'OCCUPIED' });
  await app.place({ operationId: 'same-position', tileId: id(0), x: 0, y: 2 });
  expect(app.snapshot().history.redoCount).toBe(1);
  await app.place({ operationId: 'different-h', tileId: id(1), x: 2, y: 1 });
  expect(app.snapshot().history.redoCount).toBe(0);
  await expect(app.redo({ operationId: 'expired-redo' })).rejects.toMatchObject({ code: 'NOTHING_TO_REDO' });
  expect(app.snapshot().summary.retainedCount).toBe(8);
});

import type { BuildEditOperation } from '../../src/domain/build/buildEditing';
import type { BuildContent } from '../../src/domain/content/contentPack';
import type { HistoryBoundary } from '../../src/application/build/BuildApplication';

it.each(['return', 'undo', 'redo'] as const)('%s failure preserves history cursor and replays the exact operation once', async kind => {
  class FailingRepository extends InMemoryRunRepository {
    failNext = false;
    attempts: BuildEditOperation[] = [];
    override async applyBuildEdit(operation: BuildEditOperation, definition: BuildContent) {
      this.attempts.push(structuredClone(operation));
      if (this.failNext) { this.failNext = false; throw new Error('Injected layout write failure'); }
      return super.applyBuildEdit(operation, definition);
    }
  }
  const repository = new FailingRepository();
  const { app, id } = await setup(repository);
  await app.place({ operationId: 's', tileId: id(0), x: 0, y: 2 });
  if (kind === 'redo') await app.undo({ operationId: 'prepare-redo' });
  const before = app.snapshot(); repository.failNext = true;
  const action = () => kind === 'return' ? app.returnToCargo({ operationId: 'fault', tileId: id(0) }) : app[kind]({ operationId: 'fault' });
  await expect(action()).rejects.toThrow('Injected');
  expect(app.snapshot()).toEqual(before);
  expect(app.hasPendingSave()).toBe(true);
  await expect(app.open(before.run.pilotId)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  expect(() => app.invalidateHistory('economy-change')).toThrow('Resolve pending');
  await expect(app.place({ operationId: 'other', tileId: id(1), x: 1, y: 2 })).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  const after = await app.retry();
  expect(repository.attempts.at(-1)).toEqual(repository.attempts.at(-2));
  expect(app.hasPendingSave()).toBe(false);
  expect(await action()).toEqual(after);
  expect(after.run.salvage).toEqual(before.run.salvage);
});

it('lost acknowledgment does not duplicate Undo or consume the next history entry on Retry', async () => {
  class LostAckRepository extends InMemoryRunRepository {
    lost = false;
    override async applyBuildEdit(operation: BuildEditOperation, definition: BuildContent) {
      const saved = await super.applyBuildEdit(operation, definition);
      if (!this.lost && operation.kind === 'undo') { this.lost = true; throw new Error('Injected lost acknowledgment'); }
      return saved;
    }
  }
  const { app, id } = await setup(new LostAckRepository());
  await app.place({ operationId: 's', tileId: id(0), x: 0, y: 2 });
  await app.place({ operationId: 'h', tileId: id(1), x: 1, y: 2 });
  const before = app.snapshot();
  await expect(app.undo({ operationId: 'lost-undo' })).rejects.toThrow('lost acknowledgment');
  expect(app.snapshot()).toEqual(before);
  const recovered = await app.retry();
  expect(recovered.run.shipBuild?.revision).toBe(3);
  expect(recovered.history).toEqual({ canUndo: true, canRedo: true, undoCount: 1, redoCount: 1 });
  expect(recovered.summary.equipped.map(tile => tile.id)).toEqual([id(0)]);
});

it.each<HistoryBoundary>(['attempt-start', 'hull-change', 'retained-tiles-change', 'economy-change', 'leave-build'])('%s invalidates history without writing or reversing any current Run data', async reason => {
  const { app, repository, run, id } = await setup();
  await app.place({ operationId: 's', tileId: id(0), x: 0, y: 2 });
  await app.undo({ operationId: 'undo-s' });
  const before = await repository.getActiveRun(run.pilotId);
  app.invalidateHistory(reason);
  expect(app.snapshot().history).toEqual({ canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 });
  await expect(app.redo({ operationId: 'invalidated' })).rejects.toMatchObject({ code: 'NOTHING_TO_REDO' });
  expect(await repository.getActiveRun(run.pilotId)).toEqual(before);
});

it('another editing context cannot use stale Undo to erase a newer layout', async () => {
  const { app, repository, content, run, id } = await setup();
  await app.place({ operationId: 's', tileId: id(0), x: 0, y: 2 });
  const other = new BuildApplication(repository, content); await other.open(run.pilotId);
  const latest = await other.place({ operationId: 'h', tileId: id(1), x: 1, y: 2 });
  await expect(app.undo({ operationId: 'stale-undo' })).rejects.toMatchObject({ code: 'STALE_REVISION' });
  expect((await repository.getActiveRun(run.pilotId))?.shipBuild).toEqual(latest.run.shipBuild);
  expect(app.snapshot().history.canUndo).toBe(false);
});
