import { expect, test } from '@playwright/test';
import { finishedBuildRun } from '../buildFixture';
import { openSavedBuild, continueSavedBuild } from '../buildBrowserFixture';

const run = finishedBuildRun();
const tileSelector = (index: number) => `[data-testid="cargo-tile"][data-tile-id="${run.runId}:starter:${index}"]`;

test('click, drag and keyboard share placement; preview does not inflate committed summaries and reload preserves SHIP', async ({ page }, testInfo) => {
  await openSavedBuild(page, run);
  await expect(page.getByTestId('ship-grid')).toBeVisible();
  await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await page.locator(tileSelector(0)).click();
  await page.getByTestId('cell-A3').click();
  await expect(page.getByTestId('cell-A3')).toContainText('S');
  await page.locator(tileSelector(1)).dragTo(page.getByTestId('cell-B3'));
  await expect(page.getByTestId('cell-B3')).toContainText('H');
  await page.locator(tileSelector(2)).focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('cell-C3').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('power-available')).toHaveText('3');
  await page.locator(tileSelector(3)).click();
  await page.getByTestId('cell-D3').hover();
  await expect(page.getByTestId('preview-power')).toContainText('4.05');
  await expect(page.getByTestId('power-available')).toHaveText('3');
  await expect(page.getByTestId('equipped-word')).toHaveCount(0);
  await page.getByTestId('cell-D3').click();
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('power-required')).toHaveText('1');
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('equipped-word')).toHaveCount(1);
  await expect(page.getByTestId('equipped-word')).toContainText('SHIP');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
      bottom: Math.max(...['.bu-cargo', '.bu-center', '.bu-inspector', '.bu-equipped', '.bu-words'].map(selector => document.querySelector(selector)!.getBoundingClientRect().bottom)),
    }));
    expect(bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.bottom).toBeLessThanOrEqual(viewport.height);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: testInfo.outputPath('build-ship.png'), fullPage: true });
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('equipped-word')).toHaveCount(1);
  await expect(page.getByTestId('cargo-tile')).toHaveCount(4);
});

test('occupied/outside targets and cancelled preview preserve the saved positions and both tiles', async ({ page }) => {
  await openSavedBuild(page, run);
  await page.locator(tileSelector(0)).click(); await page.getByTestId('cell-A3').click();
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
  await page.locator(tileSelector(1)).click(); await page.getByTestId('cell-A3').click();
  await expect(page.getByTestId('build-status')).toContainText('occupied');
  await expect(page.getByTestId('cell-A3')).toContainText('S');
  await expect(page.locator(tileSelector(1))).toBeVisible();
  await page.getByTestId('cell-A1').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toContainText('outside');
  await page.getByTestId('cell-B3').hover();
  await expect(page.getByTestId('preview-status')).toContainText('Valid placement');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
  await expect(page.getByTestId('cell-A3')).toContainText('S');
  await expect(page.getByTestId('cell-B3')).not.toContainText('H');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});

test('a failed UI placement keeps prior summaries and Retry uses the identical durable operation', async ({ page }) => {
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add, attempts: unknown[] = [];
    (window as unknown as { __buildAttempts: unknown[] }).__buildAttempts = attempts;
    let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'buildOperations') {
        attempts.push(structuredClone(args[0]));
        if (!failed) { failed = true; throw new DOMException('Injected Build save failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
  });
  await openSavedBuild(page, run);
  await page.locator(tileSelector(2)).click(); await page.getByTestId('cell-C3').click();
  await expect(page.getByTestId('retry-placement')).toBeVisible();
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await page.getByTestId('cell-B2').hover();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('build-status')).toContainText('Injected Build save failure');
  await expect(page.getByTestId('retry-placement')).toBeVisible();
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await page.getByTestId('retry-placement').click();
  await expect(page.getByTestId('retry-placement')).toBeHidden();
  await expect(page.getByTestId('power-available')).toHaveText('3');
  const attempts = await page.evaluate(() => (window as unknown as { __buildAttempts: unknown[] }).__buildAttempts);
  expect(attempts).toHaveLength(2); expect(attempts[1]).toEqual(attempts[0]);
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('power-available')).toHaveText('3');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
});

import { readFileSync } from 'node:fs';
test('an older pinned SHIP Run stays readable without borrowing new hull or vocabulary definitions', async ({ page }) => {
  const legacy = JSON.parse(readFileSync('public/content/packs/development/manifest.json', 'utf8'));
  const oldRun = finishedBuildRun('legacy-run', 'legacy-pilot', legacy);
  await openSavedBuild(page, oldRun, legacy);
  await expect(page.getByTestId('build-content-required')).toBeVisible();
  await expect(page.getByTestId('ship-grid')).toHaveCount(0);
  await expect(page.getByTestId('build-content-version')).toHaveText('development-starter-ship-v1');
  await expect(page.getByTestId('build-ruleset-version')).toHaveText('development-ruleset-2026-09-30');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('build-content-version')).toHaveText(legacy.contentVersion);
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
});

test('minimum viewport preserves the accepted Cargo/Grid/Inspector and bottom summaries', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openSavedBuild(page, run);
  const layout = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
    return { cargo: box('.bu-cargo'), grid: box('.bu-center'), inspector: box('.bu-inspector'), tiles: box('.bu-equipped'), words: box('.bu-words'), width: document.documentElement.scrollWidth, viewportWidth: innerWidth, height: document.documentElement.scrollHeight, viewportHeight: innerHeight };
  });
  expect(layout.cargo.x).toBeLessThan(layout.grid.x); expect(layout.grid.x).toBeLessThan(layout.inspector.x);
  expect(layout.tiles.y).toBeGreaterThan(layout.grid.y); expect(layout.words.x).toBeGreaterThan(layout.tiles.x);
  expect(layout.cargo.bottom).toBeGreaterThanOrEqual(layout.tiles.bottom - 1);
  expect(layout.width).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.tiles.bottom).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.words.bottom).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.height).toBeLessThanOrEqual(layout.viewportHeight);
  await page.screenshot({ path: testInfo.outputPath('build-minimum.png'), fullPage: true });
});

import { installPreRunTestClock, collectStarterThroughKeyboard } from '../preRunBrowserPlayer';
import { readFile } from 'node:fs/promises';
test('a fresh Pilot earns real Build-pack tiles in Pre-Run, places SHIP and reloads the saved Build', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await installPreRunTestClock(page);
  const response = await page.request.get('/content/packs/development-rendered-combat-ship-v1/manifest.json');
  expect(response.status()).toBe(200);
  expect((await response.body()).equals(await readFile('public/content/packs/development-rendered-combat-ship-v1/manifest.json'))).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByLabel('Nickname').fill('End to end builder');
  await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('start-content-version')).toHaveText('development-review-ship-v1');
  await expect(page.getByTestId('start-ruleset-version')).toHaveText('development-combat-ruleset-v1');
  await page.getByTestId('start-run').click(); await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('collected-total')).toHaveText('0');
  await collectStarterThroughKeyboard(page);
  await page.getByTestId('finish-salvage').click();
  await expect(page.getByTestId('ship-grid')).toBeVisible();
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  const actualRunId = await page.getByTestId('run-id').innerText();
  for (const [letter, subtype, coordinate] of [['S', 'Ballistic', 'A3'], ['H', 'Armor', 'B3'], ['I', 'Power', 'C3'], ['P', 'Armor', 'D3']]) {
    await page.getByRole('button', { name: `${letter}, ${subtype}, unplaced Letter Tile`, exact: true }).first().click();
    await page.getByTestId('cell-' + coordinate).click();
    await expect(page.getByTestId('cell-' + coordinate)).toContainText(letter!);
  }
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('equipped-word')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('earned-ship-build.png'), fullPage: true });
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('run-id')).toHaveText(actualRunId);
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('committed unsupported sequences retain intrinsic Power and explanatory Inspector feedback after reload', async ({ page }) => {
  await openSavedBuild(page, run);
  for (const [index, coordinate] of [[0, 'A3'], [1, 'B3'], [2, 'C3']] as const) {
    await page.locator(tileSelector(index)).click();
    await page.getByTestId('cell-' + coordinate).click();
    await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
  await expect(page.getByTestId('power-available')).toHaveText('3');
  await expect(page.getByTestId('power-required')).toHaveText('1');
  await expect(page.getByTestId('equipped-word')).toHaveCount(0);
  await expect(page.getByTestId('selected-effects')).toContainText('SHI');
  await expect(page.getByTestId('selected-effects')).toContainText('Not supported');
  await page.reload(); await continueSavedBuild(page);
  await page.getByTestId('cell-C3').click();
  await expect(page.getByTestId('selected-effects')).toContainText('SHI');
  await expect(page.getByTestId('selected-effects')).toContainText('Not supported');
  await expect(page.getByTestId('power-available')).toHaveText('3');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(5);
});


test('new hover preview clears an obsolete target error without changing the saved SHIP', async ({ page }, testInfo) => {
  await openSavedBuild(page, run);
  for (const [index, position] of [[0, 'A3'], [1, 'B3'], [2, 'C3'], [3, 'D3']] as const) {
    await page.locator(tileSelector(index)).click();
    await page.getByTestId('cell-' + position).click();
    await expect(page.getByTestId('cell-' + position)).toHaveAttribute('data-tile-id', `${run.runId}:starter:${index}`);
  }
  await page.keyboard.press('Escape');
  await page.getByTestId('cell-B3').click();
  await page.getByTestId('cell-A1').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toHaveText('This cell is outside the selected hull.');
  // Automatic focus restoration must not immediately hide the new rejection.
  await page.getByTestId('cell-A1').hover();
  await expect(page.getByTestId('build-status')).toHaveText('This cell is outside the selected hull.');
  await page.getByTestId('cell-B2').hover();
  await expect(page.getByTestId('preview-status')).toContainText('Valid placement at B2.');
  await expect(page.getByTestId('preview-power')).toHaveText('Available 4.05 -> 3; required 1 -> 1; surplus 3.05 -> 2.');
  await page.screenshot({ path: testInfo.outputPath('fresh-preview-after-rejection.png'), fullPage: true });
  await expect(page.getByTestId('build-status')).toBeEmpty();
  await expect(page.getByTestId('cell-B3')).toHaveAttribute('data-tile-id', `${run.runId}:starter:1`);
  await expect(page.getByTestId('cell-B2')).not.toHaveAttribute('data-tile-id', /.+/);
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('power-required')).toHaveText('1');
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('equipped-word')).toHaveCount(1);
  await expect(page.getByTestId('equipped-word')).toContainText('SHIP');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('cell-B3')).toHaveAttribute('data-tile-id', `${run.runId}:starter:1`);
  await expect(page.getByTestId('cell-B2')).not.toHaveAttribute('data-tile-id', /.+/);
  await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(4);
});


test('Escape dismisses a target rejection but preserves success acknowledgments and saved state', async ({ page }, testInfo) => {
  await openSavedBuild(page, run);
  await page.locator(tileSelector(1)).click();
  await page.getByTestId('cell-A1').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toHaveText('This cell is outside the selected hull.');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('build-status')).toBeEmpty();
  await expect(page.getByTestId('selected-tile')).toHaveText('Select a tile or equipped word.');
  await expect(page.getByTestId('preview-status')).toHaveText('Select a tile and point to a hull cell.');
  await expect(page.locator('.bu-preview-valid,.bu-preview-invalid,.bu-affected')).toHaveCount(0);
  await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await page.screenshot({ path: testInfo.outputPath('rejection-cancelled.png'), fullPage: true });
  await page.locator(tileSelector(1)).click(); await page.getByTestId('cell-B2').click();
  await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  await page.locator(tileSelector(3)).click(); await page.getByTestId('cell-B3').hover();
  await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('cell-B2')).toHaveAttribute('data-tile-id', `${run.runId}:starter:1`);
  await expect(page.getByTestId('cell-B3')).not.toHaveAttribute('data-tile-id', /.+/);
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
});


test('keyboard preview replaces obsolete rejection feedback while retaining the current invalid-target cue', async ({ page }) => {
  await openSavedBuild(page, run);
  await page.locator(tileSelector(1)).click();
  await page.getByTestId('cell-A1').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toContainText('outside');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('cell-B1')).toBeFocused();
  await expect(page.getByTestId('build-status')).toBeEmpty();
  await expect(page.getByTestId('preview-status')).toHaveText('This cell is outside the selected hull.');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('cell-B2')).toBeFocused();
  await expect(page.getByTestId('preview-status')).toContainText('Valid placement at B2.');
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(8);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('selected-tile')).toHaveText('Select a tile or equipped word.');
});

test('fresh drag and occupied rejections survive automatic focus restoration until a new preview', async ({ page }, testInfo) => {
  await openSavedBuild(page, run);
  await page.locator(tileSelector(0)).click(); await page.getByTestId('cell-A3').click();
  await expect(page.getByTestId('cell-A3')).toHaveAttribute('data-tile-id', `${run.runId}:starter:0`);
  await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  const source = page.locator(tileSelector(1)), destination = page.getByTestId('cell-A1');
  await expect(source).toBeEnabled(); await expect(source).toHaveAttribute('draggable', 'true');
  // Observe native HTML5 events: completing a mouse move is not proof that a drag/drop occurred.
  await page.evaluate(() => {
    const events: Array<{ type: string; tileId: string | null; target: string | null; trusted: boolean }> = [];
    (window as unknown as { buildDragEvents: typeof events }).buildDragEvents = events;
    for (const type of ['dragstart', 'dragover', 'drop']) document.addEventListener(type, event => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      events.push({ type: event.type, tileId: button?.getAttribute('data-tile-id') ?? null,
        target: button?.getAttribute('data-testid') ?? null, trusted: event.isTrusted });
    }, { capture: true });
  });
  const start = await source.boundingBox(), end = await destination.boundingBox();
  if (!start || !end) throw new Error('Native drag source/target bounds are unavailable.');
  let holding = false;
  try {
    const x = start.x + start.width / 2, y = start.y + start.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); holding = true;
    await page.mouse.move(x + 12, y + 2, { steps: 5 });
    await page.mouse.move(x + 18, y + 2, { steps: 2 });
    await expect.poll(() => page.evaluate(tileId =>
      (window as unknown as { buildDragEvents: Array<{ type: string; tileId: string | null; trusted: boolean }> })
        .buildDragEvents.some(event => event.type === 'dragstart' && event.tileId === tileId && event.trusted),
      run.runId + ':starter:1')).toBe(true);
    await expect(page.getByTestId('selected-tile')).toHaveText('H / Armor');
    await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 12 });
    await page.mouse.move(end.x + end.width / 2 + 1, end.y + end.height / 2, { steps: 2 });
    await expect.poll(() => page.evaluate(() =>
      (window as unknown as { buildDragEvents: Array<{ type: string; target: string | null; trusted: boolean }> })
        .buildDragEvents.some(event => event.type === 'dragover' && event.target === 'cell-A1' && event.trusted))).toBe(true);
    await page.mouse.up(); holding = false;
    await expect.poll(() => page.evaluate(() =>
      (window as unknown as { buildDragEvents: Array<{ type: string; target: string | null; trusted: boolean }> })
        .buildDragEvents.some(event => event.type === 'drop' && event.target === 'cell-A1' && event.trusted))).toBe(true);
  } finally {
    if (holding) await page.mouse.up();
    const events = await page.evaluate(() => (window as unknown as { buildDragEvents: unknown[] }).buildDragEvents);
    await testInfo.attach('native-rejected-drag.json', { body: JSON.stringify(events, null, 2), contentType: 'application/json' });
  }
  await expect(page.getByTestId('build-status')).toHaveText('This cell is outside the selected hull.');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
  await page.getByTestId('cell-B3').hover();
  await expect(page.getByTestId('build-status')).toBeEmpty();
  await expect(page.getByTestId('preview-status')).toContainText('Valid placement at B3.');
  await page.getByTestId('cell-A3').click();
  await expect(page.getByTestId('build-status')).toHaveText('This cell is occupied. Both tiles are unchanged.');
  await expect(page.locator(tileSelector(1))).toBeVisible();
  await page.getByTestId('cell-B3').hover();
  await expect(page.getByTestId('build-status')).toBeEmpty();
  await expect(page.getByTestId('cell-A3')).toHaveAttribute('data-tile-id', `${run.runId}:starter:0`);
  await expect(page.getByTestId('power-required')).toHaveText('1');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(7);
});
