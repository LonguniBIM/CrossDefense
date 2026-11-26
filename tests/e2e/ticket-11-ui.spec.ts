import { expect, test } from '@playwright/test';
import type { SettingsOperation } from '../../src/application/workspace/SettingsRepository';
import type { WorkspaceSettings } from '../../src/domain/workspace/settings';
import { finishedBuildRun } from '../buildFixture';
import { openOutcomeBuild, inspectResultsSave } from '../resultsBrowserFixture';

test('Settings is keyboard accessible before choosing a Pilot and restores its invoker', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  const launcher = page.getByTestId('open-settings');
  await expect(launcher).toBeVisible();
  await launcher.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
  await expect(page.getByTestId('settings-scope')).toContainText('all Pilots');
  await expect(page.getByTestId('binding-left-0')).toHaveValue('Left');
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('Space');
  await expect(page.getByTestId('save-settings')).toBeInViewport(); await expect(page.getByTestId('close-settings')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('settings-before-play.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test('remapping explains conflicts, saves the shared controls and restores defaults after reload', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('H');
  await page.getByTestId('binding-left-0').focus(); await page.keyboard.press('h');
  await expect(page.getByTestId('settings-error')).toContainText('Hard drop');
  await expect(page.getByTestId('settings-error')).toContainText('Move left');
  await expect(page.getByTestId('save-settings')).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('binding-conflict.png'), fullPage: true });
  await page.getByTestId('binding-left-0').focus(); await page.keyboard.press('a');
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
  await page.getByTestId('close-settings').click();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('H');
  await expect(page.getByTestId('binding-left-0')).toHaveValue('A');
  await page.getByTestId('restore-controls').click();
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
  await page.getByTestId('close-settings').click();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('Space');
  await expect(page.getByTestId('binding-left-0')).toHaveValue('Left');
  await expect(page.getByTestId('binding-hold-0')).toHaveValue('C');
  await expect(page.getByTestId('binding-hold-1')).toHaveValue('Left Shift');
  await expect(page.getByTestId('binding-hold-2')).toHaveValue('Right Shift');
});

import type { Page } from '@playwright/test';
import { combatBuild, combatPack } from '../combatFixture';
import { openSavedBuild, continueSavedBuild } from '../buildBrowserFixture';
import { installPreRunTestClock } from '../preRunBrowserPlayer';

async function frame(page: Page, milliseconds = 1000 / 60): Promise<void> {
  await page.evaluate(ms => (window as unknown as { __buildTestFrame: (ms: number) => Promise<void> }).__buildTestFrame(ms), milliseconds);
}
async function beginCombat(page: Page): Promise<void> {
  await page.getByTestId('choose-map').click();
  await page.getByTestId('start-attempt').click();
  await expect(page.getByRole('heading', { name: 'Map combat', exact: true })).toBeVisible();
  await frame(page, 0);
}

test('one saved Workspace mapping drives real Combat and another Pilot Pre-Run', async ({ page }) => {
  await installPreRunTestClock(page); await openSavedBuild(page, combatBuild(), combatPack());
  await page.getByTestId('back-to-pilots').click();
  await page.getByTestId('open-settings').click();
  await page.getByTestId('binding-left-0').focus(); await page.keyboard.press('a');
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
  await page.getByTestId('close-settings').click(); await continueSavedBuild(page);
  await beginCombat(page);
  const initial = Number(await page.getByTestId('active-piece').getAttribute('data-pivot-x'));
  await page.keyboard.press('ArrowLeft'); await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', String(initial));
  await page.keyboard.press('a'); await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', String(initial - 1));
  await page.keyboard.press('h'); await frame(page);
  await expect(page.getByTestId('combat-threat')).toHaveText('1');
  await page.getByTestId('abandon-combat').click(); await page.getByTestId('confirm-combat-abandon').click();
  await expect(page.getByTestId('return-combat-build')).toBeVisible(); await page.getByTestId('return-combat-build').click();
  await page.getByTestId('back-to-pilots').click();
  await page.getByLabel('Nickname').fill('Second controls Pilot'); await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').filter({ hasText: 'Second controls Pilot' }).getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('start-run').click(); await page.getByTestId('begin-salvage').click();
  await expect(page.getByTestId('pre-run-board')).toBeVisible(); await frame(page, 0);
  const preRun = Number(await page.getByTestId('active-piece').getAttribute('data-pivot-x'));
  await page.keyboard.press('ArrowLeft'); await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', String(preRun));
  await page.keyboard.press('a'); await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', String(preRun - 1));
  const piece = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.keyboard.press('h'); await frame(page);
  await expect(page.getByTestId('active-piece')).not.toHaveAttribute('data-piece-id', piece!);
});

test('Settings pauses both clocks and explicit 3-2-1 Resume discards held and queued gameplay', async ({ page }, testInfo) => {
  await installPreRunTestClock(page); await openSavedBuild(page, combatBuild(), combatPack()); await beginCombat(page);
  await page.keyboard.down('ArrowRight'); await frame(page);
  const tick = await page.getByTestId('combat-tick').innerText();
  const position = await page.getByTestId('active-piece').getAttribute('data-pivot-x');
  const piece = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.keyboard.press('c');
  const launcher = page.getByTestId('open-settings'); await expect(launcher).toBeVisible(); await launcher.click();
  await expect(page.getByTestId('combat-pause')).toContainText('Settings');
  await page.keyboard.up('ArrowRight'); await frame(page, 10000);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick); await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('k');
  await frame(page, 5000); await expect(page.getByTestId('combat-threat')).toHaveText('0');
  await page.keyboard.press('Escape'); await expect(launcher).toBeFocused();
  await expect(page.getByTestId('resume-combat')).toBeVisible();
  await page.getByTestId('resume-combat').click();
  await frame(page, 0);
  for (const [elapsed, label] of [[0, '3'], [1000, '2'], [1000, '1']] as const) {
    if (elapsed) await frame(page, elapsed);
    await expect(page.getByTestId('combat-pause')).toContainText('Resuming in ' + label);
    await expect(page.getByTestId('combat-tick')).toHaveText(tick); await expect(page.getByTestId('board-tick')).toHaveText(tick);
  }
  await page.screenshot({ path: testInfo.outputPath('paused-countdown.png'), fullPage: true });
  await frame(page, 1000);
  await expect(page.getByTestId('combat-tick')).toHaveText(tick); await expect(page.getByTestId('board-tick')).toHaveText(tick);
  await expect(page.getByTestId('resume-combat')).toBeHidden();
  for (let count = 0; count < 15; count++) await frame(page);
  expect(Number(await page.getByTestId('combat-tick').innerText())).toBeGreaterThan(Number(tick));
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', position!);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!);
  await expect(page.getByTestId('combat-threat')).toHaveText('0');
});

test('independent audio channels and reduced motion save for the Workspace without requiring audio assets', async ({ page }, testInfo) => {
  const audioRequests: string[] = [];
  page.on('request', request => { if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(request.url())) audioRequests.push(request.url()); });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  for (const [channel, initial, changed] of [['music', '45', '20'], ['effects', '65', '40'], ['pronunciation', '85', '70']] as const) {
    const control = page.getByTestId('volume-' + channel);
    await expect(control).toHaveValue(initial);
    await control.fill(changed);
  }
  await page.getByTestId('mute-music').check(); await page.getByTestId('mute-pronunciation').check();
  await page.getByTestId('reduced-motion').check();
  await expect(page.locator('html')).not.toHaveAttribute('data-reduced-motion', 'true');
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.screenshot({ path: testInfo.outputPath('settings-audio-motion.png'), fullPage: true });
  await page.getByTestId('close-settings').click(); await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByTestId('open-settings').click();
  for (const [channel, value] of [['music', '20'], ['effects', '40'], ['pronunciation', '70']] as const) await expect(page.getByTestId('volume-' + channel)).toHaveValue(value);
  await expect(page.getByTestId('mute-music')).toBeChecked(); await expect(page.getByTestId('mute-effects')).not.toBeChecked(); await expect(page.getByTestId('mute-pronunciation')).toBeChecked();
  await expect(page.getByTestId('reduced-motion')).toBeChecked();
  await page.getByTestId('restore-controls').click();
  await expect(page.getByTestId('volume-music')).toHaveValue('20'); await expect(page.getByTestId('reduced-motion')).toBeChecked();
  expect(audioRequests).toEqual([]);
});

test('Shift+Tab navigates Settings without rebinding a gameplay key', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  // Use an interior native focus step: the user agent may expose its own focus target at a modal boundary.
  await page.getByTestId('binding-left-1').focus(); await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('binding-left-0')).toHaveValue('Left'); await expect(page.getByTestId('binding-left-1')).toHaveValue('');
  await expect(page.getByTestId('settings-error')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear Move left binding 1', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByTestId('binding-left-1')).toBeFocused();
});

test('Pre-Run Resume holds the board through 3-2-1 and starts on the next ordinary frame', async ({ page }) => {
  await installPreRunTestClock(page); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByLabel('Nickname').fill('Countdown Pilot'); await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('start-run').click(); await page.getByTestId('begin-salvage').click(); await frame(page, 0);
  await page.keyboard.down('ArrowRight'); await frame(page);
  const position = await page.getByTestId('active-piece').getAttribute('data-pivot-x'), piece = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.keyboard.press('c'); await page.getByTestId('open-settings').click(); await page.keyboard.up('ArrowRight'); await frame(page, 10000);
  await page.keyboard.press('Escape'); await expect(page.getByTestId('open-settings')).toBeFocused();
  await page.getByTestId('resume-salvage').click(); await frame(page, 0);
  for (const [elapsed, label] of [[0, '3'], [1000, '2'], [1000, '1']] as const) {
    if (elapsed) await frame(page, elapsed);
    await expect(page.getByTestId('pause-message')).toContainText('resuming in ' + label);
    await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!);
    await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', position!);
  }
  await frame(page, 1000); await expect(page.getByTestId('resume-salvage')).toBeHidden();
  await expect(page.getByTestId('pause-message')).toBeHidden();
  for (let count = 0; count < 15; count++) await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', position!);
  await page.keyboard.press('Space'); await frame(page);
  await expect(page.getByTestId('active-piece')).not.toHaveAttribute('data-piece-id', piece!);
});

import { openReviewBuild, inspectReviewSave, reviewPack } from '../reviewBrowserFixture';
test('requested missing pronunciation is non-blocking and changes no Review evidence or reward', async ({ page }) => {
  const media: string[] = []; page.on('request', request => { if (request.resourceType() === 'media') media.push(request.url()); });
  await openReviewBuild(page); await page.getByTestId('build-review').click();
  await expect(page.getByRole('heading', { name: 'Vocabulary Review', exact: true })).toBeVisible();
  const before = await inspectReviewSave(page);
  await expect(page.getByTestId('pronunciation-feedback')).toHaveText('');
  await page.getByTestId('request-pronunciation').click();
  await expect(page.getByTestId('pronunciation-feedback')).toContainText('Pronunciation audio is unavailable');
  await expect(page.getByTestId('review-answer')).toBeEnabled();
  await expect(page.getByTestId('review-response-count')).toHaveText('0');
  expect(await inspectReviewSave(page)).toEqual(before); expect(media).toEqual([]);
  await page.getByTestId('review-answer').fill('ship'); await page.getByTestId('review-submit').click();
  await expect(page.getByTestId('review-reward')).toHaveText('2 Credits saved.');
});

test('Settings, undersized viewport and controlled hidden input cancel countdown and require a fresh explicit Resume', async ({ page }, testInfo) => {
  await installPreRunTestClock(page); await openSavedBuild(page, combatBuild(), combatPack()); await beginCombat(page); await frame(page);
  const tick = await page.getByTestId('combat-tick').innerText();
  const frozen = async () => { await expect(page.getByTestId('combat-tick')).toHaveText(tick); await expect(page.getByTestId('board-tick')).toHaveText(tick); };
  await page.getByTestId('pause-combat').click(); await page.getByTestId('resume-combat').click(); await frame(page, 0); await frame(page, 1000);
  await page.getByTestId('open-settings').click(); await frame(page, 5000); await frozen();
  await page.setViewportSize({ width: 1100, height: 650 }); await expect(page.getByTestId('combat-pause')).toContainText('1280');
  await expect(page.getByTestId('binding-left-0')).toBeEnabled();
  await page.getByTestId('close-settings').focus();
  const bounds = await page.getByRole('dialog').boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.width).toBeLessThanOrEqual(1100);
  await page.screenshot({ path: testInfo.outputPath('settings-undersized.png'), fullPage: true });
  await page.keyboard.press('Escape'); await expect(page.getByTestId('open-settings')).toBeFocused(); await expect(page.getByTestId('resume-combat')).toBeDisabled();
  await page.setViewportSize({ width: 1280, height: 720 }); await expect(page.getByTestId('resume-combat')).toBeEnabled(); await frozen();
  await page.getByTestId('resume-combat').click(); await frame(page, 0); await expect(page.getByTestId('combat-pause')).toContainText('Resuming in 3');
  await frame(page, 1000);
  // Controlled platform signal; this does not claim a native hidden-tab transition.
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await frame(page, 60000); await frozen(); await expect(page.getByTestId('resume-combat')).toBeDisabled();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await frame(page, 0); await expect(page.getByTestId('resume-combat')).toBeEnabled(); await frozen();
  await page.getByTestId('resume-combat').click(); await frame(page, 0);
  for (const label of ['3', '2', '1']) { await expect(page.getByTestId('combat-pause')).toContainText('Resuming in ' + label); await frozen(); await frame(page, 1000); }
  await frozen(); await frame(page, 0); // The existing Combat host rebases after its countdown resetClock result.
  await frame(page); expect(Number(await page.getByTestId('combat-tick').innerText())).toBeGreaterThan(Number(tick));
  await page.getByTestId('abandon-combat').click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByTestId('abandon-combat')).toBeFocused(); await expect(page.getByTestId('resume-combat')).toBeVisible();
});

test('editable focus and browser shortcuts never trigger gameplay while native button keys and standalone Shift remain usable', async ({ page }) => {
  await installPreRunTestClock(page); await openSavedBuild(page, combatBuild(), combatPack()); await beginCombat(page);
  // Isolated platform-input targets exercise the live gameplay adapter while it is actively playing.
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'test-native-text'; input.setAttribute('aria-label', 'Test native text');
    const editable = document.createElement('div'); editable.id = 'test-editable'; editable.contentEditable = 'true'; editable.setAttribute('aria-label', 'Test editable region');
    document.querySelector('.cb-hud')!.append(input, editable);
  });
  const piece = await page.getByTestId('active-piece').getAttribute('data-piece-id'), x = await page.getByTestId('active-piece').getAttribute('data-pivot-x');
  for (const id of ['test-native-text', 'test-editable']) {
    await page.locator('#' + id).focus(); await page.keyboard.type('cz x'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Escape'); await frame(page);
    await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!); await expect(page.getByTestId('active-piece')).toHaveAttribute('data-pivot-x', x!);
    await expect(page.getByTestId('combat-threat')).toHaveText('0'); await expect(page.getByTestId('resume-combat')).toBeHidden();
  }
  await expect(page.getByLabel('Test native text')).toHaveValue('cz x'); await expect(page.getByLabel('Test editable region')).toHaveText('cz x');
  await page.getByTestId('combat-board').focus(); await page.keyboard.press('Control+c'); await frame(page);
  await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!);
  await page.keyboard.press('ShiftLeft'); await frame(page); await expect(page.getByTestId('active-piece')).not.toHaveAttribute('data-piece-id', piece!);
  await page.getByTestId('pause-combat').focus(); await page.keyboard.press('Space'); await frame(page);
  await expect(page.getByTestId('combat-pause')).toContainText('Paused by player'); await expect(page.getByTestId('combat-threat')).toHaveText('0');
});

test('saved reduced motion preserves real Q15 HUD, words, board and harvest facts and honors the OS preference', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await installPreRunTestClock(page);
  await openSavedBuild(page, combatBuild(reviewPack())); await beginCombat(page);
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-renderer-state', 'ready', { timeout: 20000 }); await frame(page, 0);
  for (let i = 0; i < 7; i++) await frame(page);
  const facts = () => page.evaluate(() => {
    const ids = ['player-hull', 'player-shield', 'enemy-hull', 'enemy-shield', 'combat-threat', 'combat-tick', 'board-tick', 'player-equipped-words', 'enemy-equipped-words', 'combat-collected', 'combat-receipt', 'combat-harvest'];
    return Object.fromEntries(ids.map(id => [id, document.querySelector('[data-testid="' + id + '"]')!.textContent]));
  });
  const before = await facts(), piece = await page.getByTestId('active-piece').getAttribute('data-piece-id');
  await page.getByTestId('open-settings').click(); await page.getByTestId('reduced-motion').check(); await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved'); await page.getByTestId('close-settings').click(); await frame(page, 0);
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-reduced-motion', 'true');
  expect(await facts()).toEqual(before); await expect(page.getByTestId('active-piece')).toHaveAttribute('data-piece-id', piece!);
  await page.setViewportSize({ width: 1280, height: 720 }); await frame(page, 0);
  await page.screenshot({ path: testInfo.outputPath('reduced-motion-combat-1280.png'), fullPage: true });
  await page.getByTestId('resume-combat').click(); await frame(page, 0);
  for (let i = 0; i < 3; i++) await frame(page, 1000);
  expect(await facts()).toEqual(before); await frame(page, 0); // Rebase the existing Combat frame host before ordinary elapsed play.
  await frame(page);
  await expect(page.getByTestId('combat-tick')).toHaveText('8'); await expect(page.getByTestId('board-tick')).toHaveText('8');
  await page.getByTestId('open-settings').click(); await page.getByTestId('reduced-motion').uncheck(); await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved'); await page.getByTestId('close-settings').click(); await frame(page, 0);
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-reduced-motion', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await frame(page, 0);
  await expect(page.getByTestId('combat-scene')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.getByTestId('combat-tick')).toHaveText('8'); await expect(page.getByTestId('player-equipped-words')).toContainText('SHIP');
});


type Ticket11HostReceiptCapture = { __ticket11HostReceiptAttempts: unknown[] };

/** Fail the native receipt write after bootstrap; reload removes this test-owned interception. */
async function installTicket11HostReceiptFailure(
  page: Page, store: 'buildOperations' | 'cargoOperations',
  kind: 'return' | 'resolve-salvage', message: string,
): Promise<void> {
  await page.evaluate(({ store, kind, message }) => {
    const add = IDBObjectStore.prototype.add, attempts: unknown[] = [];
    (window as unknown as Ticket11HostReceiptCapture).__ticket11HostReceiptAttempts = attempts;
    let fail = true;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      const receipt = args[0] as { kind?: string };
      if (this.name === store && this.transaction.mode === 'readwrite' && receipt.kind === kind) {
        attempts.push(structuredClone(args[0]));
        if (fail) { fail = false; throw new DOMException(message, 'UnknownError'); }
      }
      return add.apply(this, args);
    };
  }, { store, kind, message });
}
async function ticket11HostReceiptAttempts(page: Page): Promise<unknown[]> {
  return page.evaluate(() => (window as unknown as Ticket11HostReceiptCapture).__ticket11HostReceiptAttempts);
}

/** Establish nondefault acknowledged preferences before the unrelated host fails. */
async function saveTicket11HostRecoverySettings(page: Page): Promise<void> {
  await page.getByTestId('open-settings').click();
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('j');
  await page.getByTestId('volume-music').fill('17'); await page.getByTestId('reduced-motion').check();
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByTestId('close-settings').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('open-settings')).toBeFocused();
}

/** Use native keyboard/modal routes while the failed host's original operation stays pending. */
async function exerciseTicket11SettingsDuringHostFailure(page: Page, hostRetryId: 'retry-placement' | 'retry-salvage'): Promise<void> {
  const launcher = page.getByTestId('open-settings'), retry = page.getByTestId(hostRetryId);
  const dialog = page.getByRole('dialog', { name: 'Settings and controls' });
  const left = page.getByTestId('binding-left-0'), drop = page.getByTestId('binding-drop-0');
  // This is the semantic RED assertion on the frozen R3 source.
  await expect(launcher).toBeEnabled(); await expect(retry).toBeVisible(); await expect(retry).toBeEnabled();
  await launcher.focus(); await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible(); await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(left).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Clear Move left binding 1', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(left).toBeFocused();
  await expect(drop).toHaveValue('J'); await expect(page.getByTestId('volume-music')).toHaveValue('17');
  await expect(page.getByTestId('reduced-motion')).toBeChecked();
  await drop.focus(); await page.keyboard.press('h'); await expect(drop).toHaveValue('H');
  await expect(page.getByTestId('settings-status')).toHaveText('Unsaved changes.');
  await expect(page.getByTestId('save-settings')).toBeEnabled();
  await retry.focus(); await expect(drop).toBeFocused(); // Native modal inertness.
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused(); await expect(retry).toBeVisible(); await expect(retry).toBeEnabled();

  // Cancelled draft changes do not replace the acknowledged Settings projection.
  await page.keyboard.press('Space'); await expect(dialog).toBeVisible(); await expect(left).toBeFocused();
  await expect(drop).toHaveValue('J'); await expect(page.getByTestId('volume-music')).toHaveValue('17');
  await expect(page.getByTestId('reduced-motion')).toBeChecked();
  await expect(page.getByTestId('retry-settings')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByTestId('close-settings').focus(); await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0); await expect(launcher).toBeFocused();
  await expect(retry).toBeVisible(); await expect(retry).toBeEnabled();
}

test('T11 host recovery: Build keeps Settings accessible and preserves the exact failed Return', async ({ page }) => {
  const run = finishedBuildRun(), tileId = (index: number) => run.runId + ':starter:' + index;
  const cargoTile = (index: number) => page.locator('[data-testid="cargo-tile"][data-tile-id="' + tileId(index) + '"]');
  await openSavedBuild(page, run);
  for (let index = 0; index < 4; index++) {
    await cargoTile(index).click(); await page.getByTestId('cell-' + String.fromCharCode(65 + index) + '3').click();
    await expect(page.getByTestId('build-status')).toHaveText('Placement saved.');
  }
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', tileId(2));
  await saveTicket11HostRecoverySettings(page);
  const before = await inspectResultsSave(page), beforeCargoCount = await page.getByTestId('cargo-tile').count();
  await page.keyboard.press('Escape'); await page.getByTestId('cell-C3').click();
  await expect(page.getByTestId('return-tile')).toBeEnabled();
  const failure = 'Injected Ticket11 Build Return receipt failure';
  await installTicket11HostReceiptFailure(page, 'buildOperations', 'return', failure);
  await page.getByTestId('return-tile').click();

  await expect(page.getByTestId('build-status')).toContainText(failure);
  await expect(page.getByTestId('retry-placement')).toBeVisible(); await expect(page.getByTestId('retry-placement')).toBeEnabled();
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(beforeCargoCount);
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', tileId(2));
  for (const id of ['cell-C3', 'return-tile', 'undo-build', 'redo-build', 'back-to-pilots']) await expect(page.getByTestId(id)).toBeDisabled();
  await expect(page.getByTestId('cargo-tile').first()).toBeDisabled();
  expect(await inspectResultsSave(page)).toEqual(before);
  const firstAttempts = await ticket11HostReceiptAttempts(page); expect(firstAttempts).toHaveLength(1);
  const originalReceipt = firstAttempts[0];
  expect(originalReceipt).toEqual(expect.objectContaining({ operationId: expect.any(String), kind: 'return', fingerprint: expect.any(String) }));

  await exerciseTicket11SettingsDuringHostFailure(page, 'retry-placement');
  await expect(page.getByTestId('build-status')).toContainText(failure);
  await expect(page.getByTestId('power-available')).toHaveText('4.05');
  await expect(page.getByTestId('cargo-tile')).toHaveCount(beforeCargoCount);
  await expect(page.getByTestId('cell-C3')).toHaveAttribute('data-tile-id', tileId(2));
  for (const id of ['return-tile', 'undo-build']) await expect(page.getByTestId(id)).toBeDisabled();
  await expect(page.getByTestId('cargo-tile').first()).toBeDisabled();
  expect(await ticket11HostReceiptAttempts(page)).toEqual([originalReceipt]);
  expect(await inspectResultsSave(page)).toEqual(before);

  await page.getByTestId('retry-placement').focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('build-status')).toHaveText('Tile returned to Cargo.');
  await expect(page.getByTestId('retry-placement')).toBeHidden();
  await expect(page.getByTestId('power-available')).toHaveText('0');
  await expect(cargoTile(2)).toBeVisible(); await expect(page.getByTestId('cargo-tile')).toHaveCount(beforeCargoCount + 1);
  await expect(page.getByTestId('cell-C3')).not.toHaveAttribute('data-tile-id', /.+/);
  await expect(page.getByTestId('cell-C3')).toBeEnabled(); await expect(page.getByTestId('undo-build')).toBeEnabled();
  expect(await ticket11HostReceiptAttempts(page)).toEqual([originalReceipt, originalReceipt]);
  const saved = await inspectResultsSave(page);
  expect(saved.tables.buildOperations).toHaveLength(before.tables.buildOperations!.length + 1);
  expect(saved.tables.buildOperations).toContainEqual(originalReceipt);
  for (const name of Object.keys(before.tables).filter(name => !['runs', 'buildOperations'].includes(name))) expect(saved.tables[name], name).toEqual(before.tables[name]);

  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('power-available')).toHaveText('0'); await expect(cargoTile(2)).toBeVisible();
  await expect(page.getByTestId('undo-build')).toBeDisabled();
  const reloaded = await inspectResultsSave(page);
  for (const name of ['runs', 'buildOperations', 'settings', 'settingsOperations']) expect(reloaded.tables[name], name).toEqual(saved.tables[name]);
});

test('T11 host recovery: Salvage keeps Settings accessible and preserves the exact failed Apply', async ({ page }) => {
  await openOutcomeBuild(page); await saveTicket11HostRecoverySettings(page);
  await page.getByTestId('build-salvage').click();
  await expect(page.getByRole('heading', { name: 'Resolve Salvage', exact: true })).toBeVisible();
  await expect(page.getByTestId('salvage-choice')).toHaveCount(2);
  for (const choice of await page.getByTestId('salvage-choice').all()) await choice.selectOption('keep');
  await expect(page.getByTestId('salvage-unresolved')).toHaveText('Unresolved choices: 0');
  await expect(page.getByTestId('salvage-capacity')).toHaveText('10');
  const before = await inspectResultsSave(page), failure = 'Injected Ticket11 Salvage Apply receipt failure';
  await installTicket11HostReceiptFailure(page, 'cargoOperations', 'resolve-salvage', failure);
  await page.getByTestId('review-salvage').click();
  await expect(page.getByTestId('salvage-confirmation')).toBeVisible(); await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.getByTestId('confirm-salvage').click();

  await expect(page.getByTestId('salvage-error')).toContainText(failure);
  await expect(page.getByTestId('salvage-confirmation')).toHaveCount(0);
  await expect(page.getByTestId('retry-salvage')).toBeVisible(); await expect(page.getByTestId('retry-salvage')).toBeEnabled();
  await expect(page.getByTestId('review-salvage')).toBeDisabled(); await expect(page.getByTestId('cancel-salvage')).toBeDisabled();
  await expect(page.getByTestId('discard-retained').first()).toBeDisabled();
  for (const choice of await page.getByTestId('salvage-choice').all()) { await expect(choice).toBeDisabled(); await expect(choice).toHaveValue('keep'); }
  await expect(page.getByTestId('salvage-retained-count')).toHaveText('8'); await expect(page.getByTestId('salvage-buffer-count')).toHaveText('2');
  expect(await inspectResultsSave(page)).toEqual(before);
  const firstAttempts = await ticket11HostReceiptAttempts(page); expect(firstAttempts).toHaveLength(1);
  const originalReceipt = firstAttempts[0];
  expect(originalReceipt).toEqual(expect.objectContaining({ operationId: expect.any(String), kind: 'resolve-salvage', fingerprint: expect.any(String) }));

  await exerciseTicket11SettingsDuringHostFailure(page, 'retry-salvage');
  await expect(page.getByTestId('salvage-error')).toContainText(failure);
  await expect(page.getByTestId('salvage-capacity')).toHaveText('10');
  await expect(page.getByTestId('salvage-retained-count')).toHaveText('8'); await expect(page.getByTestId('salvage-buffer-count')).toHaveText('2');
  await expect(page.getByTestId('review-salvage')).toBeDisabled(); await expect(page.getByTestId('cancel-salvage')).toBeDisabled();
  for (const choice of await page.getByTestId('salvage-choice').all()) { await expect(choice).toBeDisabled(); await expect(choice).toHaveValue('keep'); }
  expect(await ticket11HostReceiptAttempts(page)).toEqual([originalReceipt]);
  expect(await inspectResultsSave(page)).toEqual(before);

  await page.getByTestId('retry-salvage').focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  await expect(page.getByTestId('build-collected-count')).toHaveText('10');
  await expect(page.getByTestId('build-salvage')).toBeDisabled(); await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  await expect(page.getByTestId('open-settings')).toBeEnabled();
  expect(await ticket11HostReceiptAttempts(page)).toEqual([originalReceipt, originalReceipt]);
  const saved = await inspectResultsSave(page);
  expect(saved.tables.cargoOperations).toHaveLength(before.tables.cargoOperations!.length + 1);
  expect(saved.tables.cargoOperations).toContainEqual(originalReceipt);
  for (const name of Object.keys(before.tables).filter(name => !['runs', 'cargoOperations'].includes(name))) expect(saved.tables[name], name).toEqual(before.tables[name]);

  await page.reload(); await continueSavedBuild(page);
  await expect(page.getByTestId('build-collected-count')).toHaveText('10');
  await expect(page.getByTestId('build-salvage')).toBeDisabled(); await expect(page.getByTestId('power-surplus')).toHaveText('3.05');
  const reloaded = await inspectResultsSave(page);
  for (const name of ['runs', 'cargoOperations', 'settings', 'settingsOperations']) expect(reloaded.tables[name], name).toEqual(saved.tables[name]);
});


type T11LateAckTarget = 'salvage' | 'settings';
type T11LateAckOutcome = 'success' | 'lost-ack';
interface T11LateAckTrace {
  operationIds: Record<T11LateAckTarget, string[]>;
  receiptAttempts: Record<T11LateAckTarget, unknown[]>;
  nativeCompletion: Record<T11LateAckTarget, { isTrusted: boolean } | null>;
  releases: Array<{ target: T11LateAckTarget; outcome: T11LateAckOutcome }>;
  controlledAborts: Array<{ target: T11LateAckTarget; isTrusted: boolean }>;
}
interface T11LateAckCleanup {
  state: 'restored' | 'absent';
  problems: string[];
  releasedDuringCleanup: T11LateAckTarget[];
  capturedCallbacksRemaining: number;
  openMessagePorts: number;
}
interface T11LateAckHarness {
  read(): T11LateAckTrace;
  release(target: T11LateAckTarget, outcome: T11LateAckOutcome): Promise<void>;
  restore(): Promise<T11LateAckCleanup>;
}
type T11LateAckWindow = Window & { __ticket11LateAck?: T11LateAckHarness };
interface T11LateAckSettingsRecord {
  key: 'settings';
  revision: number;
  settings: WorkspaceSettings;
}

/**
 * Hold the installed acknowledgment callback after a real native commit.
 * A lost-ack release delivers a controlled synthetic failure; it does not
 * claim a native abort or rollback after commit. Install this fixture alone.
 */
async function installTicket11LateAckHarness(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (Object.prototype.hasOwnProperty.call(window, '__ticket11LateAck')) throw Error('Acknowledgment harness already installed.');
    type Held = {
      target: T11LateAckTarget;
      tx: IDBTransaction;
      complete: NonNullable<IDBTransaction['oncomplete']>;
      intercept: NonNullable<IDBTransaction['oncomplete']>;
      event: Event | null;
      released: boolean;
    };
    const nativeGet = IDBObjectStore.prototype.get, nativeAdd = IDBObjectStore.prototype.add;
    const held = new Map<T11LateAckTarget, Held>();
    const trace: T11LateAckTrace = {
      operationIds: { salvage: [], settings: [] },
      receiptAttempts: { salvage: [], settings: [] },
      nativeCompletion: { salvage: null, settings: null },
      releases: [], controlledAborts: [],
    };
    let openMessagePorts = 0;
    function targetOf(store: IDBObjectStore): T11LateAckTarget | null {
      const tx = store.transaction;
      if (tx.db.name !== 'crossdefense-player-data' || tx.mode !== 'readwrite') return null;
      const stores = Array.from(tx.objectStoreNames).sort().join(',');
      if (store.name === 'cargoOperations' && stores === 'cargoOperations,pilots,runs') return 'salvage';
      if (store.name === 'settingsOperations' && stores === 'settings,settingsOperations,workspace') return 'settings';
      return null;
    }
    // A task boundary drains queued promise work without an elapsed-time sleep.
    function checkpoint(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel(); openMessagePorts += 2;
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          channel.port1.onmessage = null; channel.port1.onmessageerror = null;
          channel.port1.close(); channel.port2.close(); openMessagePorts -= 2;
        };
        channel.port1.onmessage = () => { close(); resolve(); };
        channel.port1.onmessageerror = () => { close(); reject(Error('Acknowledgment checkpoint failed.')); };
        try { channel.port2.postMessage(null); } catch (error) { close(); reject(error); }
      });
    }
    const wrappedGet = function (this: IDBObjectStore, ...args: Parameters<typeof nativeGet>) {
      const target = targetOf(this);
      if (target) trace.operationIds[target].push(String(args[0]));
      return nativeGet.apply(this, args);
    };
    const wrappedAdd = function (this: IDBObjectStore, ...args: Parameters<typeof nativeAdd>) {
      const target = targetOf(this);
      if (target) {
        const receipt = args[0] as { kind?: string };
        if (target === 'salvage' && receipt.kind !== 'resolve-salvage') throw Error('Unexpected Cargo receipt in acknowledgment fixture.');
        trace.receiptAttempts[target].push(structuredClone(args[0]));
        if (!held.has(target)) {
          const tx = this.transaction, complete = tx.oncomplete;
          if (typeof complete !== 'function' || typeof tx.onabort !== 'function') throw Error('Native transaction observers are unavailable.');
          let record: Held;
          const intercept: NonNullable<IDBTransaction['oncomplete']> = event => {
            event.stopImmediatePropagation(); record.event = event;
            trace.nativeCompletion[target] = { isTrusted: event.isTrusted };
          };
          record = { target, tx, complete, intercept, event: null, released: false };
          held.set(target, record); tx.oncomplete = intercept;
        }
      }
      return nativeAdd.apply(this, args);
    };
    function deliver(target: T11LateAckTarget, outcome: T11LateAckOutcome): void {
      const record = held.get(target);
      if (!record?.event || record.released) throw Error('Expected one unreleased native completion: ' + target);
      const event = record.event;
      record.event = null; record.released = true; record.tx.oncomplete = record.complete;
      trace.releases.push({ target, outcome });
      if (outcome === 'success') record.complete.call(record.tx, event);
      else {
        const abort = new Event('abort', { cancelable: true });
        trace.controlledAborts.push({ target, isTrusted: abort.isTrusted });
        record.tx.dispatchEvent(abort);
      }
    }
    const harness: T11LateAckHarness = {
      read() { return structuredClone(trace); },
      async release(target, outcome) { deliver(target, outcome); await checkpoint(); },
      async restore() {
        const problems: string[] = [], releasedDuringCleanup: T11LateAckTarget[] = [];
        if (IDBObjectStore.prototype.get === wrappedGet || IDBObjectStore.prototype.get === nativeGet) IDBObjectStore.prototype.get = nativeGet;
        else problems.push('The owned native get hook was displaced.');
        if (IDBObjectStore.prototype.add === wrappedAdd || IDBObjectStore.prototype.add === nativeAdd) IDBObjectStore.prototype.add = nativeAdd;
        else problems.push('The owned native add hook was displaced.');
        for (const record of held.values()) {
          if (record.tx.oncomplete !== record.intercept && record.tx.oncomplete !== record.complete) {
            problems.push('The owned completion handler was displaced: ' + record.target); continue;
          }
          record.tx.oncomplete = record.complete;
          if (record.event && !record.released) {
            releasedDuringCleanup.push(record.target);
            try { deliver(record.target, 'success'); } catch (error) { problems.push('Could not release ' + record.target + ': ' + String(error)); }
          }
        }
        await checkpoint();
        const capturedCallbacksRemaining = [...held.values()].filter(record => record.event !== null && !record.released).length;
        if (IDBObjectStore.prototype.get !== nativeGet) problems.push('Native get was not restored.');
        if (IDBObjectStore.prototype.add !== nativeAdd) problems.push('Native add was not restored.');
        if (capturedCallbacksRemaining) problems.push('A captured acknowledgment remains.');
        if (openMessagePorts) problems.push('A MessagePort remains open.');
        held.clear(); delete (window as T11LateAckWindow).__ticket11LateAck;
        if (Object.prototype.hasOwnProperty.call(window, '__ticket11LateAck')) problems.push('The test-owned namespace remains.');
        return { state: 'restored', problems, releasedDuringCleanup, capturedCallbacksRemaining, openMessagePorts };
      },
    };
    // Publish cleanup ownership before installing either prototype hook.
    Object.defineProperty(window, '__ticket11LateAck', { value: harness, configurable: true });
    IDBObjectStore.prototype.get = wrappedGet; IDBObjectStore.prototype.add = wrappedAdd;
  });
}
async function readTicket11LateAckTrace(page: Page): Promise<T11LateAckTrace> {
  return page.evaluate(() => {
    const harness = (window as T11LateAckWindow).__ticket11LateAck;
    if (!harness) throw Error('Acknowledgment harness unavailable.');
    return harness.read();
  });
}
async function releaseTicket11LateAck(page: Page, target: T11LateAckTarget, outcome: T11LateAckOutcome): Promise<void> {
  await page.evaluate(async ({ target, outcome }) => {
    const harness = (window as T11LateAckWindow).__ticket11LateAck;
    if (!harness) throw Error('Acknowledgment harness unavailable.');
    await harness.release(target, outcome);
  }, { target, outcome });
}
async function restoreTicket11LateAckHarness(page: Page): Promise<T11LateAckCleanup> {
  if (page.isClosed()) return { state: 'absent', problems: [], releasedDuringCleanup: [], capturedCallbacksRemaining: 0, openMessagePorts: 0 };
  return page.evaluate(async () => {
    const harness = (window as T11LateAckWindow).__ticket11LateAck;
    if (harness) return harness.restore();
    return { state: 'absent', problems: [], releasedDuringCleanup: [], capturedCallbacksRemaining: 0, openMessagePorts: 0 } as T11LateAckCleanup;
  });
}
async function observeTicket11LateAckUi(page: Page) {
  return page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>('dialog.st-dialog[open]'), active = document.activeElement;
    function readDialog(node: HTMLDialogElement) {
      const get = <T extends HTMLElement = HTMLElement>(id: string): T => {
        const element = node.querySelector<T>('[data-testid="' + id + '"]');
        if (!element) throw Error('Missing Settings control: ' + id);
        return element;
      };
      const drop = get<HTMLInputElement>('binding-drop-0'), music = get<HTMLInputElement>('volume-music');
      const mute = get<HTMLInputElement>('mute-music'), motion = get<HTMLInputElement>('reduced-motion');
      const retry = get<HTMLButtonElement>('retry-settings'), error = get('settings-error');
      return {
        drop: drop.value, music: music.value, musicMuted: mute.checked, reducedMotion: motion.checked,
        dropDisabled: drop.disabled, musicDisabled: music.disabled, muteDisabled: mute.disabled, reducedMotionDisabled: motion.disabled,
        saveDisabled: get<HTMLButtonElement>('save-settings').disabled, retryVisible: !retry.hidden, retryDisabled: retry.disabled,
        closeDisabled: get<HTMLButtonElement>('close-settings').disabled,
        status: get('settings-status').textContent ?? '', errorVisible: !error.hidden, errorText: error.textContent ?? '',
        focusWithinDialog: node.contains(active),
      };
    }
    return {
      openDialogs: document.querySelectorAll('dialog[open]').length,
      appliedReducedMotion: document.documentElement.getAttribute('data-reduced-motion'),
      focusedTestId: active instanceof HTMLElement ? active.dataset.testid ?? null : null,
      focusedTag: active?.tagName ?? null,
      settings: dialog ? readDialog(dialog) : null,
    };
  });
}
type T11LateAckUi = Awaited<ReturnType<typeof observeTicket11LateAckUi>>;
function expectTicket11LateAckDraft(ui: T11LateAckUi, expected: WorkspaceSettings): void {
  expect(ui.openDialogs).toBe(1); expect(ui.settings).not.toBeNull();
  expect(ui.settings).toMatchObject({ drop: 'H', music: String(expected.audio.music.volume), musicMuted: expected.audio.music.muted, reducedMotion: expected.reducedMotion });
}
function expectTicket11LateAckEditable(ui: T11LateAckUi, expected: WorkspaceSettings): void {
  expectTicket11LateAckDraft(ui, expected);
  expect(ui.settings).toMatchObject({ dropDisabled: false, musicDisabled: false, muteDisabled: false, reducedMotionDisabled: false, saveDisabled: false, retryVisible: false, closeDisabled: false, errorVisible: false });
}
function expectTicket11LateAckPending(ui: T11LateAckUi, expected: WorkspaceSettings): void {
  expectTicket11LateAckDraft(ui, expected);
  expect(ui.settings).toMatchObject({ dropDisabled: true, musicDisabled: true, muteDisabled: true, reducedMotionDisabled: true, saveDisabled: true, retryVisible: true, retryDisabled: false, closeDisabled: false });
}

// Replacement cases reproduce the defect; detached cases preserve correct behavior.
for (const outcome of ['success', 'lost-ack'] as const) {
  for (const replacement of [true, false] as const) {
    test('T11 late Settings ' + outcome + (replacement
      ? ' reconciles the replacement modal after Salvage Apply'
      : ' preserves publication and focus without a replacement modal'), async ({ page }, testInfo) => {
      const savedMessage = 'Settings saved for all Pilots on this device.';
      const unacknowledgedMessage = 'Settings were not acknowledged. The previously saved settings remain active.';
      const ownedHandles: Array<{ dispose(): Promise<void> }> = [], cleanupErrors: string[] = [];
      let primaryFailure: { error: unknown } | null = null;
      const own = <T extends { dispose(): Promise<void> }>(handle: T | null): T => {
        if (!handle) throw Error('Expected a connected native UI handle.');
        ownedHandles.push(handle); return handle;
      };
      const disposeOwnedHandles = async (): Promise<string[]> => {
        const errors: string[] = [], batch = ownedHandles.splice(0);
        for (const handle of batch) {
          try { await handle.dispose(); } catch (error) { ownedHandles.push(handle); errors.push(String(error)); }
        }
        return errors;
      };
      try {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await openOutcomeBuild(page);
        const initialNative = await inspectResultsSave(page);
        expect(initialNative.version).toBe(100);
        expect(initialNative.tables.settings).toHaveLength(1);
        expect(initialNative.tables.settingsOperations).toEqual([]);
        const initialSettings = initialNative.tables.settings![0] as T11LateAckSettingsRecord;
        expect(initialSettings.revision).toBe(0); expect(initialSettings.settings.reducedMotion).toBe(false);
        const expectedSettings = structuredClone(initialSettings.settings);
        expectedSettings.bindings.drop = ['KeyH']; expectedSettings.audio.music = { volume: 23, muted: true }; expectedSettings.reducedMotion = true;

        await page.getByTestId('build-salvage').click();
        await expect(page.getByRole('heading', { name: 'Resolve Salvage', exact: true })).toBeVisible();
        await expect(page.getByTestId('salvage-choice')).toHaveCount(2);
        for (const choice of await page.getByTestId('salvage-choice').all()) await choice.selectOption('keep');
        await installTicket11LateAckHarness(page);
        await page.getByTestId('review-salvage').click();
        await expect(page.getByTestId('salvage-confirmation')).toBeVisible();
        await page.getByTestId('confirm-salvage').click();
        await expect.poll(async () => (await readTicket11LateAckTrace(page)).nativeCompletion.salvage).toEqual({ isTrusted: true });
        await expect(page.getByTestId('salvage-confirmation')).toHaveCount(0);
        await expect(page.getByTestId('open-settings')).toBeEnabled();
        await page.getByTestId('open-settings').click();
        const originalDialog = own(await page.locator('dialog.st-dialog[open]').elementHandle());
        await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
        await page.getByTestId('volume-music').fill('23'); await page.getByTestId('mute-music').check(); await page.getByTestId('reduced-motion').check();
        await page.getByTestId('save-settings').click();
        await expect.poll(async () => (await readTicket11LateAckTrace(page)).nativeCompletion.settings).toEqual({ isTrusted: true });
        const bothHeldUi = await observeTicket11LateAckUi(page), bothHeldTrace = await readTicket11LateAckTrace(page);

        await releaseTicket11LateAck(page, 'salvage', 'success');
        await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
        // Wait for the native close handler to remove even the closed old node.
        await expect(page.locator('dialog')).toHaveCount(0);
        const originalDetached = await originalDialog.evaluate(node => !node.isConnected);
        const launcher = page.getByTestId('open-settings');
        await launcher.focus(); await expect(launcher).toBeFocused();
        const buildLauncher = own(await launcher.elementHandle());
        // Legitimate Cargo/Run writes and the host transition precede this baseline.
        const postBuildNative = await inspectResultsSave(page);
        const launcherFocusedBefore = await buildLauncher.evaluate(node => node === document.activeElement);
        if (replacement) await launcher.click();
        const replacementDialog = replacement ? own(await page.locator('dialog.st-dialog[open]').elementHandle()) : null;
        const beforeReleaseUi = await observeTicket11LateAckUi(page), beforeReleaseTrace = await readTicket11LateAckTrace(page);

        await releaseTicket11LateAck(page, 'settings', outcome);
        const afterReleaseNative = await inspectResultsSave(page), afterReleaseUi = await observeTicket11LateAckUi(page);
        const afterReleaseTrace = await readTicket11LateAckTrace(page);
        const sameReplacement = replacementDialog ? await replacementDialog.evaluate(node =>
          node.isConnected && node === document.querySelector('dialog.st-dialog[open]')) : null;
        const launcherFocusedAfter = await buildLauncher.evaluate(node => node === document.activeElement);
        const originalReceipt = beforeReleaseTrace.receiptAttempts.settings[0] as SettingsOperation;
        const settingsId = originalReceipt.operationId;
        const expectedSavedSettings: T11LateAckSettingsRecord = { key: 'settings', revision: initialSettings.revision + 1, settings: expectedSettings };

        // Attach both states before either intended semantic failure.
        await testInfo.attach('late-settings-settlement-observation.json', {
          contentType: 'application/json',
          body: JSON.stringify({
            case: { outcome, replacement, role: replacement ? 'replacement settlement regression' : 'detached publication guard' },
            initialNative, expectedSettings, originalReceipt, bothHeldUi, bothHeldTrace, postBuildNative,
            beforeReleaseUi, beforeReleaseTrace, afterReleaseNative, afterReleaseUi, afterReleaseTrace,
            identityAndFocus: { originalDetached, sameReplacement, launcherFocusedBefore, launcherFocusedAfter },
          }, null, 2),
        });
        expect(originalDetached).toBe(true); expect(launcherFocusedBefore).toBe(true);
        expect(bothHeldUi.appliedReducedMotion).toBe('false'); expect(beforeReleaseUi.appliedReducedMotion).toBe('false');
        expect(beforeReleaseTrace.nativeCompletion).toEqual({ salvage: { isTrusted: true }, settings: { isTrusted: true } });
        expect(beforeReleaseTrace.receiptAttempts.settings).toHaveLength(1);
        expect(beforeReleaseTrace.operationIds.settings).toEqual([settingsId]);
        expect(originalReceipt).toEqual(expect.objectContaining({ operationId: expect.any(String), revision: initialSettings.revision + 1, fingerprint: expect.any(String) }));
        expect(settingsId.length).toBeGreaterThan(0);
        // Check semantic command data independently; retain the actual fingerprint
        // bytes for all later identity/replay comparisons.
        expect(JSON.parse(originalReceipt.fingerprint)).toEqual({ expectedRevision: initialSettings.revision, settings: expectedSettings });
        expect(postBuildNative.tables.settings).toEqual([expectedSavedSettings]);
        expect(postBuildNative.tables.settingsOperations).toEqual([originalReceipt]);
        expect(afterReleaseNative).toEqual(postBuildNative);
        expect(afterReleaseTrace.operationIds.settings).toEqual([settingsId]);
        expect(afterReleaseTrace.receiptAttempts.settings).toEqual([originalReceipt]);
        expect(afterReleaseTrace.releases).toEqual([{ target: 'salvage', outcome: 'success' }, { target: 'settings', outcome }]);
        expect(afterReleaseTrace.controlledAborts).toEqual(outcome === 'lost-ack' ? [{ target: 'settings', isTrusted: false }] : []);
        expect(afterReleaseUi.appliedReducedMotion).toBe(outcome === 'success' ? 'true' : 'false');

        if (replacement) {
          expect(sameReplacement).toBe(true); expectTicket11LateAckDraft(afterReleaseUi, expectedSettings);
          // Primary semantic assertions precede the earlier busy-state symptom.
          if (outcome === 'success') {
            expect(afterReleaseUi.settings, 'The current modal receives the original successful settlement').toMatchObject({
              status: savedMessage, saveDisabled: false, dropDisabled: false, musicDisabled: false, muteDisabled: false,
              reducedMotionDisabled: false, retryVisible: false, closeDisabled: false, errorVisible: false, errorText: '',
            });
          } else {
            expect(afterReleaseUi.settings, 'The current modal receives controlled lost-ack feedback').toMatchObject({
              status: unacknowledgedMessage, errorVisible: true, saveDisabled: true, retryVisible: true, retryDisabled: false, closeDisabled: false,
            });
            expect(afterReleaseUi.settings!.errorText.trim()).not.toBe('');
            expectTicket11LateAckPending(afterReleaseUi, expectedSettings);
          }
          expectTicket11LateAckDraft(beforeReleaseUi, expectedSettings);
          expect(beforeReleaseUi.settings).toMatchObject({
            status: 'Saving settings...', saveDisabled: true, dropDisabled: true, musicDisabled: true, muteDisabled: true,
            reducedMotionDisabled: true, retryVisible: true, retryDisabled: true, closeDisabled: true,
          });
        } else {
          expect(beforeReleaseUi.openDialogs).toBe(0); expect(beforeReleaseUi.settings).toBeNull();
          expect(afterReleaseUi.openDialogs).toBe(0); expect(afterReleaseUi.settings).toBeNull();
          expect(launcherFocusedAfter).toBe(true);
          await launcher.click();
          const freshUi = await observeTicket11LateAckUi(page);
          if (outcome === 'success') expectTicket11LateAckEditable(freshUi, expectedSettings);
          else expectTicket11LateAckPending(freshUi, expectedSettings);
          // Later idle open retains its existing generic-message behavior.
        }

        const currentDialog = replacementDialog ?? own(await page.locator('dialog.st-dialog[open]').elementHandle());
        let acknowledgedNative = afterReleaseNative, acknowledgedTrace = afterReleaseTrace;
        if (outcome === 'lost-ack') {
          await page.getByTestId('retry-settings').click();
          await expect(page.getByTestId('settings-status')).toHaveText(savedMessage);
          const retriedUi = await observeTicket11LateAckUi(page), retriedNative = await inspectResultsSave(page);
          const retriedTrace = await readTicket11LateAckTrace(page);
          await testInfo.attach('late-settings-explicit-retry.json', {
            contentType: 'application/json',
            body: JSON.stringify({ originalReceipt, beforeRetryNative: afterReleaseNative, retriedNative, beforeRetryTrace: afterReleaseTrace, retriedTrace, retriedUi }, null, 2),
          });
          expectTicket11LateAckEditable(retriedUi, expectedSettings);
          expect(retriedUi.settings!.status).toBe(savedMessage); expect(retriedUi.appliedReducedMotion).toBe('true');
          expect(retriedNative).toEqual(postBuildNative);
          expect(retriedTrace).toEqual({ ...afterReleaseTrace, operationIds: { ...afterReleaseTrace.operationIds, settings: [settingsId, settingsId] } });
          expect(retriedTrace.receiptAttempts.settings).toEqual([originalReceipt]);
          acknowledgedNative = retriedNative; acknowledgedTrace = retriedTrace;
        } else expectTicket11LateAckEditable(await observeTicket11LateAckUi(page), expectedSettings);
        expect(await currentDialog.evaluate(node => node.isConnected && node === document.querySelector('dialog.st-dialog[open]'))).toBe(true);
        await page.getByTestId('close-settings').click();
        await expect(page.locator('dialog')).toHaveCount(0); await expect(launcher).toBeFocused();
        expect(await buildLauncher.evaluate(node => node.isConnected && node === document.activeElement)).toBe(true);

        // A later ordinary draft remains disposable while idle.
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
        await page.getByTestId('volume-music').fill('31');
        await expect(page.getByTestId('settings-status')).toHaveText('Unsaved changes.');
        const laterUnsavedUi = await observeTicket11LateAckUi(page);
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog')).toHaveCount(0); await expect(launcher).toBeFocused();
        await page.keyboard.press('Enter');
        const reopenedUi = await observeTicket11LateAckUi(page), afterCancellationNative = await inspectResultsSave(page);
        const afterCancellationTrace = await readTicket11LateAckTrace(page);
        await testInfo.attach('late-settings-cancelled-later-draft.json', {
          contentType: 'application/json',
          body: JSON.stringify({ laterUnsavedUi, reopenedUi, acknowledgedNative, afterCancellationNative, acknowledgedTrace, afterCancellationTrace }, null, 2),
        });
        expect(laterUnsavedUi.settings!.music).toBe('31'); expectTicket11LateAckEditable(reopenedUi, expectedSettings);
        expect(reopenedUi.appliedReducedMotion).toBe('true');
        expect(afterCancellationNative).toEqual(acknowledgedNative); expect(afterCancellationTrace).toEqual(acknowledgedTrace);
        await page.getByTestId('close-settings').click();
        await expect(page.locator('dialog')).toHaveCount(0); await expect(launcher).toBeFocused();

        // Restore hooks and dispose handles before reload could conceal a leak.
        const preReloadCleanup = await restoreTicket11LateAckHarness(page);
        expect(preReloadCleanup).toEqual({ state: 'restored', problems: [], releasedDuringCleanup: [], capturedCallbacksRemaining: 0, openMessagePorts: 0 });
        expect(await disposeOwnedHandles(), 'Owned UI handles are disposed before reload').toEqual([]);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
        const reloadedNative = await inspectResultsSave(page);
        await page.getByTestId('open-settings').click();
        const reloadedUi = await observeTicket11LateAckUi(page);
        await testInfo.attach('late-settings-reload.json', {
          contentType: 'application/json',
          body: JSON.stringify({ preReloadCleanup, acknowledgedNative, reloadedNative, reloadedUi }, null, 2),
        });
        expect(reloadedNative).toEqual(acknowledgedNative);
        expect(reloadedNative.tables.settings).toEqual([expectedSavedSettings]);
        expect(reloadedNative.tables.settingsOperations).toEqual([originalReceipt]);
        expectTicket11LateAckEditable(reloadedUi, expectedSettings); expect(reloadedUi.appliedReducedMotion).toBe('true');
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog')).toHaveCount(0); await expect(page.getByTestId('open-settings')).toBeFocused();
      } catch (error) { primaryFailure = { error }; }
      finally {
        let finalCleanup: T11LateAckCleanup | null = null;
        try {
          finalCleanup = await restoreTicket11LateAckHarness(page);
          if (finalCleanup.problems.length || finalCleanup.capturedCallbacksRemaining || finalCleanup.openMessagePorts) cleanupErrors.push(JSON.stringify(finalCleanup));
        } catch (error) { cleanupErrors.push('Native hook cleanup: ' + String(error)); }
        cleanupErrors.push(...await disposeOwnedHandles());
        try {
          await testInfo.attach('late-settings-owned-cleanup.json', {
            contentType: 'application/json',
            body: JSON.stringify({ primaryFailurePresent: primaryFailure !== null, finalCleanup, remainingOwnedHandles: ownedHandles.length, cleanupErrors }, null, 2),
          });
        } catch (error) { cleanupErrors.push('Cleanup evidence: ' + String(error)); }
      }
      if (primaryFailure) throw primaryFailure.error;
      expect(cleanupErrors, 'All owned acknowledgment resources are cleaned').toEqual([]);
      expect(ownedHandles).toHaveLength(0);
    });
  }
}
