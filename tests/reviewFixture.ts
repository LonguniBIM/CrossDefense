import type { ContentPackManifest } from '../src/domain/content/contentPack';
import type { ReviewDefinition } from '../src/domain/review/content';
import type { ReviewOccurrence, EnsureReviewCommand, SubmitReviewCommand } from '../src/domain/review/occurrence';
import { applyOutcomeSettlement, type PilotEconomy } from '../src/domain/results/settlement';
import { combatPack } from './combatFixture';
import { resultFixture, settlementCommand } from './resultsFixture';

export const reviewDefinition: ReviewDefinition = {
  version: 'development-review-rules-v1', occurrencePolicy: 'settled-outcome-immediate-due',
  rewards: { completionCredits: 1, independentFirstResponseCredits: 1 },
  entries: [{ id: 'ship-noun-water-vessel-v1', spelling: 'SHIP', partOfSpeech: 'noun', targetSense: 'water-vessel',
    prompt: 'A large boat that carries people or goods across water. Type the English word.',
    acceptedAnswers: ['SHIP'], hints: { context: 'The ___ carries goods across the sea.',
      letter: 'It starts with S and has four letters.', reveal: 'SHIP' } }],
};
/** Synthetic content pins exercise Domain policy; content tests admit the real compiled artifact. */
export function reviewPack(): ContentPackManifest {
  return { ...combatPack(), contentVersion: 'development-review-ship-v1', schemaVersion: 5,
    review: structuredClone(reviewDefinition), integrity: { algorithm: 'SHA-256', manifestSha256: '1'.repeat(64) } };
}
export function reviewFixture(pack: ContentPackManifest = reviewPack()) {
  const fixture = resultFixture(0, 'victory', 'Normal', pack);
  const initial: PilotEconomy = { pilotId: fixture.run.pilotId, credits: 0, celestium: 0, firstClearMapIds: [], revision: 0 };
  const settled = applyOutcomeSettlement(fixture.run, fixture.outcome, initial, settlementCommand(fixture.run));
  const occurrence: ReviewOccurrence = { occurrenceId: 'review-1', pilotId: fixture.run.pilotId, entryId: 'ship-noun-water-vessel-v1',
    sourceRunId: fixture.run.runId, sourceAttemptId: fixture.outcome.attemptId, contentVersion: fixture.pack.contentVersion,
    rulesetVersion: fixture.pack.compatibleRuleset, contentDigest: fixture.pack.integrity.manifestSha256,
    definition: structuredClone(reviewDefinition), createdAt: '2026-11-25T01:00:00Z', dueAt: '2026-11-25T01:00:00Z',
    responses: [], hints: [], firstResponse: null, attemptsToFirstCorrect: null, completedAt: null,
    independentFirstResponse: false, revision: 0 };
  return { ...fixture, ...settled, occurrence };
}
export function ensureCommand(): EnsureReviewCommand {
  const f = reviewFixture();
  return { kind: 'ensure-review', operationId: 'ensure-1', pilotId: f.run.pilotId, runId: f.run.runId,
    attemptId: f.outcome.attemptId, occurrenceId: 'review-1', recordedAt: '2026-11-25T01:00:00Z' };
}
export function answerCommand(answer: string, expectedRevision = 0, operationId = 'answer-1'): SubmitReviewCommand {
  const f = reviewFixture();
  return { kind: 'submit-review', operationId, pilotId: f.run.pilotId, runId: f.run.runId,
    occurrenceId: 'review-1', expectedRevision, answer, recordedAt: '2026-11-25T01:01:00Z' };
}
