import { expect, it } from 'vitest';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { applyPlacement, projectBuild, previewPlacement, type PlacementOperation } from '../../src/domain/build/shipBuild';
import type { ActiveRun } from '../../src/domain/run/run';

function operation(run: ActiveRun, index: number, x: number, y: number, operationId = 'place-' + index): PlacementOperation {
  return { operationId, kind: 'place', pilotId: run.pilotId, runId: run.runId, contentVersion: run.contentVersion, rulesetVersion: run.rulesetVersion,
    expectedRevision: run.shipBuild?.revision ?? 0, tileId: run.runId + ':starter:' + index, x, y };
}

it('derives a committed SHIP and exact hundredths of Power while preview never changes the Run', () => {
  const pack = buildPack();
  let run = finishedBuildRun();
  expect(projectBuild(run, pack.build).power).toEqual({ available: 0, required: 0, surplus: 0 });
  for (let index = 0; index < 3; index += 1) run = applyPlacement(run, pack.build, operation(run, index, index, 2));
  const before = structuredClone(run);
  const preview = previewPlacement(run, pack.build, operation(run, 3, 3, 2));
  expect(preview.valid).toBe(true);
  expect(preview.after?.power).toEqual({ available: 405, required: 100, surplus: 305 });
  expect(run).toEqual(before);
  run = applyPlacement(run, pack.build, operation(run, 3, 3, 2));
  const summary = projectBuild(run, pack.build);
  expect(summary.words.map(word => [word.spelling, word.supported, word.multiplier])).toEqual([['SHIP', true, 135]]);
  expect(summary.power).toEqual({ available: 405, required: 100, surplus: 305 });
  expect(summary.retainedCount).toBe(8);
  expect(summary.equipped.length).toBe(4);
  expect(summary.unplaced.length).toBe(4);
  expect(run.shipBuild).toEqual({ hullId: pack.build.hull.id, revision: 4, placements: [0, 1, 2, 3].map(index => ({ tileId: run.runId + ':starter:' + index, x: index, y: 2 })) });
});

it('recognizes only maximal sequences: SHIPS is one word, not SHIP plus a substring', () => {
  const pack = buildPack(); let run = finishedBuildRun();
  for (const [index, x] of [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] as const) run = applyPlacement(run, pack.build, operation(run, index, x, 2));
  const summary = projectBuild(run, pack.build);
  expect(summary.words.map(word => word.spelling)).toEqual(['SHIPS']);
  expect(summary.power).toEqual({ available: 465, required: 200, surplus: 265 });
  expect(summary.equipped.map(tile => tile.multiplier)).toEqual([155, 155, 155, 155, 155]);
});

it('a shared I tile receives the crossing multiplier once, without counting its Power twice', () => {
  const pack = buildPack(); let run = finishedBuildRun();
  for (const [index, x, y] of [[0, 0, 2], [1, 1, 2], [2, 2, 2], [3, 3, 2], [4, 2, 0], [5, 2, 1], [7, 2, 3]] as const) {
    run = applyPlacement(run, pack.build, operation(run, index, x, y));
  }
  const summary = projectBuild(run, pack.build);
  expect(summary.words.map(word => [word.spelling, word.axis])).toEqual([['SHIP', 'horizontal'], ['SHIP', 'vertical']]);
  expect(summary.equipped.find(tile => tile.id.endsWith(':2'))?.multiplier).toBe(150);
  expect(summary.power).toEqual({ available: 450, required: 200, surplus: 250 });
  expect(summary.retainedCount).toBe(8);
  expect(summary.unplaced.map(tile => tile.id)).toEqual([run.runId + ':starter:6']);
});

it('unsupported full strings keep intrinsic Power and no word bonus; gaps are not bridged', () => {
  const pack = buildPack(); let run = finishedBuildRun();
  for (let index = 0; index < 3; index += 1) run = applyPlacement(run, pack.build, operation(run, index, index, 2));
  expect(projectBuild(run, pack.build).words).toMatchObject([{ spelling: 'SHI', supported: false, multiplier: 100 }]);
  expect(projectBuild(run, pack.build).power).toEqual({ available: 300, required: 100, surplus: 200 });
  run = applyPlacement(run, pack.build, operation(run, 2, 4, 2, 'move-i'));
  expect(projectBuild(run, pack.build).words).toEqual([]);
  expect(projectBuild(run, pack.build).retainedCount).toBe(8);
});

it('occupied, out-of-hull, fractional, unknown and stale placements preserve both tiles and all saved input', () => {
  const pack = buildPack(); let run = finishedBuildRun();
  run = applyPlacement(run, pack.build, operation(run, 0, 0, 2));
  const before = structuredClone(run);
  const candidates = [operation(run, 1, 0, 2), operation(run, 1, 0, 0), operation(run, 1, 1.5, 2),
    { ...operation(run, 1, 1, 2), tileId: 'foreign-tile' }, { ...operation(run, 1, 1, 2), expectedRevision: 0 },
    { ...operation(run, 1, 1, 2), contentVersion: 'other-content' }];
  for (const candidate of candidates) {
    expect(previewPlacement(run, pack.build, candidate).valid).toBe(false);
    expect(() => applyPlacement(run, pack.build, candidate)).toThrow();
    expect(run).toEqual(before);
  }
  expect(projectBuild(run, pack.build).equipped).toHaveLength(1);
});

import { crossingMultiplier, wordMultiplier } from '../../src/domain/build/rules';
it('uses the approved integer Ruleset table and the 2.60 crossing cap', () => {
  expect([3, 4, 5, 6, 7, 8, 9].map(wordMultiplier)).toEqual([120, 135, 155, 180, 210, 240, 240]);
  expect(crossingMultiplier(135, 155)).toBe(170);
  expect(crossingMultiplier(255, 240)).toBe(260);
});
