import { expect, test, type Page } from '@playwright/test';

async function openSalvage(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByLabel('Nickname').fill('Salvage player');
  await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('start-run').click();
  await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('pre-run-board')).toBeVisible();
}

test('real SHIP opens a playable board with three Next pieces, stable Hold and no starting grants', async ({ page }) => {
  // Hold semantics use controlled ticks; a native delayed frame correctly pauses the production game.
  await installFrameClock(page);
  await openSalvage(page);
  await frame(page, 0);
  await expect(page.getByTestId('salvage-quota')).toHaveText('8 / 8');
  await expect(page.getByTestId('collected-total')).toHaveText('0');
  await expect(page.getByTestId('finish-salvage')).toBeHidden();
  await expect(page.getByTestId('next-pieces').locator('.pr-preview')).toHaveCount(3);
  const initialId = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.keyboard.press('c');
  await frame(page);
  await expect(page.getByTestId('hold-piece').locator('.pr-preview')).toHaveAttribute('data-piece-id', initialId!);
  await expect(page.getByTestId('salvage-quota')).toHaveText('8 / 8');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-message')).toContainText('Paused');
});

import { choosePlacement } from '../preRunPlayer';
import { createBoard, type BoardState } from '../../src/domain/preRun/board';

async function installFrameClock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let serial = 0, time = 0;
    const frames = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = callback => { frames.set(++serial, callback); return serial; };
    window.cancelAnimationFrame = id => { frames.delete(id); };
    (window as unknown as { __advanceTestFrame: (milliseconds: number) => Promise<void> }).__advanceTestFrame = async milliseconds => {
      time += milliseconds;
      const current = [...frames.values()]; frames.clear();
      await Promise.all(current.map(callback => callback(time)));
    };
  });
}
async function frame(page: Page, milliseconds = 1000 / 60): Promise<void> {
  await page.evaluate(async milliseconds => {
    await (window as unknown as { __advanceTestFrame: (milliseconds: number) => Promise<void> }).__advanceTestFrame(milliseconds);
  }, milliseconds);
}
async function observedBoard(page: Page): Promise<BoardState> {
  const observed = await page.evaluate(() => {
    const readCells = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].map(node => ({
      id: node.dataset.cellId!, x: Number(node.dataset.x), y: Number(node.dataset.y),
      payload: node.dataset.payloadId ? { id: node.dataset.payloadId, letter: node.dataset.letter!, subtype: node.dataset.subtype! } : null,
    }));
    const active = document.querySelector<HTMLElement>('[data-testid="active-piece"]')!;
    return { id: active.dataset.pieceId!, shape: active.dataset.shape!, pivot: [Number(active.dataset.pivotX), Number(active.dataset.pivotY)], cells: readCells('[data-testid="active-piece"] .pr-cell'), grid: readCells('[data-testid="locked-cells"] .pr-cell') };
  });
  const cells = observed.cells as BoardState['active']['cells'];
  return { ...createBoard('test-player-only', []), grid: observed.grid as BoardState['grid'], active: {
    id: observed.id, shape: observed.shape as BoardState['active']['shape'], pivot: observed.pivot as [number, number],
    cells, payloadCell: cells.findIndex(cell => cell.payload !== null), payload: cells.find(cell => cell.payload)?.payload ?? null,
  } };
}
const controls = { cw: 'x', ccw: 'z', left: 'ArrowLeft', right: 'ArrowRight', drop: 'Space', down: 'ArrowDown', hold: 'c' } as const;

test('keyboard clears the finite pool, failed collection retries once, reload preserves progress and Finish survives reload', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await installFrameClock(page);
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    let failed = false;
    const attempts: unknown[] = [];
    (window as unknown as { __collectionAttempts: unknown[] }).__collectionAttempts = attempts;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      const value = args[0] as { kind?: string };
      if (this.name === 'salvageOperations' && value.kind === 'collect') {
        attempts.push(structuredClone(value));
        if (!failed && sessionStorage.getItem('collection-failure-tested') !== 'yes') {
          failed = true;
          sessionStorage.setItem('collection-failure-tested', 'yes');
          throw new DOMException('Injected collection receipt failure', 'UnknownError');
        }
      }
      return add.apply(this, args);
    };
  });
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await openSalvage(page);
  await frame(page);
  const runId = await page.getByTestId('salvage-run-id').innerText();
  let failureSeen = false;
  let reloaded = false;
  for (let piece = 0; piece < 150; piece += 1) {
    if (await page.getByTestId('salvage-quota').innerText() === '0 / 8') break;
    if (await page.getByTestId('reset-salvage').isVisible()) {
      await page.getByTestId('reset-salvage').click();
      await page.getByTestId('pre-run-board').focus();
      await frame(page);
    }
    const actions = choosePlacement(await observedBoard(page));
    const beforeQuota = await page.getByTestId('salvage-quota').innerText();
    const beforeCount = await page.getByTestId('collected-total').innerText();
    for (const action of actions) await page.keyboard.press(controls[action]);
    await frame(page);
    if (await page.getByTestId('retry-collection').isVisible()) {
      failureSeen = true;
      await expect(page.getByTestId('salvage-quota')).toHaveText(beforeQuota);
      await expect(page.getByTestId('collected-total')).toHaveText(beforeCount);
      const frozen = await page.getByTestId('active-piece').innerHTML();
      await frame(page);
      expect(await page.getByTestId('active-piece').innerHTML()).toBe(frozen);
      await page.getByTestId('retry-collection').click();
      await expect(page.getByTestId('retry-collection')).toBeHidden();
      // The Retry button hides as saving starts, not only after acknowledgment.
      // Wait for the actual second durable attempt before checking its identity.
      await expect.poll(() => page.evaluate(() => (window as unknown as { __collectionAttempts: unknown[] }).__collectionAttempts.length)).toBe(2);
      const attempts = await page.evaluate(() => (window as unknown as { __collectionAttempts: unknown[] }).__collectionAttempts);
      expect(attempts).toHaveLength(2);
      expect(attempts[1]).toEqual(attempts[0]);
      await page.getByTestId('pre-run-board').focus();
    }
    await frame(page);
    if (failureSeen && !reloaded) {
      const quota = await page.getByTestId('salvage-quota').innerText();
      const count = await page.getByTestId('collected-total').innerText();
      const harvest = await page.getByTestId('harvest').innerText();
      await page.reload();
      await expect(page.getByRole('heading', { name: /^(Pilot chooser|Workspace is active in another tab)$/ })).toBeVisible();
      if (await page.getByTestId('retry-ownership').isVisible()) await page.getByTestId('retry-ownership').click();
      await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByTestId('begin-salvage').click();
      await expect(page.getByTestId('salvage-quota')).toHaveText(quota);
      await expect(page.getByTestId('collected-total')).toHaveText(count);
      await expect(page.getByTestId('salvage-run-id')).toHaveText(runId);
      expect(await page.getByTestId('harvest').innerText()).toBe(harvest);
      reloaded = true;
      await frame(page);
    }
  }
  expect(failureSeen).toBe(true);
  expect(reloaded).toBe(true);
  await expect(page.getByTestId('salvage-quota')).toHaveText('0 / 8');
  await expect(page.getByTestId('collected-total')).toHaveText('8');
  await expect(page.getByTestId('finish-salvage')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('ship-pool-collected.png'), fullPage: true });
  await page.getByTestId('finish-salvage').click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await page.reload();
  await expect(page.getByRole('heading', { name: /^(Pilot chooser|Workspace is active in another tab)$/ })).toBeVisible();
  if (await page.getByTestId('retry-ownership').isVisible()) await page.getByTestId('retry-ownership').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  await expect(page.getByTestId('run-id')).toHaveText(runId);
  expect(pageErrors).toEqual([]);
});

test('minimum viewport fits equal cell sizes; pause and resize stop simulation until explicit countdown resume', async ({ page }, testInfo) => {
  await installFrameClock(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openSalvage(page);
  await frame(page);
  const sizes = await page.evaluate(() => {
    const width = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().width;
    return { active: width('[data-testid="active-piece"] .pr-cell'), next: width('[data-testid="next-pieces"] .pr-cell'), overflow: document.documentElement.scrollHeight > innerHeight, horizontal: document.documentElement.scrollWidth > innerWidth };
  });
  expect(sizes.active).toBe(sizes.next);
  expect(sizes.overflow).toBe(false);
  expect(sizes.horizontal).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('pre-run-minimum.png'), fullPage: true });
  await page.keyboard.press('Escape');
  const paused = await page.getByTestId('active-piece').innerHTML();
  await frame(page, 5000);
  expect(await page.getByTestId('active-piece').innerHTML()).toBe(paused);
  await page.setViewportSize({ width: 1100, height: 650 });
  await expect(page.getByTestId('resume-salvage')).toBeDisabled();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByTestId('resume-salvage').click();
  // Resume resets elapsed time; establish its baseline before advancing the controlled clock.
  await frame(page, 0);
  await expect(page.getByTestId('pause-message')).toContainText('resuming in 3');
  await frame(page, 2999);
  await expect(page.getByTestId('pause-message')).toContainText('resuming in 1');
  expect(await page.getByTestId('active-piece').innerHTML()).toBe(paused);
  await frame(page, 1);
  await expect(page.getByTestId('pause-message')).toBeHidden();
  expect(await page.getByTestId('active-piece').innerHTML()).toBe(paused);
});


test('a delayed Pre-Run frame drops queued Hold and explicit Resume restores input without a free grant', async ({ page }) => {
  await installFrameClock(page); await openSalvage(page); await frame(page, 0);
  const initialId = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.keyboard.press('c'); await frame(page, 250);
  await expect(page.getByTestId('pause-message')).toContainText('delayed frame');
  await expect(page.getByTestId('hold-piece').locator('.pr-preview')).toHaveCount(0);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', initialId!);
  const paused = await page.getByTestId('active-piece').innerHTML();
  await page.getByTestId('resume-salvage').click();
  // The first frame establishes the reset Resume baseline without consuming elapsed time.
  await frame(page, 0);
  await expect(page.getByTestId('pause-message')).toContainText('resuming in 3');
  await frame(page, 2999);
  await expect(page.getByTestId('pause-message')).toContainText('resuming in 1');
  expect(await page.getByTestId('active-piece').innerHTML()).toBe(paused);
  await frame(page, 1);
  await expect(page.getByTestId('pause-message')).toBeHidden();
  expect(await page.getByTestId('active-piece').innerHTML()).toBe(paused);
  await expect(page.getByTestId('hold-piece').locator('.pr-preview')).toHaveCount(0);
  await page.keyboard.press('c'); await frame(page);
  await expect(page.getByTestId('hold-piece').locator('.pr-preview')).toHaveAttribute('data-piece-id', initialId!);
  await expect(page.getByTestId('salvage-quota')).toHaveText('8 / 8');
  await expect(page.getByTestId('collected-total')).toHaveText('0');
});
