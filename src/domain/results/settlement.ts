import type { ActiveRun } from '../run/run';
import type { ReviewRewardReceipt } from '../review/occurrence';
import type { CombatOutcome } from '../combat/collection';
import type { CombatRewards } from '../combat/content';
import type { Difficulty } from '../attempt/rules';
import { isDifficulty } from '../attempt/rules';
import { COMBAT_RULESET_VERSION } from '../combat/rules';
import { assertBuildState } from '../build/shipBuild';
import { assertAttemptState } from '../attempt/attempt';

export interface PilotEconomy {
  pilotId: string; credits: number; celestium: number; firstClearMapIds: string[]; revision: number;
}
export interface CurrencyAmount { credits: number; celestium: number; }
export interface OutcomeSettlement {
  attemptId: string; pilotId: string; runId: string; mapId: string;
  outcomeFingerprint: string; firstClear: boolean; repeatable: CurrencyAmount;
  firstClearBonus: CurrencyAmount; total: CurrencyAmount; economyRevision: number; recordedAt: string;
}
export interface SettleOutcomeCommand {
  kind: 'settle-outcome'; operationId: string; pilotId: string; runId: string; attemptId: string; recordedAt: string;
}
export interface OutcomeOperationReceipt {
  operationId: string; pilotId: string; runId: string; attemptId: string; kind: 'settle-outcome'; fingerprint: string;
}
export class ResultRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
const validId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
export function emptyEconomy(pilotId: string): PilotEconomy {
  if (!validId(pilotId)) throw new ResultRejection('PILOT_REQUIRED', 'Choose an existing Pilot.');
  return { pilotId, credits: 0, celestium: 0, firstClearMapIds: [], revision: 0 };
}
export function assertEconomy(value: PilotEconomy): void {
  if (!value || !validId(value.pilotId) || !whole(value.credits) || !whole(value.celestium) || !whole(value.revision) ||
      !Array.isArray(value.firstClearMapIds) || value.firstClearMapIds.some(id => !validId(id)) ||
      new Set(value.firstClearMapIds).size !== value.firstClearMapIds.length) {
    throw new ResultRejection('INVALID_ECONOMY', 'Pilot economy is invalid. Recover existing data; do not reset balances.');
  }
}
export function settlementFingerprint(command: SettleOutcomeCommand): string {
  if (command.kind !== 'settle-outcome' || ![command.operationId, command.pilotId, command.runId, command.attemptId].every(validId) ||
      !validId(command.recordedAt) || !Number.isFinite(Date.parse(command.recordedAt))) {
    throw new ResultRejection('INVALID_SETTLEMENT', 'Settlement needs an explicit operation, owner, outcome and timestamp.');
  }
  return JSON.stringify([command.kind, command.pilotId, command.runId, command.attemptId, command.recordedAt]);
}
function assertRewards(rewards: CombatRewards): void {
  if (!rewards || rewards.firstClearScope !== 'pilot-map' || rewards.settlement !== 'ticket09-only' ||
      [rewards.repeatable, rewards.firstClear].some(amount => !amount || !whole(amount.credits) || !whole(amount.celestium))) {
    throw new ResultRejection('INVALID_REWARDS', 'Frozen reward definitions are missing or invalid.');
  }
}
export function outcomeFingerprint(outcome: CombatOutcome): string {
  if (!outcome || ![outcome.attemptId, outcome.pilotId, outcome.runId, outcome.mapId, outcome.contentVersion, outcome.seed].every(validId) ||
      outcome.rulesetVersion !== COMBAT_RULESET_VERSION || !/^[a-f0-9]{64}$/.test(outcome.contentDigest) || !isDifficulty(outcome.difficulty) ||
      !outcome.terminal || !['victory', 'failed', 'abandoned', 'interrupted'].includes(outcome.terminal.kind) ||
      !Array.isArray(outcome.terminal.causes) || !Array.isArray(outcome.collectedIds) || outcome.collectedIds.length > 24 ||
      new Set(outcome.collectedIds).size !== outcome.collectedIds.length || outcome.collectedIds.some(id => !validId(id) || !id.startsWith(outcome.attemptId + ':payload:')) ||
      !whole(outcome.lastCommittedTick) || !Number.isFinite(Date.parse(outcome.recordedAt))) {
    throw new ResultRejection('INVALID_OUTCOME', 'An existing valid saved outcome is required before settlement.');
  }
  const victory = outcome.terminal.kind === 'victory', causes = outcome.terminal.causes;
  if (victory !== (outcome.settlement === 'pending-ticket09') ||
      (outcome.terminal.kind === 'failed') !== (causes.length > 0) ||
      JSON.stringify(causes) !== JSON.stringify(['Hull destroyed', 'Top-out', 'Timeout'].filter(cause => causes.includes(cause as typeof causes[number]))) ||
      (['victory', 'failed'].includes(outcome.terminal.kind) ? !whole(outcome.tick) || outcome.tick === 0 || outcome.tick !== outcome.lastCommittedTick : outcome.tick !== null)) {
    throw new ResultRejection('INVALID_OUTCOME', 'Saved terminal causes, tick or reward eligibility are inconsistent.');
  }
  assertRewards(outcome.rewards);
  return JSON.stringify([outcome.attemptId, outcome.pilotId, outcome.runId, outcome.mapId, outcome.difficulty,
    outcome.contentVersion, outcome.rulesetVersion, outcome.contentDigest, outcome.seed, outcome.terminal.kind,
    causes, outcome.tick, outcome.lastCommittedTick, [...outcome.collectedIds].sort(),
    outcome.rewards.repeatable.credits, outcome.rewards.repeatable.celestium,
    outcome.rewards.firstClear.credits, outcome.rewards.firstClear.celestium, outcome.recordedAt]);
}

/** Q13 ratios produce exact integer rewards; no unapproved fractional rounding is invented. */
export function rewardPreview(rewards: CombatRewards, difficulty: Difficulty, firstClear: boolean): {
  repeatable: CurrencyAmount; firstClearBonus: CurrencyAmount; total: CurrencyAmount;
} {
  assertRewards(rewards);
  const ratios: Record<Difficulty, readonly [number, number]> = { Easy: [3, 4], Normal: [1, 1], Hard: [3, 2], Insane: [9, 4] };
  if (!isDifficulty(difficulty)) throw new ResultRejection('INVALID_DIFFICULTY', 'Reward difficulty is invalid.');
  const [numerator, denominator] = ratios[difficulty];
  const scale = (amount: number) => {
    const value = BigInt(amount) * BigInt(numerator);
    if (value % BigInt(denominator)) throw new ResultRejection('FRACTIONAL_REWARD', 'This Ruleset requires authored rewards that yield whole currency amounts.');
    const result = Number(value / BigInt(denominator));
    if (!whole(result)) throw new ResultRejection('REWARD_OVERFLOW', 'Reward exceeds the supported exact integer range.');
    return result;
  };
  const repeatable = { credits: scale(rewards.repeatable.credits), celestium: scale(rewards.repeatable.celestium) };
  const firstClearBonus = firstClear ? { ...rewards.firstClear } : { credits: 0, celestium: 0 };
  const total = { credits: repeatable.credits + firstClearBonus.credits, celestium: repeatable.celestium + firstClearBonus.celestium };
  if (!whole(total.credits) || !whole(total.celestium)) throw new ResultRejection('REWARD_OVERFLOW', 'Reward sum is outside the exact integer range.');
  return { repeatable, firstClearBonus, total };
}

/** The transaction owner publishes this tuple once with the operation and Attempt receipt. */
export function applyOutcomeSettlement(run: ActiveRun, outcome: CombatOutcome, economy: PilotEconomy, command: SettleOutcomeCommand): {
  run: ActiveRun; economy: PilotEconomy; settlement: OutcomeSettlement;
} {
  settlementFingerprint(command); assertBuildState(run); assertAttemptState(run); assertEconomy(economy);
  const fingerprint = outcomeFingerprint(outcome);
  if (run.phase !== 'build') throw new ResultRejection('BUILD_REQUIRED', 'Return to safe Build before settling a result.');
  if (command.pilotId !== run.pilotId || command.runId !== run.runId || outcome.pilotId !== run.pilotId ||
      outcome.runId !== run.runId || outcome.attemptId !== command.attemptId || economy.pilotId !== run.pilotId) {
    throw new ResultRejection('TARGET_MISMATCH', 'Settlement must use the same saved Pilot, Run and outcome.');
  }
  const victory = outcome.terminal.kind === 'victory';
  const firstClear = victory && !economy.firstClearMapIds.includes(outcome.mapId);
  const amounts = victory ? rewardPreview(outcome.rewards, outcome.difficulty, firstClear) : {
    repeatable: { credits: 0, celestium: 0 }, firstClearBonus: { credits: 0, celestium: 0 }, total: { credits: 0, celestium: 0 },
  };
  const nextEconomy: PilotEconomy = { ...structuredClone(economy), revision: economy.revision + 1,
    credits: economy.credits + amounts.total.credits, celestium: economy.celestium + amounts.total.celestium,
    firstClearMapIds: firstClear ? [...economy.firstClearMapIds, outcome.mapId] : [...economy.firstClearMapIds] };
  assertEconomy(nextEconomy);
  const nextRun = structuredClone(run); nextRun.economyRevision = (run.economyRevision ?? 0) + 1;
  if (victory) nextRun.clearedMapIds = [...new Set([...(run.clearedMapIds ?? []), outcome.mapId])];
  assertBuildState(nextRun); assertAttemptState(nextRun);
  const settlement: OutcomeSettlement = { attemptId: outcome.attemptId, pilotId: outcome.pilotId, runId: outcome.runId,
    mapId: outcome.mapId, outcomeFingerprint: fingerprint, firstClear, ...amounts,
    economyRevision: nextEconomy.revision, recordedAt: command.recordedAt };
  return { run: nextRun, economy: nextEconomy, settlement };
}

/** Missing/corrupt economy must not be silently treated as a new zero-balance Pilot. */
export function assertEconomyLedger(economy: PilotEconomy, settlements: readonly OutcomeSettlement[],
  reviewRewards: readonly ReviewRewardReceipt[] = []): void {
  assertEconomy(economy);
  const firsts = settlements.filter(receipt => receipt.firstClear).map(receipt => receipt.mapId);
  const receipts = [...settlements, ...reviewRewards];
  if (receipts.some(receipt => receipt.pilotId !== economy.pilotId) ||
      new Set(firsts).size !== firsts.length ||
      JSON.stringify([...firsts].sort()) !== JSON.stringify([...economy.firstClearMapIds].sort()) ||
      economy.credits !== receipts.reduce((sum, receipt) => sum + receipt.total.credits, 0) ||
      economy.celestium !== receipts.reduce((sum, receipt) => sum + receipt.total.celestium, 0) ||
      economy.revision !== receipts.length ||
      new Set(receipts.map(receipt => receipt.economyRevision)).size !== receipts.length ||
      receipts.some(receipt => !whole(receipt.economyRevision) || receipt.economyRevision < 1 || receipt.economyRevision > economy.revision) ||
      new Set(reviewRewards.map(receipt => receipt.occurrenceId)).size !== reviewRewards.length ||
      new Set(reviewRewards.map(receipt => receipt.operationId)).size !== reviewRewards.length ||
      reviewRewards.some(receipt => !validId(receipt.occurrenceId) || !validId(receipt.operationId) ||
        !whole(receipt.completionCredits) || !whole(receipt.independentFirstResponseCredits) ||
        !whole(receipt.total.credits) || receipt.total.celestium !== 0 ||
        receipt.total.credits !== receipt.completionCredits + receipt.independentFirstResponseCredits)) {
    throw new ResultRejection('ECONOMY_INTEGRITY', 'Pilot economy and reward receipts disagree. Recover saved data without resetting or paying again.');
  }
}
