import { expect, type Page } from '@playwright/test';
import { choosePlacement } from './preRunPlayer';
import { createBoard, type BoardState } from '../src/domain/preRun/board';

/** Control only the browser frame boundary, then act through real keyboard/DOM. */
export async function installPreRunTestClock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let serial = 0, time = 0;
    const frames = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = callback => { frames.set(++serial, callback); return serial; };
    window.cancelAnimationFrame = id => { frames.delete(id); };
    (window as unknown as { __buildTestFrame: (milliseconds: number) => Promise<void> }).__buildTestFrame = async milliseconds => {
      time += milliseconds;
      const current = [...frames.values()]; frames.clear();
      await Promise.all(current.map(callback => callback(time)));
    };
  });
}
async function frame(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await (window as unknown as { __buildTestFrame: (milliseconds: number) => Promise<void> }).__buildTestFrame(1000 / 60);
  });
}
export async function observedBoard(page: Page): Promise<BoardState> {
  const observed = await page.evaluate(() => {
    const cells = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)].map(node => ({
      id: node.dataset.cellId!, x: Number(node.dataset.x), y: Number(node.dataset.y),
      payload: node.dataset.payloadId ? { id: node.dataset.payloadId, letter: node.dataset.letter!, subtype: node.dataset.subtype! } : null,
    }));
    const active = document.querySelector<HTMLElement>('[data-testid="active-piece"]')!;
    return { id: active.dataset.pieceId!, shape: active.dataset.shape!, pivot: [Number(active.dataset.pivotX), Number(active.dataset.pivotY)], cells: cells('[data-testid="active-piece"] .pr-cell'), grid: cells('[data-testid="locked-cells"] .pr-cell') };
  });
  const cells = observed.cells as BoardState['active']['cells'];
  return { ...createBoard('read-only-test-player', []), grid: observed.grid as BoardState['grid'], active: {
    id: observed.id, shape: observed.shape as BoardState['active']['shape'], pivot: observed.pivot as [number, number], cells,
    payloadCell: cells.findIndex(cell => cell.payload !== null), payload: cells.find(cell => cell.payload)?.payload ?? null,
  } };
}

export async function collectStarterThroughKeyboard(page: Page): Promise<void> {
  const controls = { cw: 'x', ccw: 'z', left: 'ArrowLeft', right: 'ArrowRight', drop: 'Space', down: 'ArrowDown', hold: 'c' } as const;
  await frame(page);
  for (let piece = 0; piece < 200; piece += 1) {
    if (await page.getByTestId('salvage-quota').innerText() === '0 / 8') break;
    if (await page.getByTestId('reset-salvage').isVisible()) {
      await page.getByTestId('reset-salvage').click(); await page.getByTestId('pre-run-board').focus(); await frame(page);
    }
    for (const action of choosePlacement(await observedBoard(page))) await page.keyboard.press(controls[action]);
    await frame(page); await frame(page);
  }
  await expect(page.getByTestId('salvage-quota')).toHaveText('0 / 8');
  await expect(page.getByTestId('collected-total')).toHaveText('8');
}
