import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { combatBuild, combatPack } from '../combatFixture';
import { openSavedBuild } from '../buildBrowserFixture';
import { installPreRunTestClock } from '../preRunBrowserPlayer';
import { inspectResultsSave } from '../resultsBrowserFixture';

type Mode = 'combat' | 'pre-run';
const boardId = (mode: Mode) => mode === 'combat' ? 'combat-board' : 'pre-run-board';
const pauseId = (mode: Mode) => mode === 'combat' ? 'pause-combat' : 'pause-salvage';
const resumeId = (mode: Mode) => mode === 'combat' ? 'resume-combat' : 'resume-salvage';
const noticeId = (mode: Mode) => mode === 'combat' ? 'combat-pause' : 'pause-message';
async function frame(page: Page, ms = 1000 / 60): Promise<void> {
  await page.evaluate(ms => (window as unknown as { __buildTestFrame: (ms: number) => Promise<void> }).__buildTestFrame(ms), ms);
}
async function launch(page: Page, mode: Mode): Promise<void> {
  await installPreRunTestClock(page);
  if (mode === 'combat') {
    await openSavedBuild(page, combatBuild(), combatPack());
    await page.getByTestId('choose-map').click(); await page.getByTestId('start-attempt').click();
  } else {
    await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    await page.getByLabel('Nickname').fill('Keyboard Pilot'); await page.getByTestId('create-pilot').click();
    await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('start-run').click(); await page.getByTestId('begin-salvage').click();
  }
  await expect(page.getByTestId(boardId(mode))).toBeVisible(); await frame(page, 0);
}
async function inputState(page: Page) {
  return page.evaluate(() => {
    const active = document.querySelector<HTMLElement>('[data-testid="active-piece"]')!;
    const hold = document.querySelector<HTMLElement>('[data-testid="hold-piece"] > [data-piece-id]');
    return { piece: active.dataset.pieceId, x: active.dataset.pivotX, y: active.dataset.pivotY,
      hold: hold?.dataset.pieceId ?? null, holdLabel: document.querySelector('[data-testid="hold-label"]')!.textContent,
      threat: document.querySelector('[data-testid="combat-threat"]')?.textContent ?? null,
      locked: document.querySelector('[data-testid="locked-cells"]')!.childElementCount };
  });
}
async function resume(page: Page, mode: Mode, key?: 'Enter' | 'Space'): Promise<void> {
  const before = await inputState(page);
  if (key) { await page.getByTestId(resumeId(mode)).focus(); await page.keyboard.press(key); }
  else await page.getByTestId(resumeId(mode)).click();
  await frame(page, 0);
  for (const label of ['3', '2', '1']) {
    await expect(page.getByTestId(noticeId(mode))).toContainText(new RegExp('resuming in ' + label, 'i'));
    expect(await inputState(page)).toEqual(before);
    await frame(page, 1000);
  }
  await expect(page.getByTestId(resumeId(mode))).toBeHidden();
  expect(await inputState(page)).toEqual(before);
  await frame(page, 0); // Honor Combat's accepted resetClock baseline.
}
for (const mode of ['combat', 'pre-run'] as const) {
  test('CS11 native Enter and Space activate ' + mode + ' Settings and Resume when both are mapped to Pause', async ({ page }) => {
    await launch(page, mode); await page.getByTestId('open-settings').click();
    await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
    await page.getByTestId('binding-pause-0').focus(); await page.keyboard.press('Enter');
    await page.getByTestId('binding-pause-1').focus(); await page.keyboard.press('Space');
    await page.getByTestId('save-settings').click(); await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
    await page.getByTestId('close-settings').click();
    for (const key of ['Enter', 'Space'] as const) {
      await page.getByTestId('open-settings').focus(); await page.keyboard.press(key);
      await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
      await page.keyboard.press('Escape'); await expect(page.getByTestId('open-settings')).toBeFocused();
      await resume(page, mode, key);
      await page.getByTestId(boardId(mode)).focus(); await page.keyboard.press(key);
      await expect(page.getByTestId(resumeId(mode))).toBeVisible();
      const before = await inputState(page);
      const clock = mode === 'combat' ? await page.getByTestId('combat-tick').innerText() : null;
      await frame(page, 5000); expect(await inputState(page)).toEqual(before);
      if (clock !== null) {
        await expect(page.getByTestId('combat-tick')).toHaveText(clock); await expect(page.getByTestId('board-tick')).toHaveText(clock);
      }
    }
  });

  test('Settings native close preserves newer ' + mode + ' Resume focus for Enter and Space', async ({ page }, testInfo) => {
    await launch(page, mode); await page.getByTestId('open-settings').click();
    await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
    await page.getByTestId('binding-pause-0').focus(); await page.keyboard.press('Enter');
    await page.getByTestId('binding-pause-1').focus(); await page.keyboard.press('Space');
    await page.getByTestId('save-settings').click(); await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
    for (const key of ['Enter', 'Space'] as const) {
      if (key === 'Space') await page.getByTestId('open-settings').click();
      const before = await inputState(page);
      // Close and a later focus move share one browser task; await the real deferred close event.
      const observation = await page.evaluate(resumeTestId => new Promise<{
        returnedToInvoker: boolean; movedToResume: boolean; trustedClose: boolean;
        focusAtClose: string | null; remainingDialogs: number; oldDialogConnected: boolean;
      }>(resolve => {
        const dialog = document.querySelector<HTMLDialogElement>('dialog[open]')!;
        const invoker = document.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!;
        const target = document.querySelector<HTMLButtonElement>('[data-testid="' + resumeTestId + '"]')!;
        let returnedToInvoker = false, movedToResume = false;
        dialog.addEventListener('close', event => resolve({
          returnedToInvoker, movedToResume, trustedClose: event.isTrusted,
          focusAtClose: document.activeElement?.getAttribute('data-testid') ?? null,
          remainingDialogs: document.querySelectorAll('dialog[open]').length,
          oldDialogConnected: dialog.isConnected,
        }), { once: true });
        dialog.querySelector<HTMLButtonElement>('[data-testid="close-settings"]')!.click();
        returnedToInvoker = document.activeElement === invoker;
        target.focus(); movedToResume = document.activeElement === target;
      }), resumeId(mode));
      await testInfo.attach('native-close-focus-' + key + '.json', {
        body: JSON.stringify({ mode, key, ...observation }, null, 2), contentType: 'application/json',
      });
      expect(observation).toEqual({
        returnedToInvoker: true, movedToResume: true, trustedClose: true,
        focusAtClose: resumeId(mode), remainingDialogs: 0, oldDialogConnected: false,
      });
      await expect(page.getByTestId(resumeId(mode))).toBeFocused();
      expect(await inputState(page)).toEqual(before);
      await resume(page, mode, key);
    }
  });

  test('CS11 Shift+Tab traverses active ' + mode + ' without Hold and standalone Shift still holds once', async ({ page }) => {
    await launch(page, mode); await page.getByTestId(boardId(mode)).focus();
    const before = await inputState(page);
    await page.keyboard.press('Shift+Tab'); await expect(page.getByTestId(boardId(mode))).not.toBeFocused();
    await frame(page); expect(await inputState(page)).toEqual(before);
    await page.getByTestId(boardId(mode)).focus(); await page.keyboard.press('ShiftLeft'); await frame(page);
    const held = await inputState(page);
    expect(held.piece).not.toBe(before.piece); expect(held.hold).toBe(before.piece);
    expect(held.holdLabel).toContain('USED'); expect(held.threat).toBe(before.threat);
    await page.keyboard.up('ShiftLeft'); await frame(page);
    expect((await inputState(page)).piece).toBe(held.piece);
  });
}
test('CS11 native Escape cancels Combat Abandon and restores focus without resuming either clock', async ({ page }) => {
  await launch(page, 'combat'); await frame(page);
  const clock = await page.getByTestId('combat-tick').innerText(), before = await inputState(page);
  await page.getByTestId('abandon-combat').click();
  await expect(page.getByTestId('combat-abandon-confirmation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('combat-abandon-confirmation')).toHaveCount(0);
  await expect(page.getByTestId('abandon-combat')).toBeFocused();
  await expect(page.getByTestId('resume-combat')).toBeVisible();
  await frame(page, 5000); expect(await inputState(page)).toEqual(before);
  await expect(page.getByTestId('combat-tick')).toHaveText(clock); await expect(page.getByTestId('board-tick')).toHaveText(clock);
});

for (const mode of ['combat', 'pre-run'] as const) {
  test('CS11 remapped Shift in ' + mode + ' ignores chords and discards held candidates across Settings, Pause and native blur', async ({ page, context }) => {
    await launch(page, mode); await page.getByTestId('open-settings').click();
    await page.getByRole('button', { name: 'Clear Hold binding 2', exact: true }).click();
    await page.getByTestId('binding-drop-1').focus(); await page.keyboard.press('ShiftLeft');
    await page.getByTestId('save-settings').click(); await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
    await page.getByTestId('close-settings').click(); await resume(page, mode);
    await page.getByTestId(boardId(mode)).focus(); const initial = await inputState(page);
    await page.keyboard.press('Shift+Tab'); await frame(page);
    expect(await inputState(page)).toEqual(initial);
    await page.getByTestId(boardId(mode)).focus();
    await page.keyboard.down('ShiftLeft'); await page.keyboard.down('ShiftLeft'); await page.keyboard.up('ShiftLeft'); await frame(page);
    const dropped = await inputState(page); expect(dropped.piece).not.toBe(initial.piece);
    if (mode === 'combat') expect(dropped.threat).toBe('1'); else expect(dropped.locked).toBe(4);
    expect(dropped.hold).toBeNull();

    await page.getByTestId(boardId(mode)).focus(); await page.keyboard.down('ShiftLeft');
    await page.getByTestId('open-settings').click(); await page.keyboard.up('ShiftLeft');
    await page.getByTestId('close-settings').click(); await resume(page, mode); await frame(page);
    expect(await inputState(page)).toEqual(dropped);

    await page.getByTestId(boardId(mode)).focus(); await page.keyboard.down('ShiftLeft');
    await page.getByTestId(pauseId(mode)).click(); await resume(page, mode);
    await page.keyboard.up('ShiftLeft'); await frame(page);
    expect(await inputState(page)).toEqual(dropped);

    // Actual native focus loss, separate from the controlled hidden-platform scenario.
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setFocusEmulationEnabled', { enabled: false });
    await page.getByTestId(boardId(mode)).focus(); await page.keyboard.down('ShiftLeft');
    const foreground = await context.newPage();
    try {
      await foreground.goto('about:blank'); await foreground.bringToFront();
      await expect.poll(() => page.evaluate(() => document.hasFocus())).toBe(false);
      await expect(page.getByTestId(noticeId(mode))).toContainText('lost focus');
    } finally {
      await page.bringToFront(); await foreground.close();
    }
    await resume(page, mode); await page.keyboard.up('ShiftLeft'); await frame(page);
    expect(await inputState(page)).toEqual(dropped);
  });
}

test('Settings closes and reopens without waiting for the native close event to release modal ownership', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('open-settings').click();
  // Two public UI actions in one browser task expose delayed native close-event delivery.
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-testid="close-settings"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-testid="open-settings"]')!.click();
  });
  await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
  await expect(page.getByTestId('binding-left-0')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('open-settings')).toBeFocused();
});

for (const mode of ['combat', 'pre-run'] as const) {
  test('continuous remaps in ' + mode + ' explain incompatible Shift and retain held movement and soft drop', async ({ page }) => {
    await launch(page, mode); await page.getByTestId('open-settings').click();
    await page.getByRole('button', { name: 'Clear Hold binding 2', exact: true }).click();
    await page.getByRole('button', { name: 'Clear Hold binding 2', exact: true }).click();
    for (const [action, label, key] of [['left', 'Move left', 'a'], ['right', 'Move right', 'd'], ['down', 'Soft drop', 's']]) {
      await page.getByTestId('binding-' + action + '-0').focus(); await page.keyboard.press('ShiftLeft');
      await expect(page.getByTestId('settings-error')).toContainText(label!);
      await expect(page.getByTestId('settings-error')).toContainText('Shift');
      await expect(page.getByTestId('save-settings')).toBeDisabled();
      await page.keyboard.press(key!); await expect(page.getByTestId('save-settings')).toBeEnabled();
    }
    await page.getByTestId('save-settings').click(); await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
    await page.getByTestId('close-settings').click(); await resume(page, mode);
    await page.getByTestId(boardId(mode)).focus();
    const start = await inputState(page);
    await page.keyboard.down('a'); await frame(page);
    const leftOnce = await inputState(page); expect(Number(leftOnce.x)).toBe(Number(start.x) - 1);
    for (let tick = 0; tick < 12; tick++) await frame(page);
    expect(Number((await inputState(page)).x)).toBeLessThan(Number(leftOnce.x));
    await page.keyboard.up('a'); await frame(page);
    const released = await inputState(page);
    for (let tick = 0; tick < 5; tick++) await frame(page);
    expect((await inputState(page)).x).toBe(released.x);

    await page.keyboard.down('d'); await frame(page);
    const rightOnce = await inputState(page); expect(Number(rightOnce.x)).toBe(Number(released.x) + 1);
    for (let tick = 0; tick < 12; tick++) await frame(page);
    expect(Number((await inputState(page)).x)).toBeGreaterThan(Number(rightOnce.x));
    await page.keyboard.up('d'); await frame(page);

    const beforeDrop = await inputState(page);
    await page.keyboard.down('s');
    for (let tick = 0; tick < 12; tick++) await frame(page);
    expect(Number((await inputState(page)).y)).toBeGreaterThan(Number(beforeDrop.y));
    await page.keyboard.up('s'); await frame(page);
    const releasedDrop = await inputState(page);
    for (let tick = 0; tick < 5; tick++) await frame(page);
    expect((await inputState(page)).y).toBe(releasedDrop.y);
  });
}

async function openSettingsWhenLoading(page: Page, message: string): Promise<void> {
  await page.evaluate(message => {
    const root = document.querySelector<HTMLElement>('#app')!;
    const observer = new MutationObserver(() => {
      const loading = root.querySelector<HTMLElement>('[data-testid="loading"]');
      const launcher = root.querySelector<HTMLButtonElement>('[data-testid="open-settings"]');
      if (loading?.textContent !== message || !launcher) return;
      observer.disconnect();
      // Controlled race scheduling through the actual Loading screen's public UI.
      launcher.click();
      const volume = document.querySelector<HTMLInputElement>('[data-testid="volume-music"]')!;
      volume.value = '23'; volume.dispatchEvent(new Event('input', { bubbles: true }));
    });
    observer.observe(root, { childList: true, subtree: true });
  }, message);
}
async function visiblePlayState(page: Page) {
  return { input: await inputState(page), facts: await page.evaluate(() => {
    const ids = ['active-piece', 'locked-cells', 'hold-piece', 'next-pieces',
      'combat-tick', 'board-tick', 'combat-threat', 'player-hull', 'player-shield',
      'enemy-hull', 'enemy-shield', 'combat-collected', 'salvage-quota', 'collected-total', 'lines-cleared'];
    return Object.fromEntries(ids.map(id => [id, document.querySelector('[data-testid="' + id + '"]')?.innerHTML ?? null]));
  }) };
}
for (const mode of ['combat', 'pre-run'] as const) {
  test('Settings opened during ' + mode + ' loading pauses the new host until explicit 3-2-1 Resume', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); await installPreRunTestClock(page);
    if (mode === 'combat') {
      await openSavedBuild(page, combatBuild(), combatPack());
      await page.getByTestId('choose-map').click(); await expect(page.getByTestId('start-attempt')).toBeVisible();
      await openSettingsWhenLoading(page, 'Opening the acknowledged combat Attempt...');
      await page.getByTestId('start-attempt').click();
    } else {
      await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
      await page.getByLabel('Nickname').fill('Loading Settings Pilot'); await page.getByTestId('create-pilot').click();
      await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByTestId('start-run').click(); await expect(page.getByTestId('begin-salvage')).toBeVisible();
      await openSettingsWhenLoading(page, 'Opening the saved Pre-Run pool...');
      await page.getByTestId('begin-salvage').click();
    }
    const dialog = page.getByRole('dialog', { name: 'Settings and controls' });
    await expect(page.getByTestId(boardId(mode))).toBeVisible(); await expect(page.getByTestId('loading')).toHaveCount(0);
    await expect(dialog).toBeVisible(); await expect(page.getByTestId('binding-left-0')).toBeFocused();
    await expect(page.getByTestId('volume-music')).toHaveValue('23');
    await expect(page.getByTestId('settings-status')).toHaveText('Unsaved changes.');
    const before = await visiblePlayState(page);
    await frame(page, 0);
    // Ordinary frames expose the race; a single long frame could mask it with the lag safety pause.
    for (let tick = 0; tick < 60; tick++) await frame(page);
    expect(await visiblePlayState(page)).toEqual(before);
    await expect(dialog).toBeVisible(); await expect(page.getByTestId(noticeId(mode))).toContainText('Settings');
    await expect(page.getByTestId('binding-left-0')).toBeFocused();
    await expect(page.getByTestId('volume-music')).toHaveValue('23');

    // The Loading invoker was disconnected by mounting; no replacement-invoker focus policy is invented.
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId(resumeId(mode))).toBeVisible();
    for (let tick = 0; tick < 60; tick++) await frame(page);
    expect(await visiblePlayState(page)).toEqual(before);

    await page.getByTestId(resumeId(mode)).click(); await frame(page, 0);
    for (const label of ['3', '2', '1']) {
      await expect(page.getByTestId(noticeId(mode))).toContainText(new RegExp('resuming in ' + label, 'i'));
      expect(await visiblePlayState(page)).toEqual(before);
      await frame(page, 1000); expect(await visiblePlayState(page)).toEqual(before);
    }
    await expect(page.getByTestId(resumeId(mode))).toBeHidden();
    await expect(page.getByTestId(boardId(mode))).toBeFocused();
    await frame(page, 0); // Honor Combat's existing resetClock baseline.
    await page.keyboard.press('ArrowLeft'); await frame(page);
    expect(Number((await inputState(page)).x)).toBe(Number(before.input.x) - 1);
    if (mode === 'combat') {
      await expect(page.getByTestId('combat-tick')).toHaveText(String(Number(before.facts['combat-tick']) + 1));
      await expect(page.getByTestId('board-tick')).toHaveText(String(Number(before.facts['board-tick']) + 1));
    }
  });
}

type NativeMountFocusSample = {
  kind: 'blur' | 'visibility' | 'loading' | 'mounted';
  focused: boolean; hidden: boolean; board: boolean; trusted: boolean | null;
};
/** Observe public DOM and native signals without changing application state. */
async function observeNativeMountFocus(page: Page, mode: Mode, message: string) {
  const handle = await page.evaluateHandle(({ board, message }) => {
    const root = document.querySelector<HTMLElement>('#app')!, samples: NativeMountFocusSample[] = [];
    const hasBoard = () => !!root.querySelector('[data-testid="' + board + '"]');
    const record = (kind: NativeMountFocusSample['kind'], event?: Event) => {
      samples.push({ kind, focused: document.hasFocus(), hidden: document.hidden,
        board: hasBoard(), trusted: event?.isTrusted ?? null });
    };
    const onBlur = (event: FocusEvent) => record('blur', event);
    const onVisibility = (event: Event) => record('visibility', event);
    let sawLoading = false, sawMount = false;
    const observer = new MutationObserver(() => {
      const loading = root.querySelector<HTMLElement>('[data-testid="loading"]');
      if (!sawLoading && loading?.textContent === message) { sawLoading = true; record('loading'); }
      if (!sawMount && hasBoard()) { sawMount = true; record('mounted'); }
    });
    window.addEventListener('blur', onBlur); document.addEventListener('visibilitychange', onVisibility);
    observer.observe(root, { childList: true, subtree: true });
    return { samples, stop() {
      observer.disconnect(); window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    } };
  }, { board: boardId(mode), message });
  return { samples: () => handle.evaluate(probe => probe.samples), async dispose() {
    try { await handle.evaluate(probe => probe.stop()); } finally { await handle.dispose(); }
  } };
}

for (const mode of ['combat', 'pre-run'] as const) {
  test('T11 native focus at mount pauses ' + mode + ' until explicit 3-2-1 Resume', async ({ page, context, browser }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 }); await installPreRunTestClock(page);
    const trigger = mode === 'combat' ? 'start-attempt' : 'begin-salvage';
    const loadingMessage = mode === 'combat' ? 'Opening the acknowledged combat Attempt...' : 'Opening the saved Pre-Run pool...';
    if (mode === 'combat') {
      await openSavedBuild(page, combatBuild(), combatPack()); await page.getByTestId('choose-map').click();
    } else {
      await page.goto('/'); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
      await page.getByLabel('Nickname').fill('Native mount focus Pilot'); await page.getByTestId('create-pilot').click();
      await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByTestId('start-run').click();
    }
    await expect(page.getByTestId(trigger)).toBeEnabled(); await expect(page.getByTestId(boardId(mode))).toHaveCount(0);
    const browserSession = await browser.newBrowserCDPSession();
    let pageSession: CDPSession | undefined, foregroundTarget: string | undefined;
    let observation: Awaited<ReturnType<typeof observeNativeMountFocus>> | undefined;
    try {
      pageSession = await context.newCDPSession(page);
      await pageSession.send('Emulation.setFocusEmulationEnabled', { enabled: false }); await page.bringToFront();
      await expect.poll(() => page.evaluate(() => ({
        focused: document.hasFocus(), hidden: document.hidden, safe: innerWidth >= 1280 && innerHeight >= 720,
      }))).toEqual({ focused: true, hidden: false, safe: true });
      observation = await observeNativeMountFocus(page, mode, loadingMessage);
      const { targetInfo } = await pageSession.send('Target.getTargetInfo');
      const originalWindow = await browserSession.send('Browser.getWindowForTarget', { targetId: targetInfo.targetId });
      // A small separate native window avoids background-tab and full-occlusion pauses.
      const created = await browserSession.send('Target.createTarget', {
        url: 'about:blank', newWindow: true, background: false, width: 420, height: 320,
        ...(targetInfo.browserContextId ? { browserContextId: targetInfo.browserContextId } : {}),
      });
      foregroundTarget = created.targetId;
      const foregroundWindow = await browserSession.send('Browser.getWindowForTarget', { targetId: foregroundTarget });
      expect(foregroundWindow.windowId).not.toBe(originalWindow.windowId);
      await browserSession.send('Browser.setWindowBounds', {
        windowId: foregroundWindow.windowId, bounds: { left: 0, top: 0, width: 420, height: 320 },
      });
      await browserSession.send('Target.activateTarget', { targetId: foregroundTarget });
      await expect.poll(() => page.evaluate(() => ({
        focused: document.hasFocus(), hidden: document.hidden, safe: innerWidth >= 1280 && innerHeight >= 720,
      }))).toEqual({ focused: false, hidden: false, safe: true });
      await expect.poll(async () => (await observation!.samples()).filter(sample => sample.kind === 'blur').length).toBeGreaterThan(0);
      await expect(page.getByTestId(boardId(mode))).toHaveCount(0);
      // Native blur precedes this controlled public-UI invocation. Loading and mount retain its
      // visible/unfocused state; this does not claim blur first happened after Loading began.
      await page.evaluate(id => {
        const button = document.querySelector<HTMLButtonElement>('[data-testid="' + id + '"]');
        if (!button || button.disabled) throw new Error('The public gameplay entry button is unavailable.');
        button.click();
      }, trigger);
      await expect(page.getByTestId(boardId(mode))).toBeVisible(); await expect(page.getByTestId('loading')).toHaveCount(0);
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      expect(await page.evaluate(() => ({
        focused: document.hasFocus(), hidden: document.hidden, safe: innerWidth >= 1280 && innerHeight >= 720,
      }))).toEqual({ focused: false, hidden: false, safe: true });
      const mountedSamples = await observation.samples();
      const blurIndex = mountedSamples.findIndex(sample => sample.kind === 'blur');
      const loadingIndex = mountedSamples.findIndex(sample => sample.kind === 'loading');
      const mountIndex = mountedSamples.findIndex(sample => sample.kind === 'mounted');
      expect(blurIndex).toBeGreaterThanOrEqual(0); expect(loadingIndex).toBeGreaterThan(blurIndex);
      expect(mountIndex).toBeGreaterThan(loadingIndex);
      expect(mountedSamples[loadingIndex]).toMatchObject({ focused: false, hidden: false, board: false });
      expect(mountedSamples[mountIndex]).toMatchObject({ focused: false, hidden: false, board: true });
      const before = await visiblePlayState(page), saved = await inspectResultsSave(page);
      expect(before.input.hold).toBeNull(); expect(before.input.locked).toBe(0);
      await frame(page, 0);
      // Ordinary frames prevent the long-frame safety pause from masking the missing guard.
      for (let tick = 0; tick < 60; tick++) await frame(page);
      const criticalSamples = await observation.samples();
      for (const sample of criticalSamples) {
        expect(sample.hidden, JSON.stringify(sample)).toBe(false);
        if (sample.kind === 'blur') {
          expect(sample.trusted).toBe(true); expect(sample.focused).toBe(false);
          expect(sample.board).toBe(false); // A later host-visible blur would mask this boundary.
        }
      }
      expect(await page.evaluate(() => ({ focused: document.hasFocus(), hidden: document.hidden })))
        .toEqual({ focused: false, hidden: false });
      const after = await visiblePlayState(page);
      await testInfo.attach('native-focus-mount-state', {
        body: Buffer.from(JSON.stringify({ mode, samples: criticalSamples, before, after }, null, 2)),
        contentType: 'application/json',
      });
      expect(after).toEqual(before);
      await expect(page.getByTestId(noticeId(mode))).toContainText('lost focus');
      await expect(page.getByTestId(resumeId(mode))).toBeVisible();
      if (mode === 'combat') {
        await expect(page.getByTestId('combat-tick')).toHaveText(before.facts['combat-tick']!);
        await expect(page.getByTestId('board-tick')).toHaveText(before.facts['board-tick']!);
      }
      // Native focus returning alone leaves explicit Resume.
      await page.bringToFront();
      await expect.poll(() => page.evaluate(() => ({ focused: document.hasFocus(), hidden: document.hidden })))
        .toEqual({ focused: true, hidden: false });
      for (let tick = 0; tick < 60; tick++) await frame(page);
      expect(await visiblePlayState(page)).toEqual(before); await expect(page.getByTestId(resumeId(mode))).toBeVisible();
      await page.getByTestId(boardId(mode)).focus(); await page.keyboard.down('ArrowRight'); await page.keyboard.press('c');
      for (let tick = 0; tick < 15; tick++) await frame(page);
      expect(await visiblePlayState(page)).toEqual(before);
      await page.getByTestId(resumeId(mode)).click(); await frame(page, 0);
      for (const label of ['3', '2', '1']) {
        await expect(page.getByTestId(noticeId(mode))).toContainText(new RegExp('resuming in ' + label, 'i'));
        expect(await visiblePlayState(page)).toEqual(before);
        await frame(page, 1000); expect(await visiblePlayState(page)).toEqual(before);
      }
      await expect(page.getByTestId(resumeId(mode))).toBeHidden(); await expect(page.getByTestId(noticeId(mode))).toBeHidden();
      await expect(page.getByTestId(boardId(mode))).toBeFocused();
      await frame(page, 0); // Existing Combat resetClock baseline.
      await page.keyboard.up('ArrowRight');
      for (let tick = 0; tick < 15; tick++) await frame(page);
      expect(await inputState(page)).toEqual(before.input);
      if (mode === 'combat') {
        await expect(page.getByTestId('combat-tick')).toHaveText(String(Number(before.facts['combat-tick']) + 15));
        await expect(page.getByTestId('board-tick')).toHaveText(String(Number(before.facts['board-tick']) + 15));
      }
      await page.keyboard.press('ArrowLeft'); await frame(page);
      expect(Number((await inputState(page)).x)).toBe(Number(before.input.x) - 1);
      if (mode === 'combat') {
        await expect(page.getByTestId('combat-tick')).toHaveText(String(Number(before.facts['combat-tick']) + 16));
        await expect(page.getByTestId('board-tick')).toHaveText(String(Number(before.facts['board-tick']) + 16));
      }
      // Startup acknowledgment preceded this baseline; focus/input-only frames grant nothing.
      expect(await inspectResultsSave(page)).toEqual(saved);
    } finally {
      const cleanupErrors: string[] = [];
      for (const cleanup of [
        async () => { if (foregroundTarget) {
          const result = await browserSession.send('Target.closeTarget', { targetId: foregroundTarget });
          if (!result.success) throw new Error('Native focus target did not close.');
        } },
        () => page.bringToFront(), () => page.keyboard.up('ArrowRight'), () => observation?.dispose(),
        () => pageSession?.detach(), () => browserSession.detach(),
      ]) {
        try { await cleanup(); } catch (error) { cleanupErrors.push(String(error)); }
      }
      expect(cleanupErrors, 'Native focus harness cleanup').toEqual([]);
    }
  });
}
