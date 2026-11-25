import { InMemoryResultsRepository } from './InMemoryResultsRepository';
import type { ReviewRepository, ReviewState } from '../../application/review/ReviewRepository';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import { assertEconomyLedger } from '../../domain/results/settlement';
import { RunOperationConflictError } from '../../application/run/RunRepository';
import { ensureReviewOccurrence, applyReviewCommand, assertReviewHistory, ensureReviewFingerprint,
  reviewCommandFingerprint, ReviewRejection, type EnsureReviewCommand, type ReviewCommand,
  type ReviewOccurrence, type ReviewOutcomeLink, type ReviewOperationReceipt } from '../../domain/review/occurrence';

/** Fast public-scenario adapter; native IndexedDB tests prove durable rollback separately. */
export class InMemoryReviewRepository extends InMemoryResultsRepository implements ReviewRepository {
  private readonly occurrences = new Map<string, ReviewOccurrence>();
  private readonly links = new Map<string, ReviewOutcomeLink>();
  private readonly reviewOperations = new Map<string, ReviewOperationReceipt>();
  private reviewState(pilotId: string, occurrenceId?: string): ReviewState {
    const state = this.state(pilotId);
    const occurrences = [...this.occurrences.values()].filter(value => value.pilotId === pilotId);
    const links = [...this.links.values()].filter(value => value.pilotId === pilotId);
    const rewards = [...this.reviewRewards.values()].filter(value => value.pilotId === pilotId);
    assertReviewHistory(occurrences, links, rewards, state.outcomes.map(row => row.outcome),
      state.outcomes.flatMap(row => row.settlement ? [row.settlement] : []));
    if (occurrenceId !== undefined && !occurrences.some(value => value.occurrenceId === occurrenceId)) {
      throw new ReviewRejection('OCCURRENCE_REQUIRED', 'Choose a saved Review Occurrence owned by this Pilot.');
    }
    return structuredClone({ run: state.run, economy: state.economy, occurrences, links, rewards,
      selectedOccurrenceId: occurrenceId ?? null });
  }
  async getReview(pilotId: string, occurrenceId?: string): Promise<ReviewState> { return this.reviewState(pilotId, occurrenceId); }
  async ensureReview(command: EnsureReviewCommand, pack: ContentPackManifest): Promise<ReviewState> {
    const input = structuredClone(command), fingerprint = ensureReviewFingerprint(input), state = this.state(input.pilotId);
    if (state.run.runId !== input.runId) throw new ReviewRejection('TARGET_MISMATCH', 'Review targets a different saved Run.');
    const prior = this.reviewOperations.get(input.operationId);
    if (prior) {
      if (prior.fingerprint !== fingerprint || prior.kind !== input.kind || prior.pilotId !== input.pilotId || prior.runId !== input.runId) throw new RunOperationConflictError();
      return this.reviewState(input.pilotId, prior.occurrenceId);
    }
    const row = state.outcomes.find(row => row.outcome.attemptId === input.attemptId);
    if (!row) throw new ReviewRejection('OUTCOME_REQUIRED', 'Choose a saved result before Review.');
    const next = ensureReviewOccurrence(state.run, row.outcome, row.settlement, structuredClone(pack),
      [...this.occurrences.values()], [...this.links.values()], input);
    const occurrences = [...this.occurrences.values()].filter(value => value.occurrenceId !== next.occurrence.occurrenceId && value.pilotId === input.pilotId);
    const links = [...this.links.values()].filter(value => value.attemptId !== next.link.attemptId && value.pilotId === input.pilotId);
    assertReviewHistory([...occurrences, next.occurrence], [...links, next.link],
      [...this.reviewRewards.values()].filter(value => value.pilotId === input.pilotId),
      state.outcomes.map(row => row.outcome), state.outcomes.flatMap(row => row.settlement ? [row.settlement] : []));
    // No await between validation, receipt and aggregate publication.
    this.occurrences.set(next.occurrence.occurrenceId, structuredClone(next.occurrence));
    this.links.set(next.link.attemptId, structuredClone(next.link));
    this.reviewOperations.set(input.operationId, { operationId: input.operationId, pilotId: input.pilotId,
      runId: input.runId, occurrenceId: next.occurrence.occurrenceId, kind: input.kind, fingerprint });
    return this.reviewState(input.pilotId, next.occurrence.occurrenceId);
  }
  async applyReview(command: ReviewCommand): Promise<ReviewState> {
    const input = structuredClone(command), fingerprint = reviewCommandFingerprint(input);
    const state = this.reviewState(input.pilotId, input.occurrenceId), results = this.state(input.pilotId);
    if (state.run.runId !== input.runId) throw new ReviewRejection('TARGET_MISMATCH', 'Review targets a different saved Run.');
    const prior = this.reviewOperations.get(input.operationId);
    if (prior) {
      if (prior.fingerprint !== fingerprint || prior.kind !== input.kind || prior.pilotId !== input.pilotId ||
          prior.runId !== input.runId || prior.occurrenceId !== input.occurrenceId) throw new RunOperationConflictError();
      return state;
    }
    const occurrence = state.occurrences.find(value => value.occurrenceId === input.occurrenceId)!;
    const next = applyReviewCommand(state.run, state.economy, occurrence, input);
    const occurrences = state.occurrences.map(value => value.occurrenceId === input.occurrenceId ? next.occurrence : value);
    const rewards = next.reward ? [...state.rewards, next.reward] : state.rewards;
    const settlements = results.outcomes.flatMap(row => row.settlement ? [row.settlement] : []);
    assertReviewHistory(occurrences, state.links, rewards, results.outcomes.map(row => row.outcome), settlements);
    assertEconomyLedger(next.economy, settlements, rewards);
    this.occurrences.set(input.occurrenceId, structuredClone(next.occurrence));
    if (next.reward) {
      this.reviewRewards.set(input.occurrenceId, structuredClone(next.reward));
      this.economies.set(input.pilotId, structuredClone(next.economy));
      this.runsByPilot.set(input.pilotId, structuredClone(next.run));
    }
    this.reviewOperations.set(input.operationId, { operationId: input.operationId, pilotId: input.pilotId,
      runId: input.runId, occurrenceId: input.occurrenceId, kind: input.kind, fingerprint });
    return this.reviewState(input.pilotId, input.occurrenceId);
  }
}
