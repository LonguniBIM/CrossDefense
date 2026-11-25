import type { ActiveRun } from '../../domain/run/run';
import type { EndAttemptCommand } from '../../domain/attempt/attempt';
import type { CombatCommit,CombatCommitResult,CombatOutcome } from '../../domain/combat/collection';

/** Publishes one simulation outcome, its collection and its receipt atomically. */
export interface CombatRepository {
  getActiveRun(pilotId:string):Promise<ActiveRun|undefined>;
  commitCombat(command:CombatCommit):Promise<CombatCommitResult>;
  getCombatOutcome(pilotId:string,attemptId:string):Promise<CombatOutcome|undefined>;
  endAttempt(command:EndAttemptCommand):Promise<ActiveRun>;
}
export interface CombatReceipt { operationId:string; pilotId:string; runId:string; attemptId:string; kind:'combat-tick'; fingerprint:string; }
