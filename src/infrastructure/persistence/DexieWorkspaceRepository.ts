import Dexie, { type EntityTable } from 'dexie';
import { z } from 'zod';
import type { PilotProfile } from '../../domain/workspace/pilot';
import type {
  CreatePilotRecord,
  WorkspaceRepository,
} from '../../application/workspace/WorkspaceRepository';

const DB_NAME = 'crossdefense-player-data';
const WORKSPACE_KEY = 'workspace';
const CURRENT_SCHEMA_VERSION = 1;

const PilotSchema = z.object({
  pilotId: z.string().min(1),
  nickname: z.string().min(1),
  avatarId: z.enum(['pilot-blue', 'pilot-gold', 'pilot-violet']),
  createdAt: z.string().min(1),
  lastUsedAt: z.string().min(1),
});

const WorkspaceMetaSchema = z.object({
  key: z.literal(WORKSPACE_KEY),
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
});

interface WorkspaceMetaRecord {
  key: typeof WORKSPACE_KEY;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
}

interface OperationRecord {
  operationId: string;
  pilotId: string;
  kind: 'create-pilot';
}

class CrossDefenseDatabase extends Dexie {
  workspace!: EntityTable<WorkspaceMetaRecord, 'key'>;
  pilots!: EntityTable<PilotProfile, 'pilotId'>;
  operations!: EntityTable<OperationRecord, 'operationId'>;

  constructor() {
    super(DB_NAME);
    this.version(CURRENT_SCHEMA_VERSION).stores({
      workspace: 'key',
      pilots: 'pilotId, lastUsedAt',
      operations: 'operationId, pilotId',
    });
  }
}

export class DexieWorkspaceRepository implements WorkspaceRepository {
  private readonly db = new CrossDefenseDatabase();

  async initialize(): Promise<void> {
    await this.db.open();
    await this.db.transaction('rw', this.db.workspace, this.db.pilots, this.db.operations, async () => {
      const workspace = await this.db.workspace.get(WORKSPACE_KEY);
      const pilots = await this.db.pilots.toArray();
      const operationCount = await this.db.operations.count();

      if (!workspace) {
        if (pilots.length > 0 || operationCount > 0) {
          throw new Error('Workspace metadata is missing while durable player data exists.');
        }
        await this.db.workspace.add({ key: WORKSPACE_KEY, schemaVersion: CURRENT_SCHEMA_VERSION });
      } else {
        WorkspaceMetaSchema.parse(workspace);
      }

      for (const pilot of pilots) {
        PilotSchema.parse(pilot);
      }
    });
  }

  async listPilots(): Promise<PilotProfile[]> {
    const pilots = await this.db.pilots.toArray();
    return pilots.map((pilot) => PilotSchema.parse(pilot));
  }

  async getPilot(pilotId: string): Promise<PilotProfile | undefined> {
    const pilot = await this.db.pilots.get(pilotId);
    return pilot ? PilotSchema.parse(pilot) : undefined;
  }

  async createPilot(request: CreatePilotRecord): Promise<PilotProfile> {
    return this.db.transaction('rw', this.db.pilots, this.db.operations, async () => {
      const prior = await this.db.operations.get(request.operationId);
      if (prior) {
        const pilot = await this.db.pilots.get(prior.pilotId);
        if (!pilot) {
          throw new Error('Create Pilot operation points to missing durable data.');
        }
        return PilotSchema.parse(pilot);
      }

      const pilot = PilotSchema.parse(request.pilot);
      await this.db.pilots.add(pilot);
      await this.db.operations.add({
        operationId: request.operationId,
        pilotId: pilot.pilotId,
        kind: 'create-pilot',
      });
      return pilot;
    });
  }

  async markPilotContinued(pilotId: string, lastUsedAt: string): Promise<PilotProfile> {
    return this.db.transaction('rw', this.db.pilots, async () => {
      const pilot = await this.db.pilots.get(pilotId);
      if (!pilot) {
        throw new Error('The selected Pilot no longer exists.');
      }
      const updated = PilotSchema.parse({ ...pilot, lastUsedAt });
      await this.db.pilots.put(updated);
      return updated;
    });
  }
}
