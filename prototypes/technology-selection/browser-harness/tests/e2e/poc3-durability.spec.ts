import { expect, test } from '@playwright/test';

type Poc3Snapshot = {
  workspace: {
    schemaVersion: number;
    blueprintCount: number;
    blueprintQuotaRemaining: number;
    lifecycle: 'build' | 'mapAttempt';
    lastMigration?: string;
  };
  operations: Array<{
    operationId: string;
    kind: string;
    payloadId: string;
  }>;
  attempts: Array<{
    attemptId: string;
    status: 'running' | 'interrupted' | 'completed';
  }>;
};

type Poc3Api = {
  reset(): Promise<void>;
  snapshot(): Promise<Poc3Snapshot>;
  startAttempt(attemptId: string): Promise<void>;
  collectBlueprint(request: {
    operationId: string;
    payloadId: string;
    injectFailureAfterWorkspaceWrite?: boolean;
  }): Promise<{ applied: boolean; snapshot: Poc3Snapshot }>;
  runFailingMigrationTrial(): Promise<{
    migrationFailed: boolean;
    legacyAfterFailure?: {
      schemaVersion: number;
      blueprintCount: number;
      blueprintQuotaRemaining: number;
    };
    recoverySnapshot: {
      schemaVersion: number;
      blueprintCount: number;
      blueprintQuotaRemaining: number;
    } | null;
  }>;
};

declare global {
  interface Window {
    crossDefensePoc3?: Poc3Api;
  }
}

async function waitForApi(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => Boolean(window.crossDefensePoc3));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?poc=3');
  await waitForApi(page);
  await page.evaluate(async () => {
    await window.crossDefensePoc3!.reset();
  });
});

test('Blueprint collection is atomic and OperationId retry is idempotent', async ({ page }) => {
  const first = await page.evaluate(async () => {
    return window.crossDefensePoc3!.collectBlueprint({
      operationId: 'op-blueprint-1',
      payloadId: 'payload-1',
    });
  });

  expect(first.applied).toBe(true);
  expect(first.snapshot.workspace.blueprintCount).toBe(1);
  expect(first.snapshot.workspace.blueprintQuotaRemaining).toBe(2);
  expect(first.snapshot.operations).toHaveLength(1);

  const retry = await page.evaluate(async () => {
    return window.crossDefensePoc3!.collectBlueprint({
      operationId: 'op-blueprint-1',
      payloadId: 'payload-1',
    });
  });

  expect(retry.applied).toBe(false);
  expect(retry.snapshot.workspace.blueprintCount).toBe(1);
  expect(retry.snapshot.workspace.blueprintQuotaRemaining).toBe(2);
  expect(retry.snapshot.operations).toHaveLength(1);

  const failureMessage = await page.evaluate(async () => {
    try {
      await window.crossDefensePoc3!.collectBlueprint({
        operationId: 'op-blueprint-2',
        payloadId: 'payload-2',
        injectFailureAfterWorkspaceWrite: true,
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  });

  expect(failureMessage).toContain('Injected transaction failure');

  const afterFailure = await page.evaluate(async () => {
    return window.crossDefensePoc3!.snapshot();
  });

  expect(afterFailure.workspace.blueprintCount).toBe(1);
  expect(afterFailure.workspace.blueprintQuotaRemaining).toBe(2);
  expect(afterFailure.operations).toHaveLength(1);
});

test('reload recovers a running Attempt to Build and preserves committed loot', async ({ page }) => {
  await page.evaluate(async () => {
    await window.crossDefensePoc3!.startAttempt('attempt-1');
    await window.crossDefensePoc3!.collectBlueprint({
      operationId: 'op-before-reload',
      payloadId: 'payload-before-reload',
    });
  });

  const beforeReload = await page.evaluate(async () => {
    return window.crossDefensePoc3!.snapshot();
  });

  expect(beforeReload.workspace.lifecycle).toBe('mapAttempt');
  expect(beforeReload.workspace.blueprintCount).toBe(1);
  expect(beforeReload.attempts).toEqual([
    {
      attemptId: 'attempt-1',
      status: 'running',
    },
  ]);

  await page.reload();
  await waitForApi(page);

  const afterReload = await page.evaluate(async () => {
    return window.crossDefensePoc3!.snapshot();
  });

  expect(afterReload.workspace.lifecycle).toBe('build');
  expect(afterReload.workspace.blueprintCount).toBe(1);
  expect(afterReload.workspace.blueprintQuotaRemaining).toBe(2);
  expect(afterReload.operations).toHaveLength(1);
  expect(afterReload.attempts).toEqual([
    {
      attemptId: 'attempt-1',
      status: 'interrupted',
    },
  ]);
});

test('failed schema upgrade leaves legacy data readable and keeps a recovery snapshot', async ({ page }) => {
  const result = await page.evaluate(async () => {
    return window.crossDefensePoc3!.runFailingMigrationTrial();
  });

  expect(result.migrationFailed).toBe(true);
  expect(result.legacyAfterFailure).toMatchObject({
    schemaVersion: 1,
    blueprintCount: 2,
    blueprintQuotaRemaining: 1,
  });
  expect(result.recoverySnapshot).toMatchObject({
    schemaVersion: 1,
    blueprintCount: 2,
    blueprintQuotaRemaining: 1,
  });
});
