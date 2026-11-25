import { expect, test, type Page } from '@playwright/test';

async function seedVersionTwo(page: Page, corruptRun = false): Promise<void> {
  await page.route('**/version-two-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated legacy save fixture</body></html>' }));
  await page.goto('/version-two-fixture');
  await page.evaluate(async corrupt => {
    const path = '/node_modules/dexie/dist/dexie.mjs';
    const { default: Dexie } = await import(path);
    const db = new Dexie('crossdefense-player-data');
    db.version(2).stores({ workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId', runs: 'runId, &pilotId, contentVersion, rulesetVersion', runOperations: 'operationId, pilotId, runId' });
    await db.open();
    await db.table('workspace').add({ key: 'workspace', schemaVersion: 2 });
    await db.table('pilots').add({ pilotId: 'legacy', nickname: 'Legacy 02', avatarId: 'pilot-blue', createdAt: '2026-10-05', lastUsedAt: '2026-10-05' });
    await db.table('runs').add({ runId: 'legacy-run', pilotId: 'legacy', phase: 'pre-run-salvage', rulesetVersion: 'development-ruleset-2026-09-30', contentVersion: 'development-starter-ship-v1', quota: { total: 8, remaining: corrupt ? 9 : 8 }, starterObjective: { targetWord: 'SHIP', requiresWeaponTile: true }, startedAt: '2026-10-05' });
    await db.table('runOperations').add({ operationId: 'start-legacy', pilotId: 'legacy', runId: 'legacy-run', kind: 'start-run' });
    db.close();
  }, corruptRun);
}
async function inspect(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      const stores = Array.from(db.objectStoreNames);
      const transaction = db.transaction(stores, 'readonly');
      const values = await Promise.all(stores.map(name => new Promise<[string, unknown[]]>((resolve, reject) => {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => resolve([name, request.result]); request.onerror = () => reject(request.error);
      })));
      return { version: db.version, stores, tables: Object.fromEntries(values) };
    } finally { db.close(); }
  });
}

test('v2 -> current schema is additive and preserves the pinned Run and original Start receipt', async ({ page }) => {
  await seedVersionTwo(page);
  // This migration fixture predates the current default. Admit its actual pinned
  // legacy pack through the public content seam before bootstrapping the new app.
  await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { ContentPackApplication } = await load('/src/application/content/ContentPackApplication.ts');
    const { LocalStorageContentPackRepository } = await load('/src/infrastructure/content/LocalStorageContentPackRepository.ts');
    const pack = await (await fetch('/content/packs/development/manifest.json')).json();
    const content = new ContentPackApplication(new LocalStorageContentPackRepository(), { appVersion: '0.1.0', rulesetVersion: pack.compatibleRuleset });
    await content.bootstrap();
    if (!(await content.activateCandidate(pack)).activated) throw new Error('Legacy fixture content failed validation.');
  });
  const before = await inspect(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  const after = await inspect(page);
  expect(after.tables.runs).toEqual(before.tables.runs);
  expect(after.tables.runOperations).toEqual(before.tables.runOperations);
  expect(after.tables.pilots).toEqual(before.tables.pilots);
  expect(after.tables.workspace).toEqual([{ key: 'workspace', schemaVersion: 9 }]);
  expect(after.tables.salvageOperations).toEqual([]);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('run-id')).toHaveText('legacy-run');
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
  await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('salvage-quota')).toHaveText('8 / 8');
  await expect(page.getByTestId('collected-total')).toHaveText('0');
});

test('corrupt v2 Run aborts the upgrade and preserves every original table and version', async ({ page }) => {
  await seedVersionTwo(page, true);
  const before = await inspect(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});

test('v3 metadata write failure rolls back the new receipt table and all existing v2 data', async ({ page }) => {
  await seedVersionTwo(page);
  const before = await inspect(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'workspace' && this.transaction.mode === 'versionchange' && (args[0] as { schemaVersion?: number }).schemaVersion === 3) {
        throw new DOMException('Injected v3 metadata failure', 'UnknownError');
      }
      return put.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});
