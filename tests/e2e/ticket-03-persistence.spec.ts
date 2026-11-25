import { expect, test } from '@playwright/test';

test('Pre-Run collection and quota roll back together, retry once, bind exact commands and survive Finish/reload', async ({ page }) => {
  await page.route('**/pre-run-persistence-scenario', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Persistence scenario</body></html>' }));
  await page.goto('/pre-run-persistence-scenario');
  const result = await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const { ContentPackApplication } = await load('/src/application/content/ContentPackApplication.ts');
    const { LocalStorageContentPackRepository } = await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const { RunApplication } = await load('/src/application/run/RunApplication.ts');
    const { PreRunApplication } = await load('/src/application/preRun/PreRunApplication.ts');
    const repository = new DexieWorkspaceRepository();
    await repository.initialize();
    await repository.createPilot({ operationId: 'pilot-03', pilot: { pilotId: 'pilot-03', nickname: 'Persistence', avatarId: 'pilot-blue', createdAt: '2026-10-06', lastUsedAt: '2026-10-06' } });
    const pack = await (await fetch('/content/packs/development/manifest.json')).json();
    const content = new ContentPackApplication(new LocalStorageContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
    await content.bootstrap();
    await content.activateCandidate(pack);
    const runApp = new RunApplication(repository, content, () => 'run-03');
    await runApp.startRun({ operationId: 'start-03', pilotId: 'pilot-03' });
    const initial = await new PreRunApplication(repository, content, () => 'unused').open('pilot-03');
    const ids = ['S', 'H', 'I', 'P'].map(letter => initial.run.salvage.order.find((tile: { letter: string }) => tile.letter === letter).id);
    const command = { kind: 'collect', operationId: 'clear-03', pilotId: 'pilot-03', runId: 'run-03', expectedRevision: 0, tileIds: ids };
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'salvageOperations') throw new DOMException('Injected receipt failure', 'UnknownError');
      return add.apply(this, args);
    };
    let failed = false;
    try { await repository.applySalvage(command); } catch { failed = true; }
    IDBObjectStore.prototype.add = add;
    const afterFailure = await repository.getActiveRun('pilot-03');
    const committed = await repository.applySalvage(command);
    const retry = await repository.applySalvage(command);
    let mismatch = false;
    try { await repository.applySalvage({ ...command, tileIds: [...ids].reverse().slice(1) }); }
    catch { mismatch = true; }
    const finished = await repository.applySalvage({ kind: 'finish', operationId: 'finish-03', pilotId: 'pilot-03', runId: 'run-03', expectedRevision: 1 });
    const reloaded = new DexieWorkspaceRepository();
    await reloaded.initialize();
    return { failed, initial: initial.run, afterFailure, committed, retry, mismatch, finished, reloaded: await reloaded.getActiveRun('pilot-03') };
  });
  expect(result.failed).toBe(true);
  expect(result.afterFailure).toEqual(result.initial);
  expect(result.committed.quota.remaining).toBe(4);
  expect(result.committed.salvage.collectedIds).toHaveLength(4);
  expect(result.retry).toEqual(result.committed);
  expect(result.mismatch).toBe(true);
  expect(result.finished.phase).toBe('build');
  expect(result.finished.salvage.completed).toBe(true);
  expect(result.reloaded).toEqual(result.finished);
});
