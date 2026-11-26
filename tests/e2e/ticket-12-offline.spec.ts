import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { expectChooser, waitOfflineReady, workerCacheProof } from '../ticket12UpdateFixture';
import type { ActiveRun } from '../../src/domain/run/run';
import type { CombatOutcome } from '../../src/domain/combat/collection';
import { installPreRunTestClock } from '../preRunBrowserPlayer';
import { continueSavedBuild } from '../buildBrowserFixture';
import { inspectResultsSave } from '../resultsBrowserFixture';
import { setTicket12ServerState } from '../ticket12ServerControl';
import { earnTicket12Build, startTicket12Combat, ticket12Frames, ticket12KeyboardBatch, proveTicket12Parity, type Ticket12InputBatch } from '../ticket12BrowserScenario';

test.beforeEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });

test('production service worker prepares the full slice and reloads offline', async ({ page, context }, info) => {
  const exceptions: string[] = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await expect.poll(async () => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { active: registration?.active?.state === 'activated', controlled: !!navigator.serviceWorker.controller };
  }), { timeout: 20_000, message: 'The production build must install and control this isolated page with a real service worker.' })
    .toEqual({ active: true, controlled: true });
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline', { timeout: 30_000 });
  const absentPaths = await page.evaluate(async () => Promise.all(
    ['/ticket12-definitely-missing', '/src/main.ts', '/.env', '/.git/config'].map(async path => {
      const response = await fetch(path);
      return { path, status: response.status, type: response.headers.get('content-type') };
    }),
  ));
  expect(absentPaths.map(response => response.status)).toEqual([404, 404, 404, 404]);
  await info.attach('controlled-worker-404s.json', { contentType: 'application/json', body: JSON.stringify(absentPaths, null, 2) });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline');
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  expect(exceptions).toEqual([]);
  await page.screenshot({ path: info.outputPath('offline-pilot-chooser.png'), fullPage: true });
});

test('offline earned starter completes Scout Boss Salvage and Review with headless parity and durable reload', async ({ page, context }, info) => {
  test.setTimeout(240_000);
  const exceptions: string[] = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await installPreRunTestClock(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline', { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline');
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await earnTicket12Build(page, 'Offline full slice');
  const initial = await startTicket12Combat(page);
  await info.attach('offline-startup.json', { contentType: 'application/json', body: JSON.stringify({
    appVersion: initial.attempt!.appVersion, contentVersion: initial.contentVersion, rulesetVersion: initial.rulesetVersion,
    contentDigest: initial.attempt!.startup.contentDigest, attemptId: initial.attempt!.attemptId, seed: initial.attempt!.seed,
    buildRevision: initial.attempt!.startup.buildRevision, placements: initial.attempt!.startup.placements,
  }, null, 2) });
  await ticket12Frames(page, 7);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await ticket12Frames(page, 1, 0);
    await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector('[data-testid="combat-scene"]')!.getBoundingClientRect().bottom -
      document.querySelector('[data-testid="combat-board"]')!.getBoundingClientRect().bottom))).toBeLessThan(1);
    const dimensions = await page.evaluate(() => {
      const rect = (selector: string) => {
        const value = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
        return { top: value.top, bottom: value.bottom, left: value.left, right: value.right, width: value.width, height: value.height };
      };
      const footer = document.querySelector<HTMLElement>('.cb-render-footer')!;
      const footerNodes = [...footer.querySelectorAll<HTMLElement>('p,button')].filter(node => !node.hidden && node.getClientRects().length > 0);
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
        game: rect('.cb-game'), hud: rect('.cb-hud'), footer: rect('.cb-render-footer'),
        camera: rect('[data-testid="combat-scene"]'), board: rect('[data-testid="combat-board"]'), harvest: rect('[data-testid="combat-harvest"]'),
        receiptHeight: document.querySelector<HTMLElement>('[data-testid="combat-receipt"]')!.clientHeight,
        footerNodes: footerNodes.map(node => ({ id: node.dataset.testid ?? node.className, top: node.getBoundingClientRect().top,
          bottom: node.getBoundingClientRect().bottom, height: node.getBoundingClientRect().height })),
        harvestItems: [...document.querySelectorAll<HTMLElement>('[data-testid="combat-harvest"] [data-subtype]')].map(node => {
          const value = node.getBoundingClientRect();
          return { subtype: node.dataset.subtype, top: value.top, bottom: value.bottom, left: value.left, right: value.right, width: value.width, height: value.height };
        }),
      };
    });
    await info.attach('offline-layout-' + viewport.width + '.json', { contentType: 'application/json', body: JSON.stringify(dimensions, null, 2) });
    await page.screenshot({ path: info.outputPath('offline-combat-' + viewport.width + '.png'), fullPage: true });
    expect.soft(dimensions.width).toBeLessThanOrEqual(viewport.width);
    expect.soft(dimensions.height).toBeLessThanOrEqual(viewport.height);
    expect.soft(dimensions.harvestItems).toHaveLength(9);
    expect.soft(new Set(dimensions.harvestItems.map(item => item.subtype)).size).toBe(9);
    expect.soft(dimensions.harvest.bottom, 'The complete harvest must fit inside its clipping panel at ' + viewport.width).toBeLessThanOrEqual(dimensions.game.bottom + 1);
    expect.soft(dimensions.harvest.bottom).toBeLessThanOrEqual(viewport.height);
    expect.soft(dimensions.harvestItems.every(item => item.height > 0 && item.width > 0 && item.top >= dimensions.game.top - 1 &&
      item.bottom <= Math.min(dimensions.harvest.bottom, dimensions.game.bottom, viewport.height) + 1 &&
      item.left >= dimensions.game.left - 1 && item.right <= dimensions.game.right + 1),
      'All nine harvest subtype entries must remain visible at ' + viewport.width).toBe(true);
    expect.soft(dimensions.receiptHeight, 'Acknowledgment must never collapse').toBeGreaterThanOrEqual(14);
    expect.soft(dimensions.footer.bottom, 'Combat footer must fit inside its HUD panel at ' + viewport.width).toBeLessThanOrEqual(dimensions.hud.bottom + 1);
    expect.soft(dimensions.footerNodes.every(node => node.height > 0 && node.top >= dimensions.footer.top - 1 &&
      node.bottom <= Math.min(dimensions.footer.bottom, dimensions.hud.bottom, viewport.height) + 1),
      'Visible Combat footer text and actions must fit without clipping at ' + viewport.width).toBe(true);
    expect.soft(Math.abs(dimensions.camera.bottom - dimensions.board.bottom)).toBeLessThan(1);
  }
  expect(info.errors, 'All minimum/reference geometry checks must pass before gameplay proceeds').toHaveLength(0);
  await page.setViewportSize({ width: 1366, height: 768 });
  const batches: Ticket12InputBatch[] = [];
  let bossSeen = false;
  try {
    for (let piece = 0; piece < 220 && !await page.getByTestId('return-combat-build').isVisible(); piece++) {
      batches.push(await ticket12KeyboardBatch(page));
      await ticket12Frames(page, 60, 50);
      bossSeen ||= await page.getByTestId('combat-enemy-name').innerText() === 'Boss';
    }
  } finally {
    await info.attach('offline-ordered-inputs.json', { contentType: 'application/json', body: JSON.stringify(batches) });
  }
  expect(bossSeen).toBe(true);
  await expect(page.getByTestId('combat-status')).toHaveText('Outcome saved: victory');
  const collected = Number(await page.getByTestId('combat-collected').innerText());
  expect(collected).toBeGreaterThan(0);
  await proveTicket12Parity(page, initial, batches, info);

  await page.getByTestId('combat-results').click();
  await expect(page.getByTestId('result-total')).toHaveText('24 Credits / 1 Celestium');
  await expect(page.getByTestId('result-loot-count')).toHaveText(String(collected));
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('results-credits')).toHaveText('24');
  await expect(page.getByTestId('settle-result')).toBeDisabled();
  await page.getByTestId('results-salvage').click();
  await expect(page.getByTestId('salvage-choice')).toHaveCount(collected);
  for (const [index, select] of (await page.getByTestId('salvage-choice').all()).entries()) await select.selectOption(index < 16 ? 'keep' : 'discard');
  await page.getByTestId('review-salvage').click();
  await expect(page.getByTestId('salvage-confirmation')).toBeVisible();
  await page.getByTestId('confirm-salvage').click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-collected-count')).toHaveText(String(8 + Math.min(16, collected)));
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  await page.getByTestId('build-review').click();
  await expect(page.getByTestId('review-prompt')).toContainText('A large boat');
  await page.getByTestId('review-answer').fill('  sHiP  ');
  await page.getByTestId('review-answer').press('Enter');
  await expect(page.getByTestId('review-completed')).toBeVisible();
  await expect(page.getByTestId('review-credits')).toHaveText('26');
  await expect(page.getByTestId('review-celestium')).toHaveText('1');
  await page.screenshot({ path: info.outputPath('offline-review-completed.png'), fullPage: true });
  await page.getByTestId('review-leave').click();
  await expect(page.getByTestId('build-balances')).toHaveText('Credits 26 | Celestium 1');
  const beforeReload = await inspectResultsSave(page);
  expect(beforeReload.tables.outcomeSettlements).toHaveLength(1);
  expect(beforeReload.tables.reviewRewards).toHaveLength(1);
  expect(beforeReload.tables.cargoOperations).toHaveLength(1);
  await page.reload();
  await continueSavedBuild(page);
  const afterReload = await inspectResultsSave(page);
  expect(afterReload.tables.outcomeSettlements).toEqual(beforeReload.tables.outcomeSettlements);
  expect(afterReload.tables.reviewRewards).toEqual(beforeReload.tables.reviewRewards);
  expect(afterReload.tables.pilotEconomies).toEqual(beforeReload.tables.pilotEconomies);
  expect(afterReload.tables.runs).toEqual(beforeReload.tables.runs);
  await expect(page.getByTestId('build-balances')).toHaveText('Credits 26 | Celestium 1');
  await expect(page.getByTestId('build-review')).toBeDisabled();
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline');
  expect(exceptions).toEqual([]);
  await page.screenshot({ path: info.outputPath('offline-saved-build.png'), fullPage: true });
});

test('offline interruption retains actual committed loot and recovers once without victory or automatic Review', async ({ page, context }, info) => {
  test.setTimeout(180_000);
  const exceptions: string[] = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await installPreRunTestClock(page);
  await page.goto('/');
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline', { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await earnTicket12Build(page, 'Offline interrupted slice');
  const initial = await startTicket12Combat(page);
  for (let piece = 0; piece < 60 && Number(await page.getByTestId('combat-collected').innerText()) === 0; piece++) {
    await ticket12KeyboardBatch(page);
    await ticket12Frames(page, 2);
  }
  const count = Number(await page.getByTestId('combat-collected').innerText());
  expect(count).toBeGreaterThan(0);
  const before = await inspectResultsSave(page), committed = before.tables.runs![0] as ActiveRun;
  expect(committed.phase).toBe('attempt');
  expect(committed.attempt!.status).toBe('running');
  expect(committed.salvageBuffer).toHaveLength(count);
  expect(committed.attempt!.combatProgress!.lastCommittedTick).toBeGreaterThan(0);
  await page.reload();
  await continueSavedBuild(page);
  await expect(page.getByTestId('attempt-recovery')).toContainText('interrupted');
  await expect(page.getByTestId('combat-canvas')).toHaveCount(0);
  await expect(page.getByTestId('build-review')).toBeDisabled();
  const recovered = await inspectResultsSave(page), run = recovered.tables.runs![0] as ActiveRun;
  expect(run.runId).toBe(initial.runId);
  expect(run.pilotId).toBe(initial.pilotId);
  expect(run.phase).toBe('build');
  expect(run.attempt!.status).toBe('interrupted');
  expect(run.attempt!.combatProgress).toEqual(committed.attempt!.combatProgress);
  expect(run.salvageBuffer).toEqual(committed.salvageBuffer);
  expect(run.shipBuild).toEqual(committed.shipBuild);
  expect(run.quota).toEqual(committed.quota);
  expect(recovered.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  expect(recovered.tables.outcomeSettlements).toEqual([]);
  expect(recovered.tables.reviewOccurrences).toEqual([]);
  expect(recovered.tables.reviewRewards).toEqual([]);
  expect(recovered.tables.combatOutcomes).toHaveLength(1);
  const outcome = recovered.tables.combatOutcomes![0] as CombatOutcome;
  expect(outcome.terminal.kind).toBe('interrupted');
  expect(outcome.tick).toBeNull();
  expect(outcome.collectedIds).toEqual(committed.attempt!.combatProgress!.collectedIds);
  await page.getByTestId('choose-map').click();
  await expect(page.getByTestId('launch-blockers')).toContainText('Resolve all Salvage');
  await expect(page.getByTestId('start-attempt')).toBeDisabled();
  await page.getByTestId('back-to-build').click();
  await page.getByTestId('build-results').click();
  await expect(page.getByTestId('result-title')).toHaveText('Interrupted');
  await expect(page.getByTestId('result-total')).toHaveText('0 Credits / 0 Celestium');
  await expect(page.getByTestId('results-review')).toBeHidden();
  await page.getByTestId('results-back').click();
  await page.reload();
  await continueSavedBuild(page);
  const repeated = await inspectResultsSave(page);
  expect(repeated.tables.runs).toEqual(recovered.tables.runs);
  expect(repeated.tables.combatOutcomes).toEqual(recovered.tables.combatOutcomes);
  expect(repeated.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  expect(repeated.tables.reviewOccurrences).toEqual([]);
  expect(repeated.tables.reviewRewards).toEqual([]);
  expect(exceptions).toEqual([]);
  await info.attach('offline-interruption-diagnostic.json', { contentType: 'application/json', body: JSON.stringify({
    appVersion: initial.attempt!.appVersion, contentVersion: initial.contentVersion, rulesetVersion: initial.rulesetVersion,
    seed: initial.attempt!.seed, attemptId: initial.attempt!.attemptId, committedTick: outcome.lastCommittedTick,
    committedPayloadIds: outcome.collectedIds, recovery: outcome.terminal, repeatedRecoveryOutcomeCount: repeated.tables.combatOutcomes!.length,
    economyUnchanged: true, reviewOccurrenceCount: repeated.tables.reviewOccurrences!.length,
  }, null, 2) });
  await page.screenshot({ path: info.outputPath('offline-interrupted-build.png'), fullPage: true });
});

test('canonical index redirect Retry repairs only the missing document and preserves the same worker and Pilot', async ({ page, context, request }, info) => {
  test.setTimeout(120_000);
  const exceptions: string[] = [];
  page.on('pageerror', error => exceptions.push(error.message));
  const direct = await request.get('/index.html?ticket12-index-repair=1', { maxRedirects: 0 });
  expect(direct.status()).toBe(307);
  expect(direct.headers().location).toBe('/?ticket12-index-repair=1');
  await direct.body();
  const terminalPath = '/__ticket12_terminal_index';
  for (const path of [terminalPath, '/ticket12-index-unknown', '/src/main.ts']) {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  }
  await page.goto('/'); await expectChooser(page);
  expect(new URL(page.url()).hostname).toBe('127.0.0.1');
  const buildId = await waitOfflineReady(page);
  const nickname = 'Canonical index recovery Pilot';
  await page.getByLabel('Nickname').fill(nickname); await page.getByTestId('create-pilot').click();
  const pilot = page.getByTestId('pilot-card').filter({ hasText: nickname });
  await expect(pilot).toHaveCount(1);
  const beforePlayer = await inspectResultsSave(page);
  const snapshot = () => page.evaluate(async buildId => {
    const names = (await caches.keys()).filter(name => name.endsWith('-' + buildId));
    if (names.length !== 1) throw new Error('Expected one isolated current-build cache.');
    const cacheName = names[0]!, cache = await caches.open(cacheName);
    const entries = await Promise.all((await cache.keys()).map(async key => {
      const response = await cache.match(key);
      if (!response) throw new Error('A listed cache response disappeared.');
      const body = await response.arrayBuffer();
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', body));
      return { key: key.url, pathname: new URL(key.url).pathname, status: response.status,
        integrity: response.headers.get('X-CrossDefense-Integrity'),
        bodyIntegrity: 'sha256-' + btoa(String.fromCharCode(...digest)), bytes: body.byteLength };
    }));
    return { cacheName, entries: entries.sort((a, b) => a.key.localeCompare(b.key)) };
  }, buildId);
  const beforeCache = await snapshot();
  expect(beforeCache.entries).toHaveLength(9);
  const index = beforeCache.entries.find(entry => entry.pathname === '/index.html')!;
  expect(index).toBeDefined(); expect(index.integrity).toMatch(/^sha256-[A-Za-z0-9+/]{43}=$/);
  for (const entry of beforeCache.entries) {
    expect(entry.status).toBe(200); expect(entry.bodyIntegrity).toBe(entry.integrity);
  }
  const otherEntries = beforeCache.entries.filter(entry => entry.key !== index.key);
  expect(otherEntries).toHaveLength(8);
  const controller = await page.evaluateHandle(() => navigator.serviceWorker.controller);
  try {
    const removed = await page.evaluate(async ({ cacheName, key }) => {
      if (location.hostname !== '127.0.0.1' || new URL(key).origin !== location.origin
        || new URL(key).pathname !== '/index.html') throw new Error('Cache loss is confined to this loopback index key.');
      return (await caches.open(cacheName)).delete(key);
    }, { cacheName: beforeCache.cacheName, key: index.key });
    expect(removed).toBe(true);
    expect((await snapshot()).entries).toEqual(otherEntries);
    expect(await workerCacheProof(page)).toEqual({ buildId, ready: false, missing: ['/index.html'] });

    // A real terminal redirect must be refused even though its target has the correct document bytes.
    await setTicket12ServerState(request, { variant: 'a', failPaths: [], redirectRoot: true });
    const rootRedirect = await request.get('/', { maxRedirects: 0 });
    expect(rootRedirect.status()).toBe(302); expect(rootRedirect.headers().location).toBe(terminalPath);
    const terminal = await request.get(terminalPath, { maxRedirects: 0 });
    expect(terminal.status()).toBe(200);
    const terminalIntegrity = 'sha256-' + createHash('sha256').update(await terminal.body()).digest('base64');
    expect(terminalIntegrity).toBe(index.integrity);
    await page.getByTestId('offline-retry').click();
    await expect(page.getByTestId('offline-retry')).toBeEnabled({ timeout: 30_000 });
    const refused = { proof: await workerCacheProof(page), cache: await snapshot(), player: await inspectResultsSave(page) };
    await info.attach('canonical-index-redirect-refused.json', { contentType: 'application/json', body: JSON.stringify({
      buildId, directStatus: direct.status(), canonicalLocation: direct.headers().location,
      rootStatus: rootRedirect.status(), terminalStatus: terminal.status(), terminalIntegrity, originalIndex: index, ...refused,
    }, null, 2) });
    expect(refused.proof).toEqual({ buildId, ready: false, missing: ['/index.html'] });
    expect(refused.cache.entries).toEqual(otherEntries);
    expect(refused.player).toEqual(beforePlayer);
    expect(await controller.evaluate(original => original === navigator.serviceWorker.controller)).toBe(true);
    await expect(page.getByTestId('offline-status')).not.toContainText('Ready offline');

    await setTicket12ServerState(request, { variant: 'a', failPaths: [] });
    expect((await request.get(terminalPath, { maxRedirects: 0 })).status()).toBe(404);
    await page.getByTestId('offline-retry').click();
    await expect(page.getByTestId('offline-retry')).toBeEnabled({ timeout: 30_000 });
    const repaired = { proof: await workerCacheProof(page), cache: await snapshot(), player: await inspectResultsSave(page),
      sameController: await controller.evaluate(original => original === navigator.serviceWorker.controller),
      status: await page.getByTestId('offline-status').innerText() };
    await info.attach('canonical-index-repair-result.json', { contentType: 'application/json', body: JSON.stringify({
      buildId, originalIndex: index, beforePlayer, otherEntries, ...repaired,
    }, null, 2) });
    expect(repaired.sameController).toBe(true);
    await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', buildId);
    expect(repaired.player).toEqual(beforePlayer);
    expect(repaired.cache.entries.filter(entry => entry.key !== index.key)).toEqual(otherEntries);
    expect(exceptions).toEqual([]);
    expect(repaired.proof, 'Public Retry must repair the original index key through the canonical root without following further redirects.')
      .toEqual({ buildId, ready: true, missing: [] });
    expect(repaired.cache.entries.find(entry => entry.key === index.key)).toEqual(index);
    expect(repaired.cache.entries).toHaveLength(9);
    await waitOfflineReady(page);
    await context.setOffline(true); await page.reload(); await expectChooser(page);
    expect(await waitOfflineReady(page)).toBe(buildId);
    await expect(pilot).toHaveCount(1);
    expect(await inspectResultsSave(page)).toEqual(beforePlayer);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    expect(exceptions).toEqual([]);
    await page.screenshot({ path: info.outputPath('canonical-index-offline-pilot.png'), fullPage: true });
  } finally {
    await controller.dispose();
    await setTicket12ServerState(request, { variant: 'a', failPaths: [] });
  }
});
