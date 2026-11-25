import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { syntheticPack } from '../developmentPackFixture';

const packUrl = '/content/packs/development-review-ship-v1/manifest.json';
const routePattern = '**/content/packs/development-review-ship-v1/manifest.json';
const version = 'development-review-ship-v1';
const ruleset = 'development-combat-ruleset-v1';
const runtimeFile = path.resolve('public/content/packs/development-review-ship-v1/manifest.json');

async function chooser(page: Page): Promise<void> {
  // Reload may briefly observe the old document releasing its Workspace lock.
  await expect(page.getByRole('heading', { name: /^(Pilot chooser|Workspace is active in another tab)$/ })).toBeVisible();
  if (await page.getByTestId('ownership-blocked').isVisible()) {
    await page.getByTestId('retry-ownership').click();
  }
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
}

async function createAndContinue(page: Page, nickname: string): Promise<void> {
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByTestId('create-pilot').click();
  const card = page.getByTestId('pilot-card').filter({ hasText: nickname });
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: 'Continue', exact: true }).click();
}

async function continuePilot(page: Page, nickname: string): Promise<void> {
  await page.getByTestId('pilot-card').filter({ hasText: nickname })
    .getByRole('button', { name: 'Continue', exact: true }).click();
}

test('real HTTP SHIP artifact starts one pinned Run and survives reload without a fulfilled content route', async ({ page }, testInfo) => {
  const response = await page.request.get(packUrl);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  expect((await response.body()).equals(await readFile(runtimeFile))).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await chooser(page);
  await createAndContinue(page, 'SHIP Authored');
  await expect(page.getByTestId('start-content-version')).toHaveText(version);
  await expect(page.getByTestId('start-ruleset-version')).toHaveText(ruleset);
  await expect(page.getByTestId('start-quota')).toHaveText('8');
  await expect(page.getByTestId('start-objective')).toHaveText('SHIP with a Weapon Tile');
  await page.screenshot({ path: testInfo.outputPath('ship-new-run.png'), fullPage: true });
  await page.getByTestId('start-run').dblclick();
  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage', exact: true })).toBeVisible();
  const runId = await page.getByTestId('run-id').innerText();
  expect(runId).not.toBe('');
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
  await expect(page.getByTestId('run-content-version')).toHaveText(version);
  await expect(page.getByTestId('run-ruleset-version')).toHaveText(ruleset);
  await page.screenshot({ path: testInfo.outputPath('ship-pre-run.png'), fullPage: true });
  await page.reload();
  await chooser(page);
  await continuePilot(page, 'SHIP Authored');
  await expect(page.getByTestId('run-id')).toHaveText(runId);
  await expect(page.getByTestId('run-content-version')).toHaveText(version);
  await expect(page.getByTestId('run-ruleset-version')).toHaveText(ruleset);
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
  await expect(page.getByTestId('pre-run-objective')).toContainText('SHIP');
  expect(errors).toEqual([]);
});

test('missing SHIP content preserves the real Run and Retry restores it from the actual server', async ({ page }) => {
  await page.goto('/');
  await chooser(page);
  await createAndContinue(page, 'SHIP Recovery');
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
  const runId = await page.getByTestId('run-id').innerText();
  // Fault injection is limited to this disposable browser context, never the repository file.
  await page.evaluate(async contentVersion => {
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('crossdefense-render-content-bodies');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('bodies','readwrite');tx.objectStore('bodies').delete(contentVersion);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}
  }, version);
  await page.route(routePattern, route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.reload();
  await chooser(page);
  await continuePilot(page, 'SHIP Recovery');
  await expect(page.getByRole('heading', { name: 'Content Required', exact: true })).toBeVisible();
  await expect(page.getByTestId('run-id')).toHaveText(runId);
  await expect(page.getByTestId('missing-content-version')).toHaveText(version);
  await page.unroute(routePattern);
  await page.getByTestId('retry-content').click();
  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage', exact: true })).toBeVisible();
  await expect(page.getByTestId('run-id')).toHaveText(runId);
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
});

test('tampered SHIP response cannot replace the real Last Known Good', async ({ page }) => {
  await page.goto('/');
  await chooser(page);
  await createAndContinue(page, 'SHIP Last Known Good');
  await expect(page.getByTestId('start-quota')).toHaveText('8');
  const damaged = JSON.parse(await readFile(runtimeFile, 'utf8'));
  damaged.preRun.collectionQuota = 7; // Negative candidate only, no source/runtime file change.
  await page.route(routePattern, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(damaged) }));
  await page.reload();
  await chooser(page);
  await continuePilot(page, 'SHIP Last Known Good');
  await expect(page.getByTestId('content-candidate-warning')).toContainText('INTEGRITY_MISMATCH');
  await expect(page.getByTestId('start-content-version')).toHaveText(version);
  await expect(page.getByTestId('start-quota')).toHaveText('8');
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run-content-version')).toHaveText(version);
  await expect(page.getByTestId('quota-remaining')).toHaveText('8 / 8');
});

test('activating the real SHIP default does not substitute an older pinned Run', async ({ page }) => {
  const previous = syntheticPack(); // A separate older test-only pack, never deployed as SHIP content.
  await page.route(routePattern, route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(previous) }));
  await page.goto('/');
  await chooser(page);
  await createAndContinue(page, 'Earlier Run');
  await page.getByTestId('start-run').click();
  await expect(page.getByTestId('run-content-version')).toHaveText(previous.contentVersion);
  const runId = await page.getByTestId('run-id').innerText();
  await page.unroute(routePattern);
  await page.reload(); // Bootstrap now fetches the real authored SHIP pack.
  await chooser(page);
  await continuePilot(page, 'Earlier Run');
  await expect(page.getByTestId('run-id')).toHaveText(runId);
  await expect(page.getByTestId('run-content-version')).toHaveText(previous.contentVersion);
  await expect(page.getByTestId('quota-remaining')).toHaveText('4 / 4');
  await page.getByTestId('back-to-pilots').click();
  await chooser(page);
  await createAndContinue(page, 'New SHIP Pilot');
  await expect(page.getByTestId('start-content-version')).toHaveText(version);
  await expect(page.getByTestId('start-quota')).toHaveText('8');
});
