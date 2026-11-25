import { test, expect } from '@playwright/test';
import { seedReviewOutcomeSave, seedV8OutcomeSave, inspectReviewSave } from '../reviewBrowserFixture';
import type { ActiveRun } from '../../src/domain/run/run';
import type { EnsureReviewCommand, SubmitReviewCommand } from '../../src/domain/review/occurrence';
import { finishedBuildRun } from '../buildFixture';
import { startCommand } from '../combatFixture';
import { applyPlacement } from '../../src/domain/build/shipBuild';
import { applyStartAttempt } from '../../src/domain/attempt/attempt';
import { applyCombatCommit } from '../../src/domain/combat/collection';

function ensureCommand(run: ActiveRun): EnsureReviewCommand {
  return { kind: 'ensure-review', operationId: 'review-ensure', pilotId: run.pilotId, runId: run.runId,
    attemptId: run.attempt!.attemptId, occurrenceId: 'review-occurrence', recordedAt: '2026-11-25T00:00:00Z' };
}
function submitCommand(ensure: EnsureReviewCommand): SubmitReviewCommand {
  return { kind: 'submit-review', operationId: 'review-submit', pilotId: ensure.pilotId, runId: ensure.runId,
    occurrenceId: ensure.occurrenceId, expectedRevision: 0, answer: '  shIP  ', recordedAt: '2026-11-25T00:01:00Z' };
}

for (const table of ['reviewOccurrences', 'reviewLinks', 'reviewOperations']) test('Review creation failure at ' + table + ' rolls back occurrence, Attempt link and operation together', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), command = ensureCommand(fixture.run);
  const result = await page.evaluate(async ({ command, table }) => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize();
    const before = await repo.getReview(command.pilotId);
    const add = IDBObjectStore.prototype.add, put = IDBObjectStore.prototype.put; let error = '';
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) { if (this.name === table) throw new DOMException('Injected Review creation failure', 'UnknownError'); return add.apply(this, args); };
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) { if (this.name === table) throw new DOMException('Injected Review creation failure', 'UnknownError'); return put.apply(this, args); };
    try { await repo.ensureReview(command, pack); } catch (caught) { error = String(caught); }
    finally { IDBObjectStore.prototype.add = add; IDBObjectStore.prototype.put = put; }
    const failed = await repo.getReview(command.pilotId);
    const retry = await repo.ensureReview(command, pack), duplicate = await repo.ensureReview(command, pack);
    return { before, failed, retry, duplicate, error };
  }, { command, table });
  expect(result.error).toContain('Injected Review creation failure');
  expect(result.failed).toEqual(result.before);
  expect(result.retry).toEqual(result.duplicate);
  expect(result.retry.occurrences).toHaveLength(1); expect(result.retry.links).toHaveLength(1);
  expect(result.retry.occurrences[0].dueAt).toBe(command.recordedAt);
  const saved = await inspectReviewSave(page); expect(saved.tables.reviewOperations).toHaveLength(1); expect(saved.tables.reviewRewards).toHaveLength(0);
});

for (const table of ['reviewOccurrences', 'reviewRewards', 'pilotEconomies', 'runs', 'reviewOperations']) test('Review completion failure at ' + table + ' rolls back evidence, reward, balance and Run revision together', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), ensure = ensureCommand(fixture.run), submit = submitCommand(ensure);
  const result = await page.evaluate(async ({ ensure, submit, table }) => {
    const load = (path: string) => import(path);
    const { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize();
    const before = await repo.ensureReview(ensure, pack);
    const add = IDBObjectStore.prototype.add, put = IDBObjectStore.prototype.put; let error = '';
    IDBObjectStore.prototype.add = function (...args: Parameters<typeof add>) { if (this.name === table) throw new DOMException('Injected Review completion failure', 'UnknownError'); return add.apply(this, args); };
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof put>) { if (this.name === table) throw new DOMException('Injected Review completion failure', 'UnknownError'); return put.apply(this, args); };
    try { await repo.applyReview(submit); } catch (caught) { error = String(caught); }
    finally { IDBObjectStore.prototype.add = add; IDBObjectStore.prototype.put = put; }
    const failed = await repo.getReview(ensure.pilotId, ensure.occurrenceId);
    const retry = await repo.applyReview(submit), duplicate = await repo.applyReview(submit);
    await repo.initialize();
    const results = await repo.getResults(ensure.pilotId);
    return { before, failed, retry, duplicate, results, error };
  }, { ensure, submit, table });
  expect(result.error).toContain('Injected Review completion failure'); expect(result.failed).toEqual(result.before);
  expect(result.retry).toEqual(result.duplicate); expect(result.retry.economy.credits).toBe(26); expect(result.retry.economy.celestium).toBe(1);
  expect(result.retry.run.economyRevision).toBe(2); expect(result.retry.rewards).toHaveLength(1);
  expect(result.retry.occurrences[0].responses).toHaveLength(1); expect(result.retry.occurrences[0].firstResponse.answer).toBe('  shIP  ');
  expect(result.retry.occurrences[0].attemptsToFirstCorrect).toBe(1); expect(result.retry.occurrences[0].independentFirstResponse).toBe(true);
  expect(result.results.economy).toEqual(result.retry.economy);
  const saved = await inspectReviewSave(page); expect(saved.tables.reviewOperations).toHaveLength(2); expect(saved.tables.reviewRewards).toHaveLength(1);
});

test('native Review links reuse unfinished evidence, retain completed results and replay current state after later rewards', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), ensure = ensureCommand(fixture.run), submit = submitCommand(ensure);
  const result = await page.evaluate(async ({ ensure, submit }) => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize();
    const states = await Promise.all([repo.ensureReview(ensure, pack), repo.ensureReview({ ...ensure, operationId: 'ensure-concurrent', occurrenceId: 'unused-candidate' }, pack)]);
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('combatOutcomes', 'readwrite'), table = tx.objectStore('combatOutcomes'), request = table.get(ensure.attemptId);
        request.onsuccess = () => { table.add({ ...request.result, attemptId: 'later-outcome-2', seed: 'later-seed-2' }); table.add({ ...request.result, attemptId: 'later-outcome-3', seed: 'later-seed-3' }); };
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    await repo.settleOutcome({ kind: 'settle-outcome', operationId: 'settle-second', pilotId: ensure.pilotId, runId: ensure.runId, attemptId: 'later-outcome-2', recordedAt: '2026-11-25T00:00:01Z' });
    const reused = await repo.ensureReview({ ...ensure, operationId: 'ensure-second', attemptId: 'later-outcome-2', occurrenceId: 'unused-second' }, pack);
    await repo.applyReview(submit); // The caller may lose this acknowledgment; only durable state is authoritative.
    const reopened = await repo.ensureReview({ ...ensure, operationId: 'reopen-completed', occurrenceId: 'must-not-exist' }, pack);
    await repo.settleOutcome({ kind: 'settle-outcome', operationId: 'settle-third', pilotId: ensure.pilotId, runId: ensure.runId, attemptId: 'later-outcome-3', recordedAt: '2026-11-25T00:02:00Z' });
    const later = await repo.ensureReview({ ...ensure, operationId: 'ensure-third', attemptId: 'later-outcome-3', occurrenceId: 'second-occurrence', recordedAt: '2026-11-25T00:02:01Z' }, pack);
    await repo.applyReview({ kind: 'hint-review', operationId: 'later-hint', pilotId: ensure.pilotId, runId: ensure.runId, occurrenceId: 'second-occurrence', expectedRevision: 0, hint: 'context', recordedAt: '2026-11-25T00:02:02Z' });
    await repo.applyReview({ ...submit, operationId: 'later-submit', occurrenceId: 'second-occurrence', expectedRevision: 1, recordedAt: '2026-11-25T00:02:03Z' });
    const replay = await repo.applyReview(submit);
    const ensureReplay = await repo.ensureReview(ensure, pack);
    let conflict = ''; try { await repo.applyReview({ ...submit, answer: 'different payload' }); } catch (caught) { conflict = String(caught); }
    await repo.initialize(); return { states, reused, reopened, later, replay, ensureReplay, conflict, results: await repo.getResults(ensure.pilotId) };
  }, { ensure, submit });
  expect(result.states.every(state => state.occurrences.length === 1 && state.selectedOccurrenceId === ensure.occurrenceId)).toBe(true);
  expect(result.reused.occurrences).toHaveLength(1); expect(result.reused.links).toHaveLength(2);
  expect(result.reopened.occurrences).toHaveLength(1); expect(result.reopened.selectedOccurrenceId).toBe(ensure.occurrenceId);
  expect(result.reopened.occurrences[0].completedAt).toBeTruthy(); expect(result.later.occurrences).toHaveLength(2);
  expect(result.replay.economy.credits).toBe(35); expect(result.replay.economy.celestium).toBe(1); expect(result.replay.run.economyRevision).toBe(5);
  expect(result.replay.links).toHaveLength(3); expect(result.replay.rewards).toHaveLength(2);
  expect(result.ensureReplay).toEqual(result.replay); expect(result.results.economy).toEqual(result.replay.economy); expect(result.conflict).toBeTruthy();
});

test('blank submission and reveal alone publish no reward while the assisted first correct answer pays completion once', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), ensure = ensureCommand(fixture.run), submit = submitCommand(ensure);
  const result = await page.evaluate(async ({ ensure, submit }) => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); const before = await repo.ensureReview(ensure, pack);
    let blank = ''; try { await repo.applyReview({ ...submit, answer: ' \t ' }); } catch (caught) { blank = String(caught); }
    const afterBlank = await repo.getReview(ensure.pilotId, ensure.occurrenceId);
    const revealed = await repo.applyReview({ kind: 'hint-review', operationId: 'reveal', pilotId: ensure.pilotId, runId: ensure.runId, occurrenceId: ensure.occurrenceId, expectedRevision: 0, hint: 'reveal', recordedAt: submit.recordedAt });
    const completed = await repo.applyReview({ ...submit, expectedRevision: 1 });
    return { before, afterBlank, blank, revealed, completed };
  }, { ensure, submit });
  expect(result.blank).toBeTruthy(); expect(result.afterBlank).toEqual(result.before);
  expect(result.revealed.occurrences[0].responses).toHaveLength(0); expect(result.revealed.rewards).toHaveLength(0); expect(result.revealed.economy.credits).toBe(24);
  expect(result.completed.economy.credits).toBe(25); expect(result.completed.economy.celestium).toBe(1);
  expect(result.completed.occurrences[0].independentFirstResponse).toBe(false); expect(result.completed.rewards).toHaveLength(1);
});

for (const fault of ['missing-economy', 'foreign-link-owner', 'changed-content-pin', 'missing-submit-operation', 'changed-reward']) test('Review bootstrap rejects ' + fault + ' and preserves the corrupted save for recovery', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), ensure = ensureCommand(fixture.run), submit = submitCommand(ensure);
  await page.evaluate(async ({ ensure, submit, fault }) => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); await repo.ensureReview(ensure, pack); await repo.applyReview(submit);
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['pilotEconomies', 'reviewLinks', 'reviewOccurrences', 'reviewOperations', 'reviewRewards'], 'readwrite');
        if (fault === 'missing-economy') tx.objectStore('pilotEconomies').delete(ensure.pilotId);
        if (fault === 'missing-submit-operation') tx.objectStore('reviewOperations').delete(submit.operationId);
        if (fault === 'foreign-link-owner') { const table = tx.objectStore('reviewLinks'), request = table.get(ensure.attemptId); request.onsuccess = () => table.put({ ...request.result, pilotId: 'foreign-pilot' }); }
        if (fault === 'changed-content-pin') { const table = tx.objectStore('reviewOccurrences'), request = table.get(ensure.occurrenceId); request.onsuccess = () => table.put({ ...request.result, contentDigest: 'a'.repeat(64) }); }
        if (fault === 'changed-reward') { const table = tx.objectStore('reviewRewards'), request = table.get(ensure.occurrenceId); request.onsuccess = () => table.put({ ...request.result, completionCredits: 2, total: { credits: 3, celestium: 0 } }); }
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { ensure, submit, fault });
  const before = await inspectReviewSave(page); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workspace recovery', exact: true })).toBeVisible();
  expect(await inspectReviewSave(page)).toEqual(before);
});

test('an old pinned Run cannot borrow Review from the new default pack', async ({ page }) => {
  const fixture = await seedV8OutcomeSave(page), command = ensureCommand(fixture.run);
  const result = await page.evaluate(async command => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); const before = await repo.getReview(command.pilotId);
    let error = ''; try { await repo.ensureReview(command, pack); } catch (caught) { error = String(caught); }
    return { before, after: await repo.getReview(command.pilotId), error };
  }, command);
  expect(result.error).toBeTruthy(); expect(result.after).toEqual(result.before); expect(result.after.occurrences).toHaveLength(0);
});

test('Review requires an existing settled outcome, exact owner and matching immutable content', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page, { settled: false }), command = ensureCommand(fixture.run);
  const result = await page.evaluate(async command => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); const before = await repo.getReview(command.pilotId), errors: string[] = [];
    for (const candidate of [command, { ...command, pilotId: 'different-pilot' }, { ...command, runId: 'different-run' }]) {
      try { await repo.ensureReview(candidate, pack); } catch (caught) { errors.push(String(caught)); }
    }
    await repo.settleOutcome({ kind: 'settle-outcome', operationId: 'settle', pilotId: command.pilotId, runId: command.runId, attemptId: command.attemptId, recordedAt: command.recordedAt });
    const settled = await repo.getReview(command.pilotId), changed = structuredClone(pack); changed.review.rewards.completionCredits = 100;
    try { await repo.ensureReview(command, changed); } catch (caught) { errors.push(String(caught)); }
    return { before, settled, after: await repo.getReview(command.pilotId), errors };
  }, command);
  expect(result.errors).toHaveLength(4); expect(result.before.occurrences).toHaveLength(0);
  expect(result.after).toEqual(result.settled); expect(result.after.occurrences).toHaveLength(0);
});

for (const ending of ['abandoned', 'interrupted'] as const) test(ending + ' outcomes never create Review occurrences even after zero-value settlement', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page, { settled: false }), command = ensureCommand(fixture.run);
  const result = await page.evaluate(async ({ command, ending }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['runs', 'combatOutcomes'], 'readwrite'), runs = tx.objectStore('runs'), outcomes = tx.objectStore('combatOutcomes');
        const run = runs.get(command.runId), outcome = outcomes.get(command.attemptId);
        run.onsuccess = () => runs.put({ ...run.result, attempt: { ...run.result.attempt, status: ending } });
        outcome.onsuccess = () => outcomes.put({ ...outcome.result, terminal: { kind: ending, causes: [] }, tick: null, settlement: 'not-eligible' });
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize();
    await repo.settleOutcome({ kind: 'settle-outcome', operationId: 'settle-excluded', pilotId: command.pilotId, runId: command.runId, attemptId: command.attemptId, recordedAt: command.recordedAt });
    let error = ''; try { await repo.ensureReview(command, pack); } catch (caught) { error = String(caught); }
    return { error, state: await repo.getReview(command.pilotId) };
  }, { command, ending });
  expect(result.error).toContain('Abandonment and interruption'); expect(result.state.occurrences).toHaveLength(0);
  expect(result.state.links).toHaveLength(0); expect(result.state.rewards).toHaveLength(0); expect(result.state.economy.credits).toBe(0);
});

test('native Review evidence and rewards remain isolated between two saved Pilots', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), ensure = ensureCommand(fixture.run);
  let otherBuild = finishedBuildRun('other-run', 'other-pilot', fixture.pack);
  for (let index = 0; index < 4; index++) otherBuild = applyPlacement(otherBuild, fixture.pack.build!, { operationId: 'other-place-' + index,
    kind: 'place', pilotId: otherBuild.pilotId, runId: otherBuild.runId, contentVersion: otherBuild.contentVersion,
    rulesetVersion: otherBuild.rulesetVersion, expectedRevision: index, tileId: 'other-run:starter:' + index, x: index, y: 2 });
  const otherActive = applyStartAttempt(otherBuild, fixture.pack, { ...startCommand(otherBuild), attemptId: 'other-attempt' });
  const otherTerminal = applyCombatCommit(otherActive, { ...fixture.command, operationId: 'other-terminal', pilotId: otherBuild.pilotId, runId: otherBuild.runId, attemptId: 'other-attempt' });
  const otherRun = otherTerminal.run, otherOutcome = otherTerminal.outcome!;
  const result = await page.evaluate(async ({ ensure, otherRun, otherOutcome }) => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); const before = await repo.ensureReview(ensure, pack);
    await repo.createPilot({ operationId: 'create-other-pilot', pilot: { pilotId: otherRun.pilotId, nickname: 'Other Review tester', avatarId: 'pilot-gold', createdAt: otherRun.startedAt, lastUsedAt: otherRun.startedAt } });
    await repo.createRun({ operationId: 'create-other-run', run: otherRun });
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('combatOutcomes', 'readwrite'); tx.objectStore('combatOutcomes').add(otherOutcome); tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
    await repo.settleOutcome({ kind: 'settle-outcome', operationId: 'settle-other', pilotId: otherRun.pilotId, runId: otherRun.runId, attemptId: otherOutcome.attemptId, recordedAt: ensure.recordedAt });
    await repo.ensureReview({ ...ensure, operationId: 'ensure-other', pilotId: otherRun.pilotId, runId: otherRun.runId, attemptId: otherOutcome.attemptId, occurrenceId: 'other-occurrence' }, pack);
    let error = ''; try { await repo.applyReview({ kind: 'submit-review', operationId: 'cross-owner', pilotId: otherRun.pilotId, runId: otherRun.runId, occurrenceId: ensure.occurrenceId, answer: 'SHIP', expectedRevision: 0, recordedAt: ensure.recordedAt }); } catch (caught) { error = String(caught); }
    const other = await repo.applyReview({ kind: 'submit-review', operationId: 'submit-other', pilotId: otherRun.pilotId, runId: otherRun.runId, occurrenceId: 'other-occurrence', answer: 'SHIP', expectedRevision: 0, recordedAt: ensure.recordedAt });
    await repo.initialize(); return { before, after: await repo.getReview(ensure.pilotId, ensure.occurrenceId), other, error };
  }, { ensure, otherRun, otherOutcome });
  expect(result.error).toBeTruthy(); expect(result.after).toEqual(result.before);
  expect(result.after.economy.credits).toBe(24); expect(result.after.occurrences[0].responses).toHaveLength(0);
  expect(result.other.economy.credits).toBe(26); expect(result.other.occurrences).toHaveLength(1); expect(result.other.rewards).toHaveLength(1);
});

test('Review bootstrap binds frozen history to the exact owning Run startup digest', async ({ page }) => {
  const fixture = await seedReviewOutcomeSave(page), command = ensureCommand(fixture.run);
  const error = await page.evaluate(async command => {
    const load = (path: string) => import(path), { DexieWorkspaceRepository } = await load('/src/infrastructure/persistence/DexieWorkspaceRepository.ts');
    const pack = await fetch('/content/packs/development-review-ship-v1/manifest.json').then(response => response.json());
    const repo = new DexieWorkspaceRepository(); await repo.initialize(); await repo.ensureReview(command, pack);
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('crossdefense-player-data'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('runs', 'readwrite'), table = tx.objectStore('runs'), request = table.get(command.runId);
        request.onsuccess = () => { const run = request.result; run.attempt.startup.contentDigest = 'a'.repeat(64); table.put(run); };
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
    try { await new DexieWorkspaceRepository().initialize(); return ''; } catch (caught) { return String(caught); }
  }, command);
  expect(error).toContain('original Run content pins');
  const saved = await inspectReviewSave(page);
  expect(saved.tables.reviewOccurrences).toHaveLength(1); expect(saved.tables.reviewLinks).toHaveLength(1);
  expect(saved.tables.reviewRewards).toHaveLength(0);
  expect(saved.tables.runs).toEqual([expect.objectContaining({ attempt: expect.objectContaining({ startup: expect.objectContaining({ contentDigest: 'a'.repeat(64) }) }) })]);
});
