import type { ResultsRepository } from './ResultsRepository';
import type { ContentPackApplication } from '../content/ContentPackApplication';
import type { ActiveRun } from '../../domain/run/run';
import type { BuildContent } from '../../domain/content/contentPack';
import { assertBuildState, projectBuild } from '../../domain/build/shipBuild';
import { ResultRejection } from '../../domain/results/settlement';
import { previewCargoResolution, type CargoResolutionCommand, type CargoPreview } from '../../domain/results/salvageResolution';
import { RunOperationConflictError } from '../run/RunRepository';

export interface SalvageChoices { keepIds: string[]; discardIds: string[]; removeRetainedIds: string[]; }
export interface SalvageSnapshot { run: ActiveRun; content: BuildContent; }
/** Local choices are previews. Only acknowledged ResolveCargo changes retained ownership. */
export class SalvageApplication {
  private state: SalvageSnapshot | null = null;
  private pending: CargoResolutionCommand | null = null;
  private busy = false;
  constructor(private readonly repository: ResultsRepository, private readonly content: ContentPackApplication,
    private readonly generateId: () => string, private readonly now: () => string = () => new Date().toISOString()) {}
  async open(pilotId: string): Promise<SalvageSnapshot> {
    if (this.busy || this.pending) throw new ResultRejection('SAVE_PENDING', 'Finish the pending Salvage save first.');
    this.busy = true;
    try {
      const run = await this.repository.getActiveRun(pilotId);
      if (!run || run.phase !== 'build') throw new ResultRejection('BUILD_REQUIRED', 'Resolve Salvage from safe Build.');
      const pack = await this.content.getPack(run.contentVersion, run.rulesetVersion);
      if (!pack?.build) throw new ResultRejection('CONTENT_REQUIRED', 'Restore the original pinned Build content before reviewing Salvage.');
      assertBuildState(run, pack.build); this.state = { run, content: pack.build }; return this.snapshot();
    } finally { this.busy = false; }
  }
  snapshot(): SalvageSnapshot {
    if (!this.state) throw new ResultRejection('SALVAGE_NOT_READY', 'Open the saved Salvage first.');
    return structuredClone(this.state);
  }
  hasPendingSave(): boolean { return this.pending !== null; }
  private command(choices: SalvageChoices, operationId: string, recordedAt: string): CargoResolutionCommand {
    const { run } = this.snapshot();
    return { kind: 'resolve-salvage', operationId, pilotId: run.pilotId, runId: run.runId,
      contentVersion: run.contentVersion, rulesetVersion: run.rulesetVersion,
      expectedBuildRevision: run.shipBuild?.revision ?? 0, expectedCargoRevision: run.cargo?.revision ?? 0,
      bufferIds: (run.salvageBuffer ?? []).map(tile => tile.id), ...structuredClone(choices), confirmed: true, recordedAt };
  }
  preview(choices: SalvageChoices): CargoPreview {
    const { run, content } = this.snapshot();
    return previewCargoResolution(run, content, this.command(choices, 'preview-only', '2000-01-01T00:00:00Z'));
  }
  async apply(choices: SalvageChoices, confirmed: boolean): Promise<SalvageSnapshot> {
    if (confirmed !== true) throw new ResultRejection('CONFIRMATION_REQUIRED', 'Review the destructive and Build-impact summary, then confirm once.');
    if (this.busy || this.pending) throw new ResultRejection('SAVE_PENDING', 'Retry the exact pending Salvage batch before any other change.');
    const preview = this.preview(choices);
    if (!preview.valid) throw new ResultRejection('INVALID_SALVAGE', preview.message ?? 'Resolve every Salvage choice first.');
    this.pending = this.command(choices, this.generateId(), this.now());
    return this.persist();
  }
  retry(): Promise<SalvageSnapshot> {
    if (!this.pending || this.busy) return Promise.reject(new ResultRejection('NO_PENDING_SAVE', 'No retryable Salvage save is available.'));
    return this.persist();
  }
  private async persist(): Promise<SalvageSnapshot> {
    const state = this.snapshot(), command = this.pending!; this.busy = true;
    try {
      const run = await this.repository.resolveCargo(structuredClone(command), state.content);
      projectBuild(run, state.content); this.state = { run, content: state.content }; this.pending = null;
      return this.snapshot();
    } catch (error) { if (error instanceof ResultRejection || error instanceof RunOperationConflictError) this.pending = null; throw error; }
    finally { this.busy = false; }
  }
}
