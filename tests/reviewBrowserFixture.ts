import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import type { ContentPackManifest } from '../src/domain/content/contentPack';
import { hasRenderAssets } from '../src/domain/content/renderAssets';
import { applyOutcomeSettlement, emptyEconomy, settlementFingerprint } from '../src/domain/results/settlement';
import { resultFixture, settlementCommand, keepAllCommand } from './resultsFixture';
import { applyCargoResolution, cargoResolutionFingerprint } from '../src/domain/results/salvageResolution';
import { combatPack, startCommand } from './combatFixture';
import type { ActiveRun } from '../src/domain/run/run';
import { applyStartAttempt } from '../src/domain/attempt/attempt';
import { applyCombatCommit } from '../src/domain/combat/collection';
import { inspectResultsSave } from './resultsBrowserFixture';

export const inspectReviewSave = inspectResultsSave;
export function reviewPack(): ContentPackManifest {
  return JSON.parse(readFileSync('public/content/packs/development-review-ship-v1/manifest.json', 'utf8'));
}
export interface ReviewSeedOptions {
  count?: number;
  kind?: 'victory' | 'failed';
  settled?: boolean;
  pack?: ContentPackManifest;
  corruptEconomy?: boolean;
  resolvedCargo?: boolean;
}
/** Disposable native v8 fixture; deliberately independent of the new v9 adapter. */
export async function seedV8OutcomeSave(page: Page, options: ReviewSeedOptions = {}) {
  const pack = options.pack ?? combatPack();
  const fixture = resultFixture(options.count ?? 0, options.kind ?? 'victory', 'Normal', pack);
  const command = settlementCommand(fixture.run);
  const paid = options.settled === false ? null : applyOutcomeSettlement(fixture.run, fixture.outcome, emptyEconomy(fixture.run.pilotId), command);
  const initialRun = paid?.run ?? fixture.run;
  const cargoCommand = options.resolvedCargo ? keepAllCommand(initialRun) : null;
  const run = cargoCommand ? applyCargoResolution(initialRun, pack.build!, cargoCommand) : initialRun;
  const cargoOperation = cargoCommand ? { operationId: cargoCommand.operationId, pilotId: run.pilotId, runId: run.runId, kind: cargoCommand.kind,
    fingerprint: cargoResolutionFingerprint(cargoCommand), keptIds: cargoCommand.keepIds, discardedIds: cargoCommand.discardIds,
    removedRetainedIds: cargoCommand.removeRetainedIds, cargoRevision: run.cargo!.revision, recordedAt: cargoCommand.recordedAt } : null;
  const settlementOperation = paid ? { operationId: command.operationId, pilotId: run.pilotId, runId: run.runId,
    attemptId: command.attemptId, kind: command.kind, fingerprint: settlementFingerprint(command) } : null;
  await page.route('**/review-save-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated Review persistence fixture</body></html>' }));
  await page.goto('/review-save-fixture');
  await page.evaluate(async ({ run, outcome, pack, paid, settlementOperation, cargoOperation, corruptEconomy, renderBody }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data', 80);
      request.onupgradeneeded = () => {
        for (const [name, key, indexes] of [
          ['workspace', 'key', []], ['pilots', 'pilotId', ['lastUsedAt']], ['operations', 'operationId', ['pilotId']],
          ['runs', 'runId', ['pilotId', 'contentVersion', 'rulesetVersion']], ['runOperations', 'operationId', ['pilotId', 'runId']],
          ['salvageOperations', 'operationId', ['pilotId', 'runId']], ['buildOperations', 'operationId', ['pilotId', 'runId']],
          ['attemptOperations', 'operationId', ['pilotId', 'runId', 'attemptId']], ['combatOperations', 'operationId', ['pilotId', 'runId', 'attemptId']],
          ['combatOutcomes', 'attemptId', ['pilotId', 'runId']], ['pilotEconomies', 'pilotId', []],
          ['outcomeSettlements', 'attemptId', ['pilotId', 'runId']], ['outcomeOperations', 'operationId', ['pilotId', 'runId', 'attemptId']],
          ['cargoOperations', 'operationId', ['pilotId', 'runId']],
        ] as Array<[string, string, string[]]>) {
          const table = request.result.createObjectStore(name, { keyPath: key });
          for (const index of indexes) table.createIndex(index, index, { unique: name === 'runs' && index === 'pilotId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
        tx.objectStore('workspace').add({ key: 'workspace', schemaVersion: 8 });
        tx.objectStore('pilots').add({ pilotId: run.pilotId, nickname: 'Review tester', avatarId: 'pilot-blue', createdAt: run.startedAt, lastUsedAt: run.startedAt, lastDifficulty: 'Hard' });
        tx.objectStore('runs').add(run);
        tx.objectStore('combatOutcomes').add(outcome);
        tx.objectStore('operations').add({ operationId: 'fixture-pilot', pilotId: run.pilotId, kind: 'create-pilot' });
        tx.objectStore('runOperations').add({ operationId: 'fixture-run', pilotId: run.pilotId, runId: run.runId, kind: 'start-run' });
        if (paid) {
          tx.objectStore('pilotEconomies').add({ ...paid.economy, credits: paid.economy.credits + (corruptEconomy ? 1 : 0) });
          tx.objectStore('outcomeSettlements').add(paid.settlement);
          tx.objectStore('outcomeOperations').add(settlementOperation);
        }
        if (cargoOperation) tx.objectStore('cargoOperations').add(cargoOperation);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
        tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
    if (renderBody) {
      const bodies = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('crossdefense-render-content-bodies', 10);
        request.onupgradeneeded = () => request.result.createObjectStore('bodies', { keyPath: 'version' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = bodies.transaction('bodies', 'readwrite');
          tx.objectStore('bodies').put({ version: pack.contentVersion, encoded: JSON.stringify(pack) });
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error);
          tx.onerror = () => reject(tx.error);
        });
      } finally { bodies.close(); }
    } else localStorage.setItem('crossdefense-content-pack:' + pack.contentVersion, JSON.stringify(pack));
    localStorage.setItem('crossdefense-content-pack-state', JSON.stringify({ activeVersion: pack.contentVersion, lastKnownGoodVersion: pack.contentVersion, digests: { [pack.contentVersion]: pack.integrity.manifestSha256 } }));
  }, { run, outcome: fixture.outcome, pack, paid, settlementOperation, cargoOperation, corruptEconomy: options.corruptEconomy ?? false,
    renderBody: hasRenderAssets(pack.contentVersion) });
  return { ...fixture, run };
}
export function seedReviewOutcomeSave(page: Page, options: Omit<ReviewSeedOptions, 'pack'> = {}) {
  return seedV8OutcomeSave(page, { ...options, pack: reviewPack() });
}
export async function openReviewBuild(page: Page, options: Omit<ReviewSeedOptions, 'pack'> = {}) {
  const fixture = await seedReviewOutcomeSave(page, options);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Pilot chooser', exact: true })).toBeVisible();
  await page.getByTestId('pilot-card').getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build Phase', exact: true })).toBeVisible();
  return fixture;
}

/** Prepared later terminal outcome through public Domain transitions; no browser combat play is claimed. */
export async function appendReviewOutcome(page: Page, attemptId: string): Promise<void> {
  const saved = await inspectReviewSave(page), current = saved.tables.runs![0] as ActiveRun;
  const pack = reviewPack();
  const start = { ...startCommand(current), operationId: attemptId + '-start', attemptId,
    seed: attemptId + '-seed', startedAt: '2026-11-25T02:00:00Z' };
  const active = applyStartAttempt(current, pack, start);
  const completed = applyCombatCommit(active, { kind: 'combat-tick', operationId: attemptId + '-terminal',
    pilotId: active.pilotId, runId: active.runId, attemptId, expectedRevision: 0, tick: 3673, payloadIds: [],
    terminal: { kind: 'victory', causes: [] }, recordedAt: '2026-11-25T02:01:00Z' });
  if (!completed.outcome) throw new Error('The prepared later outcome must be terminal.');
  await page.evaluate(async ({ run, outcome }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('crossdefense-player-data');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['runs', 'combatOutcomes'], 'readwrite');
        tx.objectStore('runs').put(run); tx.objectStore('combatOutcomes').add(outcome);
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { run: completed.run, outcome: completed.outcome });
}
