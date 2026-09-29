/**
 * CrossDefense Technology Selection PoC-3.
 *
 * Question: Can IndexedDB with Dexie support the approved atomic Unit of Work,
 * idempotent OperationId handling, interrupted-Attempt recovery, and explicit
 * migration rollback primitives in a real browser?
 *
 * This is throwaway prototype code. It is not production implementation.
 */

import Dexie, { type EntityTable } from 'dexie';

const DB_NAME = 'crossdefense-poc3-durability';
const MIGRATION_DB_NAME = 'crossdefense-poc3-migration';
const RECOVERY_SNAPSHOT_KEY = 'crossdefense-poc3-migration-recovery';

export type LifecycleState = 'build' | 'mapAttempt';
export type AttemptStatus = 'running' | 'interrupted' | 'completed';

export interface WorkspaceRecord {
  id: 'workspace';
  schemaVersion: number;
  blueprintCount: number;
  blueprintQuotaRemaining: number;
  lifecycle: LifecycleState;
  lastMigration?: string;
}

export interface OperationRecord {
  operationId: string;
  kind: 'collect-blueprint';
  payloadId: string;
  appliedAt: string;
}

export interface AttemptRecord {
  attemptId: string;
  status: AttemptStatus;
}

export interface Poc3Snapshot {
  workspace: WorkspaceRecord;
  operations: OperationRecord[];
  attempts: AttemptRecord[];
}

class Poc3Database extends Dexie {
  workspace!: EntityTable<WorkspaceRecord, 'id'>;
  operations!: EntityTable<OperationRecord, 'operationId'>;
  attempts!: EntityTable<AttemptRecord, 'attemptId'>;

  constructor(name = DB_NAME) {
    super(name);

    this.version(1).stores({
      workspace: 'id',
      operations: 'operationId',
      attempts: 'attemptId',
    });

    this.version(2)
      .stores({
        workspace: 'id',
        operations: 'operationId',
        attempts: 'attemptId',
      })
      .upgrade(async (transaction) => {
        const workspace = transaction.table<WorkspaceRecord, string>('workspace');
        const current = await workspace.get('workspace');

        if (current) {
          await workspace.put({
            ...current,
            schemaVersion: 2,
            lastMigration: 'v1-to-v2',
          });
        }
      });
  }
}

let db = new Poc3Database();

function initialWorkspace(): WorkspaceRecord {
  return {
    id: 'workspace',
    schemaVersion: 2,
    blueprintCount: 0,
    blueprintQuotaRemaining: 3,
    lifecycle: 'build',
  };
}

async function ensureWorkspace(): Promise<void> {
  await db.open();
  const existing = await db.workspace.get('workspace');

  if (!existing) {
    await db.workspace.add(initialWorkspace());
  }
}

export async function resetPoc3Database(): Promise<void> {
  db.close();
  await Dexie.delete(DB_NAME);
  db = new Poc3Database();
  await ensureWorkspace();
}

export async function bootstrapPoc3(): Promise<Poc3Snapshot> {
  await ensureWorkspace();
  await recoverInterruptedAttempt();
  return getPoc3Snapshot();
}

export async function getPoc3Snapshot(): Promise<Poc3Snapshot> {
  await ensureWorkspace();

  const workspace = await db.workspace.get('workspace');
  if (!workspace) {
    throw new Error('PoC-3 workspace record is missing.');
  }

  return {
    workspace,
    operations: await db.operations.orderBy('operationId').toArray(),
    attempts: await db.attempts.orderBy('attemptId').toArray(),
  };
}

export async function startAttempt(attemptId: string): Promise<void> {
  await ensureWorkspace();

  await db.transaction('rw', db.workspace, db.attempts, async () => {
    const workspace = await db.workspace.get('workspace');
    if (!workspace) {
      throw new Error('PoC-3 workspace record is missing.');
    }

    await db.workspace.put({
      ...workspace,
      lifecycle: 'mapAttempt',
    });

    await db.attempts.put({
      attemptId,
      status: 'running',
    });
  });
}

export interface CollectBlueprintRequest {
  operationId: string;
  payloadId: string;
  injectFailureAfterWorkspaceWrite?: boolean;
}

export async function collectBlueprint(
  request: CollectBlueprintRequest,
): Promise<{ applied: boolean; snapshot: Poc3Snapshot }> {
  await ensureWorkspace();

  const applied = await db.transaction(
    'rw',
    db.workspace,
    db.operations,
    async () => {
      const existingOperation = await db.operations.get(request.operationId);
      if (existingOperation) {
        return false;
      }

      const workspace = await db.workspace.get('workspace');
      if (!workspace) {
        throw new Error('PoC-3 workspace record is missing.');
      }

      if (workspace.blueprintQuotaRemaining <= 0) {
        throw new Error('Blueprint quota is exhausted.');
      }

      await db.workspace.put({
        ...workspace,
        blueprintCount: workspace.blueprintCount + 1,
        blueprintQuotaRemaining: workspace.blueprintQuotaRemaining - 1,
      });

      if (request.injectFailureAfterWorkspaceWrite) {
        throw new Error('Injected transaction failure.');
      }

      await db.operations.add({
        operationId: request.operationId,
        kind: 'collect-blueprint',
        payloadId: request.payloadId,
        appliedAt: new Date(0).toISOString(),
      });

      return true;
    },
  );

  return {
    applied,
    snapshot: await getPoc3Snapshot(),
  };
}

export async function recoverInterruptedAttempt(): Promise<void> {
  await ensureWorkspace();

  await db.transaction('rw', db.workspace, db.attempts, async () => {
    const runningAttempts = await db.attempts
      .filter((attempt) => attempt.status === 'running')
      .toArray();

    if (runningAttempts.length === 0) {
      return;
    }

    for (const attempt of runningAttempts) {
      await db.attempts.put({
        ...attempt,
        status: 'interrupted',
      });
    }

    const workspace = await db.workspace.get('workspace');
    if (!workspace) {
      throw new Error('PoC-3 workspace record is missing.');
    }

    await db.workspace.put({
      ...workspace,
      lifecycle: 'build',
    });
  });
}

interface LegacyWorkspaceRecord {
  id: 'workspace';
  schemaVersion: 1;
  blueprintCount: number;
  blueprintQuotaRemaining: number;
  lifecycle: LifecycleState;
}

async function seedLegacyMigrationDatabase(): Promise<LegacyWorkspaceRecord> {
  await Dexie.delete(MIGRATION_DB_NAME);

  const legacyDb = new Dexie(MIGRATION_DB_NAME);
  legacyDb.version(1).stores({
    workspace: 'id',
  });

  await legacyDb.open();

  const legacy: LegacyWorkspaceRecord = {
    id: 'workspace',
    schemaVersion: 1,
    blueprintCount: 2,
    blueprintQuotaRemaining: 1,
    lifecycle: 'build',
  };

  await legacyDb.table<LegacyWorkspaceRecord, string>('workspace').put(legacy);
  legacyDb.close();

  localStorage.setItem(RECOVERY_SNAPSHOT_KEY, JSON.stringify(legacy));
  return legacy;
}

export async function runFailingMigrationTrial(): Promise<{
  migrationFailed: boolean;
  legacyAfterFailure: LegacyWorkspaceRecord | undefined;
  recoverySnapshot: LegacyWorkspaceRecord | null;
}> {
  await seedLegacyMigrationDatabase();

  const candidate = new Dexie(MIGRATION_DB_NAME);
  candidate.version(1).stores({
    workspace: 'id',
  });
  candidate.version(2).stores({
    workspace: 'id',
  }).upgrade(() => {
    throw new Error('Injected migration failure.');
  });

  let migrationFailed = false;

  try {
    await candidate.open();
  } catch {
    migrationFailed = true;
  } finally {
    candidate.close();
  }

  const legacyReader = new Dexie(MIGRATION_DB_NAME);
  legacyReader.version(1).stores({
    workspace: 'id',
  });
  await legacyReader.open();
  const legacyAfterFailure = await legacyReader
    .table<LegacyWorkspaceRecord, string>('workspace')
    .get('workspace');
  legacyReader.close();

  const recoveryText = localStorage.getItem(RECOVERY_SNAPSHOT_KEY);
  const recoverySnapshot = recoveryText
    ? (JSON.parse(recoveryText) as LegacyWorkspaceRecord)
    : null;

  await Dexie.delete(MIGRATION_DB_NAME);
  localStorage.removeItem(RECOVERY_SNAPSHOT_KEY);

  return {
    migrationFailed,
    legacyAfterFailure,
    recoverySnapshot,
  };
}

export interface Poc3BrowserApi {
  bootstrap(): Promise<Poc3Snapshot>;
  reset(): Promise<void>;
  snapshot(): Promise<Poc3Snapshot>;
  startAttempt(attemptId: string): Promise<void>;
  collectBlueprint(request: CollectBlueprintRequest): ReturnType<typeof collectBlueprint>;
  runFailingMigrationTrial(): ReturnType<typeof runFailingMigrationTrial>;
}

export function createPoc3BrowserApi(): Poc3BrowserApi {
  return {
    bootstrap: bootstrapPoc3,
    reset: resetPoc3Database,
    snapshot: getPoc3Snapshot,
    startAttempt,
    collectBlueprint,
    runFailingMigrationTrial,
  };
}
