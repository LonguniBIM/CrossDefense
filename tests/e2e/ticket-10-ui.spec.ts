import { expect, test, type Page } from '@playwright/test';
import { appendReviewOutcome, inspectReviewSave, openReviewBuild, seedReviewOutcomeSave } from '../reviewBrowserFixture';
import { continueSavedBuild } from '../buildBrowserFixture';
import { openOutcomeBuild } from '../resultsBrowserFixture';
import { installPreRunTestClock } from '../preRunBrowserPlayer';

async function openOffer(page: Page): Promise<void> {
  await page.getByTestId('build-results').click();
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
  await expect(page.getByTestId('results-review')).toBeEnabled();
}
async function enterOfferedReview(page: Page): Promise<void> {
  await openOffer(page);
  await page.getByTestId('results-review').click();
  await expect(page.getByRole('heading', { name: 'Vocabulary Review', exact: true })).toBeVisible();
}

test('settled victory offers optional Review and skip reload resumes one occurrence before a first correct reward', async ({ page }, info) => {
  await openReviewBuild(page);
  await openOffer(page);
  await expect(page.getByTestId('results-back')).toBeEnabled();
  const offered = await inspectReviewSave(page);
  expect(offered.tables.reviewOccurrences).toHaveLength(1);
  expect(offered.tables.reviewLinks).toHaveLength(1);
  expect(offered.tables.reviewRewards).toEqual([]);
  await page.screenshot({ path: info.outputPath('review-offer.png'), fullPage: true });
  await page.getByTestId('results-back').click();
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  await page.reload();
  await continueSavedBuild(page);
  await page.getByTestId('build-review').click();
  await expect(page.getByTestId('review-prompt')).toHaveText('A large boat that carries people or goods across water. Type the English word.');
  await expect(page.getByTestId('review-answer')).toBeFocused();
  await expect(page.getByTestId('combat-canvas')).toHaveCount(0);
  await page.getByTestId('review-answer').fill('  sHiP  ');
  await page.getByTestId('review-answer').press('Enter');
  await expect(page.getByTestId('review-completed')).toBeVisible();
  await expect(page.getByTestId('review-credits')).toHaveText('26');
  await expect(page.getByTestId('review-celestium')).toHaveText('1');
  await expect(page.getByTestId('review-reward')).toContainText('2 Credits');
  await page.screenshot({ path: info.outputPath('review-independent-complete.png'), fullPage: true });
  const completed = await inspectReviewSave(page);
  expect(completed.tables.reviewOccurrences).toHaveLength(1);
  expect(completed.tables.reviewRewards).toHaveLength(1);
  expect(completed.tables.reviewLinks).toEqual(offered.tables.reviewLinks);
  const occurrence = completed.tables.reviewOccurrences![0] as { responses: unknown[]; hints: unknown[]; attemptsToFirstCorrect: number; independentFirstResponse: boolean };
  expect(occurrence.responses).toHaveLength(1);
  expect(occurrence.hints).toEqual([]);
  expect(occurrence.attemptsToFirstCorrect).toBe(1);
  expect(occurrence.independentFirstResponse).toBe(true);
  await page.getByTestId('review-leave').click();
  await expect(page.getByTestId('build-review')).toBeDisabled();
  await enterOfferedReview(page);
  await expect(page.getByTestId('review-completed')).toBeVisible();
  expect((await inspectReviewSave(page)).tables.reviewRewards).toEqual(completed.tables.reviewRewards);
});

test('blank typing is not evidence and wrong answers plus staged hints survive leave and pay completion only', async ({ page }, info) => {
  await openReviewBuild(page);
  await enterOfferedReview(page);
  const before = await inspectReviewSave(page);
  await page.getByTestId('review-answer').fill('   ');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-error')).toContainText('answer');
  await expect(page.getByRole('textbox', { name: 'Your answer' })).toHaveAccessibleDescription('Type an answer before submitting. Blank input is not an attempt.');
  expect(await inspectReviewSave(page)).toEqual(before);
  await page.getByTestId('review-answer').fill('SH IP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-feedback')).toContainText('Try again');
  await expect(page.getByRole('textbox', { name: 'Your answer' })).toHaveAccessibleDescription('Try again. Your response is saved.');
  await page.getByTestId('review-hint-context').click();
  await expect(page.getByTestId('review-hints')).toContainText('The ___ carries goods across the sea.');
  await page.getByTestId('review-hint-letter').click();
  await expect(page.getByTestId('review-hints')).toContainText('It starts with S and has four letters.');
  await page.getByTestId('review-hint-reveal').click();
  await expect(page.getByTestId('review-hints')).toContainText('SHIP');
  await expect(page.getByTestId('review-credits')).toHaveText('24');
  expect((await inspectReviewSave(page)).tables.reviewRewards).toEqual([]);
  await page.getByTestId('review-answer').fill('unsent draft');
  await page.getByTestId('review-leave').click();
  await page.reload();
  await continueSavedBuild(page);
  await page.getByTestId('build-review').click();
  await expect(page.getByTestId('review-answer')).toHaveValue('');
  await expect(page.getByTestId('review-response-count')).toHaveText('1');
  await expect(page.getByTestId('review-hints')).toContainText('SHIP');
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByTestId('review-leave')).toBeInViewport();
    await expect(page.getByTestId('review-submit')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('review-assisted-' + viewport.width + '.png'), fullPage: true });
  }
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-completed')).toBeVisible();
  await expect(page.getByTestId('review-credits')).toHaveText('25');
  await expect(page.getByTestId('review-reward')).toContainText('1 Credit');
  const after = await inspectReviewSave(page);
  const occurrence = after.tables.reviewOccurrences![0] as { responses: unknown[]; hints: unknown[]; attemptsToFirstCorrect: number; independentFirstResponse: boolean };
  expect(occurrence.responses).toHaveLength(2);
  expect(occurrence.hints).toHaveLength(3);
  expect(occurrence.attemptsToFirstCorrect).toBe(2);
  expect(occurrence.independentFirstResponse).toBe(false);
  expect(after.tables.reviewRewards).toHaveLength(1);
});

test('failed result offers Review only after zero-reward settlement is acknowledged', async ({ page }) => {
  await openReviewBuild(page, { kind: 'failed', settled: false });
  await page.getByTestId('build-results').click();
  await expect(page.getByTestId('results-review')).toBeHidden();
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('results-review')).toBeEnabled();
  await expect(page.getByTestId('results-credits')).toHaveText('0');
  await page.getByTestId('results-review').click();
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').dblclick();
  await expect(page.getByTestId('review-credits')).toHaveText('2');
  await expect(page.getByTestId('review-celestium')).toHaveText('0');
  const save = await inspectReviewSave(page);
  expect(save.tables.reviewRewards).toHaveLength(1);
  expect((save.tables.reviewOccurrences![0] as { responses: unknown[] }).responses).toHaveLength(1);
});

test('failed Review evidence save retains the old projection and retries the identical operation', async ({ page }, info) => {
  await openReviewBuild(page);
  await enterOfferedReview(page);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    let fail = true;
    const writes: unknown[] = [];
    (window as unknown as { reviewWrites: unknown[] }).reviewWrites = writes;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'reviewOperations') {
        writes.push(structuredClone(args[0]));
        if (fail) { fail = false; throw new DOMException('Injected Review evidence failure', 'UnknownError'); }
      }
      return add.apply(this, args);
    };
  });
  const before = await inspectReviewSave(page);
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-error')).toContainText('Injected Review');
  await expect(page.getByTestId('review-credits')).toHaveText('24');
  await expect(page.getByTestId('review-completed')).toBeHidden();
  await expect(page.getByTestId('review-leave')).toBeDisabled();
  await expect(page.getByTestId('review-answer')).toBeDisabled();
  await expect(page.getByTestId('review-hint-context')).toBeDisabled();
  expect(await inspectReviewSave(page)).toEqual(before);
  await page.screenshot({ path: info.outputPath('review-save-failed.png'), fullPage: true });
  await page.getByTestId('review-retry').click();
  await expect(page.getByTestId('review-credits')).toHaveText('26');
  const writes = await page.evaluate(() => (window as unknown as { reviewWrites: unknown[] }).reviewWrites);
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
  expect((await inspectReviewSave(page)).tables.reviewRewards).toHaveLength(1);
});

test('failed Review offer creation preserves a settled result and explicit retry creates one due occurrence', async ({ page }) => {
  await openReviewBuild(page, { settled: false });
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    let fail = true;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'reviewLinks' && fail) { fail = false; throw new DOMException('Injected Review offer failure', 'UnknownError'); }
      return add.apply(this, args);
    };
  });
  await page.getByTestId('build-results').click();
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('result-error')).toContainText('Injected Review offer');
  await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');
  await expect(page.getByTestId('results-credits')).toHaveText('24');
  await expect(page.getByTestId('results-back')).toBeDisabled();
  expect((await inspectReviewSave(page)).tables.reviewOccurrences).toEqual([]);
  await page.getByTestId('retry-review-offer').click();
  await expect(page.getByTestId('results-review')).toBeEnabled();
  await page.getByTestId('results-back').click();
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  const save = await inspectReviewSave(page);
  expect(save.tables.reviewOccurrences).toHaveLength(1);
  expect(save.tables.reviewLinks).toHaveLength(1);
  expect(save.tables.reviewRewards).toEqual([]);
});

test('Review reward ends layout history and Ctrl+Z cannot reverse evidence or money', async ({ page }) => {
  await openReviewBuild(page);
  await page.locator('[data-testid="cargo-tile"]').first().click();
  await page.getByTestId('cell-C2').click();
  await expect(page.getByTestId('undo-build')).toBeEnabled();
  await enterOfferedReview(page);
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-answer').press('Control+z');
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-completed')).toBeVisible();
  const after = await inspectReviewSave(page);
  await page.getByTestId('review-leave').click();
  await expect(page.getByTestId('undo-build')).toBeDisabled();
  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('build-balances')).toHaveText('Credits 26 | Celestium 1');
  const unchanged = await inspectReviewSave(page);
  expect(unchanged.tables.reviewOccurrences).toEqual(after.tables.reviewOccurrences);
  expect(unchanged.tables.reviewRewards).toEqual(after.tables.reviewRewards);
  expect(unchanged.tables.pilotEconomies).toEqual(after.tables.pilotEconomies);
});

test('legacy combat pin receives no fabricated Review when a new default pack is active', async ({ page }) => {
  await openOutcomeBuild(page, 0);
  await expect(page.getByTestId('build-review')).toBeHidden();
  await page.getByTestId('build-results').click();
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');
  await expect(page.getByTestId('results-review')).toBeHidden();
  expect((await inspectReviewSave(page)).tables.reviewOccurrences).toEqual([]);
});

test('Q15 actual rendering keeps existing due Review through abandoned and interrupted Attempts without new offers', async ({ page }, info) => {
  test.setTimeout(120000);
  await installPreRunTestClock(page);
  await openReviewBuild(page);
  await openOffer(page);
  const original = await inspectReviewSave(page);
  await page.getByTestId('results-back').click();
  for (const ending of ['abandoned', 'interrupted'] as const) {
    await page.getByTestId('choose-map').click();
    await page.getByTestId('start-attempt').click();
    await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state', 'ready', { timeout: 20000 });
    await page.evaluate(async () => (window as unknown as { __buildTestFrame: (ms: number) => Promise<void> }).__buildTestFrame(0));
    expect(Number(await page.getByTestId('combat-scene').getAttribute('data-draw-calls'))).toBeGreaterThan(10);
    await page.screenshot({ path: info.outputPath('review-pack-rendered-' + ending + '.png'), fullPage: true });
    if (ending === 'abandoned') {
      await page.getByTestId('abandon-combat').click();
      await page.getByTestId('confirm-combat-abandon').click();
      await page.getByTestId('combat-results').click();
    } else {
      await page.reload();
      await continueSavedBuild(page);
      await page.getByTestId('build-results').click();
    }
    await expect(page.getByTestId('result-title')).toHaveText(ending === 'abandoned' ? 'Abandoned' : 'Interrupted');
    await expect(page.getByTestId('results-review')).toBeHidden();
    await page.getByTestId('settle-result').click();
    await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');
    await expect(page.getByTestId('results-review')).toBeHidden();
    await page.getByTestId('results-back').click();
    await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  }
  const after = await inspectReviewSave(page);
  expect(after.tables.reviewOccurrences).toEqual(original.tables.reviewOccurrences);
  expect(after.tables.reviewLinks).toEqual(original.tables.reviewLinks);
  expect(after.tables.reviewRewards).toEqual([]);
});


test('reload after a settled Review offer failure recovers due Review directly from Build', async ({ page }, info) => {
  test.setTimeout(60000);
  await openReviewBuild(page, { settled: false });
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'reviewLinks') throw new DOMException('Injected pre-reload offer failure', 'UnknownError');
      return add.apply(this, args);
    };
  });
  await page.getByTestId('build-results').click();
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('result-error')).toContainText('Injected pre-reload');
  await expect(page.getByTestId('result-saved')).toContainText('Settlement saved');
  const interrupted = await inspectReviewSave(page);
  expect(interrupted.tables.outcomeSettlements).toHaveLength(1);
  expect(interrupted.tables.reviewOccurrences).toEqual([]);
  expect(interrupted.tables.reviewLinks).toEqual([]);
  await page.reload();
  await continueSavedBuild(page);
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  await expect(page.getByTestId('build-review')).toBeEnabled();
  const recovered = await inspectReviewSave(page);
  expect(recovered.tables.reviewOccurrences).toHaveLength(1);
  expect(recovered.tables.reviewLinks).toHaveLength(1);
  expect(recovered.tables.reviewRewards).toEqual([]);
  expect(recovered.tables.pilotEconomies).toEqual(interrupted.tables.pilotEconomies);
  expect(recovered.tables.outcomeSettlements).toEqual(interrupted.tables.outcomeSettlements);
  await page.screenshot({ path: info.outputPath('review-recovered-build.png'), fullPage: true });
  await page.getByTestId('build-review').click();
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-credits')).toHaveText('26');
  const completed = await inspectReviewSave(page);
  expect(completed.tables.reviewRewards).toHaveLength(1);
  await page.reload();
  await continueSavedBuild(page);
  await expect(page.getByTestId('build-review')).toBeDisabled();
  await enterOfferedReview(page);
  await expect(page.getByTestId('review-completed')).toBeVisible();
  const replay = await inspectReviewSave(page);
  expect(replay.tables.reviewOccurrences).toEqual(completed.tables.reviewOccurrences);
  expect(replay.tables.reviewLinks).toEqual(completed.tables.reviewLinks);
  expect(replay.tables.reviewRewards).toEqual(completed.tables.reviewRewards);
  expect(replay.tables.pilotEconomies).toEqual(completed.tables.pilotEconomies);
});


test('reload recovery reuses unfinished Review with wrong-first and hint evidence for a later settled result', async ({ page }) => {
  test.setTimeout(120000);
  await openReviewBuild(page);
  await enterOfferedReview(page);
  await page.getByTestId('review-answer').fill('boat');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-feedback')).toContainText('Try again');
  await page.getByTestId('review-hint-context').click();
  await expect(page.getByTestId('review-hints')).toContainText('carries goods');
  const original = await inspectReviewSave(page);
  await page.getByTestId('review-leave').click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await appendReviewOutcome(page, 'review-later-attempt');
  await page.reload();
  await continueSavedBuild(page);
  expect((await inspectReviewSave(page)).tables.reviewLinks).toEqual(original.tables.reviewLinks);
  await page.evaluate(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'reviewLinks') throw new DOMException('Injected later-link failure', 'UnknownError');
      return add.apply(this, args);
    };
  });
  await page.getByTestId('build-results').click();
  await expect(page.getByTestId('result-identity')).toHaveText('review-later-attempt');
  await page.getByTestId('settle-result').click();
  await expect(page.getByTestId('result-error')).toContainText('Injected later-link');
  const interrupted = await inspectReviewSave(page);
  expect(interrupted.tables.outcomeSettlements).toHaveLength(2);
  expect(interrupted.tables.reviewOccurrences).toEqual(original.tables.reviewOccurrences);
  expect(interrupted.tables.reviewLinks).toEqual(original.tables.reviewLinks);
  await page.reload();
  await continueSavedBuild(page);
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  const recovered = await inspectReviewSave(page);
  expect(recovered.tables.reviewOccurrences).toEqual(original.tables.reviewOccurrences);
  expect(recovered.tables.reviewLinks).toHaveLength(2);
  expect(new Set(recovered.tables.reviewLinks!.map(row => (row as { occurrenceId: string }).occurrenceId)).size).toBe(1);
  expect(recovered.tables.reviewRewards).toEqual([]);
  expect(recovered.tables.pilotEconomies).toEqual(interrupted.tables.pilotEconomies);
  await page.getByTestId('build-review').click();
  await expect(page.getByTestId('review-response-count')).toHaveText('1');
  await expect(page.getByTestId('review-hints')).toContainText('carries goods');
  await page.getByTestId('review-answer').fill('SHIP');
  await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-credits')).toHaveText('29');
  await expect(page.getByTestId('review-reward')).toHaveText('1 Credit saved.');
  const completed = await inspectReviewSave(page);
  expect(completed.tables.reviewOccurrences).toHaveLength(1);
  expect(completed.tables.reviewRewards).toHaveLength(1);
  const occurrence = completed.tables.reviewOccurrences![0] as { firstResponse: { answer: string }; attemptsToFirstCorrect: number; independentFirstResponse: boolean };
  expect(occurrence.firstResponse.answer).toBe('boat');
  expect(occurrence.attemptsToFirstCorrect).toBe(2);
  expect(occurrence.independentFirstResponse).toBe(false);
});

test('Build Review recovery failure exposes Retry and retains the exact occurrence identity', async ({ page }, info) => {
  test.setTimeout(60000);
  await seedReviewOutcomeSave(page);
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    let fail = true;
    const writes: unknown[] = [];
    (window as unknown as { reviewRecoveryWrites: unknown[] }).reviewRecoveryWrites = writes;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'reviewOccurrences') writes.push(structuredClone(args[0]));
      if (this.name === 'reviewLinks' && fail) { fail = false; throw new DOMException('Injected Build recovery failure', 'UnknownError'); }
      return add.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review recovery', exact: true })).toBeVisible();
  await expect(page.getByTestId('review-recovery-error')).toContainText('Injected Build recovery');
  await expect(page.getByTestId('retry-review-recovery')).toBeFocused();
  const failed = await inspectReviewSave(page);
  expect(failed.tables.outcomeSettlements).toHaveLength(1);
  expect(failed.tables.reviewOccurrences).toEqual([]);
  expect(failed.tables.reviewLinks).toEqual([]);
  expect(failed.tables.reviewRewards).toEqual([]);
  await page.screenshot({ path: info.outputPath('review-recovery-retry.png'), fullPage: true });
  await page.getByTestId('retry-review-recovery').dblclick();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  const writes = await page.evaluate(() => (window as unknown as { reviewRecoveryWrites: unknown[] }).reviewRecoveryWrites);
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
  const recovered = await inspectReviewSave(page);
  expect(recovered.tables.reviewOccurrences).toHaveLength(1);
  expect(recovered.tables.reviewLinks).toHaveLength(1);
  expect(recovered.tables.reviewOperations).toHaveLength(1);
  expect(recovered.tables.reviewRewards).toEqual([]);
  expect(recovered.tables.pilotEconomies).toEqual(failed.tables.pilotEconomies);
  expect(recovered.tables.outcomeSettlements).toEqual(failed.tables.outcomeSettlements);
});
