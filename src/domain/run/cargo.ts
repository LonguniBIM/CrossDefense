import { combatPayloadEntries } from '../combat/payload';
import type { ActiveRun } from './run';
import { collectedTiles, type StarterTile } from '../preRun/salvage';
import { MODULE_SUBTYPES } from '../content/contentPack';
import { INITIAL_CARGO_CAPACITY } from '../build/rules';

export interface RetainedCargo { revision: number; tiles: StarterTile[]; }

/** Legacy ownership derives from committed starter history until an explicit Salvage Apply. */
export function retainedTiles(run: ActiveRun): StarterTile[] {
  return run.cargo ? run.cargo.tiles.map(tile => ({ ...tile })) : collectedTiles(run);
}

export function assertCargoState(run: ActiveRun): void {
  const retained = retainedTiles(run), buffer = run.salvageBuffer ?? [];
  const valid = (tile: StarterTile) => tile && typeof tile.id === 'string' && tile.id.trim().length > 0 &&
    /^[A-Z]$/.test(tile.letter) && MODULE_SUBTYPES.includes(tile.subtype);
  if (run.cargo && (run.phase === 'pre-run-salvage' || !Number.isSafeInteger(run.cargo.revision) || run.cargo.revision < 1)) {
    throw new Error('Explicit retained Cargo requires a completed Pre-Run and a positive revision.');
  }
  if (retained.length > INITIAL_CARGO_CAPACITY || buffer.length > 24 ||
      retained.some(tile => !valid(tile)) || buffer.some(tile => !valid(tile)) ||
      new Set([...retained, ...buffer].map(tile => tile.id)).size !== retained.length + buffer.length) {
    throw new Error('Cargo and unresolved Salvage must have distinct valid identities within their capacity.');
  }
  // A completed Attempt may clear its whole buffer, but a nonempty one still contains only committed payloads.
  if (buffer.length && run.attempt?.startup.capability === 'combat') {
    const attempt = run.attempt, definition = attempt.startup.combat, progress = attempt.combatProgress;
    if (!definition || !progress) throw new Error('Unresolved buffer is missing its committed payload definition.');
    const expected = combatPayloadEntries(attempt.attemptId, definition).filter(tile => progress.collectedIds.includes(tile.id));
    const identities = (tiles: readonly StarterTile[]) => JSON.stringify(tiles.map(tile => [tile.id, tile.letter, tile.subtype]).sort((a, b) => a[0]! < b[0]! ? -1 : a[0]! > b[0]! ? 1 : 0));
    if (identities(expected) !== identities(buffer)) throw new Error('Unresolved buffer differs from actual committed payload identities or values.');
  }
  if (run.economyRevision !== undefined && (!Number.isSafeInteger(run.economyRevision) || run.economyRevision < 0)) {
    throw new Error('Run economy boundary revision is invalid.');
  }
  if (run.clearedMapIds !== undefined && (!Array.isArray(run.clearedMapIds) ||
      run.clearedMapIds.some(id => typeof id !== 'string' || !id.trim()) ||
      new Set(run.clearedMapIds).size !== run.clearedMapIds.length)) {
    throw new Error('Run Map completions must have distinct explicit identities.');
  }
}
