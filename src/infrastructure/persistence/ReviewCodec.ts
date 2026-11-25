import { z } from 'zod';
import { ReviewDefinitionSchema } from '../../application/content/ContentPackCodec';
import { assertReviewOccurrence, ensureReviewFingerprint, reviewCommandFingerprint,
  type ReviewOccurrence, type ReviewOutcomeLink, type ReviewOperationReceipt, type EnsureReviewCommand } from '../../domain/review/occurrence';

const Id = z.string().min(1).refine(value => value.trim().length > 0);
const Whole = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const Stamp = z.string().refine(value => Number.isFinite(Date.parse(value)));
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Hint = z.enum(['context', 'letter', 'reveal']);
const ResponseSchema = z.object({ operationId: Id, answer: z.string(), normalizedAnswer: z.string(), correct: z.boolean(), recordedAt: Stamp, revision: Whole.positive() }).strict();
const HintEvidenceSchema = z.object({ operationId: Id, hint: Hint, recordedAt: Stamp, revision: Whole.positive() }).strict();

export const ReviewOccurrenceSchema = z.object({
  occurrenceId: Id, pilotId: Id, entryId: Id, sourceRunId: Id, sourceAttemptId: Id,
  contentVersion: Id, rulesetVersion: Id, contentDigest: Digest, definition: ReviewDefinitionSchema,
  createdAt: Stamp, dueAt: Stamp, responses: z.array(ResponseSchema), hints: z.array(HintEvidenceSchema),
  firstResponse: ResponseSchema.nullable(), attemptsToFirstCorrect: Whole.positive().nullable(),
  completedAt: Stamp.nullable(), independentFirstResponse: z.boolean(), revision: Whole,
}).strict().superRefine((value, context) => {
  try { assertReviewOccurrence(value); }
  catch (error) { context.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Review evidence is inconsistent.' }); }
});
export const ReviewLinkSchema = z.object({
  attemptId: Id, pilotId: Id, runId: Id, entryId: Id, occurrenceId: Id,
  contentVersion: Id, rulesetVersion: Id, contentDigest: Digest, reviewVersion: Id,
  outcomeFingerprint: Id, recordedAt: Stamp,
}).strict();
export const ReviewRewardSchema = z.object({
  occurrenceId: Id, pilotId: Id, runId: Id, entryId: Id, operationId: Id,
  reviewVersion: Id, contentVersion: Id, contentDigest: Digest,
  completionCredits: Whole, independentFirstResponseCredits: Whole,
  total: z.object({ credits: Whole, celestium: z.literal(0) }).strict(),
  economyRevision: Whole.positive(), recordedAt: Stamp,
}).strict();
export const ReviewOperationSchema = z.object({
  operationId: Id, pilotId: Id, runId: Id, occurrenceId: Id,
  kind: z.enum(['ensure-review', 'submit-review', 'hint-review']), fingerprint: Id,
}).strict();

/** Every durable learner action has one exact receipt; old operation replay uses current state. */
export function validateReviewOperations(occurrences: readonly ReviewOccurrence[], links: readonly ReviewOutcomeLink[], operations: readonly ReviewOperationReceipt[]): void {
  if (new Set(operations.map(value => value.operationId)).size !== operations.length) throw Error('Review operation identities are duplicated.');
  const linkedAttempts = new Set<string>();
  for (const raw of operations) {
    const receipt = ReviewOperationSchema.parse(raw);
    const occurrence = occurrences.find(value => value.occurrenceId === receipt.occurrenceId);
    if (!occurrence || occurrence.pilotId !== receipt.pilotId) throw Error('Review operation lost its owned occurrence.');
    let expected: string;
    if (receipt.kind === 'ensure-review') {
      const payload = z.tuple([z.literal('ensure-review'), Id, Id, Id, Id, Stamp]).parse(JSON.parse(receipt.fingerprint));
      const command: EnsureReviewCommand = { kind: payload[0], operationId: receipt.operationId, pilotId: payload[1], runId: payload[2], attemptId: payload[3], occurrenceId: payload[4], recordedAt: payload[5] };
      expected = ensureReviewFingerprint(command);
      if (command.pilotId !== receipt.pilotId || command.runId !== receipt.runId || !links.some(link =>
        link.attemptId === command.attemptId && link.pilotId === receipt.pilotId && link.runId === receipt.runId && link.occurrenceId === receipt.occurrenceId)) {
        throw Error('Review creation receipt lost its exact Attempt link.');
      }
      linkedAttempts.add(command.attemptId);
    } else if (receipt.kind === 'submit-review') {
      const evidence = occurrence.responses.find(value => value.operationId === receipt.operationId);
      if (!evidence) throw Error('Review submit receipt lost its response evidence.');
      expected = reviewCommandFingerprint({ kind: receipt.kind, operationId: receipt.operationId, pilotId: receipt.pilotId, runId: receipt.runId,
        occurrenceId: receipt.occurrenceId, expectedRevision: evidence.revision - 1, recordedAt: evidence.recordedAt, answer: evidence.answer });
    } else {
      const evidence = occurrence.hints.find(value => value.operationId === receipt.operationId);
      if (!evidence) throw Error('Review hint receipt lost its hint evidence.');
      expected = reviewCommandFingerprint({ kind: receipt.kind, operationId: receipt.operationId, pilotId: receipt.pilotId, runId: receipt.runId,
        occurrenceId: receipt.occurrenceId, expectedRevision: evidence.revision - 1, recordedAt: evidence.recordedAt, hint: evidence.hint });
    }
    if (receipt.fingerprint !== expected) throw Error('Review operation payload disagrees with its durable evidence.');
  }
  for (const occurrence of occurrences) {
    for (const [evidence, kind] of [[occurrence.responses, 'submit-review'], [occurrence.hints, 'hint-review']] as const) {
      for (const event of evidence) if (!operations.some(receipt => receipt.operationId === event.operationId && receipt.occurrenceId === occurrence.occurrenceId && receipt.pilotId === occurrence.pilotId && receipt.kind === kind)) {
        throw Error('Review evidence has no matching durable operation receipt.');
      }
    }
  }
  if (links.some(link => !linkedAttempts.has(link.attemptId))) throw Error('Review Attempt link has no durable creation receipt.');
}
