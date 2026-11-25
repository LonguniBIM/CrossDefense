import type { ContentPackApplication } from '../content/ContentPackApplication';
import type { ActiveRun } from '../../domain/run/run';
import { RunContentUnavailableError, RunOperationConflictError, type RunRepository } from './RunRepository';

export type RunProjection =
  | { kind: 'no-run' }
  | { kind: 'pre-run-salvage'; run: ActiveRun }
  | { kind: 'build'; run: ActiveRun }
  | { kind: 'attempt'; run: ActiveRun }
  | { kind: 'content-required'; run: ActiveRun; missingContentVersion: string };
export interface StartRunRequest { operationId: string; pilotId: string; }

export class RunApplication {
  private commandTail: Promise<void> = Promise.resolve();
  private readonly pending = new Map<string, ActiveRun>();

  constructor(
    private readonly repository: RunRepository,
    private readonly content: ContentPackApplication,
    private readonly generateId: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async bootstrap(): Promise<void> { await this.repository.initialize(); }

  async getRunProjection(pilotId: string): Promise<RunProjection> {
    const run = await this.repository.getActiveRun(pilotId);
    return run ? this.projectRun(run) : { kind: 'no-run' };
  }

  startRun(request: StartRunRequest): Promise<RunProjection> {
    const input = { ...request };
    const operation = this.commandTail.then(() => this.executeStart(input));
    this.commandTail = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async executeStart(request: StartRunRequest): Promise<RunProjection> {
    if (!request.operationId?.trim() || !request.pilotId?.trim()) throw new Error('Start Run requires an operation ID and Pilot ID.');
    const pending = this.pending.get(request.operationId);
    if (pending && pending.pilotId !== request.pilotId) throw new RunOperationConflictError();
    const recorded = await this.repository.getRunForOperation(request.operationId, request.pilotId);
    if (recorded) {
      this.pending.delete(request.operationId);
      return this.projectRun(recorded);
    }

    const existing = await this.repository.getActiveRun(request.pilotId);
    if (existing) {
      const run = await this.repository.createRun({ operationId: request.operationId, run: existing });
      this.pending.delete(request.operationId);
      return this.projectRun(run);
    }

    let candidate = pending;
    if (!candidate) {
      const pack = await this.content.getActivePack();
      if (!pack) throw new RunContentUnavailableError();
      candidate = {
        runId: this.generateId(), pilotId: request.pilotId, phase: 'pre-run-salvage',
        rulesetVersion: pack.compatibleRuleset, contentVersion: pack.contentVersion,
        quota: { total: pack.preRun.collectionQuota, remaining: pack.preRun.collectionQuota },
        starterObjective: { ...pack.preRun.starterObjective }, startedAt: this.now(),
      };
      this.pending.set(request.operationId, candidate);
    }
    if (!(await this.hasPinnedContent(candidate))) throw new RunContentUnavailableError();
    // A failed write retains the original operation, Run ID, versions, quota and time.
    const run = await this.repository.createRun({ operationId: request.operationId, run: candidate });
    this.pending.delete(request.operationId);
    return this.projectRun(run);
  }

  private async hasPinnedContent(run: ActiveRun): Promise<boolean> {
    const pack = await this.content.getPack(run.contentVersion, run.rulesetVersion);
    return !!pack && pack.preRun.collectionQuota === run.quota.total &&
      pack.preRun.starterObjective.targetWord === run.starterObjective.targetWord &&
      pack.preRun.starterObjective.requiresWeaponTile === run.starterObjective.requiresWeaponTile;
  }

  private async projectRun(run: ActiveRun): Promise<RunProjection> {
    if (!(await this.hasPinnedContent(run))) {
      return { kind: 'content-required', run, missingContentVersion: run.contentVersion };
    }
    return { kind: run.phase, run };
  }
}
