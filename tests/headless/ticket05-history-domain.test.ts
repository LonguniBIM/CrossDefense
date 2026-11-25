import { expect, it } from 'vitest';
import { buildPack, finishedBuildRun } from '../buildFixture';
import { applyPlacement } from '../../src/domain/build/shipBuild';
import { applyBuildOperation, copyLayout, historyScope, type HistoryOperation } from '../../src/domain/build/buildEditing';

function state() {
  const content = buildPack().build;
  const original = { ...finishedBuildRun(), economy: { credits: 123, purchases: ['kept'] } };
  const placed = applyPlacement(original, content, { kind: 'place', operationId: 'place', pilotId: original.pilotId, runId: original.runId,
    contentVersion: original.contentVersion, rulesetVersion: original.rulesetVersion, expectedRevision: 0, tileId: original.runId + ':starter:0', x: 0, y: 2 });
  const undo: HistoryOperation = { kind: 'undo', operationId: 'undo', pilotId: placed.pilotId, runId: placed.runId, contentVersion: placed.contentVersion,
    rulesetVersion: placed.rulesetVersion, expectedRevision: 1, scope: historyScope(placed, content), from: copyLayout(placed), to: [] };
  return { content, original, placed, undo };
}

it('history restores positions only and retains all non-layout state, including opaque progression data', () => {
  const { content, placed, undo } = state();
  const result = applyBuildOperation(placed, content, { ...undo, economy: { credits: 0 } } as HistoryOperation);
  const { shipBuild: beforeLayout, ...before } = placed;
  const { shipBuild: afterLayout, ...after } = result;
  expect(after).toEqual(before);
  expect(beforeLayout?.revision).toBe(1); expect(afterLayout).toMatchObject({ revision: 2, placements: [] });
});

it('changed economy, retained tiles, hull and phase cannot reuse an earlier history command', () => {
  const { content, placed, undo } = state();
  const economyChanged = { ...structuredClone(placed), economy: { credits: 200, purchases: ['kept', 'new'] } };
  expect(() => applyBuildOperation(economyChanged, content, undo)).toThrow('Build context changed');
  expect(economyChanged.economy.credits).toBe(200);
  const retainedChanged = structuredClone(placed);
  retainedChanged.salvage!.collectedIds = retainedChanged.salvage!.collectedIds.filter(id => id !== placed.runId + ':starter:7');
  retainedChanged.quota.remaining = 1;
  expect(() => applyBuildOperation(retainedChanged, content, undo)).toThrow();
  const hullChanged = structuredClone(placed); hullChanged.shipBuild!.hullId = 'another-hull';
  const differentHull = { ...content, hull: { ...content.hull, id: 'another-hull' } };
  expect(() => applyBuildOperation(hullChanged, differentHull, undo)).toThrow('Build context changed');
  const phaseChanged = { ...placed, phase: 'pre-run-salvage' as const };
  expect(() => applyBuildOperation(phaseChanged, content, undo)).toThrow();
});

it.each(['foreign', 'duplicate', 'outside', 'fractional'] as const)('rejects %s history targets without changing the original layout', failure => {
  const { content, placed, undo } = state();
  const before = structuredClone(placed), tileId = placed.runId + ':starter:0';
  const to = failure === 'foreign' ? [{ tileId: 'unowned', x: 0, y: 2 }] : failure === 'duplicate' ? [{ tileId, x: 0, y: 2 }, { tileId, x: 1, y: 2 }] :
    failure === 'outside' ? [{ tileId, x: 0, y: 0 }] : [{ tileId, x: 0.5, y: 2 }];
  expect(() => applyBuildOperation(placed, content, { ...undo, to })).toThrow();
  expect(placed).toEqual(before);
});

it('a changed owner, pinned version, source layout or revision rejects the history operation', () => {
  const { content, placed, undo } = state();
  for (const patch of [{ pilotId: 'another-pilot' }, { contentVersion: 'another-version' }, { expectedRevision: 0 }, { from: [] }]) {
    expect(() => applyBuildOperation(placed, content, { ...undo, ...patch })).toThrow();
  }
  expect(placed.shipBuild?.revision).toBe(1);
});
