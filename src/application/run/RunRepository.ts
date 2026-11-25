import type { ActiveRun } from '../../domain/run/run';
import type { BuildContent } from '../../domain/content/contentPack';
import type { BuildEditOperation } from '../../domain/build/buildEditing';
import type { PlacementOperation } from '../../domain/build/shipBuild';
import type { SalvageOperation } from '../../domain/preRun/salvage';

export interface CreateRunRecord { operationId: string; run: ActiveRun; }
export interface RunRepository {
  initialize(): Promise<void>;
  getActiveRun(pilotId: string): Promise<ActiveRun | undefined>;
  getRunForOperation(operationId: string, pilotId: string): Promise<ActiveRun | undefined>;
  /** One transaction binds the operation to its Pilot and returns or creates one Run. */
  createRun(request: CreateRunRecord): Promise<ActiveRun>;
  /** Atomically commit Pre-Run state and a fully bound idempotency receipt. */
  applySalvage(request: SalvageOperation): Promise<ActiveRun>;
  /** Content is resolved by Application; this transaction owns positions and the exact receipt. */
  applyPlacement(request: PlacementOperation, content: BuildContent): Promise<ActiveRun>;
  /** Validated Return/history edits use the same atomic layout/receipt boundary. */
  applyBuildEdit(request: BuildEditOperation, content: BuildContent): Promise<ActiveRun>;
}

export class RunOperationConflictError extends Error {
  readonly code = 'OPERATION_CONFLICT';
  constructor() { super('Start Run operation belongs to a different Pilot or operation kind.'); }
}
export class RunContentUnavailableError extends Error {
  readonly code = 'CONTENT_UNAVAILABLE';
  constructor() { super('No compatible validated Content Pack is available for this Start Run request.'); }
}
