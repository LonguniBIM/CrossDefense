import type { StarterTile } from './salvage';
import { nextRandom, seedValue } from './seeded';

export const SHAPES = {
  I: { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], pivot: [1.5, 1.5], origin: [3, -1] },
  O: { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], pivot: [0.5, 0.5], origin: [4, 0] },
  T: { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], pivot: [1, 1], origin: [3, 0] },
  J: { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], pivot: [1, 1], origin: [3, 0] },
  L: { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], pivot: [1, 1], origin: [3, 0] },
  S: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], pivot: [1, 1], origin: [3, 0] },
  Z: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], pivot: [1, 1], origin: [3, 0] },
} as const;
export type Shape = keyof typeof SHAPES;
export type BoardAction = 'left' | 'right' | 'down' | 'cw' | 'ccw' | 'hold' | 'drop';
export interface BoardInput { action: BoardAction; down: boolean; code: string; pieceId: string; }
export interface BoardCell { id: string; x: number; y: number; payload: StarterTile | null; }
export interface Piece { id: string; shape: Shape; payloadCell: number; payload: StarterTile | null; }
export interface ActivePiece extends Piece { cells: BoardCell[]; pivot: [number, number]; }
interface Supply {
  shapeRng: number;
  cellRng: number;
  bag: Shape[];
  serial: number;
  pool: StarterTile[];
  issued: number;
}
export interface BoardState extends Supply {
  tick: number;
  active: ActivePiece;
  next: Piece[];
  hold: Piece | null;
  holdUsed: boolean;
  grid: BoardCell[];
  topOut: boolean;
  activationTick: number;
  keys: Record<string, { action: BoardAction; order: number }>;
  sequence: number;
  repeatAt: number;
  dropAge: number;
  lockLeft: number;
  resets: number;
  locks: number;
  lines: number;
}
export interface BoardEvents {
  cleared: StarterTile[];
  rows: number[];
  locked: BoardCell[];
  dropped: boolean;
  held: boolean;
}
export interface BoardStep { board: BoardState; events: BoardEvents; }
const REGULAR_KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [0, -2]] as const;
const LONG_KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]] as const;

function drawPiece(supply: Supply): Piece {
  if (!supply.bag.length) {
    supply.bag = Object.keys(SHAPES) as Shape[];
    for (let index = supply.bag.length - 1; index > 0; index -= 1) {
      const sample = nextRandom(supply.shapeRng);
      supply.shapeRng = sample.state;
      const other = Math.floor(sample.value * (index + 1));
      [supply.bag[index], supply.bag[other]] = [supply.bag[other]!, supply.bag[index]!];
    }
  }
  const cell = nextRandom(supply.cellRng);
  supply.cellRng = cell.state;
  // Q4: exhausting reservations produces a normal piece with no reward.
  const payload = supply.pool[supply.issued] ?? null;
  if (payload) supply.issued += 1;
  return {
    id: `piece-${supply.serial++}`, shape: supply.bag.shift()!, payloadCell: Math.floor(cell.value * 4),
    payload: payload ? { ...payload } : null,
  };
}

export function canonicalPiece(piece: Piece): ActivePiece {
  const definition = SHAPES[piece.shape];
  return {
    ...structuredClone(piece),
    pivot: [definition.pivot[0] + definition.origin[0], definition.pivot[1] + definition.origin[1]],
    cells: definition.cells.map(([x, y], index) => ({
      id: `${piece.id}:${index}`, x: x + definition.origin[0], y: y + definition.origin[1],
      payload: index === piece.payloadCell && piece.payload ? { ...piece.payload } : null,
    })),
  };
}

export function createBoard(seed: string, remainingEntries: readonly StarterTile[]): BoardState {
  if (new Set(remainingEntries.map(tile => tile.id)).size !== remainingEntries.length) throw new Error('Duplicate Pre-Run payload identity.');
  const supply: Supply = {
    shapeRng: seedValue(seed + ':shape'), cellRng: seedValue(seed + ':payload-cell'),
    bag: [], serial: 0, pool: structuredClone([...remainingEntries]), issued: 0,
  };
  const initial = Array.from({ length: 4 }, () => drawPiece(supply));
  return {
    ...supply, tick: 0, active: canonicalPiece(initial[0]!), next: initial.slice(1),
    hold: null, holdUsed: false, grid: [], topOut: false, activationTick: 0,
    keys: {}, sequence: 0, repeatAt: 9, dropAge: 0, lockLeft: 30, resets: 0, locks: 0, lines: 0,
  };
}

function valid(board: BoardState, cells: readonly BoardCell[]): boolean {
  return cells.every(cell => cell.x >= 0 && cell.x < 10 && cell.y >= -4 && cell.y < 20 &&
    !board.grid.some(locked => locked.x === cell.x && locked.y === cell.y));
}
export function isGrounded(board: BoardState): boolean {
  return !valid(board, board.active.cells.map(cell => ({ ...cell, y: cell.y + 1 })));
}
export function ghostCells(board: BoardState): BoardCell[] {
  if (board.topOut) return [];
  let cells = structuredClone(board.active.cells);
  while (valid(board, cells.map(cell => ({ ...cell, y: cell.y + 1 })))) {
    cells = cells.map(cell => ({ ...cell, y: cell.y + 1 }));
  }
  return cells;
}
export function clearBoardInput(board: BoardState): BoardState {
  return { ...board, keys: {}, repeatAt: board.tick + 9 };
}

function translate(board: BoardState, dx: number, dy: number): boolean {
  const cells = board.active.cells.map(cell => ({ ...cell, x: cell.x + dx, y: cell.y + dy }));
  if (!valid(board, cells)) return false;
  board.active.cells = cells;
  board.active.pivot = [board.active.pivot[0] + dx, board.active.pivot[1] + dy];
  return true;
}
function resetGroundedLock(board: BoardState, wasGrounded: boolean): void {
  if (wasGrounded && board.resets < 15) { board.resets += 1; board.lockLeft = 30; }
}
function move(board: BoardState, dx: number): void {
  const grounded = isGrounded(board);
  if (translate(board, dx, 0)) resetGroundedLock(board, grounded);
}
function rotate(board: BoardState, direction: 1 | -1): void {
  const [px, py] = board.active.pivot;
  const grounded = isGrounded(board);
  const rotated = board.active.cells.map(cell => ({ ...cell,
    x: px - direction * (cell.y - py), y: py + direction * (cell.x - px),
  }));
  const kicks = board.active.shape === 'O' ? [[0, 0] as const] : board.active.shape === 'I' ? LONG_KICKS : REGULAR_KICKS;
  for (const [dx, dy] of kicks) {
    const cells = rotated.map(cell => ({ ...cell, x: cell.x + dx, y: cell.y + dy }));
    if (!valid(board, cells)) continue;
    board.active.cells = cells;
    board.active.pivot = [px + dx, py + dy];
    resetGroundedLock(board, grounded);
    return;
  }
}
function activate(board: BoardState, piece: Piece): void {
  board.active = canonicalPiece(piece);
  board.activationTick = board.tick;
  board.dropAge = 0;
  board.lockLeft = 30;
  board.resets = 0;
  board.repeatAt = board.tick + 9;
  if (!valid(board, board.active.cells)) board.topOut = true;
}
function takeNext(board: BoardState): void {
  const piece = board.next.shift()!;
  board.next.push(drawPiece(board));
  activate(board, piece);
}
function lock(board: BoardState, events: BoardEvents): void {
  events.locked = structuredClone(board.active.cells);
  board.grid.push(...events.locked);
  board.locks += 1;
  const rows = Array.from({ length: 20 }, (_, y) => y).filter(y => board.grid.filter(cell => cell.y === y).length === 10);
  events.rows = rows;
  const cleared = board.grid.filter(cell => rows.includes(cell.y));
  events.cleared = cleared.flatMap(cell => cell.payload ? [{ ...cell.payload }] : []);
  if (rows.length) {
    board.lines += rows.length;
    board.grid = board.grid.filter(cell => !rows.includes(cell.y)).map(cell => ({
      ...cell, y: cell.y + rows.filter(row => row > cell.y).length,
    }));
  }
  if (board.grid.some(cell => cell.y < 0)) { board.topOut = true; return; }
  board.holdUsed = false;
  takeNext(board);
}
function hold(board: BoardState, events: BoardEvents): void {
  if (board.holdUsed) return;
  const previous = board.hold;
  const active = board.active;
  board.hold = { id: active.id, shape: active.shape, payloadCell: active.payloadCell, payload: active.payload };
  if (previous) activate(board, previous); else takeNext(board);
  board.holdUsed = true;
  events.held = true;
}
function winner(board: BoardState): 'left' | 'right' | undefined {
  const key = Object.values(board.keys).filter(key => key.action === 'left' || key.action === 'right').sort((a, b) => b.order - a.order)[0];
  return key?.action as 'left' | 'right' | undefined;
}

/** One deterministic 1/60-second tick. Never mutates the caller's snapshot. */
export function stepBoard(snapshot: BoardState, commands: readonly BoardInput[] = []): BoardStep {
  const board = structuredClone(snapshot);
  const events: BoardEvents = { cleared: [], rows: [], locked: [], dropped: false, held: false };
  if (board.topOut) return { board, events };
  board.tick += 1;
  const pieceId = board.active.id;
  const startedGrounded = isGrounded(board);
  const previousResets = board.resets;
  for (const command of commands) {
    const previousWinner = winner(board);
    if (!command.down) {
      delete board.keys[command.code];
      if (previousWinner !== winner(board)) board.repeatAt = board.tick + 9;
      continue;
    }
    if (Object.hasOwn(board.keys, command.code)) continue;
    board.keys[command.code] = { action: command.action, order: ++board.sequence };
    if (board.topOut || command.pieceId !== board.active.id) continue;
    if (command.action === 'left' || command.action === 'right') {
      move(board, command.action === 'left' ? -1 : 1);
      board.repeatAt = board.tick + 9;
    } else if (command.action === 'cw') rotate(board, 1);
    else if (command.action === 'ccw') rotate(board, -1);
    else if (command.action === 'hold') hold(board, events);
    else if (command.action === 'drop') {
      const landing = ghostCells(board);
      translate(board, 0, landing[0]!.y - board.active.cells[0]!.y);
      events.dropped = true;
      lock(board, events);
    }
  }
  if (board.topOut || board.active.id !== pieceId) return { board, events };
  const direction = winner(board);
  if (direction && board.tick >= board.repeatAt) {
    move(board, direction === 'left' ? -1 : 1);
    board.repeatAt = board.tick + 3;
  }
  const groundedBeforeDescent = isGrounded(board);
  board.dropAge += 1;
  const softDrop = Object.values(board.keys).some(key => key.action === 'down');
  if (board.dropAge >= (softDrop ? 3 : 48)) { translate(board, 0, 1); board.dropAge = 0; }
  if (isGrounded(board)) {
    if (startedGrounded && groundedBeforeDescent && board.resets === previousResets) board.lockLeft -= 1;
    if (board.lockLeft <= 0) lock(board, events);
  }
  return { board, events };
}
