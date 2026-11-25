import type { BuildContent } from '../content/contentPack';

export interface ReviewLearningEntry {
  id: string;
  spelling: string;
  partOfSpeech: 'noun';
  targetSense: string;
  prompt: string;
  acceptedAnswers: readonly string[];
  hints: { context: string; letter: string; reveal: string };
}

export interface ReviewDefinition {
  version: string;
  occurrencePolicy: 'settled-outcome-immediate-due';
  rewards: { completionCredits: number; independentFirstResponseCredits: number };
  entries: readonly ReviewLearningEntry[];
}

export const REVIEW_DEFINITION_VERSION = 'development-review-rules-v1';

/** Q15 is the only reviewed definition; frozen evidence cannot redefine its versioned meaning or rewards. */
export function assertReviewDefinition(value: ReviewDefinition, build?: BuildContent): void {
  const fail = (reason: string): never => {
    throw Error('Review content violates the approved ' + REVIEW_DEFINITION_VERSION + ' definition: ' + reason +
      '. Restore the Ticket10/Q15 fixture or use a separately approved new version.');
  };
  if (!value || value.version !== REVIEW_DEFINITION_VERSION || value.occurrencePolicy !== 'settled-outcome-immediate-due') {
    fail('unsupported rules version or occurrence policy');
  }
  if (!value.rewards || value.rewards.completionCredits !== 1 || value.rewards.independentFirstResponseCredits !== 1) {
    fail('completion and independent first-response rewards must each be 1 Credit');
  }
  if (!Array.isArray(value.entries) || value.entries.length !== 1) fail('exactly one reviewed Learning Entry is required');
  const entry = value.entries[0]!;
  if (!entry || entry.id !== 'ship-noun-water-vessel-v1' || entry.spelling !== 'SHIP' ||
      entry.partOfSpeech !== 'noun' || entry.targetSense !== 'water-vessel') fail('Learning Entry identity or sense differs');
  if (entry.prompt !== 'A large boat that carries people or goods across water. Type the English word.' ||
      !Array.isArray(entry.acceptedAnswers) || entry.acceptedAnswers.length !== 1 || entry.acceptedAnswers[0] !== 'SHIP') {
    fail('the meaning prompt or exact accepted answer differs');
  }
  if (!entry.hints || entry.hints.context !== 'The ___ carries goods across the sea.' ||
      entry.hints.letter !== 'It starts with S and has four letters.' || entry.hints.reveal !== 'SHIP') fail('reviewed hint or reveal differs');
  if (build && !build.supportedSpellings.some(word => word.spelling === entry.spelling)) fail('Build content does not support the reviewed spelling');
}
