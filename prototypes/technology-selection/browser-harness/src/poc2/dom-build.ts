import {
  GRID_SIZE,
  createInitialPlacements,
  evaluateBuild,
  moveTile,
  snapshot,
  type BuildSnapshot,
  type TilePlacement,
} from './build-model';

export interface Poc2Benchmark {
  iterations: number;
  averageMs: number;
  p95Ms: number;
  maxMs: number;
}

export interface Poc2Api {
  committed(): BuildSnapshot;
  previewMove(tileId: string, x: number, y: number): BuildSnapshot;
  commitMove(tileId: string, x: number, y: number): BuildSnapshot;
  reset(): BuildSnapshot;
  benchmark(iterations?: number): Poc2Benchmark;
}

function createCell(x: number, y: number): HTMLDivElement {
  const cell = document.createElement('div');
  cell.className = 'poc2-cell';
  cell.dataset.x = String(x);
  cell.dataset.y = String(y);
  return cell;
}

export function mountPoc2(root: HTMLElement): Poc2Api {
  let committed = createInitialPlacements();
  let preview: TilePlacement[] | null = null;
  let draggingTileId: string | null = null;

  root.innerHTML = `
    <section class="poc2-layout">
      <div>
        <h2>PoC-2 — DOM Build Grid</h2>
        <p>Drag a tile to preview and commit a new Build placement.</p>
        <div id="poc2-grid" class="poc2-grid" aria-label="Ship Build grid"></div>
      </div>
      <aside class="poc2-stats" aria-live="polite">
        <h3>Build Preview</h3>
        <div id="poc2-stats"></div>
      </aside>
    </section>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .poc2-layout { display:grid; grid-template-columns:minmax(420px, 1fr) 260px; gap:24px; align-items:start; font-family:system-ui,sans-serif; }
    .poc2-grid { display:grid; grid-template-columns:repeat(7, 52px); grid-template-rows:repeat(7, 52px); gap:4px; user-select:none; }
    .poc2-cell { width:52px; height:52px; border:1px solid #9ca3af; background:#f8fafc; display:grid; place-items:center; }
    .poc2-cell.preview-target { outline:3px solid currentColor; }
    .poc2-tile { width:44px; height:44px; border:1px solid #111827; border-radius:6px; display:grid; place-items:center; background:white; font-weight:700; cursor:grab; }
    .poc2-tile:active { cursor:grabbing; }
    .poc2-stats { border:1px solid #d1d5db; border-radius:8px; padding:16px; min-height:180px; }
    .poc2-word { font-weight:700; }
  `;
  root.append(style);

  const grid = root.querySelector<HTMLDivElement>('#poc2-grid');
  const stats = root.querySelector<HTMLDivElement>('#poc2-stats');

  if (!grid || !stats) {
    throw new Error('PoC-2 DOM host is incomplete.');
  }

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = createCell(x, y);

      cell.addEventListener('dragover', (event) => {
        event.preventDefault();

        if (!draggingTileId) {
          return;
        }

        preview = moveTile(committed, draggingTileId, x, y);
        render();
      });

      cell.addEventListener('drop', (event) => {
        event.preventDefault();

        if (!draggingTileId) {
          return;
        }

        committed = moveTile(committed, draggingTileId, x, y);
        preview = null;
        draggingTileId = null;
        render();
      });

      grid.append(cell);
    }
  }

  function render(): void {
    const active = preview ?? committed;
    const evaluation = evaluateBuild(active);

    for (const cell of grid.querySelectorAll<HTMLDivElement>('.poc2-cell')) {
      cell.replaceChildren();
      cell.classList.remove('preview-target');
    }

    for (const placement of active) {
      const selector =
        `.poc2-cell[data-x="${placement.x}"][data-y="${placement.y}"]`;
      const cell = grid.querySelector<HTMLDivElement>(selector);

      if (!cell) {
        continue;
      }

      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'poc2-tile';
      tile.draggable = true;
      tile.dataset.tileId = placement.id;
      tile.textContent = placement.letter;
      tile.setAttribute(
        'aria-label',
        `${placement.letter} ${placement.subtype} tile`,
      );

      tile.addEventListener('dragstart', () => {
        draggingTileId = placement.id;
      });

      tile.addEventListener('dragend', () => {
        preview = null;
        draggingTileId = null;
        render();
      });

      cell.append(tile);
    }

    stats.innerHTML = `
      <p>Words: <span class="poc2-word">${evaluation.activeWords.join(', ') || 'None'}</span></p>
      <p>Power available: ${evaluation.powerAvailable}</p>
      <p>Offense: ${evaluation.offense}</p>
      <p>Defense: ${evaluation.defense}</p>
      <p>State: ${preview ? 'Preview — not committed' : 'Committed Build'}</p>
    `;
  }

  function previewMove(tileId: string, x: number, y: number): BuildSnapshot {
    return snapshot(moveTile(committed, tileId, x, y));
  }

  function commitMove(tileId: string, x: number, y: number): BuildSnapshot {
    committed = moveTile(committed, tileId, x, y);
    preview = null;
    render();
    return snapshot(committed);
  }

  function reset(): BuildSnapshot {
    committed = createInitialPlacements();
    preview = null;
    render();
    return snapshot(committed);
  }

  function benchmark(iterations = 2000): Poc2Benchmark {
    const samples: number[] = [];
    const tileIds = committed.map((placement) => placement.id);

    for (let index = 0; index < iterations; index += 1) {
      const tileId = tileIds[index % tileIds.length] ?? 'tile-s';
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE) % GRID_SIZE;
      const candidate = moveTile(committed, tileId, x, y);
      const start = performance.now();
      evaluateBuild(candidate);
      samples.push(performance.now() - start);
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const p95Index = Math.min(
      sorted.length - 1,
      Math.floor(sorted.length * 0.95),
    );
    const total = samples.reduce((sum, sample) => sum + sample, 0);

    return {
      iterations,
      averageMs: total / samples.length,
      p95Ms: sorted[p95Index] ?? 0,
      maxMs: sorted[sorted.length - 1] ?? 0,
    };
  }

  render();

  return {
    committed: () => snapshot(committed),
    previewMove,
    commitMove,
    reset,
    benchmark,
  };
}
