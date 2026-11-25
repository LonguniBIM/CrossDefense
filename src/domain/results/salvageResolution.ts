import type { ActiveRun } from '../run/run';
import type { BuildContent } from '../content/contentPack';
import type { StarterTile } from '../preRun/salvage';
import { assertCargoState, retainedTiles } from '../run/cargo';
import { assertBuildState, projectBuild, type BuildSummary } from '../build/shipBuild';
import { assertAttemptState } from '../attempt/attempt';
import { INITIAL_CARGO_CAPACITY } from '../build/rules';
import { ResultRejection } from './settlement';

export interface CargoResolutionCommand {
  kind: 'resolve-salvage'; operationId: string; pilotId: string; runId: string;
  contentVersion: string; rulesetVersion: string; expectedBuildRevision: number; expectedCargoRevision: number;
  bufferIds: string[]; keepIds: string[]; discardIds: string[]; removeRetainedIds: string[];
  confirmed: true; recordedAt: string;
}
export interface CargoOperationReceipt {
  operationId: string; pilotId: string; runId: string; kind: 'resolve-salvage'; fingerprint: string;
  keptIds: string[]; discardedIds: string[]; removedRetainedIds: string[]; cargoRevision: number; recordedAt: string;
}
export interface CargoPreview {
  valid: boolean; before: BuildSummary; after?: BuildSummary; message: string | null;
  kept: StarterTile[]; discarded: StarterTile[]; removed: StarterTile[];
}
const id = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const ids = (value: unknown): value is string[] => Array.isArray(value) && value.every(id) && new Set(value).size === value.length;
const key = (values: readonly string[]) => JSON.stringify([...values].sort());
export function cargoResolutionFingerprint(command: CargoResolutionCommand): string {
  if (command.kind !== 'resolve-salvage' || ![command.operationId, command.pilotId, command.runId, command.contentVersion, command.rulesetVersion].every(id) ||
      !Number.isSafeInteger(command.expectedBuildRevision) || command.expectedBuildRevision < 0 ||
      !Number.isSafeInteger(command.expectedCargoRevision) || command.expectedCargoRevision < 0 ||
      ![command.bufferIds, command.keepIds, command.discardIds, command.removeRetainedIds].every(ids) ||
      command.bufferIds.length > 24 || command.removeRetainedIds.length > INITIAL_CARGO_CAPACITY ||
      command.confirmed !== true || !Number.isFinite(Date.parse(command.recordedAt))) {
    throw new ResultRejection('INVALID_SALVAGE', 'Salvage Apply requires exact distinct identities, revisions and explicit confirmation.');
  }
  return JSON.stringify([command.kind, command.pilotId, command.runId, command.contentVersion, command.rulesetVersion,
    command.expectedBuildRevision, command.expectedCargoRevision, key(command.bufferIds), key(command.keepIds), key(command.discardIds),
    key(command.removeRetainedIds), command.confirmed, command.recordedAt]);
}

/** Pure candidate. No original starter, reward receipt, content pin or retained identity is rewritten. */
export function applyCargoResolution(run: ActiveRun, content: BuildContent, command: CargoResolutionCommand): ActiveRun {
  cargoResolutionFingerprint(command); assertBuildState(run, content); assertAttemptState(run); assertCargoState(run);
  if (run.phase !== 'build') throw new ResultRejection('BUILD_REQUIRED', 'Resolve Salvage in safe Build, not during an Attempt.');
  if (run.runId !== command.runId || run.pilotId !== command.pilotId || run.contentVersion !== command.contentVersion || run.rulesetVersion !== command.rulesetVersion) {
    throw new ResultRejection('TARGET_MISMATCH', 'Salvage choices belong to a different Pilot, Run or content version.');
  }
  const buffer = run.salvageBuffer ?? [], retained = retainedTiles(run);
  if (command.expectedCargoRevision !== (run.cargo?.revision ?? 0) || command.expectedBuildRevision !== (run.shipBuild?.revision ?? 0) ||
      key(command.bufferIds) !== key(buffer.map(tile => tile.id))) {
    throw new ResultRejection('STALE_SALVAGE', 'Cargo, Build or Salvage changed. Reopen the saved state and review choices again.');
  }
  if (!run.attempt?.startup.combat || !run.attempt.combatProgress) throw new ResultRejection('COMMITTED_PAYLOAD_REQUIRED', 'Salvage Apply requires an actual committed combat payload source.');
  if (!buffer.length) throw new ResultRejection('EMPTY_SALVAGE', 'There are no unresolved Salvage items.');
  const decisions = [...command.keepIds, ...command.discardIds];
  if (new Set(decisions).size !== decisions.length || key(decisions) !== key(command.bufferIds)) {
    throw new ResultRejection('UNRESOLVED_SALVAGE', 'Choose Keep or Discard once for every Salvage item.');
  }
  if (command.removeRetainedIds.some(tileId => !retained.some(tile => tile.id === tileId))) {
    throw new ResultRejection('UNKNOWN_RETAINED_TILE', 'Replacement may remove only a currently retained tile.');
  }
  const tiles = [...retained.filter(tile => !command.removeRetainedIds.includes(tile.id)), ...buffer.filter(tile => command.keepIds.includes(tile.id))];
  if (tiles.length > INITIAL_CARGO_CAPACITY) throw new ResultRejection('CARGO_FULL', 'The confirmed batch exceeds Cargo Capacity. Discard or replace explicit tiles first.');
  const next = structuredClone(run);
  next.cargo = { revision: (run.cargo?.revision ?? 0) + 1, tiles: structuredClone(tiles) };
  next.salvageBuffer = [];
  next.shipBuild = { hullId: content.hull.id, revision: (run.shipBuild?.revision ?? 0) + 1,
    placements: (run.shipBuild?.placements ?? []).filter(position => !command.removeRetainedIds.includes(position.tileId)).map(position => ({ ...position })) };
  assertBuildState(next, content); assertAttemptState(next); assertCargoState(next);
  return next;
}
export function previewCargoResolution(run: ActiveRun, content: BuildContent, command: CargoResolutionCommand): CargoPreview {
  const buffer = run.salvageBuffer ?? [], retained = retainedTiles(run);
  const before = projectBuild(run, content);
  const selected = { kept: buffer.filter(tile => command.keepIds.includes(tile.id)), discarded: buffer.filter(tile => command.discardIds.includes(tile.id)),
    removed: retained.filter(tile => command.removeRetainedIds.includes(tile.id)) };
  try { return { valid: true, before, after: projectBuild(applyCargoResolution(run, content, command), content), message: null, ...selected }; }
  catch (error) {
    if (!(error instanceof ResultRejection)) throw error;
    return { valid: false, before, message: error.message, ...selected };
  }
}
