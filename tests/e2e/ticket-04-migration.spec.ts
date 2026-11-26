import { expect, test, type Page } from '@playwright/test';
import { finishedBuildRun } from '../buildFixture';
import { seedBuildSave } from '../buildBrowserFixture';

async function inspect(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      const stores = Array.from(db.objectStoreNames), tx = db.transaction(stores, 'readonly');
      const rows = await Promise.all(stores.map(name => new Promise<[string, unknown[]]>((resolve, reject) => {
        const request = tx.objectStore(name).getAll();
        request.onsuccess = () => resolve([name, request.result]); request.onerror = () => reject(request.error);
      })));
      return { version: db.version, stores, tables: Object.fromEntries(rows) };
    } finally { db.close(); }
  });
}

test('v3 to current schema preserves all existing Run pins, quota, collected entries and receipts without initializing a layout', async ({ page }) => {
  await seedBuildSave(page, finishedBuildRun());
  const before = await inspect(page);
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  const after = await inspect(page);
  expect(after.version).toBe(100);
  expect(after.tables.workspace).toEqual([{ key: 'workspace', schemaVersion: 10 }]);
  expect(after.stores).toContain('buildOperations');
  expect(after.tables.buildOperations).toEqual([]);
  for (const name of before.stores.filter(name => name !== 'workspace')) expect(after.tables[name]).toEqual(before.tables[name]);
});

test('invalid v3 committed state rejects the entire upgrade and preserves the original database', async ({ page }) => {
  const corrupt = finishedBuildRun(); corrupt.quota.remaining = 1;
  await seedBuildSave(page, corrupt);
  const before = await inspect(page);
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});

test('v4 metadata-write failure rolls back the new table and leaves all v3 data unchanged', async ({ page }) => {
  await seedBuildSave(page, finishedBuildRun());
  const before = await inspect(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'workspace' && this.transaction.mode === 'versionchange' && (args[0] as { schemaVersion?: number }).schemaVersion === 4) {
        throw new DOMException('Injected v4 migration failure', 'UnknownError');
      }
      return put.apply(this, args);
    };
  });
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspect(page)).toEqual(before);
});
