import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
import { inspectResultsSave } from '../resultsBrowserFixture';
import { seedReviewOutcomeSave } from '../reviewBrowserFixture';
import { setTicket12ServerState } from '../ticket12ServerControl';
import { expectChooser, requestActualUpdate, waitForWaitingBuild, waitOfflineReady, workerCacheProof } from '../ticket12UpdateFixture';
import { installContentRetryAcknowledgments, readContentRetryTrace, releaseContentRetryAcknowledgment,
  removeReviewBody, restoreContentRetryAcknowledgments } from '../ticket12ContentRetryFixture';

test.beforeEach(async ({ request }) => { await setTicket12ServerState(request, { variant: 'a', failPaths: [] }); });
test.afterEach(async ({ page, request }) => {
  const cleanup = await restoreContentRetryAcknowledgments(page);
  expect(cleanup).toEqual({ restored: true, problems: [], remainingCallbacks: 0 });
  await setTicket12ServerState(request, { variant: 'a', failPaths: [] });
});

async function prepareUnlinkedReviewRetry(page: Page, request: APIRequestContext) {
  // Public Domain transitions construct this legitimate settled/unlinked state.
  // This historical native fixture does not claim to earn a victory through browser play.
  const fixture = await seedReviewOutcomeSave(page, { count: 0, settled: true });
  await page.goto('/'); await expectChooser(page);
  const currentBuild = await waitOfflineReady(page);
  const original = await inspectResultsSave(page);
  expect(original.tables.outcomeSettlements).toHaveLength(1);
  expect(original.tables.reviewLinks).toHaveLength(0);
  expect(original.tables.reviewOperations).toHaveLength(0);
  await setTicket12ServerState(request, { variant: 'b', failPaths: [] }); await requestActualUpdate(page);
  const candidateBuild = await waitForWaitingBuild(page, currentBuild);
  const registry = await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'));
  await removeReviewBody(page, fixture.run.contentVersion);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Content Required', exact: true })).toBeVisible();
  await expect(page.getByTestId('missing-content-version')).toHaveText(fixture.run.contentVersion);
  await expect(page.getByTestId('run-id')).toHaveText(fixture.run.runId);
  const before = await inspectResultsSave(page);
  expect(before.tables.runs).toEqual(original.tables.runs);
  expect(before.tables.pilotEconomies).toEqual(original.tables.pilotEconomies);
  return { fixture, currentBuild, candidateBuild, registry, before };
}

test('Content Retry stays pending after Back and its stale continuation cannot prepare Review or take over the chooser', async ({ page, request }, info) => {
  test.setTimeout(120_000);
  const { fixture, currentBuild, candidateBuild, registry, before } = await prepareUnlinkedReviewRetry(page, request);
  await installContentRetryAcknowledgments(page, true);
  await page.getByTestId('retry-content').click();
  await expect.poll(async () => (await readContentRetryTrace(page)).nativeCompletions.content,
    { timeout: 30_000 }).toEqual({ isTrusted: true });
  await page.getByTestId('back-to-pilots').click(); await expectChooser(page);
  await expect(page.getByTestId('update-activate')).toBeVisible();
  const held = { trace: await readContentRetryTrace(page), player: await inspectResultsSave(page),
    document: await page.evaluate(() => ({ timeOrigin: performance.timeOrigin, heading: document.querySelector('h1')?.textContent, inert: document.querySelector<HTMLElement>('#app')!.inert })) };
  expect(held.player).toEqual(before);
  expect(held.trace.reviewWrites).toEqual([]);
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  expect((await workerCacheProof(page, 'waiting')).buildId).toBe(candidateBuild);
  await info.attach('content-retry-held-after-back.json', { body: JSON.stringify(held, null, 2), contentType: 'application/json' });
  await expect.soft(page.getByTestId('update-activate'),
    'A preceding content recovery still owns an unacknowledged native operation after Back.').toBeDisabled();
  const admittedTooEarly = await page.getByTestId('update-activate').isEnabled();
  await releaseContentRetryAcknowledgment(page, 'content');

  if (admittedTooEarly) {
    // Retain native evidence of the original defect beyond the first RED assertion.
    // This branch cannot pass: premature admission above already failed the case.
    await expect.poll(async () => (await readContentRetryTrace(page)).nativeCompletions.review,
      { timeout: 30_000 }).toEqual({ isTrusted: true });
    const stale = { trace: await readContentRetryTrace(page), player: await inspectResultsSave(page),
      heading: await page.locator('h1').innerText() };
    await info.attach('content-retry-stale-review-write.json', { body: JSON.stringify(stale, null, 2), contentType: 'application/json' });
    expect.soft(stale.trace.reviewWrites, 'A canceled continuation must not start a new authoritative Review operation.').toEqual([]);
    expect.soft(stale.player.tables.reviewLinks).toEqual(before.tables.reviewLinks);
    await releaseContentRetryAcknowledgment(page, 'review');
    await expect.soft(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    return;
  }

  await expect(page.getByTestId('update-activate')).toBeEnabled();
  await expectChooser(page);
  const drained = await readContentRetryTrace(page);
  expect(drained.contentWrites, 'After Back, do not start a second default-candidate publication.').toBe(1);
  expect(drained.reviewWrites).toEqual([]);
  expect(await inspectResultsSave(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'))).toBe(registry);
  await info.attach('content-retry-canceled-and-drained.json', { body: JSON.stringify({ trace: drained, player: before }, null, 2), contentType: 'application/json' });
  expect(await restoreContentRetryAcknowledgments(page)).toEqual({ restored: true, problems: [], remainingCallbacks: 0 });
  await page.getByTestId('update-activate').click();
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild, { timeout: 30_000 });
  await expectChooser(page); await waitOfflineReady(page);
  expect(await inspectResultsSave(page)).toEqual(before);
  expect((await workerCacheProof(page)).buildId).toBe(candidateBuild);
  expect(await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'))).toBe(registry);
  const afterUpdate = await inspectResultsSave(page);
  expect(afterUpdate.tables.runs?.[0]).toMatchObject({ runId: fixture.run.runId, contentVersion: fixture.run.contentVersion,
    rulesetVersion: fixture.run.rulesetVersion });
  expect(afterUpdate.tables.reviewLinks).toHaveLength(0);
});

test('current Content Retry waits for genuine Review preparation acknowledgment before safe Build activation', async ({ page, context, request }, info) => {
  test.setTimeout(120_000);
  const { fixture, currentBuild, candidateBuild, registry, before } = await prepareUnlinkedReviewRetry(page, request);
  await installContentRetryAcknowledgments(page, false);
  await page.getByTestId('retry-content').click();
  await expect.poll(async () => (await readContentRetryTrace(page)).nativeCompletions.review,
    { timeout: 30_000 }).toEqual({ isTrusted: true });
  const trace = await readContentRetryTrace(page), committed = await inspectResultsSave(page);
  expect(trace.reviewWrites).toHaveLength(1);
  expect(trace.reviewWrites[0]?.kind).toBe('ensure-review');
  expect(committed.tables.reviewOperations).toHaveLength(1);
  expect(committed.tables.reviewLinks).toHaveLength(1);
  expect(committed.tables.reviewOccurrences).toHaveLength(1);
  expect(committed.tables.reviewRewards).toHaveLength(0);
  expect(committed.tables.runs).toEqual(before.tables.runs);
  expect(committed.tables.pilotEconomies).toEqual(before.tables.pilotEconomies);
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeHidden();
  await expect(page.getByTestId('update-activate')).toBeDisabled();
  expect((await workerCacheProof(page)).buildId).toBe(currentBuild);
  await info.attach('content-retry-review-committed-awaiting-ack.json', { body: JSON.stringify({ trace, player: committed }, null, 2), contentType: 'application/json' });

  await releaseContentRetryAcknowledgment(page, 'review');
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  await expect(page.getByTestId('update-activate')).toBeEnabled();
  expect(await inspectResultsSave(page)).toEqual(committed);
  expect(await page.evaluate(() => localStorage.getItem('crossdefense-content-pack-state'))).toBe(registry);
  expect(await restoreContentRetryAcknowledgments(page)).toEqual({ restored: true, problems: [], remainingCallbacks: 0 });
  await page.getByTestId('update-activate').click();
  await expect(page.getByTestId('offline-app-version')).toHaveAttribute('data-app-build', candidateBuild, { timeout: 30_000 });
  await expectChooser(page); await waitOfflineReady(page);
  expect(await inspectResultsSave(page)).toEqual(committed);
  await context.setOffline(true); await page.reload(); await expectChooser(page);
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('build-review')).toHaveText('Due Review (1)');
  await expect(page.getByTestId('run-id')).toHaveText(fixture.run.runId);
  await expect(page.getByTestId('build-content-version')).toHaveText(fixture.run.contentVersion);
  const restored = await inspectResultsSave(page);
  for (const table of ['runs', 'outcomeSettlements', 'pilotEconomies', 'reviewOperations', 'reviewOccurrences', 'reviewLinks', 'reviewRewards']) {
    expect(restored.tables[table], table).toEqual(committed.tables[table]);
  }
  await info.attach('content-retry-review-safe-update.json', { body: JSON.stringify({ currentBuild, candidateBuild,
    contentVersion: fixture.run.contentVersion, rulesetVersion: fixture.run.rulesetVersion, player: restored }, null, 2), contentType: 'application/json' });
});
