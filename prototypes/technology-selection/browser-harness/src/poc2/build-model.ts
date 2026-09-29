/**
 * CrossDefense Technology Selection PoC-2.
 *
 * This is a throwaway Build Phase model used to test whether a semantic DOM
 * grid plus full deterministic recomputation is fast enough for drag preview.
 * It is not the production word or combat implementation.
 */

export interface TilePlacement {
  id: string;
  letter: string;
  subtype: 'Laser' | 'Armor' | 'Power' | 'Support';
  x: number;
  y: number;
}

export interface BuildEvaluation {
  activeWords: string[];
  powerAvailable: number;
  offense: number;
  defense: number;
}

export interface BuildSnapshot {
  placements: TilePlacement[];
  evaluation: BuildEvaluation;
}

export const GRID_SIZE = 7;

const SUPPORTED_WORDS = new Set(['LASER', 'ARMOR']);

const SUBTYPE_BASE = {
  Laser: { power: 0, offense: 9, defense: 0 },
  Armor: { power: 0, offense: 0, defense: 10 },
  Power: { power: 3, offense: 0, defense: 0 },
  Support: { power: 0, offense: 0, defense: 1 },
} as const;

export function createInitialPlacements(): TilePlacement[] {
  return [
    { id: 'tile-l', letter: 'L', subtype: 'Laser', x: 0, y: 2 },
    { id: 'tile-a', letter: 'A', subtype: 'Power', x: 1, y: 2 },
    { id: 'tile-s', letter: 'S', subtype: 'Laser', x: 2, y: 2 },
    { id: 'tile-e', letter: 'E', subtype: 'Laser', x: 3, y: 2 },
    { id: 'tile-r1', letter: 'R', subtype: 'Laser', x: 4, y: 2 },
    { id: 'tile-r2', letter: 'R', subtype: 'Armor', x: 1, y: 3 },
    { id: 'tile-m', letter: 'M', subtype: 'Armor', x: 1, y: 4 },
    { id: 'tile-o', letter: 'O', subtype: 'Armor', x: 1, y: 5 },
    { id: 'tile-r3', letter: 'R', subtype: 'Armor', x: 1, y: 6 },
  ];
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function collectRuns(
  placements: TilePlacement[],
  horizontal: boolean,
): string[] {
  const occupied = new Map(
    placements.map((placement) => [key(placement.x, placement.y), placement]),
  );
  const words: string[] = [];

  for (let outer = 0; outer < GRID_SIZE; outer += 1) {
    let run = '';

    for (let inner = 0; inner <= GRID_SIZE; inner += 1) {
      const x = horizontal ? inner : outer;
      const y = horizontal ? outer : inner;
      const tile =
        inner < GRID_SIZE ? occupied.get(key(x, y)) : undefined;

      if (tile) {
        run += tile.letter;
        continue;
      }

      if (run.length >= 3 && SUPPORTED_WORDS.has(run)) {
        words.push(run);
      }

      run = '';
    }
  }

  return words;
}

export function evaluateBuild(
  placements: TilePlacement[],
): BuildEvaluation {
  const activeWords = [
    ...collectRuns(placements, true),
    ...collectRuns(placements, false),
  ];

  let powerAvailable = 0;
  let offense = 0;
  let defense = 0;

  for (const placement of placements) {
    const base = SUBTYPE_BASE[placement.subtype];
    powerAvailable += base.power;
    offense += base.offense;
    defense += base.defense;
  }

  const wordMultiplier = 1 + activeWords.length * 0.2;

  return {
    activeWords,
    powerAvailable,
    offense: Number((offense * wordMultiplier).toFixed(2)),
    defense: Number((defense * wordMultiplier).toFixed(2)),
  };
}

export function moveTile(
  placements: TilePlacement[],
  tileId: string,
  x: number,
  y: number,
): TilePlacement[] {
  const destinationOccupied = placements.some(
    (placement) =>
      placement.id !== tileId && placement.x === x && placement.y === y,
  );

  if (destinationOccupied) {
    return placements.map((placement) => ({ ...placement }));
  }

  return placements.map((placement) =>
    placement.id === tileId
      ? { ...placement, x, y }
      : { ...placement },
  );
}

export function snapshot(placements: TilePlacement[]): BuildSnapshot {
  return {
    placements: placements.map((placement) => ({ ...placement })),
    evaluation: evaluateBuild(placements),
  };
}
