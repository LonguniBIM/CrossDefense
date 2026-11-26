import { expect, test } from '@playwright/test';
import type { SaveSettingsCommand, SettingsRepository, SettingsState } from '../../src/application/workspace/SettingsRepository';
import { inspectReviewSave } from '../reviewBrowserFixture';

// Development-only public repository scenarios import Vite source modules.
// The production selection remains explicit and excludes this file.
for (const shape of ['sparse-only', 'trailing-hole'] as const) {
  test('native Settings rejects ' + shape + ' without poisoning receipt history', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    await page.getByTestId('open-settings').click();
    await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('p');
    await page.getByTestId('save-settings').click();
    await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
    await page.getByTestId('close-settings').click();

    const before = await inspectReviewSave(page), priorReceipts = before.tables.settingsOperations!;
    expect(priorReceipts).toHaveLength(1);
    const operationId = 'ticket11-sparse-native-' + shape;
    const attempt = await page.evaluate(async ({ shape, operationId }) => {
      const load = (path: string) => import(path);
      const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
      const repository: SettingsRepository = new DexieWorkspaceRepository();
      const before = await repository.getSettings(), invalid = structuredClone(before.settings);
      // Construct holes inside the page; runner serialization must not alter this malformed input.
      if (shape === 'sparse-only') invalid.bindings.drop = new Array<string>(1);
      else { const codes = new Array<string>(2); codes[0] = 'KeyH'; invalid.bindings.drop = codes; }
      const summarize = (error: unknown) => ({
        code: typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null,
        message: error instanceof Error ? error.message : String(error),
      });
      let saveError: ReturnType<typeof summarize> | null = null, readError: ReturnType<typeof summarize> | null = null;
      let after: SettingsState | null = null;
      try { await repository.saveSettings({ operationId, expectedRevision: before.revision, settings: invalid }); }
      catch (error) { saveError = summarize(error); }
      try { after = await repository.getSettings(); }
      catch (error) { readError = summarize(error); }
      return { before, after, saveError, readError };
    }, { shape, operationId });

    const afterAttempt = await inspectReviewSave(page);
    expect(attempt.before.revision).toBe(1);
    // Report both acknowledgment and immediate history-read outcomes in a semantic RED diff.
    expect(attempt).toEqual({
      before: attempt.before, after: attempt.before, readError: null,
      saveError: { code: 'INVALID_SETTINGS', message: expect.stringContaining('Hard drop requires a physical key') },
    });
    expect(afterAttempt).toEqual(before);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    expect(await inspectReviewSave(page)).toEqual(before);
    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('binding-drop-0')).toHaveValue('P');
    await page.getByTestId('close-settings').click();

    const written = await page.evaluate(async ({ operationId, expectedRevision }) => {
      const load = (path: string) => import(path);
      const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
      const repository: SettingsRepository = new DexieWorkspaceRepository();
      const current = await repository.getSettings(), settings = structuredClone(current.settings);
      settings.bindings.drop = ['KeyJ', 'KeyH'];
      const command: SaveSettingsCommand = { operationId, expectedRevision, settings };
      const saved = await repository.saveSettings(command), replay = await repository.saveSettings(command);
      const read = await repository.getSettings();
      return { saved, replay, read };
    }, { operationId, expectedRevision: attempt.before.revision });
    const expectedState = {
      revision: attempt.before.revision + 1,
      settings: { ...attempt.before.settings, bindings: { ...attempt.before.settings.bindings, drop: ['KeyJ', 'KeyH'] } },
    };
    expect(written.saved).toEqual(expectedState); expect(written.replay).toEqual(expectedState); expect(written.read).toEqual(expectedState);
    const saved = await inspectReviewSave(page);
    expect(saved.version).toBe(before.version);
    expect(saved.tables.settings).toEqual([{ key: 'settings', ...expectedState }]);
    expect(saved.tables.settingsOperations).toHaveLength(priorReceipts.length + 1);
    expect(saved.tables.settingsOperations).toEqual(expect.arrayContaining([
      ...priorReceipts,
      { operationId, revision: expectedState.revision,
        fingerprint: JSON.stringify({ expectedRevision: attempt.before.revision, settings: expectedState.settings }) },
    ]));
    for (const name of Object.keys(before.tables)) {
      if (name !== 'settings' && name !== 'settingsOperations') expect(saved.tables[name], name).toEqual(before.tables[name]);
    }
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    expect(await inspectReviewSave(page)).toEqual(saved);
    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('binding-drop-0')).toHaveValue('J');
    await expect(page.getByTestId('binding-drop-1')).toHaveValue('H');
  });
}
