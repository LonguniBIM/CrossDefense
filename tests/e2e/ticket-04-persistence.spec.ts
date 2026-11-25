import { expect, test } from '@playwright/test';
import { buildPack, finishedBuildRun } from '../buildFixture';

test('real IndexedDB commits positions and receipt atomically; failed placement retries once and survives reload', async ({ page }) => {
  await page.route('**/build-persistence-test', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated Build scenario</body></html>' }));
  await page.goto('/build-persistence-test');
  const result = await page.evaluate(async ({ pack, run }) => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const { ContentPackApplication } = await load('/src/application/content/ContentPackApplication.ts');
    const { LocalStorageContentPackRepository } = await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const { BuildApplication } = await load('/src/application/build/BuildApplication.ts');
    const repository = new DexieWorkspaceRepository();
    await repository.initialize();
    await repository.createPilot({ operationId: 'pilot-fixture', pilot: { pilotId: run.pilotId, nickname: 'Build persistence', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt } });
    await repository.createRun({ operationId: 'run-fixture', run });
    const content = new ContentPackApplication(new LocalStorageContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
    await content.bootstrap(); await content.activateCandidate(pack);
    const app = new BuildApplication(repository, content);
    await app.open(run.pilotId);
    const before = app.snapshot();
    const request = { operationId: 'place-s', tileId: run.runId + ':starter:0', x: 0, y: 2 };
    const add = IDBObjectStore.prototype.add, attempts: unknown[] = [];
    let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'buildOperations') {
        attempts.push(structuredClone(args[0]));
        if (!failed) { failed = true; throw new DOMException('Injected placement receipt failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
    let error = '', pending = false, afterFailure, retry;
    try {
      try { await app.place(request); } catch (failure) { error = String(failure); }
      pending = app.hasPendingSave();
      afterFailure = { visible: app.snapshot(), saved: await repository.getActiveRun(run.pilotId) };
      retry = await app.retry();
    } finally { IDBObjectStore.prototype.add = add; }
    const freshRepository = new DexieWorkspaceRepository(); await freshRepository.initialize();
    const reloaded = new BuildApplication(freshRepository, content); await reloaded.open(run.pilotId);
    let mismatch = false;
    try { await app.place({ ...request, tileId: run.runId + ':starter:1' }); } catch { mismatch = true; }
    return { error, pending, before, afterFailure, retry, attempts, reloaded: reloaded.snapshot(), mismatch };
  }, { pack: buildPack(), run: finishedBuildRun() });
  expect(result.error).toContain('Injected');
  expect(result.pending).toBe(true);
  expect(result.afterFailure?.visible).toEqual(result.before);
  expect(result.afterFailure?.saved.shipBuild).toBeUndefined();
  expect(result.attempts).toHaveLength(2);
  expect(result.attempts[1]).toEqual(result.attempts[0]);
  expect(result.retry.run.shipBuild.revision).toBe(1);
  expect(result.retry.summary.equipped).toHaveLength(1);
  // Q246: reload preserves all durable data and derived summaries, but clears transient history.
  expect(result.reloaded).toEqual({ ...result.retry, history: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 } });
  expect(result.mismatch).toBe(true);
});
