import { expect, test, type Page } from '@playwright/test';
import { settingsCommandFingerprint, type SettingsOperation } from '../../src/application/workspace/SettingsRepository';
import type { WorkspaceSettings } from '../../src/domain/workspace/settings';
import { seedReviewOutcomeSave, inspectReviewSave } from '../reviewBrowserFixture';
import { applyReviewCommand, ensureReviewOccurrence, ensureReviewFingerprint, reviewCommandFingerprint,
  type EnsureReviewCommand, type ReviewCommand, type ReviewOperationReceipt } from '../../src/domain/review/occurrence';
import type { OutcomeSettlement, PilotEconomy } from '../../src/domain/results/settlement';

const defaultBindings = { left: ['ArrowLeft'], right: ['ArrowRight'], down: ['ArrowDown'], cw: ['ArrowUp', 'KeyX'],
  ccw: ['KeyZ'], drop: ['Space'], hold: ['KeyC', 'ShiftLeft', 'ShiftRight'], pause: ['Escape'] };

/** Native historical v9 save prepared independently of the v10 adapter. No live user save is used. */
async function seedV9ReviewSave(page: Page): Promise<void> {
  const fixture = await seedReviewOutcomeSave(page, { count: 2, resolvedCargo: true });
  const saved = await inspectReviewSave(page);
  const economy = saved.tables.pilotEconomies![0] as PilotEconomy;
  const settlement = saved.tables.outcomeSettlements![0] as OutcomeSettlement;
  const ensure: EnsureReviewCommand = { kind: 'ensure-review', operationId: 'ticket11-v9-ensure',
    pilotId: fixture.run.pilotId, runId: fixture.run.runId, attemptId: fixture.outcome.attemptId,
    occurrenceId: 'ticket11-v9-review', recordedAt: '2026-11-25T01:00:00Z' };
  const offered = ensureReviewOccurrence(fixture.run, fixture.outcome, settlement, fixture.pack, [], [], ensure);
  const commands: ReviewCommand[] = [
    { kind: 'submit-review', operationId: 'ticket11-v9-wrong', pilotId: ensure.pilotId, runId: ensure.runId,
      occurrenceId: ensure.occurrenceId, expectedRevision: 0, answer: 'boat', recordedAt: '2026-11-25T01:01:00Z' },
    { kind: 'hint-review', operationId: 'ticket11-v9-hint', pilotId: ensure.pilotId, runId: ensure.runId,
      occurrenceId: ensure.occurrenceId, expectedRevision: 1, hint: 'letter', recordedAt: '2026-11-25T01:02:00Z' },
    { kind: 'submit-review', operationId: 'ticket11-v9-correct', pilotId: ensure.pilotId, runId: ensure.runId,
      occurrenceId: ensure.occurrenceId, expectedRevision: 2, answer: ' ship ', recordedAt: '2026-11-25T01:03:00Z' },
  ];
  let result = { run: fixture.run, economy, occurrence: offered.occurrence, reward: null as ReturnType<typeof applyReviewCommand>['reward'] };
  const receipt = (command: EnsureReviewCommand | ReviewCommand, fingerprint: string): ReviewOperationReceipt => ({
    operationId: command.operationId, pilotId: command.pilotId, runId: command.runId, occurrenceId: command.occurrenceId,
    kind: command.kind, fingerprint,
  });
  const operations = [receipt(ensure, ensureReviewFingerprint(ensure))];
  for (const command of commands) {
    result = applyReviewCommand(result.run, result.economy, result.occurrence, command);
    operations.push(receipt(command, reviewCommandFingerprint(command)));
  }
  if (!result.reward) throw Error('The v9 fixture must contain a completed assisted Review reward.');
  await page.evaluate(async ({ result, link, operations }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data', 90);
      request.onupgradeneeded = () => {
        for (const [name, key, indexes] of [
          ['reviewOccurrences', 'occurrenceId', ['pilotId', 'entryId', 'sourceRunId']],
          ['reviewLinks', 'attemptId', ['pilotId', 'runId', 'occurrenceId']],
          ['reviewRewards', 'occurrenceId', ['pilotId', 'runId', 'operationId']],
          ['reviewOperations', 'operationId', ['pilotId', 'runId', 'occurrenceId']],
        ] as Array<[string, string, string[]]>) {
          const table = request.result.createObjectStore(name, { keyPath: key });
          for (const index of indexes) table.createIndex(index, index);
        }
        const tx = request.transaction!;
        tx.objectStore('workspace').put({ key: 'workspace', schemaVersion: 9 });
        tx.objectStore('runs').put(result.run); tx.objectStore('pilotEconomies').put(result.economy);
        tx.objectStore('reviewOccurrences').add(result.occurrence); tx.objectStore('reviewLinks').add(link);
        tx.objectStore('reviewRewards').add(result.reward);
        for (const operation of operations) tx.objectStore('reviewOperations').add(operation);
      };
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('The isolated v9 fixture upgrade was blocked.'));
    });
    db.close();
  }, { result, link: offered.link, operations });
}

async function openChooser(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
}

test('v9 to v10 preserves completed Review, paid outcomes, retained Cargo and old pins byte-for-value', async ({ page }) => {
  await seedV9ReviewSave(page);
  const before = await inspectReviewSave(page);
  expect(before.version).toBe(90);
  expect(before.tables.reviewOccurrences).toEqual([expect.objectContaining({
    firstResponse: expect.objectContaining({ answer: 'boat', correct: false }), attemptsToFirstCorrect: 2,
    hints: [expect.objectContaining({ hint: 'letter' })], completedAt: '2026-11-25T01:03:00Z', revision: 3,
  })]);
  expect(before.tables.reviewRewards).toEqual([expect.objectContaining({ total: { credits: 1, celestium: 0 } })]);
  expect(before.tables.reviewOperations).toHaveLength(4);
  expect(before.tables.pilotEconomies).toEqual([expect.objectContaining({ credits: 25, celestium: 1, revision: 2 })]);
  await openChooser(page);
  const after = await inspectReviewSave(page);
  expect(after.version).toBe(100);
  expect(after.tables.workspace).toEqual([{ key: 'workspace', schemaVersion: 10 }]);
  for (const name of Object.keys(before.tables).filter(name => name !== 'workspace')) {
    expect(after.tables[name], name).toEqual(before.tables[name]);
  }
  expect(after.tables.settings).toEqual([{ key: 'settings', revision: 0, settings: {
    bindings: defaultBindings, audio: { music: { volume: 45, muted: false }, effects: { volume: 65, muted: false },
      pronunciation: { volume: 85, muted: false } }, reducedMotion: false,
  } }]);
  expect(after.tables.settingsOperations).toEqual([]);
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('Space');
  await expect(page.getByTestId('binding-hold-2')).toHaveValue('Right Shift');
});

test('v10 settings initialization failure rolls back its new stores and the complete native v9 save', async ({ page }) => {
  await seedV9ReviewSave(page);
  const before = await inspectReviewSave(page);
  await page.addInitScript(() => {
    const add = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
      if (this.name === 'settings' && this.transaction.mode === 'versionchange') {
        throw new DOMException('Injected v10 settings migration failure', 'UnknownError');
      }
      return add.apply(this, args);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  await expect(page.getByTestId('recovery-message')).toContainText('Injected v10 settings migration failure');
  expect(await inspectReviewSave(page)).toEqual(before);
});

test('v10 rejects inconsistent v9 Review evidence without advancing metadata or resetting its reward', async ({ page }) => {
  await seedV9ReviewSave(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('reviewOccurrences', 'readwrite'), table = tx.objectStore('reviewOccurrences');
        const request = table.get('ticket11-v9-review');
        request.onsuccess = () => { const row = request.result; row.firstResponse.answer = 'altered evidence'; table.put(row); };
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  const before = await inspectReviewSave(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(before);
});

for (const target of ['settings', 'settingsOperations'] as const) {
  test('Settings UI failure at ' + target + ' rolls back preferences and receipt, then Retry survives reload once', async ({ page }, testInfo) => {
    await seedV9ReviewSave(page); await openChooser(page);
    const before = await inspectReviewSave(page);
    await page.getByTestId('open-settings').click();
    await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
    await page.evaluate(target => {
      const add = IDBObjectStore.prototype.add, put = IDBObjectStore.prototype.put;
      let fail = true;
      IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) {
        if (this.name === target && this.transaction.mode === 'readwrite' && fail) {
          fail = false; throw new DOMException('Injected Settings transaction failure', 'UnknownError');
        }
        return add.apply(this, args);
      };
      IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) {
        if (this.name === target && this.transaction.mode === 'readwrite' && fail) {
          fail = false; throw new DOMException('Injected Settings transaction failure', 'UnknownError');
        }
        return put.apply(this, args);
      };
    }, target);
    await page.getByTestId('save-settings').click();
    await expect(page.getByTestId('settings-error')).toContainText('Injected Settings transaction failure');
    await expect(page.getByTestId('settings-status')).toContainText('previously saved settings remain active');
    await expect(page.getByTestId('retry-settings')).toBeVisible();
    await expect(page.getByTestId('binding-drop-0')).toBeDisabled();
    expect(await inspectReviewSave(page)).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath('settings-save-failed-' + target + '.png'), fullPage: true });
    await page.getByTestId('close-settings').click();
    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('binding-drop-0')).toHaveValue('H');
    await expect(page.getByTestId('retry-settings')).toBeVisible();
    await page.getByTestId('retry-settings').click();
    await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
    await expect(page.getByTestId('retry-settings')).toBeHidden();
    const saved = await inspectReviewSave(page);
    for (const name of Object.keys(before.tables).filter(name => name !== 'settings' && name !== 'settingsOperations')) {
      expect(saved.tables[name], name).toEqual(before.tables[name]);
    }
    expect(saved.tables.settings).toEqual([expect.objectContaining({
      revision: 1, settings: expect.objectContaining({ bindings: { ...defaultBindings, drop: ['KeyH'] } }),
    })]);
    expect(saved.tables.settingsOperations).toHaveLength(1);
    expect(saved.tables.settingsOperations![0]).toEqual(expect.objectContaining({ revision: 1 }));
    await page.getByTestId('close-settings').click();
    await page.reload(); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    expect(await inspectReviewSave(page)).toEqual(saved);
    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('binding-drop-0')).toHaveValue('H');
  });
}

test('invalid native v10 settings enter recovery without replacing preferences or unrelated player data', async ({ page }) => {
  await seedV9ReviewSave(page); await openChooser(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite'), table = tx.objectStore('settings'), request = table.get('settings');
        request.onsuccess = () => { const row = request.result; row.settings.bindings.drop = ['Tab']; table.put(row); };
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  });
  const before = await inspectReviewSave(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  await expect(page.getByTestId('recovery-message')).toContainText('Tab');
  expect(await inspectReviewSave(page)).toEqual(before);
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('save-settings')).toBeDisabled();
  await expect(page.getByTestId('settings-status')).toContainText('read-only');
});

for (const failRefresh of [false, true]) {
test('AR11 stale Settings reloads acknowledged preferences without resubmitting its rejected draft' + (failRefresh ? ' after temporary read failure' : ''), async ({ page }) => {
  await openChooser(page); await page.getByTestId('open-settings').click();
  const before = await inspectReviewSave(page);
  const current = before.tables.settings![0] as { key: string; revision: number; settings: WorkspaceSettings };
  const newer = structuredClone(current.settings);
  newer.bindings.drop = ['KeyJ']; newer.audio.music = { volume: 17, muted: true }; newer.reducedMotion = true;
  const command = { operationId: 'ticket11-competing-settings', expectedRevision: current.revision, settings: newer };
  const fingerprint = settingsCommandFingerprint(command);
  // A controlled competing native writer reaches the supported stale-command branch.
  // This is not an ordinary UI-only sequence behind the exclusive Workspace lock.
  await page.evaluate(async ({ command, fingerprint }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['settings', 'settingsOperations'], 'readwrite');
        tx.objectStore('settings').put({ key: 'settings', revision: command.expectedRevision + 1, settings: command.settings });
        tx.objectStore('settingsOperations').add({ operationId: command.operationId, fingerprint, revision: command.expectedRevision + 1 });
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { command, fingerprint });
  const external = await inspectReviewSave(page);
  if (failRefresh) await page.evaluate(() => {
    const getAll = IDBObjectStore.prototype.getAll;
    let fail = true;
    IDBObjectStore.prototype.getAll = function (...args: Parameters<typeof getAll>) {
      if (this.name === 'settings' && this.transaction.mode === 'readonly' && fail) {
        fail = false; throw new DOMException('Injected current Settings read failure', 'UnknownError');
      }
      return getAll.apply(this, args);
    };
  });
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
  await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-error')).toBeVisible();
  if (failRefresh) {
    await expect(page.getByTestId('settings-error')).toContainText('Injected current Settings read failure');
    await expect(page.getByTestId('binding-drop-0')).toBeDisabled();
    await expect(page.getByTestId('retry-settings')).toBeHidden();
    expect(await inspectReviewSave(page)).toEqual(external);
    await page.getByTestId('close-settings').click(); await page.getByTestId('open-settings').click();
  }
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('J');
  await expect(page.getByTestId('settings-status')).toContainText('Loaded current saved settings');
  await expect(page.getByTestId('volume-music')).toHaveValue('17'); await expect(page.getByTestId('mute-music')).toBeChecked();
  await expect(page.getByTestId('reduced-motion')).toBeChecked(); await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await expect(page.getByTestId('retry-settings')).toBeHidden();
  expect(await inspectReviewSave(page)).toEqual(external);
  await page.getByTestId('close-settings').click(); await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('binding-drop-0')).toHaveValue('J');
  await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('k'); await page.getByTestId('save-settings').click();
  await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
  const saved = await inspectReviewSave(page);
  expect(saved.tables.settings).toEqual([{ key: 'settings', revision: current.revision + 2,
    settings: { ...newer, bindings: { ...newer.bindings, drop: ['KeyK'] } } }]);
  expect(saved.tables.settingsOperations).toHaveLength(2);
  for (const name of Object.keys(external.tables).filter(name => !['settings', 'settingsOperations'].includes(name))) {
    expect(saved.tables[name], name).toEqual(external.tables[name]);
  }
  await page.getByTestId('close-settings').click(); await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(saved);
});
}

test('historical Shift movement settings and receipts remain readable and can be explicitly corrected', async ({ page }) => {
  await openChooser(page);
  const initial = await inspectReviewSave(page);
  const state = initial.tables.settings![0] as { key: string; revision: number; settings: WorkspaceSettings };
  const legacy = structuredClone(state.settings);
  legacy.bindings.down = ['ShiftLeft']; legacy.bindings.hold = ['KeyC', 'ShiftRight'];
  const command = { operationId: 'ticket11-legacy-shift', expectedRevision: state.revision, settings: legacy };
  const fingerprint = settingsCommandFingerprint(command);
  // Native acknowledged historical data, not a new save through the current compatibility guard.
  await page.evaluate(async ({ command, fingerprint }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['settings', 'settingsOperations'], 'readwrite');
        tx.objectStore('settings').put({ key: 'settings', revision: command.expectedRevision + 1, settings: command.settings });
        tx.objectStore('settingsOperations').add({ operationId: command.operationId, fingerprint, revision: command.expectedRevision + 1 });
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { command, fingerprint });
  const acknowledged = await inspectReviewSave(page);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(acknowledged);
  await page.getByLabel('Nickname').fill('Legacy controls'); await page.getByTestId('create-pilot').click();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('controls-before-play')).toContainText('Controls need attention');
  const before = await inspectReviewSave(page);
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('binding-down-0')).toHaveValue('Left Shift');
  await expect(page.getByTestId('settings-error')).toContainText('Soft drop');
  await expect(page.getByTestId('save-settings')).toBeDisabled();
  await page.getByTestId('binding-down-0').focus(); await page.keyboard.press('s');
  await page.getByTestId('save-settings').click(); await expect(page.getByTestId('settings-status')).toContainText('Settings saved');
  await expect(page.getByTestId('controls-before-play')).not.toContainText('Controls need attention');
  const corrected = await inspectReviewSave(page);
  expect(corrected.tables.settingsOperations).toHaveLength(2);
  expect(corrected.tables.settingsOperations).toContainEqual({ operationId: command.operationId, fingerprint, revision: state.revision + 1 });
  expect(corrected.tables.settings).toEqual([{ key: 'settings', revision: state.revision + 2,
    settings: { ...legacy, bindings: { ...legacy.bindings, down: ['KeyS'] } } }]);
  for (const name of Object.keys(before.tables).filter(name => !['settings', 'settingsOperations'].includes(name))) {
    expect(corrected.tables[name], name).toEqual(before.tables[name]);
  }
  await page.getByTestId('close-settings').click(); await page.reload();
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(corrected);
});


type SettingsRecoveryFault = 'rollback' | 'lost-ack';
interface SettingsRecoveryTrace {
  operationIds: string[];
  receiptAttempts: SettingsOperation[];
  nativeCompletion: { isTrusted: boolean } | null;
}
type SettingsRecoveryHarness = { trace: SettingsRecoveryTrace; restore(): boolean };

async function installSettingsRecoveryFault(page: Page, fault: SettingsRecoveryFault): Promise<void> {
  await page.evaluate(fault => {
    const nativeGet = IDBObjectStore.prototype.get, nativeAdd = IDBObjectStore.prototype.add;
    const trace: SettingsRecoveryTrace = { operationIds: [], receiptAttempts: [], nativeCompletion: null };
    let rejectReceipt = fault === 'rollback', loseAcknowledgment = fault === 'lost-ack';
    const settingsSave = (tx: IDBTransaction) => tx.db.name === 'crossdefense-player-data' &&
      tx.mode === 'readwrite' &&
      Array.from(tx.objectStoreNames).sort().join(',') === 'settings,settingsOperations,workspace';
    const receiptWrite = (store: IDBObjectStore) => store.name === 'settingsOperations' && settingsSave(store.transaction);
    IDBObjectStore.prototype.get = function (...args: Parameters<typeof nativeGet>) {
      if (receiptWrite(this)) trace.operationIds.push(String(args[0]));
      return nativeGet.apply(this, args);
    };
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof nativeAdd>) {
      if (receiptWrite(this)) {
        trace.receiptAttempts.push(structuredClone(args[0]));
        if (rejectReceipt) {
          rejectReceipt = false;
          throw new DOMException('Injected Settings recovery receipt failure', 'UnknownError');
        }
        if (loseAcknowledgment) {
          loseAcknowledgment = false;
          const tx = this.transaction;
          if (typeof tx.oncomplete !== 'function' || typeof tx.onabort !== 'function') {
            throw Error('Native Settings transaction observers are unavailable.');
          }
          // Dexie already owns this transaction; redirect its completion callback
          // after the actual native commit, without relying on a cached factory method.
          tx.oncomplete = event => {
            trace.nativeCompletion = { isTrusted: event.isTrusted };
            event.stopImmediatePropagation();
            // Controlled lost acknowledgment, not a native abort after commit.
            tx.dispatchEvent(new Event('abort', { cancelable: true }));
          };
        }
      }
      return nativeAdd.apply(this, args);
    };
    const harness: SettingsRecoveryHarness = { trace, restore() {
      IDBObjectStore.prototype.get = nativeGet; IDBObjectStore.prototype.add = nativeAdd;
      const restored = IDBObjectStore.prototype.get === nativeGet && IDBObjectStore.prototype.add === nativeAdd;
      delete (window as unknown as { __ticket11SettingsRecovery?: SettingsRecoveryHarness }).__ticket11SettingsRecovery;
      return restored;
    } };
    Object.defineProperty(window, '__ticket11SettingsRecovery', { value: harness, configurable: true });
  }, fault);
}
async function readSettingsRecoveryTrace(page: Page): Promise<SettingsRecoveryTrace> {
  return page.evaluate(() => structuredClone(
    (window as unknown as { __ticket11SettingsRecovery: SettingsRecoveryHarness }).__ticket11SettingsRecovery.trace,
  ));
}
async function restoreSettingsRecoveryFault(page: Page): Promise<boolean> {
  if (page.isClosed()) return true;
  return page.evaluate(() => {
    const harness = (window as unknown as { __ticket11SettingsRecovery?: SettingsRecoveryHarness }).__ticket11SettingsRecovery;
    // A successful reload already replaced this page's instrumented realm.
    return harness ? harness.restore() : true;
  });
}
async function observeSettingsRecoveryUi(page: Page) {
  return {
    retryVisible: await page.getByTestId('retry-settings').isVisible(),
    saveDisabled: await page.getByTestId('save-settings').isDisabled(),
    drop: await page.getByTestId('binding-drop-0').inputValue(),
    dropDisabled: await page.getByTestId('binding-drop-0').isDisabled(),
    music: await page.getByTestId('volume-music').inputValue(),
    musicMuted: await page.getByTestId('mute-music').isChecked(),
    reducedMotion: await page.getByTestId('reduced-motion').isChecked(),
    appliedReducedMotion: await page.locator('html').getAttribute('data-reduced-motion'),
  };
}

for (const fault of ['rollback', 'lost-ack'] as const) {
  test('Settings exact Retry survives Retry storage after ' + fault, async ({ page }, testInfo) => {
    try {
      await seedV9ReviewSave(page); await openChooser(page);
      // Reach real recovery after successful Workspace initialization.
      await page.evaluate(() => {
        const nativeGet = Storage.prototype.getItem;
        Storage.prototype.getItem = function (key: string) {
          if (this === localStorage && key === 'crossdefense-content-pack-state') {
            Storage.prototype.getItem = nativeGet;
            throw new DOMException('Injected content metadata read failure', 'UnknownError');
          }
          return nativeGet.call(this, key);
        };
      });
      await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
      await expect(page.getByTestId('recovery-message')).toContainText('Content storage could not be read or written');
      // Continue's legitimate lastUsedAt update precedes this persistence baseline.
      const before = await inspectReviewSave(page);
      const current = before.tables.settings![0] as { key: string; revision: number; settings: WorkspaceSettings };
      expect(before.version).toBe(100); expect(current.revision).toBe(0);
      expect(before.tables.settingsOperations).toEqual([]);
      const expectedSettings = structuredClone(current.settings);
      expectedSettings.bindings.drop = ['KeyH'];
      expectedSettings.audio.music = { volume: 17, muted: true }; expectedSettings.reducedMotion = true;

      await page.getByTestId('open-settings').click(); await expect(page.getByTestId('save-settings')).toBeEnabled();
      await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
      await page.getByTestId('volume-music').fill('17'); await page.getByTestId('mute-music').check();
      await page.getByTestId('reduced-motion').check();
      await installSettingsRecoveryFault(page, fault); await page.getByTestId('save-settings').click();
      await expect(page.getByTestId('settings-status')).not.toHaveText('Saving settings...');
      const failed = await inspectReviewSave(page), firstTrace = await readSettingsRecoveryTrace(page);
      const failedUi = await observeSettingsRecoveryUi(page);
      await testInfo.attach('settings-failure-observation.json', {
        contentType: 'application/json', body: JSON.stringify({ fault, before, failed, trace: firstTrace, ui: failedUi, expectedSettings }, null, 2),
      });
      await expect(page.getByTestId('settings-status')).toContainText('previously saved settings remain active');
      await expect(page.getByTestId('retry-settings')).toBeVisible();
      expect(firstTrace.receiptAttempts).toHaveLength(1);
      const originalReceipt = firstTrace.receiptAttempts[0]!;
      expect(firstTrace.operationIds).toEqual([originalReceipt.operationId]);
      expect(originalReceipt).toEqual({
        operationId: originalReceipt.operationId, revision: current.revision + 1,
        fingerprint: settingsCommandFingerprint({ operationId: originalReceipt.operationId,
          expectedRevision: current.revision, settings: expectedSettings }),
      });
      expect(firstTrace.nativeCompletion).toEqual(fault === 'lost-ack' ? { isTrusted: true } : null);
      const expectedSaved = { ...before, tables: { ...before.tables,
        settings: [{ key: 'settings', revision: current.revision + 1, settings: expectedSettings }],
        settingsOperations: [originalReceipt],
      } };
      expect(failed).toEqual(fault === 'lost-ack' ? expectedSaved : before);
      const expectedPendingUi = {
        retryVisible: true, saveDisabled: true, drop: 'H', dropDisabled: true,
        music: '17', musicMuted: true, reducedMotion: true, appliedReducedMotion: 'false',
      };
      expect(failedUi).toEqual(expectedPendingUi);
      await page.getByTestId('close-settings').click(); await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.getByTestId('retry-storage').click();
      await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
      const afterStorageRecovery = await inspectReviewSave(page), afterStorageTrace = await readSettingsRecoveryTrace(page);
      await page.getByTestId('open-settings').click();
      await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
      const recoveredUi = await observeSettingsRecoveryUi(page);
      // Retain the actual pre-assertion facts even when the semantic RED assertion fails.
      await testInfo.attach('settings-storage-recovery-observation.json', {
        contentType: 'application/json', body: JSON.stringify({
          fault, originalReceipt, originalFingerprint: JSON.parse(originalReceipt.fingerprint),
          failed, afterStorageRecovery, firstTrace, afterStorageTrace, failedUi, recoveredUi,
        }, null, 2),
      });
      expect(afterStorageRecovery).toEqual(failed); expect(afterStorageTrace).toEqual(firstTrace);
      // RED loses exact Retry; rollback also loses the draft, while lost-ack applies it.
      expect(recoveredUi).toEqual(expectedPendingUi);

      // Only this explicit action may resolve the retained Settings save.
      await page.getByTestId('retry-settings').click();
      await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
      const retriedTrace = await readSettingsRecoveryTrace(page), saved = await inspectReviewSave(page);
      expect(retriedTrace.operationIds).toEqual([originalReceipt.operationId, originalReceipt.operationId]);
      expect(retriedTrace.receiptAttempts).toEqual(fault === 'rollback' ? [originalReceipt, originalReceipt] : [originalReceipt]);
      expect(saved).toEqual(expectedSaved);
      const expectedAcknowledgedUi = { ...expectedPendingUi, retryVisible: false,
        saveDisabled: false, dropDisabled: false, appliedReducedMotion: 'true' };
      expect(await observeSettingsRecoveryUi(page)).toEqual(expectedAcknowledgedUi);
      await testInfo.attach('settings-explicit-retry-observation.json', {
        contentType: 'application/json', body: JSON.stringify({ fault, originalReceipt, trace: retriedTrace, saved }, null, 2),
      });
      await page.getByTestId('close-settings').click(); await page.reload();
      await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
      expect(await inspectReviewSave(page)).toEqual(saved);
      await page.getByTestId('open-settings').click();
      expect(await observeSettingsRecoveryUi(page)).toEqual(expectedAcknowledgedUi);
    } finally {
      expect(await restoreSettingsRecoveryFault(page), 'Owned native Settings fault hooks are restored').toBe(true);
    }
  });
}


async function observeRecoveryLoadingSettings(page: Page) {
  const handle = await page.evaluateHandle(() => {
    const observation = { openedDuringLoading: false, initialSaveEnabled: false };
    const root = document.querySelector<HTMLElement>('#app')!;
    const observer = new MutationObserver(() => {
      const loading = root.querySelector<HTMLElement>('[data-testid="loading"]');
      const launcher = root.querySelector<HTMLButtonElement>('[data-testid="open-settings"]');
      if (loading?.textContent !== 'Checking local Workspace ownership and storage...' || !launcher) return;
      observer.disconnect(); launcher.click();
      const volume = document.querySelector<HTMLInputElement>('[data-testid="volume-music"]')!;
      const save = document.querySelector<HTMLButtonElement>('[data-testid="save-settings"]')!;
      observation.openedDuringLoading = true; observation.initialSaveEnabled = !save.disabled;
      // Controlled scheduling through public UI marks the surviving Loading draft.
      volume.value = '23'; volume.dispatchEvent(new Event('input', { bubbles: true }));
    });
    observer.observe(root, { childList: true, subtree: true });
    return { observation, disconnect() { observer.disconnect(); } };
  });
  return {
    read: () => handle.evaluate(probe => probe.observation),
    async dispose() { try { await handle.evaluate(probe => probe.disconnect()); } finally { await handle.dispose(); } },
  };
}

test('Settings opened during recovery Loading retains a later failed save', async ({ page }, testInfo) => {
  const manifestPattern = '**/content/packs/development-review-ship-v1/manifest.json';
  let releaseManifest = () => {}, finishManifest = () => {}, manifestRequested = false;
  let loadingProbe: Awaited<ReturnType<typeof observeRecoveryLoadingSettings>> | undefined;
  let holdManifest: ((route: import('@playwright/test').Route) => Promise<void>) | undefined;
  const manifestHandled = new Promise<void>(resolve => { finishManifest = resolve; });
  try {
    await seedV9ReviewSave(page); await openChooser(page);
    await page.evaluate(() => {
      const nativeGet = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key: string) {
        if (this === localStorage && key === 'crossdefense-content-pack-state') {
          Storage.prototype.getItem = nativeGet;
          throw new DOMException('Injected content metadata read failure', 'UnknownError');
        }
        return nativeGet.call(this, key);
      };
    });
    await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
    await expect(page.getByTestId('recovery-message')).toContainText('Content storage could not be read or written');
    const before = await inspectReviewSave(page);
    const current = before.tables.settings![0] as { key: string; revision: number; settings: WorkspaceSettings };
    expect(current.revision).toBe(0); expect(before.tables.settingsOperations).toEqual([]);
    const expectedSettings = structuredClone(current.settings);
    expectedSettings.bindings.drop = ['KeyH'];
    expectedSettings.audio.music = { volume: 23, muted: true }; expectedSettings.reducedMotion = true;
    await installSettingsRecoveryFault(page, 'rollback');
    loadingProbe = await observeRecoveryLoadingSettings(page);
    const manifestBarrier = new Promise<void>(resolve => { releaseManifest = resolve; });
    holdManifest = async route => {
      manifestRequested = true;
      try { await manifestBarrier; await route.continue(); } finally { finishManifest(); }
    };
    await page.route(manifestPattern, holdManifest);
    await page.getByTestId('retry-storage').click();
    await expect.poll(() => manifestRequested).toBe(true);
    const loadingObservation = await loadingProbe.read();
    expect(loadingObservation).toEqual({ openedDuringLoading: true, initialSaveEnabled: true });
    await expect(page.getByTestId('loading')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Settings and controls' })).toBeVisible();
    await expect(page.getByTestId('volume-music')).toHaveValue('23');
    expect(await readSettingsRecoveryTrace(page)).toEqual({ operationIds: [], receiptAttempts: [], nativeCompletion: null });
    // The held public manifest request is reached after bootstrap's Settings refresh.
    await page.getByTestId('binding-drop-0').focus(); await page.keyboard.press('h');
    await page.getByTestId('mute-music').check(); await page.getByTestId('reduced-motion').check();
    await page.getByTestId('save-settings').click();
    await expect(page.getByTestId('settings-error')).toContainText('Injected Settings recovery receipt failure');
    await expect(page.getByTestId('retry-settings')).toBeVisible();
    const failed = await inspectReviewSave(page), firstTrace = await readSettingsRecoveryTrace(page);
    const failedUi = await observeSettingsRecoveryUi(page);
    await testInfo.attach('settings-loading-failure.json', {
      contentType: 'application/json', body: JSON.stringify({
        loadingObservation, checkpoint: 'manifest request held after Settings refresh', before, failed, firstTrace, failedUi,
      }, null, 2),
    });
    expect(failed).toEqual(before); expect(firstTrace.receiptAttempts).toHaveLength(1);
    const originalReceipt = firstTrace.receiptAttempts[0]!;
    expect(firstTrace.operationIds).toEqual([originalReceipt.operationId]);
    expect(originalReceipt).toEqual({
      operationId: originalReceipt.operationId, revision: current.revision + 1,
      fingerprint: settingsCommandFingerprint({ operationId: originalReceipt.operationId,
        expectedRevision: current.revision, settings: expectedSettings }),
    });
    const expectedPendingUi = { retryVisible: true, saveDisabled: true, drop: 'H', dropDisabled: true,
      music: '23', musicMuted: true, reducedMotion: true, appliedReducedMotion: 'false' };
    expect(failedUi).toEqual(expectedPendingUi);
    releaseManifest(); await manifestHandled;
    await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const afterBootstrap = await inspectReviewSave(page), afterBootstrapTrace = await readSettingsRecoveryTrace(page);
    await page.getByTestId('open-settings').click();
    const recoveredUi = await observeSettingsRecoveryUi(page);
    await testInfo.attach('settings-loading-recovery.json', {
      contentType: 'application/json', body: JSON.stringify({
        loadingObservation, failed, afterBootstrap, firstTrace, afterBootstrapTrace, failedUi, recoveredUi,
        originalReceipt, originalFingerprint: JSON.parse(originalReceipt.fingerprint),
      }, null, 2),
    });
    expect(afterBootstrap).toEqual(failed); expect(afterBootstrapTrace).toEqual(firstTrace);
    // This Save began after the refresh checkpoint, not before Retry storage.
    expect(recoveredUi).toEqual(expectedPendingUi);

    await page.getByTestId('retry-settings').click();
    await expect(page.getByTestId('settings-status')).toHaveText('Settings saved for all Pilots on this device.');
    const retriedTrace = await readSettingsRecoveryTrace(page), saved = await inspectReviewSave(page);
    expect(retriedTrace.operationIds).toEqual([originalReceipt.operationId, originalReceipt.operationId]);
    expect(retriedTrace.receiptAttempts).toEqual([originalReceipt, originalReceipt]);
    expect(saved).toEqual({ ...before, tables: { ...before.tables,
      settings: [{ key: 'settings', revision: current.revision + 1, settings: expectedSettings }],
      settingsOperations: [originalReceipt],
    } });
    const expectedAcknowledgedUi = { ...expectedPendingUi, retryVisible: false, saveDisabled: false,
      dropDisabled: false, appliedReducedMotion: 'true' };
    expect(await observeSettingsRecoveryUi(page)).toEqual(expectedAcknowledgedUi);
    await testInfo.attach('settings-loading-explicit-retry.json', {
      contentType: 'application/json', body: JSON.stringify({ originalReceipt, trace: retriedTrace, saved }, null, 2),
    });
    await page.unroute(manifestPattern, holdManifest); holdManifest = undefined;
    await loadingProbe.dispose(); loadingProbe = undefined;
    await page.getByTestId('close-settings').click(); await page.reload();
    await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
    expect(await inspectReviewSave(page)).toEqual(saved);
    await page.getByTestId('open-settings').click();
    expect(await observeSettingsRecoveryUi(page)).toEqual(expectedAcknowledgedUi);
  } finally {
    releaseManifest();
    const cleanupErrors: string[] = [];
    for (const cleanup of [
      async () => { if (manifestRequested) await manifestHandled; },
      async () => { if (holdManifest) await page.unroute(manifestPattern, holdManifest); },
      () => loadingProbe?.dispose(),
      async () => { if (!await restoreSettingsRecoveryFault(page)) throw Error('Native Settings hooks were not restored.'); },
    ]) {
      try { await cleanup(); } catch (error) { cleanupErrors.push(String(error)); }
    }
    expect(cleanupErrors, 'Owned recovery Loading fixture cleanup').toEqual([]);
  }
});
