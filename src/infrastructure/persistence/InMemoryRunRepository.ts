import { RunOperationConflictError, type CreateRunRecord, type RunRepository } from '../../application/run/RunRepository';
import type { ActiveRun } from '../../domain/run/run';
import type { BuildContent } from '../../domain/content/contentPack';
import { applyBuildOperation, buildOperationFingerprint, type BuildOperation, type BuildEditOperation } from '../../domain/build/buildEditing';
import { PlacementRejection, type PlacementOperation } from '../../domain/build/shipBuild';
import { applySalvageOperation, salvageOperationFingerprint, type SalvageOperation } from '../../domain/preRun/salvage';

interface RunReceipt { pilotId: string; runId: string; kind: 'start-run'; }

export class InMemoryRunRepository implements RunRepository {
  protected readonly runsByPilot = new Map<string, ActiveRun>();
  private readonly operations = new Map<string, RunReceipt>();
  private readonly salvageReceipts = new Map<string, string>();
  private readonly placementReceipts = new Map<string, string>();

  async initialize(): Promise<void> {}
  async getActiveRun(pilotId: string): Promise<ActiveRun | undefined> {
    return structuredClone(this.runsByPilot.get(pilotId));
  }
  async getRunForOperation(operationId: string, pilotId: string): Promise<ActiveRun | undefined> {
    return this.resolveReceipt(operationId, pilotId);
  }

  async createRun(request: CreateRunRecord): Promise<ActiveRun> {
    const previous = this.resolveReceipt(request.operationId, request.run.pilotId);
    if (previous) return previous;
    const run = this.runsByPilot.get(request.run.pilotId) ?? structuredClone(request.run);
    if (run.quota.remaining < 0 || run.quota.remaining > run.quota.total) throw new Error('Run quota is invalid.');
    // No awaits between validation and publication: this is one atomic memory operation.
    this.runsByPilot.set(run.pilotId, run);
    this.operations.set(request.operationId, { pilotId: run.pilotId, runId: run.runId, kind: 'start-run' });
    return structuredClone(run);
  }

  private resolveReceipt(operationId: string, pilotId: string): ActiveRun | undefined {
    const receipt = this.operations.get(operationId);
    if (!receipt) return undefined;
    if (receipt.pilotId !== pilotId || receipt.kind !== 'start-run') throw new RunOperationConflictError();
    const run = this.runsByPilot.get(pilotId);
    if (!run || run.runId !== receipt.runId) throw new Error('Start Run operation references missing or inconsistent durable data.');
    return structuredClone(run);
  }

  async applySalvage(request: SalvageOperation): Promise<ActiveRun> {
    const input = structuredClone(request);
    const signature = salvageOperationFingerprint(input);
    const current = this.runsByPilot.get(input.pilotId);
    if (!current || current.runId !== input.runId) throw new Error('Pre-Run references a missing Pilot or Run.');
    const receipt = this.salvageReceipts.get(input.operationId);
    if (receipt !== undefined) {
      if (receipt !== signature) throw new RunOperationConflictError();
      return structuredClone(current);
    }
    const next = applySalvageOperation(current, input);
    this.runsByPilot.set(next.pilotId, structuredClone(next));
    this.salvageReceipts.set(input.operationId, signature);
    return structuredClone(next);
  }

  async applyPlacement(request: PlacementOperation, content: BuildContent): Promise<ActiveRun> {
    return this.commitBuild(request, content);
  }

  async applyBuildEdit(request: BuildEditOperation, content: BuildContent): Promise<ActiveRun> {
    return this.commitBuild(request, content);
  }

  private async commitBuild(request: BuildOperation, content: BuildContent): Promise<ActiveRun> {
    const input = structuredClone(request), definition = structuredClone(content);
    const fingerprint = buildOperationFingerprint(input);
    const current = this.runsByPilot.get(input.pilotId);
    if (!current || current.runId !== input.runId) throw new PlacementRejection('TARGET_MISMATCH', 'Placement targets a missing or different Run.');
    const receipt = this.placementReceipts.get(input.operationId);
    if (receipt !== undefined) {
      if (receipt !== fingerprint) throw new RunOperationConflictError();
      return structuredClone(current);
    }
    const next = applyBuildOperation(current, definition, input);
    this.runsByPilot.set(input.pilotId, structuredClone(next));
    this.placementReceipts.set(input.operationId, fingerprint);
    return structuredClone(next);
  }

  async countRuns(): Promise<number> { return this.runsByPilot.size; }
}
