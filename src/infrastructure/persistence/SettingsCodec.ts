import { z } from 'zod';
import { DEFAULT_SETTINGS, validateSettings, type WorkspaceSettings } from '../../domain/workspace/settings';
import { settingsCommandFingerprint, type SettingsState, type SettingsOperation } from '../../application/workspace/SettingsRepository';

const SettingsValueSchema = z.unknown().transform((value, context): WorkspaceSettings => {
  try { return validateSettings(value); }
  catch (error) {
    context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : String(error) });
    return z.NEVER;
  }
});
export const SettingsStateSchema = z.object({
  revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  settings: SettingsValueSchema,
}).strict();
export const SettingsRecordSchema = SettingsStateSchema.extend({ key: z.literal('settings') });
export const SettingsOperationSchema = z.object({
  operationId: z.string().min(1).max(200), fingerprint: z.string().min(1).max(10000),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
}).strict();
export type SettingsRecord = z.infer<typeof SettingsRecordSchema>;

/** Settings and their once-only receipts form one atomic history, never a default-on-corruption fallback. */
export function validateSettingsHistory(state: SettingsState, receipts: readonly SettingsOperation[]): void {
  if (receipts.length !== state.revision || new Set(receipts.map(value => value.operationId)).size !== receipts.length ||
    new Set(receipts.map(value => value.revision)).size !== receipts.length || receipts.some(value => value.revision > state.revision)) {
    throw Error('Workspace settings and save receipts disagree.');
  }
  let acknowledged = validateSettings(DEFAULT_SETTINGS);
  for (const receipt of receipts) {
    const payload = z.object({ expectedRevision: z.literal(receipt.revision - 1), settings: SettingsValueSchema }).strict().parse(JSON.parse(receipt.fingerprint));
    if (settingsCommandFingerprint({ operationId: receipt.operationId, ...payload }) !== receipt.fingerprint) {
      throw Error('Settings receipt is not canonical.');
    }
    if (receipt.revision === state.revision) acknowledged = payload.settings;
  }
  if (JSON.stringify(acknowledged) !== JSON.stringify(validateSettings(state.settings))) throw Error('Saved settings disagree with their acknowledged receipt.');
}
