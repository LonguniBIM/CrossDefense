import { expect, test } from '@playwright/test';

type AcquireResult = {
  acquired: boolean;
  staleRecoveredFrom: string | null;
};

type SessionLockState = {
  ownerId: string | null;
  owned: boolean;
  lastLossReason: 'released' | 'lock-ended' | null;
  events: string[];
};

declare global {
  interface Window {
    crossDefensePoc5?: {
      acquire(ownerId: string): Promise<AcquireResult>;
      release(): Promise<void>;
      state(): SessionLockState;
      ownerMeta(): {
        ownerId: string;
        heartbeatAt: number;
      } | null;
    };
  }
}

async function waitForApi(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => Boolean(window.crossDefensePoc5));
}

test('one tab owns writes, a second is blocked, and abnormal closure recovers', async ({
  context,
  page: tabA,
}) => {
  const tabB = await context.newPage();

  await tabA.goto('/?poc=5');
  await tabB.goto('/?poc=5');
  await waitForApi(tabA);
  await waitForApi(tabB);

  const acquiredA = await tabA.evaluate(async () => {
    return window.crossDefensePoc5!.acquire('tab-a');
  });

  expect(acquiredA).toEqual({
    acquired: true,
    staleRecoveredFrom: null,
  });

  const blockedB = await tabB.evaluate(async () => {
    return window.crossDefensePoc5!.acquire('tab-b');
  });

  expect(blockedB).toEqual({
    acquired: false,
    staleRecoveredFrom: null,
  });

  const lockQuery = await tabB.evaluate(async () => {
    const snapshot = await navigator.locks.query();
    return {
      held: (snapshot.held ?? []).map((lock) => ({
        name: lock.name,
        mode: lock.mode,
      })),
      pending: snapshot.pending?.length ?? 0,
    };
  });

  expect(lockQuery.held).toContainEqual({
    name: 'crossdefense-workspace-write',
    mode: 'exclusive',
  });

  expect(await tabB.evaluate(() => window.crossDefensePoc5!.ownerMeta())).toMatchObject({
    ownerId: 'tab-a',
  });

  await tabA.close();

  const recovered = await expect
    .poll(
      async () => {
        return tabB.evaluate(async () => {
          return window.crossDefensePoc5!.acquire('tab-b');
        });
      },
      {
        timeout: 5_000,
        intervals: [50, 100, 250],
      },
    )
    .toMatchObject({
      acquired: true,
      staleRecoveredFrom: 'tab-a',
    });

  void recovered;

  expect(await tabB.evaluate(() => window.crossDefensePoc5!.state())).toMatchObject({
    ownerId: 'tab-b',
    owned: true,
  });

  await tabB.evaluate(async () => {
    await window.crossDefensePoc5!.release();
  });

  await expect
    .poll(async () => tabB.evaluate(() => window.crossDefensePoc5!.state()))
    .toMatchObject({
      ownerId: null,
      owned: false,
      lastLossReason: 'released',
    });

  const finalState = await tabB.evaluate(() => window.crossDefensePoc5!.state());
  expect(finalState.events).toContain('acquired:tab-b');
  expect(finalState.events).toContain('lost:released');
});
