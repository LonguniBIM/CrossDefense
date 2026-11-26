import { expect, test } from '@playwright/test';
import { inspectResultsSave } from '../resultsBrowserFixture';
import { setTicket12ServerState } from '../ticket12ServerControl';
import { expectChooser, waitOfflineReady, workerCacheProof, evictCachedPath, requestActualUpdate, waitForWaitingBuild, evictStagedCachePath } from '../ticket12UpdateFixture';
import { installPreRunTestClock } from '../preRunBrowserPlayer';
import { readFileSync } from 'node:fs';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
import { combatBuild, combatPack } from '../combatFixture';
import { openSavedBuild, seedBuildSave } from '../buildBrowserFixture';

const oldPackPath = '/content/packs/development-attempt-ship-v1/manifest.json';

test.beforeEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });
test.afterEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });

test('a failed required cache response never reports offline ready and Retry preserves the saved Pilot', async ({ page, context, request }, info) => {
  test.setTimeout(90_000);
  await setTicket12ServerState(request, { variant: 'a', failPaths: [oldPackPath] });
  const failedFetch = context.waitForEvent('response', { predicate: response => new URL(response.url()).pathname === oldPackPath && response.status() === 503, timeout: 45_000 });
  await page.goto('/'); await expectChooser(page);
  await failedFetch;
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { installing: !!registration?.installing, active: !!registration?.active, controlled: !!navigator.serviceWorker.controller };
  }), { timeout: 20_000 }).toEqual({ installing: false, active: false, controlled: false });
  await expect(page.getByTestId('offline-status')).not.toContainText('Ready offline');
  await page.getByLabel('Nickname').fill('Cache failure survivor');
  await page.getByTestId('create-pilot').click();
  await expect(page.getByTestId('pilot-card')).toHaveCount(1);
  const before = await inspectResultsSave(page);
  await info.attach('failed-preparation.json', { body: JSON.stringify({ player: before, status: await page.getByTestId('offline-status').innerText() }, null, 2), contentType: 'application/json' });
  await setTicket12ServerState(request, { variant: 'a', failPaths: [] });
  await page.getByTestId('offline-retry').click();
  const build = await waitOfflineReady(page);
  expect(await inspectResultsSave(page)).toEqual(before);
  await context.setOffline(true); await page.reload(); await expectChooser(page);
  await expect(page.getByTestId('pilot-card')).toContainText('Cache failure survivor');
  expect(await inspectResultsSave(page)).toEqual(before);
  expect((await workerCacheProof(page)).buildId).toBe(build);
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline');
});

const defaultPackPath = '/content/packs/development-review-ship-v1/manifest.json';

test('an invalid actual HTTP candidate preserves native Last Known Good and the pinned historical Run', async ({ page, request }, info) => {
  test.setTimeout(90_000);
  const pack = JSON.parse(readFileSync('public' + defaultPackPath, 'utf8')) as ContentPackManifest;
  const run = combatBuild(pack);
  // Targeted historical-storage fixture only; the separate played-loop test earns its own starter.
  await seedBuildSave(page, run, pack);
  await setTicket12ServerState(request, { variant: 'a', failPaths: [], corruptPackPaths: [defaultPackPath] });
  await page.goto('/'); await expectChooser(page);
  const before = await inspectResultsSave(page);
  const registry = await page.evaluate(() => JSON.parse(localStorage.getItem('crossdefense-content-pack-state')!));
  expect(before.tables.runs).toHaveLength(1);
  expect(before.tables.runs?.[0]).toMatchObject({ runId: run.runId, pilotId: run.pilotId, contentVersion: run.contentVersion, rulesetVersion: run.rulesetVersion, quota: run.quota, shipBuild: run.shipBuild, salvage: run.salvage });
  await page.getByLabel('Nickname').fill('Candidate uses Last Known Good');
  await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').filter({ hasText: 'Candidate uses Last Known Good' }).getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('content-candidate-warning')).toContainText('INTEGRITY_MISMATCH');
  await expect(page.getByTestId('start-content-version')).toHaveText(pack.contentVersion);
  await expect(page.getByTestId('start-quota')).toHaveText('8');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('crossdefense-content-pack-state')!))).toEqual(registry);
  const after = await inspectResultsSave(page);
  expect(after.tables.runs).toEqual(before.tables.runs);
  expect(registry.activeVersion).toBe(pack.contentVersion); expect(registry.lastKnownGoodVersion).toBe(pack.contentVersion);
  expect(registry.digests[pack.contentVersion]).toBe(pack.integrity.manifestSha256);
  await expect(page.getByTestId('offline-status')).not.toContainText('Ready offline');
  await info.attach('invalid-http-candidate.json', { body: JSON.stringify({ registry, runs: after.tables.runs, warning: await page.getByTestId('content-candidate-warning').innerText() }, null, 2), contentType: 'application/json' });
});

test('missing old pinned content stays Content Required offline and explicit Retry restores the same Run', async ({ page, context }) => {
  test.setTimeout(90_000);
  const pack = combatPack(), run = combatBuild(pack);
  await openSavedBuild(page, run, pack); await waitOfflineReady(page);
  const before = await inspectResultsSave(page);
  const path = '/content/packs/' + pack.contentVersion + '/manifest.json';
  expect(await evictCachedPath(page, path)).toBeGreaterThan(0);
  await page.evaluate(version => localStorage.removeItem('crossdefense-content-pack:' + version), pack.contentVersion);
  await context.setOffline(true); await page.reload(); await expectChooser(page);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Content Required', exact: true })).toBeVisible();
  await expect(page.getByTestId('run-id')).toHaveText(run.runId);
  await expect(page.getByTestId('missing-content-version')).toHaveText(pack.contentVersion);
  await page.getByTestId('retry-content').click();
  await expect(page.getByTestId('missing-content-version')).toHaveText(pack.contentVersion);
  const missing = await inspectResultsSave(page);
  expect(missing.tables.runs).toEqual(before.tables.runs);
  expect(missing.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  expect((await workerCacheProof(page)).ready).toBe(false);
  await expect(page.getByTestId('offline-status')).not.toContainText('Ready offline');
  await context.setOffline(false); await page.getByTestId('retry-content').click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-content-version')).toHaveText(pack.contentVersion);
  await expect(page.getByTestId('run-id')).toHaveText(run.runId);
  await page.getByTestId('offline-retry').click(); await waitOfflineReady(page);
  expect((await inspectResultsSave(page)).tables.runs).toEqual(before.tables.runs);
});

test('cache integrity loss revokes readiness and network repair preserves authoritative Player Data', async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto('/'); await expectChooser(page); await waitOfflineReady(page);
  await page.getByLabel('Nickname').fill('Integrity repair survivor'); await page.getByTestId('create-pilot').click();
  await expect(page.getByTestId('pilot-card')).toHaveCount(1);
  const before = await inspectResultsSave(page);
  const registry = await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'));
  const changed = await page.evaluate(async pathname => {
    let count = 0;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) if (new URL(request.url).pathname === pathname) {
        const response = await cache.match(request); if (!response) throw new Error('Cached response disappeared.');
        const candidate = await response.json(); candidate.integrity.manifestSha256 = '0'.repeat(64);
        await cache.put(request, new Response(JSON.stringify(candidate), { status: 200, headers: { 'Content-Type': 'application/json' } })); count += 1;
      }
    }
    return count;
  }, defaultPackPath);
  expect(changed).toBeGreaterThan(0);
  await context.setOffline(true);
  const damaged = await workerCacheProof(page); expect(damaged.ready).toBe(false); expect(damaged.missing).toContain(defaultPackPath);
  await expect(page.getByTestId('offline-status')).not.toContainText('Ready offline');
  expect(await inspectResultsSave(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'))).toBe(registry);
  await context.setOffline(false); await page.getByTestId('offline-retry').click(); await waitOfflineReady(page);
  expect(await inspectResultsSave(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'))).toBe(registry);
  await context.setOffline(true); await page.reload(); await expectChooser(page);
  await expect(page.getByTestId('pilot-card')).toContainText('Integrity repair survivor');
});

test('a failed candidate installation preserves the controlling offline App and saved Pilot', async ({ page, context, request }, info) => {
  test.setTimeout(90_000);
  await page.goto('/'); await expectChooser(page); const currentBuild = await waitOfflineReady(page);
  await page.getByLabel('Nickname').fill('Failed update survivor'); await page.getByTestId('create-pilot').click();
  await expect(page.getByTestId('pilot-card')).toHaveCount(1); const before = await inspectResultsSave(page);
  await setTicket12ServerState(request, { variant: 'b', failPaths: [oldPackPath] });
  const failedFetch = context.waitForEvent('response', { predicate: response => new URL(response.url()).pathname === oldPackPath && response.status() === 503, timeout: 45_000 });
  await requestActualUpdate(page); await failedFetch;
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { installing: !!registration?.installing, waiting: !!registration?.waiting, active: registration?.active?.state };
  }), { timeout: 20_000 }).toEqual({ installing: false, waiting: false, active: 'activated' });
  expect(await workerCacheProof(page)).toEqual({ buildId: currentBuild, ready: true, missing: [] });
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', currentBuild);
  expect(await inspectResultsSave(page)).toEqual(before);
  await context.setOffline(true); await page.reload(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('pilot-card')).toContainText('Failed update survivor');
  expect(await inspectResultsSave(page)).toEqual(before);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', currentBuild);
  await info.attach('failed-candidate-preserved.json', { body: JSON.stringify({ buildId: currentBuild, player: before }, null, 2), contentType: 'application/json' });
});

test('an update waits through real Combat and activates from Build with old Run pins intact offline', async ({ page, context, request }, info) => {
  test.setTimeout(120_000);
  const pack = JSON.parse(readFileSync('public/content/packs/development-rendered-combat-ship-v1/manifest.json', 'utf8')) as ContentPackManifest;
  const run = combatBuild(pack);
  await installPreRunTestClock(page); await openSavedBuild(page, run, pack); const currentBuild = await waitOfflineReady(page);
  await page.getByTestId('choose-map').click(); await page.getByTestId('start-attempt').click();
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state', 'ready');
  await page.evaluate(async () => {
    const step = (window as unknown as { __buildTestFrame: (ms: number) => Promise<void> }).__buildTestFrame;
    await step(0); for (let i = 0; i < 7; i++) await step(1000 / 60);
  });
  await expect(page.getByTestId('combat-tick')).toHaveText('7');
  const attemptId = await page.getByTestId('combat-attempt-id').innerText();
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  await expect(page.getByTestId('update-activate')).toBeDisabled();
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', currentBuild);
  await page.evaluate(async () => {
    const step = (window as unknown as { __buildTestFrame: (ms: number) => Promise<void> }).__buildTestFrame;
    for (let i = 0; i < 7; i++) await step(1000 / 60);
  });
  await expect(page.getByTestId('combat-tick')).toHaveText('14');
  await expect(page.getByTestId('combat-attempt-id')).toHaveText(attemptId);
  await page.getByTestId('abandon-combat').click(); await page.getByTestId('confirm-combat-abandon').click();
  await page.getByTestId('return-combat-build').click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('update-activate')).toBeEnabled();
  const before = await inspectResultsSave(page), cachesBefore = await page.evaluate(() => caches.keys());
  await page.getByTestId('update-activate').click(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild);
  expect(await inspectResultsSave(page)).toEqual(before);
  const cachesAfter = await page.evaluate(() => caches.keys()); for (const name of cachesBefore) expect(cachesAfter).toContain(name);
  await context.setOffline(true); await page.reload(); await expectChooser(page);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('build-content-version')).toHaveText(pack.contentVersion);
  await expect(page.getByTestId('run-id')).toHaveText(run.runId); await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('attempt-recovery')).toContainText('abandoned');
  const preserved = await inspectResultsSave(page); expect(preserved.tables.runs).toEqual(before.tables.runs); expect(preserved.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  await info.attach('safe-update-pins.json', { body: JSON.stringify({ currentBuild, candidateBuild, runId: run.runId, contentVersion: pack.contentVersion, manifestDigest: pack.integrity.manifestSha256, attemptId, player: preserved }, null, 2), contentType: 'application/json' });
});

test('a failed Build write blocks staged activation until the exact edit is acknowledged', async ({ page, request }) => {
  test.setTimeout(90_000);
  await openSavedBuild(page, combatBuild(), combatPack()); const currentBuild = await waitOfflineReady(page);
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  const before = await inspectResultsSave(page);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add; let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (!failed && this.transaction.db.name === 'crossdefense-player-data' && this.name === 'buildOperations') {
        failed = true; throw new DOMException('Ticket12 injected Build receipt failure', 'UnknownError');
      }
      return add.apply(this, args);
    };
  });
  await page.getByTestId('cell-A3').click(); await page.getByTestId('return-tile').click();
  await expect(page.getByTestId('retry-placement')).toBeVisible();
  await expect(page.getByTestId('build-status')).toContainText('Ticket12 injected Build');
  await expect(page.getByTestId('update-activate')).toBeDisabled();
  expect(await inspectResultsSave(page)).toEqual(before);
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  expect((await workerCacheProof(page, 'waiting')).buildId).toBe(candidateBuild);
  await page.getByTestId('retry-placement').click(); await expect(page.getByTestId('retry-placement')).toBeHidden();
  await expect(page.getByTestId('update-activate')).toBeEnabled();
  await expect(page.locator('[data-testid="cargo-tile"][data-tile-id="combat-run:starter:0"]')).toHaveCount(1);
  await expect(page.getByTestId('cell-A3')).toHaveAttribute('aria-label', 'A3, empty hull cell');
  await expect(page.getByTestId('build-collected-count')).toHaveText('8');
  const acknowledged = await inspectResultsSave(page);
  expect(acknowledged.tables.runs?.[0]).toMatchObject({ runId: 'combat-run', shipBuild: { revision: 5 } });
  expect(acknowledged.tables.buildOperations).toHaveLength(1);
  await page.getByTestId('update-activate').click(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild);
  expect(await inspectResultsSave(page)).toEqual(acknowledged);
});

test('a failed Workspace Settings write blocks update after the dialog closes until Retry succeeds', async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.goto('/'); await expectChooser(page); const currentBuild = await waitOfflineReady(page);
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  const before = await inspectResultsSave(page);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add; let failed = false;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (!failed && this.transaction.db.name === 'crossdefense-player-data' && this.name === 'settingsOperations') {
        failed = true; throw new DOMException('Ticket12 injected Settings receipt failure', 'UnknownError');
      }
      return add.apply(this, args);
    };
  });
  await page.getByTestId('open-settings').click(); await page.getByTestId('reduced-motion').check(); await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('retry-settings')).toBeVisible(); await expect(page.getByTestId('settings-error')).toContainText('Ticket12 injected Settings');
  await page.getByTestId('close-settings').click(); await expect(page.getByTestId('update-activate')).toBeDisabled();
  expect(await inspectResultsSave(page)).toEqual(before);
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  await page.getByTestId('open-settings').click(); await page.getByTestId('retry-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved'); await page.getByTestId('close-settings').click();
  await expect(page.getByTestId('update-activate')).toBeEnabled(); const acknowledged = await inspectResultsSave(page);
  expect(acknowledged.tables.settingsOperations).toHaveLength(1);
  await page.getByTestId('update-activate').click(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild);
  expect(await inspectResultsSave(page)).toEqual(acknowledged);
  await page.getByTestId('open-settings').click(); await expect(page.getByTestId('reduced-motion')).toBeChecked();
});

test('a second same-origin window prevents staged activation and closing it permits a safe reload', async ({ page, context, request }) => {
  test.setTimeout(90_000);
  await page.goto('/'); await expectChooser(page); const currentBuild = await waitOfflineReady(page);
  await page.getByLabel('Nickname').fill('Single writer update'); await page.getByTestId('create-pilot').click();
  const before = await inspectResultsSave(page);
  const other = await context.newPage(); await other.goto('/');
  await expect(other.getByTestId('ownership-blocked')).toBeVisible();
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  await page.bringToFront(); await page.getByTestId('update-activate').click();
  await expect(page.getByTestId('offline-status')).toContainText('Close other CrossDefense windows');
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  expect((await workerCacheProof(page, 'waiting')).buildId).toBe(candidateBuild);
  expect(await inspectResultsSave(page)).toEqual(before);
  await other.close(); await expect(page.getByTestId('update-activate')).toBeEnabled();
  await page.getByTestId('update-activate').click(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild);
  expect(await inspectResultsSave(page)).toEqual(before);
});

test('real CacheStorage quota exhaustion rejects the candidate without replacing current App or Player Data', async ({ page, context, request }, info) => {
  test.setTimeout(90_000);
  await page.goto('/'); await expectChooser(page); const currentBuild = await waitOfflineReady(page);
  await page.getByLabel('Nickname').fill('Quota survivor'); await page.getByTestId('create-pilot').click();
  await expect(page.getByTestId('pilot-card')).toHaveCount(1); const before = await inspectResultsSave(page);
  const session = await context.newCDPSession(page), origin = new URL(page.url()).origin;
  const workerErrors: string[] = [];
  session.on('ServiceWorker.workerErrorReported', event => { workerErrors.push(event.errorMessage.errorMessage); });
  await session.send('ServiceWorker.enable');
  const original = await session.send('Storage.getUsageAndQuota', { origin });
  const quotaSize = Math.ceil(original.usage) + 1024 * 1024;
  let limited: unknown;
  try {
    await session.send('Storage.overrideQuotaForOrigin', { origin, quotaSize });
    limited = await session.send('Storage.getUsageAndQuota', { origin });
    expect(limited).toMatchObject({ quota: quotaSize, overrideActive: true });
    await setTicket12ServerState(request, { variant: 'b', failPaths: [] });
    const state = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error('The active registration is missing.');
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => { registration.removeEventListener('updatefound', found); reject(new Error('Quota-limited installation did not reach a terminal install state.')); }, 45_000);
        const finish = (value: string) => { clearTimeout(timer); registration.removeEventListener('updatefound', found); resolve(value); };
        function found(): void {
          const candidate = registration!.installing;
          if (!candidate) return;
          const changed = () => {
            if (candidate.state === 'redundant' || candidate.state === 'installed') {
              candidate.removeEventListener('statechange', changed); finish(candidate.state);
            }
          };
          candidate.addEventListener('statechange', changed); changed();
        }
        registration.addEventListener('updatefound', found);
        void registration.update().catch(error => { clearTimeout(timer); registration.removeEventListener('updatefound', found); reject(error); });
      });
    });
    expect(state).toBe('redundant');
    await expect.poll(() => workerErrors.some(message => /quota/i.test(message)), { timeout: 10_000 }).toBe(true);
    expect(await workerCacheProof(page)).toEqual({ buildId: currentBuild, ready: true, missing: [] });
    expect(await inspectResultsSave(page)).toEqual(before);
    await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', currentBuild);
    await info.attach('native-cache-quota-failure.json', { body: JSON.stringify({ original, limited, workerErrors, currentBuild, player: before }, null, 2), contentType: 'application/json' });
  } finally {
    await session.send('Storage.overrideQuotaForOrigin', { origin });
    expect((await session.send('Storage.getUsageAndQuota', { origin })).overrideActive).toBe(false);
    await session.detach();
  }
  await context.setOffline(true); await page.reload(); await expectChooser(page); await waitOfflineReady(page);
  await expect(page.getByTestId('pilot-card')).toContainText('Quota survivor');
  expect(await inspectResultsSave(page)).toEqual(before);
});

test('R1 CS-SPEC-01 explicit Retry repairs the same waiting build after cache loss before safe activation', async ({ page, context, request }, info) => {
  test.setTimeout(90_000);
  const pack = combatPack(), run = combatBuild(pack);
  await openSavedBuild(page, run, pack); const currentBuild = await waitOfflineReady(page);
  const before = await inspectResultsSave(page), currentCaches = await page.evaluate(() => caches.keys());
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  const unchangedScript = await (await request.get('/sw.js')).body();
  const candidateHandle = await page.evaluateHandle(async () => {
    const candidate = (await navigator.serviceWorker.getRegistration())?.waiting;
    if (!candidate) throw new Error('The real staged worker is missing.');
    return candidate;
  });
  try {
    const loss = await evictStagedCachePath(page, currentCaches, oldPackPath);
    expect(loss.removed).toBe(1);
    expect(await workerCacheProof(page)).toEqual({ buildId: currentBuild, ready: true, missing: [] });
    const damaged = await workerCacheProof(page, 'waiting');
    expect(damaged.buildId).toBe(candidateBuild); expect(damaged.ready).toBe(false); expect(damaged.missing).toContain(oldPackPath);
    await page.getByTestId('update-activate').click();
    await expect(page.getByTestId('offline-status')).toContainText(/incomplete/i);
    await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', currentBuild);
    expect(await inspectResultsSave(page)).toEqual(before);
    expect(await candidateHandle.evaluate(async candidate => candidate === (await navigator.serviceWorker.getRegistration())?.waiting)).toBe(true);
    await info.attach('waiting-cache-refusal.json', { body: JSON.stringify({ currentBuild, candidateBuild, loss, damaged, message: await page.getByTestId('offline-status').innerText() }, null, 2), contentType: 'application/json' });

    // Recovery must be an explicit reachable UI action; an unchanged script cannot trigger a replacement install.
    await expect(page.getByTestId('offline-retry')).toBeVisible();
    await expect(page.getByTestId('offline-retry')).toBeEnabled();
    await page.getByTestId('offline-retry').click();
    await expect.poll(async () => (await workerCacheProof(page, 'waiting')).ready, { timeout: 30_000 }).toBe(true);
    expect(await candidateHandle.evaluate(async candidate => candidate === (await navigator.serviceWorker.getRegistration())?.waiting)).toBe(true);
    expect((await (await request.get('/sw.js')).body()).equals(unchangedScript)).toBe(true);
    expect(await workerCacheProof(page)).toEqual({ buildId: currentBuild, ready: true, missing: [] });
    expect(await workerCacheProof(page, 'waiting')).toEqual({ buildId: candidateBuild, ready: true, missing: [] });
    expect(await inspectResultsSave(page)).toEqual(before);
    await expect(page.getByTestId('update-activate')).toBeEnabled();
    await page.getByTestId('update-activate').click(); await expectChooser(page); await waitOfflineReady(page);
    await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild);
    expect(await inspectResultsSave(page)).toEqual(before);
    await context.setOffline(true); await page.reload(); await expectChooser(page); await waitOfflineReady(page);
    await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
    await expect(page.getByTestId('run-id')).toHaveText(run.runId);
    await expect(page.getByTestId('build-content-version')).toHaveText(pack.contentVersion);
    await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
    const preserved = await inspectResultsSave(page);
    expect(preserved.tables.runs).toEqual(before.tables.runs); expect(preserved.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  } finally { await candidateHandle.dispose(); }
});
