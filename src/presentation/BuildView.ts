import './build.css';
import type { BuildApplication, BuildSnapshot, PlacementIntent } from '../application/build/BuildApplication';
import type { StarterTile } from '../domain/preRun/salvage';
import { tilePower, BUILD_TECHNOLOGY_LEVEL, INITIAL_CARGO_CAPACITY } from '../domain/build/rules';
import { PlacementRejection, type BuildWord, type PlacementPreview } from '../domain/build/shipBuild';

export function formatHundredths(value: number): string {
  const absolute = Math.abs(value), remainder = absolute % 100;
  return (value < 0 ? '-' : '') + Math.trunc(absolute / 100) + (remainder ? '.' + String(remainder).padStart(2, '0').replace(/0+$/, '') : '');
}
const EDIT_SUCCESS = { return: 'Tile returned to Cargo.', undo: 'Undo saved.', redo: 'Redo saved.' } as const;
const coordinate = (x: number, y: number) => String.fromCharCode(65 + x) + (y + 1);
const shortSubtype = (subtype: string) => subtype.slice(0, 3).toUpperCase();

/** Rendering consumes copied projections. Every input route calls the same placement intent. */
export function mountBuild(root: HTMLElement, app: BuildApplication, onBack: () => Promise<void>, onChooseMap?: () => Promise<void>, results?: { open():Promise<void>; salvage():Promise<void>; credits:number; celestium:number; unsettled:number; lastSettled:boolean }, review?: { dueCount: number; open(): Promise<void> }): () => void {
  const controller = new AbortController(), signal = controller.signal;
  let disposed = false, busy = false, selected: string | null = null, dragged: string | null = null;
  let focusX = 2, focusY = 2;
  let targetRejection: PlacementIntent | null = null;
  let restoringFocus = false;
  let snapshot: BuildSnapshot = app.snapshot();
  root.innerHTML = `<div class="bu-shell">
    <header class="bu-header"><div><span class="bu-eyebrow">DEVELOPMENT BUILD</span><h1>Build Phase</h1></div><div class="bu-history"><button class="secondary" data-testid="build-results">Results</button><button class="secondary" data-testid="build-review" hidden>Due Review</button><button class="secondary" data-testid="build-salvage">Salvage</button><button class="secondary" data-testid="choose-map">Map &amp; difficulty</button><button class="secondary" data-testid="undo-build" aria-keyshortcuts="Control+Z" title="Undo layout edit (Ctrl+Z)" disabled>Undo</button><button class="secondary" data-testid="redo-build" aria-keyshortcuts="Control+Shift+Z" title="Redo layout edit (Ctrl+Shift+Z)" disabled>Redo</button><button class="secondary" data-testid="back-to-pilots">Back to Pilots</button></div></header>
    <div class="bu-meta"><span data-testid="run-id"></span><span data-testid="build-content-version"></span><span data-testid="build-ruleset-version"></span><span data-testid="build-balances"></span></div>
    <p class="bu-saved" data-testid="starter-complete">Pre-Run complete. Place retained Letter Tiles; summaries use saved positions only.</p>
    <p class="bu-saved" data-testid="attempt-recovery" hidden></p>
    <div class="bu-layout">
      <section class="bu-panel bu-cargo"><h2>Run Cargo</h2><p>Retained: <strong data-testid="build-collected-count"></strong> / <span data-testid="cargo-capacity"></span></p><p class="muted">Placed tiles still use Cargo capacity.</p><div class="bu-cargo-list" data-testid="cargo-list"></div><p class="bu-help">Select a tile, then a hull cell. Drag to place, or press Enter on a tile and use arrow keys. Escape cancels preview. Ctrl+Z / Ctrl+Shift+Z undo/redo layout edits only.</p></section>
      <section class="bu-panel bu-center"><div class="bu-section-heading"><h2>Ship Grid</h2><span data-testid="hull-label"></span></div>
        <div class="bu-power"><div>Available<strong data-testid="power-available"></strong></div><div>Required<strong data-testid="power-required"></strong></div><div>Surplus<strong data-testid="power-surplus"></strong></div></div>
        <div class="bu-grid" data-testid="ship-grid" role="group" aria-label="Ship Grid"></div>
        <p class="bu-status" data-testid="build-status" role="status" aria-live="polite"></p><button class="primary" data-testid="retry-placement" hidden>Retry placement</button>
      </section>
      <aside class="bu-panel bu-inspector"><h2>Inspector</h2><p data-testid="selected-tile">Select a tile or equipped word.</p><p data-testid="selected-effects"></p><button class="secondary bu-return" data-testid="return-tile" disabled>Return to Cargo</button><p class="muted" data-testid="build-learning-note"></p>
        <section class="bu-preview" aria-label="Placement preview"><h3>Preview - not saved</h3><p data-testid="preview-status">Select a tile and point to a hull cell.</p><p data-testid="preview-power"></p><div data-testid="preview-words"></div></section>
      </aside>
      <section class="bu-panel bu-equipped"><h2>Equipped Tiles</h2><div class="bu-subtypes" data-testid="equipped-tiles"></div></section>
      <section class="bu-panel bu-words"><h2>Equipped Words</h2><div data-testid="equipped-words"></div></section>
    </div>
  </div>`;
  const element = <T extends HTMLElement = HTMLElement>(name: string): T => {
    const node = root.querySelector<T>(`[data-testid="${name}"]`);
    if (!node) throw new Error('Build view element is missing: ' + name);
    return node;
  };
  const text = (name: string, value: string) => { element(name).textContent = value; };
  text('build-learning-note', review ? 'Technology Level 1. Optional meaning practice is available through due Review. No audio is included.' : 'Technology Level 1. Learning definitions and audio are not included in this pack.');
  const cell = (x: number, y: number) => element<HTMLButtonElement>('cell-' + coordinate(x, y));
  const retained = () => [...snapshot.summary.unplaced, ...snapshot.summary.equipped];
  const blocked = () => busy || app.hasPendingSave() || app.isAttemptHeld();

  function setStatus(message: string, rejection: PlacementIntent | null = null): void {
    targetRejection = rejection;
    text('build-status', message);
  }

  function clearTargetRejection(): void {
    if (targetRejection && !blocked()) setStatus('');
  }

  function tileFace(button: HTMLButtonElement, tile: StarterTile): void {
    const letter = document.createElement('b'), subtype = document.createElement('small');
    letter.textContent = tile.letter; subtype.textContent = shortSubtype(tile.subtype);
    button.append(letter, subtype); button.dataset.tileId = tile.id;
    button.dataset.subtype = tile.subtype; button.draggable = !blocked();
    button.title = tile.letter + ' / ' + tile.subtype;
  }

  function updateControls(): void {
    for (const button of root.querySelectorAll<HTMLButtonElement>('button')) button.disabled = blocked();
    element<HTMLButtonElement>('retry-placement').hidden = !app.hasPendingSave();
    element<HTMLButtonElement>('retry-placement').disabled = busy;
    element<HTMLButtonElement>('choose-map').hidden = !onChooseMap;
    element<HTMLButtonElement>('build-results').hidden = !results;
    element<HTMLButtonElement>('build-review').hidden = !review;
    element<HTMLButtonElement>('build-review').disabled = blocked() || !review?.dueCount;
    text('build-review', 'Due Review (' + (review?.dueCount ?? 0) + ')');
    element<HTMLButtonElement>('build-salvage').hidden = !results;
    element<HTMLButtonElement>('build-salvage').disabled = blocked() || !snapshot.run.salvageBuffer?.length;
    element<HTMLButtonElement>('undo-build').disabled = blocked() || !snapshot.history.canUndo;
    element<HTMLButtonElement>('redo-build').disabled = blocked() || !snapshot.history.canRedo;
    element<HTMLButtonElement>('return-tile').disabled = blocked() || !snapshot.summary.equipped.some(tile => tile.id === selected);
    for (const tile of root.querySelectorAll<HTMLElement>('[data-tile-id]')) {
      tile.setAttribute('aria-pressed', String(tile.dataset.tileId === selected));
      tile.draggable = !blocked();
    }
  }

  function inspector(): void {
    const tile = retained().find(entry => entry.id === selected);
    if (!tile) { text('selected-tile', 'Select a tile or equipped word.'); text('selected-effects', ''); return; }
    text('selected-tile', tile.letter + ' / ' + tile.subtype);
    const multiplier = snapshot.summary.equipped.find(entry => entry.id === tile.id)?.multiplier ?? 100;
    const power = tilePower(tile.subtype, multiplier);
    const unsupported = snapshot.summary.words.filter(word => !word.supported && word.tileIds.includes(tile.id));
    const note = unsupported.length ? ' Not supported: ' + unsupported.map(word => word.spelling + ' (' + word.axis + ')').join('; ') + '. Intrinsic effects only for these sequences.' : '';
    text('selected-effects', `Level ${BUILD_TECHNOLOGY_LEVEL}; multiplier x${formatHundredths(multiplier)}; Power +${formatHundredths(power.available)} / demand ${formatHundredths(power.required)}.${note}`);
  }

  function clearPreview(): void {
    for (const node of root.querySelectorAll('.bu-preview-valid,.bu-preview-invalid,.bu-affected')) node.classList.remove('bu-preview-valid', 'bu-preview-invalid', 'bu-affected');
    text('preview-status', 'Select a tile and point to a hull cell.'); text('preview-power', ''); element('preview-words').replaceChildren();
  }

  function selectTile(id: string): void {
    if (blocked() || !retained().some(tile => tile.id === id)) return;
    selected = id; clearPreview(); inspector(); updateControls();
  }

  function preview(x: number, y: number): void {
    if (!selected || blocked()) return;
    // Restoring focus after a rejected commit is not a new user preview.
    if (!restoringFocus && targetRejection && (targetRejection.tileId !== selected || targetRejection.x !== x || targetRejection.y !== y)) {
      clearTargetRejection();
    }
    clearPreview();
    const result = app.preview({ tileId: selected, x, y });
    cell(x, y).classList.add(result.valid ? 'bu-preview-valid' : 'bu-preview-invalid');
    text('preview-status', result.valid ? 'Valid placement at ' + coordinate(x, y) + '. Committed summaries are unchanged.' : result.message ?? 'Placement rejected.');
    showPreviewEffects(result);
  }

  function previewReturn(): void {
    if (!selected || blocked() || !snapshot.summary.equipped.some(tile => tile.id === selected)) return;
    clearTargetRejection(); clearPreview();
    const result = app.previewReturn(selected);
    text('preview-status', result.valid ? 'Return to Cargo. Committed summaries are unchanged.' : result.message ?? 'Return rejected.');
    showPreviewEffects(result);
  }

  function showPreviewEffects(result: PlacementPreview): void {
    if (!result.after) return;
    const before = result.before.power, after = result.after.power;
    text('preview-power', `Available ${formatHundredths(before.available)} -> ${formatHundredths(after.available)}; required ${formatHundredths(before.required)} -> ${formatHundredths(after.required)}; surplus ${formatHundredths(before.surplus)} -> ${formatHundredths(after.surplus)}.`);
    const signature = (word: BuildWord) => JSON.stringify([word.axis, word.spelling, word.tileIds, word.multiplier]);
    const prior = new Set(result.before.words.map(signature)), next = new Set(result.after.words.map(signature));
    const affected = [...result.before.words.filter(word => !next.has(signature(word))), ...result.after.words.filter(word => !prior.has(signature(word)))];
    const ids = new Set(affected.flatMap(word => word.tileIds));
    for (const tile of [...result.before.equipped, ...result.after.equipped]) if (ids.has(tile.id)) cell(tile.x, tile.y).classList.add('bu-affected');
    const words = element('preview-words');
    for (const word of result.after.words) {
      const row = document.createElement('p');
      row.textContent = `${word.spelling} (${word.axis}): ${word.supported ? 'x' + formatHundredths(word.multiplier) : 'Not supported - intrinsic effects only'}`;
      words.append(row);
    }
    if (!result.after.words.length) words.textContent = 'No complete word of three or more letters after this placement.';
  }

  function render(): void {
    if (disposed) return;
    snapshot = app.snapshot();
    text('run-id', snapshot.run.runId); text('build-content-version', snapshot.run.contentVersion); text('build-ruleset-version', snapshot.run.rulesetVersion);
    text('build-balances', results ? 'Credits '+results.credits+' | Celestium '+results.celestium : '');
    text('build-results', 'Results'+(results?.unsettled ? ' ('+results.unsettled+' pending)' : ''));
    text('build-salvage', 'Salvage ('+(snapshot.run.salvageBuffer?.length??0)+')');
    text('build-collected-count', String(snapshot.summary.retainedCount)); text('cargo-capacity', String(INITIAL_CARGO_CAPACITY));
    text('hull-label', '5 x 5 / 13 cells');
    const previousAttempt=snapshot.run.attempt;
    element('attempt-recovery').hidden=!previousAttempt||previousAttempt.status==='running';
    text('attempt-recovery',previousAttempt&&previousAttempt.status!=='running'?'Previous Attempt '+previousAttempt.attemptId+' was '+previousAttempt.status+'. Returned to Build; '+(previousAttempt.status==='victory'?(results?.lastSettled?'rewards saved. View Results.':'rewards await settlement in Results.'):'no victory rewards.') :'');
    for (const name of ['available', 'required', 'surplus'] as const) text('power-' + name, formatHundredths(snapshot.summary.power[name]));
    const cargo = element('cargo-list'); cargo.replaceChildren();
    for (const tile of snapshot.summary.unplaced) {
      const button = document.createElement('button'); button.className = 'bu-tile'; button.dataset.testid = 'cargo-tile';
      button.setAttribute('aria-label', `${tile.letter}, ${tile.subtype}, unplaced Letter Tile`); tileFace(button, tile); cargo.append(button);
    }
    if (!snapshot.summary.unplaced.length) cargo.textContent = 'All retained tiles are on the ship.';
    const grid = element('ship-grid'); grid.replaceChildren();
    for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) {
      const button = document.createElement('button'), allowed = snapshot.content.hull.cells.some(position => position.x === x && position.y === y);
      button.className = 'bu-cell' + (allowed ? '' : ' bu-outside');
      button.dataset.testid = 'cell-' + coordinate(x, y); button.dataset.x = String(x); button.dataset.y = String(y);
      button.tabIndex = x === focusX && y === focusY ? 0 : -1;
      button.setAttribute('aria-disabled', String(!allowed));
      const tile = snapshot.summary.equipped.find(entry => entry.x === x && entry.y === y);
      if (tile) tileFace(button, tile);
      const label = document.createElement('span'); label.className = 'bu-coordinate'; label.textContent = coordinate(x, y); button.append(label);
      button.setAttribute('aria-label', coordinate(x, y) + (tile ? `, ${tile.letter}, ${tile.subtype}` : allowed ? ', empty hull cell' : ', outside hull'));
      grid.append(button);
    }
    const subtypes = element('equipped-tiles'); subtypes.replaceChildren();
    for (const entry of snapshot.summary.subtypes) {
      const item = document.createElement('div'), name = document.createElement('strong'), letters = document.createElement('span');
      item.dataset.subtype = entry.subtype; name.textContent = entry.subtype + ': ' + entry.count;
      letters.textContent = entry.letters.map(value => value.letter + (value.count > 1 ? ' x' + value.count : '')).join(', ') || 'No tiles';
      item.append(name, letters); subtypes.append(item);
    }
    const words = element('equipped-words'); words.replaceChildren();
    for (const [index, word] of snapshot.summary.words.entries()) {
      if (!word.supported) continue;
      const row = document.createElement('button'); row.className = 'bu-word'; row.dataset.testid = 'equipped-word'; row.dataset.wordIndex = String(index);
      const multipliers = snapshot.summary.equipped.filter(tile => word.tileIds.includes(tile.id)).map(tile => tile.multiplier);
      const low = Math.min(...multipliers), high = Math.max(...multipliers);
      row.textContent = `${word.spelling} / ${word.axis} / x${formatHundredths(low)}${low === high ? '' : '-' + formatHundredths(high)}`;
      words.append(row);
    }
    if (!words.childElementCount) words.textContent = 'No equipped supported words.';
    clearPreview(); inspector(); updateControls();
  }

  async function commit(x: number, y: number): Promise<void> {
    if (!selected || blocked()) return;
    const tileId = selected; busy = true; updateControls(); setStatus('Saving placement...');
    try {
      await app.place({ operationId: crypto.randomUUID(), tileId, x, y });
      if (!disposed) { focusX = x; focusY = y; setStatus('Placement saved.'); }
    } catch (error) {
      if (!disposed) {
        const rejection = error instanceof PlacementRejection && (error.code === 'OCCUPIED' || error.code === 'OUTSIDE_HULL') ? { tileId, x, y } : null;
        setStatus(error instanceof Error ? error.message : String(error), rejection);
      }
    } finally {
      busy = false;
      if (!disposed) {
        render(); restoringFocus = true;
        try { cell(focusX, focusY).focus({ preventScroll: true }); }
        finally { restoringFocus = false; }
      }
    }
  }

  function focusAfterEdit(invoker: Element | null): void {
    // Retry may have become hidden after acknowledgment; restore only a visible invoker.
    if (invoker instanceof HTMLButtonElement && invoker.isConnected && !invoker.disabled && !invoker.hidden && invoker.getClientRects().length > 0) { invoker.focus({ preventScroll: true }); return; }
    const tile = [...root.querySelectorAll<HTMLButtonElement>('[data-tile-id]')].find(node => node.dataset.tileId === selected);
    (tile ?? cell(focusX, focusY)).focus({ preventScroll: true });
  }

  async function editLayout(kind: 'return' | 'undo' | 'redo'): Promise<void> {
    if (blocked()) return;
    if (kind === 'return' && (!selected || !snapshot.summary.equipped.some(tile => tile.id === selected))) return;
    const invoker = document.activeElement, tileId = selected;
    busy = true; clearPreview(); updateControls(); setStatus('Saving ' + kind + '...');
    try {
      const request = { operationId: crypto.randomUUID() };
      if (kind === 'return') await app.returnToCargo({ ...request, tileId: tileId! });
      else await app[kind](request);
      if (!disposed) setStatus(EDIT_SUCCESS[kind]);
    } catch (error) { if (!disposed) setStatus(error instanceof Error ? error.message : String(error)); }
    finally { busy = false; if (!disposed) { render(); focusAfterEdit(invoker); } }
  }

  root.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!target || !root.contains(target)) return;
    if (target.dataset.testid === 'retry-placement') {
      if (busy) return;
      const kind = app.pendingKind(), invoker = document.activeElement;
      busy = true; updateControls(); setStatus('Retrying the same Build edit...');
      void app.retry().then(() => { if (!disposed) setStatus(kind && kind !== 'place' ? EDIT_SUCCESS[kind] : 'Placement saved.'); }, error => { if (!disposed) setStatus(String(error)); }).finally(() => { busy = false; if (!disposed) { render(); focusAfterEdit(invoker); } });
      return;
    }
    if (blocked()) return;
    if (target.dataset.testid === 'build-review' && review) { busy=true;updateControls();void review.open().catch(error=>{if(!disposed){busy=false;setStatus(String(error));updateControls();}});return; }
    if ((target.dataset.testid === 'build-results' || target.dataset.testid === 'build-salvage') && results) { busy=true;updateControls();void (target.dataset.testid==='build-results'?results.open():results.salvage()).catch(error=>{if(!disposed){busy=false;setStatus(String(error));updateControls();}});return; }
    if (target.dataset.testid === 'choose-map' && onChooseMap) { busy=true;updateControls();void onChooseMap().catch(error=>{if(!disposed){busy=false;setStatus(String(error));updateControls();}});return; }
    if (target.dataset.testid === 'return-tile') { void editLayout('return'); return; }
    if (target.dataset.testid === 'undo-build') { void editLayout('undo'); return; }
    if (target.dataset.testid === 'redo-build') { void editLayout('redo'); return; }
    if (target.dataset.testid === 'back-to-pilots') { void onBack().catch(error => { if (!disposed) setStatus(String(error)); }); return; }
    if (target.dataset.testid === 'cargo-tile') { selectTile(target.dataset.tileId!); return; }
    if (target.dataset.wordIndex !== undefined) {
      const word = snapshot.summary.words[Number(target.dataset.wordIndex)];
      if (word) { selected = null; clearPreview(); updateControls(); text('selected-tile', word.spelling + ' / ' + word.axis); text('selected-effects', 'CEFR Unknown; base word multiplier x' + formatHundredths(word.multiplier) + '. Crossing tiles use their separately derived multiplier.'); }
      return;
    }
    if (target.dataset.x !== undefined) {
      focusX = Number(target.dataset.x); focusY = Number(target.dataset.y);
      if (selected) void commit(focusX, focusY); else if (target.dataset.tileId) selectTile(target.dataset.tileId);
    }
  }, { signal });

  root.addEventListener('keydown', event => {
    const origin = event.target;
    if (origin instanceof HTMLElement && (origin.closest('input,textarea,select,[role="textbox"]') || origin.isContentEditable)) return;
    if (event.ctrlKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (blocked() || event.repeat) return;
      const kind = event.shiftKey ? 'redo' : 'undo';
      if (kind === 'undo' ? snapshot.history.canUndo : snapshot.history.canRedo) void editLayout(kind);
      return;
    }
    if (blocked()) return;
    const target = (event.target as Element).closest<HTMLButtonElement>('button');
    if (event.key === 'Escape') { clearTargetRejection(); selected = null; clearPreview(); inspector(); updateControls(); return; }
    if (!target) return;
    if (target.dataset.testid === 'cargo-tile' && ['Enter', ' '].includes(event.key)) {
      event.preventDefault(); selectTile(target.dataset.tileId!); cell(focusX, focusY).focus(); return;
    }
    if (target.dataset.x === undefined) return;
    focusX = Number(target.dataset.x); focusY = Number(target.dataset.y);
    const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = delta[event.key];
    if (move) {
      event.preventDefault(); target.tabIndex = -1;
      focusX = Math.max(0, Math.min(4, focusX + move[0])); focusY = Math.max(0, Math.min(4, focusY + move[1]));
      cell(focusX, focusY).tabIndex = 0; cell(focusX, focusY).focus();
    } else if (['Enter', ' '].includes(event.key)) { event.preventDefault(); target.click(); }
  }, { signal });
  // A rebuilt cell can emit pointerover under a stationary pointer. Only movement starts a new pointer preview.
  for (const eventName of ['pointermove', 'focusin'] as const) root.addEventListener(eventName, event => {
    if ((event.target as Element).closest('[data-testid="return-tile"]')) { previewReturn(); return; }
    const target = (event.target as Element).closest<HTMLElement>('.bu-cell');
    if (target) preview(Number(target.dataset.x), Number(target.dataset.y));
  }, { signal });
  element('ship-grid').addEventListener('pointerleave', () => clearPreview(), { signal });
  element('return-tile').addEventListener('pointerleave', () => clearPreview(), { signal });
  root.addEventListener('dragstart', event => {
    const tile = (event.target as Element).closest<HTMLElement>('[data-tile-id]');
    if (!tile || blocked()) { event.preventDefault(); return; }
    dragged = tile.dataset.tileId!; selectTile(dragged); event.dataTransfer?.setData('text/plain', dragged);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }, { signal });
  root.addEventListener('dragover', event => {
    const target = (event.target as Element).closest<HTMLElement>('.bu-cell');
    if (target && dragged && !blocked()) { event.preventDefault(); preview(Number(target.dataset.x), Number(target.dataset.y)); }
  }, { signal });
  root.addEventListener('drop', event => {
    const target = (event.target as Element).closest<HTMLElement>('.bu-cell');
    if (!target || !dragged || blocked()) return;
    event.preventDefault(); selected = dragged; dragged = null; void commit(Number(target.dataset.x), Number(target.dataset.y));
  }, { signal });
  root.addEventListener('dragend', () => { dragged = null; clearPreview(); }, { signal });
  render();
  return () => { disposed = true; controller.abort(); };
}
