import { test, expect } from '@playwright/test';
import { seedV8OutcomeSave, inspectReviewSave } from '../reviewBrowserFixture';

const reviewTables = ['reviewOccurrences', 'reviewLinks', 'reviewOperations', 'reviewRewards'];
test('v8 to v9 preserves every old row, paid economy, outcomes and pins while adding empty Review stores', async ({ page }) => {
  await seedV8OutcomeSave(page, { count: 2, resolvedCargo: true });
  const before = await inspectReviewSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  const after = await inspectReviewSave(page);
  expect(after.version).toBe(90);
  expect(after.tables.workspace).toEqual([{ key: 'workspace', schemaVersion: 9 }]);
  for (const name of Object.keys(before.tables).filter(name => name !== 'workspace')) expect(after.tables[name], name).toEqual(before.tables[name]);
  for (const name of reviewTables) expect(after.tables[name], name).toEqual([]);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-content-version')).toHaveText('development-combat-ship-v1');
  await expect(page.getByTestId('build-review')).toBeHidden();
});

test('v9 rejects a mismatched old economy and rolls back all new stores without resetting balances', async ({ page }) => {
  await seedV8OutcomeSave(page, { corruptEconomy: true });
  const before = await inspectReviewSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(before);
});

test('v9 versionchange write failure rolls back new stores and preserves the complete v8 save', async ({ page }) => {
  await seedV8OutcomeSave(page);
  const before = await inspectReviewSave(page);
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
      if (this.name === 'workspace' && this.transaction.mode === 'versionchange' && (args[0] as { schemaVersion?: number }).schemaVersion === 9) {
        throw new DOMException('Injected v9 migration failure', 'UnknownError');
      }
      return put.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(before);
});
