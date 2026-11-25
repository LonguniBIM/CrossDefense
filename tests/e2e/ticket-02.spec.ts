import { syntheticPack } from '../developmentPackFixture';
import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

const PACK_VERSION = 'test-content-v1';
const RULESET_VERSION = 'development-ruleset-2026-09-30';
const PACK_STORAGE_KEY = `crossdefense-content-pack:${PACK_VERSION}`;

const validPack = syntheticPack();

type CandidateMode = 'valid' | 'invalid' | 'missing';

async function installDevelopmentPackRoute(
  context: BrowserContext,
  getMode: () => CandidateMode,
): Promise<void> {
  await context.route('**/content/packs/development-review-ship-v1/manifest.json', async (route: Route) => {
    const mode = getMode();
    if (mode === 'missing') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }

    const body =
      mode === 'valid'
        ? validPack
        : {
            ...validPack,
            contentVersion: 'test-content-invalid',
            compatibleRuleset: 'incompatible-ruleset',
          };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function recoverOwnershipIfNeeded(page: Page): Promise<void> {
  if (await page.getByTestId('ownership-blocked').isVisible().catch(() => false)) {
    await page.getByTestId('retry-ownership').click();
  }
}

async function openFreshPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto('/');
  await recoverOwnershipIfNeeded(page);
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  return page;
}

async function createAndContinuePilot(page: Page, nickname: string): Promise<string> {
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByTestId('create-pilot').click();
  const card = page.getByTestId('pilot-card').filter({ hasText: nickname });
  const pilotId = await card.getAttribute('data-pilot-id');
  expect(pilotId).toBeTruthy();
  await card.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('active-pilot-id')).toHaveText(pilotId as string);
  return pilotId as string;
}

async function continueExistingPilot(page: Page, nickname: string): Promise<void> {
  const card = page.getByTestId('pilot-card').filter({ hasText: nickname });
  await card.getByRole('button', { name: 'Continue' }).click();
}

test('Start Run pins validated versions once and reload retains versions, objective, and quota', async ({ context }) => {
  let mode: CandidateMode = 'valid';
  await installDevelopmentPackRoute(context, () => mode);
  const page = await openFreshPage(context);

  await createAndContinuePilot(page, 'Nova');
  await expect(page.getByRole('heading', { name: 'New Run' })).toBeVisible();
  await expect(page.getByTestId('start-content-version')).toHaveText(PACK_VERSION);
  await expect(page.getByTestId('start-ruleset-version')).toHaveText(RULESET_VERSION);
  await expect(page.getByTestId('start-quota')).toHaveText('4');
  await expect(page.getByTestId('start-objective')).toContainText('TEST');

  await page.getByTestId('start-run').dblclick();
  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage' })).toBeVisible();
  const runId = await page.getByTestId('run-id').textContent();
  expect(runId).toBeTruthy();
  await expect(page.getByTestId('run-content-version')).toHaveText(PACK_VERSION);
  await expect(page.getByTestId('run-ruleset-version')).toHaveText(RULESET_VERSION);
  await expect(page.getByTestId('quota-remaining')).toHaveText('4 / 4');

  await page.reload();
  await recoverOwnershipIfNeeded(page);
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  await continueExistingPilot(page, 'Nova');

  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage' })).toBeVisible();
  await expect(page.getByTestId('run-id')).toHaveText(runId as string);
  await expect(page.getByTestId('run-content-version')).toHaveText(PACK_VERSION);
  await expect(page.getByTestId('run-ruleset-version')).toHaveText(RULESET_VERSION);
  await expect(page.getByTestId('quota-remaining')).toHaveText('4 / 4');

  mode = 'valid';
});

test('an incompatible candidate cannot replace Last Known Good', async ({ context }) => {
  let mode: CandidateMode = 'valid';
  await installDevelopmentPackRoute(context, () => mode);
  const page = await openFreshPage(context);

  await page.getByLabel('Nickname').fill('Echo');
  await page.getByTestId('create-pilot').click();

  mode = 'invalid';
  await page.reload();
  await recoverOwnershipIfNeeded(page);
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  await continueExistingPilot(page, 'Echo');

  await expect(page.getByRole('heading', { name: 'New Run' })).toBeVisible();
  await expect(page.getByTestId('content-candidate-warning')).toContainText('INCOMPATIBLE_RULESET');
  await expect(page.getByTestId('start-content-version')).toHaveText(PACK_VERSION);
  await expect(page.getByTestId('start-ruleset-version')).toHaveText(RULESET_VERSION);
});

test('missing pinned content preserves the Run and routes it to Content Required', async ({ context }) => {
  let mode: CandidateMode = 'valid';
  await installDevelopmentPackRoute(context, () => mode);
  const page = await openFreshPage(context);

  await createAndContinuePilot(page, 'KeepRun');
  await page.getByTestId('start-run').click();
  await expect(page.getByRole('heading', { name: 'Pre-Run Salvage' })).toBeVisible();
  const runId = await page.getByTestId('run-id').textContent();
  expect(runId).toBeTruthy();

  await page.evaluate((storageKey) => {
    localStorage.removeItem(storageKey);
  }, PACK_STORAGE_KEY);
  mode = 'missing';

  await page.reload();
  await recoverOwnershipIfNeeded(page);
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  await continueExistingPilot(page, 'KeepRun');

  await expect(page.getByRole('heading', { name: 'Content Required' })).toBeVisible();
  await expect(page.getByTestId('content-required')).toContainText('Run is preserved');
  await expect(page.getByTestId('run-id')).toHaveText(runId as string);
  await expect(page.getByTestId('missing-content-version')).toHaveText(PACK_VERSION);
});
