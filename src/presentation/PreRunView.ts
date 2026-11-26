import './preRun.css';
import { MODULE_SUBTYPES } from '../domain/content/contentPack';
import { canonicalPiece, ghostCells, type BoardCell, type BoardInput, type Piece } from '../domain/preRun/board';
import type { SettingsAccess } from './SettingsView';
import { controlsText, GameplayKeyboard } from './GameplayInput';
import type { PreRunApplication, PreRunProjection } from '../application/preRun/PreRunApplication';

const ABBREVIATIONS: Readonly<Record<string, string>> = {
  Ballistic: 'BAL', Missile: 'MIS', Laser: 'LAS', Armor: 'ARM', Shield: 'SHD',
  System: 'SYS', Engine: 'ENG', Power: 'PWR', Support: 'SUP',
};
const STEP = 1000 / 60;

/** DOM-only adapter. No save mutation, payload selection, or game rules live here. */
export function mountPreRun(
  root: HTMLElement,
  application: PreRunApplication,
  onExit: () => Promise<void>,
  onComplete: () => Promise<void>,
  settings?: SettingsAccess,
): () => void {
  root.innerHTML = `<main class="pr-shell"><section class="pr-panel">
    <header class="pr-header"><h1>Pre-Run Salvage</h1><span>Enemy-free collection</span></header>
    <div class="pr-layout"><section class="pr-summary">
      <h2 data-testid="salvage-objective"></h2>
      <p>Clear a payload cell to collect its Letter Tile. Uncollected entries keep their identities after a board reset.</p>
      <dl class="pr-facts"><dt>Run</dt><dd data-testid="salvage-run-id"></dd><dt>Content</dt><dd data-testid="salvage-content"></dd><dt>Ruleset</dt><dd data-testid="salvage-ruleset"></dd></dl>
      <p>Remaining collection quota</p><div class="pr-quota" data-testid="salvage-quota"></div>
      <p class="pr-status" data-testid="salvage-status" role="status"></p>
      <p class="pr-notice" data-testid="pause-message" hidden></p>
      <p class="error" data-testid="salvage-error" role="alert" hidden></p>
      <div class="pr-actions"><button class="secondary" data-testid="pause-salvage">Pause</button><button class="primary" data-testid="resume-salvage" hidden>Resume</button><button class="primary" data-testid="retry-collection" hidden>Retry save</button><button class="primary" data-testid="reset-salvage" hidden>Reset board</button><button class="primary" data-testid="finish-salvage" hidden>Finish Salvage</button><button class="secondary" data-testid="leave-salvage">Back to Pilots</button></div>
      <p class="pr-collected-list" data-testid="collection-receipt" aria-live="polite">No starting tile grants.</p>
      <div class="pr-controls">Move: Left / Right; Soft Drop: Down<br>Rotate: Up / X or Z; Hard Drop: Space<br>Hold: C / Shift; Pause: Escape<br>Reward-free pieces remain available when all remaining payloads are already on the board, in Hold or in Next.</div>
    </section><section class="pr-game" aria-label="Falling Blocks and collected tiles">
      <div class="pr-cluster"><section><p class="pr-label" data-testid="hold-label">HOLD</p><div data-testid="hold-piece"></div></section>
        <section><p class="pr-label" data-testid="stack-warning">FALLING BLOCKS</p><div class="pr-well" data-testid="pre-run-board" tabindex="0" role="img" aria-label="Falling Blocks board, 10 columns and 20 rows"><div class="pr-layer" data-testid="locked-cells"></div><div class="pr-layer" data-testid="ghost-cells" aria-hidden="true"></div><div class="pr-layer" data-testid="active-piece"></div><div class="pr-layer" data-testid="clear-effect" aria-hidden="true"></div></div></section>
        <section><p class="pr-label">NEXT</p><div data-testid="next-pieces"></div></section>
      </div><div class="pr-harvest" data-testid="harvest" aria-label="Committed collection by subtype"></div>
      <div class="pr-bottom"><span>Collected: <strong data-testid="collected-total">0</strong> / 8</span><span data-testid="lines-cleared"></span></div>
    </section></div></section></main>`;
  const element = <T extends HTMLElement = HTMLElement>(name: string): T => root.querySelector<T>(`[data-testid="${name}"]`)!;
  const safeViewport = () => window.innerWidth >= 1280 && window.innerHeight >= 720;
  let live = true;
  let busy = false;
  let frameId = 0;
  let lastTimestamp: number | null = null;
  let accumulator = 0;
  let pauseReason: string | null = safeViewport() && !document.hidden ? null : 'Paused: window too small or hidden.';
  let resumeRemaining: number | null = null;
  let inputs: BoardInput[] = [];
  const keyboard = new GameplayKeyboard(input => inputs.push(input), () => pause('Paused. Resume when ready.'));
  let view = application.projection();
  let clearEffect: { tick: number; rows: number[] } | null = null;

  function cellNode(cell: BoardCell, style: string): HTMLSpanElement {
    const node = document.createElement('span');
    node.className = `pr-cell ${style}`;
    node.style.setProperty('--x', String(cell.x));
    node.style.setProperty('--y', String(cell.y));
    node.dataset.cellId = cell.id;
    node.dataset.x = String(cell.x);
    node.dataset.y = String(cell.y);
    if (cell.payload && style !== 'ghost') {
      node.dataset.payloadId = cell.payload.id;
      node.dataset.letter = cell.payload.letter;
      node.dataset.subtype = cell.payload.subtype;
      const letter = document.createElement('b'); letter.textContent = cell.payload.letter;
      const subtype = document.createElement('small'); subtype.textContent = ABBREVIATIONS[cell.payload.subtype] ?? cell.payload.subtype;
      node.append(letter, subtype);
      node.title = `${cell.payload.letter} - ${cell.payload.subtype}`;
    }
    return node;
  }
  function preview(piece: Piece): HTMLElement {
    const node = document.createElement('div');
    node.className = 'pr-preview'; node.dataset.pieceId = piece.id;
    node.setAttribute('aria-label', `${piece.shape}: ${piece.payload ? piece.payload.letter + ' ' + piece.payload.subtype : 'no reward'}`);
    const cells = canonicalPiece(piece).cells;
    const left = Math.min(...cells.map(cell => cell.x)), top = Math.min(...cells.map(cell => cell.y));
    node.append(...cells.map(cell => cellNode({ ...cell, x: cell.x - left, y: cell.y - top }, 'preview')));
    return node;
  }
  function render(): void {
    if (!live) return;
    view = application.projection();
    root.querySelector<HTMLElement>('.pr-controls')!.textContent = controlsText(settings?.current()) + ' Reward-free pieces remain available when all remaining payloads are on the board, in Hold or in Next.';
    element('salvage-objective').textContent = `Build the starter word ${view.run.starterObjective.targetWord}`;
    element('salvage-run-id').textContent = view.run.runId;
    element('salvage-content').textContent = view.run.contentVersion;
    element('salvage-ruleset').textContent = view.run.rulesetVersion;
    element('salvage-quota').textContent = `${view.run.quota.remaining} / ${view.run.quota.total}`;
    element('collected-total').textContent = String(view.collected.length);
    element('salvage-status').textContent = ({ playing: 'Clear payload cells to collect tiles.', pending: 'Saving collection. Simulation is stopped.', 'save-failed': 'Save failed. Retry the same operation.', 'top-out': 'Top-out. Committed collection is preserved.', exhausted: 'Collection quota exhausted. Your starter is ready.', complete: 'Starter saved. Ready for Build.' })[view.status];
    element('pause-message').hidden = !pauseReason;
    element('pause-message').textContent = resumeRemaining === null ? pauseReason ?? '' : `Paused - resuming in ${Math.max(1, Math.ceil((resumeRemaining - 1e-7) / 1000))}...`;
    element('salvage-error').hidden = !view.error;
    element('salvage-error').textContent = view.error;
    const blocked = busy || view.status === 'pending' || view.status === 'save-failed';
    element<HTMLButtonElement>('pause-salvage').disabled = blocked || view.status !== 'playing' || !!pauseReason;
    element<HTMLButtonElement>('resume-salvage').hidden = !pauseReason;
    element<HTMLButtonElement>('resume-salvage').disabled = !safeViewport() || document.hidden || resumeRemaining !== null || blocked;
    element<HTMLButtonElement>('retry-collection').hidden = view.status !== 'save-failed';
    element<HTMLButtonElement>('retry-collection').disabled = busy;
    element<HTMLButtonElement>('reset-salvage').hidden = view.status !== 'top-out';
    element<HTMLButtonElement>('reset-salvage').disabled = blocked || !safeViewport() || document.hidden;
    element<HTMLButtonElement>('finish-salvage').hidden = !view.canFinish || view.status === 'complete';
    element<HTMLButtonElement>('finish-salvage').disabled = blocked;
    element<HTMLButtonElement>('leave-salvage').disabled = blocked;
    if (view.lastCollected.length) element('collection-receipt').textContent = 'Saved: ' + view.lastCollected.map(tile => `${tile.letter} / ${tile.subtype}`).join(', ');
    element('harvest').replaceChildren(...MODULE_SUBTYPES.map(subtype => {
      const node = document.createElement('div'); node.className = 'pr-harvest-item'; node.dataset.subtype = subtype;
      const label = document.createElement('span'); label.textContent = subtype;
      const selected = view.collected.filter(tile => tile.subtype === subtype);
      const count = document.createElement('strong'); count.textContent = String(selected.length);
      const letters = document.createElement('small'); letters.textContent = selected.length ? [...new Set(selected.map(tile => tile.letter))].sort().map(letter => `${letter} x${selected.filter(tile => tile.letter === letter).length}`).join(', ') : 'No letters';
      node.append(label, count, letters); return node;
    }));
    const board = view.board;
    if (!board) return;
    element('pre-run-board').classList.toggle('pr-board-muted', !!pauseReason || blocked);
    element('lines-cleared').textContent = `Lines: ${board.lines}`;
    element('stack-warning').textContent = board.grid.some(cell => cell.y >= 0 && cell.y < 4) ? 'STACK HIGH' : 'FALLING BLOCKS';
    element('hold-label').textContent = board.holdUsed ? 'HOLD - USED' : 'HOLD';
    element('hold-piece').replaceChildren(...(board.hold ? [preview(board.hold)] : []));
    element('next-pieces').replaceChildren(...board.next.map(preview));
    element('locked-cells').replaceChildren(...board.grid.filter(cell => cell.y >= 0).map(cell => cellNode(cell, 'locked')));
    element('ghost-cells').replaceChildren(...ghostCells(board).filter(cell => cell.y >= 0 && !board.active.cells.some(active => active.x === cell.x && active.y === cell.y)).map(cell => cellNode(cell, 'ghost')));
    const active = element('active-piece');
    active.dataset.pieceId = board.active.id;
    active.dataset.shape = board.active.shape;
    active.dataset.pivotX = String(board.active.pivot[0]); active.dataset.pivotY = String(board.active.pivot[1]);
    active.replaceChildren(...(board.topOut ? [] : board.active.cells.filter(cell => cell.y >= 0).map(cell => cellNode(cell, 'active'))));
    if (view.events?.rows.length) clearEffect = { tick: board.tick, rows: view.events.rows };
    element('clear-effect').replaceChildren(...(clearEffect && board.tick >= clearEffect.tick && board.tick - clearEffect.tick < 10 ? clearEffect.rows.map(row => { const node = document.createElement('span'); node.className = 'pr-clear-row'; node.style.setProperty('--y', String(row)); return node; }) : []));
  }
  function clearInput(): void {
    inputs = []; keyboard.clear(); application.clearInput();
  }
  function pause(reason: string): void {
    pauseReason = reason; resumeRemaining = null; lastTimestamp = null; accumulator = 0; clearInput(); render();
  }
  const onKey = (event: KeyboardEvent): void => {
    const current = application.projection();
    keyboard.handle(event, { bindings: settings?.current().bindings,
      pieceId: !pauseReason && !busy && current.status === 'playing' ? current.board!.active.id : null });
  };
  const onBlur = () => pause('Paused because the game lost focus.');
  const onVisibility = () => { if (document.hidden) pause('Paused because the tab is hidden.'); };
  const onResize = () => { if (!safeViewport()) pause('Paused: use a window of at least 1280 x 720.'); else render(); };

  async function runAction(action: () => PreRunProjection | Promise<PreRunProjection>): Promise<void> {
    if (busy) return;
    busy = true; clearInput();
    try {
      const result = action(); render();
      const updated = await result;
      lastTimestamp = null; accumulator = 0;
      if (live && updated.status === 'complete') await onComplete();
    } catch (error) {
      if (live) { element('salvage-error').hidden = false; element('salvage-error').textContent = error instanceof Error ? error.message : String(error); }
    } finally { busy = false; if (live) render(); }
  }
  element('pause-salvage').addEventListener('click', () => pause('Paused. Resume when ready.'));
  element('resume-salvage').addEventListener('click', () => {
    if (!safeViewport() || document.hidden || !pauseReason || busy || ['pending', 'save-failed'].includes(application.projection().status)) return;
    resumeRemaining = 3000; lastTimestamp = null; accumulator = 0; clearInput(); render();
  });
  element('retry-collection').addEventListener('click', () => { void runAction(() => application.retry()); });
  element('reset-salvage').addEventListener('click', () => {
    clearEffect = null; pauseReason = null; resumeRemaining = null;
    void runAction(() => application.resetAfterTopOut());
  });
  element('finish-salvage').addEventListener('click', () => { void runAction(() => application.finish()); });
  element('leave-salvage').addEventListener('click', () => { if (!busy) void onExit(); });

  async function frame(timestamp: number): Promise<void> {
    if (!live) return;
    try {
      const previous = lastTimestamp; lastTimestamp = timestamp;
      if (resumeRemaining !== null) {
        if (!safeViewport() || document.hidden) { pause('Paused: window too small or hidden.'); return; }
        resumeRemaining = Math.max(0, resumeRemaining - (previous === null ? 0 : Math.max(0, timestamp - previous)));
        if (resumeRemaining < 1e-7) {
          pauseReason = null; resumeRemaining = null; accumulator = 0; clearInput(); element('pre-run-board').focus();
        }
        // The frame that finishes 3-2-1 is still a paused frame.
        render(); return;
      }
      if (previous !== null && !pauseReason && !busy && application.projection().status === 'playing') {
        const elapsed = timestamp - previous;
        if (elapsed > STEP * 6) { pause('Paused after a delayed frame. No elapsed play was simulated.'); return; }
        accumulator += elapsed;
        while (accumulator + 1e-7 >= STEP && live) {
          accumulator -= STEP;
          const queued = inputs; inputs = [];
          const update = application.advance(queued);
          const barrier = application.projection().status === 'pending';
          if (barrier) { clearInput(); render(); }
          view = await update;
          if (barrier || view.status !== 'playing') { accumulator = 0; lastTimestamp = null; clearInput(); break; }
        }
      } else accumulator = 0;
      render();
    } catch (error) { pause(error instanceof Error ? `Paused: ${error.message}` : 'Paused after a runtime error.'); }
    finally { if (live) frameId = requestAnimationFrame(frame); }
  }
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  window.addEventListener('blur', onBlur); window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  if (!pauseReason && !document.hasFocus()) onBlur();
  settings?.attach(root, () => pause('Paused for Settings. Close Settings, then choose Resume.'));
  render(); element('pre-run-board').focus(); frameId = requestAnimationFrame(frame);
  return () => {
    live = false; cancelAnimationFrame(frameId); clearInput();
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', onBlur); window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
