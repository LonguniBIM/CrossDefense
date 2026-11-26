import { validateSettings, SettingsRejection, type WorkspaceSettings } from '../../domain/workspace/settings';

export interface SettingsState { revision: number; settings: WorkspaceSettings; }
export interface SaveSettingsCommand { operationId: string; expectedRevision: number; settings: WorkspaceSettings; }
export interface SettingsOperation { operationId: string; fingerprint: string; revision: number; }
export interface SettingsRepository {
  getSettings(): Promise<SettingsState>;
  saveSettings(command: SaveSettingsCommand): Promise<SettingsState>;
}
export function validatedSettingsCommand(command: SaveSettingsCommand): SaveSettingsCommand {
  if (!command || Object.keys(command).length !== 3 || typeof command.operationId !== 'string' ||
    !command.operationId.trim() || command.operationId.length > 200 || !Number.isSafeInteger(command.expectedRevision) ||
    command.expectedRevision < 0 || command.expectedRevision >= Number.MAX_SAFE_INTEGER) {
    throw new SettingsRejection('INVALID_SETTINGS', 'Settings save requires an operation ID and a valid revision.');
  }
  return { operationId: command.operationId, expectedRevision: command.expectedRevision, settings: validateSettings(command.settings) };
}
export function settingsCommandFingerprint(command: SaveSettingsCommand): string {
  const input = validatedSettingsCommand(command);
  return JSON.stringify({ expectedRevision: input.expectedRevision, settings: input.settings });
}
