import { stepBoard, type BoardAction, type BoardState } from '../src/domain/preRun/board';

/** Test player: chooses legal input sequences from the public board projection.
 * It does not mutate application state, place cells directly, or award rewards.
 */
export function choosePlacement(board: BoardState): BoardAction[] {
  let best: BoardAction[] = ['drop'];
  let bestScore = -Infinity;
  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (let offset = -6; offset <= 6; offset += 1) {
      const actions: BoardAction[] = [
        ...Array.from({ length: rotation }, (): BoardAction => 'cw'),
        ...Array.from({ length: Math.abs(offset) }, (): BoardAction => offset < 0 ? 'left' : 'right'), 'drop',
      ];
      let candidate = board;
      let lines = 0;
      let payloads = 0;
      for (const action of actions) {
        const command = { action, down: true, code: action, pieceId: candidate.active.id };
        const result = stepBoard(candidate, [command]);
        lines += result.events.rows.length;
        payloads += result.events.cleared.length;
        candidate = stepBoard(result.board, [{ ...command, down: false }]).board;
      }
      const heights = Array.from({ length: 10 }, (_, x) => {
        const cells = candidate.grid.filter(cell => cell.x === x);
        return cells.length ? 20 - Math.min(...cells.map(cell => cell.y)) : 0;
      });
      let holes = 0;
      for (let x = 0; x < 10; x += 1) {
        for (let y = 20 - heights[x]!; y < 20; y += 1) {
          if (!candidate.grid.some(cell => cell.x === x && cell.y === y)) holes += 1;
        }
      }
      const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]!), 0);
      const score = (candidate.topOut ? -100000 : 0) + lines * 40 + payloads * 120 - holes * 35 - heights.reduce((sum, value) => sum + value, 0) - bumpiness * 0.7 - Math.max(...heights);
      if (score > bestScore) { bestScore = score; best = actions; }
    }
  }
  return best;
}
