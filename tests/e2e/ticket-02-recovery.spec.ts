import { expect, test, type Page } from '@playwright/test';
import { syntheticPack } from '../developmentPackFixture';

async function preparePilot(page: Page): Promise<void> {
  await page.route('**/content/packs/development-review-ship-v1/manifest.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(syntheticPack()) }));
  await page.goto('/');
  await page.getByLabel('Nickname').fill('RecoveryPilot');
  await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('start-run')).toBeVisible();
}

test('StartRun write failure rolls back and retry keeps the original operation identity', async ({ page }) => {
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    const attempts: Array<{ operationId: string }> = [];
    Object.defineProperty(window, '__receiptAttempts', { value: attempts });
    let fail = true;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'runOperations') {
        attempts.push(structuredClone(args[0]));
        if (fail) { fail = false; throw new DOMException('Injected StartRun receipt failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
  });
  await preparePilot(page);
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run-command-status')).toContainText('Injected StartRun receipt failure');
  await expect(page.getByTestId('run-id')).toHaveCount(0);
  await page.getByTestId('start-run').click();
  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage' })).toBeVisible();
  const attempts = await page.evaluate(() => (window as unknown as { __receiptAttempts: Array<{ operationId: string }> }).__receiptAttempts);
  expect(attempts).toHaveLength(2);
  expect(attempts[1]?.operationId).toBe(attempts[0]?.operationId);
});

test('an IndexedDB Run read failure uses storage recovery, not missing-content recovery', async ({ page }) => {
  await page.addInitScript(() => {
    const transaction = IDBDatabase.prototype.transaction;
    Object.defineProperty(window, '__failRunReads', { value: false, writable: true });
    IDBDatabase.prototype.transaction = function (...args: Parameters<typeof transaction>) {
      const stores = typeof args[0] === 'string' ? [args[0]] : Array.from(args[0]);
      if ((window as unknown as { __failRunReads: boolean }).__failRunReads && stores.includes('runs') && (!args[1] || args[1] === 'readonly')) {
        throw new DOMException('Injected Run read failure', 'UnknownError');
      }
      return transaction.apply(this, args);
    };
  });
  await preparePilot(page);
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run-id')).toBeVisible();
  const runId = await page.getByTestId('run-id').textContent();
  await page.getByTestId('back-to-pilots').click();
  await page.evaluate(() => { (window as unknown as { __failRunReads: boolean }).__failRunReads = true; });
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  await expect(page.getByTestId('retry-storage')).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __failRunReads: boolean }).__failRunReads = false; });
  await page.getByTestId('retry-storage').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('run-id')).toHaveText(runId!);
});
