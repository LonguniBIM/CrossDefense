import { expect, it } from 'vitest';
import { SettingsApplication } from '../../src/application/workspace/SettingsApplication';
import { InMemorySettingsRepository } from '../../src/infrastructure/persistence/InMemorySettingsRepository';

it('saved Workspace controls and channel settings are shared by a fresh Settings session', async () => {
  const repository = new InMemorySettingsRepository();
  const first = new SettingsApplication(repository, () => 'first-save');
  const draft = await first.open();
  draft.bindings.drop = ['KeyH'];
  draft.audio.music = { volume: 17, muted: true };
  draft.audio.effects = { volume: 68, muted: false };
  draft.audio.pronunciation = { volume: 83, muted: true };
  draft.reducedMotion = true;
  await first.save(draft);
  const reopened = new SettingsApplication(repository, () => 'unused');
  const saved = await reopened.open();
  expect(saved.bindings.drop).toEqual(['KeyH']);
  expect(saved.audio).toEqual({ music: { volume: 17, muted: true }, effects: { volume: 68, muted: false },
    pronunciation: { volume: 83, muted: true } });
  expect(saved.reducedMotion).toBe(true);
});

it('a conflicting key identifies both actions and preserves the acknowledged mapping', async () => {
  const repository = new InMemorySettingsRepository(), app = new SettingsApplication(repository, () => 'conflict');
  const before = await app.open(), draft = structuredClone(before);
  draft.bindings.left = ['KeyH']; draft.bindings.drop = ['KeyH'];
  await expect(app.save(draft)).rejects.toThrow(/KeyH.*Move left.*Hard drop/);
  expect(app.projection()).toEqual(before);
  expect((await repository.getSettings()).settings).toEqual(before);
  expect(app.hasPendingSave()).toBe(false);
});

import { settingsCommandFingerprint, type SaveSettingsCommand } from '../../src/application/workspace/SettingsRepository';

it.each([false, true])('failed Settings save retains its draft and retries once after lost acknowledgment=%s', async lost => {
  class Faults extends InMemorySettingsRepository {
    fail = true; calls: SaveSettingsCommand[] = [];
    override async saveSettings(command: SaveSettingsCommand) {
      this.calls.push(structuredClone(command));
      if (this.fail) { this.fail = false; if (lost) await super.saveSettings(command); throw Error('Injected settings storage failure'); }
      return super.saveSettings(command);
    }
  }
  const repository = new Faults();
  let generated = 0;
  const app = new SettingsApplication(repository, () => 'settings-' + ++generated), before = await app.open();
  const draft = structuredClone(before); draft.bindings.drop = ['KeyH']; draft.audio.effects.muted = true;
  await expect(app.save(draft)).rejects.toThrow('Injected settings storage failure');
  draft.bindings.drop = ['KeyQ']; draft.audio.effects.muted = false;
  expect(app.projection()).toEqual(before);
  expect(app.hasPendingSave()).toBe(true);
  await expect(app.save(draft)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.open()).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  const saved = await app.retry();
  expect(saved.bindings.drop).toEqual(['KeyH']);
  expect(saved.audio.effects.muted).toBe(true);
  expect((await repository.getSettings()).revision).toBe(1);
  expect(app.hasPendingSave()).toBe(false);
  expect(repository.calls).toHaveLength(2);
  expect(repository.calls[1]).toEqual(repository.calls[0]);
  expect(generated).toBe(1);
});

import { DEFAULT_SETTINGS, validateSettings, type WorkspaceSettings } from '../../src/domain/workspace/settings';

it('approved default aliases remain available and draft or projection mutation cannot change saved settings', async () => {
  const repository = new InMemorySettingsRepository(), app = new SettingsApplication(repository, () => 'default-save');
  const draft = await app.open();
  expect(draft.bindings).toEqual({ left: ['ArrowLeft'], right: ['ArrowRight'], down: ['ArrowDown'],
    cw: ['ArrowUp', 'KeyX'], ccw: ['KeyZ'], drop: ['Space'], hold: ['KeyC', 'ShiftLeft', 'ShiftRight'], pause: ['Escape'] });
  draft.bindings.hold.push('KeyH'); draft.audio.music.volume = 0;
  expect(app.projection().bindings.hold).toEqual(['KeyC', 'ShiftLeft', 'ShiftRight']);
  expect((await repository.getSettings()).settings.audio.music.volume).toBe(45);
  const output = validateSettings(DEFAULT_SETTINGS); output.bindings.left[0] = 'KeyH';
  expect(validateSettings(DEFAULT_SETTINGS).bindings.left).toEqual(['ArrowLeft']);
});

it('replaying a lost acknowledgment returns later saved settings without reverting or adding a revision', async () => {
  class LostReceipt extends InMemorySettingsRepository {
    fail = true;
    override async saveSettings(command: SaveSettingsCommand) {
      const result = await super.saveSettings(command);
      if (this.fail) { this.fail = false; throw Error('Lost acknowledgment'); }
      return result;
    }
  }
  const repository = new LostReceipt(), first = new SettingsApplication(repository, () => 'old-save');
  const initial = await first.open(); initial.bindings.drop = ['KeyH'];
  await expect(first.save(initial)).rejects.toThrow('Lost acknowledgment');
  const second = new SettingsApplication(repository, () => 'new-save'), current = await second.open();
  current.bindings.drop = ['KeyJ']; current.audio.pronunciation.muted = true;
  await second.save(current);
  const recovered = await first.retry();
  expect(recovered.bindings.drop).toEqual(['KeyJ']);
  expect(recovered.audio.pronunciation.muted).toBe(true);
  expect((await repository.getSettings()).revision).toBe(2);
  await expect(repository.saveSettings({ operationId: 'old-save', expectedRevision: 0, settings: current })).rejects.toMatchObject({ code: 'OPERATION_CONFLICT' });
});

it('pending acknowledgment serializes Settings operations and keeps the prior projection visible', async () => {
  let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  class DelayedWrite extends InMemorySettingsRepository {
    override async saveSettings(command: SaveSettingsCommand) { await barrier; return super.saveSettings(command); }
  }
  const repository = new DelayedWrite(), app = new SettingsApplication(repository, () => 'delayed');
  const before = await app.open(), draft = structuredClone(before); draft.reducedMotion = true;
  const pending = app.save(draft);
  expect(app.projection()).toEqual(before);
  expect((await repository.getSettings()).revision).toBe(0);
  await expect(app.retry()).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.save(before)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.open()).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  release(); await pending;
  expect(app.projection().reducedMotion).toBe(true);
  expect((await repository.getSettings()).revision).toBe(1);
});

it('stale Settings writers preserve the newer mapping and can reopen after a domain rejection', async () => {
  const repository = new InMemorySettingsRepository();
  const old = new SettingsApplication(repository, () => 'stale'), fresh = new SettingsApplication(repository, () => 'fresh');
  const stale = await old.open(), updated = await fresh.open();
  updated.bindings.drop = ['KeyJ']; await fresh.save(updated);
  stale.bindings.drop = ['KeyH'];
  await expect(old.save(stale)).rejects.toMatchObject({ code: 'STALE_SETTINGS' });
  expect(old.hasPendingSave()).toBe(false);
  expect((await old.open()).bindings.drop).toEqual(['KeyJ']);
  expect((await repository.getSettings()).revision).toBe(1);
});

const invalidSettings: Array<[string, (value: WorkspaceSettings) => void]> = [
  ['missing action', value => { delete (value.bindings as Partial<WorkspaceSettings['bindings']>).pause; }],
  ['unknown action', value => { Object.assign(value.bindings, { fly: ['KeyF'] }); }],
  ['too many aliases', value => { value.bindings.drop = ['KeyH', 'KeyJ', 'KeyK', 'KeyL']; }],
  ['native focus traversal', value => { value.bindings.drop = ['Tab']; }],
  ['modifier shortcut', value => { value.bindings.drop = ['Control+KeyH']; }],
  ['unknown physical key', value => { value.bindings.drop = ['Unidentified']; }],
  ['nonfinite volume', value => { value.audio.music.volume = Number.POSITIVE_INFINITY; }],
  ['out of range volume', value => { value.audio.pronunciation.volume = 101; }],
  ['wrong mute type', value => { Object.assign(value.audio.effects, { muted: 'yes' }); }],
  ['unsupported field', value => { Object.assign(value, { pilotId: 'must-not-scope-settings' }); }],
];
it.each(invalidSettings)('invalid %s cannot publish settings or create a pending save', async (_name, change) => {
  const repository = new InMemorySettingsRepository(), app = new SettingsApplication(repository, () => 'invalid');
  const before = await app.open(), draft = structuredClone(before); change(draft);
  await expect(app.save(draft)).rejects.toThrow();
  expect(app.projection()).toEqual(before);
  expect((await repository.getSettings()).revision).toBe(0);
  expect(app.hasPendingSave()).toBe(false);
});

it('Restore Defaults is an ordinary acknowledged Workspace change and preserves the supplied audio and motion choices', async () => {
  const repository = new InMemorySettingsRepository();
  let id = 0; const app = new SettingsApplication(repository, () => 'restore-' + ++id);
  const changed = await app.open(); changed.bindings.drop = ['KeyH']; changed.reducedMotion = true; changed.audio.music.volume = 12;
  await app.save(changed);
  const reset = app.projection(); reset.bindings = structuredClone(DEFAULT_SETTINGS.bindings);
  await app.save(reset);
  const saved = await new SettingsApplication(repository, () => 'unused').open();
  expect(saved.bindings.drop).toEqual(['Space']);
  expect(saved.bindings.hold).toEqual(['KeyC', 'ShiftLeft', 'ShiftRight']);
  expect(saved.reducedMotion).toBe(true); expect(saved.audio.music.volume).toBe(12);
});

const continuousShiftCases = [
  ['left', 'ShiftLeft', 'Move left'], ['left', 'ShiftRight', 'Move left'],
  ['right', 'ShiftLeft', 'Move right'], ['right', 'ShiftRight', 'Move right'],
  ['down', 'ShiftLeft', 'Soft drop'], ['down', 'ShiftRight', 'Soft drop'],
] as const;
it.each(continuousShiftCases)('%s rejects %s as a held gameplay key without changing acknowledged settings', async (action, code, label) => {
  const repository = new InMemorySettingsRepository();
  let generated = 0;
  const app = new SettingsApplication(repository, () => 'invalid-shift-' + ++generated);
  const before = await app.open(), draft = structuredClone(before);
  draft.bindings.hold = ['KeyC']; draft.bindings[action] = [code];
  const rejection = { code: 'INCOMPATIBLE_BINDING', message: expect.stringMatching(new RegExp(code + '.*' + label + '.*non-Shift')) };
  await expect(app.save(draft)).rejects.toMatchObject(rejection);
  expect(app.projection()).toEqual(before);
  expect(app.hasPendingSave()).toBe(false); expect(generated).toBe(0);
  expect(await repository.getSettings()).toEqual({ revision: 0, settings: before });
  const command = { operationId: 'direct-shift-' + action + code, expectedRevision: 0, settings: draft };
  await expect(repository.saveSettings(command)).rejects.toMatchObject(rejection);
  expect(await repository.getSettings()).toEqual({ revision: 0, settings: before });
  // A rejected command must not reserve an operation receipt or revision.
  expect(await repository.saveSettings({ ...command, settings: before })).toEqual({ revision: 1, settings: before });
});

it.each(['cw', 'ccw', 'drop', 'hold', 'pause'] as const)('both standalone Shift keys remain valid for discrete %s', async action => {
  const repository = new InMemorySettingsRepository(), app = new SettingsApplication(repository, () => 'discrete-shift-' + action);
  const draft = await app.open(); draft.bindings.hold = ['KeyC'];
  draft.bindings[action] = ['ShiftLeft', 'ShiftRight'];
  expect(await app.save(draft)).toEqual(draft);
  expect(await new SettingsApplication(repository, () => 'unused').open()).toEqual(draft);
  expect((await repository.getSettings()).revision).toBe(1);
});

it('a duplicate Shift binding names both actions before any held-key compatibility rejection', async () => {
  const repository = new InMemorySettingsRepository(), app = new SettingsApplication(repository, () => 'shift-conflict');
  const before = await app.open(), draft = structuredClone(before); draft.bindings.left = ['ShiftLeft'];
  await expect(app.save(draft)).rejects.toMatchObject({ code: 'KEY_CONFLICT', message: expect.stringMatching(/ShiftLeft.*Move left.*Hold/) });
  expect(app.projection()).toEqual(before); expect(app.hasPendingSave()).toBe(false);
  expect(await repository.getSettings()).toEqual({ revision: 0, settings: before });
});

it.each(continuousShiftCases)('historical %s / %s remains readable and replayable while a normal-key correction saves', async (action, code) => {
  const legacy = structuredClone(DEFAULT_SETTINGS); legacy.bindings.hold = ['KeyC']; legacy.bindings[action] = [code];
  const command: SaveSettingsCommand = { operationId: 'legacy-' + action + code, expectedRevision: 0, settings: legacy };
  const receipt = { operationId: command.operationId, revision: 1, fingerprint: JSON.stringify({ expectedRevision: 0, settings: legacy }) };
  const seed = { revision: 1, settings: structuredClone(legacy) }, receipts = [structuredClone(receipt)];
  const repository = new InMemorySettingsRepository(seed, receipts);
  // Hydration takes defensive copies of acknowledged settings and receipts.
  seed.settings.bindings[action] = ['KeyP']; receipts[0]!.fingerprint = 'caller mutation';
  let generated = 0;
  const app = new SettingsApplication(repository, () => 'correction-' + ++generated);
  expect(await app.open()).toEqual(legacy);
  expect(await repository.saveSettings(command)).toEqual({ revision: 1, settings: legacy });
  await expect(repository.saveSettings({ ...command, operationId: 'stale-incompatible' })).rejects.toMatchObject({ code: 'STALE_SETTINGS' });
  await expect(repository.saveSettings({ ...command, operationId: 'new-incompatible', expectedRevision: 1 })).rejects.toMatchObject({ code: 'INCOMPATIBLE_BINDING' });
  await expect(app.save(legacy)).rejects.toMatchObject({ code: 'INCOMPATIBLE_BINDING' });
  expect(generated).toBe(0); expect(app.hasPendingSave()).toBe(false);
  expect(await repository.getSettings()).toEqual({ revision: 1, settings: legacy });

  const correction = app.projection(); correction.bindings[action] = { left: ['KeyA'], right: ['KeyD'], down: ['KeyS'] }[action];
  expect(await app.save(correction)).toEqual(correction); expect(generated).toBe(1);
  const correctedState = { revision: 2, settings: correction };
  expect(await repository.saveSettings(command)).toEqual(correctedState);
  expect(await repository.getSettings()).toEqual(correctedState);
  // A later snapshot still validates the original receipt without translating its contents.
  const restored = new InMemorySettingsRepository(correctedState, [receipt, {
    operationId: 'correction-1', revision: 2, fingerprint: JSON.stringify({ expectedRevision: 1, settings: correction }),
  }]);
  expect(await new SettingsApplication(restored, () => 'unused').open()).toEqual(correction);
  expect(await restored.saveSettings(command)).toEqual(correctedState);
});



const sparseBindingCases: Array<[string, () => string[]]> = [
  ['sparse-only', () => new Array<string>(1)],
  ['leading hole', () => { const codes = new Array<string>(2); codes[1] = 'KeyJ'; return codes; }],
  ['interior hole', () => { const codes = new Array<string>(3); codes[0] = 'KeyH'; codes[2] = 'KeyK'; return codes; }],
  ['trailing hole', () => { const codes = new Array<string>(2); codes[0] = 'KeyH'; return codes; }],
];
it.each(sparseBindingCases)('a %s binding cannot publish, reserve a receipt or block a later valid save', async (_name, createCodes) => {
  class ObservedSettingsRepository extends InMemorySettingsRepository {
    calls: SaveSettingsCommand[] = [];
    override async saveSettings(command: SaveSettingsCommand) {
      this.calls.push(structuredClone(command)); return super.saveSettings(command);
    }
  }
  const acknowledged = structuredClone(DEFAULT_SETTINGS);
  acknowledged.bindings.drop = ['KeyP']; acknowledged.audio.music = { volume: 19, muted: true }; acknowledged.reducedMotion = true;
  const originalCommand: SaveSettingsCommand = { operationId: 'before-sparse', expectedRevision: 0, settings: acknowledged };
  const originalReceipt = { operationId: originalCommand.operationId, revision: 1, fingerprint: settingsCommandFingerprint(originalCommand) };
  const originalState = { revision: 1, settings: acknowledged };
  const repository = new ObservedSettingsRepository(originalState, [originalReceipt]);
  let generated = 0;
  const app = new SettingsApplication(repository, () => 'after-sparse-' + ++generated);
  const before = await app.open(), draft = structuredClone(before); draft.bindings.drop = createCodes();
  const rejection = { code: 'INVALID_SETTINGS', message: expect.stringContaining('Hard drop requires a physical key') };

  await expect(app.save(draft)).rejects.toMatchObject(rejection);
  expect(generated).toBe(0); expect(app.hasPendingSave()).toBe(false);
  expect(app.projection()).toEqual(before); expect(repository.calls).toEqual([]);
  expect(await repository.getSettings()).toEqual(originalState);
  const rejectedCommand: SaveSettingsCommand = { operationId: 'after-sparse-1', expectedRevision: 1, settings: draft };
  expect(() => validateSettings(draft)).toThrow(/Hard drop requires a physical key/);
  expect(() => settingsCommandFingerprint(rejectedCommand)).toThrow(/Hard drop requires a physical key/);
  await expect(repository.saveSettings(rejectedCommand)).rejects.toMatchObject(rejection);
  expect(await repository.getSettings()).toEqual(originalState);
  expect(app.projection()).toEqual(before); expect(app.hasPendingSave()).toBe(false);

  // Rejection must not reserve its identity or replace acknowledged preferences.
  const valid = app.projection(); valid.bindings.drop = ['KeyJ', 'KeyH', 'KeyK'];
  const validCommand = { ...rejectedCommand, settings: valid }, nextState = { revision: 2, settings: valid };
  expect(await app.save(valid)).toEqual(valid); expect(generated).toBe(1); expect(app.hasPendingSave()).toBe(false);
  expect(repository.calls).toHaveLength(2); expect(repository.calls[1]).toEqual(validCommand);
  expect(await repository.getSettings()).toEqual(nextState);
  expect(await repository.saveSettings(originalCommand)).toEqual(nextState);
  expect(await repository.saveSettings(validCommand)).toEqual(nextState);
  expect(await repository.getSettings()).toEqual(nextState);
  expect(await new SettingsApplication(repository, () => 'unused').open()).toEqual(valid);

  // Public state and canonical receipt history reopen together.
  const restored = new InMemorySettingsRepository(await repository.getSettings(), [
    originalReceipt,
    { operationId: validCommand.operationId, revision: 2, fingerprint: settingsCommandFingerprint(validCommand) },
  ]);
  expect(await new SettingsApplication(restored, () => 'unused').open()).toEqual(valid);
  expect(await restored.saveSettings(originalCommand)).toEqual(nextState);
  expect(await restored.saveSettings(validCommand)).toEqual(nextState);
});

it('dense binding canonicalization preserves order without invoking caller array helpers', () => {
  const expected = structuredClone(DEFAULT_SETTINGS); expected.bindings.drop = ['KeyJ', 'KeyH', 'KeyK'];
  const input = structuredClone(expected), codes = input.bindings.drop;
  Object.defineProperty(codes, 'map', { value: () => { throw Error('Caller binding map must not run'); } });
  Object.defineProperty(codes, Symbol.iterator, { value: () => { throw Error('Caller binding iterator must not run'); } });
  const canonical = validateSettings(input);
  expect(canonical).toEqual(expected); expect(canonical.bindings.drop).not.toBe(codes);
  expect(settingsCommandFingerprint({ operationId: 'dense-canonical', expectedRevision: 0, settings: input }))
    .toBe(JSON.stringify({ expectedRevision: 0, settings: expected }));
  codes[0] = 'KeyP'; expect(canonical).toEqual(expected);
});
