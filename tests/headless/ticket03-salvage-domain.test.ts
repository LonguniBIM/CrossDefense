import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSalvageState } from '../../src/domain/preRun/salvage';
import type { ActiveRun } from '../../src/domain/run/run';
import type { ContentPackManifest } from '../../src/domain/content/contentPack';

const pack = JSON.parse(readFileSync('public/content/packs/development/manifest.json', 'utf8')) as ContentPackManifest;
const run: ActiveRun = {
  runId: 'run-ship-03', pilotId: 'pilot-03', phase: 'pre-run-salvage',
  rulesetVersion: pack.compatibleRuleset, contentVersion: pack.contentVersion,
  quota: { total: 8, remaining: 8 }, starterObjective: pack.preRun.starterObjective,
  startedAt: '2026-10-06T00:00:00.000Z',
};

it('Q3-A creates eight distinct stable entries in one seeded order, without granting any tiles', () => {
  const first = createSalvageState(run, pack.preRun);
  const reloaded = createSalvageState(structuredClone(run), pack.preRun);
  expect(first).toEqual(reloaded);
  expect(first.order).toHaveLength(8);
  expect(new Set(first.order.map(tile => tile.id)).size).toBe(8);
  expect(first.order.map(tile => tile.letter + ':' + tile.subtype).sort()).toEqual([
    'H:Armor', 'H:Armor', 'I:Power', 'I:Power', 'P:Armor', 'P:Armor', 'S:Ballistic', 'S:Ballistic',
  ]);
  expect(first.collectedIds).toEqual([]);
  expect(first.completed).toBe(false);
});

import { applySalvageOperation, canFinishSalvage } from '../../src/domain/preRun/salvage';

it('commits only distinct pool entries and quota together; four wrong letters cannot finish', () => {
  const initial = createSalvageState(run, pack.preRun);
  const started = applySalvageOperation(run, {
    kind: 'initialize', operationId: 'init', pilotId: run.pilotId, runId: run.runId,
    expectedRevision: 0, initial,
  });
  const wrongLetters = initial.order.filter(tile => tile.letter === 'S' || tile.letter === 'H').map(tile => tile.id);
  const collected = applySalvageOperation(started, {
    kind: 'collect', operationId: 'clear-1', pilotId: run.pilotId, runId: run.runId,
    expectedRevision: 0, tileIds: wrongLetters,
  });
  expect(collected.quota).toEqual({ total: 8, remaining: 4 });
  expect(started.quota.remaining).toBe(8);
  expect(canFinishSalvage(collected)).toBe(false);
  expect(() => applySalvageOperation(collected, {
    kind: 'finish', operationId: 'finish', pilotId: run.pilotId, runId: run.runId, expectedRevision: 1,
  })).toThrow('starter');
  expect(() => applySalvageOperation(collected, {
    kind: 'collect', operationId: 'duplicate-clear', pilotId: run.pilotId, runId: run.runId,
    expectedRevision: 1, tileIds: wrongLetters,
  })).toThrow('collected');
});
