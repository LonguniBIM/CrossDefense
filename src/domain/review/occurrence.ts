import type { ActiveRun } from '../run/run';
import { assertEconomy, outcomeFingerprint, type PilotEconomy, type OutcomeSettlement } from '../results/settlement';
import type { ContentPackManifest } from '../content/contentPack';
import type { CombatOutcome } from '../combat/collection';
import { assertBuildState } from '../build/shipBuild';
import { assertAttemptState } from '../attempt/attempt';
import { assertReviewDefinition, type ReviewDefinition } from './content';

export type ReviewHintKind = 'context' | 'letter' | 'reveal';
export interface ReviewResponse {
  operationId: string; answer: string; normalizedAnswer: string; correct: boolean; recordedAt: string; revision: number;
}
export interface ReviewHintEvidence { operationId: string; hint: ReviewHintKind; recordedAt: string; revision: number; }
export interface ReviewOccurrence {
  occurrenceId: string; pilotId: string; entryId: string; sourceRunId: string; sourceAttemptId: string;
  contentVersion: string; rulesetVersion: string; contentDigest: string; definition: ReviewDefinition;
  createdAt: string; dueAt: string; responses: ReviewResponse[]; hints: ReviewHintEvidence[];
  firstResponse: ReviewResponse | null; attemptsToFirstCorrect: number | null;
  completedAt: string | null; independentFirstResponse: boolean; revision: number;
}
export interface ReviewOutcomeLink {
  attemptId: string; pilotId: string; runId: string; entryId: string; occurrenceId: string;
  contentVersion: string; rulesetVersion: string; contentDigest: string; reviewVersion: string;
  outcomeFingerprint: string; recordedAt: string;
}
export interface ReviewRewardReceipt {
  occurrenceId: string; pilotId: string; runId: string; entryId: string; operationId: string;
  reviewVersion: string; contentVersion: string; contentDigest: string;
  completionCredits: number; independentFirstResponseCredits: number;
  total: { credits: number; celestium: 0 }; economyRevision: number; recordedAt: string;
}
export interface EnsureReviewCommand {
  kind: 'ensure-review'; operationId: string; pilotId: string; runId: string;
  attemptId: string; occurrenceId: string; recordedAt: string;
}
interface ReviewCommandBase {
  operationId: string; pilotId: string; runId: string; occurrenceId: string;
  expectedRevision: number; recordedAt: string;
}
export interface SubmitReviewCommand extends ReviewCommandBase { kind: 'submit-review'; answer: string; }
export interface HintReviewCommand extends ReviewCommandBase { kind: 'hint-review'; hint: ReviewHintKind; }
export type ReviewCommand = SubmitReviewCommand | HintReviewCommand;
export interface ReviewOperationReceipt {
  operationId: string; pilotId: string; runId: string; occurrenceId: string;
  kind: EnsureReviewCommand['kind'] | ReviewCommand['kind']; fingerprint: string;
}
export class ReviewRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

/** Pure transition; the repository publishes evidence, reward and economy atomically. */
export function applyReviewCommand(run: ActiveRun, economy: PilotEconomy, occurrence: ReviewOccurrence,
  command: ReviewCommand): { run: ActiveRun; economy: PilotEconomy; occurrence: ReviewOccurrence; reward: ReviewRewardReceipt | null } {
  reviewCommandFingerprint(command); assertBuildState(run); assertAttemptState(run); assertEconomy(economy); assertReviewOccurrence(occurrence);
  if (run.phase !== 'build') throw new ReviewRejection('BUILD_REQUIRED', 'Return to safe Build before Review.');
  if (command.pilotId !== run.pilotId || command.runId !== run.runId || economy.pilotId !== run.pilotId ||
      occurrence.pilotId !== run.pilotId || command.occurrenceId !== occurrence.occurrenceId) {
    throw new ReviewRejection('TARGET_MISMATCH', 'Review must use the saved Pilot, Run and occurrence.');
  }
  if (occurrence.completedAt !== null) throw new ReviewRejection('OCCURRENCE_COMPLETE', 'This Review Occurrence is already complete.');
  if (command.expectedRevision !== occurrence.revision) throw new ReviewRejection('STALE_REVIEW', 'Review evidence changed. Reopen the saved occurrence.');
  const next = structuredClone({ run, economy, occurrence, reward: null as ReviewRewardReceipt | null });
  if (command.kind === 'hint-review') {
    next.occurrence.hints.push({ operationId: command.operationId, hint: command.hint,
      recordedAt: command.recordedAt, revision: ++next.occurrence.revision });
    return next;
  }
  const entry = next.occurrence.definition.entries.find(value => value.id === occurrence.entryId)!;
  const normalizedAnswer = command.answer.trim().toUpperCase();
  if (!normalizedAnswer) throw new ReviewRejection('BLANK_ANSWER', 'Type an answer before submitting. Blank input is not an attempt.');
  const correct = entry.acceptedAnswers.some(answer => answer.trim().toUpperCase() === normalizedAnswer);
  const response: ReviewResponse = { operationId: command.operationId, answer: command.answer,
    normalizedAnswer, correct, recordedAt: command.recordedAt, revision: ++next.occurrence.revision };
  next.occurrence.responses.push(response);
  next.occurrence.firstResponse ??= structuredClone(response);
  if (correct) {
    next.occurrence.completedAt = command.recordedAt;
    next.occurrence.attemptsToFirstCorrect = next.occurrence.responses.length;
    next.occurrence.independentFirstResponse = next.occurrence.responses.length === 1 && next.occurrence.hints.length === 0;
    const completionCredits = occurrence.definition.rewards.completionCredits;
    const independentFirstResponseCredits = next.occurrence.independentFirstResponse
      ? occurrence.definition.rewards.independentFirstResponseCredits : 0;
    const credits = completionCredits + independentFirstResponseCredits;
    next.economy.credits += credits; next.economy.revision += 1;
    next.run.economyRevision = (run.economyRevision ?? 0) + 1;
    assertEconomy(next.economy);
    if (!whole(next.run.economyRevision)) throw new ReviewRejection('REWARD_OVERFLOW', 'Review reward exceeds the exact integer range.');
    next.reward = { occurrenceId: occurrence.occurrenceId, pilotId: occurrence.pilotId, runId: run.runId,
      entryId: occurrence.entryId, operationId: command.operationId, reviewVersion: occurrence.definition.version,
      contentVersion: occurrence.contentVersion, contentDigest: occurrence.contentDigest,
      completionCredits, independentFirstResponseCredits, total: { credits, celestium: 0 },
      economyRevision: next.economy.revision, recordedAt: command.recordedAt };
  }
  return next;
}

const id = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const time = (value: unknown): value is string => id(value) && Number.isFinite(Date.parse(value));
const hintKind = (value: unknown): value is ReviewHintKind => value === 'context' || value === 'letter' || value === 'reveal';
export function normalizeReviewAnswer(answer: string): string {
  if (typeof answer !== 'string') throw new ReviewRejection('INVALID_ANSWER', 'A Review answer must be text.');
  const normalized = answer.trim().toUpperCase();
  if (!normalized) throw new ReviewRejection('BLANK_ANSWER', 'Type an answer before submitting. Blank input is not an attempt.');
  return normalized;
}
export function reviewCommandFingerprint(command: ReviewCommand): string {
  if (!command || ![command.operationId, command.pilotId, command.runId, command.occurrenceId].every(id) ||
      !whole(command.expectedRevision) || !time(command.recordedAt) ||
      !(command.kind === 'submit-review' && typeof command.answer === 'string' ||
        command.kind === 'hint-review' && hintKind(command.hint))) {
    throw new ReviewRejection('INVALID_REVIEW_COMMAND', 'Review needs a valid operation, owner, occurrence, revision and timestamp.');
  }
  if (command.kind === 'submit-review') normalizeReviewAnswer(command.answer);
  return JSON.stringify([command.kind, command.pilotId, command.runId, command.occurrenceId,
    command.expectedRevision, command.recordedAt, command.kind === 'submit-review' ? command.answer : command.hint]);
}
export function ensureReviewFingerprint(command: EnsureReviewCommand): string {
  if (!command || command.kind !== 'ensure-review' ||
      ![command.operationId, command.pilotId, command.runId, command.attemptId, command.occurrenceId].every(id) ||
      !time(command.recordedAt)) throw new ReviewRejection('INVALID_REVIEW_OFFER', 'Review requires a saved result and stable operation identity.');
  return JSON.stringify([command.kind, command.pilotId, command.runId, command.attemptId, command.occurrenceId, command.recordedAt]);
}

/** Q15 binds each eligible result permanently; unfinished evidence is shared by Pilot and sense. */
export function ensureReviewOccurrence(run: ActiveRun, outcome: CombatOutcome, settlement: OutcomeSettlement | null,
  pack: ContentPackManifest, occurrences: readonly ReviewOccurrence[], links: readonly ReviewOutcomeLink[],
  command: EnsureReviewCommand): { occurrence: ReviewOccurrence; link: ReviewOutcomeLink } {
  ensureReviewFingerprint(command); assertBuildState(run); assertAttemptState(run);
  occurrences.forEach(assertReviewOccurrence); links.forEach(assertReviewLink);
  if (run.phase !== 'build') throw new ReviewRejection('BUILD_REQUIRED', 'Return to safe Build before Review.');
  if (!pack.review) throw new ReviewRejection('REVIEW_UNAVAILABLE', 'This pinned Run has no Review capability.');
  assertReviewDefinition(pack.review, pack.build);
  const fingerprint = outcomeFingerprint(outcome);
  if (command.pilotId !== run.pilotId || command.runId !== run.runId || outcome.pilotId !== run.pilotId ||
      outcome.runId !== run.runId || outcome.attemptId !== command.attemptId ||
      pack.contentVersion !== run.contentVersion || pack.compatibleRuleset !== run.rulesetVersion ||
      outcome.contentVersion !== pack.contentVersion || outcome.rulesetVersion !== pack.compatibleRuleset ||
      outcome.contentDigest !== pack.integrity.manifestSha256 || run.attempt?.startup.contentDigest !== outcome.contentDigest) {
    throw new ReviewRejection('TARGET_MISMATCH', 'Review must use the exact saved outcome and its pinned content.');
  }
  if (!['victory', 'failed'].includes(outcome.terminal.kind)) {
    throw new ReviewRejection('INELIGIBLE_OUTCOME', 'Abandonment and interruption do not create a Review Occurrence.');
  }
  if (!settlement || settlement.attemptId !== outcome.attemptId || settlement.pilotId !== outcome.pilotId ||
      settlement.runId !== outcome.runId || settlement.outcomeFingerprint !== fingerprint) {
    throw new ReviewRejection('RESULTS_NOT_SETTLED', 'Acknowledge the saved result rewards before opening Review.');
  }
  const entry = pack.review.entries[0]!;
  const linked = links.find(link => link.attemptId === outcome.attemptId);
  if (linked) {
    const occurrence = occurrences.find(value => value.occurrenceId === linked.occurrenceId);
    if (!occurrence || linked.pilotId !== run.pilotId || linked.runId !== run.runId ||
        linked.entryId !== entry.id || linked.outcomeFingerprint !== fingerprint ||
        occurrence.pilotId !== run.pilotId || occurrence.entryId !== entry.id) {
      throw new ReviewRejection('REVIEW_INTEGRITY', 'The saved result link does not match its Review Occurrence.');
    }
    return structuredClone({ occurrence, link: linked });
  }
  const unfinished = occurrences.filter(value => value.pilotId === run.pilotId && value.entryId === entry.id && value.completedAt === null);
  if (unfinished.length > 1) throw new ReviewRejection('REVIEW_INTEGRITY', 'Only one unfinished Review Occurrence may exist for a Pilot and Learning Entry.');
  if (!unfinished.length && occurrences.some(value => value.occurrenceId === command.occurrenceId)) {
    throw new ReviewRejection('OCCURRENCE_CONFLICT', 'This Review identity already belongs to another occurrence.');
  }
  const occurrence: ReviewOccurrence = unfinished[0] ?? {
    occurrenceId: command.occurrenceId, pilotId: run.pilotId, entryId: entry.id,
    sourceRunId: run.runId, sourceAttemptId: outcome.attemptId, contentVersion: pack.contentVersion,
    rulesetVersion: pack.compatibleRuleset, contentDigest: pack.integrity.manifestSha256,
    definition: structuredClone(pack.review), createdAt: command.recordedAt, dueAt: command.recordedAt,
    responses: [], hints: [], firstResponse: null, attemptsToFirstCorrect: null,
    completedAt: null, independentFirstResponse: false, revision: 0,
  };
  const link: ReviewOutcomeLink = { attemptId: outcome.attemptId, pilotId: run.pilotId, runId: run.runId,
    entryId: entry.id, occurrenceId: occurrence.occurrenceId, contentVersion: pack.contentVersion,
    rulesetVersion: pack.compatibleRuleset, contentDigest: pack.integrity.manifestSha256,
    reviewVersion: pack.review.version, outcomeFingerprint: fingerprint, recordedAt: command.recordedAt };
  return structuredClone({ occurrence, link });
}

const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function invalidHistory(detail: string): never {
  throw new ReviewRejection('REVIEW_INTEGRITY', 'Saved Review ' + detail + ' Recover existing evidence without resetting or paying again.');
}
const responseKey = (value: ReviewResponse | null | undefined) => value
  ? JSON.stringify([value.operationId, value.answer, value.normalizedAnswer, value.correct, value.recordedAt, value.revision]) : null;

export function assertReviewOccurrence(value: ReviewOccurrence): void {
  if (!value || ![value.occurrenceId, value.pilotId, value.entryId, value.sourceRunId, value.sourceAttemptId,
      value.contentVersion, value.rulesetVersion].every(id) || !digest(value.contentDigest) ||
      !time(value.createdAt) || value.dueAt !== value.createdAt || !whole(value.revision) ||
      !Array.isArray(value.responses) || !Array.isArray(value.hints)) invalidHistory('identity, pins or evidence are invalid.');
  assertReviewDefinition(value.definition);
  const entry = value.definition.entries.find(entry => entry.id === value.entryId);
  if (!entry) invalidHistory('Learning Entry is missing from its frozen definition.');
  const events = [...value.responses, ...value.hints].sort((a, b) => a.revision - b.revision);
  if (value.revision !== events.length || new Set(events.map(event => event.operationId)).size !== events.length ||
      events.some((event, index) => !id(event.operationId) || !time(event.recordedAt) || event.revision !== index + 1) ||
      value.responses.some((response, index) => index > 0 && response.revision <= value.responses[index - 1]!.revision) ||
      value.hints.some((hint, index) => !hintKind(hint.hint) || index > 0 && hint.revision <= value.hints[index - 1]!.revision)) {
    invalidHistory('operation identities or evidence revisions are inconsistent.');
  }
  for (const response of value.responses) {
    if (typeof response.answer !== 'string' || !response.answer.trim() ||
        response.normalizedAnswer !== response.answer.trim().toUpperCase() ||
        response.correct !== entry.acceptedAnswers.includes(response.normalizedAnswer)) {
      invalidHistory('submitted answer evidence does not match the frozen exact-answer rule.');
    }
  }
  const correctResponses = value.responses.filter(response => response.correct), correct = correctResponses[0];
  if (correctResponses.length > 1 || correct && correct.revision !== value.revision ||
      responseKey(value.firstResponse) !== responseKey(value.responses[0]) ||
      value.completedAt !== (correct?.recordedAt ?? null) ||
      value.attemptsToFirstCorrect !== (correct ? value.responses.length : null) ||
      value.independentFirstResponse !== Boolean(correct && value.responses.length === 1 && value.hints.length === 0)) {
    invalidHistory('first response, completion or independent-recall evidence is inconsistent.');
  }
}

export function assertReviewLink(value: ReviewOutcomeLink): void {
  if (!value || ![value.attemptId, value.pilotId, value.runId, value.entryId, value.occurrenceId,
      value.contentVersion, value.rulesetVersion, value.reviewVersion, value.outcomeFingerprint].every(id) ||
      !digest(value.contentDigest) || !time(value.recordedAt)) invalidHistory('result linkage is invalid.');
}
export function assertReviewReward(value: ReviewRewardReceipt): void {
  if (!value || ![value.occurrenceId, value.pilotId, value.runId, value.entryId, value.operationId,
      value.reviewVersion, value.contentVersion].every(id) || !digest(value.contentDigest) || !time(value.recordedAt) ||
      !whole(value.completionCredits) || !whole(value.independentFirstResponseCredits) ||
      !whole(value.economyRevision) || value.economyRevision < 1 || !value.total ||
      !whole(value.total.credits) || value.total.celestium !== 0 ||
      value.total.credits !== value.completionCredits + value.independentFirstResponseCredits) {
    invalidHistory('reward receipt is invalid.');
  }
}

/** Validates durable learning history without consulting the active/default Content Pack. */
export function assertReviewHistory(occurrences: readonly ReviewOccurrence[], links: readonly ReviewOutcomeLink[],
  rewards: readonly ReviewRewardReceipt[], outcomes: readonly CombatOutcome[], settlements: readonly OutcomeSettlement[]): void {
  occurrences.forEach(assertReviewOccurrence); links.forEach(assertReviewLink); rewards.forEach(assertReviewReward);
  const unfinished = occurrences.filter(value => value.completedAt === null).map(value => JSON.stringify([value.pilotId, value.entryId]));
  const evidenceIds = occurrences.flatMap(value => [...value.responses, ...value.hints].map(event => event.operationId));
  if (new Set(occurrences.map(value => value.occurrenceId)).size !== occurrences.length ||
      new Set(links.map(value => value.attemptId)).size !== links.length ||
      new Set(rewards.map(value => value.occurrenceId)).size !== rewards.length ||
      new Set(rewards.map(value => value.operationId)).size !== rewards.length ||
      new Set(evidenceIds).size !== evidenceIds.length || new Set(unfinished).size !== unfinished.length ||
      rewards.some(reward => !occurrences.some(occurrence => occurrence.occurrenceId === reward.occurrenceId))) {
    invalidHistory('identities repeat or a Pilot has multiple unfinished occurrences for one Learning Entry.');
  }
  for (const link of links) {
    const occurrence = occurrences.find(value => value.occurrenceId === link.occurrenceId);
    const outcome = outcomes.find(value => value.attemptId === link.attemptId);
    const settlement = settlements.find(value => value.attemptId === link.attemptId);
    if (!occurrence || !outcome || !settlement || !['victory', 'failed'].includes(outcome.terminal.kind) ||
        link.pilotId !== occurrence.pilotId || link.entryId !== occurrence.entryId ||
        link.pilotId !== outcome.pilotId || link.runId !== outcome.runId ||
        link.contentVersion !== outcome.contentVersion || link.rulesetVersion !== outcome.rulesetVersion ||
        link.contentDigest !== outcome.contentDigest || link.outcomeFingerprint !== outcomeFingerprint(outcome) ||
        settlement.pilotId !== link.pilotId || settlement.runId !== link.runId ||
        settlement.outcomeFingerprint !== link.outcomeFingerprint) {
      invalidHistory('result link has no matching settled eligible outcome, owner or pinned content.');
    }
  }
  for (const occurrence of occurrences) {
    const source = links.find(value => value.attemptId === occurrence.sourceAttemptId);
    if (!source || source.occurrenceId !== occurrence.occurrenceId || source.pilotId !== occurrence.pilotId ||
        source.runId !== occurrence.sourceRunId || source.entryId !== occurrence.entryId ||
        source.contentVersion !== occurrence.contentVersion || source.rulesetVersion !== occurrence.rulesetVersion ||
        source.contentDigest !== occurrence.contentDigest || source.reviewVersion !== occurrence.definition.version ||
        source.recordedAt !== occurrence.createdAt) invalidHistory('occurrence lost its original frozen-content source.');
    const reward = rewards.find(value => value.occurrenceId === occurrence.occurrenceId);
    if ((occurrence.completedAt !== null) !== Boolean(reward)) invalidHistory('completion and reward receipt must publish together.');
    if (!reward) continue;
    const response = occurrence.responses.at(-1)!;
    if (reward.pilotId !== occurrence.pilotId || reward.entryId !== occurrence.entryId ||
        reward.operationId !== response.operationId || reward.recordedAt !== response.recordedAt ||
        reward.reviewVersion !== occurrence.definition.version || reward.contentVersion !== occurrence.contentVersion ||
        reward.contentDigest !== occurrence.contentDigest ||
        reward.completionCredits !== occurrence.definition.rewards.completionCredits ||
        reward.independentFirstResponseCredits !== (occurrence.independentFirstResponse
          ? occurrence.definition.rewards.independentFirstResponseCredits : 0)) {
      invalidHistory('reward receipt disagrees with completed evidence and frozen reward definitions.');
    }
  }
}
