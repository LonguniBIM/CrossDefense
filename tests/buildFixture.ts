import { readFileSync } from 'node:fs';
import type { ContentPackManifest, BuildContent } from '../src/domain/content/contentPack';
import type { ActiveRun } from '../src/domain/run/run';
import { applySalvageOperation, createSalvageState } from '../src/domain/preRun/salvage';

export function buildPack(): ContentPackManifest & { build: BuildContent } {
  return JSON.parse(readFileSync('public/content/packs/development-build-ship-v1/manifest.json', 'utf8'));
}
/** Known state through public domain transitions; no production tile-grant entry point. */
export function finishedBuildRun(runId = 'build-run-test', pilotId = 'build-pilot-test', pack: ContentPackManifest = buildPack()): ActiveRun {
  const fresh: ActiveRun = { runId, pilotId, phase: 'pre-run-salvage', rulesetVersion: pack.compatibleRuleset, contentVersion: pack.contentVersion, quota: { total: 8, remaining: 8 }, starterObjective: pack.preRun.starterObjective, startedAt: '2026-10-06T00:00:00Z' };
  const initial = createSalvageState(fresh, pack.preRun);
  let run = applySalvageOperation(fresh, { operationId: 'fixture-init', kind: 'initialize', pilotId, runId, expectedRevision: 0, initial });
  run = applySalvageOperation(run, { operationId: 'fixture-collect', kind: 'collect', pilotId, runId, expectedRevision: 0, tileIds: initial.order.map(tile => tile.id) });
  return applySalvageOperation(run, { operationId: 'fixture-finish', kind: 'finish', pilotId, runId, expectedRevision: 1 });
}
