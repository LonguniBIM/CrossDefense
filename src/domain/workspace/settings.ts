export const GAMEPLAY_ACTIONS = ['left', 'right', 'down', 'cw', 'ccw', 'drop', 'hold', 'pause'] as const;
export type GameplayAction = typeof GAMEPLAY_ACTIONS[number];
export type GameplayBindings = Record<GameplayAction, string[]>;
export const AUDIO_CHANNELS = ['music', 'effects', 'pronunciation'] as const;
export interface WorkspaceSettings {
  bindings: GameplayBindings;
  audio: Record<typeof AUDIO_CHANNELS[number], { volume: number; muted: boolean }>;
  reducedMotion: boolean;
}
export const ACTION_LABELS: Readonly<Record<GameplayAction, string>> = {
  left: 'Move left', right: 'Move right', down: 'Soft drop', cw: 'Rotate clockwise',
  ccw: 'Rotate counterclockwise', drop: 'Hard drop', hold: 'Hold', pause: 'Pause',
};
// Audio levels are reversible presentation initialization, not Ruleset or learning policy.
export const DEFAULT_SETTINGS: WorkspaceSettings = {
  bindings: { left: ['ArrowLeft'], right: ['ArrowRight'], down: ['ArrowDown'], cw: ['ArrowUp', 'KeyX'],
    ccw: ['KeyZ'], drop: ['Space'], hold: ['KeyC', 'ShiftLeft', 'ShiftRight'], pause: ['Escape'] },
  audio: { music: { volume: 45, muted: false }, effects: { volume: 65, muted: false },
    pronunciation: { volume: 85, muted: false } },
  reducedMotion: false,
};

export class SettingsRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'SettingsRejection'; }
}
function fields(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SettingsRejection('INVALID_SETTINGS', label + ' must be an object.');
  const record = value as Record<string, unknown>, actual = Object.keys(record);
  if (actual.length !== keys.length || actual.some(key => !keys.includes(key))) {
    throw new SettingsRejection('INVALID_SETTINGS', label + ' has missing or unsupported fields.');
  }
  return record;
}
/** Canonical values only; browser input routing remains outside Domain. */
export function validateSettings(value: unknown): WorkspaceSettings {
  const candidate = fields(value, ['bindings', 'audio', 'reducedMotion'], 'Settings');
  const source = fields(candidate.bindings, GAMEPLAY_ACTIONS, 'Controls');
  const bindings = {} as GameplayBindings, owners = new Map<string, GameplayAction>();
  for (const action of GAMEPLAY_ACTIONS) {
    const codes = source[action];
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > 3) {
      throw new SettingsRejection('INVALID_SETTINGS', ACTION_LABELS[action] + ' requires one to three keys.');
    }
    bindings[action] = Array.from({ length: codes.length }, (_, index) => {
      const code: unknown = codes[index];
      if (typeof code !== 'string' || code.length > 40 || !/^[A-Z][A-Za-z0-9]*$/.test(code) || code === 'Unidentified') {
        throw new SettingsRejection('INVALID_SETTINGS', ACTION_LABELS[action] + ' requires a physical key, without a modifier shortcut.');
      }
      if (code === 'Tab' || /^(Control|Alt|Meta|OS)(Left|Right)?$/.test(code)) {
        throw new SettingsRejection('RESERVED_KEY', code + ' is reserved for keyboard navigation or browser shortcuts.');
      }
      const owner = owners.get(code);
      if (owner !== undefined) {
        throw new SettingsRejection('KEY_CONFLICT', code + ' is assigned to ' + ACTION_LABELS[owner] + ' and ' + ACTION_LABELS[action] + '. Choose another key.');
      }
      owners.set(code, action);
      return code;
    });
  }
  const audioSource = fields(candidate.audio, AUDIO_CHANNELS, 'Audio'), audio = {} as WorkspaceSettings['audio'];
  for (const channel of AUDIO_CHANNELS) {
    const setting = fields(audioSource[channel], ['volume', 'muted'], channel);
    if (typeof setting.volume !== 'number' || !Number.isFinite(setting.volume) || setting.volume < 0 || setting.volume > 100 || typeof setting.muted !== 'boolean') {
      throw new SettingsRejection('INVALID_SETTINGS', channel + ' volume must be between 0 and 100 and mute must be true or false.');
    }
    audio[channel] = { volume: setting.volume, muted: setting.muted };
  }
  if (typeof candidate.reducedMotion !== 'boolean') throw new SettingsRejection('INVALID_SETTINGS', 'Reduced motion must be true or false.');
  return { bindings, audio, reducedMotion: candidate.reducedMotion };
}

/** New saves must use hold-capable keys for continuous actions; stored history keeps its canonical validator. */
export function validateSettingsForSave(value: unknown): WorkspaceSettings {
  const settings = validateSettings(value);
  for (const action of ['left', 'right', 'down'] as const) {
    const shift = settings.bindings[action].find(code => code === 'ShiftLeft' || code === 'ShiftRight');
    if (shift) {
      throw new SettingsRejection('INCOMPATIBLE_BINDING', shift + ' cannot control ' + ACTION_LABELS[action] +
        ': this action requires a held key. Choose a non-Shift key. Standalone Shift activates on release to preserve Shift+Tab navigation.');
    }
  }
  return settings;
}
