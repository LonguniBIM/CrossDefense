import { expect, test } from '@playwright/test';

type ContentPack = {
  contentVersion: string;
  schemaVersion: number;
  compatibleRuleset: string;
  minimumAppVersion: string;
  audio: {
    laser: string;
  };
  words: string[];
};

declare global {
  interface Window {
    crossDefensePoc4?: {
      activate(version: string): Promise<{
        activated: boolean;
        state: {
          activeVersion: string | null;
          lastKnownGoodVersion: string | null;
        };
        error?: string;
      }>;
      load(version: string): Promise<ContentPack>;
      loadLaserAudio(version: string): Promise<{
        bytes: number;
        contentType: string;
      }>;
      state(): {
        activeVersion: string | null;
        lastKnownGoodVersion: string | null;
      };
      reset(): {
        activeVersion: string | null;
        lastKnownGoodVersion: string | null;
      };
    };
  }
}

async function waitForServiceWorkerReady(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}

test('validated Content Packs and pronunciation audio remain usable offline', async ({
  context,
  page,
}) => {
  await page.goto('/?poc=4');
  await page.waitForFunction(() => Boolean(window.crossDefensePoc4));
  await waitForServiceWorkerReady(page);

  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload();
    await page.waitForFunction(() => Boolean(window.crossDefensePoc4));
    await waitForServiceWorkerReady(page);
  }

  await page.evaluate(() => {
    window.crossDefensePoc4!.reset();
  });

  const v1 = await page.evaluate(async () => {
    return window.crossDefensePoc4!.activate('v1');
  });

  expect(v1).toMatchObject({
    activated: true,
    state: {
      activeVersion: 'poc4-v1',
      lastKnownGoodVersion: 'poc4-v1',
    },
  });

  const bad = await page.evaluate(async () => {
    return window.crossDefensePoc4!.activate('bad');
  });

  expect(bad.activated).toBe(false);
  expect(bad.state).toEqual({
    activeVersion: 'poc4-v1',
    lastKnownGoodVersion: 'poc4-v1',
  });

  const v2 = await page.evaluate(async () => {
    return window.crossDefensePoc4!.activate('v2');
  });

  expect(v2).toMatchObject({
    activated: true,
    state: {
      activeVersion: 'poc4-v2',
      lastKnownGoodVersion: 'poc4-v2',
    },
  });

  await context.setOffline(true);

  const offlineEvidence = await page.evaluate(async () => {
    const oldPack = await window.crossDefensePoc4!.load('v1');
    const currentPack = await window.crossDefensePoc4!.load('v2');
    const audio = await window.crossDefensePoc4!.loadLaserAudio('v1');

    return {
      oldPackVersion: oldPack.contentVersion,
      currentPackVersion: currentPack.contentVersion,
      audio,
    };
  });

  expect(offlineEvidence.oldPackVersion).toBe('poc4-v1');
  expect(offlineEvidence.currentPackVersion).toBe('poc4-v2');
  expect(offlineEvidence.audio.bytes).toBeGreaterThan(100);
  expect(offlineEvidence.audio.contentType).toContain('audio');

  await page.reload();
  await page.waitForFunction(() => Boolean(window.crossDefensePoc4));

  const stateAfterOfflineReload = await page.evaluate(() => {
    return window.crossDefensePoc4!.state();
  });

  expect(stateAfterOfflineReload).toEqual({
    activeVersion: 'poc4-v2',
    lastKnownGoodVersion: 'poc4-v2',
  });

  await context.setOffline(false);
});
