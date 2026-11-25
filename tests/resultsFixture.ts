import { combatBuild, combatPack, startCommand } from './combatFixture';
import { applyStartAttempt } from '../src/domain/attempt/attempt';
import { applyCombatCommit } from '../src/domain/combat/collection';
import type { ContentPackManifest } from '../src/domain/content/contentPack';
import type { Difficulty } from '../src/domain/attempt/rules';
import type { SettleOutcomeCommand } from '../src/domain/results/settlement';
import type { CargoResolutionCommand } from '../src/domain/results/salvageResolution';
import type { ActiveRun } from '../src/domain/run/run';

/** Synthetic saved terminal fixture; separate full-Map browser tests prove actual combat. */
export function resultFixture(count = 2, kind: 'victory' | 'failed' = 'victory', difficulty: Difficulty = 'Normal', pack: ContentPackManifest = combatPack()) {
  const build = combatBuild(pack), start = { ...startCommand(build), difficulty };
  const active = applyStartAttempt(build, pack, start);
  const command = { kind: 'combat-tick' as const, operationId: 'fixture-terminal', pilotId: active.pilotId, runId: active.runId,
    attemptId: active.attempt!.attemptId, expectedRevision: 0, tick: 3673,
    payloadIds: Array.from({ length: count }, (_, index) => active.attempt!.attemptId + ':payload:' + index),
    terminal: { kind, causes: kind === 'failed' ? ['Timeout' as const] : [] }, recordedAt: '2026-10-11T00:00:00Z' };
  const result = applyCombatCommit(active, command);
  return { build, start, active, command, run: result.run, outcome: result.outcome!, pack };
}
export function settlementCommand(run: ActiveRun, operationId = 'fixture-settle'): SettleOutcomeCommand {
  return { kind: 'settle-outcome', operationId, pilotId: run.pilotId, runId: run.runId,
    attemptId: run.attempt!.attemptId, recordedAt: '2026-10-11T01:00:00Z' };
}
export function keepAllCommand(run: ActiveRun): CargoResolutionCommand {
  const bufferIds = (run.salvageBuffer ?? []).map(tile => tile.id);
  return { kind: 'resolve-salvage', operationId: 'fixture-keep', pilotId: run.pilotId, runId: run.runId,
    contentVersion: run.contentVersion, rulesetVersion: run.rulesetVersion, expectedBuildRevision: run.shipBuild?.revision ?? 0,
    expectedCargoRevision: run.cargo?.revision ?? 0, bufferIds, keepIds: bufferIds, discardIds: [], removeRetainedIds: [],
    confirmed: true, recordedAt: '2026-10-11T01:00:00Z' };
}
