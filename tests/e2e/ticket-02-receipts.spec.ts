import { expect, test } from '@playwright/test';
import { syntheticPack } from '../developmentPackFixture';

test('real IndexedDB receipts bind retries and concurrent Start requests to the same Pilot and Run', async ({ page }) => {
  await page.route('**/receipt-scenario', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Application scenario</body></html>' }));
  await page.goto('/receipt-scenario');
  const result = await page.evaluate(async (pack) => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const { ContentPackApplication } = await load('/src/application/content/ContentPackApplication.ts');
    const { LocalStorageContentPackRepository } = await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const { RunApplication } = await load('/src/application/run/RunApplication.ts');
    const repository = new DexieWorkspaceRepository();
    await repository.initialize();
    for (const id of ['pilot-a', 'pilot-b']) {
      await repository.createPilot({ operationId: 'create-' + id, pilot: { pilotId: id, nickname: id, avatarId: 'pilot-blue', createdAt: '2026-10-01T00:00:00Z', lastUsedAt: '2026-10-01T00:00:00Z' } });
    }
    const content = new ContentPackApplication(new LocalStorageContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
    await content.bootstrap();
    await content.activateCandidate(pack);
    const a = new RunApplication(repository, content, () => crypto.randomUUID());
    const b = new RunApplication(repository, content, () => crypto.randomUUID());
    const started = await Promise.all([
      a.startRun({ operationId: 'start-a1', pilotId: 'pilot-a' }),
      b.startRun({ operationId: 'start-a2', pilotId: 'pilot-a' }),
    ]);
    const conflicts = [];
    for (const operationId of ['start-a1', 'start-a2']) {
      try { await b.startRun({ operationId, pilotId: 'pilot-b' }); conflicts.push(false); }
      catch (error) { conflicts.push((error as { code?: string }).code === 'OPERATION_CONFLICT'); }
    }
    const reloaded = new RunApplication(new DexieWorkspaceRepository(), content, () => crypto.randomUUID());
    await reloaded.bootstrap();
    const retry = await reloaded.startRun({ operationId: 'start-a1', pilotId: 'pilot-a' });
    return { started, conflicts, retry, other: await reloaded.getRunProjection('pilot-b') };
  }, syntheticPack());
  expect(result.started[0]).toEqual(result.started[1]);
  expect(result.retry).toEqual(result.started[0]);
  expect(result.conflicts).toEqual([true, true]);
  expect(result.other).toEqual({ kind: 'no-run' });
});
