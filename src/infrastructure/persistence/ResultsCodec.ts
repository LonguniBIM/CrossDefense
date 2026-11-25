import { z } from 'zod';
import { MODULE_SUBTYPES } from '../../domain/content/contentPack';
import { assertEconomy, outcomeFingerprint, rewardPreview, type OutcomeSettlement } from '../../domain/results/settlement';
import type { CombatOutcome } from '../../domain/combat/collection';
const Id = z.string().min(1).refine(value => value.trim().length > 0);
const Whole = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Stamp = z.string().refine(value => Number.isFinite(Date.parse(value)));
const Ids = z.array(Id).refine(values => new Set(values).size === values.length);
const Amount = z.object({ credits: Whole, celestium: Whole }).strict();
export const CargoStateSchema = z.object({ revision: Whole.positive(),
  tiles: z.array(z.object({ id: Id, letter: z.string().regex(/^[A-Z]$/), subtype: z.enum(MODULE_SUBTYPES) }).strict()).max(24),
}).strict();
export const PilotEconomySchema = z.object({ pilotId: Id, credits: Whole, celestium: Whole, firstClearMapIds: Ids, revision: Whole }).strict().superRefine((value, context) => {
  try { assertEconomy(value); } catch { context.addIssue({ code: 'custom', message: 'Pilot economy is invalid.' }); }
});
export const OutcomeSettlementSchema = z.object({ attemptId: Id, pilotId: Id, runId: Id, mapId: Id,
  outcomeFingerprint: Id, firstClear: z.boolean(), repeatable: Amount, firstClearBonus: Amount, total: Amount,
  economyRevision: Whole.positive(), recordedAt: Stamp,
}).strict().refine(value => value.total.credits === value.repeatable.credits + value.firstClearBonus.credits &&
  value.total.celestium === value.repeatable.celestium + value.firstClearBonus.celestium, 'Settlement sums are inconsistent.');
export const OutcomeOperationSchema = z.object({ operationId: Id, pilotId: Id, runId: Id, attemptId: Id,
  kind: z.literal('settle-outcome'), fingerprint: Id }).strict();
export const CargoOperationSchema = z.object({ operationId: Id, pilotId: Id, runId: Id, kind: z.literal('resolve-salvage'),
  fingerprint: Id, keptIds: Ids, discardedIds: Ids, removedRetainedIds: Ids, cargoRevision: Whole.positive(), recordedAt: Stamp }).strict();

/** A receipt is bound to its immutable source, not a freely editable total or success flag. */
export function validateSettlement(receipt: OutcomeSettlement, outcome: CombatOutcome): void {
  OutcomeSettlementSchema.parse(receipt);
  if (receipt.pilotId !== outcome.pilotId || receipt.runId !== outcome.runId || receipt.attemptId !== outcome.attemptId ||
      receipt.mapId !== outcome.mapId || receipt.outcomeFingerprint !== outcomeFingerprint(outcome)) {
    throw new Error('Settlement receipt references a different saved outcome.');
  }
  const amounts = outcome.terminal.kind === 'victory' ? rewardPreview(outcome.rewards, outcome.difficulty, receipt.firstClear) : {
    repeatable: { credits: 0, celestium: 0 }, firstClearBonus: { credits: 0, celestium: 0 }, total: { credits: 0, celestium: 0 },
  };
  if (outcome.terminal.kind !== 'victory' && receipt.firstClear ||
      JSON.stringify(receipt.repeatable) !== JSON.stringify(amounts.repeatable) ||
      JSON.stringify(receipt.firstClearBonus) !== JSON.stringify(amounts.firstClearBonus) ||
      JSON.stringify(receipt.total) !== JSON.stringify(amounts.total)) throw new Error('Settlement amounts do not match their saved reward definitions.');
}
