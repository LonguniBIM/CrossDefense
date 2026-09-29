import { expect, test } from '@playwright/test';

type ScenarioDiagnostic = {
  scenarioId: string;
  submittedOperations: string[];
  firstApplied: boolean;
  retryApplied: boolean;
  terminal: {
    blueprintCount: number;
    blueprintQuotaRemaining: number;
    operationCount: number;
  };
  digest: string;
};

declare global {
  interface Window {
    crossDefensePoc6?: {
      run(): Promise<ScenarioDiagnostic>;
    };
  }
}

test('the shared scenario runs against real browser persistence while offline', async ({
  context,
  page,
}, testInfo) => {
  await page.goto('/?poc=6');
  await page.waitForFunction(() => Boolean(window.crossDefensePoc6));

  await context.setOffline(true);

  const diagnostic = await page.evaluate(async () => {
    return window.crossDefensePoc6!.run();
  });

  await context.setOffline(false);

  await testInfo.attach('crossdefense-diagnostic.json', {
    body: JSON.stringify(diagnostic, null, 2),
    contentType: 'application/json',
  });

  expect(diagnostic).toEqual({
    scenarioId: 'poc6-shared-durability-scenario-v1',
    submittedOperations: [
      'poc6-op-blueprint-1',
      'poc6-op-blueprint-1',
    ],
    firstApplied: true,
    retryApplied: false,
    terminal: {
      blueprintCount: 1,
      blueprintQuotaRemaining: 2,
      operationCount: 1,
    },
    digest: '68523b19',
  });
});
