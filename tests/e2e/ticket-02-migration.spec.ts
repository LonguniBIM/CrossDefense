import { expect, test, type Page } from '@playwright/test';

async function seedLegacy(page: Page, schemaVersion: number, corruptPilot = false): Promise<number> {
  await page.route('**/migration-seed', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Seed</body></html>' }));
  await page.goto('/migration-seed');
  return page.evaluate(async ({ schemaVersion, corruptPilot }) => {
    const modulePath = '/node_modules/dexie/dist/dexie.mjs';
    const { default: Dexie } = await import(modulePath);
    const db = new Dexie('crossdefense-player-data');
    db.version(1).stores({ workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId' });
    await db.open();
    await db.table('workspace').add({ key: 'workspace', schemaVersion });
    await db.table('pilots').add({ pilotId: 'legacy-pilot', nickname: corruptPilot ? '' : 'Legacy', avatarId: 'pilot-blue', createdAt: '2026-10-01T00:00:00Z', lastUsedAt: '2026-10-01T00:00:00Z' });
    const version = db.backendDB().version;
    db.close();
    return version;
  }, { schemaVersion, corruptPilot });
}

async function inspectSave(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = db.transaction(['workspace', 'pilots'], 'readonly');
      const read = (name: string) => new Promise<unknown[]>((resolve, reject) => {
        const request = transaction.objectStore(name).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return { version: db.version, stores: Array.from(db.objectStoreNames), workspace: await read('workspace'), pilots: await read('pilots') };
    } finally { db.close(); }
  });
}

test('rejects an unknown legacy root schema without relabelling the original save', async ({ page }) => {
  const originalVersion = await seedLegacy(page, 99);
  const original = await inspectSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  expect(await inspectSave(page)).toEqual(original);
  expect((await inspectSave(page)).version).toBe(originalVersion);
});

test('upgrades a valid v1 Workspace without changing its Pilot data', async ({ page }) => {
  await seedLegacy(page, 1);
  const original = await inspectSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  const upgraded = await inspectSave(page);
  expect(upgraded.pilots).toEqual(original.pilots);
  expect(upgraded.workspace).toEqual([{ key: 'workspace', schemaVersion: 10 }]);
  expect(upgraded.stores).toContain('runs');
});

test('invalid legacy Pilot aborts the entire upgrade, not only post-open validation', async ({ page }) => {
  await seedLegacy(page, 1, true);
  const original = await inspectSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  expect(await inspectSave(page)).toEqual(original);
});

test('failure while writing upgraded metadata rolls back schema and original data', async ({ page }) => {
  await seedLegacy(page, 1);
  const original = await inspectSave(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'workspace' && this.transaction.mode === 'versionchange') {
        throw new DOMException('Injected upgrade write failure', 'UnknownError');
      }
      return put.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  expect(await inspectSave(page)).toEqual(original);
});
