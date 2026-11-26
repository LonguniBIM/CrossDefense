import { settingsCommandFingerprint, validatedSettingsCommand, type SettingsRepository, type SettingsState,
  type SaveSettingsCommand, type SettingsOperation } from '../../application/workspace/SettingsRepository';
import { DEFAULT_SETTINGS, SettingsRejection, validateSettingsForSave } from '../../domain/workspace/settings';
import { SettingsStateSchema, SettingsOperationSchema, validateSettingsHistory } from './SettingsCodec';

/** Fast public-scenario adapter; browser tests separately prove native durability. */
export class InMemorySettingsRepository implements SettingsRepository {
  private state: SettingsState;
  private readonly operations = new Map<string, SettingsOperation>();
  constructor(initial: SettingsState = { revision: 0, settings: DEFAULT_SETTINGS }, receipts: readonly SettingsOperation[] = []) {
    const state = SettingsStateSchema.parse(initial), operations = receipts.map(receipt => SettingsOperationSchema.parse(receipt));
    validateSettingsHistory(state, operations);
    this.state = structuredClone(state);
    for (const receipt of operations) this.operations.set(receipt.operationId, structuredClone(receipt));
  }
  async getSettings(): Promise<SettingsState> { return structuredClone(this.state); }
  async saveSettings(command: SaveSettingsCommand): Promise<SettingsState> {
    const input = validatedSettingsCommand(command), fingerprint = settingsCommandFingerprint(input);
    const previous = this.operations.get(input.operationId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new SettingsRejection('OPERATION_CONFLICT', 'This Settings operation ID was used for another change.');
      return this.getSettings();
    }
    if (input.expectedRevision !== this.state.revision) throw new SettingsRejection('STALE_SETTINGS', 'Settings changed. Reopen Settings before saving again.');
    this.state = { revision: this.state.revision + 1, settings: validateSettingsForSave(input.settings) };
    this.operations.set(input.operationId, { operationId: input.operationId, fingerprint, revision: this.state.revision });
    return this.getSettings();
  }
}
