import { expect, it } from 'vitest';
import { createBoard, stepBoard, type BoardInput } from '../../src/domain/preRun/board';
import type { StarterTile } from '../../src/domain/preRun/salvage';

const pool: StarterTile[] = Array.from({ length: 8 }, (_, index) => ({
  id: `tile-${index}`, letter: 'SHIP'[index % 4]!,
  subtype: index % 4 === 0 ? 'Ballistic' : index % 4 === 2 ? 'Power' : 'Armor',
}));

it('Q4 reserves every pool identity once, then supplies reward-free pieces without reissuing entries', () => {
  let board = createBoard('fixed-run-seed', pool);
  const observed: Array<string | null> = [];
  for (let index = 0; index < 12; index += 1) {
    observed.push(board.active.payload?.id ?? null);
    // A legal empty-field scenario isolates supply from stacking/top-out.
    board = { ...board, grid: [] };
    const down: BoardInput = { action: 'drop', down: true, code: 'Space', pieceId: board.active.id };
    board = stepBoard(board, [down]).board;
    board = stepBoard(board, [{ ...down, down: false }]).board;
  }
  expect(observed.slice(0, 8)).toEqual(pool.map(tile => tile.id));
  expect(observed.slice(8)).toEqual([null, null, null, null]);
  expect(board.next).toHaveLength(3);
  expect(pool).toHaveLength(8);
});

import { canonicalPiece, ghostCells, isGrounded, SHAPES, type BoardState, type BoardAction, type Shape } from '../../src/domain/preRun/board';
function scenario(shape: Shape = 'O'): BoardState {
  return { ...createBoard('controls', pool), active: canonicalPiece({ id: 'scenario-piece', shape, payloadCell: 0, payload: pool[0]! }) };
}
function ticks(board: BoardState, count: number): BoardState {
  for (let index = 0; index < count; index += 1) board = stepBoard(board).board;
  return board;
}
function press(board: BoardState, action: BoardAction): BoardState {
  const command = { action, down: true, code: action, pieceId: board.active.id };
  board = stepBoard(board, [command]).board;
  return stepBoard(board, [{ ...command, down: false }]).board;
}
function shift(board: BoardState, dx: number, dy: number): BoardState {
  return { ...board, active: { ...board.active, pivot: [board.active.pivot[0] + dx, board.active.pivot[1] + dy], cells: board.active.cells.map(cell => ({ ...cell, x: cell.x + dx, y: cell.y + dy })) } };
}
function land(board: BoardState): BoardState { return shift(board, 0, ghostCells(board)[0]!.y - board.active.cells[0]!.y); }

it('all seven shapes preserve cell and payload identities through four rotations, including O payload movement', () => {
  for (const shape of Object.keys(SHAPES) as Shape[]) {
    let board = shift(scenario(shape), 0, 4);
    const original = structuredClone(board.active);
    board = press(board, 'cw');
    expect(board.active.cells.find(cell => cell.payload)?.id).toBe(original.cells.find(cell => cell.payload)?.id);
    if (shape === 'O') expect(board.active.cells[0]).not.toEqual(original.cells[0]);
    for (let turn = 0; turn < 3; turn += 1) board = press(board, 'cw');
    expect(board.active).toEqual(original);
  }
});

it('uses 48-tick gravity, 3-tick Soft Drop and exactly one Hard Drop per physical press', () => {
  const board = scenario();
  expect(ticks(board, 47).active.cells[0]!.y).toBe(0);
  expect(ticks(board, 48).active.cells[0]!.y).toBe(1);
  const down = { action: 'down' as const, down: true, code: 'ArrowDown', pieceId: board.active.id };
  let soft = stepBoard(board, [down]).board;
  soft = ticks(soft, 1);
  expect(soft.active.cells[0]!.y).toBe(0);
  soft = ticks(soft, 1);
  expect(soft.active.cells[0]!.y).toBe(1);
  const drop = { action: 'drop' as const, down: true, code: 'Space', pieceId: soft.active.id };
  soft = stepBoard(soft, [drop]).board;
  expect(soft.locks).toBe(1);
  soft = stepBoard(soft, [{ ...drop, pieceId: soft.active.id }]).board;
  expect(soft.locks).toBe(1);
});

it('applies immediate horizontal movement then 9/3-tick repeats and restarts the opposite-held delay', () => {
  let board = scenario();
  const command = (action: 'left' | 'right', down: boolean) => ({ action, down, code: action, pieceId: board.active.id });
  board = stepBoard(board, [command('left', true)]).board;
  expect(board.active.cells[0]!.x).toBe(3);
  board = ticks(board, 8);
  expect(board.active.cells[0]!.x).toBe(3);
  board = ticks(board, 1);
  expect(board.active.cells[0]!.x).toBe(2);
  board = ticks(board, 3);
  expect(board.active.cells[0]!.x).toBe(1);
  board = stepBoard(board, [command('right', true)]).board;
  expect(board.active.cells[0]!.x).toBe(2);
  board = ticks(board, 9);
  expect(board.active.cells[0]!.x).toBe(3);
  board = stepBoard(board, [command('right', false)]).board;
  board = ticks(board, 8);
  expect(board.active.cells[0]!.x).toBe(3);
  expect(ticks(board, 1).active.cells[0]!.x).toBe(2);
});

it('locks after 30 grounded ticks and never replenishes the timer after the 15-reset cap', () => {
  let board = land(scenario());
  expect(ticks(board, 29).locks).toBe(0);
  expect(ticks(board, 30).locks).toBe(1);
  for (let index = 0; index < 15; index += 1) {
    board = stepBoard(board, [{ action: index % 2 ? 'right' : 'left', down: true, code: 'move-' + index, pieceId: board.active.id }]).board;
    expect(board.lockLeft).toBe(30);
  }
  expect(board.resets).toBe(15);
  board = ticks(board, 5);
  board = stepBoard(board, [{ action: 'right', down: true, code: 'last-move', pieceId: board.active.id }]).board;
  expect(board.resets).toBe(15);
  expect(board.lockLeft).toBe(24);
});

it('pauses the remaining lock time after leaving contact and blocked actions do not earn resets', () => {
  let board = shift(scenario(), 0, 8);
  board.grid = [{ id: 'ledge', x: 4, y: 10, payload: null }];
  board.resets = 15;
  board.lockLeft = 12;
  expect(isGrounded(board)).toBe(true);
  board = press(board, 'right');
  expect(isGrounded(board)).toBe(false);
  expect(ticks(board, 10).lockLeft).toBe(12);
  board = press(board, 'left');
  expect(board.lockLeft).toBe(11);
  let blocked = scenario('T');
  blocked.grid = Array.from({ length: 24 }, (_, row) => Array.from({ length: 10 }, (_, x) => ({ id: `${row}:${x}`, x, y: row - 4, payload: null }))).flat().filter(cell => !blocked.active.cells.some(active => active.x === cell.x && active.y === cell.y));
  const before = structuredClone(blocked.active);
  blocked = press(blocked, 'cw');
  expect(blocked.active).toEqual(before);
  expect(blocked.resets).toBe(0);
});

it('Hold preserves identity, has one use per lock, and occupied swap consumes no Next entry', () => {
  let board = scenario('T');
  const original = structuredClone(board.active);
  board = press(board, 'cw');
  board = press(board, 'hold');
  const queue = structuredClone(board.next);
  board = press(board, 'hold');
  expect(board.next).toEqual(queue);
  board = press(board, 'drop');
  const beforeSwap = structuredClone(board.next);
  board = press(board, 'hold');
  expect(board.next).toEqual(beforeSwap);
  expect(board.active).toEqual(original);
});

it('discards discrete commands targeting a prior piece and gives new pieces fresh repeat/descent schedules', () => {
  let board = scenario();
  const commands = (['left', 'down', 'drop', 'hold'] as const).map(action => ({ action, down: true, code: action, pieceId: board.active.id }));
  board = stepBoard(board, commands).board;
  expect(board.locks).toBe(1);
  expect(board.hold).toBeNull();
  const [x, y] = [board.active.cells[0]!.x, board.active.cells[0]!.y];
  expect(ticks(board, 2).active.cells[0]!.y).toBe(y);
  expect(ticks(board, 3).active.cells[0]!.y).toBe(y + 1);
  expect(ticks(board, 8).active.cells[0]!.x).toBe(x);
  expect(ticks(board, 9).active.cells[0]!.x).toBe(x - 1);
});

it('clears visible rows together, emits only their payload cells, and collapses whole rows', () => {
  const board = scenario();
  board.grid = [18, 19].flatMap(y => Array.from({ length: 10 }, (_, x) => ({ id: `${x}:${y}`, x, y, payload: x === 0 ? { ...pool[1]!, id: `reward-${y}` } : null }))).filter(cell => cell.x !== 4 && cell.x !== 5);
  board.grid.push({ id: 'retained', x: 0, y: 17, payload: { ...pool[2]!, id: 'retained-payload' } });
  const result = stepBoard(board, [{ action: 'drop', down: true, code: 'drop', pieceId: board.active.id }]);
  expect(result.events.rows).toEqual([18, 19]);
  expect(result.events.cleared.map(tile => tile.id).sort()).toEqual(['reward-18', 'reward-19', 'tile-0']);
  expect(result.board.grid.find(cell => cell.id === 'retained')).toMatchObject({ y: 19, payload: { id: 'retained-payload' } });
  expect(board.lines).toBe(0);
});

it('checks top-out after collapse so a clear can rescue hidden cells; no further ticks follow top-out', () => {
  let board = scenario('I');
  board.grid = Array.from({ length: 10 }, (_, x) => ({ id: `row-${x}`, x, y: 0, payload: null })).filter(cell => cell.x < 3 || cell.x > 6);
  board.grid.push({ id: 'hidden', x: 9, y: -1, payload: null }, { id: 'stop', x: 6, y: 1, payload: null });
  board = press(board, 'drop');
  expect(board.topOut).toBe(false);
  expect(board.grid.find(cell => cell.id === 'hidden')?.y).toBe(0);
  let failed = scenario();
  failed.grid.push({ id: 'hidden', x: 0, y: -1, payload: null });
  failed = press(failed, 'drop');
  expect(failed.topOut).toBe(true);
  expect(ticks(failed, 100)).toEqual(failed);
});

it('keeps seven-shape groups and isolates shape RNG from payload-cell RNG', () => {
  let board = createBoard('bag', pool);
  const sequence = [board.active.shape, ...board.next.map(piece => piece.shape)];
  for (let index = 0; index < 17; index += 1) {
    board = press({ ...board, grid: [] }, 'drop');
    sequence.push(board.next.at(-1)!.shape);
  }
  for (let index = 0; index < 21; index += 7) expect(new Set(sequence.slice(index, index + 7)).size).toBe(7);
  let a = createBoard('bag', pool), b = { ...createBoard('bag', pool), cellRng: 123 };
  for (let index = 0; index < 15; index += 1) {
    expect(a.active.shape).toBe(b.active.shape);
    a = press({ ...a, grid: [] }, 'drop'); b = press({ ...b, grid: [] }, 'drop');
  }
});
