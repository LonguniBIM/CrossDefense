import { expect, test } from '@playwright/test';
import { buildPack, finishedBuildRun } from '../buildFixture';

for (const kind of ['return', 'undo', 'redo'] as const) test(`${kind} layout and receipt roll back together in IndexedDB; retry commits once`, async ({ page }) => {
  await page.route('**/editing-persistence-test', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated editing persistence</body></html>' }));
  await page.goto('/editing-persistence-test');
  const result = await page.evaluate(async ({ run, pack, kind }) => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const { ContentPackApplication } = await load('/src/application/content/ContentPackApplication.ts');
    const { LocalStorageContentPackRepository } = await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const { BuildApplication } = await load('/src/application/build/BuildApplication.ts');
    const repository = new DexieWorkspaceRepository(); await repository.initialize();
    await repository.createPilot({ operationId: 'pilot', pilot: { pilotId: run.pilotId, nickname: 'Editing persistence', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt } });
    await repository.createRun({ operationId: 'run', run });
    const content = new ContentPackApplication(new LocalStorageContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
    await content.bootstrap(); await content.activateCandidate(pack);
    const app = new BuildApplication(repository, content); await app.open(run.pilotId);
    for (let index = 0; index < 4; index += 1) await app.place({ operationId: 'place-' + index, tileId: run.runId + ':starter:' + index, x: index, y: 2 });
    if (kind === 'redo') await app.undo({ operationId: 'prepare-redo' });
    const before = app.snapshot(), add = IDBObjectStore.prototype.add, attempts: unknown[] = [];
    let failed = false, error = '', pending = false, failure, after;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'buildOperations' && (args[0] as { kind?: string }).kind === kind) {
        attempts.push(structuredClone(args[0]));
        if (!failed) { failed = true; throw new DOMException('Injected history receipt failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
    try {
      try {
        if (kind === 'return') await app.returnToCargo({ operationId: 'fault-edit', tileId: run.runId + ':starter:2' });
        else await app[kind]({ operationId: 'fault-edit' });
      } catch (failure) { error = String(failure); }
      pending = app.hasPendingSave();
      failure = { visible: app.snapshot(), saved: await repository.getActiveRun(run.pilotId) };
      after = await app.retry();
    } finally { IDBObjectStore.prototype.add = add; }
    let mismatch = false;
    try { await app.returnToCargo({ operationId: 'fault-edit', tileId: run.runId + ':starter:0' }); } catch { mismatch = true; }
    const reopened = new BuildApplication(repository, content); await reopened.open(run.pilotId);
    return { before, failure, after, pending, error, attempts, mismatch, reloaded: reopened.snapshot() };
  }, { run: finishedBuildRun(), pack: buildPack(), kind });
  expect(result.error).toContain('Injected'); expect(result.pending).toBe(true);
  expect(result.failure.visible).toEqual(result.before); expect(result.failure.saved).toEqual(result.before.run);
  expect(result.attempts).toHaveLength(2); expect(result.attempts[1]).toEqual(result.attempts[0]);
  expect(result.after.run.shipBuild.revision).toBe(result.before.run.shipBuild.revision + 1);
  expect(result.after.run.salvage).toEqual(result.before.run.salvage); expect(result.after.run.quota).toEqual(result.before.run.quota);
  expect(result.mismatch).toBe(true);
  expect(result.reloaded).toEqual({ ...result.after, history: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 } });
});
