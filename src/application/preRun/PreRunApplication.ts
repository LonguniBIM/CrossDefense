import type { ActiveRun } from '../../domain/run/run';
import { assertSalvageState, sameSalvagePool, canFinishSalvage, collectedTiles, createSalvageState, SalvageRejection, type SalvageOperation, type StarterTile } from '../../domain/preRun/salvage';
import { clearBoardInput, createBoard, stepBoard, type BoardInput, type BoardState, type BoardEvents } from '../../domain/preRun/board';
import type { ContentPackApplication } from '../content/ContentPackApplication';
import { RunContentUnavailableError, type RunRepository } from '../run/RunRepository';

export interface PreRunProjection {
  run: ActiveRun;
  board: BoardState | null;
  status: 'playing' | 'pending' | 'save-failed' | 'top-out' | 'exhausted' | 'complete';
  canFinish: boolean;
  collected: StarterTile[];
  lastCollected: StarterTile[];
  events: BoardEvents | null;
  error: string | null;
}

/** Owns transient simulation and the durability barrier. The view receives copies only. */
export class PreRunApplication {
  private run: ActiveRun | null = null;
  private board: BoardState | null = null;
  private pending: SalvageOperation | null = null;
  private saving = false;
  private error: string | null = null;
  private lastCollected: StarterTile[] = [];
  private events: BoardEvents | null = null;

  constructor(
    private readonly repository: RunRepository,
    private readonly content: ContentPackApplication,
    private readonly generateId: () => string,
  ) {}

  async open(pilotId: string): Promise<PreRunProjection> {
    if (this.run || this.saving) throw new Error('This Pre-Run session is already open.');
    this.saving = true;
    try {
      let run = await this.repository.getActiveRun(pilotId);
      if (!run) throw new Error('No active Run exists for the selected Pilot.');
      if (run.phase === 'attempt') throw new SalvageRejection('ATTEMPT_ACTIVE', 'An active Attempt cannot reopen Pre-Run.');
      const pack = await this.content.getPack(run.contentVersion, run.rulesetVersion);
      if (!pack || pack.preRun.collectionQuota !== run.quota.total ||
          pack.preRun.starterObjective.targetWord !== run.starterObjective.targetWord ||
          pack.preRun.starterObjective.requiresWeaponTile !== run.starterObjective.requiresWeaponTile) {
        throw new RunContentUnavailableError();
      }
      assertSalvageState(run);
      const initial = createSalvageState(run, pack.preRun);
      if (!run.salvage) {
        run = await this.repository.applySalvage({
          kind: 'initialize', operationId: `${run.runId}:salvage:initialize`,
          runId: run.runId, pilotId, expectedRevision: 0, initial,
        });
      }
      if (!run.salvage || !sameSalvagePool(run.salvage, initial)) {
        throw new Error('Saved Pre-Run pool does not match its pinned content and seed.');
      }
      this.run = run;
      this.rebuildBoard();
    } finally { this.saving = false; }
    return this.projection();
  }

  projection(): PreRunProjection {
    const run = this.requireRun();
    const status = this.pending ? (this.error ? 'save-failed' : 'pending') :
      run.phase === 'build' ? 'complete' : run.quota.remaining === 0 ? 'exhausted' :
      this.board?.topOut ? 'top-out' : 'playing';
    return structuredClone({
      run, board: this.board, status, canFinish: !this.pending && canFinishSalvage(run),
      collected: collectedTiles(run), lastCollected: this.lastCollected, events: this.events, error: this.error,
    });
  }

  async advance(inputs: readonly BoardInput[] = []): Promise<PreRunProjection> {
    const run = this.requireRun();
    if (this.saving || this.pending || !this.board || this.board.topOut || run.phase !== 'pre-run-salvage' || !run.quota.remaining) {
      return this.projection();
    }
    const next = stepBoard(this.board, inputs);
    this.board = next.board;
    this.events = next.events;
    if (next.events.cleared.length) {
      this.pending = {
        kind: 'collect', operationId: this.generateId(), pilotId: run.pilotId, runId: run.runId,
        expectedRevision: run.salvage!.revision, tileIds: next.events.cleared.map(tile => tile.id),
      };
      return this.persistPending();
    }
    return this.projection();
  }

  async retry(): Promise<PreRunProjection> {
    if (!this.pending || this.saving) return this.projection();
    return this.persistPending();
  }

  async finish(): Promise<PreRunProjection> {
    const run = this.requireRun();
    if (this.pending || this.saving || run.phase === 'build') return this.projection();
    if (!canFinishSalvage(run)) throw new SalvageRejection('STARTER_REQUIRED', 'Collect the starter before Finish Salvage.');
    this.pending = {
      kind: 'finish', operationId: this.generateId(), pilotId: run.pilotId, runId: run.runId,
      expectedRevision: run.salvage!.revision,
    };
    return this.persistPending();
  }

  resetAfterTopOut(): PreRunProjection {
    if (this.pending || this.saving || !this.board?.topOut) throw new SalvageRejection('RESET_NOT_AVAILABLE', 'Reset is available only after a committed top-out.');
    this.rebuildBoard();
    this.events = null;
    return this.projection();
  }

  clearInput(): void {
    if (this.board) this.board = clearBoardInput(this.board);
  }

  private async persistPending(): Promise<PreRunProjection> {
    const operation = this.pending!;
    this.saving = true;
    this.error = null;
    try {
      const committed = await this.repository.applySalvage(operation);
      assertSalvageState(committed);
      this.run = committed;
      if (operation.kind === 'collect') {
        this.lastCollected = collectedTiles(committed).filter(tile => operation.tileIds.includes(tile.id));
      }
      this.pending = null;
      if (committed.phase === 'build') this.board = null;
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      // Do not replace the pending command, advance another tick or publish a receipt.
    } finally { this.saving = false; }
    return this.projection();
  }

  private rebuildBoard(): void {
    const run = this.requireRun();
    const state = run.salvage!;
    this.board = run.phase === 'build' ? null : createBoard(state.seed, state.order.filter(tile => !state.collectedIds.includes(tile.id)));
  }

  private requireRun(): ActiveRun {
    if (!this.run) throw new Error('Open a validated Pre-Run before issuing commands.');
    return this.run;
  }
}
