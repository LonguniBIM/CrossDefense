import type { ReviewRepository, ReviewState } from '../../application/review/ReviewRepository';
import { applyReviewCommand, ensureReviewOccurrence, reviewCommandFingerprint, ensureReviewFingerprint, assertReviewHistory, ReviewRejection,
  type EnsureReviewCommand, type ReviewCommand, type ReviewOccurrence, type ReviewOutcomeLink, type ReviewRewardReceipt, type ReviewOperationReceipt } from '../../domain/review/occurrence';
import { ReviewOccurrenceSchema, ReviewLinkSchema, ReviewRewardSchema, ReviewOperationSchema, validateReviewOperations } from './ReviewCodec';
import { validateContentPack } from '../../application/content/ContentPackCodec';
import type { ResultsRepository, ResultsState } from '../../application/results/ResultsRepository';
import { emptyEconomy, assertEconomyLedger, applyOutcomeSettlement, outcomeFingerprint, settlementFingerprint, ResultRejection, type PilotEconomy, type OutcomeSettlement, type OutcomeOperationReceipt, type SettleOutcomeCommand } from '../../domain/results/settlement';
import { applyCargoResolution, cargoResolutionFingerprint, type CargoOperationReceipt, type CargoResolutionCommand } from '../../domain/results/salvageResolution';
import { CargoStateSchema, PilotEconomySchema, OutcomeSettlementSchema, OutcomeOperationSchema, CargoOperationSchema, validateSettlement } from './ResultsCodec';
import type { CombatRepository,CombatReceipt } from '../../application/combat/CombatRepository';
import { applyCombatCommit,makeCombatOutcome,combatCommitFingerprint,type CombatCommit,type CombatOutcome,type CombatCommitResult } from '../../domain/combat/collection';
import { CombatOutcomeSchema,CombatReceiptSchema } from './CombatCodec';
import type { AttemptRepository, AttemptReceipt } from '../../application/attempt/AttemptRepository';
import { AttemptEnvelopeSchema, AttemptReceiptSchema, RetainedTileSchema } from './AttemptCodec';
import { DIFFICULTIES } from '../../domain/attempt/rules';
import { applyStartAttempt, applyEndAttempt, assertAttemptState, attemptFingerprint, startRequestFingerprint, AttemptRejection, type StartAttemptCommand, type StartAttemptRequest, type EndAttemptCommand, type DifficultyCommand } from '../../domain/attempt/attempt';
import { applyBuildOperation, buildOperationFingerprint, type BuildOperation, type BuildEditOperation } from '../../domain/build/buildEditing';
import { assertBuildState, PlacementRejection, type PlacementOperation } from '../../domain/build/shipBuild';
import type { BuildContent, ContentPackManifest } from '../../domain/content/contentPack';
import { applySalvageOperation, assertSalvageState, salvageOperationFingerprint, type SalvageOperation } from '../../domain/preRun/salvage';
import { MODULE_SUBTYPES } from '../../domain/content/contentPack';
import { RunOperationConflictError } from '../../application/run/RunRepository';
import Dexie, { type EntityTable } from 'dexie';
import { z } from 'zod';
import type { PilotProfile } from '../../domain/workspace/pilot';
import type { ActiveRun } from '../../domain/run/run';
import type {
  CreatePilotRecord,
  WorkspaceRepository,
} from '../../application/workspace/WorkspaceRepository';
import type {
  CreateRunRecord,
  RunRepository,
} from '../../application/run/RunRepository';

const DB_NAME = 'crossdefense-player-data';
const WORKSPACE_KEY = 'workspace';
const CURRENT_SCHEMA_VERSION = 9;

const PilotSchema = z.object({
  pilotId: z.string().min(1),
  nickname: z.string().min(1),
  avatarId: z.enum(['pilot-blue', 'pilot-gold', 'pilot-violet']),
  createdAt: z.string().min(1),
  lastUsedAt: z.string().min(1),
  lastDifficulty: z.enum(DIFFICULTIES).optional(),
});

const SalvageSchema = z.object({
  seed: z.string().min(1),
  order: z.array(z.object({ id: z.string().min(1), letter: z.string().regex(/^[A-Z]$/), subtype: z.enum(MODULE_SUBTYPES) })),
  collectedIds: z.array(z.string().min(1)), revision: z.number().int().nonnegative(), completed: z.boolean(),
});
const ShipBuildSchema = z.object({
  hullId: z.string().min(1), revision: z.number().int().nonnegative(),
  placements: z.array(z.object({ tileId: z.string().min(1), x: z.number().int().min(0).max(4), y: z.number().int().min(0).max(4) }).strict()).max(13),
}).strict();
const RunSchema = z.object({
  runId: z.string().min(1),
  pilotId: z.string().min(1),
  phase: z.enum(['pre-run-salvage', 'build', 'attempt']),
  attempt: AttemptEnvelopeSchema.optional(),
  salvageBuffer: z.array(RetainedTileSchema).optional(),
  cargo: CargoStateSchema.optional(),
  economyRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  clearedMapIds: z.array(z.string().min(1)).optional(),
  salvage: SalvageSchema.optional(),
  shipBuild: ShipBuildSchema.optional(),
  rulesetVersion: z.string().min(1),
  contentVersion: z.string().min(1),
  quota: z.object({
    total: z.number().int().positive(),
    remaining: z.number().int().nonnegative(),
  }),
  starterObjective: z.object({
    targetWord: z.string().min(3),
    requiresWeaponTile: z.literal(true),
  }),
  startedAt: z.string().min(1),
}).refine((run) => run.quota.remaining <= run.quota.total, {
  message: 'Run quota remaining cannot exceed total quota.',
}).refine(run => { try { assertSalvageState(run); assertBuildState(run); assertAttemptState(run); return true; } catch { return false; } }, { message: 'Pre-Run state violates committed identity/quota/phase invariants.' });

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

interface RunOperationRecord {
  operationId: string;
  pilotId: string;
  runId: string;
  kind: 'start-run';
}

interface SalvageReceipt { operationId: string; pilotId: string; runId: string; fingerprint: string; kind: SalvageOperation['kind']; }

interface BuildReceipt { operationId: string; pilotId: string; runId: string; fingerprint: string; kind: BuildOperation['kind']; }

/** Frozen Review evidence must retain the exact saved Pilot, Run, outcome and settlement owners. */
function validateReviewDurability(runs: readonly ActiveRun[], occurrences: readonly ReviewOccurrence[], links: readonly ReviewOutcomeLink[],
  rewards: readonly ReviewRewardReceipt[], operations: readonly ReviewOperationReceipt[], outcomes: readonly CombatOutcome[], settlements: readonly OutcomeSettlement[]): void {
  assertReviewHistory(occurrences, links, rewards, outcomes, settlements);
  for (const occurrence of occurrences) {
    const run = runs.find(value => value.runId === occurrence.sourceRunId && value.pilotId === occurrence.pilotId);
    if (!run || run.contentVersion !== occurrence.contentVersion || run.rulesetVersion !== occurrence.rulesetVersion ||
        run.attempt?.startup.contentDigest !== occurrence.contentDigest) throw Error('Review occurrence lost its original Run content pins.');
  }
  for (const link of links) {
    const run = runs.find(value => value.runId === link.runId && value.pilotId === link.pilotId);
    if (!run || run.contentVersion !== link.contentVersion || run.rulesetVersion !== link.rulesetVersion ||
        run.attempt?.startup.contentDigest !== link.contentDigest) throw Error('Review Attempt link has inconsistent Run ownership or pins.');
  }
  for (const receipt of [...rewards, ...operations]) if (!runs.some(run => run.runId === receipt.runId && run.pilotId === receipt.pilotId)) throw Error('Review receipt has inconsistent Run ownership.');
  validateReviewOperations(occurrences, links, operations);
}

class CrossDefenseDatabase extends Dexie {
  workspace!: EntityTable<WorkspaceMetaRecord, 'key'>;
  pilots!: EntityTable<PilotProfile, 'pilotId'>;
  operations!: EntityTable<OperationRecord, 'operationId'>;
  runs!: EntityTable<ActiveRun, 'runId'>;
  runOperations!: EntityTable<RunOperationRecord, 'operationId'>;
  salvageOperations!: EntityTable<SalvageReceipt, 'operationId'>;
  buildOperations!: EntityTable<BuildReceipt, 'operationId'>;
  attemptOperations!: EntityTable<AttemptReceipt, 'operationId'>;
  combatOperations!: EntityTable<CombatReceipt, 'operationId'>;
  combatOutcomes!: EntityTable<CombatOutcome, 'attemptId'>;
  pilotEconomies!: EntityTable<PilotEconomy, 'pilotId'>;
  outcomeSettlements!: EntityTable<OutcomeSettlement, 'attemptId'>;
  outcomeOperations!: EntityTable<OutcomeOperationReceipt, 'operationId'>;
  cargoOperations!: EntityTable<CargoOperationReceipt, 'operationId'>;
  reviewOccurrences!: EntityTable<ReviewOccurrence, 'occurrenceId'>;
  reviewLinks!: EntityTable<ReviewOutcomeLink, 'attemptId'>;
  reviewRewards!: EntityTable<ReviewRewardReceipt, 'occurrenceId'>;
  reviewOperations!: EntityTable<ReviewOperationReceipt, 'operationId'>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      workspace: 'key',
      pilots: 'pilotId, lastUsedAt',
      operations: 'operationId, pilotId',
    });

    this.version(2)
      .stores({
        workspace: 'key',
        pilots: 'pilotId, lastUsedAt',
        operations: 'operationId, pilotId',
        runs: 'runId, &pilotId, contentVersion, rulesetVersion',
        runOperations: 'operationId, pilotId, runId',
      })
      .upgrade(async (transaction) => {
        const workspace = transaction.table('workspace');
        const roots = await workspace.toArray();
        const pilots = await transaction.table('pilots').toArray();
        const operations = await transaction.table('operations').toArray();
        if (roots.length === 0 && pilots.length === 0 && operations.length === 0) return;
        if (roots.length !== 1) throw new Error('Legacy Workspace root is missing or ambiguous.');
        const legacy = z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(1) }).passthrough().parse(roots[0]);
        const pilotIds = new Set(pilots.map(pilot => PilotSchema.parse(pilot).pilotId));
        for (const raw of operations) {
          const operation = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), kind: z.literal('create-pilot') }).parse(raw);
          if (!pilotIds.has(operation.pilotId)) throw new Error('Legacy operation references a missing Pilot.');
        }
        const candidate = { ...legacy, schemaVersion: 2 };
        z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(2) }).parse(candidate);
        // The version-change transaction stages this additive upgrade. Any failure
        // aborts both schema creation and the metadata write, preserving v1.
        await workspace.put(candidate);
      });

    this.version(3).stores({
      workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId',
      runs: 'runId, &pilotId, contentVersion, rulesetVersion', runOperations: 'operationId, pilotId, runId',
      salvageOperations: 'operationId, pilotId, runId',
    }).upgrade(async transaction => {
      const roots = await transaction.table('workspace').toArray();
      const pilots = await transaction.table('pilots').toArray();
      const runs = await transaction.table('runs').toArray();
      const receipts = await transaction.table('runOperations').toArray();
      const pilotOperations = await transaction.table('operations').toArray();
      if (!roots.length && !pilots.length && !runs.length && !receipts.length && !pilotOperations.length) return;
      if (roots.length !== 1) throw new Error('Version 2 Workspace root is missing or ambiguous.');
      const root = z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(2) }).passthrough().parse(roots[0]);
      const pilotIds = new Set(pilots.map(pilot => PilotSchema.parse(pilot).pilotId));
      const runOwners = new Map(runs.map(raw => { const run = RunSchema.parse(raw); if (!pilotIds.has(run.pilotId)) throw new Error('Run references a missing Pilot.'); return [run.runId, run.pilotId]; }));
      for (const raw of receipts) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), runId: z.string().min(1), kind: z.literal('start-run') }).parse(raw);
        if (runOwners.get(receipt.runId) !== receipt.pilotId) throw new Error('Run receipt references inconsistent player data.');
      }
      for (const raw of pilotOperations) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), kind: z.literal('create-pilot') }).parse(raw);
        if (!pilotIds.has(receipt.pilotId)) throw new Error('Pilot receipt references missing player data.');
      }
      // Historical migration must retain its version even as later schemas are added.
      const candidate = { ...root, schemaVersion: 3 };
      z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(3) }).parse(candidate);
      await transaction.table('workspace').put(candidate);
    });

    this.version(4).stores({
      workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId',
      runs: 'runId, &pilotId, contentVersion, rulesetVersion', runOperations: 'operationId, pilotId, runId',
      salvageOperations: 'operationId, pilotId, runId', buildOperations: 'operationId, pilotId, runId',
    }).upgrade(async transaction => {
      const roots = await transaction.table('workspace').toArray();
      const pilots = await transaction.table('pilots').toArray();
      const runs = await transaction.table('runs').toArray();
      const starts = await transaction.table('runOperations').toArray();
      const salvages = await transaction.table('salvageOperations').toArray();
      const operations = await transaction.table('operations').toArray();
      if (![roots, pilots, runs, starts, salvages, operations].some(rows => rows.length)) return;
      if (roots.length !== 1) throw new Error('Version 3 Workspace root is missing or ambiguous.');
      const root = z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(3) }).passthrough().parse(roots[0]);
      const pilotIds = new Set(pilots.map(raw => PilotSchema.parse(raw).pilotId));
      const owners = new Map(runs.map(raw => { const run = RunSchema.parse(raw); if (!pilotIds.has(run.pilotId)) throw new Error('Legacy Run references a missing Pilot.'); return [run.runId, run.pilotId]; }));
      for (const raw of starts) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), runId: z.string().min(1), kind: z.literal('start-run') }).parse(raw);
        if (owners.get(receipt.runId) !== receipt.pilotId) throw new Error('Legacy Start receipt has an inconsistent owner.');
      }
      for (const raw of salvages) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), runId: z.string().min(1), kind: z.enum(['initialize', 'collect', 'finish']), fingerprint: z.string().min(1) }).parse(raw);
        if (owners.get(receipt.runId) !== receipt.pilotId) throw new Error('Legacy Pre-Run receipt has an inconsistent owner.');
      }
      for (const raw of operations) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), kind: z.literal('create-pilot') }).parse(raw);
        if (!pilotIds.has(receipt.pilotId)) throw new Error('Legacy Pilot receipt has a missing owner.');
      }
      const candidate = { ...root, schemaVersion: 4 };
      z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(4) }).parse(candidate);
      // Additive transaction: no existing Run or content pin is rewritten.
      await transaction.table('workspace').put(candidate);
    });

    // Version 5 admits Return/Undo/Redo receipts. History stacks remain transient;
    // existing positions, receipts, ownership and content pins are not rewritten.
    this.version(5).stores({
      workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId',
      runs: 'runId, &pilotId, contentVersion, rulesetVersion', runOperations: 'operationId, pilotId, runId',
      salvageOperations: 'operationId, pilotId, runId', buildOperations: 'operationId, pilotId, runId',
    }).upgrade(async transaction => {
      const roots = await transaction.table('workspace').toArray();
      const pilots = await transaction.table('pilots').toArray();
      const runs = await transaction.table('runs').toArray();
      const starts = await transaction.table('runOperations').toArray();
      const salvages = await transaction.table('salvageOperations').toArray();
      const builds = await transaction.table('buildOperations').toArray();
      const operations = await transaction.table('operations').toArray();
      if (![roots, pilots, runs, starts, salvages, builds, operations].some(rows => rows.length)) return;
      if (roots.length !== 1) throw new Error('Version 4 Workspace root is missing or ambiguous.');
      const root = z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(4) }).passthrough().parse(roots[0]);
      const pilotIds = new Set(pilots.map(raw => PilotSchema.parse(raw).pilotId));
      const owners = new Map(runs.map(raw => { const run = RunSchema.parse(raw); if (!pilotIds.has(run.pilotId)) throw new Error('Legacy Run references a missing Pilot.'); return [run.runId, run.pilotId]; }));
      for (const [rows, kind, fingerprint] of [[starts, z.literal('start-run'), false], [salvages, z.enum(['initialize', 'collect', 'finish']), true], [builds, z.literal('place'), true]] as const) {
        for (const raw of rows) {
          const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), runId: z.string().min(1), kind }).parse(raw);
          if (fingerprint) z.object({ fingerprint: z.string().min(1) }).parse(raw);
          if (owners.get(receipt.runId) !== receipt.pilotId) throw new Error('Version 4 receipt references inconsistent ownership.');
        }
      }
      for (const raw of operations) {
        const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), kind: z.literal('create-pilot') }).parse(raw);
        if (!pilotIds.has(receipt.pilotId)) throw new Error('Version 4 Pilot receipt has a missing owner.');
      }
      const candidate = { ...root, schemaVersion: 5 };
      z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(5) }).parse(candidate);
      await transaction.table('workspace').put(candidate);
    });
    // Additive v6: preserve every old row; new lifecycle receipts and optional inputs only.
    this.version(6).stores({
      workspace:'key',pilots:'pilotId, lastUsedAt',operations:'operationId, pilotId',
      runs:'runId, &pilotId, contentVersion, rulesetVersion',runOperations:'operationId, pilotId, runId',
      salvageOperations:'operationId, pilotId, runId',buildOperations:'operationId, pilotId, runId',attemptOperations:'operationId, pilotId, runId, attemptId',
    }).upgrade(async transaction=>{
      const names=['workspace','pilots','runs','operations','runOperations','salvageOperations','buildOperations'];
      const rows=await Promise.all(names.map(name=>transaction.table(name).toArray()));
      if (!rows.some(items=>items.length)) return;
      const [roots,pilots,runs,operations,starts,salvages,builds]=rows;
      if (roots!.length!==1) throw Error('Version 5 Workspace root is missing or ambiguous.');
      const root=z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(5)}).passthrough().parse(roots![0]);
      const pilotIds=new Set(pilots!.map(raw=>PilotSchema.parse(raw).pilotId));
      const owners=new Map(runs!.map(raw=>{ if (raw.attempt!==undefined || raw.phase==='attempt') throw Error('Version 5 cannot contain Attempt data.'); const run=RunSchema.parse(raw); if(!pilotIds.has(run.pilotId)) throw Error('Version 5 Run owner is missing.'); return [run.runId,run.pilotId]; }));
      for(const [entries,kind,fingerprint] of [[starts!,z.literal('start-run'),false],[salvages!,z.enum(['initialize','collect','finish']),true],[builds!,z.enum(['place','return','undo','redo']),true]] as const) {
        for(const raw of entries) {
          const receipt=z.object({operationId:z.string().min(1),pilotId:z.string().min(1),runId:z.string().min(1),kind}).parse(raw);
          if(fingerprint) z.object({fingerprint:z.string().min(1)}).parse(raw);
          if(owners.get(receipt.runId)!==receipt.pilotId) throw Error('Version 5 receipt owner is inconsistent.');
        }
      }
      for(const raw of operations!) { const receipt=z.object({operationId:z.string().min(1),pilotId:z.string().min(1),kind:z.literal('create-pilot')}).parse(raw); if(!pilotIds.has(receipt.pilotId)) throw Error('Version 5 Pilot receipt owner is missing.'); }
      await transaction.table('workspace').put(z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(6)}).parse({...root,schemaVersion:6}));
    });
    // v7 is additive: no old content pin, Run, layout, preference or receipt is rewritten.
    this.version(7).stores({
      workspace:'key',pilots:'pilotId, lastUsedAt',operations:'operationId, pilotId',
      runs:'runId, &pilotId, contentVersion, rulesetVersion',runOperations:'operationId, pilotId, runId',
      salvageOperations:'operationId, pilotId, runId',buildOperations:'operationId, pilotId, runId',attemptOperations:'operationId, pilotId, runId, attemptId',
      combatOperations:'operationId, pilotId, runId, attemptId',combatOutcomes:'attemptId, pilotId, runId',
    }).upgrade(async transaction=>{
      const names=['workspace','pilots','runs','operations','runOperations','salvageOperations','buildOperations','attemptOperations'];
      const rows=await Promise.all(names.map(name=>transaction.table(name).toArray()));
      if(!rows.some(items=>items.length))return;
      const [roots,pilots,runs,operations,starts,salvages,builds,attempts]=rows;
      if(roots!.length!==1)throw Error('Version 6 Workspace root is missing or ambiguous.');
      const root=z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(6)}).passthrough().parse(roots![0]);
      const pilotIds=new Set(pilots!.map(raw=>PilotSchema.parse(raw).pilotId));
      const owners=new Map(runs!.map(raw=>{
        if(raw.attempt?.startup?.capability==='combat'||raw.attempt?.combatProgress!==undefined)throw Error('Version 6 cannot contain combat progress.');
        const run=RunSchema.parse(raw);if(!pilotIds.has(run.pilotId))throw Error('Version 6 Run owner is missing.');return [run.runId,run.pilotId];
      }));
      for(const [entries,kind,fingerprint] of [[starts!,z.literal('start-run'),false],[salvages!,z.enum(['initialize','collect','finish']),true],[builds!,z.enum(['place','return','undo','redo']),true]] as const){
        for(const raw of entries){
          const receipt=z.object({operationId:z.string().min(1),pilotId:z.string().min(1),runId:z.string().min(1),kind}).parse(raw);
          if(fingerprint)z.object({fingerprint:z.string().min(1)}).parse(raw);
          if(owners.get(receipt.runId)!==receipt.pilotId)throw Error('Version 6 receipt owner is inconsistent.');
        }
      }
      for(const raw of attempts!){const receipt=AttemptReceiptSchema.parse(raw);if(!pilotIds.has(receipt.pilotId)||receipt.runId!==undefined&&owners.get(receipt.runId)!==receipt.pilotId)throw Error('Version 6 Attempt receipt owner is inconsistent.');}
      for(const raw of operations!){const receipt=z.object({operationId:z.string().min(1),pilotId:z.string().min(1),kind:z.literal('create-pilot')}).parse(raw);if(!pilotIds.has(receipt.pilotId))throw Error('Version 6 Pilot receipt owner is missing.');}
      await transaction.table('workspace').put(z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(7)}).parse({...root,schemaVersion:7}));
    });
    // v8 adds settlement/Cargo receipt owners. Existing rows and frozen outcomes stay byte-for-byte intact.
    this.version(8).stores({
      workspace:'key', pilots:'pilotId, lastUsedAt', operations:'operationId, pilotId',
      runs:'runId, &pilotId, contentVersion, rulesetVersion', runOperations:'operationId, pilotId, runId',
      salvageOperations:'operationId, pilotId, runId', buildOperations:'operationId, pilotId, runId',
      attemptOperations:'operationId, pilotId, runId, attemptId', combatOperations:'operationId, pilotId, runId, attemptId',
      combatOutcomes:'attemptId, pilotId, runId', pilotEconomies:'pilotId',
      outcomeSettlements:'attemptId, pilotId, runId', outcomeOperations:'operationId, pilotId, runId, attemptId',
      cargoOperations:'operationId, pilotId, runId',
    }).upgrade(async transaction => {
      const names = ['workspace','pilots','runs','operations','runOperations','salvageOperations','buildOperations','attemptOperations','combatOperations','combatOutcomes'];
      const rows = await Promise.all(names.map(name => transaction.table(name).toArray()));
      if (!rows.some(entries => entries.length)) return;
      const [roots,pilots,runs,operations,starts,salvages,builds,attempts,combats,outcomes] = rows;
      if (roots!.length !== 1) throw Error('Version 7 Workspace root is missing or ambiguous.');
      const root = z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(7)}).passthrough().parse(roots![0]);
      const pilotIds = new Set(pilots!.map(raw => PilotSchema.parse(raw).pilotId));
      const owners = new Map(runs!.map(raw => {
        if (raw.cargo !== undefined || raw.economyRevision !== undefined || raw.clearedMapIds !== undefined) throw Error('Version 7 cannot contain v8 retained Cargo or settlement progress.');
        const run = RunSchema.parse(raw); if (!pilotIds.has(run.pilotId)) throw Error('Version 7 Run owner is missing.');
        return [run.runId,run.pilotId];
      }));
      for (const [entries,kind,fingerprint] of [[starts!,z.literal('start-run'),false],[salvages!,z.enum(['initialize','collect','finish']),true],[builds!,z.enum(['place','return','undo','redo']),true]] as const) {
        for (const raw of entries) {
          const receipt = z.object({operationId:z.string().min(1),pilotId:z.string().min(1),runId:z.string().min(1),kind}).parse(raw);
          if (fingerprint) z.object({fingerprint:z.string().min(1)}).parse(raw);
          if (owners.get(receipt.runId) !== receipt.pilotId) throw Error('Version 7 receipt owner is inconsistent.');
        }
      }
      for (const raw of operations!) {const receipt=z.object({operationId:z.string().min(1),pilotId:z.string().min(1),kind:z.literal('create-pilot')}).parse(raw);if(!pilotIds.has(receipt.pilotId))throw Error('Version 7 Pilot receipt has no owner.');}
      for (const raw of attempts!) {const receipt=AttemptReceiptSchema.parse(raw);if(!pilotIds.has(receipt.pilotId)||receipt.runId!==undefined&&owners.get(receipt.runId)!==receipt.pilotId)throw Error('Version 7 Attempt receipt owner is inconsistent.');}
      for (const raw of combats!) {const receipt=CombatReceiptSchema.parse(raw);if(owners.get(receipt.runId)!==receipt.pilotId)throw Error('Version 7 combat receipt owner is inconsistent.');}
      for (const raw of outcomes!) {const outcome=CombatOutcomeSchema.parse(raw);if(owners.get(outcome.runId)!==outcome.pilotId)throw Error('Version 7 outcome owner is inconsistent.');outcomeFingerprint(outcome);}
      await transaction.table('workspace').put(z.object({key:z.literal(WORKSPACE_KEY),schemaVersion:z.literal(8)}).parse({...root,schemaVersion:8}));
    });

    // v9 adds Review stores only. Validate v8 before publishing any schema metadata.
    this.version(9).stores({
      workspace: 'key', pilots: 'pilotId, lastUsedAt', operations: 'operationId, pilotId',
      runs: 'runId, &pilotId, contentVersion, rulesetVersion', runOperations: 'operationId, pilotId, runId',
      salvageOperations: 'operationId, pilotId, runId', buildOperations: 'operationId, pilotId, runId',
      attemptOperations: 'operationId, pilotId, runId, attemptId', combatOperations: 'operationId, pilotId, runId, attemptId',
      combatOutcomes: 'attemptId, pilotId, runId', pilotEconomies: 'pilotId',
      outcomeSettlements: 'attemptId, pilotId, runId', outcomeOperations: 'operationId, pilotId, runId, attemptId',
      cargoOperations: 'operationId, pilotId, runId', reviewOccurrences: 'occurrenceId, pilotId, entryId, sourceRunId',
      reviewLinks: 'attemptId, pilotId, runId, occurrenceId', reviewRewards: 'occurrenceId, pilotId, runId, operationId',
      reviewOperations: 'operationId, pilotId, runId, occurrenceId',
    }).upgrade(async transaction => {
      const names = ['workspace', 'pilots', 'runs', 'operations', 'runOperations', 'salvageOperations', 'buildOperations', 'attemptOperations', 'combatOperations', 'combatOutcomes', 'pilotEconomies', 'outcomeSettlements', 'outcomeOperations', 'cargoOperations'];
      const rows = await Promise.all(names.map(name => transaction.table(name).toArray()));
      if (!rows.some(values => values.length)) return;
      const [roots, rawPilots, rawRuns, operations, starts, salvages, builds, attempts, combats, rawOutcomes, rawEconomies, rawSettlements, rawOutcomeOperations, rawCargoOperations] = rows;
      if (roots!.length !== 1) throw Error('Version 8 Workspace root is missing or ambiguous.');
      const root = z.object({ key: z.literal(WORKSPACE_KEY), schemaVersion: z.literal(8) }).passthrough().parse(roots![0]);
      const pilots = rawPilots!.map(raw => PilotSchema.parse(raw)), runs = rawRuns!.map(raw => RunSchema.parse(raw));
      const pilotIds = new Set(pilots.map(pilot => pilot.pilotId)), owners = new Map(runs.map(run => [run.runId, run.pilotId]));
      if (runs.some(run => !pilotIds.has(run.pilotId))) throw Error('Version 8 Run owner is missing.');
      for (const raw of operations!) { const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), kind: z.literal('create-pilot') }).parse(raw); if (!pilotIds.has(receipt.pilotId)) throw Error('Version 8 Pilot receipt owner is missing.'); }
      for (const [entries, kind, fingerprint] of [[starts!, z.literal('start-run'), false], [salvages!, z.enum(['initialize', 'collect', 'finish']), true], [builds!, z.enum(['place', 'return', 'undo', 'redo']), true]] as const) {
        for (const raw of entries) {
          const receipt = z.object({ operationId: z.string().min(1), pilotId: z.string().min(1), runId: z.string().min(1), kind }).parse(raw);
          if (fingerprint) z.object({ fingerprint: z.string().min(1) }).parse(raw);
          if (owners.get(receipt.runId) !== receipt.pilotId) throw Error('Version 8 operation owner is inconsistent.');
        }
      }
      for (const raw of attempts!) { const receipt = AttemptReceiptSchema.parse(raw); if (!pilotIds.has(receipt.pilotId) || receipt.runId !== undefined && owners.get(receipt.runId) !== receipt.pilotId) throw Error('Version 8 Attempt receipt owner is inconsistent.'); }
      for (const raw of combats!) { const receipt = CombatReceiptSchema.parse(raw); if (owners.get(receipt.runId) !== receipt.pilotId) throw Error('Version 8 combat receipt owner is inconsistent.'); }
      const outcomes = rawOutcomes!.map(raw => CombatOutcomeSchema.parse(raw));
      for (const outcome of outcomes) { if (owners.get(outcome.runId) !== outcome.pilotId) throw Error('Version 8 outcome owner is inconsistent.'); outcomeFingerprint(outcome); }
      const economies = rawEconomies!.map(raw => PilotEconomySchema.parse(raw));
      const settlements = rawSettlements!.map(raw => OutcomeSettlementSchema.parse(raw));
      const outcomeOperations = rawOutcomeOperations!.map(raw => OutcomeOperationSchema.parse(raw));
      const cargoOperations = rawCargoOperations!.map(raw => CargoOperationSchema.parse(raw));
      for (const economy of economies) if (!pilotIds.has(economy.pilotId)) throw Error('Version 8 economy owner is missing.');
      for (const receipt of settlements) { const outcome = outcomes.find(value => value.attemptId === receipt.attemptId); if (!outcome) throw Error('Version 8 settlement source is missing.'); validateSettlement(receipt, outcome); }
      for (const pilot of pilots) {
        const economy = economies.find(value => value.pilotId === pilot.pilotId), receipts = settlements.filter(value => value.pilotId === pilot.pilotId);
        if (!economy && receipts.length) throw Error('Version 8 saved economy is missing; do not reset its balance.');
        assertEconomyLedger(economy ?? emptyEconomy(pilot.pilotId), receipts);
      }
      for (const receipt of outcomeOperations) if (!settlements.some(value => value.attemptId === receipt.attemptId && value.pilotId === receipt.pilotId && value.runId === receipt.runId)) throw Error('Version 8 outcome operation has no settlement.');
      for (const receipt of cargoOperations) if (owners.get(receipt.runId) !== receipt.pilotId) throw Error('Version 8 Cargo receipt owner is inconsistent.');
      for (const run of runs) {
        const cargo = cargoOperations.filter(receipt => receipt.runId === run.runId), saved = settlements.filter(receipt => receipt.runId === run.runId);
        if ((run.cargo?.revision ?? 0) !== cargo.length || new Set(cargo.map(receipt => receipt.cargoRevision)).size !== cargo.length || cargo.some(receipt => receipt.cargoRevision > cargo.length)) throw Error('Version 8 Cargo and receipts disagree.');
        const cleared = [...new Set(saved.filter(receipt => outcomes.find(outcome => outcome.attemptId === receipt.attemptId)?.terminal.kind === 'victory').map(receipt => receipt.mapId))].sort();
        if ((run.economyRevision ?? 0) !== saved.length || JSON.stringify([...(run.clearedMapIds ?? [])].sort()) !== JSON.stringify(cleared)) throw Error('Version 8 Run and settlements disagree.');
      }
      const next = { ...root, schemaVersion: 9 };
      WorkspaceMetaSchema.parse(next);
      await transaction.table('workspace').put(next);
    });
  }
}

export class DexieWorkspaceRepository implements WorkspaceRepository, RunRepository, AttemptRepository, CombatRepository, ResultsRepository, ReviewRepository {
  private readonly db = new CrossDefenseDatabase();

  async initialize(): Promise<void> {
    await this.db.open();
    await this.db.transaction(
      'rw',
      [this.db.workspace, this.db.pilots, this.db.operations, this.db.runs, this.db.runOperations, this.db.salvageOperations, this.db.buildOperations, this.db.attemptOperations, this.db.combatOperations, this.db.combatOutcomes, this.db.pilotEconomies, this.db.outcomeSettlements, this.db.outcomeOperations, this.db.cargoOperations, this.db.reviewOccurrences, this.db.reviewLinks, this.db.reviewRewards, this.db.reviewOperations],
      async () => {
        const workspace = await this.db.workspace.get(WORKSPACE_KEY);
        const pilots = await this.db.pilots.toArray();
        const runs = await this.db.runs.toArray();
        const operationCount = await this.db.operations.count();
        const runOperationCount = await this.db.runOperations.count();
        const salvageOperationCount = await this.db.salvageOperations.count();
        const buildOperationCount = await this.db.buildOperations.count();
        const attemptReceipts = await this.db.attemptOperations.toArray();
        const combatReceipts=await this.db.combatOperations.toArray();
        const combatOutcomes=await this.db.combatOutcomes.toArray();
        const economies=(await this.db.pilotEconomies.toArray()).map(raw=>PilotEconomySchema.parse(raw));
        const settlements=(await this.db.outcomeSettlements.toArray()).map(raw=>OutcomeSettlementSchema.parse(raw));
        const outcomeOperations=(await this.db.outcomeOperations.toArray()).map(raw=>OutcomeOperationSchema.parse(raw));
        const cargoOperations=(await this.db.cargoOperations.toArray()).map(raw=>CargoOperationSchema.parse(raw));
        const reviewOccurrences = (await this.db.reviewOccurrences.toArray()).map(raw => ReviewOccurrenceSchema.parse(raw));
        const reviewLinks = (await this.db.reviewLinks.toArray()).map(raw => ReviewLinkSchema.parse(raw));
        const reviewRewards = (await this.db.reviewRewards.toArray()).map(raw => ReviewRewardSchema.parse(raw));
        const reviewOperations = (await this.db.reviewOperations.toArray()).map(raw => ReviewOperationSchema.parse(raw));

        if (!workspace) {
          if (pilots.length > 0 || runs.length > 0 || operationCount > 0 || runOperationCount > 0 || salvageOperationCount > 0 || buildOperationCount > 0 || attemptReceipts.length > 0 || combatReceipts.length > 0 || combatOutcomes.length > 0 || economies.length > 0 || settlements.length > 0 || outcomeOperations.length > 0 || cargoOperations.length > 0 || reviewOccurrences.length > 0 || reviewLinks.length > 0 || reviewRewards.length > 0 || reviewOperations.length > 0) {
            throw new Error('Workspace metadata is missing while durable player data exists.');
          }
          await this.db.workspace.add({ key: WORKSPACE_KEY, schemaVersion: CURRENT_SCHEMA_VERSION });
        } else {
          WorkspaceMetaSchema.parse(workspace);
        }

        for (const pilot of pilots) {
          PilotSchema.parse(pilot);
        }
        for (const run of runs) { RunSchema.parse(run); if (!pilots.some(pilot => pilot.pilotId === run.pilotId)) throw Error('Saved Run has no Pilot owner.'); }
        for(const raw of combatReceipts){const receipt=CombatReceiptSchema.parse(raw);if(!pilots.some(p=>p.pilotId===receipt.pilotId)||!runs.some(r=>r.runId===receipt.runId&&r.pilotId===receipt.pilotId))throw Error('Combat receipt owner is inconsistent.');}
        for(const raw of combatOutcomes){const outcome=CombatOutcomeSchema.parse(raw);if(!pilots.some(p=>p.pilotId===outcome.pilotId)||!runs.some(r=>r.runId===outcome.runId&&r.pilotId===outcome.pilotId))throw Error('Combat outcome owner is inconsistent.');}

        for (const economy of economies) if (!pilots.some(pilot=>pilot.pilotId===economy.pilotId)) throw Error('Economy has no saved Pilot.');
        for (const receipt of settlements) {
          const raw= combatOutcomes.find(outcome=>outcome.attemptId===receipt.attemptId);
          if (!raw) throw Error('Settlement lost its original outcome.');
          validateSettlement(receipt, CombatOutcomeSchema.parse(raw));
        }
        validateReviewDurability(runs, reviewOccurrences, reviewLinks, reviewRewards, reviewOperations, combatOutcomes, settlements);
        for (const pilot of pilots) {
          const saved=economies.find(economy=>economy.pilotId===pilot.pilotId);
          const receipts=settlements.filter(receipt=>receipt.pilotId===pilot.pilotId);
          const reviews=reviewRewards.filter(receipt=>receipt.pilotId===pilot.pilotId);
          if (!saved && (receipts.length || reviews.length)) throw Error('Reward economy is missing; do not create a new balance.');
          assertEconomyLedger(saved??emptyEconomy(pilot.pilotId),receipts,reviews);
        }
        for (const receipt of outcomeOperations) if (!settlements.some(saved=>saved.attemptId===receipt.attemptId&&saved.runId===receipt.runId&&saved.pilotId===receipt.pilotId)) throw Error('Outcome operation has no matching saved settlement.');
        for (const receipt of cargoOperations) if (!runs.some(run=>run.runId===receipt.runId&&run.pilotId===receipt.pilotId)) throw Error('Cargo receipt owner is inconsistent.');
        for (const run of runs) {
          const receipts=cargoOperations.filter(receipt=>receipt.runId===run.runId);
          if ((run.cargo?.revision??0)!==receipts.length || new Set(receipts.map(receipt=>receipt.cargoRevision)).size!==receipts.length || receipts.some(receipt=>receipt.cargoRevision>receipts.length)) throw Error('Retained Cargo and Apply receipts disagree.');
          const saved=settlements.filter(receipt=>receipt.runId===run.runId);
          const mapIds=[...new Set(saved.filter(receipt=>combatOutcomes.find(outcome=>outcome.attemptId===receipt.attemptId)?.terminal.kind==='victory').map(receipt=>receipt.mapId))].sort();
          if ((run.economyRevision??0)!==saved.length+reviewRewards.filter(receipt=>receipt.runId===run.runId).length || JSON.stringify([...(run.clearedMapIds??[])].sort())!==JSON.stringify(mapIds)) throw Error('Run completion state disagrees with saved outcome and Review receipts.');
        }
        for (const raw of attemptReceipts) {
          const receipt=AttemptReceiptSchema.parse(raw);
          if (!pilots.some(p=>p.pilotId===receipt.pilotId) || receipt.runId!==undefined && !runs.some(r=>r.runId===receipt.runId&&r.pilotId===receipt.pilotId)) throw Error('Attempt receipt references inconsistent ownership.');
        }
      },
    );
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

  async getActiveRun(pilotId: string): Promise<ActiveRun | undefined> {
    const run = await this.db.runs.where('pilotId').equals(pilotId).first();
    return run ? RunSchema.parse(run) : undefined;
  }

  async getRunForOperation(operationId: string, pilotId: string): Promise<ActiveRun | undefined> {
    return this.db.transaction('r', this.db.runs, this.db.runOperations, () => this.readRunReceipt(operationId, pilotId));
  }

  private async readRunReceipt(operationId: string, pilotId: string): Promise<ActiveRun | undefined> {
    const receipt = await this.db.runOperations.get(operationId);
    if (!receipt) return undefined;
    if (receipt.kind !== 'start-run' || receipt.pilotId !== pilotId) throw new RunOperationConflictError();
    const raw = await this.db.runs.get(receipt.runId);
    if (!raw) throw new Error('Start Run operation references missing durable data.');
    const run = RunSchema.parse(raw);
    if (run.pilotId !== pilotId || run.runId !== receipt.runId) throw new Error('Start Run operation references inconsistent durable data.');
    return run;
  }

  async createRun(request: CreateRunRecord): Promise<ActiveRun> {
    return this.db.transaction('rw', this.db.pilots, this.db.runs, this.db.runOperations, async () => {
      const previous = await this.readRunReceipt(request.operationId, request.run.pilotId);
      if (previous) return previous;
      if (!(await this.db.pilots.get(request.run.pilotId))) throw new Error('Cannot start a Run for a missing Pilot.');
      const existing = await this.db.runs.where('pilotId').equals(request.run.pilotId).first();
      const run = RunSchema.parse(existing ?? request.run);
      if (!existing) await this.db.runs.add(run);
      // Bind even a duplicate Start using a new operation ID to this same Pilot/Run.
      await this.db.runOperations.add({ operationId: request.operationId, pilotId: run.pilotId, runId: run.runId, kind: 'start-run' });
      return run;
    });
  }

  async applySalvage(request: SalvageOperation): Promise<ActiveRun> {
    const input = structuredClone(request);
    const fingerprint = salvageOperationFingerprint(input);
    return this.db.transaction('rw', this.db.pilots, this.db.runs, this.db.salvageOperations, async () => {
      const raw = await this.db.runs.get(input.runId);
      if (!raw || raw.pilotId !== input.pilotId || !(await this.db.pilots.get(input.pilotId))) {
        throw new Error('Pre-Run operation references a missing or different Pilot/Run.');
      }
      const current = RunSchema.parse(raw);
      const receipt = await this.db.salvageOperations.get(input.operationId);
      if (receipt) {
        if (receipt.pilotId !== input.pilotId || receipt.runId !== input.runId || receipt.kind !== input.kind || receipt.fingerprint !== fingerprint) {
          throw new RunOperationConflictError();
        }
        return current;
      }
      const next = RunSchema.parse(applySalvageOperation(current, input));
      await this.db.runs.put(next);
      await this.db.salvageOperations.add({ operationId: input.operationId, pilotId: input.pilotId, runId: input.runId, kind: input.kind, fingerprint });
      return next;
    });
  }

  async getRunningAttempts(): Promise<ActiveRun[]> { return (await this.db.runs.toArray()).map(raw=>RunSchema.parse(raw)).filter(run=>run.phase==='attempt'); }

  private async readAttemptRun(pilotId:string,runId:string): Promise<ActiveRun> {
    const raw=await this.db.runs.get(runId);
    if (!raw||raw.pilotId!==pilotId||!(await this.db.pilots.get(pilotId))) throw new AttemptRejection('TARGET_MISMATCH','Attempt references a missing or different Pilot/Run.');
    return RunSchema.parse(raw);
  }

  async getStartedRun(request:StartAttemptRequest): Promise<ActiveRun|undefined> {
    const key=startRequestFingerprint(request);
    return this.db.transaction('r',this.db.pilots,this.db.runs,this.db.attemptOperations,async()=>{
      const raw=await this.db.attemptOperations.get(request.operationId); if(!raw) return undefined;
      const receipt=AttemptReceiptSchema.parse(raw);
      if(receipt.kind!=='start-attempt'||receipt.pilotId!==request.pilotId||receipt.runId!==request.runId||receipt.requestFingerprint!==key) throw new RunOperationConflictError();
      return this.readAttemptRun(request.pilotId,request.runId);
    });
  }

  async startAttempt(command:StartAttemptCommand,pack:ContentPackManifest): Promise<ActiveRun> {
    const input=structuredClone(command),definition=structuredClone(pack),fingerprint=attemptFingerprint(input);
    return this.db.transaction('rw',this.db.pilots,this.db.runs,this.db.attemptOperations,async()=>{
      const current=await this.readAttemptRun(input.pilotId,input.runId),raw=await this.db.attemptOperations.get(input.operationId);
      if(raw) { const prior=AttemptReceiptSchema.parse(raw); if(prior.kind!==input.kind||prior.pilotId!==input.pilotId||prior.runId!==input.runId||prior.fingerprint!==fingerprint) throw new RunOperationConflictError(); return current; }
      const next=RunSchema.parse(applyStartAttempt(current,definition,input));
      await this.db.runs.put(next);
      await this.db.attemptOperations.add({operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:input.kind,fingerprint,requestFingerprint:startRequestFingerprint(input)});
      return next;
    });
  }

  async endAttempt(command:EndAttemptCommand): Promise<ActiveRun> {
    const input=structuredClone(command),fingerprint=attemptFingerprint(input);
    return this.db.transaction('rw',[this.db.pilots,this.db.runs,this.db.attemptOperations,this.db.combatOutcomes],async()=>{
      const current=await this.readAttemptRun(input.pilotId,input.runId),raw=await this.db.attemptOperations.get(input.operationId);
      if(raw) { const prior=AttemptReceiptSchema.parse(raw); if(prior.kind!==input.kind||prior.pilotId!==input.pilotId||prior.runId!==input.runId||prior.fingerprint!==fingerprint) throw new RunOperationConflictError(); return current; }
      const next=RunSchema.parse(applyEndAttempt(current,input));
      await this.db.runs.put(next);
      if(next.attempt?.startup.capability==='combat')await this.db.combatOutcomes.add(CombatOutcomeSchema.parse(makeCombatOutcome(next,null)));
      await this.db.attemptOperations.add({operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:input.kind,fingerprint});
      return next;
    });
  }

  async commitCombat(command:CombatCommit):Promise<CombatCommitResult>{
    const input=structuredClone(command),fingerprint=combatCommitFingerprint(input);
    return this.db.transaction('rw',[this.db.pilots,this.db.runs,this.db.combatOperations,this.db.combatOutcomes],async()=>{
      const current=await this.readAttemptRun(input.pilotId,input.runId),raw=await this.db.combatOperations.get(input.operationId);
      if(raw){
        const prior=CombatReceiptSchema.parse(raw);
        if(prior.pilotId!==input.pilotId||prior.runId!==input.runId||prior.attemptId!==input.attemptId||prior.fingerprint!==fingerprint)throw new RunOperationConflictError();
        const outcome=await this.db.combatOutcomes.get(input.attemptId);
        return {run:current,outcome:outcome?CombatOutcomeSchema.parse(outcome):null};
      }
      const result=applyCombatCommit(current,input),run=RunSchema.parse(result.run);
      await this.db.runs.put(run);
      if(result.outcome)await this.db.combatOutcomes.add(CombatOutcomeSchema.parse(result.outcome));
      await this.db.combatOperations.add({operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:'combat-tick',fingerprint});
      return {run,outcome:result.outcome};
    });
  }
  async getCombatOutcome(pilotId:string,attemptId:string):Promise<CombatOutcome|undefined>{
    return this.db.transaction('r',[this.db.pilots,this.db.runs,this.db.combatOutcomes],async()=>{
      const raw=await this.db.combatOutcomes.get(attemptId);if(!raw)return undefined;
      const outcome=CombatOutcomeSchema.parse(raw);
      if(outcome.pilotId!==pilotId)throw new RunOperationConflictError();
      await this.readAttemptRun(pilotId,outcome.runId);return outcome;
    });
  }


  private resultTables() { return [this.db.pilots,this.db.runs,this.db.combatOutcomes,this.db.pilotEconomies,this.db.outcomeSettlements,this.db.outcomeOperations,
    this.db.reviewOccurrences,this.db.reviewLinks,this.db.reviewRewards,this.db.reviewOperations]; }
  private async readResultsState(pilotId:string):Promise<ResultsState> {
    if (!(await this.db.pilots.get(pilotId))) throw new ResultRejection('PILOT_REQUIRED','Choose an existing Pilot.');
    const raw=await this.db.runs.where('pilotId').equals(pilotId).first();
    if (!raw) throw new ResultRejection('RUN_REQUIRED','This Pilot has no saved Run.');
    const run=RunSchema.parse(raw);
    const outcomes=(await this.db.combatOutcomes.where('pilotId').equals(pilotId).toArray()).map(raw=>CombatOutcomeSchema.parse(raw));
    const receipts=(await this.db.outcomeSettlements.where('pilotId').equals(pilotId).toArray()).map(raw=>OutcomeSettlementSchema.parse(raw));
    const occurrences=(await this.db.reviewOccurrences.where('pilotId').equals(pilotId).toArray()).map(raw=>ReviewOccurrenceSchema.parse(raw));
    const links=(await this.db.reviewLinks.where('pilotId').equals(pilotId).toArray()).map(raw=>ReviewLinkSchema.parse(raw));
    const rewards=(await this.db.reviewRewards.where('pilotId').equals(pilotId).toArray()).map(raw=>ReviewRewardSchema.parse(raw));
    const operations=(await this.db.reviewOperations.where('pilotId').equals(pilotId).toArray()).map(raw=>ReviewOperationSchema.parse(raw));
    const saved=await this.db.pilotEconomies.get(pilotId);
    if (!saved && (receipts.length || rewards.length)) throw Error('Saved outcome or Review economy is missing.');
    const economy=saved?PilotEconomySchema.parse(saved):emptyEconomy(pilotId);
    for (const outcome of outcomes) if (outcome.runId!==run.runId || outcome.contentVersion!==run.contentVersion || outcome.rulesetVersion!==run.rulesetVersion) throw Error('Outcome references an unavailable Run or different content pins.');
    for (const receipt of receipts) {const outcome=outcomes.find(value=>value.attemptId===receipt.attemptId);if(!outcome)throw Error('Settlement source is missing.');validateSettlement(receipt,outcome);}
    validateReviewDurability([run],occurrences,links,rewards,operations,outcomes,receipts);
    assertEconomyLedger(economy,receipts,rewards);
    if ((run.economyRevision??0)!==receipts.length+rewards.length) throw Error('Run economy revision disagrees with saved outcome and Review receipts.');
    return structuredClone({run,economy,outcomes:outcomes.map(outcome=>({outcome,settlement:receipts.find(receipt=>receipt.attemptId===outcome.attemptId)??null}))});
  }
  async getResults(pilotId:string):Promise<ResultsState> {
    return this.db.transaction('r',this.resultTables(),()=>this.readResultsState(pilotId));
  }
  async settleOutcome(command:SettleOutcomeCommand):Promise<ResultsState> {
    const input=structuredClone(command),fingerprint=settlementFingerprint(input);
    return this.db.transaction('rw',this.resultTables(),async()=>{
      const state=await this.readResultsState(input.pilotId);
      if(state.run.runId!==input.runId)throw new ResultRejection('TARGET_MISMATCH','Settlement targets a different saved Run.');
      const prior=await this.db.outcomeOperations.get(input.operationId);
      if(prior){const receipt=OutcomeOperationSchema.parse(prior);if(receipt.fingerprint!==fingerprint||receipt.pilotId!==input.pilotId||receipt.runId!==input.runId||receipt.attemptId!==input.attemptId)throw new RunOperationConflictError();return state;}
      const row=state.outcomes.find(row=>row.outcome.attemptId===input.attemptId);
      if(!row)throw new ResultRejection('OUTCOME_REQUIRED','A saved outcome is required.');
      if(state.run.phase!=='build')throw new ResultRejection('BUILD_REQUIRED','Settle results from safe Build.');
      if(!row.settlement){
        const next=applyOutcomeSettlement(state.run,row.outcome,state.economy,input);
        await this.db.pilotEconomies.put(PilotEconomySchema.parse(next.economy));
        await this.db.runs.put(RunSchema.parse(next.run));
        await this.db.outcomeSettlements.add(OutcomeSettlementSchema.parse(next.settlement));
      }
      await this.db.outcomeOperations.add(OutcomeOperationSchema.parse({operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:input.kind,fingerprint}));
      return this.readResultsState(input.pilotId);
    });
  }
  private async readReviewState(pilotId: string, occurrenceId?: string): Promise<ReviewState> {
    const results = await this.readResultsState(pilotId);
    const occurrences = (await this.db.reviewOccurrences.where('pilotId').equals(pilotId).toArray()).map(raw => ReviewOccurrenceSchema.parse(raw));
    const links = (await this.db.reviewLinks.where('pilotId').equals(pilotId).toArray()).map(raw => ReviewLinkSchema.parse(raw));
    const rewards = (await this.db.reviewRewards.where('pilotId').equals(pilotId).toArray()).map(raw => ReviewRewardSchema.parse(raw));
    const selectedOccurrenceId = occurrenceId ?? null;
    if (selectedOccurrenceId !== null && !occurrences.some(value => value.occurrenceId === selectedOccurrenceId)) throw new ReviewRejection('OCCURRENCE_REQUIRED', 'Choose a Review Occurrence owned by this Pilot.');
    return structuredClone({ run: results.run, economy: results.economy, occurrences, links, rewards, selectedOccurrenceId });
  }
  async getReview(pilotId: string, occurrenceId?: string): Promise<ReviewState> {
    return this.db.transaction('r', this.resultTables(), () => this.readReviewState(pilotId, occurrenceId));
  }
  async ensureReview(command: EnsureReviewCommand, pack: ContentPackManifest): Promise<ReviewState> {
    const input = structuredClone(command), fingerprint = ensureReviewFingerprint(input);
    // Hashing occurs before opening the native transaction; no unrelated await can expire it.
    const validated = await validateContentPack(structuredClone(pack));
    if (!validated.pack) throw new ReviewRejection('CONTENT_REQUIRED', 'Review needs valid immutable pinned content. ' + validated.issues.map(issue => issue.message).join(' '));
    const definition = validated.pack;
    return this.db.transaction('rw', this.resultTables(), async () => {
      const state = await this.readReviewState(input.pilotId);
      if (state.run.runId !== input.runId) throw new ReviewRejection('TARGET_MISMATCH', 'Review targets a different saved Run.');
      const rawOutcome = await this.db.combatOutcomes.get(input.attemptId);
      if (!rawOutcome) throw new ReviewRejection('OUTCOME_REQUIRED', 'Review needs an existing saved result.');
      const outcome = CombatOutcomeSchema.parse(rawOutcome);
      if (outcome.pilotId !== input.pilotId || outcome.runId !== input.runId || definition.contentVersion !== state.run.contentVersion ||
          definition.compatibleRuleset !== state.run.rulesetVersion || definition.integrity.manifestSha256 !== outcome.contentDigest ||
          state.run.attempt?.startup.contentDigest !== outcome.contentDigest) {
        throw new ReviewRejection('TARGET_MISMATCH', 'Review must retain the saved outcome owner and exact content pins.');
      }
      const prior = await this.db.reviewOperations.get(input.operationId);
      if (prior) {
        const receipt = ReviewOperationSchema.parse(prior);
        if (receipt.kind !== input.kind || receipt.pilotId !== input.pilotId || receipt.runId !== input.runId || receipt.fingerprint !== fingerprint) throw new RunOperationConflictError();
        return this.readReviewState(input.pilotId, receipt.occurrenceId);
      }
      const rawSettlement = await this.db.outcomeSettlements.get(input.attemptId);
      const settlement = rawSettlement ? OutcomeSettlementSchema.parse(rawSettlement) : null;
      const next = ensureReviewOccurrence(state.run, outcome, settlement, definition, state.occurrences, state.links, input);
      if (!state.occurrences.some(value => value.occurrenceId === next.occurrence.occurrenceId)) await this.db.reviewOccurrences.add(ReviewOccurrenceSchema.parse(next.occurrence));
      if (!state.links.some(value => value.attemptId === next.link.attemptId)) await this.db.reviewLinks.add(ReviewLinkSchema.parse(next.link));
      await this.db.reviewOperations.add(ReviewOperationSchema.parse({ operationId: input.operationId, pilotId: input.pilotId, runId: input.runId,
        occurrenceId: next.occurrence.occurrenceId, kind: input.kind, fingerprint }));
      return this.readReviewState(input.pilotId, next.occurrence.occurrenceId);
    });
  }
  async applyReview(command: ReviewCommand): Promise<ReviewState> {
    const input = structuredClone(command), fingerprint = reviewCommandFingerprint(input);
    return this.db.transaction('rw', this.resultTables(), async () => {
      const state = await this.readReviewState(input.pilotId, input.occurrenceId);
      if (state.run.runId !== input.runId) throw new ReviewRejection('TARGET_MISMATCH', 'Review targets a different saved Run.');
      const prior = await this.db.reviewOperations.get(input.operationId);
      if (prior) {
        const receipt = ReviewOperationSchema.parse(prior);
        if (receipt.kind !== input.kind || receipt.pilotId !== input.pilotId || receipt.runId !== input.runId || receipt.occurrenceId !== input.occurrenceId || receipt.fingerprint !== fingerprint) throw new RunOperationConflictError();
        return state;
      }
      const occurrence = state.occurrences.find(value => value.occurrenceId === input.occurrenceId)!;
      const next = applyReviewCommand(state.run, state.economy, occurrence, input);
      await this.db.reviewOccurrences.put(ReviewOccurrenceSchema.parse(next.occurrence));
      if (next.reward) {
        await this.db.pilotEconomies.put(PilotEconomySchema.parse(next.economy));
        await this.db.runs.put(RunSchema.parse(next.run));
        await this.db.reviewRewards.add(ReviewRewardSchema.parse(next.reward));
      }
      await this.db.reviewOperations.add(ReviewOperationSchema.parse({ operationId: input.operationId, pilotId: input.pilotId, runId: input.runId,
        occurrenceId: input.occurrenceId, kind: input.kind, fingerprint }));
      return this.readReviewState(input.pilotId, input.occurrenceId);
    });
  }
  async resolveCargo(command:CargoResolutionCommand,content:BuildContent):Promise<ActiveRun> {
    const input=structuredClone(command),definition=structuredClone(content),fingerprint=cargoResolutionFingerprint(input);
    return this.db.transaction('rw',[this.db.pilots,this.db.runs,this.db.cargoOperations],async()=>{
      const current=await this.readAttemptRun(input.pilotId,input.runId),raw=await this.db.cargoOperations.get(input.operationId);
      if(raw){const prior=CargoOperationSchema.parse(raw);if(prior.fingerprint!==fingerprint||prior.pilotId!==input.pilotId||prior.runId!==input.runId)throw new RunOperationConflictError();return current;}
      const next=RunSchema.parse(applyCargoResolution(current,definition,input));
      await this.db.runs.put(next);
      await this.db.cargoOperations.add(CargoOperationSchema.parse({operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,kind:input.kind,fingerprint,
        keptIds:input.keepIds,discardedIds:input.discardIds,removedRetainedIds:input.removeRetainedIds,cargoRevision:next.cargo!.revision,recordedAt:input.recordedAt}));
      return next;
    });
  }

  async setDifficulty(command:DifficultyCommand): Promise<PilotProfile> {
    const input=structuredClone(command),fingerprint=attemptFingerprint(input);
    return this.db.transaction('rw',this.db.pilots,this.db.attemptOperations,async()=>{
      const rawPilot=await this.db.pilots.get(input.pilotId);
      if(!rawPilot) throw new AttemptRejection('PILOT_REQUIRED','Choose an existing Pilot.');
      const pilot=PilotSchema.parse(rawPilot),raw=await this.db.attemptOperations.get(input.operationId);
      if(raw) { const prior=AttemptReceiptSchema.parse(raw); if(prior.kind!==input.kind||prior.pilotId!==input.pilotId||prior.fingerprint!==fingerprint) throw new RunOperationConflictError(); return pilot; }
      const next=PilotSchema.parse({...pilot,lastDifficulty:input.difficulty});
      await this.db.pilots.put(next);
      await this.db.attemptOperations.add({operationId:input.operationId,pilotId:input.pilotId,kind:input.kind,fingerprint});
      return next;
    });
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
    return this.db.transaction('rw', this.db.pilots, this.db.runs, this.db.buildOperations, async () => {
      const raw = await this.db.runs.get(input.runId);
      if (!raw || raw.pilotId !== input.pilotId || !(await this.db.pilots.get(input.pilotId))) {
        throw new PlacementRejection('TARGET_MISMATCH', 'Placement targets a missing or different Pilot/Run.');
      }
      const current = RunSchema.parse(raw);
      const receipt = await this.db.buildOperations.get(input.operationId);
      if (receipt) {
        if (receipt.kind !== input.kind || receipt.pilotId !== input.pilotId || receipt.runId !== input.runId || receipt.fingerprint !== fingerprint) throw new RunOperationConflictError();
        return current;
      }
      const next = RunSchema.parse(applyBuildOperation(current, definition, input));
      await this.db.runs.put(next);
      await this.db.buildOperations.add({ operationId: input.operationId, pilotId: input.pilotId, runId: input.runId, kind: input.kind, fingerprint });
      return next;
    });
  }
}
