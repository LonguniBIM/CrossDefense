import type { ActiveRun } from '../../domain/run/run';
import type { PilotProfile } from '../../domain/workspace/pilot';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import type { StartAttemptRequest, StartAttemptCommand, EndAttemptCommand, DifficultyCommand } from '../../domain/attempt/attempt';

/** Atomic lifecycle writes, distinct from layout history and content caching. */
export interface AttemptRepository {
  getActiveRun(pilotId: string): Promise<ActiveRun | undefined>;
  getPilot(pilotId: string): Promise<PilotProfile | undefined>;
  getRunningAttempts(): Promise<ActiveRun[]>;
  getStartedRun(request: StartAttemptRequest): Promise<ActiveRun | undefined>;
  startAttempt(command: StartAttemptCommand, pack: ContentPackManifest): Promise<ActiveRun>;
  endAttempt(command: EndAttemptCommand): Promise<ActiveRun>;
  setDifficulty(command: DifficultyCommand): Promise<PilotProfile>;
}
export interface AttemptReceipt {
  operationId: string; pilotId: string; kind: 'start-attempt' | 'interrupt-attempt' | 'abandon-attempt' | 'set-difficulty';
  fingerprint: string; requestFingerprint?: string | undefined; runId?: string | undefined; attemptId?: string | undefined;
}
