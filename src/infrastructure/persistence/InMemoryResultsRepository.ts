import { InMemoryAttemptRepository } from './InMemoryAttemptRepository';
import type { ResultsRepository, ResultsState } from '../../application/results/ResultsRepository';
import type { ActiveRun } from '../../domain/run/run';
import type { BuildContent } from '../../domain/content/contentPack';
import { emptyEconomy, assertEconomyLedger, applyOutcomeSettlement, settlementFingerprint, ResultRejection,
  type PilotEconomy, type OutcomeSettlement, type OutcomeOperationReceipt, type SettleOutcomeCommand } from '../../domain/results/settlement';
import { applyCargoResolution, cargoResolutionFingerprint, type CargoOperationReceipt, type CargoResolutionCommand } from '../../domain/results/salvageResolution';
import { RunOperationConflictError } from '../../application/run/RunRepository';
import { validateSettlement } from './ResultsCodec';
import type { ReviewRewardReceipt } from '../../domain/review/occurrence';

/** Fast atomic public-scenario adapter. Real IndexedDB tests prove transactional rollback separately. */
export class InMemoryResultsRepository extends InMemoryAttemptRepository implements ResultsRepository {
  protected readonly economies = new Map<string, PilotEconomy>();
  protected readonly reviewRewards = new Map<string, ReviewRewardReceipt>();
  private readonly settlements = new Map<string, OutcomeSettlement>();
  private readonly outcomeReceipts = new Map<string, OutcomeOperationReceipt>();
  private readonly cargoReceipts = new Map<string, CargoOperationReceipt>();
  protected state(pilotId: string): ResultsState {
    const run = this.runsByPilot.get(pilotId);
    if (!run || !this.pilots.has(pilotId)) throw new ResultRejection('PILOT_REQUIRED', 'Choose an existing Pilot and Run.');
    const outcomes = [...this.combatOutcomes.values()].filter(outcome => outcome.pilotId === pilotId);
    const receipts = [...this.settlements.values()].filter(receipt => receipt.pilotId === pilotId);
    const reviewRewards = [...this.reviewRewards.values()].filter(receipt => receipt.pilotId === pilotId);
    const saved = this.economies.get(pilotId);
    if (!saved && (receipts.length || reviewRewards.length)) throw Error('Settlement economy is missing.');
    const economy = saved ?? emptyEconomy(pilotId);
    for (const receipt of receipts) {
      const outcome = outcomes.find(value => value.attemptId === receipt.attemptId);
      if (!outcome) throw Error('Settlement lost its source.');
      validateSettlement(receipt, outcome);
    }
    assertEconomyLedger(economy, receipts, reviewRewards);
    return structuredClone({ run, economy, outcomes: outcomes.map(outcome => ({ outcome, settlement: this.settlements.get(outcome.attemptId) ?? null })) });
  }
  async getResults(pilotId: string): Promise<ResultsState> { return this.state(pilotId); }
  async settleOutcome(command: SettleOutcomeCommand): Promise<ResultsState> {
    const input = structuredClone(command), fingerprint = settlementFingerprint(input), state = this.state(input.pilotId);
    if (state.run.runId !== input.runId) throw new ResultRejection('TARGET_MISMATCH', 'Settlement targets another Run.');
    const prior = this.outcomeReceipts.get(input.operationId);
    if (prior) { if (prior.fingerprint !== fingerprint || prior.pilotId !== input.pilotId || prior.runId !== input.runId || prior.attemptId !== input.attemptId) throw new RunOperationConflictError(); return state; }
    const row = state.outcomes.find(row => row.outcome.attemptId === input.attemptId);
    if (!row) throw new ResultRejection('OUTCOME_REQUIRED', 'Select a saved outcome.');
    if (state.run.phase !== 'build') throw new ResultRejection('BUILD_REQUIRED', 'Settle results from safe Build.');
    const next = row.settlement ? null : applyOutcomeSettlement(state.run, row.outcome, state.economy, input);
    // No await between calculation, receipt and aggregate publication.
    if (next) {
      this.economies.set(input.pilotId, structuredClone(next.economy));
      this.runsByPilot.set(input.pilotId, structuredClone(next.run));
      this.settlements.set(input.attemptId, structuredClone(next.settlement));
    }
    this.outcomeReceipts.set(input.operationId, { ...input, fingerprint });
    return this.state(input.pilotId);
  }
  async resolveCargo(command: CargoResolutionCommand, content: BuildContent): Promise<ActiveRun> {
    const input = structuredClone(command), fingerprint = cargoResolutionFingerprint(input);
    const current = this.requireRun(input.pilotId, input.runId), prior = this.cargoReceipts.get(input.operationId);
    if (prior) { if (prior.fingerprint !== fingerprint || prior.pilotId !== input.pilotId || prior.runId !== input.runId) throw new RunOperationConflictError(); return structuredClone(current); }
    const next = applyCargoResolution(current, structuredClone(content), input);
    this.runsByPilot.set(input.pilotId, structuredClone(next));
    this.cargoReceipts.set(input.operationId, { operationId: input.operationId, pilotId: input.pilotId, runId: input.runId,
      kind: input.kind, fingerprint, keptIds: input.keepIds, discardedIds: input.discardIds,
      removedRetainedIds: input.removeRetainedIds, cargoRevision: next.cargo!.revision, recordedAt: input.recordedAt });
    return structuredClone(next);
  }
}
