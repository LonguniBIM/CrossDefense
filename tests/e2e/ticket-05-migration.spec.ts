import { expect, test, type Page } from '@playwright/test';
import { finishedBuildRun } from '../buildFixture';

async function seedV4(page: Page, badReceipt = false): Promise<void> {
  await page.route('**/v4-editing-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated v4 fixture</body></html>' }));
  await page.goto('/v4-editing-fixture');
  await page.evaluate(async ({ run, badReceipt }) => {
    run.shipBuild = { hullId: 'development-diamond-13', revision: 1, placements: [{ tileId: run.runId + ':starter:0', x: 0, y: 2 }] };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data', 40);
      request.onupgradeneeded = () => {
        for (const [name, key, indexes] of [
          ['workspace', 'key', []], ['pilots', 'pilotId', ['lastUsedAt']], ['operations', 'operationId', ['pilotId']],
          ['runs', 'runId', ['pilotId', 'contentVersion', 'rulesetVersion']], ['runOperations', 'operationId', ['pilotId', 'runId']],
          ['salvageOperations', 'operationId', ['pilotId', 'runId']], ['buildOperations', 'operationId', ['pilotId', 'runId']],
        ] as Array<[string, string, string[]]>) {
          const store = request.result.createObjectStore(name, { keyPath: key });
          for (const index of indexes) store.createIndex(index, index, { unique: name === 'runs' && index === 'pilotId' });
        }
      };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
        tx.objectStore('workspace').add({ key: 'workspace', schemaVersion: 4 });
        tx.objectStore('pilots').add({ pilotId: run.pilotId, nickname: 'Legacy editing', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt });
        tx.objectStore('runs').add(run);
        tx.objectStore('buildOperations').add({ operationId: 'legacy-place', pilotId: badReceipt ? 'wrong-pilot' : run.pilotId, runId: run.runId, kind: 'place', fingerprint: 'existing-opaque-receipt' });
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { run: finishedBuildRun(), badReceipt });
}
async function inspect(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      const names = Array.from(db.objectStoreNames), tx = db.transaction(names, 'readonly');
      const rows = await Promise.all(names.map(name => new Promise<[string, unknown[]]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll(); request.onsuccess = () => resolve([name, request.result]); request.onerror = () => reject(request.error);
      })));
      return { version: db.version, tables: Object.fromEntries(rows) };
    } finally { db.close(); }
  });
}

test('v4 to current schema preserves exact layout, content pins, quota, retained tiles and prior receipts', async ({ page }) => {
  await seedV4(page); const before = await inspect(page);
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  const after = await inspect(page);
  expect(after.version).toBe(100);
  expect(after.tables.workspace).toEqual([{ key: 'workspace', schemaVersion: 10 }]);
  for (const name of Object.keys(before.tables).filter(name => name !== 'workspace')) expect(after.tables[name]).toEqual(before.tables[name]);
});

test('v4 receipt-owner mismatch rejects the whole upgrade without changing existing data', async ({ page }) => {
  await seedV4(page, true); const before = await inspect(page);
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});

test('v5 metadata-write failure aborts the version change and preserves all v4 data', async ({ page }) => {
  await seedV4(page); const before = await inspect(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'workspace' && this.transaction.mode === 'versionchange' && (args[0] as { schemaVersion?: number }).schemaVersion === 5) throw new DOMException('Injected v5 write failure', 'UnknownError');
      return put.apply(this, args);
    };
  });
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});
