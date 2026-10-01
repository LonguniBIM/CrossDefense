import type { PilotProfile } from '../../domain/workspace/pilot';
import type {
  CreatePilotRecord,
  WorkspaceRepository,
} from '../../application/workspace/WorkspaceRepository';

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly pilots = new Map<string, PilotProfile>();
  private readonly operations = new Map<string, string>();

  async initialize(): Promise<void> {}

  async listPilots(): Promise<PilotProfile[]> {
    return [...this.pilots.values()].map((pilot) => ({ ...pilot }));
  }

  async getPilot(pilotId: string): Promise<PilotProfile | undefined> {
    const pilot = this.pilots.get(pilotId);
    return pilot ? { ...pilot } : undefined;
  }

  async createPilot(request: CreatePilotRecord): Promise<PilotProfile> {
    const previousPilotId = this.operations.get(request.operationId);
    if (previousPilotId) {
      const previous = this.pilots.get(previousPilotId);
      if (!previous) {
        throw new Error('Create Pilot operation points to missing durable data.');
      }
      return { ...previous };
    }

    this.pilots.set(request.pilot.pilotId, { ...request.pilot });
    this.operations.set(request.operationId, request.pilot.pilotId);
    return { ...request.pilot };
  }

  async markPilotContinued(pilotId: string, lastUsedAt: string): Promise<PilotProfile> {
    const current = this.pilots.get(pilotId);
    if (!current) {
      throw new Error('The selected Pilot no longer exists.');
    }
    const updated = { ...current, lastUsedAt };
    this.pilots.set(pilotId, updated);
    return { ...updated };
  }
}
