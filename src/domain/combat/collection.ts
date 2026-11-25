import type { ActiveRun } from '../run/run';
import { assertAttemptState } from '../attempt/attempt';
import { assertBuildState } from '../build/shipBuild';
import type { Difficulty } from '../attempt/rules';
import type { CombatRewards } from './content';
import type { TerminalResult, FailureCause } from './battle';
import { combatPayloadEntries } from './payload';

export interface CombatCommit {
  kind:'combat-tick'; operationId:string; pilotId:string; runId:string; attemptId:string;
  expectedRevision:number; tick:number; payloadIds:string[]; terminal:TerminalResult|null; recordedAt:string;
}
export interface CombatOutcome {
  attemptId:string; pilotId:string; runId:string; mapId:string; difficulty:Difficulty;
  contentVersion:string; rulesetVersion:string; contentDigest:string; seed:string;
  terminal:{kind:'victory'|'failed'|'interrupted'|'abandoned';causes:FailureCause[]};
  tick:number|null; lastCommittedTick:number; collectedIds:string[]; rewards:CombatRewards;
  settlement:'pending-ticket09'|'not-eligible'; recordedAt:string;
}
export interface CombatCommitResult { run:ActiveRun; outcome:CombatOutcome|null; }
export class CombatRejection extends Error {constructor(readonly code:string,message:string){super(message);}}
const failures:FailureCause[]=['Hull destroyed','Top-out','Timeout'];
const identity=(value:unknown)=>typeof value==='string'&&value.trim().length>0;

export function combatCommitFingerprint(command:CombatCommit):string {
  const terminal=command.terminal;
  if(command.kind!=='combat-tick'||![command.operationId,command.pilotId,command.runId,command.attemptId].every(identity)||
      !Number.isSafeInteger(command.expectedRevision)||command.expectedRevision<0||!Number.isSafeInteger(command.tick)||command.tick<=0||
      !Array.isArray(command.payloadIds)||command.payloadIds.length>24||command.payloadIds.some(id=>!identity(id))||new Set(command.payloadIds).size!==command.payloadIds.length||
      !identity(command.recordedAt)||!Number.isFinite(Date.parse(command.recordedAt)))throw new CombatRejection('INVALID_COMMIT','Combat outcome needs exact identities, tick, revision and distinct payloads.');
  if(terminal&&(!['victory','failed'].includes(terminal.kind)||!Array.isArray(terminal.causes)||
      JSON.stringify(terminal.causes)!==JSON.stringify(failures.filter(c=>terminal.causes.includes(c)))||
      (terminal.kind==='failed')!==(terminal.causes.length>0)))throw new CombatRejection('INVALID_TERMINAL','Failure causes must retain their ordered precedence; victory has no failure cause.');
  if(!command.payloadIds.length&&!terminal)throw new CombatRejection('EMPTY_COMMIT','A combat transaction must contain collection or a terminal outcome.');
  return JSON.stringify([command.kind,command.pilotId,command.runId,command.attemptId,command.expectedRevision,command.tick,[...command.payloadIds].sort(),terminal?[terminal.kind,terminal.causes]:null,command.recordedAt]);
}

/** Independent durable handback for Ticket09; this never pays or consumes any reward. */
export function makeCombatOutcome(run:ActiveRun,tick:number|null,causes:FailureCause[]=[],recordedAt?:string):CombatOutcome {
  assertAttemptState(run);
  const envelope=run.attempt,definition=envelope?.startup.combat,progress=envelope?.combatProgress;
  if(!envelope||!definition||!progress||envelope.status==='running')throw Error('Only an ended combat Attempt has an outcome.');
  return {attemptId:envelope.attemptId,pilotId:run.pilotId,runId:run.runId,mapId:envelope.mapId,difficulty:envelope.difficulty,contentVersion:run.contentVersion,
    rulesetVersion:run.rulesetVersion,contentDigest:envelope.startup.contentDigest,seed:envelope.seed,
    terminal:{kind:envelope.status,causes:[...causes]},tick,lastCommittedTick:progress.lastCommittedTick,collectedIds:[...progress.collectedIds],
    rewards:structuredClone(definition.rewards),settlement:envelope.status==='victory'?'pending-ticket09':'not-eligible',recordedAt:recordedAt??envelope.endedAt!};
}

/** Pure all-or-nothing result. Storage publishes the returned Run/outcome/receipt together. */
export function applyCombatCommit(current:ActiveRun,command:CombatCommit):CombatCommitResult {
  combatCommitFingerprint(command);assertBuildState(current);assertAttemptState(current);
  const envelope=current.attempt,progress=envelope?.combatProgress,definition=envelope?.startup.combat;
  if(current.pilotId!==command.pilotId||current.runId!==command.runId||envelope?.attemptId!==command.attemptId)throw new CombatRejection('TARGET_MISMATCH','Combat transaction must target the same Pilot, Run and Attempt.');
  if(current.phase!=='attempt'||envelope.status!=='running'||!progress||!definition||envelope.startup.capability!=='combat')throw new CombatRejection('ATTEMPT_NOT_ACTIVE','Only the active combat Attempt can collect or finish.');
  const maxTicks=definition.encounters.reduce((sum,e)=>sum+e.limitTicks,0)+definition.gapTicks;
  if(command.expectedRevision!==progress.revision||command.tick<=progress.lastCommittedTick||command.tick>maxTicks)throw new CombatRejection('STALE_COMBAT','Combat tick/revision is stale or outside the authored Map.');
  const entries=combatPayloadEntries(envelope.attemptId,definition),ids=new Set(command.payloadIds);
  if(command.payloadIds.some(id=>progress.collectedIds.includes(id)||!entries.some(t=>t.id===id)))throw new CombatRejection('INVALID_PAYLOAD','A payload must belong to this Attempt and not already be collected.');
  const next=structuredClone(current),nextEnvelope=next.attempt!;
  const collected=[...progress.collectedIds,...command.payloadIds];
  nextEnvelope.combatProgress={revision:progress.revision+1,lastCommittedTick:command.tick,collectedIds:entries.filter(t=>collected.includes(t.id)).map(t=>t.id)};
  next.salvageBuffer=[...(next.salvageBuffer??[]),...entries.filter(t=>ids.has(t.id))];
  if(command.terminal){next.phase='build';nextEnvelope.status=command.terminal.kind;nextEnvelope.endedAt=command.recordedAt;}
  assertBuildState(next);assertAttemptState(next);
  return {run:next,outcome:command.terminal?makeCombatOutcome(next,command.tick,command.terminal.causes,command.recordedAt):null};
}
