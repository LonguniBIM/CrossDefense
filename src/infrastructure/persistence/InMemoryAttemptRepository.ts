import { InMemoryRunRepository } from './InMemoryRunRepository';
import type { CombatRepository,CombatReceipt } from '../../application/combat/CombatRepository';
import { applyCombatCommit,makeCombatOutcome,combatCommitFingerprint,type CombatCommit,type CombatOutcome,type CombatCommitResult } from '../../domain/combat/collection';
import type { AttemptRepository, AttemptReceipt } from '../../application/attempt/AttemptRepository';
import type { CreatePilotRecord } from '../../application/workspace/WorkspaceRepository';
import type { PilotProfile } from '../../domain/workspace/pilot';
import type { ActiveRun } from '../../domain/run/run';
import type { ContentPackManifest } from '../../domain/content/contentPack';
import { applyStartAttempt, applyEndAttempt, attemptFingerprint, startRequestFingerprint, AttemptRejection, type StartAttemptCommand, type StartAttemptRequest, type EndAttemptCommand, type DifficultyCommand } from '../../domain/attempt/attempt';
import { RunOperationConflictError } from '../../application/run/RunRepository';

/** Fast public-scenario adapter; real IndexedDB tests separately prove durable atomicity. */
export class InMemoryAttemptRepository extends InMemoryRunRepository implements AttemptRepository, CombatRepository {
  private readonly combatReceipts=new Map<string,CombatReceipt>();
  protected readonly combatOutcomes=new Map<string,CombatOutcome>();
  protected readonly pilots = new Map<string,PilotProfile>();
  private readonly receipts = new Map<string,AttemptReceipt>();
  async createPilot(request: CreatePilotRecord): Promise<PilotProfile> { this.pilots.set(request.pilot.pilotId,structuredClone(request.pilot)); return structuredClone(request.pilot); }
  async getPilot(pilotId:string): Promise<PilotProfile|undefined> { return structuredClone(this.pilots.get(pilotId)); }
  async getRunningAttempts(): Promise<ActiveRun[]> { return structuredClone([...this.runsByPilot.values()].filter(run=>run.phase==='attempt')); }
  async getStartedRun(request:StartAttemptRequest): Promise<ActiveRun|undefined> {
    const key=startRequestFingerprint(request), receipt=this.receipts.get(request.operationId);
    if (!receipt) return undefined;
    if (receipt.kind!=='start-attempt'||receipt.pilotId!==request.pilotId||receipt.runId!==request.runId||receipt.requestFingerprint!==key) throw new RunOperationConflictError();
    return structuredClone(this.requireRun(request.pilotId,request.runId));
  }
  async startAttempt(command:StartAttemptCommand,pack:ContentPackManifest): Promise<ActiveRun> {
    const input=structuredClone(command), fingerprint=attemptFingerprint(input), current=this.requireRun(input.pilotId,input.runId);
    const prior=this.receipts.get(input.operationId);
    if (prior) { if(prior.fingerprint!==fingerprint||prior.kind!==input.kind) throw new RunOperationConflictError(); return structuredClone(current); }
    const next=applyStartAttempt(current,structuredClone(pack),input);
    this.runsByPilot.set(input.pilotId,structuredClone(next));
    this.receipts.set(input.operationId,{operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:input.kind,fingerprint,requestFingerprint:startRequestFingerprint(input)});
    return structuredClone(next);
  }
  async endAttempt(command:EndAttemptCommand): Promise<ActiveRun> {
    const input=structuredClone(command), fingerprint=attemptFingerprint(input), current=this.requireRun(input.pilotId,input.runId);
    const prior=this.receipts.get(input.operationId);
    if (prior) { if(prior.fingerprint!==fingerprint||prior.kind!==input.kind) throw new RunOperationConflictError(); return structuredClone(current); }
    const next=applyEndAttempt(current,input);
    const outcome=next.attempt?.startup.capability==='combat'?makeCombatOutcome(next,null):null;
    if(outcome)this.combatOutcomes.set(outcome.attemptId,structuredClone(outcome));
    this.runsByPilot.set(input.pilotId,structuredClone(next));
    this.receipts.set(input.operationId,{operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:input.kind,fingerprint});
    return structuredClone(next);
  }
  async setDifficulty(command:DifficultyCommand): Promise<PilotProfile> {
    const input=structuredClone(command), fingerprint=attemptFingerprint(input), pilot=this.pilots.get(input.pilotId);
    if (!pilot) throw new AttemptRejection('PILOT_REQUIRED','Choose an existing Pilot.');
    const prior=this.receipts.get(input.operationId);
    if (prior) { if(prior.fingerprint!==fingerprint||prior.kind!==input.kind) throw new RunOperationConflictError(); return structuredClone(pilot); }
    const next={...pilot,lastDifficulty:input.difficulty}; this.pilots.set(input.pilotId,next);
    this.receipts.set(input.operationId,{operationId:input.operationId,pilotId:input.pilotId,kind:input.kind,fingerprint});
    return structuredClone(next);
  }
  async commitCombat(command:CombatCommit):Promise<CombatCommitResult>{
    const input=structuredClone(command),fingerprint=combatCommitFingerprint(input),run=this.requireRun(input.pilotId,input.runId);
    const prior=this.combatReceipts.get(input.operationId);
    if(prior){if(prior.fingerprint!==fingerprint||prior.pilotId!==input.pilotId||prior.runId!==input.runId||prior.attemptId!==input.attemptId)throw new RunOperationConflictError();return structuredClone({run,outcome:this.combatOutcomes.get(input.attemptId)??null});}
    const result=applyCombatCommit(run,input);
    if(result.outcome&&this.combatOutcomes.has(input.attemptId))throw new RunOperationConflictError();
    this.runsByPilot.set(input.pilotId,structuredClone(result.run));
    if(result.outcome)this.combatOutcomes.set(input.attemptId,structuredClone(result.outcome));
    this.combatReceipts.set(input.operationId,{operationId:input.operationId,pilotId:input.pilotId,runId:input.runId,attemptId:input.attemptId,kind:'combat-tick',fingerprint});
    return structuredClone(result);
  }
  async getCombatOutcome(pilotId:string,attemptId:string):Promise<CombatOutcome|undefined>{
    const outcome=this.combatOutcomes.get(attemptId);
    if(outcome&&outcome.pilotId!==pilotId)throw new RunOperationConflictError();
    return structuredClone(outcome);
  }
  protected requireRun(pilotId:string,runId:string): ActiveRun {
    const run=this.runsByPilot.get(pilotId);
    if (!this.pilots.has(pilotId)||!run||run.runId!==runId) throw new AttemptRejection('TARGET_MISMATCH','Attempt references a missing or different Pilot/Run.');
    return run;
  }
}
