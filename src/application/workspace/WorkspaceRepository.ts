import type { PilotProfile } from '../../domain/workspace/pilot';

export interface CreatePilotRecord {
  operationId: string;
  pilot: PilotProfile;
}

export interface WorkspaceRepository {
  initialize(): Promise<void>;
  listPilots(): Promise<PilotProfile[]>;
  getPilot(pilotId: string): Promise<PilotProfile | undefined>;
  createPilot(request: CreatePilotRecord): Promise<PilotProfile>;
  markPilotContinued(pilotId: string, lastUsedAt: string): Promise<PilotProfile>;
}
