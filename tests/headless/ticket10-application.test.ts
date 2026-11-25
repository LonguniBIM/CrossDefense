import { expect, it } from 'vitest';
import { InMemoryReviewRepository } from '../../src/infrastructure/persistence/InMemoryReviewRepository';
import { reviewFixture, reviewPack, ensureCommand, answerCommand } from '../reviewFixture';
import { settlementCommand } from '../resultsFixture';

async function setup(repository = new InMemoryReviewRepository(), pack = reviewPack()) {
  const f = reviewFixture(pack);
  await repository.createPilot({ operationId: 'pilot', pilot: { pilotId: f.run.pilotId, nickname: 'Review',
    avatarId: 'pilot-blue', createdAt: f.run.startedAt, lastUsedAt: f.run.startedAt } });
  await repository.createRun({ operationId: 'run', run: f.build });
  await repository.startAttempt(f.start, f.pack);
  await repository.commitCombat(f.command);
  await repository.settleOutcome(settlementCommand(f.run));
  return { repository, f };
}

it('a settled result offer survives a separate read with its original occurrence and link', async () => {
  const { repository, f } = await setup();
  const offered = await repository.ensureReview(ensureCommand(), f.pack);
  expect(offered.selectedOccurrenceId).toBe('review-1');
  const restored = await repository.getReview(f.run.pilotId, 'review-1');
  expect(restored.occurrences).toHaveLength(1);
  expect(restored.occurrences[0]).toEqual(offered.occurrences[0]);
  expect(restored.links).toEqual(offered.links);
});

it('duplicate Submit commits one evidence row, one reward and current-state receipt replay', async () => {
  const { repository, f } = await setup(), command = answerCommand('SHIP');
  await repository.ensureReview(ensureCommand(), f.pack);
  const results = await Promise.all([repository.applyReview(command), repository.applyReview(command)]);
  expect(results.every(value => value.economy.credits === 26)).toBe(true);
  const saved = await repository.getReview(f.run.pilotId, 'review-1');
  expect(saved.occurrences[0]?.responses).toHaveLength(1);
  expect(saved.rewards).toHaveLength(1);
  await expect(repository.applyReview({ ...command, answer: 'boat' })).rejects.toThrow();
  await expect(repository.applyReview({ ...command, operationId: 'another-submit', expectedRevision: 1 })).rejects.toThrow('complete');
  const current = (await repository.getResults(f.run.pilotId)).run;
  await repository.applyPlacement({ kind: 'place', operationId: 'later-layout', pilotId: current.pilotId,
    runId: current.runId, contentVersion: current.contentVersion, rulesetVersion: current.rulesetVersion,
    expectedRevision: current.shipBuild!.revision, tileId: current.runId + ':starter:4', x: 2, y: 0 }, f.pack.build!);
  const replayed = await repository.applyReview(command);
  expect(replayed.run.shipBuild!.placements).toHaveLength(5);
  expect(replayed.economy.credits).toBe(26);
  expect((await repository.settleOutcome(settlementCommand(f.run))).economy.credits).toBe(26);
  expect((await repository.ensureReview(ensureCommand(), f.pack)).occurrences[0]?.completedAt).not.toBeNull();
});

import { ReviewApplication } from '../../src/application/review/ReviewApplication';
import { ContentPackApplication } from '../../src/application/content/ContentPackApplication';
import { InMemoryContentPackRepository } from '../../src/infrastructure/content/InMemoryContentPackRepository';
import type { ReviewCommand } from '../../src/domain/review/occurrence';

const contentApplication = () => new ContentPackApplication(new InMemoryContentPackRepository(),
  { appVersion: '0.1.0', rulesetVersion: 'development-combat-ruleset-v1' });
it.each([false, true])('Review Retry retains exact identity and last acknowledgment after lost=%s', async lost => {
  class Faults extends InMemoryReviewRepository {
    fail = true; calls: ReviewCommand[] = [];
    override async applyReview(command: ReviewCommand) {
      this.calls.push(structuredClone(command));
      if (this.fail) { this.fail = false; if (lost) await super.applyReview(command); throw Error('Injected Review save failure'); }
      return super.applyReview(command);
    }
  }
  const repository = new Faults(), { f } = await setup(repository);
  await repository.ensureReview(ensureCommand(), f.pack);
  const app = new ReviewApplication(repository, contentApplication(), () => 'stable-submit', () => '2026-11-25T02:00:00Z');
  await app.open(f.run.pilotId);
  const before = app.snapshot();
  await expect(app.submit('  ship  ')).rejects.toThrow('Injected');
  expect(app.snapshot()).toEqual(before);
  expect(app.hasPendingSave()).toBe(true);
  await expect(app.submit('boat')).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.hint('reveal')).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.open(f.run.pilotId)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  const saved = await app.retry();
  expect(repository.calls).toHaveLength(2);
  expect(repository.calls[0]).toEqual(repository.calls[1]);
  expect(saved.occurrences[0]?.responses).toHaveLength(1);
  expect(saved.rewards).toHaveLength(1);
  expect(saved.economy.credits).toBe(26);
  expect(app.hasPendingSave()).toBe(false);
});

import { readFileSync } from 'node:fs';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';
import type { EnsureReviewCommand } from '../../src/domain/review/occurrence';
import { BuildApplication } from '../../src/application/build/BuildApplication';
import { combatPack } from '../combatFixture';

const compiledPack = (): ContentPackManifest => JSON.parse(readFileSync('public/content/packs/development-review-ship-v1/manifest.json', 'utf8'));
async function admittedContent(pack = compiledPack()) {
  const content = contentApplication();
  await content.bootstrap();
  const result = await content.activateCandidate(pack);
  expect(result.activated).toBe(true);
  return content;
}
it.each([false, true])('new-result offer Retry preserves both command and occurrence identity after lost=%s', async lost => {
  class Faults extends InMemoryReviewRepository {
    fail = true; calls: EnsureReviewCommand[] = [];
    override async ensureReview(command: EnsureReviewCommand, pack: ContentPackManifest) {
      this.calls.push(structuredClone(command));
      if (this.fail) { this.fail = false; if (lost) await super.ensureReview(command, pack); throw Error('Injected offer failure'); }
      return super.ensureReview(command, pack);
    }
  }
  const repository = new Faults(), { f } = await setup(repository, compiledPack());
  let sequence = 0;
  const app = new ReviewApplication(repository, await admittedContent(), () => 'offer-' + ++sequence, () => '2026-11-25T02:00:00Z');
  await expect(app.open(f.run.pilotId, f.outcome.attemptId)).rejects.toThrow('Injected offer');
  expect(app.hasPendingSave()).toBe(true);
  expect(app.snapshot().occurrences).toEqual([]);
  const saved = await app.retry();
  expect(repository.calls[0]).toEqual(repository.calls[1]);
  expect(saved.selectedOccurrenceId).toBe('offer-2');
  expect(saved.links).toHaveLength(1);
  expect(saved.occurrences).toHaveLength(1);
  await app.submit('SHIP');
  const reopened = await app.open(f.run.pilotId, f.outcome.attemptId);
  expect(reopened.selectedOccurrenceId).toBe('offer-2');
  expect(reopened.occurrences).toHaveLength(1);
  expect(reopened.rewards).toHaveLength(1);
  expect((await new ReviewApplication(repository, contentApplication(), () => 'unused').open(f.run.pilotId)).selectedOccurrenceId).toBeNull();
});
it('leaving and reopening due Review preserves wrong-first and all requested hints, including reveal-only no reward', async () => {
  const { repository, f } = await setup();
  await repository.ensureReview(ensureCommand(), f.pack);
  let sequence = 0;
  const app = new ReviewApplication(repository, contentApplication(), () => 'event-' + ++sequence, () => '2026-11-25T02:00:00Z');
  await app.open(f.run.pilotId);
  await app.submit('S HIP');
  await app.hint('context'); await app.hint('letter'); await app.hint('reveal');
  const before = app.snapshot();
  expect(before.economy.credits).toBe(24);
  expect(before.rewards).toEqual([]);
  const reloaded = new ReviewApplication(repository, contentApplication(), () => 'after-reload', () => '2026-11-25T03:00:00Z');
  const restored = await reloaded.open(f.run.pilotId);
  expect(restored.selectedOccurrenceId).toBe('review-1');
  expect(restored.occurrences).toEqual(before.occurrences);
  expect(restored.occurrences[0]?.hints.map(event => event.hint)).toEqual(['context', 'letter', 'reveal']);
  const saved = await reloaded.submit(' ship ');
  expect(saved.occurrences[0]?.firstResponse?.answer).toBe('S HIP');
  expect(saved.occurrences[0]?.attemptsToFirstCorrect).toBe(2);
  expect(saved.economy.credits).toBe(25);
});
it('blank Application input creates no operation or attempt and keeps the independent first response', async () => {
  const { repository, f } = await setup();
  await repository.ensureReview(ensureCommand(), f.pack);
  let generated = 0;
  const app = new ReviewApplication(repository, contentApplication(), () => 'id-' + ++generated, () => '2026-11-25T02:00:00Z');
  await app.open(f.run.pilotId); const before = app.snapshot();
  await expect(app.submit(' \t ')).rejects.toMatchObject({ code: 'BLANK_ANSWER' });
  expect(app.hasPendingSave()).toBe(false); expect(generated).toBe(0);
  expect(app.snapshot()).toEqual(before);
  expect((await app.submit('ship')).economy.credits).toBe(26);
});
it('legacy Run content never borrows the active default Review capability', async () => {
  const legacy = combatPack(), { repository, f } = await setup(undefined, legacy);
  const content = await admittedContent(legacy); await content.activateCandidate(compiledPack());
  const app = new ReviewApplication(repository, content, () => 'must-not-create', () => '2026-11-25T02:00:00Z');
  const state = await app.open(f.run.pilotId, f.outcome.attemptId);
  expect(state.selectedOccurrenceId).toBeNull(); expect(state.occurrences).toEqual([]); expect(state.links).toEqual([]);
  expect((await repository.getResults(f.run.pilotId)).economy.credits).toBe(24);
});
it('Review economyRevision rejects Undo in the retained BuildApplication without changing learning, money or layout', async () => {
  const { repository, f } = await setup(undefined, compiledPack()), content = await admittedContent();
  await repository.ensureReview(ensureCommand(), f.pack);
  const build = new BuildApplication(repository, content);
  expect((await build.open(f.run.pilotId)).kind).toBe('ready');
  await build.returnToCargo({ operationId: 'editable-layout', tileId: f.run.runId + ':starter:0' });
  expect(build.snapshot().history.canUndo).toBe(true);
  const app = new ReviewApplication(repository, content, () => 'review-economy', () => '2026-11-25T02:00:00Z');
  await app.open(f.run.pilotId); await app.submit('SHIP');
  const before = await repository.getReview(f.run.pilotId);
  await expect(build.undo({ operationId: 'stale-review-undo' })).rejects.toMatchObject({ code: 'HISTORY_INVALIDATED' });
  expect(build.snapshot().history.canUndo).toBe(false);
  expect(await repository.getReview(f.run.pilotId)).toEqual(before);
  expect(before.economy.credits).toBe(26);
  expect(before.run.economyRevision).toBe(2);
  expect(before.occurrences[0]?.completedAt).not.toBeNull();
});

it('fresh recovery discovers committed settlement without reopening its Results screen', async () => {
  const { repository, f } = await setup(undefined, compiledPack());
  expect((await repository.getReview(f.run.pilotId)).links).toEqual([]);
  let sequence = 0;
  const app = new ReviewApplication(repository, await admittedContent(), () => 'recovery-' + ++sequence,
    () => '2026-11-25T04:00:00Z');
  const recovered = await app.recover(f.run.pilotId);
  expect(recovered.occurrences).toHaveLength(1);
  expect(recovered.links).toHaveLength(1);
  expect(recovered.links[0]).toMatchObject({ attemptId: f.outcome.attemptId, occurrenceId: recovered.occurrences[0]!.occurrenceId });
  expect(recovered.occurrences[0]).toMatchObject({ createdAt: '2026-11-25T04:00:00Z', dueAt: '2026-11-25T04:00:00Z',
    responses: [], hints: [], firstResponse: null, completedAt: null });
  expect(recovered.economy.credits).toBe(24);
  expect(recovered.rewards).toEqual([]);
  expect(app.dueCount()).toBe(1);
  const fresh = new ReviewApplication(repository, contentApplication(), () => 'must-not-create',
    () => '2026-11-25T05:00:00Z');
  expect((await fresh.recover(f.run.pilotId)).occurrences).toEqual(recovered.occurrences);
  expect(fresh.dueCount()).toBe(1);
});

async function laterResult(repository: InMemoryReviewRepository, f: ReturnType<typeof reviewFixture>,
  attemptId: string, kind: 'victory' | 'failed' = 'victory', settle = true) {
  const run = (await repository.getResults(f.run.pilotId)).run;
  await repository.startAttempt({ ...f.start, operationId: attemptId + '-start', attemptId,
    expectedBuildRevision: run.shipBuild!.revision }, f.pack);
  const ended = await repository.commitCombat({ ...f.command, operationId: attemptId + '-end', attemptId,
    payloadIds: [], terminal: { kind, causes: kind === 'failed' ? ['Timeout'] : [] } });
  if (settle) await repository.settleOutcome(settlementCommand(ended.run, attemptId + '-settle'));
  return ended;
}

it.each([false, true])('recovery Retry replays retained command and pack, then discovers remaining results after lost=%s', async lost => {
  class Faults extends InMemoryReviewRepository {
    fail = true; calls: Array<{ command: EnsureReviewCommand; pack: ContentPackManifest }> = [];
    override async ensureReview(command: EnsureReviewCommand, pack: ContentPackManifest) {
      this.calls.push(structuredClone({ command, pack }));
      if (this.fail) { this.fail = false; if (lost) await super.ensureReview(command, pack); throw Error('Injected recovery failure'); }
      return super.ensureReview(command, pack);
    }
  }
  const repository = new Faults(), { f } = await setup(repository, compiledPack());
  const contentRepository = new InMemoryContentPackRepository();
  const content = new ContentPackApplication(contentRepository,
    { appVersion: '0.1.0', rulesetVersion: 'development-combat-ruleset-v1' });
  await content.bootstrap();
  expect((await content.activateCandidate(f.pack)).activated).toBe(true);
  let sequence = 0, clock = '2026-11-25T04:00:00Z';
  const app = new ReviewApplication(repository, content, () => 'recovery-retry-' + ++sequence, () => clock);
  await expect(app.recover(f.run.pilotId)).rejects.toThrow('Injected recovery');
  expect(app.snapshot().occurrences).toEqual([]);
  expect(app.hasPendingSave()).toBe(true);
  await expect(app.recover(f.run.pilotId)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.open(f.run.pilotId)).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.submit('SHIP')).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await expect(app.hint('reveal')).rejects.toMatchObject({ code: 'SAVE_PENDING' });
  await laterResult(repository, f, 'after-recovery-failure', 'failed');
  contentRepository.removePack(f.pack.contentVersion);
  clock = '2026-11-25T05:00:00Z';
  const saved = await app.retry();
  expect(saved.links).toHaveLength(2);
  expect(saved.links.map(link => link.attemptId).sort()).toEqual(['after-recovery-failure', f.outcome.attemptId].sort());
  expect(new Set(saved.links.map(link => link.occurrenceId)).size).toBe(1);
  expect(saved.occurrences).toHaveLength(1);
  expect(saved.occurrences[0]?.dueAt).toBe('2026-11-25T04:00:00Z');
  expect(saved.run.attempt?.attemptId).toBe('after-recovery-failure');
  expect(saved.rewards).toEqual([]);
  expect(saved.economy.credits).toBe(24);
  expect(repository.calls).toHaveLength(3);
  expect(repository.calls[1]).toEqual(repository.calls[0]);
  expect(repository.calls[2]?.pack).toEqual(repository.calls[0]?.pack);
  expect(app.hasPendingSave()).toBe(false);
  expect(app.dueCount()).toBe(1);
});

it('recovery links outstanding victory and failed results to unfinished wrong-first and hinted evidence', async () => {
  const { repository, f } = await setup(undefined, compiledPack());
  await repository.ensureReview(ensureCommand(), f.pack);
  let sequence = 0;
  const original = new ReviewApplication(repository, contentApplication(), () => 'original-' + ++sequence,
    () => '2026-11-25T02:00:00Z');
  await original.open(f.run.pilotId);
  await original.submit('boat');
  await original.hint('context'); await original.hint('letter'); await original.hint('reveal');
  const evidence = original.snapshot().occurrences;
  await laterResult(repository, f, 'later-victory');
  await laterResult(repository, f, 'later-failure', 'failed');
  const resumed = new ReviewApplication(repository, await admittedContent(), () => 'reused-' + ++sequence,
    () => '2026-11-25T04:00:00Z');
  const recovered = await resumed.recover(f.run.pilotId);
  expect(recovered.occurrences).toEqual(evidence);
  expect(recovered.selectedOccurrenceId).toBe('review-1');
  expect(recovered.links).toHaveLength(3);
  expect(recovered.links.every(link => link.occurrenceId === 'review-1')).toBe(true);
  expect(recovered.rewards).toEqual([]);
  expect(recovered.economy.credits).toBe(28);
  expect(resumed.dueCount()).toBe(1);
  const done = await resumed.submit('SHIP');
  expect(done.occurrences[0]?.firstResponse?.answer).toBe('boat');
  expect(done.occurrences[0]?.hints.map(event => event.hint)).toEqual(['context', 'letter', 'reveal']);
  expect(done.occurrences[0]?.attemptsToFirstCorrect).toBe(2);
  expect(done.rewards[0]?.total.credits).toBe(1);
  expect(done.economy.credits).toBe(29);
  expect(resumed.dueCount()).toBe(0);
});

it('recovery of completed linked results never creates another opportunity or borrows active content', async () => {
  const { repository, f } = await setup(undefined, compiledPack());
  await laterResult(repository, f, 'second-unoffered');
  let sequence = 0;
  const app = new ReviewApplication(repository, await admittedContent(), () => 'completed-' + ++sequence,
    () => '2026-11-25T04:00:00Z');
  const offered = await app.recover(f.run.pilotId);
  expect(offered.links).toHaveLength(2);
  expect(offered.occurrences).toHaveLength(1);
  expect(offered.links.every(link => link.occurrenceId === offered.selectedOccurrenceId)).toBe(true);
  const done = await app.submit('SHIP');
  const fresh = new ReviewApplication(repository, contentApplication(), () => 'must-not-create',
    () => '2026-11-25T05:00:00Z');
  const restored = await fresh.recover(f.run.pilotId);
  expect(restored.occurrences).toEqual(done.occurrences);
  expect(restored.links).toEqual(done.links);
  expect(restored.rewards).toEqual(done.rewards);
  expect(restored.economy).toEqual(done.economy);
  expect(restored.selectedOccurrenceId).toBeNull();
  expect(fresh.dueCount()).toBe(0);
});

it.each(['unsettled', 'abandoned', 'interrupted'] as const)('recovery excludes %s results while retaining frozen due evidence without content', async ending => {
  const { repository, f } = await setup(undefined, compiledPack());
  const original = await repository.ensureReview(ensureCommand(), f.pack);
  if (ending === 'unsettled') await laterResult(repository, f, ending, 'victory', false);
  else {
    const run = (await repository.getResults(f.run.pilotId)).run;
    await repository.startAttempt({ ...f.start, operationId: ending + '-start', attemptId: ending,
      expectedBuildRevision: run.shipBuild!.revision }, f.pack);
    const ended = await repository.endAttempt({ kind: ending === 'abandoned' ? 'abandon-attempt' : 'interrupt-attempt',
      operationId: ending + '-end', pilotId: run.pilotId, runId: run.runId, attemptId: ending,
      endedAt: '2026-11-25T03:00:00Z' });
    await repository.settleOutcome(settlementCommand(ended, ending + '-settle'));
  }
  const app = new ReviewApplication(repository, contentApplication(), () => 'must-not-create',
    () => '2026-11-25T04:00:00Z');
  const recovered = await app.recover(f.run.pilotId);
  expect(recovered.occurrences).toEqual(original.occurrences);
  expect(recovered.links).toEqual(original.links);
  expect(recovered.rewards).toEqual([]);
  expect(recovered.economy.credits).toBe(24);
  expect(app.dueCount()).toBe(1);
});

it('recovery respects the saved legacy Run pins when the active default supports Review', async () => {
  const legacy = combatPack(), { repository, f } = await setup(undefined, legacy);
  const content = await admittedContent(legacy);
  expect((await content.activateCandidate(compiledPack())).activated).toBe(true);
  const app = new ReviewApplication(repository, content, () => 'must-not-create', () => '2026-11-25T04:00:00Z');
  const recovered = await app.recover(f.run.pilotId);
  expect(recovered.run.contentVersion).toBe(legacy.contentVersion);
  expect(recovered.run.rulesetVersion).toBe(legacy.compatibleRuleset);
  expect(recovered.occurrences).toEqual([]); expect(recovered.links).toEqual([]);
  expect(recovered.economy.credits).toBe(24);
  expect(app.dueCount()).toBe(0);
});

it('recovery rejects an active Attempt before creating any Review opportunity', async () => {
  const { repository, f } = await setup(undefined, compiledPack());
  const run = (await repository.getResults(f.run.pilotId)).run;
  await repository.startAttempt({ ...f.start, operationId: 'unsafe-start', attemptId: 'unsafe',
    expectedBuildRevision: run.shipBuild!.revision }, f.pack);
  const app = new ReviewApplication(repository, contentApplication(), () => 'must-not-create');
  await expect(app.recover(f.run.pilotId)).rejects.toMatchObject({ code: 'BUILD_REQUIRED' });
  expect(app.hasPendingSave()).toBe(false);
  expect((await repository.getReview(f.run.pilotId)).occurrences).toEqual([]);
});

it('recovery read failure before a command permits a fresh recover without claiming a pending save', async () => {
  class ReadFailure extends InMemoryReviewRepository {
    fail = true;
    override async getResults(pilotId: string) {
      if (this.fail) { this.fail = false; throw Error('Injected saved-results read failure'); }
      return super.getResults(pilotId);
    }
  }
  const repository = new ReadFailure(), { f } = await setup(repository, compiledPack());
  let sequence = 0;
  const app = new ReviewApplication(repository, await admittedContent(), () => 'read-retry-' + ++sequence,
    () => '2026-11-25T04:00:00Z');
  await expect(app.recover(f.run.pilotId)).rejects.toThrow('Injected saved-results read');
  expect(app.hasPendingSave()).toBe(false);
  await expect(app.retry()).rejects.toMatchObject({ code: 'NO_PENDING_SAVE' });
  expect((await app.recover(f.run.pilotId)).links).toHaveLength(1);
  expect(app.dueCount()).toBe(1);
});

it('recovery missing pinned content before a command can resume after the exact pack is restored', async () => {
  const { repository, f } = await setup(undefined, compiledPack()), content = contentApplication();
  let sequence = 0;
  const app = new ReviewApplication(repository, content, () => 'content-retry-' + ++sequence,
    () => '2026-11-25T04:00:00Z');
  await expect(app.recover(f.run.pilotId)).rejects.toMatchObject({ code: 'CONTENT_REQUIRED' });
  expect(app.hasPendingSave()).toBe(false);
  expect(app.snapshot().occurrences).toEqual([]);
  await expect(app.retry()).rejects.toMatchObject({ code: 'NO_PENDING_SAVE' });
  await content.bootstrap();
  expect((await content.activateCandidate(f.pack)).activated).toBe(true);
  expect((await app.recover(f.run.pilotId)).links).toHaveLength(1);
  expect(app.dueCount()).toBe(1);
});

it('dueCount projects the current injected WallClock and acknowledged completion from frozen evidence', async () => {
  const { repository, f } = await setup();
  await repository.ensureReview(ensureCommand(), f.pack);
  let clock = '2026-11-25T00:59:59Z';
  const app = new ReviewApplication(repository, contentApplication(), () => 'clock-answer', () => clock);
  expect((await app.open(f.run.pilotId)).selectedOccurrenceId).toBeNull();
  expect(app.dueCount()).toBe(0);
  clock = '2026-11-25T01:00:00Z';
  expect(app.dueCount()).toBe(1);
  expect((await app.open(f.run.pilotId)).selectedOccurrenceId).toBe('review-1');
  await app.submit('SHIP');
  expect(app.dueCount()).toBe(0);
  clock = 'invalid-time';
  expect(() => app.dueCount()).toThrow('valid WallClock');
});
