import { expect, type Page } from '@playwright/test';

export interface WorkerCacheProof { buildId: string; ready: boolean; missing: string[]; }

/** Observe the real service worker through its bounded production message protocol. */
export async function workerCacheProof(page: Page, target: 'controller' | 'waiting' = 'controller'): Promise<WorkerCacheProof> {
  return page.evaluate(async target => {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = target === 'waiting' ? registration?.waiting : navigator.serviceWorker.controller;
    if (!worker) throw new Error('The expected real ' + target + ' service worker is missing.');
    return new Promise<{ buildId: string; ready: boolean; missing: string[] }>((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Worker cache verification timed out.')); }, 15_000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout); channel.port1.close();
        const value = event.data as { buildId?: unknown; ready?: unknown; missing?: unknown };
        if (typeof value.buildId !== 'string' || typeof value.ready !== 'boolean' || !Array.isArray(value.missing)) {
          reject(new Error('Worker returned an invalid cache proof.')); return;
        }
        resolve(value as { buildId: string; ready: boolean; missing: string[] });
      };
      worker.postMessage({ type: 'CHECK_CACHE', buildId: document.querySelector<HTMLElement>('[data-testid="offline-app-version"]')?.dataset.appBuild }, [channel.port2]);
    });
  }, target);
}

export async function waitOfflineReady(page: Page): Promise<string> {
  await expect(page.getByTestId('offline-status')).toContainText('Ready offline', { timeout: 45_000 });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 20_000 }).toBe(true);
  const proof = await workerCacheProof(page);
  expect(proof.ready).toBe(true); expect(proof.missing).toEqual([]);
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', proof.buildId);
  return proof.buildId;
}

export async function expectChooser(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: /^(Pilot chooser|Workspace is active in another tab)$/ })).toBeVisible();
  if (await page.getByTestId('retry-ownership').isVisible()) await page.getByTestId('retry-ownership').click();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
}

export async function requestActualUpdate(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('An actual registration is required before staging an update.');
    await registration.update();
  });
}

export async function waitForWaitingBuild(page: Page, oldBuild: string): Promise<string> {
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state ?? null), { timeout: 45_000 }).toBe('installed');
  const candidate = await workerCacheProof(page, 'waiting');
  expect(candidate.ready).toBe(true); expect(candidate.missing).toEqual([]); expect(candidate.buildId).not.toBe(oldBuild);
  await expect(page.getByTestId('update-available')).toBeVisible();
  return candidate.buildId;
}

/** Evict only one replaceable response path in this test's isolated browser context. */
export async function evictCachedPath(page: Page, pathname: string): Promise<number> {
  return page.evaluate(async pathname => {
    let removed = 0;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (new URL(request.url).pathname === pathname && await cache.delete(request)) removed += 1;
      }
    }
    return removed;
  }, pathname);
}

/** Target only the newly staged worker's native cache; the controlling App's cache stays intact. */
export async function evictStagedCachePath(page: Page, existingCaches: string[], pathname: string): Promise<{ cacheName: string; removed: number }> {
  return page.evaluate(async ({ existingCaches, pathname }) => {
    const added = (await caches.keys()).filter(name => !existingCaches.includes(name));
    if (added.length !== 1) throw new Error('Expected exactly one newly staged App cache, found ' + added.length + '.');
    const cacheName = added[0]!, cache = await caches.open(cacheName);
    let removed = 0;
    for (const request of await cache.keys()) if (new URL(request.url).pathname === pathname && await cache.delete(request)) removed += 1;
    return { cacheName, removed };
  }, { existingCaches, pathname });
}
