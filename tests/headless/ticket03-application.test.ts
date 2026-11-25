import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { RunApplication } from '../../src/application/run/RunApplication';
import { PreRunApplication } from '../../src/application/preRun/PreRunApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import { InMemoryRunRepository } from '../../src/infrastructure/persistence/InMemoryRunRepository';

const pack: unknown = JSON.parse(readFileSync('public/content/packs/development/manifest.json', 'utf8'));

it('opens the real SHIP Run with a saved pool but no starter grants and reloads the identical payload order', async () => {
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), {
    appVersion: '0.1.0', rulesetVersion: 'development-ruleset-2026-09-30',
  });
  await content.bootstrap();
  expect((await content.activateCandidate(pack)).activated).toBe(true);
  const repository = new InMemoryRunRepository();
  await new RunApplication(repository, content, () => 'run-03').startRun({ operationId: 'start-03', pilotId: 'pilot-03' });
  const first = await new PreRunApplication(repository, content, () => 'operation-03').open('pilot-03');
  const second = await new PreRunApplication(repository, content, () => 'operation-04').open('pilot-03');
  expect(first.run.quota).toEqual({ total: 8, remaining: 8 });
  expect(first.run.salvage?.collectedIds).toEqual([]);
  expect(first.canFinish).toBe(false);
  expect(first.board?.next).toHaveLength(3);
  expect(second).toEqual(first);
  expect(await repository.countRuns()).toBe(1);
});

import { choosePlacement } from '../preRunPlayer';
import type { SalvageOperation } from '../../src/domain/preRun/salvage';

class FailingCollectionRepository extends InMemoryRunRepository {
  failNextCollection = true;
  attempts: SalvageOperation[] = [];
  override async applySalvage(request: SalvageOperation) {
    if (request.kind === 'collect') {
      this.attempts.push(structuredClone(request));
      if (this.failNextCollection) { this.failNextCollection = false; throw new Error('Injected collection write failure'); }
    }
    return super.applySalvage(request);
  }
}

it('real board clears freeze at a failed commit, Retry grants once, and reload/top-out never reroll the pool', async () => {
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), {
    appVersion: '0.1.0', rulesetVersion: 'development-ruleset-2026-09-30',
  });
  await content.bootstrap();
  await content.activateCandidate(pack);
  const repository = new FailingCollectionRepository();
  await new RunApplication(repository, content, () => 'run-03-simulation').startRun({ operationId: 'start', pilotId: 'pilot' });
  let serial = 0;
  let app = new PreRunApplication(repository, content, () => `clear-${serial++}`);
  let view = await app.open('pilot');
  const order = structuredClone(view.run.salvage!.order);
  let observedFailure = false;
  for (let piece = 0; piece < 180 && view.run.quota.remaining > 0; piece += 1) {
    if (view.status === 'top-out') {
      view = app.resetAfterTopOut();
      expect(view.run.salvage!.order).toEqual(order);
    }
    for (const action of choosePlacement(view.board!)) {
      const command = { action, down: true, code: action, pieceId: app.projection().board!.active.id };
      const before = app.projection();
      view = await app.advance([command]);
      if (view.status === 'save-failed') {
        observedFailure = true;
        expect(view.run.quota).toEqual(before.run.quota);
        const frozen = view.board!.tick;
        expect((await app.advance()).board!.tick).toBe(frozen);
        view = await app.retry();
        expect(repository.attempts[1]).toEqual(repository.attempts[0]);
        const acknowledged = view.run;
        expect((await app.retry()).run).toEqual(acknowledged);
        app.clearInput();
        app = new PreRunApplication(repository, content, () => `clear-${serial++}`);
        view = await app.open('pilot');
        expect(view.run).toEqual(acknowledged);
        expect(view.run.salvage!.order).toEqual(order);
        expect(view.board!.pool.map(tile => tile.id)).toEqual(order.filter(tile => !view.run.salvage!.collectedIds.includes(tile.id)).map(tile => tile.id));
        break;
      }
      view = await app.advance([{ ...command, down: false }]);
      if (view.status !== 'playing') break;
    }
    app.clearInput();
  }
  expect(observedFailure).toBe(true);
  expect(view.run.quota.remaining).toBe(0);
  expect(view.collected).toHaveLength(8);
  expect(new Set(view.collected.map(tile => tile.id)).size).toBe(8);
  expect(view.status).toBe('exhausted');
  const frozen = view.board!.tick;
  expect((await app.advance()).board!.tick).toBe(frozen);
  expect(view.canFinish).toBe(true);
  const finished = await app.finish();
  expect(finished.run.phase).toBe('build');
  const restored = await new PreRunApplication(repository, content, () => 'unused').open('pilot');
  expect(restored.status).toBe('complete');
  expect(restored.board).toBeNull();
  expect(restored.collected).toHaveLength(8);
}, 30000);

it('rejects a mismatched pinned objective at the public Pre-Run entry without initializing progress', async () => {
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), {
    appVersion: '0.1.0', rulesetVersion: 'development-ruleset-2026-09-30',
  });
  await content.bootstrap();
  await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository();
  await repository.createRun({ operationId: 'legacy-start', run: {
    runId: 'mismatched-run', pilotId: 'pilot', phase: 'pre-run-salvage',
    contentVersion: 'development-starter-ship-v1', rulesetVersion: 'development-ruleset-2026-09-30',
    quota: { total: 8, remaining: 8 }, starterObjective: { targetWord: 'BOAT', requiresWeaponTile: true }, startedAt: '2026-10-06',
  } });
  const before = await repository.getActiveRun('pilot');
  const app = new PreRunApplication(repository, content, () => 'unused');
  await expect(app.open('pilot')).rejects.toMatchObject({ code: 'CONTENT_UNAVAILABLE' });
  expect(await repository.getActiveRun('pilot')).toEqual(before);
});

it('an actual top-out resets only the board and restores the original uncollected identities and order', async () => {
  const content = new ContentPackApplication(new InMemoryContentPackRepository(), {
    appVersion: '0.1.0', rulesetVersion: 'development-ruleset-2026-09-30',
  });
  await content.bootstrap(); await content.activateCandidate(pack);
  const repository = new InMemoryRunRepository();
  await new RunApplication(repository, content, () => 'topout-run').startRun({ operationId: 'start-topout', pilotId: 'pilot' });
  const app = new PreRunApplication(repository, content, () => 'not-a-collection');
  const original = await app.open('pilot');
  let view = original;
  for (let piece = 0; piece < 50 && view.status !== 'top-out'; piece += 1) {
    const input = { action: 'drop' as const, down: true, code: 'Space', pieceId: view.board!.active.id };
    await app.advance([input]);
    view = await app.advance([{ ...input, down: false }]);
  }
  expect(view.status).toBe('top-out');
  expect(view.run).toEqual(original.run);
  expect(view.collected).toEqual([]);
  const restored = app.resetAfterTopOut();
  expect(restored.board).toEqual(original.board);
  expect(restored.run).toEqual(original.run);
  expect(await repository.getActiveRun('pilot')).toEqual(original.run);
});
