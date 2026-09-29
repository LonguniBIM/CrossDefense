import { expect, test } from '@playwright/test';

type BuildSnapshot = {
  placements: Array<{
    id: string;
    letter: string;
    subtype: string;
    x: number;
    y: number;
  }>;
  evaluation: {
    activeWords: string[];
    powerAvailable: number;
    offense: number;
    defense: number;
  };
};

type Poc2Benchmark = {
  iterations: number;
  averageMs: number;
  p95Ms: number;
  maxMs: number;
};

declare global {
  interface Window {
    crossDefensePoc2?: {
      committed(): BuildSnapshot;
      previewMove(tileId: string, x: number, y: number): BuildSnapshot;
      commitMove(tileId: string, x: number, y: number): BuildSnapshot;
      reset(): BuildSnapshot;
      benchmark(iterations?: number): Poc2Benchmark;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?poc=2');
  await page.waitForFunction(() => Boolean(window.crossDefensePoc2));
});

test('preview is non-durable and drop commits the candidate Build', async ({
  page,
}) => {
  const initial = await page.evaluate(() => {
    return window.crossDefensePoc2!.committed();
  });

  expect(initial.evaluation.activeWords).toEqual(['LASER', 'ARMOR']);

  const preview = await page.evaluate(() => {
    return window.crossDefensePoc2!.previewMove('tile-s', 5, 2);
  });

  expect(preview.evaluation.activeWords).toEqual(['ARMOR']);

  const stillCommitted = await page.evaluate(() => {
    return window.crossDefensePoc2!.committed();
  });

  expect(stillCommitted.evaluation.activeWords).toEqual(['LASER', 'ARMOR']);

  const source = page.locator('[data-tile-id="tile-s"]');
  const target = page.locator('.poc2-cell[data-x="5"][data-y="2"]');

  await source.dragTo(target);

  const afterDrop = await page.evaluate(() => {
    return window.crossDefensePoc2!.committed();
  });

  expect(afterDrop.evaluation.activeWords).toEqual(['ARMOR']);
  expect(afterDrop.placements.find((tile) => tile.id === 'tile-s')).toMatchObject({
    x: 5,
    y: 2,
  });
});

test('full Build recomputation stays comfortably below one frame budget', async ({
  page,
}) => {
  const benchmark = await page.evaluate(() => {
    return window.crossDefensePoc2!.benchmark(5000);
  });

  console.log('PoC-2 benchmark', benchmark);

  test.info().annotations.push({
    type: 'benchmark',
    description: JSON.stringify(benchmark),
  });

  expect(benchmark.iterations).toBe(5000);
  expect(benchmark.p95Ms).toBeLessThan(4);
  expect(benchmark.maxMs).toBeLessThan(16);
});
