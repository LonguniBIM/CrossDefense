import type { ActiveRun } from '../run/run';
import type { BuildContent } from '../content/contentPack';
import { requireBuildRules } from './rules';
import { applyPlacement, assertBuildState, placementFingerprint, PlacementRejection, projectBuild, type PlacementOperation, type PlacementPreview, type TilePlacement } from './shipBuild';

type EditTarget = Omit<PlacementOperation, 'kind' | 'tileId' | 'x' | 'y'>;
export type ReturnOperation = EditTarget & { kind: 'return'; tileId: string };
export type HistoryOperation = EditTarget & { kind: 'undo' | 'redo'; scope: string; from: TilePlacement[]; to: TilePlacement[] };
export type BuildEditOperation = ReturnOperation | HistoryOperation;
export type BuildOperation = PlacementOperation | BuildEditOperation;
export interface LayoutHistoryEntry { scope: string; before: TilePlacement[]; after: TilePlacement[]; }
export interface HistoryAvailability { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number; }

/** History contains positions only. It can never restore a Run/economy snapshot. */
export function copyLayout(run: ActiveRun): TilePlacement[] {
  return (run.shipBuild?.placements ?? []).map(({ tileId, x, y }) => ({ tileId, x, y })).sort((a, b) => a.y - b.y || a.x - b.x);
}
export function layoutKey(positions: readonly TilePlacement[]): string {
  return JSON.stringify([...positions].sort((a, b) => a.y - b.y || a.x - b.x).map(p => [p.tileId, p.x, p.y]));
}
function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, stableValue(item)]));
  return value;
}
/** Bind history to all current non-layout Run inputs, including future economy fields. */
export function historyScope(run: ActiveRun, content: BuildContent): string {
  return JSON.stringify(stableValue({ ...run, shipBuild: { hullId: run.shipBuild?.hullId ?? content.hull.id } }));
}
function assertPositions(value: readonly TilePlacement[]): void {
  if (!Array.isArray(value) || value.length > 13 || value.some(p => !p || typeof p.tileId !== 'string' || !p.tileId || !Number.isSafeInteger(p.x) || !Number.isSafeInteger(p.y))) {
    throw new PlacementRejection('INVALID_HISTORY_LAYOUT', 'History must contain only finite, bounded tile positions.');
  }
}
export function buildOperationFingerprint(operation: BuildOperation): string {
  if (operation.kind === 'place') return placementFingerprint(operation);
  if (!Number.isSafeInteger(operation.expectedRevision) || operation.expectedRevision < 0) throw new PlacementRejection('INVALID_OPERATION', 'Build edit revision is invalid.');
  const base = [operation.kind, operation.pilotId, operation.runId, operation.contentVersion, operation.rulesetVersion, operation.expectedRevision];
  if (operation.kind === 'return') return JSON.stringify([...base, operation.tileId]);
  if (operation.kind !== 'undo' && operation.kind !== 'redo') throw new PlacementRejection('INVALID_OPERATION', 'Unsupported Build edit kind.');
  assertPositions(operation.from); assertPositions(operation.to);
  return JSON.stringify([...base, operation.scope, layoutKey(operation.from), layoutKey(operation.to)]);
}

/** Validate against the CURRENT aggregate in the commit transaction; increment revision, never roll it back. */
export function applyBuildOperation(current: ActiveRun, content: BuildContent, operation: BuildOperation): ActiveRun {
  if (operation.kind === 'place') return applyPlacement(current, content, operation);
  assertBuildState(current, content);
  requireBuildRules(current.rulesetVersion);
  buildOperationFingerprint(operation);
  if (current.phase !== 'build') throw new PlacementRejection('BUILD_REQUIRED', 'Complete Pre-Run before editing Build.');
  if (!operation.operationId?.trim() || operation.runId !== current.runId || operation.pilotId !== current.pilotId ||
      operation.contentVersion !== current.contentVersion || operation.rulesetVersion !== current.rulesetVersion) {
    throw new PlacementRejection('TARGET_MISMATCH', 'Build edits must target the same Pilot, Run and pinned versions.');
  }
  if (operation.expectedRevision !== (current.shipBuild?.revision ?? 0) || !Number.isSafeInteger(operation.expectedRevision + 1)) {
    throw new PlacementRejection('STALE_REVISION', 'The saved Build changed. Reload it before editing again.');
  }
  let positions: TilePlacement[];
  if (operation.kind === 'return') {
    if (!current.shipBuild?.placements.some(position => position.tileId === operation.tileId)) {
      throw new PlacementRejection('TILE_NOT_PLACED', 'Return requires a retained tile currently on the ship.');
    }
    positions = copyLayout(current).filter(position => position.tileId !== operation.tileId);
  } else {
    if (operation.scope !== historyScope(current, content) || layoutKey(operation.from) !== layoutKey(copyLayout(current))) {
      throw new PlacementRejection('HISTORY_INVALIDATED', 'Build context changed. Reopen Build; its old history cannot be used.');
    }
    // Copy only canonical coordinates and IDs. Extra snapshot/economy properties are never applied.
    positions = operation.to.map(({ tileId, x, y }) => ({ tileId, x, y })).sort((a, b) => a.y - b.y || a.x - b.x);
  }
  const next = structuredClone(current);
  next.shipBuild = { hullId: content.hull.id, revision: operation.expectedRevision + 1, placements: positions };
  try { assertBuildState(next, content); }
  catch { throw new PlacementRejection('INVALID_HISTORY_LAYOUT', 'History cannot restore duplicate, unowned or out-of-hull positions.'); }
  return next;
}

export function previewBuildOperation(run: ActiveRun, content: BuildContent, operation: BuildOperation): PlacementPreview {
  const before = projectBuild(run, content);
  try { return { valid: true, before, after: projectBuild(applyBuildOperation(run, content, operation), content) }; }
  catch (error) {
    if (!(error instanceof PlacementRejection)) throw error;
    return { valid: false, before, code: error.code, message: error.message };
  }
}

/** Transient editing history. Only an acknowledged durable operation may move its stacks. */
export class LayoutHistory {
  private undoEntries: LayoutHistoryEntry[] = [];
  private redoEntries: LayoutHistoryEntry[] = [];
  availability(): HistoryAvailability {
    return { canUndo: this.undoEntries.length > 0, canRedo: this.redoEntries.length > 0, undoCount: this.undoEntries.length, redoCount: this.redoEntries.length };
  }
  clear(): void { this.undoEntries = []; this.redoEntries = []; }
  peek(kind: 'undo' | 'redo'): LayoutHistoryEntry {
    const entry = (kind === 'undo' ? this.undoEntries : this.redoEntries).at(-1);
    if (!entry) throw new PlacementRejection(kind === 'undo' ? 'NOTHING_TO_UNDO' : 'NOTHING_TO_REDO', kind === 'undo' ? 'No layout edit is available to undo.' : 'No layout edit is available to redo.');
    return structuredClone(entry);
  }
  acknowledge(kind: BuildOperation['kind'], entry: LayoutHistoryEntry): void {
    if (kind === 'place' || kind === 'return') {
      if (layoutKey(entry.before) !== layoutKey(entry.after)) { this.undoEntries.push(structuredClone(entry)); this.redoEntries = []; }
      return;
    }
    const source = kind === 'undo' ? this.undoEntries : this.redoEntries;
    const destination = kind === 'undo' ? this.redoEntries : this.undoEntries;
    const current = source.at(-1);
    if (!current || JSON.stringify(current) !== JSON.stringify(entry)) { this.clear(); return; }
    source.pop(); destination.push(structuredClone(entry));
  }
}
