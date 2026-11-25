import type { ReviewRepository, ReviewState } from './ReviewRepository';
import type { ContentPackApplication } from '../content/ContentPackApplication';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import { ResultRejection } from '../../domain/results/settlement';
import { RunOperationConflictError } from '../run/RunRepository';
import { ReviewRejection, normalizeReviewAnswer, reviewCommandFingerprint,
  type EnsureReviewCommand, type ReviewCommand, type ReviewHintKind } from '../../domain/review/occurrence';

type PendingReview = { kind: 'offer' | 'recovery'; command: EnsureReviewCommand; pack: ContentPackManifest }
  | { kind: 'evidence'; command: ReviewCommand };

/** Serializes Review intents; failed or lost acknowledgments retain the exact operation. */
export class ReviewApplication {
  private state: ReviewState | null = null;
  private pending: PendingReview | null = null;
  private busy = false;
  constructor(private readonly repository: ReviewRepository, private readonly content: ContentPackApplication,
    private readonly generateId: () => string, private readonly now: () => string = () => new Date().toISOString()) {}

  async open(pilotId: string, attemptId?: string): Promise<ReviewState> {
    this.requireIdle();
    this.busy = true;
    try {
      const state = await this.repository.getReview(pilotId);
      if (state.run.phase !== 'build') throw new ReviewRejection('BUILD_REQUIRED', 'Return to safe Build before Review.');
      this.state = structuredClone(state);
      this.state.selectedOccurrenceId = null;
      if (attemptId !== undefined) {
        const existing = state.links.find(link => link.attemptId === attemptId);
        if (existing) {
          if (existing.runId !== state.run.runId) throw new ReviewRejection('TARGET_MISMATCH', 'This result belongs to a different Run.');
          this.state.selectedOccurrenceId = existing.occurrenceId;
          return this.snapshot();
        }
        // Resolve only this Run's pins. A legacy Run never borrows the current default's Review capability.
        const pack = await this.content.getPack(state.run.contentVersion, state.run.rulesetVersion);
        if (!pack) throw new ReviewRejection('CONTENT_REQUIRED', 'Restore this Run\'s pinned content before creating its Review offer.');
        if (!pack.review) return this.snapshot();
        this.pending = { kind: 'offer', pack: structuredClone(pack),
          command: { kind: 'ensure-review', operationId: this.generateId(), pilotId, runId: state.run.runId,
            attemptId, occurrenceId: this.generateId(), recordedAt: this.now() } };
        return await this.persist();
      }
      this.state.selectedOccurrenceId = this.dueOccurrences()[0]?.occurrenceId ?? null;
      return this.snapshot();
    } finally { this.busy = false; }
  }

  /** Reconcile acknowledged results before publishing safe Build, independently of the Results screen. */
  async recover(pilotId: string): Promise<ReviewState> {
    this.requireIdle();
    this.busy = true;
    try { return await this.recoverSaved(pilotId); }
    finally { this.busy = false; }
  }
  dueCount(): number { return this.dueOccurrences().length; }

  private async recoverSaved(pilotId: string, retainedPack?: ContentPackManifest): Promise<ReviewState> {
    const state = await this.repository.getReview(pilotId);
    if (state.run.phase !== 'build') throw new ReviewRejection('BUILD_REQUIRED', 'Return to safe Build before Review.');
    this.state = structuredClone(state);
    this.state.selectedOccurrenceId = null;
    const results = await this.repository.getResults(pilotId);
    if (results.run.phase !== 'build') throw new ReviewRejection('BUILD_REQUIRED', 'Return to safe Build before Review.');
    if (results.run.runId !== state.run.runId || results.run.contentVersion !== state.run.contentVersion ||
        results.run.rulesetVersion !== state.run.rulesetVersion) {
      throw new ReviewRejection('TARGET_MISMATCH', 'Reopen the saved Run before recovering its Review offers.');
    }
    const unlinked = results.outcomes.filter(row => row.settlement !== null && row.outcome.runId === state.run.runId &&
      (row.outcome.terminal.kind === 'victory' || row.outcome.terminal.kind === 'failed') &&
      !state.links.some(link => link.attemptId === row.outcome.attemptId));
    if (unlinked.length) {
      // Frozen due evidence needs no content lookup; only an unlinked result needs the exact Run's pack.
      const pack = retainedPack?.contentVersion === state.run.contentVersion && retainedPack.compatibleRuleset === state.run.rulesetVersion
        ? retainedPack : await this.content.getPack(state.run.contentVersion, state.run.rulesetVersion);
      if (!pack) throw new ReviewRejection('CONTENT_REQUIRED', 'Restore this Run\'s pinned content before recovering its Review offers.');
      if (pack.review) for (const { outcome } of unlinked) {
        this.pending = { kind: 'recovery', pack: structuredClone(pack),
          command: { kind: 'ensure-review', operationId: this.generateId(), pilotId, runId: state.run.runId,
            attemptId: outcome.attemptId, occurrenceId: this.generateId(), recordedAt: this.now() } };
        await this.persist();
      }
    }
    this.state.selectedOccurrenceId = this.dueOccurrences()[0]?.occurrenceId ?? null;
    return this.snapshot();
  }

  private dueOccurrences() {
    const state = this.snapshot(), clock = Date.parse(this.now());
    if (!Number.isFinite(clock)) throw new ReviewRejection('INVALID_TIME', 'Review needs a valid WallClock time.');
    return state.occurrences.filter(value => value.completedAt === null && Date.parse(value.dueAt) <= clock)
      .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.occurrenceId.localeCompare(b.occurrenceId));
  }

  snapshot(): ReviewState {
    if (!this.state) throw new ReviewRejection('REVIEW_NOT_READY', 'Open saved Review evidence first.');
    return structuredClone(this.state);
  }
  hasPendingSave(): boolean { return this.pending !== null; }

  async submit(answer: string): Promise<ReviewState> {
    this.requireIdle();
    normalizeReviewAnswer(answer);
    return this.save({ ...this.target(), kind: 'submit-review', answer });
  }
  async hint(hint: ReviewHintKind): Promise<ReviewState> {
    this.requireIdle();
    return this.save({ ...this.target(), kind: 'hint-review', hint });
  }
  async retry(): Promise<ReviewState> {
    if (this.busy) throw new ReviewRejection('SAVE_PENDING', 'Wait for the current Review save.');
    if (!this.pending) throw new ReviewRejection('NO_PENDING_SAVE', 'No Review save is waiting for Retry.');
    const pending = this.pending;
    this.busy = true;
    try {
      await this.persist();
      return pending.kind === 'recovery'
        ? await this.recoverSaved(pending.command.pilotId, pending.pack) : this.snapshot();
    } finally { this.busy = false; }
  }

  private target() {
    const state = this.snapshot();
    const occurrence = state.occurrences.find(value => value.occurrenceId === state.selectedOccurrenceId);
    if (!occurrence) throw new ReviewRejection('OCCURRENCE_REQUIRED', 'Choose a due or linked Review Occurrence first.');
    if (occurrence.completedAt !== null) throw new ReviewRejection('OCCURRENCE_COMPLETE', 'This Review Occurrence is already complete.');
    return { operationId: this.generateId(), pilotId: state.run.pilotId, runId: state.run.runId,
      occurrenceId: occurrence.occurrenceId, expectedRevision: occurrence.revision, recordedAt: this.now() };
  }
  private async save(command: ReviewCommand): Promise<ReviewState> {
    reviewCommandFingerprint(command);
    this.pending = { kind: 'evidence', command: structuredClone(command) };
    this.busy = true;
    try { return await this.persist(); }
    finally { this.busy = false; }
  }
  private async persist(): Promise<ReviewState> {
    const pending = this.pending!;
    try {
      const saved = pending.kind !== 'evidence'
        ? await this.repository.ensureReview(structuredClone(pending.command), structuredClone(pending.pack))
        : await this.repository.applyReview(structuredClone(pending.command));
      this.state = structuredClone(saved);
      this.pending = null;
      return this.snapshot();
    } catch (error) {
      if (error instanceof ReviewRejection || error instanceof ResultRejection || error instanceof RunOperationConflictError) this.pending = null;
      throw error;
    }
  }
  private requireIdle(): void {
    if (this.busy || this.pending) throw new ReviewRejection('SAVE_PENDING', 'Retry the current Review save before another action.');
  }
}
