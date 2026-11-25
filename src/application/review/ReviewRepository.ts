import type { ActiveRun } from '../../domain/run/run';
import type { ResultsState } from '../results/ResultsRepository';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import type { PilotEconomy } from '../../domain/results/settlement';
import type { EnsureReviewCommand, ReviewCommand, ReviewOccurrence, ReviewOutcomeLink, ReviewRewardReceipt } from '../../domain/review/occurrence';

export interface ReviewState {
  run: ActiveRun; economy: PilotEconomy; occurrences: ReviewOccurrence[];
  links: ReviewOutcomeLink[]; rewards: ReviewRewardReceipt[]; selectedOccurrenceId: string | null;
}
/** Native adapters publish linked offers or response/hint evidence and reward/economy in one transaction. */
export interface ReviewRepository {
  getResults(pilotId: string): Promise<ResultsState>;
  getReview(pilotId: string, occurrenceId?: string): Promise<ReviewState>;
  ensureReview(command: EnsureReviewCommand, pack: ContentPackManifest): Promise<ReviewState>;
  applyReview(command: ReviewCommand): Promise<ReviewState>;
}
