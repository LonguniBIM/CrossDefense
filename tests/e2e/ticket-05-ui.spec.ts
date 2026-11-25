import { expect, test, type Page } from '@playwright/test';
import { finishedBuildRun } from '../buildFixture';
import { openSavedBuild, continueSavedBuild } from '../buildBrowserFixture';
const run = finishedBuildRun();
const id = (index: number) => run.runId + ':starter:' + index;
const cargo = (page: Page, index: number) => page.locator(`[data-testid="cargo-tile"][data-tile-id="${id(index)}"]`);
async function placeShip(page: Page) {
  for (let index = 0; index < 4; index += 1) {
    await cargo(page, index).click(); await page.getByTestId('cell-' + String.fromCharCode(65 + index) + '3').click();
    await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
}

test('Return preview is transient; native Return and keyboard Undo/Redo save layout while reload clears history', async ({ page }, testInfo) => {
  await openSavedBuild(page, run);
  await expect(page.getByTestId('return-tile')).toBeDisabled();
  await expect(page.getByTestId('undo-build')).toBeDisabled();
  await expect(page.getByTestId('redo-build')).toBeDisabled();
  await placeShip(page);
  await page.keyboard.press('Escape'); await page.getByTestId('cell-C3').click();
  await page.getByTestId('return-tile').hover();
  await expect(page.getByTestId('preview-status')).toContainText('Return to Cargo');
  await expect(page.getByTestId('preview-power')).toContainText('Available 4.05 -> 0');
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', id(2));
  await page.screenshot({ path: testInfo.outputPath('return-preview.png'), fullPage: true });
  await page.getByTestId('return-tile').click();
  await expect(page.getByTestId('build-status')).toHaveText('Tile returned to Cargo.');
  await expect(cargo(page, 2)).toBeVisible();
  await expect(page.getByTestId('cell-C3')).not.toHaveAttribute('data-tile-id', /.+/);
  await expect(page.getByTestId('power-surplus')).toHaveText('-1');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await expect(page.getByTestId('cargo-capacity')).toHaveText('24');
  await expect(page.getByTestId('equipped-word')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('returned-power-tile.png'), fullPage: true });
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('build-status')).toHaveText('Undo saved.');
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('redo-build')).toBeEnabled();
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByTestId('build-status')).toHaveText('Redo saved.');
  await expect(page.getByTestId('power-surplus')).toHaveText('-1');
  await page.getByTestId('undo-build').click();
  await expect(page.getByTestId('build-status')).toHaveText('Undo saved.');
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('equipped-word')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('undo-restored-ship.png'), fullPage: true });
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('undo-build')).toBeDisabled(); await expect(page.getByTestId('redo-build')).toBeDisabled();
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', id(2));
});

for (const kind of ['return', 'undo', 'redo'] as const) test(`${kind} save failure keeps prior UI/history and Retry reuses one durable operation`, async ({ page }, testInfo) => {
  await page.addInitScript(kind => {
    const add = IDBObjectStore.prototype.add;
    const attempts: unknown[] = [];
    (window as unknown as { __editAttempts: unknown[] }).__editAttempts = attempts;
    let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'buildOperations' && (args[0] as { kind?: string }).kind === kind) {
        attempts.push(structuredClone(args[0]));
        if (!failed) { failed = true; throw new DOMException('Injected ' + kind + ' save failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
  }, kind);
  await openSavedBuild(page, run); await placeShip(page);
  if (kind === 'redo') { await page.getByTestId('undo-build').click(); await expect(page.getByTestId('build-status')).toHaveText('Undo saved.'); }
  if (kind === 'return') { await page.keyboard.press('Escape'); await page.getByTestId('cell-C3').click(); }
  const beforePower = await page.getByTestId('power-available').innerText(), beforeCargo = await page.getByTestId('cargo-tile').count();
  await page.getByTestId(kind === 'return' ? 'return-tile' : kind + '-build').click();
  await expect(page.getByTestId('build-status')).toContainText('Injected ' + kind + ' save failure');
  await expect(page.getByTestId('power-available')).toHaveText(beforePower);
  await expect(page.getByTestId('cargo-tile')).toHaveCount(beforeCargo);
  await expect(page.getByTestId('undo-build')).toBeDisabled(); await expect(page.getByTestId('redo-build')).toBeDisabled();
  await page.getByTestId('cell-B2').hover(); await page.keyboard.press('Escape');
  await expect(page.getByTestId('build-status')).toContainText('Injected ' + kind + ' save failure');
  await expect(page.getByTestId('retry-placement')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(kind + '-save-failed.png'), fullPage: true });
  await page.getByTestId('retry-placement').click();
  await expect(page.getByTestId('build-status')).toHaveText(kind === 'return' ? 'Tile returned to Cargo.' : kind === 'undo' ? 'Undo saved.' : 'Redo saved.');
  const attempts = await page.evaluate(() => (window as unknown as { __editAttempts: unknown[] }).__editAttempts);
  expect(attempts).toHaveLength(2); expect(attempts[1]).toEqual(attempts[0]);
  const afterPower = kind === 'return' ? '0' : kind === 'undo' ? '3' : '4.05';
  await expect(page.getByTestId('power-available')).toHaveText(afterPower);
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('power-available')).toHaveText(afterPower);
  await expect(page.getByTestId('undo-build')).toBeDisabled(); await expect(page.getByTestId('redo-build')).toBeDisabled();
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});

test('history shortcuts ignore text entry; new edits clear Redo and leaving Build clears its editing history', async ({ page }) => {
  await openSavedBuild(page, run); await placeShip(page);
  await page.evaluate(() => {
    const input = document.createElement('input'); input.dataset.testid = 'isolated-text-entry';
    document.querySelector('.bu-inspector')!.append(input);
  });
  await page.getByTestId('isolated-text-entry').fill('notes');
  await page.keyboard.press('Control+z'); await page.keyboard.press('Control+Shift+z');
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('redo-build')).toBeDisabled();
  await page.getByTestId('undo-build').click(); await expect(page.getByTestId('power-available')).toHaveText('3');
  await expect(page.getByTestId('redo-build')).toBeEnabled();
  await cargo(page, 3).click(); await page.getByTestId('cell-D4').click();
  await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  await expect(page.getByTestId('redo-build')).toBeDisabled();
  await page.getByTestId('back-to-pilots').click(); await continueSavedBuild(page);
  await expect(page.getByTestId('undo-build')).toBeDisabled(); await expect(page.getByTestId('redo-build')).toBeDisabled();
  await expect(page.getByTestId('cell-D4')).toHaveAttribute('data-tile-id', id(3));
  await expect(page.getByTestId('power-available')).toHaveText('3');
});

test('crossing Power restores after Return/Undo and duplicate-looking tiles retain individual identities', async ({ page }, testInfo) => {
  await openSavedBuild(page, run); await placeShip(page);
  await cargo(page, 4).click(); await page.getByTestId('cell-C2').click();
  await cargo(page, 7).click(); await page.getByTestId('cell-C4').click();
  await expect(page.getByTestId('power-available')).toHaveText('4.5');
  await expect(page.getByTestId('power-required')).toHaveText('2');
  await expect(page.getByTestId('equipped-word')).toHaveCount(2);
  await page.keyboard.press('Escape'); await page.getByTestId('cell-D3').click();
  await page.getByTestId('return-tile').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toHaveText('Tile returned to Cargo.');
  await expect(cargo(page, 3)).toBeVisible();
  await expect(page.getByTestId('cell-C4')).toHaveAttribute('data-tile-id', id(7));
  await expect(page.getByTestId('power-available')).toHaveText('3.6');
  await page.getByTestId('undo-build').click();
  await expect(page.getByTestId('power-available')).toHaveText('4.5');
  await expect(page.getByTestId('cell-D3')).toHaveAttribute('data-tile-id', id(3));
  await expect(page.getByTestId('cell-C4')).toHaveAttribute('data-tile-id', id(7));
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    expect(bounds.width).toBeLessThanOrEqual(viewport.width); expect(bounds.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByTestId('undo-build')).toBeVisible(); await expect(page.getByTestId('return-tile')).toBeVisible();
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: testInfo.outputPath('crossing-restored.png'), fullPage: true });
});

test('successful Retry restores visible keyboard focus so Ctrl+Z works without another click', async ({ page }) => {
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (!failed && this.name === 'buildOperations' && (args[0] as { kind?: string }).kind === 'return') {
        failed = true; throw new DOMException('Injected Return receipt failure', 'UnknownError');
      }
      return add.apply(this, args);
    };
  });
  await openSavedBuild(page, run); await placeShip(page);
  await page.keyboard.press('Escape'); await page.getByTestId('cell-C3').click();
  await page.getByTestId('return-tile').click();
  await expect(page.getByTestId('build-status')).toContainText('Injected Return receipt failure');
  await page.getByTestId('retry-placement').click();
  await expect(page.getByTestId('build-status')).toHaveText('Tile returned to Cargo.');
  await expect(page.getByTestId('power-available')).toHaveText('0');
  // No click or programmatic focus: this must work immediately after the successful retry.
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('build-status')).toHaveText('Undo saved.');
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', id(2));
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});
