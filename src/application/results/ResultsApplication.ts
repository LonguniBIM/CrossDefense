import type { ResultsRepository, ResultsState } from './ResultsRepository';
import { ResultRejection, type SettleOutcomeCommand } from '../../domain/results/settlement';
import { RunOperationConflictError } from '../run/RunRepository';

/** Owns one result operation. Failed/lost acknowledgments retain the original command. */
export class ResultsApplication {
  private state: ResultsState | null = null;
  private pending: SettleOutcomeCommand | null = null;
  private busy = false;
  constructor(private readonly repository: ResultsRepository, private readonly generateId: () => string,
    private readonly now: () => string = () => new Date().toISOString()) {}
  async open(pilotId: string): Promise<ResultsState> {
    if (this.busy || this.pending) throw new ResultRejection('SAVE_PENDING', 'Finish the current result save first.');
    this.busy = true;
    try {
      const state = await this.repository.getResults(pilotId);
      if (state.run.phase !== 'build') throw new ResultRejection('BUILD_REQUIRED', 'Return to safe Build to inspect results.');
      this.state = state; return this.snapshot();
    } finally { this.busy = false; }
  }
  snapshot(): ResultsState {
    if (!this.state) throw new ResultRejection('RESULTS_NOT_READY', 'Open the saved results first.');
    return structuredClone(this.state);
  }
  hasPendingSave(): boolean { return this.pending !== null; }
  async settle(attemptId: string): Promise<ResultsState> {
    if (this.busy || this.pending && this.pending.attemptId !== attemptId) throw new ResultRejection('SAVE_PENDING', 'Retry the current result before selecting another.');
    const state = this.snapshot();
    if (!state.outcomes.some(row => row.outcome.attemptId === attemptId)) throw new ResultRejection('OUTCOME_REQUIRED', 'Select a saved outcome.');
    this.pending ??= { kind: 'settle-outcome', operationId: this.generateId(), pilotId: state.run.pilotId,
      runId: state.run.runId, attemptId, recordedAt: this.now() };
    this.busy = true;
    try { this.state = await this.repository.settleOutcome(structuredClone(this.pending)); this.pending = null; return this.snapshot(); }
    catch (error) { if (error instanceof ResultRejection || error instanceof RunOperationConflictError) this.pending = null; throw error; }
    finally { this.busy = false; }
  }
  retry(): Promise<ResultsState> {
    if (!this.pending) return Promise.reject(new ResultRejection('NO_PENDING_SAVE', 'No result is waiting for Retry.'));
    return this.settle(this.pending.attemptId);
  }
}
