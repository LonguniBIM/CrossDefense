import { assertCargoState, retainedTiles } from '../run/cargo';
import { MODULE_SUBTYPES, type BuildContent, type HullCell, type ModuleSubtype } from '../content/contentPack';
import { assertSalvageState, type StarterTile } from '../preRun/salvage';
import type { ActiveRun } from '../run/run';
import { requireBuildRules, wordMultiplier, crossingMultiplier, tilePower } from './rules';

export interface TilePlacement extends HullCell { tileId: string; }
export interface ShipBuildState { hullId: string; revision: number; placements: TilePlacement[]; }
export interface PlacementOperation extends TilePlacement {
  operationId: string; kind: 'place'; pilotId: string; runId: string;
  contentVersion: string; rulesetVersion: string; expectedRevision: number;
}
export interface EquippedTile extends StarterTile, HullCell { multiplier: number; }
export interface BuildWord {
  spelling: string; axis: 'horizontal' | 'vertical'; tileIds: string[];
  supported: boolean; multiplier: number; cefr: 'Unknown';
}
export interface BuildSummary {
  retainedCount: number; unplaced: StarterTile[]; equipped: EquippedTile[]; words: BuildWord[];
  power: { available: number; required: number; surplus: number };
  subtypes: Array<{ subtype: ModuleSubtype; count: number; letters: Array<{ letter: string; count: number }> }>;
}
export class PlacementRejection extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}
export interface PlacementPreview { valid: boolean; before: BuildSummary; after?: BuildSummary; code?: string; message?: string; }
const key = (cell: HullCell) => cell.x + ':' + cell.y;

/** Shape/ownership invariants run on every persistence read; hull checks add pinned content when available. */
export function assertBuildState(run: ActiveRun, content?: BuildContent): void {
  assertSalvageState(run);
  assertCargoState(run);
  const state = run.shipBuild;
  if (!state) return;
  if (!['build', 'attempt'].includes(run.phase) || !state.hullId || !Number.isSafeInteger(state.revision) || state.revision < 0) {
    throw new Error('Saved Build phase, hull or revision is invalid.');
  }
  const retained = new Set(retainedTiles(run).map(tile => tile.id));
  const ids = new Set<string>(), cells = new Set<string>();
  for (const placement of state.placements) {
    if (!retained.has(placement.tileId) || ids.has(placement.tileId) || cells.has(key(placement)) ||
        !Number.isSafeInteger(placement.x) || !Number.isSafeInteger(placement.y) ||
        placement.x < 0 || placement.y < 0 || placement.x > 4 || placement.y > 4) {
      throw new Error('Saved Build contains invalid, duplicate or unowned tile positions.');
    }
    ids.add(placement.tileId); cells.add(key(placement));
  }
  if (content && (state.hullId !== content.hull.id || state.placements.some(position => !content.hull.cells.some(cell => key(cell) === key(position))))) {
    throw new Error('Saved Build does not fit its pinned hull.');
  }
}

export function placementFingerprint(operation: PlacementOperation): string {
  return JSON.stringify([operation.kind, operation.pilotId, operation.runId, operation.contentVersion, operation.rulesetVersion,
    operation.expectedRevision, operation.tileId, operation.x, operation.y]);
}

/** Shared transition for memory and durable adapters: no rendering or storage dependencies. */
export function applyPlacement(current: ActiveRun, content: BuildContent, operation: PlacementOperation): ActiveRun {
  assertBuildState(current, content);
  requireBuildRules(current.rulesetVersion);
  if (current.phase !== 'build') throw new PlacementRejection('BUILD_REQUIRED', 'Finish Pre-Run before placing tiles.');
  if (operation.kind !== 'place' || !operation.operationId?.trim() || operation.runId !== current.runId || operation.pilotId !== current.pilotId ||
      operation.contentVersion !== current.contentVersion || operation.rulesetVersion !== current.rulesetVersion) {
    throw new PlacementRejection('TARGET_MISMATCH', 'Placement must target the same Pilot, Run and pinned versions.');
  }
  if (!Number.isSafeInteger(operation.expectedRevision) || operation.expectedRevision !== (current.shipBuild?.revision ?? 0)) {
    throw new PlacementRejection('STALE_REVISION', 'The saved Build changed. Reload it before placing again.');
  }
  if (!retainedTiles(current).some(tile => tile.id === operation.tileId)) {
    throw new PlacementRejection('TILE_NOT_RETAINED', 'Only a retained Letter Tile can be placed.');
  }
  if (!Number.isSafeInteger(operation.x) || !Number.isSafeInteger(operation.y) || !content.hull.cells.some(cell => key(cell) === key(operation))) {
    throw new PlacementRejection('OUTSIDE_HULL', 'This cell is outside the selected hull.');
  }
  const placements = current.shipBuild?.placements ?? [];
  const occupant = placements.find(position => key(position) === key(operation));
  if (occupant && occupant.tileId !== operation.tileId) throw new PlacementRejection('OCCUPIED', 'This cell is occupied. Both tiles are unchanged.');
  if (occupant?.tileId === operation.tileId) return structuredClone(current);
  const next = structuredClone(current);
  next.shipBuild = {
    hullId: content.hull.id, revision: operation.expectedRevision + 1,
    placements: [...placements.filter(position => position.tileId !== operation.tileId), { tileId: operation.tileId, x: operation.x, y: operation.y }]
      .sort((left, right) => left.y - right.y || left.x - right.x),
  };
  assertBuildState(next, content);
  return next;
}

/** Shared read-only word recognition for saved Builds and rendered fleets. */
export function equippedWords(equipped: readonly EquippedTile[], supportedSpellings: BuildContent['supportedSpellings']): BuildWord[] {
  const grid = new Map(equipped.map(tile => [key(tile), tile]));
  const supported = new Set(supportedSpellings.map(word => word.spelling));
  const words: BuildWord[] = [];
  for (const axis of ['horizontal', 'vertical'] as const) {
    const dx = axis === 'horizontal' ? 1 : 0, dy = axis === 'vertical' ? 1 : 0;
    for (const tile of equipped) {
      if (grid.has(key({ x: tile.x - dx, y: tile.y - dy }))) continue;
      const sequence: EquippedTile[] = [];
      let x = tile.x, y = tile.y;
      while (grid.has(key({ x, y }))) { sequence.push(grid.get(key({ x, y }))!); x += dx; y += dy; }
      if (sequence.length < 3) continue;
      const spelling = sequence.map(entry => entry.letter).join('');
      const accepted = supported.has(spelling);
      words.push({ spelling, axis, tileIds: sequence.map(entry => entry.id), supported: accepted, multiplier: accepted ? wordMultiplier(sequence.length) : 100, cefr: 'Unknown' });
    }
  }
  return words;
}

export function projectBuild(run: ActiveRun, content: BuildContent): BuildSummary {
  assertBuildState(run, content);
  requireBuildRules(run.rulesetVersion);
  const retained = retainedTiles(run), byId = new Map(retained.map(tile => [tile.id, tile]));
  const equipped: EquippedTile[] = (run.shipBuild?.placements ?? []).map(position => ({ ...byId.get(position.tileId)!, x: position.x, y: position.y, multiplier: 100 }));
  const words = equippedWords(equipped, content.supportedSpellings);
  let available = 0, required = 0;
  for (const tile of equipped) {
    const memberships = words.filter(word => word.supported && word.tileIds.includes(tile.id));
    tile.multiplier = memberships.length === 2 ? crossingMultiplier(memberships[0]!.multiplier, memberships[1]!.multiplier) : memberships[0]?.multiplier ?? 100;
    const power = tilePower(tile.subtype, tile.multiplier);
    available += power.available; required += power.required;
  }
  const equippedIds = new Set(equipped.map(tile => tile.id));
  return {
    retainedCount: retained.length, unplaced: retained.filter(tile => !equippedIds.has(tile.id)), equipped, words,
    power: { available, required, surplus: available - required },
    subtypes: MODULE_SUBTYPES.map(subtype => {
      const members = equipped.filter(tile => tile.subtype === subtype), letters = new Map<string, number>();
      for (const tile of members) letters.set(tile.letter, (letters.get(tile.letter) ?? 0) + 1);
      return { subtype, count: members.length, letters: [...letters].sort(([left], [right]) => left < right ? -1 : 1).map(([letter, count]) => ({ letter, count })) };
    }),
  };
}

export function previewPlacement(run: ActiveRun, content: BuildContent, operation: PlacementOperation): PlacementPreview {
  const before = projectBuild(run, content);
  try { return { valid: true, before, after: projectBuild(applyPlacement(run, content, operation), content) }; }
  catch (error) {
    if (!(error instanceof PlacementRejection)) throw error;
    return { valid: false, before, code: error.code, message: error.message };
  }
}
