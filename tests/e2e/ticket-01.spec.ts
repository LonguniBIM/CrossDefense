import { expect, test, type BrowserContext, type Page } from '@playwright/test';

async function createPilot(page: Page, nickname = 'Nova', avatar = 'pilot-gold'): Promise<string> {
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByLabel('Stock avatar').selectOption(avatar);
  await page.getByTestId('create-pilot').click();
  const card = page.getByTestId('pilot-card').filter({ hasText: nickname });
  await expect(card).toHaveCount(1);
  const pilotId = await card.getAttribute('data-pilot-id');
  expect(pilotId).toBeTruthy();
  return pilotId as string;
}

async function openFreshPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
  return page;
}

test('independent Pilot identities, nicknames and stock avatars survive IndexedDB reload', async ({ context }) => {
  const page = await openFreshPage(context);
  const novaId = await createPilot(page, 'Nova', 'pilot-gold');
  const echoId = await createPilot(page, 'Echo', 'pilot-blue');
  expect(echoId).not.toBe(novaId);

  const novaCard = page.getByTestId('pilot-card').filter({ hasText: 'Nova' });
  await novaCard.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('active-pilot-id')).toHaveText(novaId);

  await page.reload();
  if (await page.getByTestId('ownership-blocked').isVisible().catch(() => false)) {
    await page.getByTestId('retry-ownership').click();
  }

  const reloadedNova = page.getByTestId('pilot-card').filter({ hasText: 'Nova' });
  const reloadedEcho = page.getByTestId('pilot-card').filter({ hasText: 'Echo' });
  await expect(reloadedNova).toHaveAttribute('data-pilot-id', novaId);
  await expect(reloadedNova).toContainText('pilot-gold');
  await expect(reloadedEcho).toHaveAttribute('data-pilot-id', echoId);
  await expect(reloadedEcho).toContainText('pilot-blue');
});

test('duplicate UI submission creates one Pilot', async ({ context }) => {
  const page = await openFreshPage(context);
  await page.getByLabel('Nickname').fill('Echo');
  await page.getByTestId('create-pilot').dblclick();
  await expect(page.getByTestId('pilot-card').filter({ hasText: 'Echo' })).toHaveCount(1);
});

test('a second tab cannot write and can retry after the owner closes', async ({ context }) => {
  const owner = await openFreshPage(context);
  const blocked = await context.newPage();
  await blocked.goto('/');

  await expect(blocked.getByTestId('ownership-blocked')).toBeVisible();
  await expect(blocked.getByTestId('create-pilot')).toHaveCount(0);

  await owner.close();
  await blocked.getByTestId('retry-ownership').click();
  await expect(blocked.getByRole('heading', { name: 'Pilot chooser' })).toBeVisible();
});

test('bootstrap storage failure shows recovery and preserves existing Pilot data', async ({ context }) => {
  const owner = await openFreshPage(context);
  const pilotId = await createPilot(owner, 'KeepMe', 'pilot-violet');
  await owner.close();

  const failed = await context.newPage();
  await failed.addInitScript(() => {
    Object.defineProperty(IDBFactory.prototype, 'open', {
      configurable: true,
      value() {
        throw new DOMException('Injected storage failure', 'UnknownError');
      },
    });
  });
  await failed.goto('/');
  await expect(failed.getByRole('heading', { name: 'Workspace recovery' })).toBeVisible();
  await expect(failed.getByText('has not been replaced')).toBeVisible();
  await failed.close();

  const recovered = await openFreshPage(context);
  const card = recovered.getByTestId('pilot-card').filter({ hasText: 'KeepMe' });
  await expect(card).toHaveAttribute('data-pilot-id', pilotId);
});
