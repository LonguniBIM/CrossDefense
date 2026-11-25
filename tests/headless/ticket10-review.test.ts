import { expect, it } from 'vitest';
import { applyReviewCommand, ensureReviewOccurrence, assertReviewOccurrence, assertReviewHistory } from '../../src/domain/review/occurrence';
import { outcomeFingerprint, assertEconomyLedger } from '../../src/domain/results/settlement';
import { reviewFixture, answerCommand, ensureCommand } from '../reviewFixture';

it('first unhinted correct response completes once with the approved 1 + 1 Credits', () => {
  const f = reviewFixture(), command = answerCommand('  sHiP  ');
  const next = applyReviewCommand(f.run, f.economy, f.occurrence, command);
  expect(next.occurrence.completedAt).toBe(command.recordedAt);
  expect(next.occurrence.responses).toEqual([{ operationId: 'answer-1', answer: '  sHiP  ',
    normalizedAnswer: 'SHIP', correct: true, recordedAt: command.recordedAt, revision: 1 }]);
  expect(next.occurrence.firstResponse).toEqual(next.occurrence.responses[0]);
  expect(next.occurrence.attemptsToFirstCorrect).toBe(1);
  expect(next.occurrence.independentFirstResponse).toBe(true);
  expect(next.reward?.completionCredits).toBe(1);
  expect(next.reward?.independentFirstResponseCredits).toBe(1);
  expect(next.reward?.total).toEqual({ credits: 2, celestium: 0 });
  expect(next.economy.credits).toBe(26);
  expect(next.economy.celestium).toBe(1);
  expect(next.economy.revision).toBe(2);
  expect(next.run.economyRevision).toBe(2);
  expect(f.occurrence.responses).toEqual([]);
  expect(f.economy.credits).toBe(24);
});

it.each(['', '   ', '\t\n'])('blank %j is validation only and does not consume the first response', answer => {
  const f = reviewFixture();
  expect(() => applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand(answer))).toThrow('Type an answer');
  expect(f.occurrence.responses).toEqual([]);
  expect(f.occurrence.revision).toBe(0);
  const next = applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand('ship'));
  expect(next.reward?.total.credits).toBe(2);
});

it.each(['context', 'letter', 'reveal'] as const)('requested %s persists without paying and disqualifies independent recall', hint => {
  const f = reviewFixture();
  const helped = applyReviewCommand(f.run, f.economy, f.occurrence,
    { ...answerCommand(''), kind: 'hint-review', hint, operationId: 'hint-1' });
  expect(helped.occurrence.hints).toEqual([{ operationId: 'hint-1', hint,
    recordedAt: '2026-11-25T01:01:00Z', revision: 1 }]);
  expect(helped.occurrence.responses).toEqual([]);
  expect(helped.reward).toBeNull();
  expect(helped.economy).toEqual(f.economy);
  const next = applyReviewCommand(helped.run, helped.economy, helped.occurrence, answerCommand('SHIP', 1));
  expect(next.reward?.total).toEqual({ credits: 1, celestium: 0 });
  expect(next.occurrence.independentFirstResponse).toBe(false);
  expect(next.occurrence.attemptsToFirstCorrect).toBe(1);
});

it.each(['S HIP', 'SHIPP', 'boat'])('wrong %j stays exact evidence and later success earns completion only', answer => {
  const f = reviewFixture(), wrong = applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand(answer));
  expect(wrong.reward).toBeNull();
  expect(wrong.occurrence.firstResponse?.answer).toBe(answer);
  expect(wrong.occurrence.responses[0]?.correct).toBe(false);
  const next = applyReviewCommand(wrong.run, wrong.economy, wrong.occurrence, answerCommand('ship', 1, 'answer-2'));
  expect(next.occurrence.firstResponse?.answer).toBe(answer);
  expect(next.occurrence.responses.map(row => row.correct)).toEqual([false, true]);
  expect(next.occurrence.attemptsToFirstCorrect).toBe(2);
  expect(next.occurrence.independentFirstResponse).toBe(false);
  expect(next.reward?.total.credits).toBe(1);
});

it('completed occurrences reject new response or hint commands without another reward', () => {
  const f = reviewFixture(), done = applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand('SHIP'));
  expect(() => applyReviewCommand(done.run, done.economy, done.occurrence, answerCommand('SHIP', 1, 'answer-2'))).toThrow('complete');
  expect(() => applyReviewCommand(done.run, done.economy, done.occurrence,
    { ...answerCommand('SHIP', 1, 'hint-2'), kind: 'hint-review', hint: 'reveal' })).toThrow('complete');
});
it.each(['pilot', 'run', 'occurrence', 'revision', 'phase', 'command-time', 'command-id', 'overflow'] as const)(
  'response admission rejects %s mismatch before changing evidence', mismatch => {
    const f = reviewFixture(), command = answerCommand('SHIP');
    if (mismatch === 'pilot') command.pilotId = 'other-pilot';
    if (mismatch === 'run') command.runId = 'other-run';
    if (mismatch === 'occurrence') command.occurrenceId = 'other-occurrence';
    if (mismatch === 'revision') command.expectedRevision = 5;
    if (mismatch === 'phase') f.run.phase = 'attempt';
    if (mismatch === 'command-time') command.recordedAt = 'not-time';
    if (mismatch === 'command-id') command.operationId = '';
    if (mismatch === 'overflow') f.economy.credits = Number.MAX_SAFE_INTEGER;
    expect(() => applyReviewCommand(f.run, f.economy, f.occurrence, command)).toThrow();
    expect(f.occurrence.responses).toEqual([]);
  });

it('settled result links reuse unfinished evidence, retain completed links, and allow only a later unlinked result to create next', () => {
  const f = reviewFixture(), command = ensureCommand();
  const first = ensureReviewOccurrence(f.run, f.outcome, f.settlement, f.pack, [], [], command);
  expect(first.occurrence).toEqual(f.occurrence);
  expect(first.link.attemptId).toBe(f.outcome.attemptId);
  expect(first.link.occurrenceId).toBe('review-1');
  const wrong = applyReviewCommand(f.run, f.economy, first.occurrence, answerCommand('boat'));
  const outcome2 = { ...f.outcome, attemptId: 'later-outcome' };
  const settlement2 = { ...f.settlement, attemptId: outcome2.attemptId, outcomeFingerprint: outcomeFingerprint(outcome2) };
  const other = ensureReviewOccurrence(f.run, outcome2, settlement2, f.pack, [wrong.occurrence], [first.link],
    { ...command, operationId: 'ensure-2', attemptId: outcome2.attemptId, occurrenceId: 'unused-candidate' });
  expect(other.occurrence.occurrenceId).toBe('review-1');
  expect(other.occurrence.firstResponse?.answer).toBe('boat');
  const done = applyReviewCommand(f.run, f.economy, other.occurrence, answerCommand('SHIP', 1, 'answer-2'));
  const reopened = ensureReviewOccurrence(done.run, f.outcome, f.settlement, f.pack, [done.occurrence], [first.link, other.link],
    { ...command, operationId: 'reopen', occurrenceId: 'must-not-create' });
  expect(reopened.occurrence.completedAt).toBe('2026-11-25T01:01:00Z');
  expect(reopened.occurrence.occurrenceId).toBe('review-1');
  const outcome3 = { ...f.outcome, attemptId: 'next-outcome' };
  const settlement3 = { ...f.settlement, attemptId: outcome3.attemptId, outcomeFingerprint: outcomeFingerprint(outcome3) };
  const next = ensureReviewOccurrence(done.run, outcome3, settlement3, f.pack, [done.occurrence], [first.link, other.link],
    { ...command, operationId: 'ensure-3', attemptId: outcome3.attemptId, occurrenceId: 'review-2' });
  expect(next.occurrence.occurrenceId).toBe('review-2');
  expect(next.occurrence.responses).toEqual([]);
  expect(next.occurrence.dueAt).toBe(command.recordedAt);
  expect(next.occurrence.sourceAttemptId).toBe('next-outcome');
  expect(next.occurrence.definition).toEqual(f.pack.review);
});

it('saved history validates evidence, source linkage and reward as one consistent learning record', () => {
  const f = reviewFixture(), offered = ensureReviewOccurrence(f.run, f.outcome, f.settlement, f.pack, [], [], ensureCommand());
  const done = applyReviewCommand(f.run, f.economy, offered.occurrence, answerCommand('SHIP'));
  expect(() => assertReviewHistory([done.occurrence], [offered.link], [done.reward!], [f.outcome], [f.settlement])).not.toThrow();
  const changed = structuredClone(done.occurrence);
  changed.firstResponse!.answer = 'boat';
  expect(() => assertReviewOccurrence(changed)).toThrow('Review');
  const wrongReward = { ...done.reward!, independentFirstResponseCredits: 5, total: { credits: 6, celestium: 0 as const } };
  expect(() => assertReviewHistory([done.occurrence], [offered.link], [wrongReward], [f.outcome], [f.settlement])).toThrow('Review');
  expect(() => assertReviewHistory([done.occurrence], [offered.link], [], [f.outcome], [f.settlement])).toThrow('Review');
  expect(() => assertReviewHistory([done.occurrence], [{ ...offered.link, outcomeFingerprint: 'forged' }],
    [done.reward!], [f.outcome], [f.settlement])).toThrow('Review');
  expect(() => assertReviewHistory([offered.occurrence, { ...offered.occurrence, occurrenceId: 'duplicate-unfinished' }],
    [offered.link], [], [f.outcome], [f.settlement])).toThrow('Review');
});

it('the same economy ledger accounts for outcome and Review receipts with globally unique revisions', () => {
  const f = reviewFixture(), next = applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand('SHIP'));
  expect(() => assertEconomyLedger(next.economy, [f.settlement], [next.reward!])).not.toThrow();
  expect(() => assertEconomyLedger(next.economy, [f.settlement])).toThrow('economy');
  expect(() => assertEconomyLedger(next.economy, [f.settlement], [next.reward!, next.reward!])).toThrow('economy');
  expect(() => assertEconomyLedger(next.economy, [f.settlement],
    [{ ...next.reward!, economyRevision: f.settlement.economyRevision }])).toThrow('economy');
  expect(() => assertEconomyLedger(next.economy, [f.settlement],
    [{ ...next.reward!, pilotId: 'another-pilot' }])).toThrow('economy');
  expect(next.economy.firstClearMapIds).toEqual(f.economy.firstClearMapIds);
});

it('Review creation rejects a forged pack and outcome digest that disagree with the saved Run startup', () => {
  const f = reviewFixture(), pack = structuredClone(f.pack), outcome = structuredClone(f.outcome);
  pack.integrity.manifestSha256 = '2'.repeat(64);
  outcome.contentDigest = pack.integrity.manifestSha256;
  const settlement = { ...f.settlement, outcomeFingerprint: outcomeFingerprint(outcome) };
  expect(() => ensureReviewOccurrence(f.run, outcome, settlement, pack, [], [], ensureCommand())).toThrow('pinned');
});
it('Review history rejects a reward receipt whose occurrence evidence is missing', () => {
  const f = reviewFixture(), done = applyReviewCommand(f.run, f.economy, f.occurrence, answerCommand('SHIP'));
  expect(() => assertReviewHistory([], [], [done.reward!], [f.outcome], [f.settlement])).toThrow('Review');
});
