import type { BuildContent, ContentPackManifest } from '../../domain/content/contentPack';
import type { ActiveRun } from '../../domain/run/run';
import { createSalvageState, sameSalvagePool } from '../../domain/preRun/salvage';
import { supportsBuildRules } from '../../domain/build/rules';
import { assertBuildState, projectBuild, previewPlacement, PlacementRejection, type PlacementOperation, type PlacementPreview, type BuildSummary } from '../../domain/build/shipBuild';
import { applyBuildOperation, copyLayout, historyScope, layoutKey, LayoutHistory, previewBuildOperation, type BuildOperation, type HistoryAvailability, type LayoutHistoryEntry, type ReturnOperation } from '../../domain/build/buildEditing';
import type { ContentPackApplication } from '../content/ContentPackApplication';
import { RunOperationConflictError, type RunRepository } from '../run/RunRepository';

export interface PlacementIntent { tileId: string; x: number; y: number; }
export interface PlaceTileRequest extends PlacementIntent { operationId: string; }
type BuildRequest = ({ kind: 'place' } & PlaceTileRequest) | { kind: 'return'; operationId: string; tileId: string } | { kind: 'undo' | 'redo'; operationId: string };
export type HistoryBoundary = 'attempt-start' | 'hull-change' | 'retained-tiles-change' | 'economy-change' | 'leave-build';
export interface BuildSnapshot { run: ActiveRun; content: BuildContent; summary: BuildSummary; history: HistoryAvailability; }
export type BuildOpenResult = { kind: 'ready'; snapshot: BuildSnapshot } | { kind: 'build-content-required'; run: ActiveRun; message: string };
interface Context { run: ActiveRun; pack: ContentPackManifest & { build: BuildContent }; }
interface PreparedEdit { request: BuildRequest; command: BuildOperation; entry: LayoutHistoryEntry; expectedRevision: number; committed: boolean; }

/** Serializes one uninterrupted editing context; only acknowledged edits change history or projections. */
export class BuildApplication {
  private context: Context | null = null;
  private pending: PreparedEdit | null = null;
  private readonly requests = new Map<string, PreparedEdit>();
  private readonly history = new LayoutHistory();
  private tail: Promise<void> = Promise.resolve();
  private opening = false;
  private attemptHold = false;
  private appUpdateHold: symbol | null = null;
  private queued = 0;

  constructor(private readonly repository: RunRepository, private readonly content: ContentPackApplication) {}

  async open(pilotId: string): Promise<BuildOpenResult> {
    if (this.attemptHold || this.appUpdateHold) throw new PlacementRejection('BUILD_TRANSITION', 'The Build is frozen for a saved transition.');
    if (this.pending) throw new PlacementRejection('SAVE_PENDING', 'Retry the pending edit before reopening Build.');
    if (this.opening || this.queued > 0) throw new PlacementRejection('BUILD_BUSY', 'Wait for the current Build operation before reopening.');
    this.opening = true;
    try { return await this.resolveOpen(pilotId); }
    finally { this.opening = false; }
  }

  private async resolveOpen(pilotId: string): Promise<BuildOpenResult> {
    this.context = null;
    this.requests.clear(); this.history.clear();
    const run = await this.repository.getActiveRun(pilotId);
    if (!run || run.phase !== 'build') throw new PlacementRejection('BUILD_REQUIRED', 'Complete Pre-Run Salvage before entering Build.');
    const pack = await this.content.getPack(run.contentVersion, run.rulesetVersion);
    if (!pack?.build || !supportsBuildRules(run.rulesetVersion)) {
      return { kind: 'build-content-required', run, message: 'This Run is preserved. Its pinned content or Ruleset does not provide compatible Build definitions.' };
    }
    if (pack.preRun.collectionQuota !== run.quota.total || pack.preRun.starterObjective.targetWord !== run.starterObjective.targetWord ||
        pack.preRun.starterObjective.requiresWeaponTile !== run.starterObjective.requiresWeaponTile ||
        !run.salvage || !sameSalvagePool(run.salvage, createSalvageState(run, pack.preRun))) {
      throw new Error('The saved Run does not match its pinned starter content.');
    }
    assertBuildState(run, pack.build);
    this.context = { run, pack: { ...pack, build: pack.build } };
    return { kind: 'ready', snapshot: this.snapshot() };
  }

  snapshot(): BuildSnapshot {
    const { run, pack } = this.requireContext();
    return structuredClone({ run, content: pack.build, summary: projectBuild(run, pack.build), history: this.history.availability() });
  }

  preview(intent: PlacementIntent): PlacementPreview {
    const { run, pack } = this.requireContext();
    return previewPlacement(run, pack.build, this.command('preview', intent));
  }

  previewReturn(tileId: string): PlacementPreview {
    const { run, pack } = this.requireContext();
    return previewBuildOperation(run, pack.build, this.returnCommand('preview-return', tileId));
  }

  returnToCargo(request: { operationId: string; tileId: string }): Promise<BuildSnapshot> { return this.enqueue({ ...request, kind: 'return' }); }
  place(request: PlaceTileRequest): Promise<BuildSnapshot> { return this.enqueue({ ...request, kind: 'place' }); }
  undo(request: { operationId: string }): Promise<BuildSnapshot> { return this.enqueue({ ...request, kind: 'undo' }); }
  redo(request: { operationId: string }): Promise<BuildSnapshot> { return this.enqueue({ ...request, kind: 'redo' }); }

  /** Lifecycle/economy owners call after a confirmed context boundary, never to cancel a pending save. */
  invalidateHistory(reason: HistoryBoundary): void {
    if (!['attempt-start', 'hull-change', 'retained-tiles-change', 'economy-change', 'leave-build'].includes(reason)) throw new Error('Unknown Build history boundary.');
    if (this.pending || this.opening || this.queued) throw new PlacementRejection('BUILD_BUSY', 'Resolve pending Build edits before changing context.');
    this.history.clear();
  }

  /** Synchronous admission prevents a launch from racing a same-turn layout edit. */
  holdForAttemptStart(): void {
    if (this.pending || this.opening || this.queued || this.attemptHold || this.appUpdateHold) throw new PlacementRejection('BUILD_BUSY','Finish the current Build save or App update before starting an Attempt.');
    this.attemptHold = true;
  }
  releaseAttemptStart(): void { this.attemptHold = false; }
  completeAttemptStart(): void {
    if (!this.attemptHold) throw new Error('Attempt startup has no admitted Build.');
    this.invalidateHistory('attempt-start');
    // This old editing object stays sealed. Recovery opens a new acknowledged context.
  }
  isAttemptHeld(): boolean { return this.attemptHold; }

  canHoldForAppUpdate(): boolean {
    return !!this.context && !this.pending && !this.opening && !this.queued && !this.attemptHold && !this.appUpdateHold;
  }

  /** Admit a safe reload synchronously, including edits queued in this same turn. */
  holdForAppUpdate(): () => void {
    if (!this.canHoldForAppUpdate()) throw new PlacementRejection('BUILD_BUSY', 'Finish or retry the current Build save before updating the App.');
    const token = Symbol('app-update');
    this.appUpdateHold = token;
    return () => { if (this.appUpdateHold === token) this.appUpdateHold = null; };
  }

  private enqueue(request: BuildRequest): Promise<BuildSnapshot> {
    if (this.attemptHold || this.appUpdateHold) return Promise.reject(new PlacementRejection('BUILD_TRANSITION', 'The Build is frozen for a saved transition.'));
    if (this.opening || !this.context) return Promise.reject(new PlacementRejection('BUILD_NOT_READY', 'Wait for a compatible Build to finish opening.'));
    const input = structuredClone(request);
    this.queued += 1;
    const result = this.tail.then(() => this.execute(input)).finally(() => { this.queued -= 1; });
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  retry(): Promise<BuildSnapshot> {
    if (!this.pending) return Promise.reject(new PlacementRejection('NO_PENDING_SAVE', 'There is no Build edit awaiting Retry.'));
    return this.enqueue(this.pending.request);
  }
  hasPendingSave(): boolean { return this.pending !== null; }
  pendingKind(): BuildOperation['kind'] | null { return this.pending?.command.kind ?? null; }

  private async execute(input: BuildRequest): Promise<BuildSnapshot> {
    if (typeof input.operationId !== 'string' || !input.operationId.trim()) throw new PlacementRejection('INVALID_OPERATION', 'A Build edit requires an operation ID.');
    const context = this.requireContext(), prior = this.requests.get(input.operationId);
    if (prior && requestKey(prior.request) !== requestKey(input)) throw new RunOperationConflictError();
    if (this.pending && this.pending.command.operationId !== input.operationId) throw new PlacementRejection('SAVE_PENDING', 'Retry the existing edit before another edit.');
    if (prior?.committed) return this.snapshot();
    const prepared = prior ?? this.prepare(input);
    this.requests.set(input.operationId, prepared); this.pending = prepared;
    try {
      const operation = prepared.command;
      const run = operation.kind === 'place' ? await this.repository.applyPlacement(operation, context.pack.build) : await this.repository.applyBuildEdit(operation, context.pack.build);
      assertBuildState(run, context.pack.build);
      const expected = operation.kind === 'undo' ? prepared.entry.before : prepared.entry.after;
      if (historyScope(run, context.pack.build) === prepared.entry.scope && layoutKey(copyLayout(run)) === layoutKey(expected) && run.shipBuild?.revision === prepared.expectedRevision) {
        this.history.acknowledge(operation.kind, prepared.entry);
      } else {
        // Receipt replay may observe a newer externally committed state. Never attach stale history to it.
        this.history.clear();
      }
      context.run = run; prepared.committed = true; this.pending = null;
      return this.snapshot();
    } catch (error) {
      if (error instanceof PlacementRejection || error instanceof RunOperationConflictError) {
        this.pending = null;
        if (error instanceof PlacementRejection && ['STALE_REVISION', 'HISTORY_INVALIDATED', 'TARGET_MISMATCH', 'INVALID_HISTORY_LAYOUT'].includes(error.code)) this.history.clear();
      }
      // Infrastructure failures retain the exact request, history cursor and last acknowledged snapshot.
      throw error;
    }
  }

  private prepare(request: BuildRequest): PreparedEdit {
    const { run, pack } = this.requireContext();
    let command: BuildOperation, entry: LayoutHistoryEntry;
    if (request.kind === 'place' || request.kind === 'return') {
      command = request.kind === 'place' ? this.command(request.operationId, request) : this.returnCommand(request.operationId, request.tileId);
      const candidate = applyBuildOperation(run, pack.build, command);
      entry = { scope: historyScope(run, pack.build), before: copyLayout(run), after: copyLayout(candidate) };
      return { request, command, entry, expectedRevision: candidate.shipBuild?.revision ?? 0, committed: false };
    }
    entry = this.history.peek(request.kind);
    command = { ...this.target(request.operationId), kind: request.kind, scope: entry.scope,
      from: request.kind === 'undo' ? entry.after : entry.before, to: request.kind === 'undo' ? entry.before : entry.after };
    const candidate = applyBuildOperation(run, pack.build, command);
    return { request, command, entry, expectedRevision: candidate.shipBuild!.revision, committed: false };
  }

  private target(operationId: string) {
    const { run } = this.requireContext();
    return { operationId, pilotId: run.pilotId, runId: run.runId, contentVersion: run.contentVersion,
      rulesetVersion: run.rulesetVersion, expectedRevision: run.shipBuild?.revision ?? 0 };
  }
  private returnCommand(operationId: string, tileId: string): ReturnOperation { return { ...this.target(operationId), kind: 'return', tileId }; }
  private command(operationId: string, intent: PlacementIntent): PlacementOperation { return { ...this.target(operationId), kind: 'place', tileId: intent.tileId, x: intent.x, y: intent.y }; }
  private requireContext(): Context {
    if (!this.context) throw new Error('Open a Run with compatible Build content first.');
    return this.context;
  }
}
function requestKey(input: BuildRequest): string {
  return JSON.stringify(input.kind === 'place' ? [input.kind, input.tileId, input.x, input.y] : input.kind === 'return' ? [input.kind, input.tileId] : [input.kind]);
}
