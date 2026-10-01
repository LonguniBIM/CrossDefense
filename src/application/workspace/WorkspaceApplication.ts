import {
  requireNickname,
  type PilotProfile,
  type StockAvatarId,
} from '../../domain/workspace/pilot';
import type { WorkspaceRepository } from './WorkspaceRepository';

export interface PilotChooserProjection {
  pilots: PilotProfile[];
  activePilot: PilotProfile | null;
}

export interface CreatePilotRequest {
  operationId: string;
  nickname: string;
  avatarId: StockAvatarId;
}

export class WorkspaceApplication {
  private activePilot: PilotProfile | null = null;

  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly generateId: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async bootstrap(): Promise<PilotChooserProjection> {
    await this.repository.initialize();
    return this.getPilotChooser();
  }

  async getPilotChooser(): Promise<PilotChooserProjection> {
    const pilots = await this.repository.listPilots();
    pilots.sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt));
    return { pilots, activePilot: this.activePilot };
  }

  async createPilot(request: CreatePilotRequest): Promise<{ pilot: PilotProfile; chooser: PilotChooserProjection }> {
    const timestamp = this.now();
    const pilot = await this.repository.createPilot({
      operationId: request.operationId,
      pilot: {
        pilotId: this.generateId(),
        nickname: requireNickname(request.nickname),
        avatarId: request.avatarId,
        createdAt: timestamp,
        lastUsedAt: timestamp,
      },
    });
    return { pilot, chooser: await this.getPilotChooser() };
  }

  async continuePilot(pilotId: string): Promise<PilotChooserProjection> {
    const existing = await this.repository.getPilot(pilotId);
    if (!existing) {
      throw new Error('The selected Pilot no longer exists.');
    }

    this.activePilot = await this.repository.markPilotContinued(pilotId, this.now());
    return this.getPilotChooser();
  }
}
