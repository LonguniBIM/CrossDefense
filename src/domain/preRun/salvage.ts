import { validateStarterViability, type PreRunContent, type ViabilityTile } from '../content/contentPack';
import type { ActiveRun } from '../run/run';
import { shuffled } from './seeded';

export interface StarterTile extends ViabilityTile { id: string; }
export interface SalvageState {
  seed: string;
  order: StarterTile[];
  collectedIds: string[];
  revision: number;
  completed: boolean;
}

export function createSalvageState(run: ActiveRun, content: PreRunContent): SalvageState {
  if (content.collectionQuota !== run.quota.total || content.viabilityTiles.length !== run.quota.total) {
    throw new Error('The finite Pre-Run pool must contain exactly the pinned quota of entries.');
  }
  if (validateStarterViability(content).length) throw new Error('Pre-Run content cannot satisfy its starter.');
  const seed = JSON.stringify([run.runId, run.rulesetVersion, run.contentVersion, 'pre-run-v1']);
  const entries = content.viabilityTiles.map((tile, index) => ({
    ...tile, id: `${run.runId}:starter:${index}`,
  }));
  return { seed, order: shuffled(entries, seed + ':payload-order'), collectedIds: [], revision: 0, completed: false };
}

export function sameSalvagePool(left: Pick<SalvageState, 'seed' | 'order'>, right: Pick<SalvageState, 'seed' | 'order'>): boolean {
  return left.seed === right.seed && left.order.length === right.order.length && left.order.every((tile, index) => {
    const other = right.order[index];
    return other?.id === tile.id && other.letter === tile.letter && other.subtype === tile.subtype;
  });
}

interface SalvageOperationBase {
  operationId: string;
  pilotId: string;
  runId: string;
  expectedRevision: number;
}
export type SalvageOperation = SalvageOperationBase & (
  | { kind: 'initialize'; initial: SalvageState }
  | { kind: 'collect'; tileIds: string[] }
  | { kind: 'finish' }
);

export class SalvageRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export function collectedTiles(run: ActiveRun): StarterTile[] {
  const state = run.salvage;
  return state ? state.order.filter(tile => state.collectedIds.includes(tile.id)).map(tile => ({ ...tile })) : [];
}

export function canFinishSalvage(run: ActiveRun): boolean {
  if (!run.salvage) return false;
  return validateStarterViability({
    collectionQuota: run.quota.total,
    starterObjective: run.starterObjective,
    viabilityTiles: collectedTiles(run),
  }).length === 0;
}

/** Canonical save invariants, shared by memory and durable adapters. */
export function assertSalvageState(run: ActiveRun): void {
  const state = run.salvage;
  if (!state) {
    if (run.phase !== 'pre-run-salvage' || run.quota.remaining !== run.quota.total) {
      throw new Error('Uninitialized Pre-Run has inconsistent committed progress.');
    }
    return;
  }
  const ids = new Set(state.order.map(tile => tile.id));
  const committed = new Set(state.collectedIds);
  if (state.order.length !== run.quota.total || ids.size !== state.order.length ||
      committed.size !== state.collectedIds.length || state.collectedIds.some(id => !ids.has(id)) ||
      run.quota.remaining !== run.quota.total - committed.size ||
      !Number.isSafeInteger(state.revision) || state.revision < 0 || !state.seed ||
      state.completed !== (run.phase !== 'pre-run-salvage')) {
    throw new Error('Pre-Run identity, quota, revision or phase invariant failed.');
  }
  if (state.completed && !canFinishSalvage(run)) throw new Error('Completed Pre-Run lacks its committed starter.');
}

/** Receipts bind the complete command, including target, revision and exact entries. */
export function salvageOperationFingerprint(operation: SalvageOperation): string {
  const data = operation.kind === 'initialize' ? [operation.initial.seed, operation.initial.order.map(tile => [tile.id, tile.letter, tile.subtype]), operation.initial.collectedIds, operation.initial.revision, operation.initial.completed] :
    operation.kind === 'collect' ? [...operation.tileIds].sort() : null;
  return JSON.stringify([operation.kind, operation.pilotId, operation.runId, operation.expectedRevision, data]);
}

/** Pure aggregate transition. The adapter commits this result and its receipt together. */
export function applySalvageOperation(current: ActiveRun, operation: SalvageOperation): ActiveRun {
  if (!operation.operationId?.trim() || current.runId !== operation.runId || current.pilotId !== operation.pilotId) {
    throw new SalvageRejection('TARGET_MISMATCH', 'Pre-Run operation does not match its Pilot and Run.');
  }
  assertSalvageState(current);
  const run = structuredClone(current);
  if (operation.kind === 'initialize') {
    if (operation.expectedRevision !== 0 || operation.initial.revision !== 0 ||
        operation.initial.collectedIds.length || operation.initial.completed) {
      throw new SalvageRejection('INVALID_INITIALIZATION', 'Pre-Run initialization cannot grant progress.');
    }
    if (run.salvage) {
      if (!sameSalvagePool(run.salvage, operation.initial)) {
        throw new SalvageRejection('POOL_MISMATCH', 'Pre-Run cannot replace its pinned pool or order.');
      }
      return run;
    }
    run.salvage = structuredClone(operation.initial);
    assertSalvageState(run);
    return run;
  }
  const state = run.salvage;
  if (!state || state.revision !== operation.expectedRevision) {
    throw new SalvageRejection('STALE_REVISION', 'Pre-Run state changed; reload committed progress before continuing.');
  }
  if (state.completed) throw new SalvageRejection('ALREADY_FINISHED', 'Pre-Run collection has already finished.');
  if (operation.kind === 'collect') {
    const ids = operation.tileIds;
    if (!ids.length || new Set(ids).size !== ids.length || ids.length > run.quota.remaining) {
      throw new SalvageRejection('INVALID_COLLECTION', 'Collection must contain distinct entries within the remaining quota.');
    }
    if (ids.some(id => state.collectedIds.includes(id))) {
      throw new SalvageRejection('ALREADY_COLLECTED', 'A committed entry cannot be collected again.');
    }
    if (ids.some(id => !state.order.some(tile => tile.id === id))) {
      throw new SalvageRejection('UNKNOWN_ENTRY', 'Collection references an entry outside the pinned pool.');
    }
    const collected = new Set([...state.collectedIds, ...ids]);
    state.collectedIds = state.order.filter(tile => collected.has(tile.id)).map(tile => tile.id);
    run.quota.remaining = run.quota.total - state.collectedIds.length;
  } else {
    if (!canFinishSalvage(run)) throw new SalvageRejection('STARTER_REQUIRED', 'Collect the required starter word with a Weapon Tile before finishing.');
    state.completed = true;
    run.phase = 'build';
  }
  state.revision += 1;
  assertSalvageState(run);
  return run;
}
