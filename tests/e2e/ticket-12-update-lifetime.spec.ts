import { expect, test, type Page, type TestInfo } from '@playwright/test';
import type { ActiveRun } from '../../src/domain/run/run';
import { openSavedBuild } from '../buildBrowserFixture';
import { combatBuild, combatPack } from '../combatFixture';
import { inspectResultsSave } from '../resultsBrowserFixture';
import { setTicket12ServerState } from '../ticket12ServerControl';
import { expectChooser, waitOfflineReady, workerCacheProof } from '../ticket12UpdateFixture';
import {
  clickLifetimeProtectedControl, installLifetimeGate, lifetimeGateState, readLifetimePage,
  releaseLifetimeGate, stageLifetimeCandidate, waitPastOriginalLifetimeTimeout,
} from '../ticket12WorkerLifetimeFixture';

test.beforeEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });
test.afterEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });

async function acknowledgeBuildHistory(page: Page) {
  // Targeted disposable historical Build fixture; this is not a claim of played starter/combat.
  await openSavedBuild(page, combatBuild(), combatPack());
  const currentBuild = await waitOfflineReady(page);
  expect(currentBuild).toBe('ticket12-a');
  const original = await inspectResultsSave(page);
  // Keep the Ballistic weapon equipped so an incorrectly admitted Attempt can actually start.
  await page.getByTestId('cell-B3').click();
  await page.getByTestId('return-tile').click();
  await expect(page.getByTestId('build-status')).toHaveText('Tile returned to Cargo.');
  await expect(page.getByTestId('undo-build')).toBeEnabled();
  const acknowledged = await inspectResultsSave(page);
  expect(acknowledged.tables.buildOperations).toHaveLength(1);
  return { currentBuild, original, acknowledged };
}

/** Check actual clipping as well as document bounds while native update states remain unchanged. */
async function expectBuildUpdateLayout(page: Page, info: TestInfo, state: string): Promise<void> {
  const originalViewport = page.viewportSize()!;
  const diagnostics = [];
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
      const panels = ['.bu-cargo', '.bu-center', '.bu-inspector', '.bu-equipped', '.bu-words'].map(selector => ({ selector, ...box(selector) }));
      const essential = ['[data-testid="ship-grid"]', '.bu-power', '[data-testid="build-collected-count"]',
        '[data-testid="cargo-capacity"]', '[data-testid="equipped-tiles"]', '.bu-words h2',
        '[data-testid="choose-map"]', '[data-testid="offline-status"]', '[data-testid="update-activate"]',
        '[data-testid="update-available"]', '[data-testid="offline-app-version"]'].map(selector => {
        const element = document.querySelector<HTMLElement>(selector)!;
        const bounds = element.getBoundingClientRect();
        let left = 0, top = 0, right = innerWidth, bottom = innerHeight;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent), parentBox = parent.getBoundingClientRect();
          if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) {
            left = Math.max(left, parentBox.left + parent.clientLeft); right = Math.min(right, parentBox.left + parent.clientLeft + parent.clientWidth);
          }
          if (['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowY)) {
            top = Math.max(top, parentBox.top + parent.clientTop); bottom = Math.min(bottom, parentBox.top + parent.clientTop + parent.clientHeight);
          }
        }
        return { selector, bounds: bounds.toJSON(), clip: { left, top, right, bottom },
          shown: getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden' };
      });
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
        panels, essential, cellFont: getComputedStyle(document.querySelector('.bu-cell b')!).fontSize };
    });
    diagnostics.push({ viewport, ...layout });
    const label = state + ' at ' + viewport.width + 'x' + viewport.height;
    expect.soft(layout.width, label + ': document width').toBeLessThanOrEqual(viewport.width);
    expect.soft(layout.height, label + ': document height').toBeLessThanOrEqual(viewport.height);
    for (const panel of layout.panels) {
      expect.soft(panel.left, label + ': ' + panel.selector + ' left').toBeGreaterThanOrEqual(0);
      expect.soft(panel.top, label + ': ' + panel.selector + ' top').toBeGreaterThanOrEqual(0);
      expect.soft(panel.right, label + ': ' + panel.selector + ' right').toBeLessThanOrEqual(viewport.width);
      expect.soft(panel.bottom, label + ': ' + panel.selector + ' bottom').toBeLessThanOrEqual(viewport.height);
    }
    for (const item of layout.essential) {
      expect.soft(item.shown, label + ': ' + item.selector + ' shown').toBe(true);
      expect.soft(item.bounds.left, label + ': ' + item.selector + ' clipped left').toBeGreaterThanOrEqual(item.clip.left - 1);
      expect.soft(item.bounds.top, label + ': ' + item.selector + ' clipped top').toBeGreaterThanOrEqual(item.clip.top - 1);
      expect.soft(item.bounds.right, label + ': ' + item.selector + ' clipped right').toBeLessThanOrEqual(item.clip.right + 1);
      expect.soft(item.bounds.bottom, label + ': ' + item.selector + ' clipped bottom').toBeLessThanOrEqual(item.clip.bottom + 1);
    }
    expect.soft(Number.parseFloat(layout.cellFont), label + ': readable existing grid lettering').toBeGreaterThanOrEqual(23);
    await page.screenshot({ path: info.outputPath('build-' + state + '-' + viewport.width + 'x' + viewport.height + '.png'), fullPage: true });
  }
  await info.attach('build-' + state + '-geometry.json', { body: JSON.stringify(diagnostics, null, 2), contentType: 'application/json' });
  await page.setViewportSize(originalViewport);
}

for (const scenario of [
  { mode: 'before-skip-waiting', title: 'before native skipWaiting' },
  { mode: 'during-activation', title: 'during native activation' },
] as const) {
  test('Build admission stays held beyond 15 seconds ' + scenario.title + ' until the safe reload completes', async ({ page, context, request }, info) => {
    test.setTimeout(120_000);
    const { currentBuild, acknowledged } = await acknowledgeBuildHistory(page);
    const { worker, candidateBuild } = await stageLifetimeCandidate(page, context, request, currentBuild);
    expect(candidateBuild).toBe('ticket12-b');
    await expectBuildUpdateLayout(page, info, 'staged-' + scenario.mode);
    await installLifetimeGate(worker, scenario.mode);
    const before = await readLifetimePage(page);
    try {
      await page.getByTestId('update-activate').click();
      await expect.poll(async () => (await readLifetimePage(page)).inert).toBe(true);
      await waitPastOriginalLifetimeTimeout(page, worker);
      const gate = await lifetimeGateState(worker), held = await readLifetimePage(page);
      await info.attach('lifetime-held-' + scenario.mode + '.json', {
        body: JSON.stringify({ currentBuild, candidateBuild, gate, before, held, acknowledged }, null, 2), contentType: 'application/json',
      });
      await page.screenshot({ path: info.outputPath('lifetime-held-' + scenario.mode + '.png'), fullPage: true });
      await expectBuildUpdateLayout(page, info, 'held-' + scenario.mode);
      expect.soft(gate.released).toBe(false);
      expect.soft(held.timeOrigin, 'No navigation may occur while native activation is gated').toBe(before.timeOrigin);
      expect.soft(held.inert, 'The entire UI must remain inert while activation is indeterminate beyond the old timeout').toBe(true);
      expect.soft(held.heading).toBe('Build Phase');
      expect.soft(held.appBuild).toBe(currentBuild);
      if (scenario.mode === 'before-skip-waiting') {
        expect.soft(gate.nativeCalls).toBe(0);
        expect.soft(held.waiting).toBe('installed');
        expect.soft(held.active).toBe('activated');
      } else {
        expect.soft(held.waiting).toBe(null);
        expect.soft(held.active).toBe('activating');
      }
      expect.soft(await inspectResultsSave(page)).toEqual(acknowledged);

      // Use real pointer input. An inert root must reject both a Build write and navigation toward an Attempt.
      await clickLifetimeProtectedControl(page, 'undo-build');
      const afterUndo = await inspectResultsSave(page);
      expect.soft(afterUndo, 'A native Undo input must not write while the update owns Build admission').toEqual(acknowledged);
      await clickLifetimeProtectedControl(page, 'choose-map');
      await expect.soft(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible({ timeout: 1_000 });
      // A bad admission leaves Build synchronously, then opens Map asynchronously from native storage.
      // The bounded failed Build assertion above lets that real navigation finish before the Start probe.
      const start = page.getByTestId('start-attempt');
      if (await start.isVisible()) await start.click();
      const afterInputs = await inspectResultsSave(page);
      expect.soft(afterInputs, 'Map/Start input must not create an Attempt while activation is indeterminate').toEqual(acknowledged);
      await info.attach('lifetime-inputs-' + scenario.mode + '.json', {
        body: JSON.stringify({ page: await readLifetimePage(page), afterUndo, afterInputs }, null, 2), contentType: 'application/json',
      });

      await releaseLifetimeGate(worker);
      // Locators survive the expected navigation; do not evaluate a document that the safe reload is destroying.
      await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild, { timeout: 10_000 });
      await expectChooser(page); await waitOfflineReady(page);
      const reloaded = await readLifetimePage(page);
      expect({ waiting: reloaded.waiting, active: reloaded.active }).toEqual({ waiting: null, active: 'activated' });
      await info.attach('lifetime-released-' + scenario.mode + '.json', {
        body: JSON.stringify({ gate: await lifetimeGateState(worker), page: reloaded }, null, 2), contentType: 'application/json',
      });
      expect(reloaded.timeOrigin).not.toBe(before.timeOrigin);
      expect(await inspectResultsSave(page)).toEqual(acknowledged);
      expect((await workerCacheProof(page)).buildId).toBe(candidateBuild);
      await page.screenshot({ path: info.outputPath('lifetime-reloaded-' + scenario.mode + '.png'), fullPage: true });
    } finally {
      await releaseLifetimeGate(worker).catch(() => undefined);
    }
  });
}

test('a genuine delayed worker refusal restores the same acknowledged Build and Undo history', async ({ page, context, request }, info) => {
  test.setTimeout(120_000);
  const { currentBuild, original, acknowledged } = await acknowledgeBuildHistory(page);
  const { worker, candidateBuild } = await stageLifetimeCandidate(page, context, request, currentBuild);
  expect(candidateBuild).toBe('ticket12-b');
  const other = await context.newPage(); await other.goto('/');
  await expect(other.getByTestId('ownership-blocked')).toBeVisible();
  await page.bringToFront();
  await installLifetimeGate(worker, 'before-window-check');
  const before = await readLifetimePage(page);
  try {
    await page.getByTestId('update-activate').click();
    await expect.poll(async () => (await readLifetimePage(page)).inert).toBe(true);
    await waitPastOriginalLifetimeTimeout(page, worker);
    const gate = await lifetimeGateState(worker), held = await readLifetimePage(page);
    await info.attach('lifetime-refusal-pending.json', {
      body: JSON.stringify({ currentBuild, candidateBuild, gate, before, held, acknowledged }, null, 2), contentType: 'application/json',
    });
    expect.soft(held.inert, 'An unread acknowledgment cannot release Build before the worker really refuses').toBe(true);
    expect.soft(held.timeOrigin).toBe(before.timeOrigin);
    expect.soft(held.waiting).toBe('installed');
    expect.soft(gate.nativeCalls).toBe(0);
    expect(await inspectResultsSave(page)).toEqual(acknowledged);

    // The actual native window list has two clients; no refusal message or result is fabricated.
    await releaseLifetimeGate(worker);
    await expect.soft(page.getByTestId('offline-status')).toContainText('Close other CrossDefense windows', { timeout: 10_000 });
    await expect.poll(async () => (await readLifetimePage(page)).inert).toBe(false);
    const refused = await readLifetimePage(page);
    expect(refused.timeOrigin).toBe(before.timeOrigin);
    expect(refused.appBuild).toBe(currentBuild);
    await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
    expect(await inspectResultsSave(page)).toEqual(acknowledged);
    expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
    expect((await workerCacheProof(page, 'waiting')).buildId).toBe(candidateBuild);
    await expect(page.getByTestId('undo-build')).toBeEnabled();
    await page.getByTestId('undo-build').click();
    await expect(page.getByTestId('build-status')).toHaveText('Undo saved.');
    const undone = await inspectResultsSave(page);
    expect((undone.tables.runs![0] as ActiveRun).shipBuild?.placements).toEqual((original.tables.runs![0] as ActiveRun).shipBuild?.placements);
    expect(undone.tables.buildOperations).toHaveLength(2);
    await expect(page.getByTestId('redo-build')).toBeEnabled();
    await info.attach('lifetime-refusal-restored-history.json', {
      body: JSON.stringify({ gate: await lifetimeGateState(worker), refused, acknowledged, undone }, null, 2), contentType: 'application/json',
    });
    await page.screenshot({ path: info.outputPath('lifetime-refusal-restored-build.png'), fullPage: true });
    await expectBuildUpdateLayout(page, info, 'refusal-restored');
  } finally {
    await releaseLifetimeGate(worker).catch(() => undefined);
    await other.close();
  }
});
